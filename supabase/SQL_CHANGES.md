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

## 6. `quests` (2026-10-20): the Quests page

**What:** Daily quests from the pet guide, XP for the pet, and weekly journeys.

- New table `quest_completions` (one row per finished quest: quest id, category, tier, XP, the phone's local day). Row level security: each person can read only their own rows. The app has read-only access.
- New function `complete_quest(quest, category, tier, day)` is the only way to record a quest. It sets the XP itself (regular 10, advanced 30, special 60, journey step 5, the fifth journey step 85) and enforces per-day limits: one regular quest per category, one bonus challenge, one journey step. It rejects unknown quest ids and dates more than a day from the server's date. It needs a session (anonymous sign-ins count).
- New product `item:pilgrimlantern` in `cosmetic_products`, **inactive** (never sold). Finishing a weekly journey grants it in `user_cosmetics` with source `grant`.
- Pet XP now also adds the XP from `quest_completions`.

**Tested afterwards (simulated signed-in user, rolled back):**
- A regular quest gave 10 XP, and a second prayer quest the same day was refused.
- A bonus (A) quest gave 30 XP, and a second bonus was refused.
- An unknown quest id, a date five days old, and a direct insert were all refused.
- The first journey step gave 5 XP. The fifth gave 85 and granted the lantern.

**Applied as:** `supabase/migrations/20261020_quests.sql`

**Revert (deletes everyone's quest history and quest XP, and removes earned lanterns):**

```sql
drop function if exists public.complete_quest(text, text, text, date);
drop table if exists public.quest_completions;
delete from public.user_cosmetics where product_id = 'item:pilgrimlantern';
delete from public.cosmetic_products where id = 'item:pilgrimlantern';
```

---

## 7. `pet_levels` (2026-10-30): each pet levels up on its own

**What:** Pets no longer share one level. A pet only grows from XP earned while it is the active pet.

- New table `public.pet_xp` (user, pet, banked_xp): XP each pet banked during its earlier turns as the active pet.
- New table `public.pet_state` (user, active_pet, active_since_xp): the active pet and the account's total XP when it became active.
- Row level security on both. Users can read only their own rows, and the app can't write either table directly.
- New function `switch_pet(from, to, total)` is the only way to write them. The pet that was active banks `total - active_since_xp`, then `to` becomes active from `total`.
- Existing users: on their first load the app creates their `pet_state` with their current pet active from 0, so that pet keeps all XP earned so far. Every other pet starts at level 1.
- Until this is applied the app falls back to the old shared level, so nothing breaks.

**Applied as:** `supabase/migrations/20261030_pet_levels.sql`. Applied to the live project on 2026-10-30 through the Supabase connector.

**Revert (deletes every pet's separate XP; the app goes back to one shared level automatically):**

```sql
drop function if exists public.switch_pet(text, text, int);
drop table if exists public.pet_xp;
drop table if exists public.pet_state;
```

---

## 8. `content_releases` (2026-10-30): seasonal scenes, companions and trinkets that unlock on a date

**What:** These all ship in the app hidden, and this table says when each one appears:

- the Thanksgiving and Christmas home scenes
- the twelve 2027 monthly home scenes
- Gobbles the Turkey and Noel the Donkey
- the twelve monthly companions
- the 24 prayer nook trinkets

- New table `public.content_releases` (id, release_at, note). Ids are `pet:<pet id>`, `room:<room name>` or `trinket:<trinket id>`.
- The read policy only returns rows whose `release_at` has passed, by the server's clock. Anyone (signed in or not) can read released rows. Nobody can write through the app.
- Schedule, all at midnight US Eastern:
  - Nov 14, 2026: Give Thanks scene and Gobbles.
  - Dec 1, 2026: God With Us scene and Noel.
  - The 1st of each month in 2027, January through December: that month's home scene (`room:m2027jan` … `room:m2027dec`) and companion (Nib the Rat, Bao the Ox, Rory the Tiger, Mochi the Rabbit, Long the Dragon, Ribbon the Snake, Dash the Horse, Clover the Goat, Kiki the Monkey, Dawn the Rooster, Biscuit the Dog, Rosie the Pig).
  - Trinkets, two at a time: two on Nov 14, two on Dec 1, then two on the 1st of each month from January to October 2027. The order is in `src/lib/trinkets.ts`.
- New table `public.user_trinkets` (user, trinket, earned_at): the trinkets each person has earned. Users can read only their own rows, and the app can't write it directly.
- New function `earn_trinket(trinket)` is the only way to write it. It refuses a trinket whose release date hasn't come. The app checks the goal itself: automatically where it can see the activity, and on the honor system for the rest.
- The pet-id checks on `group_members`, `pet_xp` and `pet_state`, and `switch_pet()`, now accept the 14 new pets.
- **To change a date:** `update public.content_releases set release_at = '2026-11-20 00:00'::timestamp at time zone 'America/New_York' where id = 'pet:turkey';`

**Applied as:** `supabase/migrations/20261030_content_releases.sql`. Applied to the live project on 2026-10-30 through the Supabase connector, right after #7. Checked afterwards: 52 release rows, and the app (anon role) sees none of them before Nov 14.

**Revert (deletes everyone's earned trinkets; scheduled content falls back to the app's built-in copy of the schedule):**

```sql
drop function if exists public.earn_trinket(text);
drop table if exists public.user_trinkets;
drop table if exists public.content_releases;
```

To also put back the old pet-id checks, re-run the `group_nook` and `pet_levels` migrations. Do that only if nobody has picked one of the new pets yet, or the checks will fail.

---

## 9. `release_all_trinkets` (2026-11-07): all 24 trinkets out now

- All 24 `trinket:` rows in `public.content_releases` now have a release time of 2026-11-07 midnight US Eastern, instead of two at a time from Nov 14, 2026 to Oct 2027.
- The app's built-in fallback schedule in `src/lib/releases.ts` was changed to match.
- Scenes and companions keep their dates.

**Applied as:** `supabase/migrations/20261107_release_all_trinkets.sql`. Applied to the live project on 2026-11-07 through the Supabase connector. Before it ran, no trinkets were out and nobody had earned one.

**Revert (puts back the old schedule; anything earned in the meantime stays earned):**

```sql
update public.content_releases r
set release_at = v.release_at::timestamptz
from (values
  ('firstLightCandle', '2026-11-14T05:00:00Z'), ('loavesFishesBasket', '2026-11-14T05:00:00Z'),
  ('chapelSnowGlobe', '2026-12-01T05:00:00Z'), ('shepherdLambPlush', '2026-12-01T05:00:00Z'),
  ('olivewoodRosary', '2027-01-01T05:00:00Z'), ('mustardSeedJar', '2027-01-01T05:00:00Z'),
  ('oliveBranchVase', '2027-02-01T05:00:00Z'), ('quillPrayerJournal', '2027-02-01T05:00:00Z'),
  ('lilyOfTheField', '2027-03-01T05:00:00Z'), ('sevenbellChime', '2027-03-01T05:00:00Z'),
  ('hourglassOfStillness', '2027-04-01T04:00:00Z'), ('doveMusicBox', '2027-04-01T04:00:00Z'),
  ('goldenPotOfManna', '2027-05-01T04:00:00Z'), ('psalmHarp', '2027-05-01T04:00:00Z'),
  ('nightWatchLantern', '2027-06-01T04:00:00Z'), ('harborLighthouse', '2027-06-01T04:00:00Z'),
  ('fishersNet', '2027-07-01T04:00:00Z'), ('galaxyPromiseJar', '2027-07-01T04:00:00Z'),
  ('arkInABottle', '2027-08-01T04:00:00Z'), ('roseWindowSuncatcher', '2027-08-01T04:00:00Z'),
  ('covenantPrism', '2027-09-01T04:00:00Z'), ('jacobsLadderMobile', '2027-09-01T04:00:00Z'),
  ('unburntBushBonsai', '2027-10-01T04:00:00Z'), ('pearlOfGreatPrice', '2027-10-01T04:00:00Z')
) as v(trinket, release_at)
where r.id = 'trinket:' || v.trinket;
```

The fallback dates in `src/lib/releases.ts` would need to go back too.

---

## 10. `nook_collection` (2026-11-07): 50 keepsakes, 50 decorations and 15 scenes on a release schedule

- `public.content_releases`: 115 new rows. Keepsakes (`trinket:<id>`) and decorations (`item:<id>`): one each every Monday at midnight US Eastern, two on the first Monday of each month, from Nov 9, 2026 to Aug 9, 2027. Scenes (`scene:<id>`): one or two a month, Nov 14, 2026 to Aug 1, 2027.
- `public.cosmetic_products`: 50 new decorations at $0.99 and 15 new scenes at $2.00, plus product rows for three decorations the app already sold without one (Prayer bench, Rose window, Hanging dove).
- Prices: every decoration is now $0.99 (they already were) and every scene $2.00 (the five existing scenes were $1.99). The Pilgrim's lantern stays a free quest reward.
- The art ships in the app, hidden until each date; `earn_trinket` already refuses anything not yet released. Move a date with: `update public.content_releases set release_at = '2027-01-11 00:00'::timestamp at time zone 'America/New_York' where id = 'item:bookpile';`
- None are buyable until each product's `store_product_id` is filled in (RevenueCat), the same as the existing ones.

**Applied as:** `supabase/migrations/20261107_nook_collection.sql`. Applied to the live project on 2026-11-07 through the Supabase connector. Checked afterwards: 74 trinket release rows (24 + 50), 50 decoration and 15 scene release rows, none out yet; 68 of 69 decorations at 99 cents (the lantern is free), all 20 scenes at 200.

**Revert (fails on any product someone has bought, which is intended):**

```sql
delete from public.content_releases where id like 'item:%' or id like 'scene:%'
  or id in (select 'trinket:' || unnest(array['oillamp','bell','loaf','applebasket','advent','paperstar','acorn','donkeyplush','manger','honey','pinecone','psalter','cairn','crossstand','teacup','pomegranate','sparrow','sacredcandle','figbowl','compass','hyssop','key','scroll','arkboat','alabaster','crownlife','flute','mites','crystaldove','birdfeeder','tiffany','globeworld','canajar','mustardtree','spinner','cloudmobile','olivewreath','shell','bunting','shellchime','fireflyjar','censer','moonmobile','prismcatcher','well','cushions','figtree','chest','organ','fountain']));
delete from public.cosmetic_products where id in (
  'item:roundrug','item:starrug','item:kneeler','item:pillowpile','item:reedmat','item:flagstones','item:mossbed','item:bookpile','item:candletable','item:firepit',
  'item:tallolive','item:bookcase','item:floorlamp','item:palm','item:clock','item:ladder','item:pillar','item:candelabra','item:birdcage','item:sunflowers','item:cypress','item:chair','item:rocker','item:easel',
  'item:sampler','item:moonwindow','item:plantshelf','item:landscape','item:wallclock','item:banner','item:ivy','item:mirror','item:map','item:lancet','item:quilt','item:noteboard',
  'item:fairycurtain','item:lanterntrio','item:macrame','item:chandelier','item:flagbunting','item:canopy','item:driedgarland','item:skylight',
  'item:fireflies','item:petals','item:snowfall','item:mist','item:shooting','item:glowmotes',
  'item:bench','item:rose','item:dove',
  'scene:autumn','scene:rainy','scene:shepherds','scene:cabin','scene:northernlights','scene:alpine','scene:cathedral','scene:lilymeadow',
  'scene:jordan','scene:blossom','scene:galilee','scene:lighthouse','scene:oasis','scene:rooftop','scene:heaven');
update public.cosmetic_products set price_cents = 199 where id in ('scene:advent','scene:aurora','scene:easter','scene:harvest','scene:meadow');
```

---

## 11. `content_windows` (2026-11-07): the seasonal vault

- New table `public.content_windows` (id, opens_at, closes_at): when seasonal content can be claimed. Outside every window it's in the vault, so anyone who already claimed it keeps it but nobody new can. Readable by everyone (it's a schedule, like `content_releases`); nobody can write it from the app.
- Seasonal companions (midnight US Eastern):
  - Gourdy (`pet:pumpkin`): until Jan 7, 2027, then Oct 1 to Nov 1, 2027.
  - Gobbles (`pet:turkey`): Nov 14, 2026 to Jan 7, 2027, then Nov 14 to Dec 1, 2027.
  - Noel (`pet:donkey`): Dec 1, 2026 to Jan 7, 2027, then Dec 1, 2027 to Jan 1, 2028.
- "Claimed" means the companion has XP with you or is your current companion. The app enforces the vault (the Dex shows VAULT and the companion page won't let you walk with it); `switch_pet` doesn't check it yet.
- **To add a season:** `insert into public.content_windows values ('pet:pumpkin', '2028-10-01 00:00'::timestamp at time zone 'America/New_York', '2028-11-01 00:00'::timestamp at time zone 'America/New_York');`

**Applied as:** `supabase/migrations/20261107_content_windows.sql`. Applied to the live project on 2026-11-07 through the Supabase connector. Checked afterwards as the app's anon role: all six windows readable.

**Revert (seasonal companions are then never vaulted):**

```sql
drop table if exists public.content_windows;
```

---

## 12. `user_progress` (2026-11-07): personal progress follows the account

- New table `public.user_progress`, one row per account: `nook` (scene, pieces and where they sit), `shelf_picks`, `pet_names`, `companions_met` (when each companion was first walked with), `levels_seen` (level-ups already celebrated) and `quest_day` (today's accepted quests and swaps). Each field has a size cap.
- Everyone can read, add and change only their own row; nobody signed out can see it; rows go when the account is deleted (`on delete cascade`).
- The app (`src/lib/cloudProgress.ts`) saves each change shortly after it happens, keeps unsent changes on the phone until they upload, and at launch takes the account's copy. A phone's existing progress is uploaded the first time its account syncs; a different account signing in on the same phone never inherits it.
- Everything people grind for was already in the database (prayers, quests, pet XP, keepsakes, purchases; streaks and levels are worked out from those). This adds the personal pieces that were only on the phone.

**Applied as:** `supabase/migrations/20261107_user_progress.sql`. Applied to the live project on 2026-11-07 through the Supabase connector. Checked afterwards: RLS on with 3 policies, no access for signed-out users, no delete; a test save and read as a signed-in user saw only its own row (rolled back).

**Revert (the app then keeps this progress on the phone only, as before):**

```sql
drop table if exists public.user_progress;
```

---

## 13. `user_progress_appearance` (2026-11-07): the app's look follows the account

- `public.user_progress` gets an `appearance` column: `{ theme, room, mode }` (the theme, the prayer room, and whether Home shows the room or the theme), capped at 1 KB. Same row and permissions as #12.

**Applied as:** `supabase/migrations/20261107_user_progress_appearance.sql`. Applied to the live project on 2026-11-07 through the Supabase connector. Checked afterwards with a rolled-back test save and read as a signed-in user.

**Revert:**

```sql
alter table public.user_progress drop column if exists appearance;
```

---

## 14. `security_hardening` (2026-11-07): closing holes found in a security review

- Dropped `push_tokens claim ownership`: it let any signed-in user take over anyone's push token row. Tokens are registered through `register_push_token()`, which still works.
- `prayer_interactions` reads: was "every signed-in user sees everything" (including who prayed on private group prayers). Now your own interactions plus interactions on prayers you can already see.
- Revoked `anon`/`authenticated` grants on the server-only tables `notifications_config` (holds the service role key), `pair_intents`, `pair_matches`, `prayer_interaction_schedule`. RLS already blocked them; this is a second lock. Edge functions use the service role.
- `set_my_group_pet()` now rejects anything that isn't a short lowercase pet id and a stage of 1 to 3.

**Applied as:** `supabase/migrations/20261107_security_hardening.sql`. Applied to the live project on 2026-11-07 through the Supabase connector. Checked afterwards as a signed-in user in a rolled-back test: own and public-prayer interactions still visible, `notifications_config` blocked, a bad group pet rejected, and 0 rows changed when trying to take other users' push tokens.

**Revert:**

```sql
create policy "push_tokens claim ownership" on public.push_tokens
  for update using (auth.uid() is not null) with check (auth.uid() = user_id);

drop policy if exists "interactions on visible prayers" on public.prayer_interactions;
create policy "Anyone can read interactions" on public.prayer_interactions
  for select to authenticated using (true);

grant select, insert, update, delete, references, trigger, truncate on
  public.notifications_config, public.pair_intents, public.pair_matches, public.prayer_interaction_schedule
  to authenticated;

create or replace function public.set_my_group_pet(p_group uuid, p_pet text, p_stage integer)
 returns void language sql security definer set search_path to 'public'
as $function$
  update public.group_members set pet_id = p_pet, pet_stage = p_stage
   where group_id = p_group and user_id = auth.uid();
$function$;
```

---

## 15. `server_side_xp_and_nook` (2026-11-07): the server checks pet XP and paid decor

- New `account_xp(uid)` works out the account's XP on the server (prayed ×10, shared ×20, journal ×5, plus quest XP — same as `xpFromCounts()` in `src/lib/pet.ts`; keep them in step). Not callable from the app.
- `switch_pet()` now uses `account_xp()` and ignores the `p_total` the phone sends, so an edited request can't add levels. The parameter stays so the app doesn't need an update.
- New trigger `user_progress_strip_unowned_nook` (function `strip_unowned_nook()`): on every nook save, pieces and scenes that are priced in `cosmetic_products` and not owned (`user_cosmetics`, or `plus`) are removed; an unowned scene falls back to `night`. Free and earned pieces are untouched.

**Applied as:** `supabase/migrations/20261107_server_side_xp_and_nook.sql`. Applied to the live project on 2026-11-07 through the Supabase connector. Checked afterwards as a signed-in user in a rolled-back test: saving a nook with paid `chandelier`, `snowfall` and scene `cathedral` kept only the free pieces and fell back to `night`; `switch_pet` with a fake total of 999999 banked the real 295; calling `account_xp` directly was blocked.

**Revert:**

```sql
drop trigger if exists user_progress_strip_unowned_nook on public.user_progress;
drop function if exists public.strip_unowned_nook();

create or replace function public.switch_pet(p_from text, p_to text, p_total integer)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare
  uid uuid := auth.uid();
  allowed constant text[] := array[
    'lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin', 'turkey', 'donkey',
    'rat', 'ox', 'tiger', 'rabbit', 'loong', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'];
  st public.pet_state%rowtype;
  total int := greatest(coalesce(p_total, 0), 0);
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  if not (p_from = any(allowed)) or not (p_to = any(allowed)) then raise exception 'unknown_pet'; end if;
  select * into st from public.pet_state where user_id = uid for update;
  if not found then
    insert into public.pet_state (user_id, active_pet, active_since_xp) values (uid, p_from, 0) on conflict (user_id) do nothing;
    select * into st from public.pet_state where user_id = uid for update;
  end if;
  if st.active_pet = p_to then return; end if;
  insert into public.pet_xp (user_id, pet_id, banked_xp) values (uid, st.active_pet, greatest(total - st.active_since_xp, 0))
  on conflict (user_id, pet_id) do update set banked_xp = public.pet_xp.banked_xp + excluded.banked_xp;
  update public.pet_state set active_pet = p_to, active_since_xp = total, updated_at = now() where user_id = uid;
end;
$function$;

drop function if exists public.account_xp(uuid);
```

---

## 16. `biography_entries_cascade` (2026-11-13): deleting an account also deletes its biography entries

**Why:** deleting an account failed for anyone who had written a biography entry. That table's link to the
account had no "on delete" rule, so Supabase refused to delete the user. Every other user table already
clears itself when the account goes.

**What:** the biography entries now get deleted along with their account. No existing rows change.

**Apply as:** `supabase/migrations/20261113_biography_entries_cascade.sql`

```sql
alter table public.biography_entries
  drop constraint biography_entries_user_id_fkey,
  add constraint biography_entries_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;
```

**Revert:**

```sql
alter table public.biography_entries
  drop constraint biography_entries_user_id_fkey,
  add constraint biography_entries_user_id_fkey
    foreign key (user_id) references auth.users(id);
```

---

## 17. `delete-account` edge function v7 (2026-11-13): deleting needs an emailed code

Not SQL. Accounts with an email must send a one-time code (emailed with the "Magic link or OTP" template) and the
function checks it against the signed-in user before deleting anything. Guests (no email) are unchanged. It also
deletes the `public.users` row, which v6 skipped.

**Revert:** redeploy `supabase/functions/delete-account/index.ts` from commit `31f349b`. The app's new screen still
works with it; the old function just ignores the code.

---

## Dashboard settings (not SQL)

- **Allow manual linking**: needed for "create an account to keep everything". Turn on in Authentication settings. (Done.)
- **Site URL** `prayer://` and redirect URL `prayer://**`. (Done.)
- **Confirm email**: ON (2026-11-13). Sign-up and guest upgrade confirm with an emailed code.
- **Custom SMTP**: Resend, sender `noreply@mail.saint-central.com` (domain must stay verified in Resend).
- **Secure email change**: ON. Changing email needs a code from both the old and new address.
- **Email templates**: Confirm sign up, Magic link or OTP, Change email address and Reset password all show `{{ .Token }}` (an 8-digit code) and no link. The app has no web pages for these, so a template with a link breaks that flow.
- **Captcha protection: leave OFF.** The app has no captcha step, so turning it on would block every sign-in and anonymous sign-in.
- **Leaked password protection**: optional, safe to enable (may need a paid plan).
## Subscription checkout (2026-11-13)

Applied `20261113215233_revenuecat_subscription_checkout.sql` to the connected project.
Added server-only RevenueCat subscription configuration and verification snapshots,
the service-role-only `apply_revenuecat_subscription` RPC, and `user_cosmetics.expires_at`.
Ownership reads and nook saves now check expiry; stale verification results cannot
overwrite newer snapshots, and manual grants are preserved.

Connected `plus` to the `monthly_599` subscription, deployed the authenticated
`revenuecat-subscription-sync` function and the independently verified
`revenuecat-subscription-webhook` notification endpoint, and registered a sandbox
subscription integration in the Saint Central App RevenueCat project.
The existing cosmetic webhook deployment was left in place.

Grant/revoke, expiry, ordering, and client-permission checks passed in a rolled-back
database transaction. The user will perform the final purchase/restore test in the app.
See `docs/revenuecat-checkout.md` for configuration and validation details.

### iOS subscription checkout

Applied `20261113224400_ios_subscription_checkout.sql`: `plus` maps to Apple's
`saintcentral_plus_monthly`. Provisioned the public iOS SDK key separately in the
server-only configuration, allowing Apple sandbox receipts for TestFlight.
Deployed subscription verification that requires the matching store, so Test Store
receipts cannot grant production subscription access. RevenueCat notifications now
target the App Store app in both sandbox and production environments.

## Prayer notifications (2026-11-14)

Applied `20261114072417_prayer_notifications.sql` and deployed `notify-prayer-activity` v2.
Added self-only group notification preferences, a service-only group prayer outbox,
reflection reminder preferences and atomic claim RPCs, and Expo receipt tracking.
New approved group prayers queue alerts for other opted-in members. Leaving removes
the membership's preferences and pending alerts. Reflection reminders are opt-in,
use the user's local time, and require at least one approved posted prayer.

The `notify_prayer_activity` cron runs every minute through the existing dispatcher.
The function requires the runtime service credential or an exact match with the
private scheduler's legacy service-role credential; gateway JWT verification stays on.
A live dispatch returned HTTP 200 with no messages due. SQL regression tests passed
in rolled-back transactions before and after deployment, with no fixtures left behind.
All 64 Node tests pass and the Android production bundle exports successfully.
See `docs/prayer-notifications.md` for behavior, verification, and existing web build limitations.

To pause this feature without changing data, deactivate the `notify_prayer_activity`
job in Supabase Cron. Existing daily and social-proof jobs remain separate.

## Notification compute guards (2026-11-17)

Applied `20261117173942_notification_compute_guards.sql` to the connected project.
The existing cron jobs now check for due work before starting notification Edge
Functions or processing scheduled prayer interactions. IDs, schedules, owners,
enabled states, original dispatch/claim functions, delivery logic and credentials
are preserved. New helpers are private and use invoker privileges with client
execution revoked. Daily reminders retain minute precision; group retries,
reflection cadence/catch-up and receipt checks remain eligible.

Ran normal `VACUUM (ANALYZE)` on `net._http_response` and `cron.job_run_details`,
and added `notification_log_maintenance` at `23 */6 * * *` for ongoing maintenance.
No stored responses or cron history were deleted. Full compaction and log
retention were not applied.

Verified with an isolated real-Postgres regression suite, all 67 Node tests,
the existing rolled-back live SQL notification regression suite, successful
cron executions and advisors. See `docs/prayer-notifications.md` for details.

**Rollback (restores the original schedules' commands without deleting data):**

```sql
do $$
declare job record;
begin
  for job in select jobid, jobname from cron.job
    where jobname in ('notify_daily_reminder', 'notify_prayer_activity', 'notify_social_proof')
  loop
    perform cron.alter_job(job.jobid, command := format(
      'select public.notifications_dispatch(%L);',
      case job.jobname
        when 'notify_daily_reminder' then 'notify-daily-reminder'
        when 'notify_prayer_activity' then 'notify-prayer-activity'
        when 'notify_social_proof' then 'notify-social-proof'
      end
    ));
  end loop;
  for job in select jobid from cron.job where jobname = 'process_prayer_interaction_schedule'
  loop
    perform cron.alter_job(job.jobid, command := 'select process_prayer_interaction_schedule();');
  end loop;
end;
$$;
select cron.unschedule('notification_log_maintenance');
drop function private.dispatch_notifications_if_due(text);
drop function private.notification_work_due(text, timestamptz);
```

## The Long Winter event (2026-11-18)

**Applied as:** `supabase/migrations/20261118_long_winter_event.sql`. Applied to the live project on 2026-11-18 through
the Supabase connector. Checked with `supabase/tests/long_winter_event.test.sql`: 29 checks passed, all inside one
rolled-back block. Afterwards the counter was 0 and no test accounts or progress rows were left.

**What it adds:**

- **`public.events`:** one row, `long-winter-2026`. Its `config` jsonb holds the chapters, evolutions, Advent wreath,
  weeks, weekly keepsakes, community goal and the 10 challenges. Anyone can read it; nobody can write it from the app.
  `is_active` is the kill switch.
- **`public.user_event_progress`:** each person's progress. Users read only their own row, and nobody writes it from
  the app.
- **`public.community_counters`:** the `winter_lights` count. It's read only through `winter_event_state`.
- **Private functions:** `private.evaluate_event(user, event, today)` works out progress from `prayer_interactions`
  ('prayed' rows; each one is a Vigil candle) and `pair_intents`, by local day in the person's timezone.
  `private.grant_community_reward(event)` and `private.safe_tz(text)` support it.
- **Triggers:** `event_activity_on_prayer` on `prayer_interactions` and `event_activity_on_pair` on `pair_intents`
  update progress and the community count as rows are saved. Any failure is logged as a warning and never blocks the
  prayer.
- **App RPCs:** `winter_event_state`, `claim_event_reward`, `mark_event_seen` and `set_event_notifications`. They're
  for signed-in users only.
- **Rewards:** claimed keepsakes go into `public.user_trinkets`. The community reward is a `scene:aurora` grant in
  `public.user_cosmetics` (source `grant`).
- **The Frost Lord companion:** `frostLord` is added to the pet-id checks on `group_members`, `pet_xp` and
  `pet_state`. `switch_pet()` accepts it, but only for someone who has received Snowcap.
- **Event reminders:** cron job `notify_winter_event` runs at `7 * * * *` and calls
  `private.dispatch_winter_event_if_due()`. That function calls the `notify-winter-event` Edge Function only when an
  opted-in person is at 9am local time and hasn't been notified today.
- **The Winter Lord look:** a `public.content_windows` row, `event:winterLord`.

**Not deployed yet:** the `notify-winter-event` Edge Function (`supabase/functions/notify-winter-event/index.ts`).
Deploy it by hand. Until then the cron job's calls fail harmlessly, and only when someone has opted in.

**Community target:** in the 30 days before Nov 18, 2026 there were 921 candles from 13 people, about 1,900 over the
event. The target is set to 2,000 instead of the spec's 1,000,000. Change it with:
`update public.events set config = jsonb_set(config, '{community_goal,target}', '5000') where id = 'long-winter-2026';`

**TESTING SETTINGS ARE ON.** The event and the Winter Lord look start 2026-11-18, and `allow_test_dates` is on so the
dev-only date picker works. Before launch, run:

```sql
update public.events
   set starts_on = '2026-12-01', config = jsonb_set(config, '{allow_test_dates}', 'false')
 where id = 'long-winter-2026';
update public.content_windows
   set opens_at = '2026-12-01 00:00'::timestamp at time zone 'America/New_York'
 where id = 'event:winterLord';
-- Optional: clear testers' progress and the counter so everyone starts fresh on Dec 1.
-- delete from public.user_event_progress where event_id = 'long-winter-2026';
-- update public.community_counters set value = 0, rewarded_at = null where event_id = 'long-winter-2026';
```

**Kill switch:** `update public.events set is_active = false where id = 'long-winter-2026';`

**Revert:** this deletes all event progress. Granted keepsakes and the Aurora scene stay with their owners. Put the old
`switch_pet()` and pet checks back only if nobody has the Frost Lord as their pet.

```sql
select cron.unschedule('notify_winter_event');
drop trigger if exists event_activity_on_prayer on public.prayer_interactions;
drop trigger if exists event_activity_on_pair on public.pair_intents;
drop function if exists public.winter_event_state(text, text, date);
drop function if exists public.claim_event_reward(text, text, date);
drop function if exists public.mark_event_seen(text, text, int);
drop function if exists public.set_event_notifications(text, boolean);
drop function if exists private.dispatch_winter_event_if_due();
drop function if exists private.on_event_activity();
drop function if exists private.evaluate_event(uuid, text, date);
drop function if exists private.grant_community_reward(text);
drop function if exists private.safe_tz(text);
drop table if exists public.community_counters;
drop table if exists public.user_event_progress;
drop table if exists public.events;
delete from public.content_windows where id = 'event:winterLord';
-- then re-run switch_pet and the three pet-id checks from 20261107_server_side_xp_and_nook.sql / 20261030_content_releases.sql
```

## Long Winter challenges any day (2026-11-18)

**Applied as:** `supabase/migrations/20261118_winter_challenges_anytime.sql`, through the Supabase connector on
2026-11-18. Checked with the updated `supabase/tests/long_winter_event.test.sql`: 28 checks passed, all rolled back.

**What:** all 10 challenges can now be done on any day of the event. Four of them used to be tied to dates:

- Advent Wreath (3 days in each Advent week) → **Four Candles**: pray 3 days in any 4 different weeks.
- Christmas Prayer (Dec 24 or 25) → **Silent Night**: pray after 9pm on 3 nights.
- Twelve Days (6 of Dec 25 – Jan 5) → **Twelve Days**: pray for 12 different people.
- Candlemas (any day Jan 24–31) → **Candlemas**: light a candle before 9am on 3 mornings.

The other six are unchanged. `private.evaluate_event()` gains three rule types for these: `weeks`, `hours` and
`people`; the old `days_in_range` and `wreath` types still work. The weekly keepsakes, the Advent wreath on the
event screen, and the Frost Mage's Dec 25 date are unchanged.

**Revert:** re-run the `insert into public.events … on conflict` and the `private.evaluate_event` sections of
`20261118_long_winter_event.sql`. Progress is recomputed on the next prayer or app open.

## Long Winter rewards on completion, no dates (2026-11-18)

**Applied as:** `supabase/migrations/20261118_winter_rewards_on_completion.sql`, through the Supabase connector on
2026-11-18. Checked with the updated `supabase/tests/long_winter_event.test.sql`: 26 checks passed, all rolled back.

**What:** nothing in the Long Winter is tied to a date any more, and finishing all 10 challenges gives the whole reward
straight away, with nothing to claim.

- The Frost Mage arrives as soon as 4 challenges are done. It no longer waits for Dec 25.
- The five winter keepsakes are no longer one per week (`config.weekly_rewards` is removed). All five come with
  finishing all 10 challenges (`config.completion_rewards`), straight into `public.user_trinkets`.
- The Frost Lord arrives the moment the 10th challenge is done (stage 3, and `rewards_claimed` records `frost_lord`
  plus the keepsakes). `claim_event_reward` is still there but the app no longer uses it.

**Revert:** run the `private.evaluate_event` section of `20261118_winter_challenges_anytime.sql`, then:
`update public.events set config = (config - 'completion_rewards') || jsonb_build_object('weekly_rewards', '[{"week":1,"keepsake":"adventWreath"},{"week":4,"keepsake":"christmasStar"},{"week":5,"keepsake":"winterSnowGlobe"},{"week":6,"keepsake":"threeKingsCrown"},{"week":9,"keepsake":"candlemasCandles"}]'::jsonb) where id = 'long-winter-2026';`
plus `jsonb_set(config, '{evolutions,1,unlock,not_before}', '"2026-12-25"')`. Keepsakes and Frost Lords already
given are kept.

## Long Winter reminders follow progress (2026-11-18)

**Applied as:** `supabase/migrations/20261118_winter_notifications_progress.sql`, through the Supabase connector on
2026-11-18.

**What:** a new column, `public.user_event_progress.notified` (text[], default `'{}'`). The `notify-winter-event` Edge
Function records each reminder it sends there (`start`, `mage`, `lord`, `halfway`, `last-<date>`), so each goes out at
most once. The reminders follow each person's progress instead of holiday dates: the start, the morning after the
Frost Mage, the morning after all 10 challenges, halfway (Jan 1), and the last three days. They're opt-in, at 9am
local time, at most one a day.

**Not deployed yet:** the updated Edge Function (`supabase/functions/notify-winter-event/index.ts`). Deploy it by hand.

**Revert:** `alter table public.user_event_progress drop column if exists notified;` (redeploy the older Edge
Function first, or it will fail to save).

## Long Winter launch settings applied, reminders deployed (2026-11-18)

- **Testing mode is OFF.** `supabase/migrations/20261118_winter_launch_settings.sql` is applied through the connector.
  The event starts 2026-12-01, `allow_test_dates` is false, and the `event:winterLord` window opens Dec 1 at midnight
  US Eastern. Checked afterwards: the event runs 2026-12-01 to 2027-01-31 and is active; the look runs 2026-12-01 to
  2027-02-01 05:00Z.
- **Edge Function `notify-winter-event` is deployed** (version 1, active, verify_jwt on), with the progress-based
  reminders.
- **Left from testing:** 3 rows in `user_event_progress`, one with Snowcap unlocked. A stage never goes down, so that
  tester keeps Snowcap. To start everyone fresh on Dec 1:
  `delete from public.user_event_progress where event_id = 'long-winter-2026';`
- **To test again:** set `starts_on` back to today and `allow_test_dates` to true, the reverse of the update above.

## Long Winter back in testing mode (2026-11-19)

The user is still testing, so `supabase/migrations/20261119_winter_testing_mode_on.sql` puts the event back to
starting 2026-11-18, with `allow_test_dates` on and the `event:winterLord` window open from Nov 18. Everyone who had
prayed since Nov 18 was re-checked, so their prayers count straight away.

**Before Dec 1, run `supabase/migrations/20261118_winter_launch_settings.sql` again** to leave testing mode.

## Long Winter: testing over, real schedule (2026-11-19)

**Applied as:** `supabase/migrations/20261119_winter_launch_settings_final.sql`, through the connector.

Checked afterwards:
- The event runs 2026-12-01 to 2027-01-31, is active, and `allow_test_dates` is false.
- The Winter look runs Dec 1 00:00 ET to Feb 1 00:00 ET.
- Noel the Donkey, the God With Us wallpaper and Shepherds' Field release Dec 1 00:00 ET, and Noel can be claimed Dec 1 – Jan 7.
- The `notify_winter_event` cron job is in place.

**Left from testing (the user hasn't decided yet):** 11 `user_event_progress` rows (6 with Snowcap from test prayers since
Nov 18), and the community counter at 5. To give everyone a clean start on Dec 1:
`delete from public.user_event_progress where event_id = 'long-winter-2026'; update public.community_counters set value = 0, rewarded_at = null where event_id = 'long-winter-2026';`

**Decision (2026-11-19):** the user said to keep the testing progress and the community count as they are ("they're from me"), so nothing was wiped.

## The Swamp King event (2026-11-19)

**Applied as:** `supabase/migrations/20261119_swamp_king_event.sql` (migration `swamp_king_event`), through the connector.
Tested with `supabase/tests/swamp_king_event.test.sql` (14/14 passed, rolled back).

What it added:
- **Event row** `swamp-king-2027`: Mar 1 to May 1, 2027, `allow_test_dates` false. It has 10 anytime challenges, Vesper on the
  first prayer, the Fen Warden at 4 challenges, and the Old King plus 5 keepsakes at 10.
- **Community counter** `fen_lights`, with a target of 2000.
- **Content window** `event:swampKing`: Mar 1 00:00 ET to May 2 00:00 ET.
- **New challenge types in `private.evaluate_event`:** `shared`, `journal`, `notes` and `quests`.
- **Four new triggers:** `event_activity_on_prayer_shared`, `event_activity_on_journal`, `event_activity_on_note` and
  `event_activity_on_quest`.
- **Pet-id checks** now allow `vesper`.
- **`switch_pet`** checks event-pet ownership by `events.config->>'pal_line'`.
- **Winter wording:** a `reminders` wording config was added to the winter row.
- **Edge function:** `notify-winter-event` was redeployed (version 2). Its reminder wording now comes from `config.reminders`.

**Revert:**
```sql
drop trigger if exists event_activity_on_prayer_shared on public.prayers;
drop trigger if exists event_activity_on_journal on public.biography_entries;
drop trigger if exists event_activity_on_note on public.reflections;
drop trigger if exists event_activity_on_quest on public.quest_completions;
delete from public.user_event_progress where event_id = 'swamp-king-2027';
delete from public.community_counters where event_id = 'swamp-king-2027';
delete from public.content_windows where id = 'event:swampKing';
delete from public.events where id = 'swamp-king-2027';
update public.events set config = config - 'reminders' where id = 'long-winter-2026';
-- evaluate_event / switch_pet / the pet-id checks: re-run their definitions from the earlier winter migrations
-- (the new challenge types and 'vesper' are harmless if left in place).
```

## Swamp King in testing mode (2026-11-19)

The user asked to set the date to March 1 for testing. **Applied as:** `supabase/migrations/20261119_swamp_testing_mode_on.sql`.
- The event now starts 2026-11-19, so real prayers count.
- `allow_test_dates` is on, so the "Mar 1" dev chip on /swamp works on the server too.
- The `event:swampKing` window opens 2026-11-19 00:00 ET.
- The dates people see still say Mar 1 (`real_starts_on`).
- After the re-check: 5 progress rows, 3 with Vesper.

**Revert / before release:** run `supabase/migrations/20261119_swamp_testing_mode_off.sql`. It has optional lines to wipe test progress.

## Testing: the user's own account skipped to the Old King (2026-11-19)

At the user's request, all 10 Swamp King challenges were marked done on their own account only. That account now has
`stage_unlocked = 3` and the 5 spring keepsakes in `user_trinkets`. The challenge list is recalculated on the next check
and drops back to what was really done, but the stage and keepsakes stay.

**Revert, for that account only:**
`delete from public.user_trinkets where user_id = '<their id>' and trinket_id in ('fenLantern','lentenCross','palmBranches','easterLilies','oldKingsCrown');`
`delete from public.user_event_progress where user_id = '<their id>' and event_id = 'swamp-king-2027';`
The swamp-testing-off step's optional wipe also covers the progress row.

## Testing: every companion at max for the user's own account (2026-11-19)

**New table, applied as `supabase/migrations/20261119_account_unlocks.sql`:** `public.account_unlocks (user_id, unlock)`.
- RLS lets an account read only its own rows, and only the database can add rows.
- An `'all_pets'` row makes every companion count as released and claimable in the app for that one account
  (`src/lib/releases.ts`).

**Data, for the user's account only:**
- An `all_pets` row.
- `pet_xp.banked_xp = 2450` (level 50, final stage) for all 22 companions.
- Long Winter `user_event_progress.stage_unlocked = 3`, so the Frost Lord line is owned. Vesper was already at 3.

**Revert:**
```sql
delete from public.account_unlocks where user_id = '<their id>';
-- pet_xp can't be restored exactly (earlier banked values weren't saved); to reset: delete from public.pet_xp where user_id = '<their id>';
delete from public.user_event_progress where user_id = '<their id>' and event_id = 'long-winter-2026';
-- to remove the feature entirely: drop table public.account_unlocks;
```

## Swamp King: testing over, real schedule, late-comer rules (2026-11-19)

**Applied as:** `supabase/migrations/20261119_swamp_launch_settings.sql`, through the connector.

The schedule:
- The event runs 2027-03-01 to 2027-05-01, with `allow_test_dates` false.
- The `event:swampKing` look runs Mar 1 00:00 ET to May 2 00:00 ET.

So that someone who joins on the last days can still finish everything:
- **`out_of_the_mire` and `feet_upon_a_rock`:** these were rule `prayers` (days prayed). They're now `candles` 20 and 40,
  which count the prayers prayed, repeats included. Their wording is now "Pray 20 / 40 spring prayers".
- **`steadfast`:** this was a 10-day streak. It's now `people` 15, "Pray for 15 different requests".
- Every swamp challenge now closes only when the event ends (`first_steps` needs one day).
- Everyone with swamp progress was re-checked. A stage already reached is kept.

**Tests:** `supabase/tests/swamp_king_event.test.sql` passes 17/17. That includes a late comer who starts Apr 30, finishes all 10
and gets the Old King on May 1.

**Kept from testing:** the user's own account (Old King, all companions at max, `account_unlocks`). The other test-day progress
was also kept: 3 accounts got Vesper from prayers on Nov 19.

**Revert (old rules):** put `out_of_the_mire` back to `{"type":"prayers","min":20}`, `feet_upon_a_rock` to `{"type":"prayers","min":40}`
and `steadfast` to `{"type":"streak","min":10}`, using the same `jsonb_set` shape as the migration.

## Long Winter: late-comer rules (2026-11-19)

**Applied as:** `supabase/migrations/20261119_winter_late_comer_rules.sql`. Like the Swamp King, every challenge now closes
only when the event ends, so someone who starts on Jan 30 can still finish all 10. The titles are unchanged.

| Challenge | Before | Now |
|---|---|---|
| `snow_like_wool` | prayers 15 (days) | candles 15, "Pray 15 winter prayers" |
| `word_melts` | prayers 40 (days) | candles 40, "Pray 40 winter prayers" |
| `four_candles` | weeks 4 | quests 4, "Finish 4 daily quests" |
| `silent_night` | hours 21-24 x3 | journal 3, "Write 3 journal entries" |
| `hoarfrost` | streak 7 | shared 2, "Share 2 prayer requests" |
| `candlemas` | hours 4-9 x3 | notes 3, "Send 3 encouragements" |

Everyone with winter progress was re-checked, and a stage already reached is kept.

**Test:** `supabase/tests/winter_late_comer.test.sql` passes 4/4. It covers someone who starts on Jan 30 and finishes all 10, the
Frost Lord and the 5 keepsakes on Jan 31.

**Revert:** set those six rules and their wording back with the same `jsonb_set` shape. The old values are in the first column
above: weeks `{"type":"weeks","min":4}`, hours `{"type":"hours","from_hour":21,"to_hour":24,"min":3}` and
`{"type":"hours","from_hour":4,"to_hour":9,"min":3}`, streak `{"type":"streak","min":7}`.

## Dev account: everything unlocked for the owner's account (2026-11-19)

**Applied as:** `supabase/migrations/20261119_dev_account.sql`. It widens the `account_unlocks.unlock` check to `('all_pets', 'dev')`.

**Data, for the owner's account only** (picked by e-mail when it ran):
- `account_unlocks` `'dev'`.
- `user_cosmetics`: all 90 `cosmetic_products` (nook scenes, decorations, bundles and Plus), source `'grant'`, no expiry. The
  RevenueCat webhook only ever deletes rows whose source is `'revenuecat'`, so these stay.
- `user_trinkets`: all 84 keepsakes (the 24 originals, 50 nook-collection, 5 winter and 5 swamp).
- From earlier: all 22 companions at level 50, and both events at stage 3.

**In the app** (`src/lib/releases.ts`): with `'dev'`, every scheduled companion, wallpaper, keepsake, scene and decoration counts as
out and nothing is in the vault. The event wallpapers can be picked any time (`prayerRoom.ts`). Two things still follow the real
calendar: the default wallpaper (`isOutForEveryone`), and event looks switching themselves on.

**Revert:**
```sql
-- with me as (select id from auth.users where email = '<owner>')
delete from public.account_unlocks where user_id = (select id from me);
delete from public.user_cosmetics where user_id = (select id from me) and source = 'grant';
delete from public.user_trinkets where user_id = (select id from me);  -- note: also removes keepsakes earned for real
```

## Keep what you earn, forever (2026-11-19)

**Applied as:** `supabase/migrations/20261119_keep_what_you_earned.sql`. This fixes `public.winter_event_state`, which returned no
progress once an event was switched off (`is_active` false). The app would then have forgotten that you'd met that event's
companion. A switched-off event now returns your saved progress, without re-checking it.

**App side:**
- A companion counts as yours for good if you've ever walked with it. That means it has a `pet_xp` row (even at 0 XP), it's your
  active companion, it has XP, or it's an event companion you've met.
- Prayer Pals, the companion page and the current-companion check all use this. An owned companion is never shown as
  "Arrives…", "Coming…" or in the vault, and you're never moved back to the default companion.

**Revert:** re-create `winter_event_state` without the `elsif uid is not null` branch (the version in
`20261118_long_winter_event.sql`).

## The Beloved: the Valentine event (2026-11-19)

**Applied as:** `supabase/migrations/20261119_beloved_event.sql`. Tests: `supabase/tests/beloved_event.test.sql` (14/14).
- `public.events` row `beloved-2027`: Feb 1 to Feb 28, 2027, between the Long Winter and the Swamp King. Companion line
  `beloved`: the Cherub (first prayer), the Muse (3 challenges) and The Beloved (all 6), plus four keepsakes
  (`loveLetter`, `roseBouquet`, `goldenLyre`, `marbleHeart`). Shorter and easier than the two-month events: 6 challenges, every
  one doable on any day (prayers, different requests, journal entries, encouragements). Her Seraph spirit form is only a
  look in the app (`config.forms`), so the database just needs stage 3.
- `community_counters` `garden_of_candles` (target 1,500, unlocks `scene:blossom`).
- `content_windows` `event:beloved`: Feb 1 00:00 ET to Mar 1 00:00 ET (the rose-garden look).
- `'beloved'` added to the pet-id checks on `group_members`, `pet_xp` and `pet_state`, and to `switch_pet()`.

**Revert:**
```sql
delete from public.user_event_progress where event_id = 'beloved-2027';
delete from public.community_counters where event_id = 'beloved-2027';
delete from public.events where id = 'beloved-2027';
delete from public.content_windows where id = 'event:beloved';
-- then re-add the pet-id checks and switch_pet() without 'beloved' (the versions in 20261119_swamp_king_event.sql)
```

## Beloved testing mode ON, then OFF (2026-11-19)

**Applied as:** `supabase/migrations/20261119_beloved_testing_mode_on.sql`. The event and its look start today (2026-11-19)
instead of Feb 1, so TestFlight builds show it and real prayers count. Everything people see still says Feb 1
(`config.real_starts_on`). Turn it off before release with `20261119_beloved_testing_mode_off.sql` (run 2026-11-19, testing done): it puts the
dates back and zeroes the community count.

**Revert:** run `20261119_beloved_testing_mode_off.sql`.

## Beloved intro reset for the dev account (2026-11-19)

Data only, at the owner's request (to see the first-open intro again): on the dev account's `beloved-2027` progress row,
`intro_seen_at` was set to null and `stage_seen` to 0, so the "Meet the Beloved" clip auto-plays again, then the Cherub
celebration. The Cherub itself (stage 1) is kept.

**Revert:** nothing to undo; playing the clip marks it seen again.

## Storage bucket for the event intro clips (2026-11-19)

**Applied as:** migration `event_clips_bucket` (via the connector). A public bucket `event-clips` (video/mp4 only, 15 MB per file)
for the three intro clips, which the app now streams instead of bundling them, saving about 21 MB of download size:
`face-the-winter-lord.mp4`, `meet-the-beloved.mp4`, `face-the-swamp-king.mp4`. The source files are in
`design/event-clips/`. They're uploaded by hand in the dashboard (Storage → event-clips → Upload); there's no upload policy, so
only the dashboard or the service role can add files.

**Revert:** empty the bucket in the dashboard, then `delete from storage.buckets where id = 'event-clips';`, and put the clips
back as bundled `require()`s in `src/components/winter/winterUi.tsx`.

## Pretend day for testing mode (2026-11-19)

**Applied as:** `supabase/migrations/20261119_event_test_today.sql`. While an event's `config.allow_test_dates` is on,
`winter_event_state` checks the event as of `config.test_today` (unless a dev build sends its own date), and the app
shows that day too. Set to `"2027-02-01"` on `beloved-2027`, so testing on TestFlight looks like Feb 1, while prayers
prayed now still count. `20261119_beloved_testing_mode_off.sql` now removes `test_today`.

**Revert:** re-create `winter_event_state` from `20261119_keep_what_you_earned.sql`, and
`update public.events set config = config - 'test_today' where id = 'beloved-2027';`

## Dev account: every event challenge counts as done (2026-11-19)

**Applied as:** `supabase/migrations/20261119_dev_account_all_challenges.sql`, at the owner's request ("max out my account
with all quests completed"). It patches the live `private.evaluate_event` in place: one block added before the weekly
keepsakes. For accounts with an `account_unlocks` `'dev'` row, every challenge counts as done and none as closed, so
every event shows finished, with its final stage and keepsakes. Then the dev account's events were re-checked: the Beloved
(6/6, stage 3, 4 keepsakes), the Long Winter (10/10) and the Swamp King (10/10). Everyone else is unaffected.

**Revert:** take the block back out:
```sql
do $$ declare src text := pg_get_functiondef('private.evaluate_event(uuid,text,date)'::regprocedure);
begin execute regexp_replace(src, '  -- dev accounts: every challenge counts as done.*?  end if;\n\n', '', 's'); end $$;
```
