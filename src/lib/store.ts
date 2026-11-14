import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { NookState, ROWS, SCENES } from '@/components/pets/nookData';
import { useAuth } from '@/lib/auth';
import { LOCAL_KEYS, readForUser, writeForUser } from '@/lib/localCache';
import { useReleases } from '@/lib/releases';
import {
  buyStoreProduct, loadStorePrices, purchasesAvailable, restoreStorePurchases,
  onPurchaseUpdated, presentSubscriptionPaywall,
  type StorePrice, testPlusProductId, usingTestStore,
} from '@/lib/purchases';
import { afterLaunch } from '@/lib/launch';
import { supabase } from '@/lib/supabase';
import { syncSubscription } from '@/lib/subscriptionSync';

/** The Saint Central+ bundle unlocks every cosmetic. */
export const PLUS_PRODUCT = 'plus';

export const sceneProductId = (sceneId: string) => `scene:${sceneId}`;
export const itemProductId = (itemId: string) => `item:${itemId}`;

export type ProductKind = 'scene' | 'item' | 'bundle';

export type Product = {
  id: string;
  kind: ProductKind;
  name: string;
  /** Swatch color shown on the card. */
  sw: string;
  /** For decor: which spot it goes in ("Floor", "Wall"...). */
  group?: string;
  priceCents: number;
  /** null = one-time purchase. */
  interval: 'month' | 'year' | null;
  /** The App Store / Play product id, set in the database once the product exists. */
  storeProductId?: string | null;
  /** Localized price returned by the store, including its currency. */
  priceString?: string;
  availableForPurchase?: boolean;
};

// Fallback display data. Checkout always uses the price returned by the store.
const DEFAULT_PRICE = { scene: 200, item: 99, bundle: 599 } as const;

/** Every locked cosmetic in the nook, plus the bundle. */
export function defaultCatalog(): Product[] {
  const bundle: Product = {
    id: PLUS_PRODUCT,
    kind: 'bundle',
    name: 'Saint Central+',
    sw: '#F2C462',
    priceCents: DEFAULT_PRICE.bundle,
    interval: 'month',
  };
  const scenes: Product[] = SCENES.filter(s => s.locked).map(s => ({
    id: sceneProductId(s.id),
    kind: 'scene',
    name: s.name,
    sw: s.sw,
    priceCents: DEFAULT_PRICE.scene,
    interval: null,
  }));
  const items: Product[] = ROWS.flatMap(row =>
    row.items
      .filter(it => it.locked && !it.earned)
      .map(
        (it): Product => ({
          id: itemProductId(it.id),
          kind: 'item',
          name: it.name,
          sw: it.sw,
          group: row.label,
          priceCents: DEFAULT_PRICE.item,
          interval: null,
        }),
      ),
  );
  return [bundle, ...scenes, ...items];
}

export function formatPrice(p: Pick<Product, 'priceCents' | 'interval' | 'priceString'>): string {
  const base = p.priceString ?? `$${(p.priceCents / 100).toFixed(2)}`;
  return p.interval ? `${base}/${p.interval === 'month' ? 'mo' : 'yr'}` : base;
}

/** True when the user owns the product directly or through Saint Central+. */
export function owns(owned: ReadonlySet<string>, productId: string): boolean {
  return owned.has(PLUS_PRODUCT) || owned.has(productId);
}

/** Locked cosmetics currently in a nook that the user does not own. */
export function unownedInNook(nook: NookState, owned: ReadonlySet<string>): string[] {
  const out: string[] = [];
  const scene = SCENES.find(s => s.id === nook.scene);
  if (scene?.locked && !owns(owned, sceneProductId(scene.id))) out.push(sceneProductId(scene.id));
  for (const row of ROWS) {
    for (const it of row.items) {
      if (it.locked && nook.items.includes(it.id) && !owns(owned, itemProductId(it.id))) out.push(itemProductId(it.id));
    }
  }
  return out;
}

