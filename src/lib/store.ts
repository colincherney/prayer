import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { NookState, ROWS, SCENES } from '@/components/pets/nookData';
import { useAuth } from '@/lib/auth';
import { buyStoreProduct, purchasesAvailable, restoreStorePurchases } from '@/lib/purchases';
import { supabase } from '@/lib/supabase';

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
};

// Placeholder prices, used until the catalog loads from public.cosmetic_products (which is the source of truth).
const DEFAULT_PRICE = { scene: 199, item: 99, bundle: 599 } as const;

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

export function formatPrice(p: Pick<Product, 'priceCents' | 'interval'>): string {
  const base = `$${(p.priceCents / 100).toFixed(2)}`;
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

/**
 * The user's owned cosmetics, reloaded whenever the screen gains focus.
 * Reads public.user_cosmetics, which only the RevenueCat webhook can write.
 */
export function useOwned() {
  const { session } = useAuth();
  const [owned, setOwned] = useState<ReadonlySet<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from('user_cosmetics')
        .select('product_id')
        .eq('user_id', session.user.id);
      if (error) throw error;
      setOwned(new Set((data ?? []).map(r => r.product_id as string)));
    } catch (e) {
      // A missing table (migration not applied yet) just means nothing is owned.
      console.warn('Could not load owned cosmetics', e);
    } finally {
      setLoaded(true);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { owned, loaded, refresh };
}

export type BuyResult = { ok: true } | { ok: false; message: string };

const ERROR_MESSAGES: Record<string, string> = {
  account_required: 'Create an account first so your purchases are never lost.',
  not_available: 'Purchases are not available yet. Please check back soon.',
  not_for_sale: 'This item is not for sale yet. Please check back soon.',
};

/** The catalog (prices from the database when available), purchases, and the buy flow. */
export function useStore() {
  const { owned, loaded, refresh } = useOwned();
  const { isGuest, session } = useAuth();
  const [rows, setRows] = useState<CatalogRow[] | null>(null);
  const [buying, setBuying] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const { data, error } = await supabase
            .from('cosmetic_products')
            .select('id, price_cents, billing_interval, active, store_product_id');
          if (error) throw error;
          if (!cancelled) setRows((data ?? []) as CatalogRow[]);
        } catch (e) {
          console.warn('Could not load the store catalog', e);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const catalog = useMemo(() => {
    const base = defaultCatalog();
    if (!rows) return base;
    const byId = new Map(rows.map(r => [r.id, r]));
    return base
      .filter(p => byId.get(p.id)?.active !== false)
      .map(p => {
        const row = byId.get(p.id);
        return row
          ? { ...p, priceCents: row.price_cents, interval: row.billing_interval, storeProductId: row.store_product_id }
          : p;
      });
  }, [rows]);

  /** Reloads what the user owns now, and again a few times, since the webhook records a purchase a moment later. */
  const refreshSoon = useCallback(() => {
    refresh();
    [2000, 5000, 10000].forEach(ms => setTimeout(refresh, ms));
  }, [refresh]);

  /** Buys a product through the app store (RevenueCat), then reloads what the user owns. */
  const buy = useCallback(
    async (productId: string): Promise<BuyResult> => {
      if (isGuest || !session) return { ok: false, message: ERROR_MESSAGES.account_required };
      const product = catalog.find(p => p.id === productId);
      if (!product?.storeProductId) return { ok: false, message: ERROR_MESSAGES.not_for_sale };
      if (!purchasesAvailable) return { ok: false, message: ERROR_MESSAGES.not_available };
      setBuying(productId);
      try {
        const result = await buyStoreProduct(session.user.id, product.storeProductId, product.interval !== null);
        if (result.ok) {
          refreshSoon();
          return { ok: true };
        }
        // Backing out of the purchase sheet is not an error worth showing.
        return { ok: false, message: result.cancelled ? '' : result.message };
      } finally {
        setBuying(null);
      }
    },
    [catalog, isGuest, session, refreshSoon],
  );

  /** "Restore purchases": ask the app store to replay past purchases, then reload what the user owns. */
  const restore = useCallback(async () => {
    if (session && !isGuest && purchasesAvailable) {
      try {
        await restoreStorePurchases(session.user.id);
      } catch (e) {
        console.warn('Restore failed', e);
      }
    }
    refreshSoon();
  }, [session, isGuest, refreshSoon]);

  return { catalog, owned, loaded, buying, buy, restore, refresh };
}
