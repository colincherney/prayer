-- Run in a transaction; no fixture data, claims, or tokens are committed.
begin;
set local statement_timeout = '15s';
insert into auth.users(id, email, raw_user_meta_data) values
  ('a1000000-0000-0000-0000-000000000001', 'notification-author@example.invalid', '{}'),
  ('a1000000-0000-0000-0000-000000000002', 'notification-member@example.invalid', '{}'),
  ('a1000000-0000-0000-0000-000000000003', 'notification-muted@example.invalid', '{}'),
  ('a1000000-0000-0000-0000-000000000004', 'notification-outsider@example.invalid', '{}');
insert into public.groups(id, name, created_by) values
  ('b1000000-0000-0000-0000-000000000001', 'Notification test circle', 'a1000000-0000-0000-0000-000000000001');
insert into public.group_members(group_id, user_id, role, joined_at) values
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'owner', now() - interval '1 day'),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'member', now() - interval '1 day'),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'member', now() - interval '1 day');
insert into public.group_notification_preferences(group_id, user_id, prayers_enabled) values
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', false);
insert into public.prayers(id, user_id, body, approved, group_id) values
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Test group prayer', 'y', 'b1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Test public prayer', 'y', null),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Test pending prayer', 'n', 'b1000000-0000-0000-0000-000000000001');
do $$ begin
  assert (select count(*) = 1 from public.group_prayer_notification_queue), 'Only the eligible member gets a new approved group alert';
  assert (select user_id = 'a1000000-0000-0000-0000-000000000002' from public.group_prayer_notification_queue), 'Author and muted members excluded';
end $$;
update public.prayers set approved = 'y' where id = 'c1000000-0000-0000-0000-000000000003';
update public.prayers set approved = 'y' where id = 'c1000000-0000-0000-0000-000000000001';
do $$ begin
  assert (select count(*) = 2 from public.group_prayer_notification_queue), 'Approval queues once; edits do not duplicate alerts';
  begin
    insert into public.group_notification_preferences(group_id, user_id) values
      ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004');
    raise exception 'Nonmember preference unexpectedly accepted';
  exception when foreign_key_violation then null; end;
end $$;

-- Exercise settings as an actual authenticated member, including denied writes.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000002', true);
insert into public.group_notification_preferences(group_id, user_id, prayers_enabled) values
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', false);
do $$ begin
  assert (select count(*) = 1 from public.group_notification_preferences), 'Preferences of other members must be private';
  begin
    update public.group_notification_preferences set user_id = 'a1000000-0000-0000-0000-000000000004';
    raise exception 'Preference reassignment unexpectedly allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform * from public.group_prayer_notification_queue;
    raise exception 'Client unexpectedly read outbox';
  exception when insufficient_privilege then null; end;
  begin
    perform * from public.claim_group_prayer_notifications();
    raise exception 'Client unexpectedly claimed notifications';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
  assert (select count(*) = 0 from public.claim_group_prayer_notifications()), 'Opting out suppresses already queued alerts';
end $$;
update public.group_notification_preferences set prayers_enabled = true where user_id = 'a1000000-0000-0000-0000-000000000002';
do $$ begin
  assert (select count(*) = 2 from public.claim_group_prayer_notifications()), 'Eligible queued alerts claimed';
  assert (select count(*) = 0 from public.claim_group_prayer_notifications()), 'Overlapping cron run cannot claim active leases';
  assert (select count(*) = 2 from public.claim_group_prayer_notifications(now() + interval '6 minutes')), 'Failed group delivery becomes retryable';
end $$;
delete from public.group_members where user_id = 'a1000000-0000-0000-0000-000000000002';
do $$ begin
  assert (select count(*) = 0 from public.group_prayer_notification_queue), 'Leaving removes pending alerts';
  assert not exists(select 1 from public.group_notification_preferences where user_id = 'a1000000-0000-0000-0000-000000000002'), 'Leaving removes preferences';
end $$;

insert into public.notification_preferences(user_id, reflection_reminder_enabled, reflection_reminder_started_at, timezone) values
  ('a1000000-0000-0000-0000-000000000001', true, '2026-11-10T19:00:00-07:00', 'America/Phoenix'),
  ('a1000000-0000-0000-0000-000000000002', true, '2026-11-10T19:00:00-07:00', 'America/Phoenix');
