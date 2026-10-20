# Database changes made with Claude (prayer app project `ubmjxpvnxzujcyeowmqm`)

Every change applied to the live Supabase project, in order, with what it did and the SQL to put it back.
Newest changes go at the bottom. Dates are when it was applied.

Nothing here touches existing user data: no rows in your existing tables were changed or deleted.

---

## 1. `cosmetics_store` (2026-10-18)

**What:** Added the nook store: two new tables, read-only access for the app, and 21 starter products.

- `public.cosmetic_products`: what can be bought (scenes, decor, the Saint Central+ bundle), with price and Stripe price id.
- `public.user_cosmetics`: what each user owns. Only the Stripe webhook can write to it.
- Row level security on both. Signed-in users (including anonymous sign-ins) can read the catalog and their own purchases only.
- `revoke all ... from anon, authenticated` then `grant select ... to authenticated`, so the app can never write these tables.

**Applied as:** `supabase/migrations/20261018_cosmetics_store.sql`

**Revert (deletes the store and every purchase record, so only do this before anyone has bought something):**

```sql
drop table if exists public.user_cosmetics;
drop table if exists public.cosmetic_products;
```

**Revert only the price tweaks (keeps the store):**

```sql
update public.cosmetic_products set price_cents = 399 where id = 'plus';
```

---

## 2. Edge functions deployed (2026-10-18)

Not SQL, but part of the same change.

