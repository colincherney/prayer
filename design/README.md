# Saint Central pet designs (handoff for Claude Code)

These are design mockups from the Claude app's design canvas. Each `.dc.html`
file is one screen or board: plain HTML with inline SVG art, CSS keyframe
animations, and a small JavaScript `Component` class at the bottom that holds
the interactive logic. Treat them as the visual and behavioral spec, not as
code to ship.

## Files

| File | What it is |
|---|---|
| `Main.dc.html` | Pray page ("How will you pray?"), Pokémon GO style: pet on a level arc, 6 round action buttons, XP and level-up animation |
| `Me.dc.html` | "Your walk" profile page: the pet nook (sleeping pet, prayer web, decor slots, scenes, time-of-day lighting, set bonuses) |
| `Lamb.dc.html` | Pip the Lamb, 3 evolution stages |
| `Dove.dc.html` | Olive the Dove, 3 evolution stages |
| `Lion.dc.html` | Judah the Lion, 3 evolution stages |
| `Ember.dc.html` | Ember the candle, 3 evolution stages |
| `Dragon.dc.html` | Selah the sea dragon, 3 evolution stages |
| `Concepts.dc.html` | Early one-card-per-pet concept board |
| `ANIMATIONS.md` | Every animation: timing, easing, triggers, Reanimated porting notes. Read this before building any pet or screen |
| `canvas.json` | Board layout index (ignore for the app) |

## Brand

Background `#0A111C`, cards `#16202D`, cream text `#F2E9D8`, mint accent
`#8FC6A9`, gold `#F2C462`. Headings Playfair Display, body Inter.

## Porting notes

- Pet art is SVG: port to `react-native-svg` components (one per pet stage).
- CSS keyframes (bob, blink, flap, flicker, sway, hop) map to Reanimated
  looping animations; respect the OS reduce-motion setting.
- XP rules in the mockups: share request +20, pray for others +10, pray right
  now +15, group +10, journal +5; 50 XP per level (tunable).
- Evolution stages: levels 1–4, 5–9, 10+.
- Premium (Saint Central+) items are cosmetic only; praying and evolving stay free.
- Keep Supabase schema changes minimal; award XP from rows added to
  `prayers` and `prayer_interactions`.
