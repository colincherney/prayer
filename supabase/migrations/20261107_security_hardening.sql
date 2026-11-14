-- Security hardening (2026-11-07). See supabase/SQL_CHANGES.md #14 for the revert.

-- 1. Any signed-in user could rewrite any push token row and take it over. The app registers tokens through
--    register_push_token(), and the edge functions use the service role, so nothing needs this policy.
drop policy if exists "push_tokens claim ownership" on public.push_tokens;

-- 2. Every signed-in user could read every prayer interaction, including who prayed on private group prayers.
--    Now: your own interactions, plus interactions on prayers you can already see (the prayers policy decides).
drop policy if exists "Anyone can read interactions" on public.prayer_interactions;
create policy "interactions on visible prayers" on public.prayer_interactions
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.prayers p where p.id = prayer_interactions.prayer_id)
  );

-- 3. Server-only tables (one holds the service role key). RLS already blocks them; removing the grants means a
--    dropped or mistaken policy later can't expose them. Edge functions and cron use the service role / postgres.
revoke all on public.notifications_config, public.pair_intents, public.pair_matches,
  public.prayer_interaction_schedule from anon, authenticated;

-- 4. set_my_group_pet stored any text and number, which other members' screens then load.
create or replace function public.set_my_group_pet(p_group uuid, p_pet text, p_stage integer)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  if p_pet is null or p_pet !~ '^[a-z]{2,20}$' or p_stage is null or p_stage not between 1 and 3 then
    raise exception 'invalid_pet';
  end if;
  update public.group_members
     set pet_id = p_pet, pet_stage = p_stage
   where group_id = p_group and user_id = auth.uid();
end;
$function$;
