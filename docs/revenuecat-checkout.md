# Subscription checkout

Native iOS checkout is configured for Apple subscriptions through RevenueCat.
The user confirmed the Expo Go simulation works. No Apple purchase has been made;
the user will perform the final purchase/restore test in a native iOS build.

## Connected configuration

- RevenueCat project: `proj2274ffdf` (Saint Central App).
- Offering: `monthly_599`, with its published **Subscription** paywall attached.
- App Store app: `app1c1421caa2`, bundle ID `com.saintcentral.app`.
- iOS monthly product: `saintcentral_plus_monthly` (`prode2dca8fac1`); live App Store
  configuration confirms USD 5.99 per month in the US, with no introductory offer.
- Expo Go simulation product: `monthly_599`.
- Entitlement: `saint_central_app_pro`.
- Supabase project: `ubmjxpvnxzujcyeowmqm`.
- App ownership product: `plus` (Saint Central+).

The app selects this specific offering rather than changing RevenueCat's global
current offering. This subscription CTA does not offer yearly or lifetime packages.
Your other product and paywall configurations remain available in RevenueCat.

## App flow

1. Sign into a permanent account and open **Nook store**.
2. Tap **Subscribe** on Saint Central+.
3. In a rebuilt native app, RevenueCatUI displays the published paywall and manages
   its purchase and restore actions. Closing it returns without an error alert.
4. Expo Go can still present the Test Store simulation. The server now accepts
   only the Apple product and store, so simulated purchases no longer grant paid
   access. A previous simulated entitlement cannot skip Apple checkout.
5. After a purchase or restore, Supabase verifies the current entitlement with
   RevenueCat and records access in `user_cosmetics`. SDK change notifications,
   screen focus, and returning to the app refresh the account state.
6. **Restore purchases** also checks whether an active subscription was found.

RevenueCat uses the signed-in Supabase UUID as its app user ID. The SDK is
initialized after authentication, identity changes are serialized with checkout,
account sign-out resets purchase identity, and guests cannot purchase.

## Local environment and development build

The public iOS SDK key is saved in ignored `.env` and in the EAS development,
preview, and production environments. Native builds prefer their platform key,
including development builds. Expo Go uses the Test Store key only in development;
release builds cannot use simulated billing.
The configured public identifiers are:

```dotenv
EXPO_PUBLIC_REVENUECAT_TEST_PLUS_PRODUCT_ID=monthly_599
EXPO_PUBLIC_REVENUECAT_SUBSCRIPTION_OFFERING_ID=monthly_599
EXPO_PUBLIC_REVENUECAT_SUBSCRIPTION_ENTITLEMENT_ID=saint_central_app_pro
```

Restart Metro in Expo Go mode to load the environment changes:

```sh
npx expo start --go --clear
```

After changing `.env`, restart Metro and reload Expo Go. The running server can
otherwise keep an older environment without the Test Store key. A failed price
load now shows an explanation and **Retry checkout** on the Saint Central+ card.

For the full published paywall, create a new development build using the existing
EAS development profile. The required `expo-dev-client` and
`react-native-purchases-ui` dependencies are now installed.

```sh
eas build --profile development --platform ios
npx expo start --dev-client --clear
```

A JavaScript bundle export does not rebuild an installed app's native modules.
Android production checkout has not been configured.

## Deployed server components

- `revenuecat-subscription-sync`: requires a verified Supabase JWT and a permanent
  account. It derives the user ID from that token and ignores client access claims.
- `revenuecat-subscription-webhook`: receives subscription notifications. It treats
  every notification as untrusted and independently fetches the latest customer
  status from RevenueCat before changing access. A notification body alone can
  never grant a subscription; an upstream failure preserves existing access and
  returns a retryable error.
- RevenueCat integration **Saint Central subscription sync** delivers both sandbox
  and production subscription events from the App Store app to the endpoint.
- `revenuecat_subscription_config` stores the selected entitlement, offering,
  permitted product IDs, public SDK key, and sandbox setting. It is server-only.
- `revenuecat_subscription_checks` records snapshot times, preventing older
  responses from overwriting newer verified access.
- `apply_revenuecat_subscription` updates access transactionally and can only be
  executed by the service role. Manual grants remain intact.
