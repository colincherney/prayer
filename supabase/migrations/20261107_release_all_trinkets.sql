-- Releases all 24 prayer nook trinkets now, instead of two at a time from Nov 14, 2026 to Oct 2027.
-- Safe to run again. See #9 in supabase/SQL_CHANGES.md for the revert.
update public.content_releases set release_at = '2026-11-07T05:00:00Z' where id like 'trinket:%';
