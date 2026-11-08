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

## Dashboard settings (not SQL)

- **Allow manual linking**: needed for "create an account to keep everything". Turn on in Authentication settings. (Done.)
- **Site URL** `prayer://` and redirect URL `prayer://**`. (Done.)
- **Confirm email**: currently OFF for testing. Turn it back ON once custom SMTP is set up.
- **Captcha protection: leave OFF.** The app has no captcha step, so turning it on would block every sign-in and anonymous sign-in.
- **Leaked password protection**: optional, safe to enable (may need a paid plan).
