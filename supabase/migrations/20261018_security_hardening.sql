-- Security hardening, applied to the live project on 2026-10-18. See supabase/SQL_CHANGES.md for what each part
-- does and how to revert it.

-- 1. Group-private prayers. "Anyone can read prayers" (every signed-in user, always true) was also letting people
--    read prayers posted inside private groups, because policies combine with OR. Remove it so only the group-aware
--    rule applies, and limit that rule to signed-in users (anonymous app users are signed in; only visitors with no
--    session at all lose access).
drop policy if exists "Anyone can read prayers" on public.prayers;
drop policy if exists "group prayers members only" on public.prayers;
create policy "group prayers members only"
  on public.prayers for select
  to authenticated
  using ((group_id is null) or (user_id = auth.uid()) or public.is_group_member(group_id));

-- 2. Notes sent to a prayer: only the person who wrote one and the owner of the prayer can read it
--    (the app only ever reads them in those two situations).
drop policy if exists "reflections_read_all" on public.reflections;
drop policy if exists "reflections owner of prayer can read" on public.reflections;
create policy "reflections owner of prayer can read"
  on public.reflections for select
  to authenticated
  using (exists (select 1 from public.prayers p where p.id = reflections.prayer_id and p.user_id = auth.uid()));

-- 3. Visitors with no session at all (the "anon" role) do not need the app's tables. Signed-in users, including
--    anonymous sign-ins, are the "authenticated" role and are unaffected. The Bible text tables stay publicly readable.
revoke all on public.users, public.prayers, public.prayer_interactions, public.reflections,
  public.pair_intents, public.pair_matches, public.prayer_updates, public.prayer_interaction_schedule,
  public.push_tokens, public.notification_preferences, public.notifications_config,
  public.biography_entries, public.groups, public.group_members from anon;

-- 4. Internal functions should not be callable through the public API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.process_prayer_interaction_schedule() from public, anon, authenticated;
grant execute on function public.process_prayer_interaction_schedule() to postgres, service_role;

-- Group functions: signed-in users (anonymous ones included) keep access; people with no session lose it.
revoke execute on function public.create_group(text, text, boolean) from public, anon;
revoke execute on function public.join_group(uuid, text) from public, anon;
revoke execute on function public.is_group_member(uuid) from public, anon;
grant execute on function public.create_group(text, text, boolean) to authenticated, service_role;
grant execute on function public.join_group(uuid, text) to authenticated, service_role;
grant execute on function public.is_group_member(uuid) to authenticated, service_role;

-- 5. Pin the search path on the two functions that did not set one.
alter function public.generate_invite_code() set search_path = public;
alter function public.handle_new_user() set search_path = public;