| Function | JWT verification | Purpose |
|---|---|---|
| `create-checkout-session` | on | Starts a Stripe Checkout for one product. Refuses anonymous sessions. |
| `stripe-webhook` | **off** (Stripe has no login; it checks Stripe's signature instead) | Grants or revokes purchases. |

**Revert:** delete both functions in Supabase, Edge Functions. Source is in `supabase/functions/`.

---

## 3. `security_hardening` (2026-10-18)

**What and why:**

1. **Group-private prayers** were readable by every signed-in user, because an old rule "Anyone can read prayers" let them through next to the group-aware rule (policies combine with OR). Dropped the old rule; the group-aware rule now applies and is limited to signed-in users.
2. **Notes on prayers** (`reflections`) were readable by every signed-in user. Now only the note's author and the owner of the prayer can read them.
3. **Visitors with no session (the `anon` role)** lost all access to the app's tables. Signed-in users, including anonymous sign-ins, are the `authenticated` role and are unaffected. The Bible tables (`KJV`, `CPVD`) stay publicly readable.
4. **Internal functions** (`handle_new_user`, `process_prayer_interaction_schedule`) can no longer be called through the public API. The scheduled job and the service role still run them.
5. **Group functions** (`create_group`, `join_group`, `is_group_member`) now need a session. Anonymous sign-in users still have access.
6. **Search path pinned** on `generate_invite_code` and `handle_new_user`.

**Applied as:** `supabase/migrations/20261018_security_hardening.sql`

**Tested afterwards** (simulating an anonymous signed-in user): the 46 non-group prayers are readable, a group member sees their own group's prayers and no other group's, groups / journal / store / interactions all read fine, the group functions run, and the cron job is still active.

### Revert, step by step

Put these back one at a time if something breaks, starting with whichever matches the symptom.

**Symptom: someone can't see prayers or a group's prayers.** Restores the old (looser) prayer rules:

```sql
drop policy if exists "group prayers members only" on public.prayers;
create policy "group prayers members only"
  on public.prayers for select
  using ((group_id is null) or (user_id = auth.uid()) or public.is_group_member(group_id));
create policy "Anyone can read prayers"
  on public.prayers for select
  to authenticated
  using (true);
```

**Symptom: notes on prayers don't show.** Restores the old rule:

```sql
drop policy if exists "reflections owner of prayer can read" on public.reflections;
create policy "reflections_read_all"
  on public.reflections for select
  to authenticated
  using (true);
```

**Symptom: something that used the public (no session) key stopped working.** Restores Supabase's default access for the no-session role:

```sql
grant all on public.users, public.prayers, public.prayer_interactions, public.reflections,
  public.pair_intents, public.pair_matches, public.prayer_updates, public.prayer_interaction_schedule,
  public.push_tokens, public.notification_preferences, public.notifications_config,
  public.biography_entries, public.groups, public.group_members to anon;
```

**Symptom: a function call is refused.** Restores the original open permissions:

```sql
grant execute on function public.handle_new_user() to public, anon, authenticated;
grant execute on function public.process_prayer_interaction_schedule() to public, anon, authenticated;
grant execute on function public.create_group(text, text, boolean) to public, anon, authenticated;
grant execute on function public.join_group(uuid, text) to public, anon, authenticated;
grant execute on function public.is_group_member(uuid) to public, anon, authenticated;
```

**Search path (unlikely to matter):**

```sql
alter function public.generate_invite_code() reset search_path;
alter function public.handle_new_user() reset search_path;
```

---

## 4. `cosmetics_revenuecat` (2026-10-18): Stripe replaced by RevenueCat

**What:** Purchases will go through the App Store / Google Play via RevenueCat instead of Stripe.

- `cosmetic_products`: added `store_product_id` (the App Store / Play product id, unique when set); dropped `stripe_price_id`.
- `user_cosmetics`: added `store_transaction_id`; dropped `stripe_session_id`, `stripe_customer_id`, `stripe_subscription_id` and the Stripe index; `source` is now `'revenuecat'` or `'grant'` (default `'revenuecat'`).
- Safety checked first: the table had 0 purchases and no product had a Stripe id, so nothing was lost. Row level security and the read-only grants are unchanged (2 policies, `authenticated: SELECT`).
- New edge function **`revenuecat-webhook`** (JWT verification **off**; it checks a shared secret in the `Authorization` header, secret name `REVENUECAT_WEBHOOK_AUTH`). It is inert until that secret is set.
- The old **`create-checkout-session`** and **`stripe-webhook`** functions were removed from the repo but are **still deployed**. I have no tool to delete functions, so delete them in the Supabase dashboard (Edge Functions). They do nothing without the Stripe secrets.

**Applied as:** `supabase/migrations/20261018_cosmetics_revenuecat.sql`

**Revert (puts the Stripe columns back; they will be empty):**

```sql
alter table public.cosmetic_products add column if not exists stripe_price_id text;
drop index if exists public.cosmetic_products_store_product_id_key;
alter table public.cosmetic_products drop column if exists store_product_id;

alter table public.user_cosmetics add column if not exists stripe_session_id text;
alter table public.user_cosmetics add column if not exists stripe_customer_id text;
alter table public.user_cosmetics add column if not exists stripe_subscription_id text;
create index if not exists user_cosmetics_subscription_idx
  on public.user_cosmetics (stripe_subscription_id) where stripe_subscription_id is not null;
alter table public.user_cosmetics drop column if exists store_transaction_id;

update public.user_cosmetics set source = 'grant' where source <> 'grant';
alter table public.user_cosmetics alter column source set default 'stripe';
alter table public.user_cosmetics drop constraint if exists user_cosmetics_source_check;
alter table public.user_cosmetics add constraint user_cosmetics_source_check check (source in ('stripe', 'grant'));
```

To remove the new function, delete `revenuecat-webhook` in the dashboard.

---

## 5. `group_nook` (2026-10-19): the group hearth

**What:** Each group gets a shared "hearth" where every member's pet rests (no names) and members can decorate it.

- `group_members`: added `pet_id` and `pet_stage` (which pet a member shows). Checked to known pets, stage 1 to 3. Existing rows stay empty until that member opens the group.
- New table `group_nooks` (one row per group: the list of decor ids). Row level security: only members of the group can read it. The app has read-only access.
- New function `set_my_group_pet(group, pet, stage)`: updates only the caller's own membership row, only those two columns.
- New function `save_group_nook(group, decor)`: only members can call it; only the 8 known decor ids are accepted, no duplicates, at most 12.
- Both functions need a session (anonymous sign-ins count) and are not callable without one.

**Tested afterwards (simulated signed-in member):** saving a pet and decor worked, an unknown decor id was dropped, an outsider was refused with `not_a_member`, and a direct insert into `group_nooks` was refused.

**Applied as:** `supabase/migrations/20261019_group_nook.sql`

**Revert (deletes every group's decor and the saved pet choices):**

```sql
drop function if exists public.save_group_nook(uuid, jsonb);
drop function if exists public.set_my_group_pet(uuid, text, int);
drop table if exists public.group_nooks;
alter table public.group_members drop constraint if exists group_members_pet_id_check;
alter table public.group_members drop constraint if exists group_members_pet_stage_check;
alter table public.group_members drop column if exists pet_id;
alter table public.group_members drop column if exists pet_stage;
```

---

## Dashboard settings (not SQL)

- **Allow manual linking**: needed for "create an account to keep everything". Turn on in Authentication settings. (Done.)
- **Site URL** `prayer://` and redirect URL `prayer://**`. (Done.)
- **Confirm email**: currently OFF for testing. Turn it back ON once custom SMTP is set up.
- **Captcha protection: leave OFF.** The app has no captcha step, so turning it on would block every sign-in and anonymous sign-in.
- **Leaked password protection**: optional, safe to enable (may need a paid plan).
