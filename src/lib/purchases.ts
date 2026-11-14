import { NativeModules, Platform } from 'react-native';
import Purchases, {
  PURCHASE_TYPE,
  PURCHASES_ERROR_CODE,
  LOG_LEVEL,
  type PurchasesPackage,
  type PurchasesStoreProduct,
  type CustomerInfo,
} from 'react-native-purchases';

// Test Store works with this SDK in Expo Go as well as native debug builds.
// Release builds only ever use their platform's public SDK key.
const testKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY?.trim();
const platformKey = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.trim(),
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY?.trim(),
  default: undefined,
});
const platformPrefix = Platform.OS === 'ios' ? 'appl_' : 'goog_';
const nativeKey = platformKey?.startsWith(platformPrefix) ? platformKey : undefined;
// A native development build must exercise Apple/Google sandbox billing even
// when the local environment also contains the Expo Go Test Store key.
const API_KEY = NativeModules.RNPurchases && nativeKey
  ? nativeKey
  : __DEV__ && testKey?.startsWith('test_') ? testKey
    : NativeModules.RNPurchases ? nativeKey : undefined;

export const usingTestStore = Boolean(API_KEY?.startsWith('test_'));
export const purchasesAvailable = Boolean(API_KEY);
export const testPlusProductId = usingTestStore
  ? process.env.EXPO_PUBLIC_REVENUECAT_TEST_PLUS_PRODUCT_ID?.trim()
  : undefined;
export const subscriptionOfferingId = process.env.EXPO_PUBLIC_REVENUECAT_SUBSCRIPTION_OFFERING_ID?.trim() || 'monthly_599';
export const subscriptionEntitlementId = process.env.EXPO_PUBLIC_REVENUECAT_SUBSCRIPTION_ENTITLEMENT_ID?.trim() || 'saint_central_app_pro';

const purchaseListeners = new Set<(userId: string) => void>();
export function onPurchaseUpdated(listener: (userId: string) => void): () => void {
  purchaseListeners.add(listener);
  return () => { purchaseListeners.delete(listener); };
}
function notifyPurchaseUpdate() {
  if (signedInAs) purchaseListeners.forEach(listener => listener(signedInAs!));
}
function hasSubscription(info: CustomerInfo): boolean {
  const entitlement = info.entitlements.active[subscriptionEntitlementId];
  // A previous simulated subscription must not block the user's Apple checkout.
  const store = Platform.OS === 'ios' ? 'APP_STORE' : 'PLAY_STORE';
  return Boolean(entitlement && (usingTestStore || entitlement.store === store));
}

let configured = false;
let signedInAs: string | null = null;
let sdkQueue: Promise<unknown> = Promise.resolve();
type CheckoutProduct = { product: PurchasesStoreProduct; package?: PurchasesPackage };
const checkoutProducts = new Map<string, CheckoutProduct>();

// Keep identity changes and checkout in order so an account switch cannot move
// another person's pending purchase to the next signed-in user.
function serial<T>(operation: () => Promise<T>): Promise<T> {
  const result = sdkQueue.then(operation);
  sdkQueue = result.catch(() => {});
  return result;
}

async function ensureUser(userId: string): Promise<void> {
  if (!API_KEY) throw new Error('purchases_not_configured');
  if (!configured) {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: API_KEY, appUserID: userId });
    configured = true;
    signedInAs = userId;
    Purchases.addCustomerInfoUpdateListener(notifyPurchaseUpdate);
  } else if (signedInAs !== userId) {
    if (!(await Purchases.isAnonymous())) await Purchases.logOut();
    await Purchases.logIn(userId);
    signedInAs = userId;
    checkoutProducts.clear();
  }
}

/** Initialize after auth resolves, and refresh when the app returns to the foreground. */
export function initializePurchases(userId: string): Promise<void> {
  return serial(async () => {
    await ensureUser(userId);
    await Purchases.getCustomerInfo();
    notifyPurchaseUpdate();
  });
}

/** Call before signing out of Supabase. */
export function signOutOfPurchases(): Promise<void> {
  return serial(async () => {
    if (!configured) return;
    try {
      if (!(await Purchases.isAnonymous())) await Purchases.logOut();
    } catch {
      // Do not prevent Supabase sign-out when the store is offline. The next
      // operation still has to identify the new user before touching purchases.
    } finally {
      signedInAs = null;
      checkoutProducts.clear();
    }
  });
}

export type StoreProductRequest = { storeProductId: string; subscription: boolean };
export type StorePrice = {
  storeProductId: string;
  priceCents: number;
  priceString: string;
  subscriptionPeriod: string | null;
};

async function fetchProducts(requests: StoreProductRequest[]): Promise<void> {
  checkoutProducts.clear();
  try {
    const offerings = await Purchases.getOfferings();
    const offering = offerings.all?.[subscriptionOfferingId] ?? offerings.current;
    for (const pkg of offering?.availablePackages ?? []) {
      checkoutProducts.set(pkg.product.identifier, { product: pkg.product, package: pkg });
    }
  } catch (error) {
    // Native catalogs can sell individual cosmetics outside an offering.
    // Expo Go / web must use packages; getProducts is unsupported there.
    if (usingTestStore || !NativeModules.RNPurchases) throw error;
  }

  if (!NativeModules.RNPurchases || usingTestStore) return;
  for (const subscription of [true, false]) {
    const ids = requests
      .filter(request => request.subscription === subscription && !checkoutProducts.has(request.storeProductId))
      .map(request => request.storeProductId);
    if (!ids.length) continue;
    const products = await Purchases.getProducts(ids, subscription ? PURCHASE_TYPE.SUBS : PURCHASE_TYPE.INAPP);
    for (const product of products) checkoutProducts.set(product.identifier, { product });
  }
}