insert into public.push_tokens(user_id, token, platform) values
  ('a1000000-0000-0000-0000-000000000001', 'ExponentPushToken[notification-test-author]', 'ios'),
  ('a1000000-0000-0000-0000-000000000002', 'ExponentPushToken[notification-test-noprayers]', 'ios');
do $$ begin
  assert (select count(*) = 0 from public.claim_prayer_reflection_reminders('2026-11-11T19:00:00-07:00')), 'Wait a full cadence before first reminder';
  assert (select count(*) = 0 from public.claim_prayer_reflection_reminders('2026-11-12T18:59:00-07:00')), 'Respect the selected local hour';
  assert (select count(*) = 1 from public.claim_prayer_reflection_reminders('2026-11-12T19:05:00-07:00')), 'Catch up after the hour, only with posted prayers';
  assert (select count(*) = 0 from public.claim_prayer_reflection_reminders('2026-11-12T20:00:00-07:00')), 'No duplicate reflection reminder that day';
  assert (select count(*) = 0 from public.claim_prayer_reflection_reminders('2026-11-13T19:00:00-07:00')), 'No reflection reminder on intervening day';
  assert (select count(*) = 1 from public.claim_prayer_reflection_reminders('2026-11-14T19:00:00-07:00')), 'Reflection repeats every two days';
end $$;
update public.notification_preferences set reflection_reminder_enabled = false where user_id = 'a1000000-0000-0000-0000-000000000001';
do $$ begin
  assert (select count(*) = 0 from public.claim_prayer_reflection_reminders('2026-11-20T19:00:00-07:00')), 'Disabled reminders never claim';
end $$;
update public.notification_preferences set reflection_reminder_enabled = true, reflection_reminder_interval_days = 7
  where user_id = 'a1000000-0000-0000-0000-000000000001';
do $$ begin
  assert (select reflection_reminder_started_at = now() and reflection_reminder_last_sent_date is null
    from public.notification_preferences where user_id = 'a1000000-0000-0000-0000-000000000001'), 'Enabling/changing cadence resets the schedule';
end $$;
update public.notification_preferences set reflection_reminder_started_at = '2026-11-10T19:00:00-07:00'
  where user_id = 'a1000000-0000-0000-0000-000000000001';
do $$ begin
  assert (select count(*) = 0 from public.claim_prayer_reflection_reminders('2026-11-16T19:00:00-07:00')), 'Weekly reminders wait seven days';
  assert (select count(*) = 1 from public.claim_prayer_reflection_reminders('2026-11-17T19:00:00-07:00')), 'Weekly reminders are due on day seven';
end $$;
update public.notification_preferences set reflection_reminder_interval_days = 3
  where user_id = 'a1000000-0000-0000-0000-000000000001';
update public.notification_preferences set reflection_reminder_started_at = '2026-11-10T19:00:00-07:00'
  where user_id = 'a1000000-0000-0000-0000-000000000001';
do $$ begin
  assert (select count(*) = 0 from public.claim_prayer_reflection_reminders('2026-11-12T19:00:00-07:00')), 'Three-day reminders wait three days';
  assert (select count(*) = 1 from public.claim_prayer_reflection_reminders('2026-11-13T19:00:00-07:00')), 'Three-day reminders are due on day three';
end $$;
update public.notification_preferences set timezone = 'invalid-timezone'
  where user_id = 'a1000000-0000-0000-0000-000000000001';
do $$ begin
  assert (select count(*) = 1 from public.claim_prayer_reflection_reminders('2026-11-16T20:00:00Z')), 'Invalid timezones fall back to UTC without blocking other users';
end $$;
delete from public.push_tokens where user_id = 'a1000000-0000-0000-0000-000000000001';
do $$ begin
  assert (select count(*) = 0 from public.claim_prayer_reflection_reminders('2026-11-20T20:00:00Z')), 'No device means no reflection claim';
end $$;
insert into public.push_tokens(user_id, token, platform) values
  ('a1000000-0000-0000-0000-000000000001', 'ExponentPushToken[notification-test-author]', 'ios');
delete from public.prayers where user_id = 'a1000000-0000-0000-0000-000000000001';
do $$ begin
  assert (select count(*) = 0 from public.claim_prayer_reflection_reminders('2026-11-20T20:00:00Z')), 'Deleting all posted prayers stops reflection reminders';
end $$;
select 'Prayer notification database tests passed' as result;
rollback;
