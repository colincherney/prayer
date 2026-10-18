import * as Linking from 'expo-linking';
import { useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useMemo, useState } from 'react';

import { NookState, ROWS, SCENES } from '@/components/pets/nookData';
import { useAuth } from '@/lib/auth';
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
      .filter(it => it.locked)
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

type CatalogRow = { id: string; price_cents: number; billing_interval: 'month' | 'year' | null; active: boolean };

/**
 * The user's owned cosmetics, reloaded whenever the screen gains focus.
 * Reads public.user_cosmetics, which only the Stripe webhook can write.
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
  stripe_not_configured: 'Purchases are not available yet. Please check back soon.',
  product_not_linked_to_stripe: 'This item is not for sale yet. Please check back soon.',
  already_owned: 'You already own this.',
  product_not_found: 'This item is no longer available.',
};

/** The catalog (prices from the database when available), purchases, and the buy flow. */
export function useStore() {
  const { owned, loaded, refresh } = useOwned();
  const { isGuest } = useAuth();
  const [rows, setRows] = useState<CatalogRow[] | null>(null);
  const [buying, setBuying] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const { data, error } = await supabase
            .from('cosmetic_products')
            .select('id, price_cents, billing_interval, active');
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
        return row ? { ...p, priceCents: row.price_cents, interval: row.billing_interval } : p;
      });
  }, [rows]);

  /** Opens Stripe Checkout (via the create-checkout-session edge function), then reloads what the user owns. */
  const buy = useCallback(
    async (productId: string): Promise<BuyResult> => {
      // The server refuses anonymous sessions too; this just saves the round trip.
      if (isGuest) return { ok: false, message: ERROR_MESSAGES.account_required };
      setBuying(productId);
      try {
        const returnUrl = Linking.createURL('store');
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: { productId, returnUrl },
        });
        let code: string | undefined = data?.error;
        if (error && !code) {
          // Non-2xx responses carry the JSON body on error.context.
          const ctx = (error as { context?: Response }).context;
          if (ctx && typeof ctx.json === 'function') {
            try {
              code = (await ctx.json())?.error;
            } catch {}
          }
        }
        if (code || !data?.url) {
          return { ok: false, message: ERROR_MESSAGES[code ?? ''] ?? 'Could not start checkout. Please try again.' };
        }
        await WebBrowser.openAuthSessionAsync(data.url as string, returnUrl);
        // The webhook grants the purchase; give it a moment, then look again.
        await refresh();
        setTimeout(refresh, 3000);
        return { ok: true };
      } catch (e) {
        console.warn('Checkout failed', e);
        return { ok: false, message: 'Could not start checkout. Please try again.' };
      } finally {
        setBuying(null);
      }
    },
    [refresh, isGuest],
  );

  return { catalog, owned, loaded, buying, buy, refresh };
}