- `user_cosmetics.expires_at`, its read policy, and the nook-save trigger enforce
  subscription expiry even before an expiration notification arrives.

The migration applied to the hosted database is
`supabase/migrations/20261113215233_revenuecat_subscription_checkout.sql`, followed
by `20261113224400_ios_subscription_checkout.sql` for the Apple product mapping.
The server's iOS public SDK key was provisioned separately from the migrations.
The server-only tables intentionally have RLS without client policies, and all
client table privileges are revoked. SDK keys used here are public keys; no
service-role credential is embedded in the app.

The older cosmetic `revenuecat-webhook` function was not replaced or connected to
this new subscription integration.

## Verification and final device test

Completed checks:

- RevenueCat offering, published-paywall association, entitlement attachment, and
  monthly product price were inspected through the connected RevenueCat app.
- 41 subscription/purchase/webhook tests pass; all 47 repository tests pass,
  including Apple key selection and rejection of simulated production access.
- Changed app files pass ESLint and targeted TypeScript checks.
- The iOS JavaScript bundle exports successfully.
- The running Expo Go bundle includes the Test Store key and checkout retry action.
  A metadata-only check with the installed Expo Go adapter returns the monthly
  package and its USD 5.99 price; no purchase was made.
- Hosted database tests verified grant, revoke, stale-response rejection, manual
  grant preservation, expiry filtering, and denied client access to grant/config
  operations. All database test writes were rolled back.
- Deployed endpoint checks return 200 for a dashboard test notification, 400 for
  a malformed event, and 401 for app sync without authentication.
- The iOS public SDK key returns the chosen offering's monthly Apple product in
  a metadata-only API check. Server config and catalog use that same product;
  client access to server config remains denied.
- Clean iOS dependency resolution passes with npm 10.9.9, matching the EAS builder.
  The lockfile includes the optional dependencies required by that npm version.
  Verification used a separate directory, the builder's npm version, and the
  Darwin/arm64 target; manifest and lockfile dependency declarations match.

Cloud build 67 failed during dependency installation. Build 68 was canceled
because its archive preceded the final lockfile correction. Start a fresh build
from the current source with `eas build --platform ios --profile production`.
No completed native binary from these attempts is ready to install.

The user chose to perform the final purchase test in the app. Check:

1. An Apple sandbox purchase in a native build succeeds and Saint Central+ becomes active.
2. Canceling checkout shows no error and leaves access unchanged.
3. Restoring purchases on the same account finds the subscription.
4. Signing out and using another account does not inherit the subscription.
5. Test subscription expiry removes access; renewal restores the paid period.

The native app has not been launched or purchased through on a device in this
session. These remain runtime validation steps, not completed checks.
The full project TypeScript check also has existing unrelated errors in
`myPrayers.tsx`, `app-tabs.web.tsx`, and Deno edge-function files; web static
rendering has an existing Supabase/AsyncStorage `window` error.

## Real payments

The App Store product is attached to the monthly package and the
`saint_central_app_pro` entitlement. The app, server configuration, and notification
integration use the App Store app. Apple sandbox access remains enabled for
TestFlight testing, while Test Store receipts are rejected.

Apple currently reports `MISSING_METADATA` for the subscription, and the returned
review information is null. Complete the missing subscription metadata in App
Store Connect, including the required review screenshot, then submit the
subscription with the app for Apple review. No store metadata was changed and
nothing was submitted to Apple in this session. TestFlight purchases use Apple's
sandbox; real customer charges require the approved App Store release.

## References

- [RevenueCat offerings](https://app.revenuecat.com/projects/2274ffdf/product-catalog/offerings)
- [RevenueCat paywalls](https://app.revenuecat.com/projects/2274ffdf/paywalls)
- [Subscription notification integration](https://app.revenuecat.com/projects/2274ffdf/integrations/webhooks/whintgr2a74c34b345e48d5bc87e1411d57c955)
- [Displaying paywalls](https://www.revenuecat.com/docs/tools/paywalls/displaying-paywalls)
- [RevenueCat webhook verification and reconciliation](https://www.revenuecat.com/docs/integrations/webhooks)