/** Puts free defaults back in place of anything the user does not own (used on load, so a preview can never stick). */
export function stripUnowned(nook: NookState, owned: ReadonlySet<string>, fallback: NookState): NookState {
  const scene = SCENES.find(s => s.id === nook.scene);
  const lockedUnowned = new Set(
    ROWS.flatMap(row => row.items)
      .filter(it => it.locked && !owns(owned, itemProductId(it.id)))
      .map(it => it.id),
  );
  const items = nook.items.filter(id => !lockedUnowned.has(id));
  const offsets = { ...nook.offsets };
  for (const id of Object.keys(offsets)) if (!items.includes(id)) delete offsets[id];
  return {
    ...nook,
    scene: scene?.locked && !owns(owned, sceneProductId(scene.id)) ? fallback.scene : nook.scene,
    items,
    offsets,
  };
}

type CatalogRow = {
  id: string;
  price_cents: number;
  billing_interval: 'month' | 'year' | null;
  active: boolean;
  store_product_id: string | null;
};

type CachedCosmetic = { productId: string; expiresAt: string | null };

function cachedOwnership(userId?: string): CachedCosmetic[] | undefined {
  if (!userId) return undefined;
  const details = readForUser<CachedCosmetic[]>(LOCAL_KEYS.ownedDetails, userId);
  if (details) return details.filter(row => !row.expiresAt || Date.parse(row.expiresAt) > Date.now());
  const legacy = readForUser<string[]>(LOCAL_KEYS.owned, userId);
  // Old subscription caches did not record expiry. Wait for verification before
  // deciding whether a previously paid nook should have its cosmetics removed.
  if (legacy?.includes(PLUS_PRODUCT)) return undefined;
  return legacy?.map(productId => ({ productId, expiresAt: null }));
}

/**
 * The user's owned cosmetics, reloaded whenever the screen gains focus.
 * Reads server-verified ownership from public.user_cosmetics.
 */
export function useOwned() {
  const { session } = useAuth();
  // Starts from the last list seen on this phone. A failed refresh keeps it, so being offline can't strip paid decor.
  const [cached] = useState(() => cachedOwnership(session?.user.id));
  const [owned, setOwned] = useState<ReadonlySet<string>>(() => new Set(cached?.map(row => row.productId)));
  const [expiresAt, setExpiresAt] = useState<string | null>(cached?.find(row => row.productId === PLUS_PRODUCT)?.expiresAt ?? null);
  const [loaded, setLoaded] = useState(!!cached);
  const [ownershipUserId, setOwnershipUserId] = useState(session?.user.id);
  const currentUser = useRef(session?.user.id);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const userId = session?.user.id;
  useEffect(() => {
    currentUser.current = userId;
    return () => { currentUser.current = undefined; };
  }, [userId]);
  useEffect(() => {
    if (!expiresAt || ownershipUserId !== userId) return;
    const expiry = Date.parse(expiresAt);
    const expire = () => {
      const delay = expiry - Date.now();
      if (delay > 0) expiryTimer.current = setTimeout(expire, Math.min(delay, 2147483647));
      else setOwned(current => new Set([...current].filter(id => id !== PLUS_PRODUCT)));
    };
    expiryTimer.current = setTimeout(expire, Math.max(0, Math.min(expiry - Date.now(), 2147483647)));
    return () => clearTimeout(expiryTimer.current);
  }, [expiresAt, ownershipUserId, userId]);

  const refresh = useCallback(async () => {
    if (!session) return;
    const userId = session.user.id;
    if (!session.user.is_anonymous && purchasesAvailable) {
      await syncSubscription(userId).catch(() => {});
    }
    try {
      const { data, error } = await supabase
        .from('user_cosmetics')
        .select('product_id, expires_at')
        .eq('user_id', userId);
      if (error) throw error;
      if (currentUser.current !== userId) return;
      const ids = (data ?? []).map(r => r.product_id as string);
      setOwnershipUserId(userId);
      setOwned(new Set(ids));
      setLoaded(true);
      // Preserve a valid subscription offline, with its verified expiration.
      writeForUser(LOCAL_KEYS.ownedDetails, userId, (data ?? []).map(row => ({
        productId: row.product_id, expiresAt: row.expires_at,
      })));
      writeForUser(LOCAL_KEYS.owned, userId, ids.filter(id => id !== PLUS_PRODUCT));
      const plus = data?.find(row => row.product_id === PLUS_PRODUCT);
      setExpiresAt(plus?.expires_at ?? null);
    } catch (e) {
      // A missing table (migration not applied yet) just means nothing is owned.
      console.warn('Could not load owned cosmetics', e);
    }
  }, [session]);

  useEffect(() => {
    const unsubscribe = onPurchaseUpdated(userId => {
      if (userId === currentUser.current) refresh();
    });
    return unsubscribe;
  }, [refresh]);

  useFocusEffect(
    useCallback(() => afterLaunch(() => {
      refresh();
    }), [refresh]),
  );

  return { owned: ownershipUserId === userId ? owned : new Set<string>(), loaded: ownershipUserId === userId && loaded, refresh };
}