/** Store-formatted prices and the packages used by the checkout sheet. */
export function loadStorePrices(userId: string, requests: StoreProductRequest[]): Promise<StorePrice[]> {
  return serial(async () => {
    await ensureUser(userId);
    await fetchProducts(requests);
    return requests.flatMap(request => {
      const product = checkoutProducts.get(request.storeProductId)?.product;
      if (!product || Boolean(product.subscriptionPeriod) !== request.subscription) return [];
      return [{
        storeProductId: product.identifier,
        priceCents: Math.round(product.price * 100),
        priceString: product.priceString,
        subscriptionPeriod: product.subscriptionPeriod,
      }];
    });
  });
}

export type PurchaseResult = { ok: true; active?: boolean } | { ok: false; cancelled?: boolean; message: string };

function purchaseError(error: unknown): PurchaseResult {
  const err = error as { userCancelled?: boolean; code?: string | number; message?: string } | null;
  if (err?.userCancelled || String(err?.code) === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
    return { ok: false, cancelled: true, message: '' };
  }
  if (err?.message === 'purchases_not_configured') {
    return { ok: false, message: 'Purchases are not available yet. Please check back soon.' };
  }
  if (String(err?.code) === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
    return { ok: false, message: 'Your payment is awaiting approval. Your items will unlock once it is approved.' };
  }
  if ([PURCHASES_ERROR_CODE.NETWORK_ERROR, PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR].includes(String(err?.code) as PURCHASES_ERROR_CODE)) {
    return { ok: false, message: 'Could not reach the store. Check your connection and try again.' };
  }
  console.warn('Store operation failed', err?.code ?? 'unknown');
  return { ok: false, message: 'The store could not complete this request. Please try again.' };
}

/** Server verification remains responsible for recording ownership in Supabase. */
export function buyStoreProduct(userId: string, storeProductId: string, subscription: boolean): Promise<PurchaseResult> {
  return serial(async () => {
    try {
      await ensureUser(userId);
      if (!checkoutProducts.has(storeProductId)) await fetchProducts([{ storeProductId, subscription }]);
      const checkout = checkoutProducts.get(storeProductId);
      if (!checkout || Boolean(checkout.product.subscriptionPeriod) !== subscription) {
        return { ok: false, message: 'This item is not for sale yet. Please check back soon.' };
      }
      if (checkout.package) await Purchases.purchasePackage(checkout.package);
      else await Purchases.purchaseStoreProduct(checkout.product);
      return { ok: true };
    } catch (error) {
      return purchaseError(error);
    }
  });
}

/** Present the published subscription paywall. RevenueCatUI owns its purchase flow. */
export function presentSubscriptionPaywall(userId: string): Promise<PurchaseResult> {
  return serial(async () => {
    try {
      await ensureUser(userId);
      if (hasSubscription(await Purchases.getCustomerInfo())) return { ok: true, active: true };
      const offerings = await Purchases.getOfferings();
      const offering = offerings.all[subscriptionOfferingId];
      if (!offering || !offering.monthly) {
        return { ok: false, message: 'The subscription is not available right now. Please try again later.' };
      }
      if (!NativeModules.RNPaywalls) {
        // Expo Go can exercise Test Store checkout. The published native
        // paywall itself is rendered by RevenueCatUI in the rebuilt app.
        if (!usingTestStore) return { ok: false, message: 'Please update the app to use subscription checkout.' };
        const { customerInfo } = await Purchases.purchasePackage(offering.monthly);
        notifyPurchaseUpdate();
        return { ok: true, active: hasSubscription(customerInfo) };
      }
      const { default: RevenueCatUI, PAYWALL_RESULT } = await import('react-native-purchases-ui');
      const result = await RevenueCatUI.presentPaywall({ offering, displayCloseButton: true });
      if (result === PAYWALL_RESULT.CANCELLED) return { ok: false, cancelled: true, message: '' };
      if (result !== PAYWALL_RESULT.PURCHASED && result !== PAYWALL_RESULT.RESTORED) {
        return { ok: false, message: 'The subscription could not be completed. Please try again.' };
      }
      const info = await Purchases.getCustomerInfo();
      notifyPurchaseUpdate();
      return { ok: true, active: hasSubscription(info) };
    } catch (error) {
      return purchaseError(error);
    }
  });
}

/** Test Store / web return account purchases; native builds also ask the app store to restore them. */
export function restoreStorePurchases(userId: string): Promise<PurchaseResult> {
  return serial(async () => {
    try {
      await ensureUser(userId);
      const info = await Purchases.restorePurchases();
      notifyPurchaseUpdate();
      return { ok: true, active: hasSubscription(info) };
    } catch (error) {
      return purchaseError(error);
    }
  });
}
