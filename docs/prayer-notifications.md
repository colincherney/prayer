# Prayer notifications

Notification settings now includes a separate switch for each joined group and an optional **Reflect on your prayers** reminder. Each group page also has its own prayer notification switch; both screens save the same account preference.

Group alerts default to on. Only another member's new, approved group prayer creates an alert. Public prayers, pending moderation, existing posts, and the recipient's own prayers do not. Alerts contain the group name and general wording, without prayer text or author information. Tapping opens the group. Membership and the current preference are checked when claiming delivery. Leaving a group removes its preferences and pending alerts.

Reflection reminders default to off. The initial cadence is every two days at 7 PM, with every three days, weekly, and other local hours available. The first reminder waits for the selected interval; enabling again or changing the interval starts a new cadence. Reminders only send if the account has at least one approved posted prayer and a registered device. They use the account's device timezone, catch up after the selected hour that day, and fall back to UTC for invalid timezone values.

The reflection push reads **A moment to reflect** / **Take a quiet moment to reflect on your prayers.** Its payload contains only the notification type. Tapping opens My Prayers with no individual prayer selected. Notification taps also work when launching the app, after authentication and navigation settle.

## Backend

- Migration: `supabase/migrations/20261114072417_prayer_notifications.sql` (matches the deployed migration history).
- Edge function: `notify-prayer-activity`, JWT verification enabled, with an additional exact service credential check in the handler. It accepts the runtime service key or the private scheduler's saved legacy service JWT; a service-role claim on its own never grants access.
- Schedule: `notify_prayer_activity`, every minute, through the existing server-only `notifications_dispatch` helper and existing notification credentials.
- Private per-membership preferences: `group_notification_preferences`, with self-only RLS.
- Group outbox: `group_prayer_notification_queue`, populated by an approval trigger. Claiming leases rows atomically for five minutes. Transient failures retry within a one-day window. No historical backfill.
- Reflection claims stamp a local date atomically. Failed sends restore eligibility without overwriting a newer cadence change.
- Expo batches contain at most 100 messages. Successful tickets are stored in `prayer_notification_receipts`, checked after 15 minutes, and removed after checking or 24 hours. Only `DeviceNotRegistered` causes device-token removal; credential errors preserve tokens.

The outbox, receipts, and claim RPCs are service-only. Existing daily prayer reminders keep their existing schedule and settings.

Deployed to the connected project with the minute schedule active. A live dispatcher invocation returned HTTP 200 with `{"ok":true,"accepted":0}`; no real user notifications were needed for that check.

## Verification

Run `node --test tests/prayer-notifications.test.cjs` for routing, service authorization, delivery batching, retry behavior, receipt handling, and general reflection wording. Run `node --test tests/*.test.cjs` for the full existing suite.

`supabase/tests/prayer_notifications.sql` creates fixtures and checks approval, author exclusion, muted groups, membership cleanup, RLS, leases, local time, all three cadences, opt-out, missing devices, and removal of all prayers. Run the whole file in one SQL execution; it rolls back all fixtures and claims. No test sends notifications to real devices.

Verified on November 14, 2026: all 64 Node tests pass, notification files pass ESLint, the backend passes a separate strict TypeScript check, the database regression tests pass before and after deployment, and the Android production bundle exports successfully. Application type checking has no new errors; the existing `app-tabs.web.tsx` ref type error remains. Web static export also hits the existing Supabase/AsyncStorage `window is not defined` failure during server rendering. Physical-device push delivery and UI interaction still need a device check.

The security advisor reports expected [service-only tables with no client policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [authenticated schema discoverability](https://supabase.com/docs/guides/database/database-linter?lint=0027_pg_graphql_authenticated_table_exposed), and [anonymous signed-in account support](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins). These match this app's access model. Tests verify that members cannot read each other's preferences or access the notification outbox/claim functions.