export type BuyResult = { ok: true; active?: boolean } | { ok: false; message: string };

const ERROR_MESSAGES: Record<string, string> = {
  account_required: 'Create an account first so your purchases are never lost.',
  not_available: 'Purchases are not available yet. Please check back soon.',
  not_for_sale: 'This item is not for sale yet. Please check back soon.',
};

/** The cosmetic catalog, localized checkout prices, purchases, and restore flow. */
export function useStore() {
  const { owned, loaded, refresh } = useOwned();
  const { isGuest, session } = useAuth();
  const [rows, setRows] = useState<CatalogRow[] | null>(null);
  const [prices, setPrices] = useState<StorePrice[]>([]);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [priceAttempt, setPriceAttempt] = useState(0);
  const retryPrices = useCallback(() => setPriceAttempt(attempt => attempt + 1), []);
  const [buying, setBuying] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const operationInProgress = useRef(false);
  const refreshTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { isAvailable } = useReleases();
  const userId = session?.user.id;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (__DEV__) console.info('[Checkout] Loading prices', { attempt: priceAttempt, configured: purchasesAvailable, testStore: usingTestStore });
      setPricesLoading(true);
      setPriceError(null);
      setPrices([]);
      (async () => {
        let catalogRows: CatalogRow[] = [];
        try {
          const { data, error } = await supabase
            .from('cosmetic_products')
            .select('id, price_cents, billing_interval, active, store_product_id');
          if (error) throw error;
          catalogRows = (data ?? []) as CatalogRow[];
          if (!cancelled) setRows(catalogRows);
        } catch (e) {
          console.warn('Could not load the store catalog', e);
        }
        try {
          if (cancelled || !userId || isGuest) return;
          if (!purchasesAvailable) {
            setPriceError('Checkout did not load. Reload the app and try again.');
            return;
          }
          const byId = new Map(catalogRows.map(row => [row.id, row]));
          const requests = defaultCatalog().flatMap(product => {
            const row = byId.get(product.id);
            const storeProductId = usingTestStore && product.id === PLUS_PRODUCT
              ? testPlusProductId || row?.store_product_id : row?.store_product_id;
            if (row?.active === false || !storeProductId) return [];
            return [{ storeProductId, subscription: (row ? row.billing_interval : product.interval) !== null }];
          });
          const storePrices = await loadStorePrices(userId, requests);
          if (!cancelled) {
            setPrices(storePrices);
            const plusStoreId = (usingTestStore ? testPlusProductId : undefined) || byId.get(PLUS_PRODUCT)?.store_product_id;
            if (!storePrices.some(price => price.storeProductId === plusStoreId)) {
              setPriceError('Subscription checkout could not load. Please try again.');
            }
          }
        } catch (e) {
          console.warn('Could not load checkout prices', e);
          if (!cancelled) setPriceError('Could not reach subscription checkout. Check your connection and try again.');
        } finally {
          if (!cancelled) setPricesLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [userId, isGuest, priceAttempt]),
  );

  const catalog = useMemo(() => {
    // Scheduled scenes and decor stay out of the store until their release date.
    const base = defaultCatalog().filter(p => isAvailable(p.id));
    const byId = new Map((rows ?? []).map(r => [r.id, r]));
    const priceById = new Map(prices.map(price => [price.storeProductId, price]));
    return base
      .filter(p => byId.get(p.id)?.active !== false)
      .map(p => {
        const row = byId.get(p.id);
        const storeProductId = usingTestStore && p.id === PLUS_PRODUCT
          ? testPlusProductId || row?.store_product_id : row?.store_product_id;
        const price = storeProductId ? priceById.get(storeProductId) : undefined;
        return {
          ...p,
          priceCents: price?.priceCents ?? row?.price_cents ?? p.priceCents,
          priceString: price?.priceString,
          interval: price?.subscriptionPeriod === 'P1Y' ? 'year'
            : price?.subscriptionPeriod === 'P1M' ? 'month'
              : row ? row.billing_interval : p.interval,
          storeProductId,
          availableForPurchase: Boolean(price),
        };
      });
  }, [rows, prices, isAvailable]);

  useEffect(() => () => {
    refreshTimers.current.forEach(clearTimeout);
    refreshTimers.current = [];
  }, [userId]);

  /** Reloads what the user owns now, and again a few times, since the webhook records a purchase a moment later. */
  const refreshSoon = useCallback(() => {
    refreshTimers.current.forEach(clearTimeout);
    refresh();
    refreshTimers.current = [2000, 5000, 10000].map(ms => setTimeout(refresh, ms));
  }, [refresh]);

  /** Buys a product through the app store (RevenueCat), then reloads what the user owns. */
  const buy = useCallback(
    async (productId: string): Promise<BuyResult> => {
      if (isGuest || !session) return { ok: false, message: ERROR_MESSAGES.account_required };
      if (operationInProgress.current) return { ok: false, message: '' };
      if (!purchasesAvailable) return { ok: false, message: ERROR_MESSAGES.not_available };
      const product = catalog.find(p => p.id === productId);
      if (!product?.storeProductId || !product.availableForPurchase) return { ok: false, message: ERROR_MESSAGES.not_for_sale };
      operationInProgress.current = true;
      setBuying(productId);
      try {
        const result = productId === PLUS_PRODUCT
          ? await presentSubscriptionPaywall(session.user.id)
          : await buyStoreProduct(session.user.id, product.storeProductId, product.interval !== null);
        if (result.ok) {
          await refresh();
          refreshSoon();
          return result;
        }
        // Backing out of the purchase sheet is not an error worth showing.
        return { ok: false, message: result.cancelled ? '' : result.message };
      } finally {
        operationInProgress.current = false;
        setBuying(null);
      }
    },
    [catalog, isGuest, session, refresh, refreshSoon],
  );

  /** "Restore purchases": ask the app store to replay past purchases, then reload what the user owns. */
  const restore = useCallback(async (): Promise<BuyResult> => {
    if (!session || isGuest) return { ok: false, message: ERROR_MESSAGES.account_required };
    if (!purchasesAvailable) return { ok: false, message: ERROR_MESSAGES.not_available };
    if (operationInProgress.current) return { ok: false, message: '' };
    operationInProgress.current = true;
    setRestoring(true);
    try {
      const result = await restoreStorePurchases(session.user.id);
      if (result.ok) { await refresh(); refreshSoon(); }
      return result;
    } finally {
      operationInProgress.current = false;
      setRestoring(false);
    }
  }, [session, isGuest, refresh, refreshSoon]);

  return { catalog, owned, loaded, buying, restoring, pricesLoading, priceError, retryPrices, buy, restore, refresh };
}
