-- The Long Winter: every challenge doable by someone who joins late (even Jan 30-31), like the Swamp King
-- (20261119_swamp_launch_settings.sql). Titles stay; only the rule and the wording change. Applied 2026-11-19.
--  * snow_like_wool, word_melts: "Reach 15 / 40 winter prayers" counted DAYS prayed -> now prayers ('candles' counts
--    prayers prayed in the window, repeats included): "Pray 15 / 40 winter prayers".
--  * four_candles: "Pray 3 days in 4 different weeks" -> "Finish 4 daily quests".
--  * silent_night: "Pray after 9pm on 3 nights" -> "Write 3 journal entries".
--  * hoarfrost: "Keep a 7-day streak" -> "Share 2 prayer requests".
--  * candlemas: "Light a candle before 9am on 3 mornings" -> "Send 3 encouragements".
-- Unchanged (already only close when the event ends): first_light, stranger, two_souls, twelve_days.
update public.events
   set config = jsonb_set(config, '{challenges}',
         (select jsonb_agg(
            case ch->>'key'
              when 'snow_like_wool' then ch || '{"rule": {"type": "candles", "min": 15}, "detail": "Pray 15 winter prayers"}'
              when 'word_melts' then ch || '{"rule": {"type": "candles", "min": 40}, "detail": "Pray 40 winter prayers"}'
              when 'four_candles' then ch || '{"rule": {"type": "quests", "min": 4}, "detail": "Finish 4 daily quests"}'
              when 'silent_night' then ch || '{"rule": {"type": "journal", "min": 3}, "detail": "Write 3 journal entries"}'
              when 'hoarfrost' then ch || '{"rule": {"type": "shared", "min": 2}, "detail": "Share 2 prayer requests"}'
              when 'candlemas' then ch || '{"rule": {"type": "notes", "min": 3}, "detail": "Send 3 encouragements"}'
              else ch
            end order by ord)
            from jsonb_array_elements(config->'challenges') with ordinality as t(ch, ord)))
 where id = 'long-winter-2026';

-- Re-check everyone with winter progress under the new rules (a stage already reached is kept).
select private.evaluate_event(p.user_id, 'long-winter-2026', null)
  from public.user_event_progress p where p.event_id = 'long-winter-2026';
