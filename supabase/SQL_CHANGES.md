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

## Dashboard settings (not SQL)

- **Allow manual linking**: needed for "create an account to keep everything". Turn on in Authentication settings.
- **Captcha protection: leave OFF.** The app has no captcha step, so turning it on would block every sign-in and anonymous sign-in.
- **Leaked password protection**: optional, safe to enable (may need a paid plan).
