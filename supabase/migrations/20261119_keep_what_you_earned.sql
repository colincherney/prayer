-- What you earn is yours forever. public.winter_event_state used to return no progress at all once an event was
-- switched off (is_active false), so the app would forget that you had met its companion (the Frost Lord, Vesper).
-- Now a switched-off event still returns your saved progress, just without re-checking it. switch_pet already checks
-- ownership from user_event_progress regardless of dates or is_active. Applied 2026-11-19.
create or replace function public.winter_event_state(p_event text, p_tz text default null::text, p_today date default null::date)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  uid uuid := auth.uid();
  e public.events%rowtype;
  pr public.user_event_progress%rowtype;
  cv bigint;
  crew timestamptz;
begin
  select * into e from public.events where id = p_event;
  if not found then
    return jsonb_build_object('found', false);
  end if;
  select cc.value, cc.rewarded_at into cv, crew from public.community_counters cc
   where cc.event_id = e.id and cc.key = e.config->'community_goal'->>'key';
  if uid is not null and e.is_active then
    if p_tz is not null then
      insert into public.user_event_progress (user_id, event_id, tz) values (uid, e.id, private.safe_tz(p_tz))
      on conflict (user_id, event_id) do update set tz = excluded.tz;
    end if;
    if not coalesce((e.config->>'allow_test_dates')::boolean, false) then
      p_today := null;
    end if;
    pr := private.evaluate_event(uid, e.id, p_today);
  elsif uid is not null then
    -- switched off: nothing is re-checked, but what you earned is still yours
    select * into pr from public.user_event_progress where user_id = uid and event_id = e.id;
  end if;
  return jsonb_build_object(
    'found', true,
    'event', jsonb_build_object('id', e.id, 'title', e.title, 'starts_on', e.starts_on, 'ends_on', e.ends_on,
                                'is_active', e.is_active, 'config', e.config),
    'progress', case when pr.user_id is null then null else to_jsonb(pr) end,
    'community', jsonb_build_object('value', coalesce(cv, 0),
                                    'target', coalesce((e.config->'community_goal'->>'target')::bigint, 0),
                                    'rewarded', crew is not null)
  );
end;
$function$;
