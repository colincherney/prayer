import { Platform } from 'react-native';
import Purchases, { PURCHASE_TYPE } from 'react-native-purchases';

// RevenueCat wrapper: the only file that talks to the purchase SDK.
//
// To switch purchases on (this is the part left to fill in):
//   1. Create the products in App Store Connect / Google Play Console and add them to RevenueCat.
//   2. Put each product id into public.cosmetic_products.store_product_id.
//   3. Put RevenueCat's public SDK keys in .env:
//        EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...
//        EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...
//   4. Set up the webhook (see supabase/functions/revenuecat-webhook/index.ts) so purchases are recorded.
// Purchases need a development or production build; Expo Go can only run RevenueCat's preview mode.
// Until the keys exist, `purchasesAvailable` is false and the store says purchases are not available yet.

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  default: undefined,
});

export const purchasesAvailable = Boolean(API_KEY);

let configured = false;
let signedInAs: string | null = null;

/** Starts RevenueCat (once) and signs it in as the Supabase user, so purchases belong to the account. */
async function ensureUser(userId: string): Promise<void> {
  if (!API_KEY) throw new Error('purchases_not_configured');
  if (!configured) {
    Purchases.configure({ apiKey: API_KEY, appUserID: userId });
    configured = true;
    signedInAs = userId;
    return;
  }
  if (signedInAs !== userId) {
    await Purchases.logIn(userId);
    signedInAs = userId;
  }
}

/** Call when the user signs out, so the next person does not inherit this one's purchases. */
export async function signOutOfPurchases(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch {
    // Already anonymous; nothing to do.
  }
  signedInAs = null;
}

export type PurchaseResult = { ok: true } | { ok: false; cancelled?: boolean; message: string };

/**
 * Buys one store product. `subscription` picks the right product type (the Saint Central+ bundle is a
 * subscription; everything else is a one-time purchase). RevenueCat tells our webhook, which records the purchase
 * in the database; the caller should then reload what the user owns.
 */
export async function buyStoreProduct(
  userId: string,
  storeProductId: string,
  subscription: boolean,
): Promise<PurchaseResult> {
  try {
    await ensureUser(userId);
    const [product] = await Purchases.getProducts(
      [storeProductId],
      subscription ? PURCHASE_TYPE.SUBS : PURCHASE_TYPE.INAPP,
    );
    if (!product) return { ok: false, message: 'This item is not for sale yet. Please check back soon.' };
    await Purchases.purchaseStoreProduct(product);
    return { ok: true };
  } catch (e) {
    const err = e as { userCancelled?: boolean; message?: string };
    if (err.userCancelled) return { ok: false, cancelled: true, message: '' };
    if (err.message === 'purchases_not_configured') {
      return { ok: false, message: 'Purchases are not available yet. Please check back soon.' };
    }
    console.warn('Purchase failed', e);
    return { ok: false, message: 'The purchase could not be completed. Please try again.' };
  }
}

/** Asks the app store to replay this person's past purchases (for a new phone or a reinstall). */
export async function restoreStorePurchases(userId: string): Promise<void> {
  await ensureUser(userId);
  await Purchases.restorePurchases();
}
