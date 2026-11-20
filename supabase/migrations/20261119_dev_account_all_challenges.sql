-- Dev accounts (public.account_unlocks 'dev', the owner's own account) count every event challenge as done, so the
-- owner can see each event fully finished: all challenges ticked, the final stage, and the keepsakes. Before this, a
-- skipped-ahead account's challenge list dropped back to what was really done on the next check. Applied 2026-11-19 by
-- patching the live private.evaluate_event in place (one block added before the weekly keepsakes), so nothing else in
-- the function changes. Everyone else is unaffected.
do $patch$
declare
  src text := pg_get_functiondef('private.evaluate_event(uuid,text,date)'::regprocedure);
  marker constant text := E'  ws := coalesce((c->>''weeks_start'')::date, e.starts_on);';
  block constant text := E'  -- dev accounts: every challenge counts as done (supabase/migrations/20261119_dev_account_all_challenges.sql)\n'
    || E'  if exists (select 1 from public.account_unlocks a where a.user_id = p_user and a.unlock = ''dev'') then\n'
    || E'    done := array(select x->>''key'' from jsonb_array_elements(coalesce(c->''challenges'', ''[]'')) x);\n'
    || E'    closed := ''{}'';\n'
    || E'  end if;\n\n';
begin
  if position('dev accounts: every challenge counts as done' in src) > 0 then
    return; -- already patched
  end if;
  if (length(src) - length(replace(src, marker, ''))) / length(marker) <> 1 then
    raise exception 'evaluate_event changed: the patch point was not found exactly once';
  end if;
  execute replace(src, marker, block || marker);
end;
$patch$;

-- Re-check the dev account's events now, so the app shows them finished straight away.
select private.evaluate_event(a.user_id, ev.id, null)
  from public.account_unlocks a cross join public.events ev
 where a.unlock = 'dev' and ev.is_active;
