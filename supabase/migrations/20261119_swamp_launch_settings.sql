-- The Swamp King leaves testing mode and goes on its real schedule: Mar 1 to May 1, 2027 (look from Mar 1 00:00 ET to
-- May 2 00:00 ET), dev date override off. Applied 2026-11-19.
--
-- Also makes every challenge doable by someone who joins late (even in the last days):
--  * "Reach 20 / 40 spring prayers" counted DAYS prayed (rule 'prayers'), so anyone starting after mid-April could
--    never reach them. They now count prayers ('candles' in evaluate_event is the number of prayers prayed in the
--    event window, repeats included), so they can be done any day.
--  * "Keep a 10-day streak" needed 10 days left. It's now "Pray for 15 different requests" (rule 'people'), which only
--    closes when the event ends.
-- The rest (share, journal, encouragements, daily quests, partner sessions, candles) only close at the end already.
update public.events
   set starts_on = '2027-03-01',
       config = jsonb_set(
         jsonb_set(config, '{allow_test_dates}', 'false'),
         '{challenges}',
         (select jsonb_agg(
            case ch->>'key'
              when 'out_of_the_mire' then ch || '{"rule": {"type": "candles", "min": 20}, "detail": "Pray 20 spring prayers"}'
              when 'feet_upon_a_rock' then ch || '{"rule": {"type": "candles", "min": 40}, "detail": "Pray 40 spring prayers"}'
              when 'steadfast' then ch || '{"rule": {"type": "people", "min": 15}, "detail": "Pray for 15 different requests"}'
              else ch
            end order by ord)
            from jsonb_array_elements(config->'challenges') with ordinality as t(ch, ord)))
 where id = 'swamp-king-2027';

update public.content_windows
   set opens_at = '2027-03-01 00:00'::timestamp at time zone 'America/New_York',
       closes_at = '2027-05-02 00:00'::timestamp at time zone 'America/New_York'
 where id = 'event:swampKing';

-- Re-check everyone who has progress, under the new rules (a stage already reached is kept).
select private.evaluate_event(p.user_id, 'swamp-king-2027', null)
  from public.user_event_progress p where p.event_id = 'swamp-king-2027';
