-- Dev accounts: an account_unlocks row 'dev' unlocks everything in the app for that one account (src/lib/releases.ts):
-- every scheduled companion, wallpaper, keepsake, nook scene and decoration counts as released, nothing is in the
-- vault, and the event wallpapers can be picked any time. Owned things are granted as rows. Applied 2026-11-19 for
-- the owner's account at their request (the account was picked by e-mail when it ran; no id is stored here).
alter table public.account_unlocks drop constraint if exists account_unlocks_unlock_check;
alter table public.account_unlocks add constraint account_unlocks_unlock_check check (unlock in ('all_pets', 'dev'));

-- What was granted to that account:
--   account_unlocks 'dev'
--   user_cosmetics: every cosmetic_products row (scenes, decorations, bundles, Plus), source 'grant', no expiry
--   user_trinkets: every keepsake the app knows (84):
--     'firstLightCandle','loavesFishesBasket','chapelSnowGlobe','shepherdLambPlush','olivewoodRosary','mustardSeedJar','oliveBranchVase','quillPrayerJournal','lilyOfTheField','sevenbellChime','hourglassOfStillness','doveMusicBox','goldenPotOfManna','psalmHarp','nightWatchLantern','harborLighthouse','fishersNet','galaxyPromiseJar','arkInABottle','roseWindowSuncatcher','covenantPrism','jacobsLadderMobile','unburntBushBonsai','pearlOfGreatPrice','oillamp','bell','loaf','applebasket','advent','paperstar','acorn','donkeyplush','manger','honey','pinecone','psalter','cairn','crossstand','teacup','pomegranate','sparrow','sacredcandle','figbowl','compass','hyssop','key','scroll','arkboat','alabaster','crownlife','flute','mites','crystaldove','birdfeeder','tiffany','globeworld','canajar','mustardtree','spinner','cloudmobile','olivewreath','shell','bunting','shellchime','fireflyjar','censer','moonmobile','prismcatcher','well','cushions','figtree','chest','organ','fountain','adventWreath','christmasStar','winterSnowGlobe','threeKingsCrown','candlemasCandles','fenLantern','lentenCross','palmBranches','easterLilies','oldKingsCrown'
--   pet_xp 2450 (level 50) for all 22 companions and both events at stage 3 (earlier, see SQL_CHANGES.md)
