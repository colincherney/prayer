# Product

<!-- impeccable:product-schema 1 -->

## Platform

ios

(Expo / React Native app shipped to the App Store and tested on TestFlight. It also builds for Android and web, but iPhone is the primary target. The visual language is Saint Central's own, not stock iOS.)

## Users

People who pray and want others praying with them, without being known. Two kinds of group use matter equally:

- **Church and parish members** who join a private circle with a code their church or ministry leader shares.
- **Friends, family, and strangers** in small private circles or public "open circles" anyone can join.

Many users are guests (anonymous accounts). They use the whole app; an account is only needed to buy something.

## Product Purpose

Saint Central lets people share prayer requests and pray for one another anonymously, alone or in groups. A companion pet grows as you pray. Success means people share what's on their heart, others actually pray for it, and the person who asked knows they were prayed for.

## Positioning

Fully anonymous prayer, with a companion pet and a shared group hearth making praying together feel warm and alive instead of like a message board. No names appear anywhere: not on prayers, not on encouragement notes, not by the hearth.

## Operating Context

- Two kinds of group, both fully anonymous: **private** (join only with the code) and **public** (listed as open circles, anyone can join). Neither ever shows a personal identifier, not even to the owner.
- Groups: join by a 6-character code (people often paste the whole share message), browse public open circles, or start your own. Owners can delete a group; members can leave.
- A group page holds the hearth (every member's companion resting by a fire, decorated via /groupNook), the invite code to share, a "share a prayer" action, and the prayer feed with "I prayed" counts and anonymous 140-character encouragement notes.
- Seasonal events (Winter Lord, Beloved, Swamp King) run throughout the year and count prayers toward challenges.

## Capabilities and Constraints

- Supabase backend: `groups`, `group_members` (role, pet_id, pet_stage), `prayers` (group_id, approved), `prayer_interactions`, `group_nooks`. RPCs `join_group`, `set_my_group_pet`; edge function `submit-reflection` (moderated notes).
- Pages cache their last state on the phone so they draw instantly.
- Light and dark themes via `useTheme`; fonts Playfair Display (display) and Inter (body).
- Code must stay compatible with Expo SDK 58 and 54.

## Brand Commitments

- Name: Saint Central. Voice: gentle, warm, plain, reassuring ("No names, ever", "no one will know it's you").
- **Total anonymity** is non-negotiable.
- **Companion pets** (lamb, dove, lion, ember, sea dragon, and event pets) and the cozy game feel are core.
- **Praying is free**; purchases are cosmetic only.
- **Guests get everything** except buying.

## Evidence on Hand

Pet art and screen mockups in `design/` (*.dc.html, ANIMATIONS.md). No testimonials, user counts, or church partnerships are recorded; don't invent any.

## Product Principles

1. Anonymity first: any design that could expose who wrote or prayed something is wrong.
2. Praying is the main action; every screen should make it easy to pray for someone and to know you were prayed for.
3. Warmth over utility: groups should feel like gathering around a fire, not a forum.
4. Earned things are forever, and the core is always free.
