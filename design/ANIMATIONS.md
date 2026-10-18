# Saint Central animation spec

Every animation in the design files, with timing, easing and triggers, so it
can be rebuilt in React Native with Reanimated. "Loop" means repeat forever.
Transform origins are given relative to the shape's own box (e.g. "base" =
bottom center).

## How to port (general)

- Loops: `withRepeat(withSequence(withTiming(...), withTiming(...)), -1)`.
- Delays/staggers: `withDelay(ms, ...)`.
- One-shot bouncy moves (hop, growth): `withSpring` or `withTiming` with
  `Easing.bezier(0.3, 1.6, 0.5, 1)`.
- SVG props (opacity, stroke-dashoffset, r): `useAnimatedProps` on
  `Animated.createAnimatedComponent(Path/Circle)` from react-native-svg.
- Reduced motion: check `useReducedMotion()`; when true, stop all loops,
  show static end states (web fully drawn, no particles, z's static at 70%
  opacity), and make one-shot moves instant.

## Shared building blocks

| Name | What it does | Timing |
|---|---|---|
| bob | Whole pet floats up and down: translateY 0 → −6/−7px → 0 | 3–3.2s ease-in-out, loop; stagger copies by 0.6s |
| blink | Eyes squash shut: scaleY 1 → 0.1 at 94% of cycle → 1 | 4.2s loop, origin center |
| twinkle | Sparkle/star: opacity 0.2 → 1, scale 0.6–0.7 → 1.1 | 1.8–2.2s ease-in-out loop; delays 0 / 0.6–0.7s / 1.2–1.4s |
| glow | Soft halo circle behind a pet or light: opacity ~0.1 → ~0.26 | 2.4–3s ease-in-out loop |

## Pray page (Main.dc.html)

Idle:
- Pet **bob** (3s, −6px) and **blink**.
- **Halo float** (level 3+): gold ring above head, translateY 0 → −4px, 2.4s loop.
- **Sparkles** (level 5+): three stars **twinkle**, staggered 0.6s.
- **"Pray right now" pulse**: mint ring around the button grows 8px → 14px
  while fading, 2.6s loop.
- Buttons press to scale 0.92 (0.15s).

On tapping a prayer button:
1. **+XP float**: "+20 XP" rises 8px → −40px, fading in then out, 1s.
2. XP bar width and the level arc animate to the new value (0.5s ease);
   the arc's end dot moves along the arc.
3. If the pet levels up:
   - **Hop**: 0.9s, bezier(0.3, 1.6, 0.5, 1): up 40px and scale 1.12 at 30%,
     back down squashed to 0.94 at 62%, settle at 1.
   - **Ring burst**: two rings behind the pet scale 0.3 → 1.9 while fading
     0.95 → 0, 1.1s; second ring starts 0.18s later.
   - **Toast** "Pip reached Level N!": fades/slides in over the first 12%,
     holds, fades out by 2.2s.
   - **Growth**: pet scale = 1 + 0.06 × (level − 1), max 1.3, springy 0.7s.
- XP per action: share request +20, pray for others +10, pray right now +15,
  pray with group +10, journal +5. 50 XP per level.

## Evolution boards

### Pip the Lamb (Lamb.dc.html)
- **Lambkin**: idle **hop** (2.6s loop: still until 70%, up 14px at 78%,
  down, small 5px bounce at 92%); **ear wiggle** each ear rotates ∓16° at
  86% of a 2.8s loop, origin at the ear's base; **blink**.
- **Little Lamb**: **bob**, **blink**, ear wiggle, **halo float**.
- **Lamb of Light**: bob, blink, ear wiggle, halo float, **glow** behind,
  **wing flap** (each wing rotates −16° and back, 1.1s loop, origin at the
  wing's base, right wing mirrored), three **twinkle** sparkles.

### Olive the Dove (Dove.dc.html)
- **Fledgling**: **bob**; stubby wings flap fast (0.55s, ±16°, mirrored);
  **blink**. Nest is static.
- **Olive**: bob; **head peck** (2.6s loop: at 84% the head, beak and branch
  dip translate(3px, 5px), back by 90%); **wing flap** 1s; blink.
- **Dove of Peace**: **fly** (translateY 0 → −12px, 2.2s loop); far and near
  wings flap in opposite directions (1s, ±16°, origins at wing roots);
  light **rays** rotate 360° every 24s, linear; **glow**.

### Judah the Lion (Lion.dc.html)
- **Cub**: bob; **tail swish** (rotate −16°, 1.8s loop, origin at tail base);
  **head tilt** (4s loop: tilts −8° at 70%, holds to 85%, returns); blink.
- **Young Judah**: bob, tail swish, blink, **mane breathe** (scale 1 → 1.04,
  3s loop, origin center).
- **Lion of Judah**: all of the above plus **glow** and three sparkles.

### Ember (Ember.dc.html)
- **Spark**: bob (−5px); **flame flicker** (1.6s loop, origin at flame base:
  scale 0.95×1.06 rotate −3° at 30%, 1.04×0.96 rotate +3° at 60%); glow; blink.
- **Ember**: same flicker, glow, blink.
- **Vigil Flame**: flicker, strong glow (2.4s), **halo ring breathe**
  (scale 1 → 1.08, opacity 0.35 → 0.6, 3s), **rising sparks** (three dots
  rise 60px and fade, 2.4s, staggered 0.8s).

### Selah the Sea Dragon (Dragon.dc.html)
- **Hatchling**: bob; **egg wobble** (2.8s loop: still until 80%, then
  rotate −5°, +5°, −3° between 85–95%, origin at egg base); blink.
- **Young Selah**: bob; **head sway** (rotate −4°, 3.6s loop, origin at the
  neck); **tail flick** (rotate 12°, 2.2s loop, origin at tail root); blink.
- **Guardian**: bob, head sway, tail flick, blink, pulsing **glow** (3s).

## Your walk: the nook (Me.dc.html)

### Pet
- **Sleep breathe**: body scales (1.02, 1.05), 3.6s loop, origin at base.
- **Z's**: three "z" letters drift up-right translate(18px, −46px), growing
  0.7 → 1.15 and fading, 3.6s loop, staggered 1.2s.
- **Tap to wake**: hop up 22px (0.8s, bouncy), eyes open, greeting bubble
  ("Good morning" / "Grace and peace" / "Good evening" / "Peace be with you"
  by time of day), back to sleep after 2.6s.
- With the star mobile or chimes overhead, the woken pet looks up (eyes
  raised, small "o" mouth).
- With a rug, cushion or wreath, the pet settles 6px lower (0.4s ease).
- With a lantern, incense or oil lamp: a warm **glow** patch on the fleece
  and three **light motes** that float (6px, −14px) and fade, 4s loop,
  staggered 1.3s.

### Prayer web
- **Draw-in** (once, on open): four layers (spokes, then three rings)
  draw from stroke-dashoffset 100 → 0, 2.6s ease-out, staggered 0.35s.
- **Shimmer**: whole web opacity 0.6 → 1, 4s loop.
- **Flowing strands**: dashed lines from each stat card to the pet; dashes
  move toward the pet (dashoffset −12 over 1.4s, linear loop).
- **Traveling lights**: gold dots travel each strand card → pet over 3s,
  fading in and out. Level 1: one light. Level 2+: four lights, staggered 0.75s.
- Web levels by total prayers: L1 0–25, L2 26–100 (adds twinkling dew
  drops), L3 101–500 (adds small gold crosses at ring joints, thicker
  lines), L4 501+ (adds a radial gold glow pulsing 0.35 → 0.8 over 4s).

### Lighting and scenes
- Time-of-day tint over the scene: morning gold 8%, afternoon white 3%,
  sunset amber 12%, night deep blue 28%; cross-fades 0.8s. Scene background
  color cross-fades 0.6s.
- Starry night: stars twinkle. Chapel: light beam glows. Olive grove:
  dappled sun glows. Desert: evening star twinkles and glows.
- Meadow: fireflies twinkle; dandelion seeds rise (30px, −150px), 7s loop,
  staggered 2.3s.
- Aurora: two light bands drift ±24px sideways, 9s and 12s, alternating.
- Advent: candle bokeh circles pulse opacity 0.08 → 0.26, 5s, staggered.
- Easter dawn: sun glow pulses.

### Items
- Lantern: flame flicker (1.4s); glow pulse. **Tap**: brighter glow
  (radius 30 → 44, opacity 0.3 → 0.5, 2s pulse); tap again to dim.
- Incense: three smoke wisps rise 34px and fade, 3.3s, staggered 1.1s.
- Fig plant: leaves sway ±3° (3.4s, origin at pot). **Tap**: one leaf
  falls (translate 16px, 60px, rotate 170°, fade, 1.6s).
- Overhead items (oil lamp, star mobile, chimes): swing ±4° from the
  top, 4s loop. **Tap**: swing speeds up to 0.9s for 2s. Oil lamp flame
  flickers; mobile stars twinkle.
- Scripture stand: soft glow pulse.

### Set bonuses
- Sanctuary set (chapel + prayer cushion + incense + stained glass): gold
  border on the nook and gold sparks rising 90px along both edges, 3s,
  staggered 1s.
- Easter set (Easter dawn + lily wreath + chimes): lily petals drift across
  the scene (380px right, 60px down, rotating 220°), 9s, staggered 3s.

### UI
- Decor chips press to scale 0.95; selected border fades to mint (0.2s).

## Added: extra idle animations and tap reactions (evolution boards)

### Tap reaction (every stage of every pet)
- **Squash-and-spring**: 0.8s, bezier(0.3, 1.6, 0.5, 1). Squash to
  scale(1.08, 0.9) and down 4px at 20%, spring up 26px stretched
  scale(0.95, 1.06) at 45%, land with scale(1.04, 0.96) at 75%, settle.
  Replaces the idle bob while it plays.
- **Speech bubble** (cream pill) and **particles** pop: fade/scale in
  0.6 → 1.1 over the first 20%, drift up 40px, fade out by 1.5s;
  extra particles staggered 0.15s and 0.3s.
- **Burst ring** (some stages): ring scales 0.3 → 1.8 while fading,
  1s; second ring 0.2s later.
- Retapping restarts the reaction; it clears after 1.6s.

| Pet | Stage 1 | Stage 2 | Stage 3 |
|---|---|---|---|
| Pip | "Baa!" + 2 pink hearts | "Baa!" + 3 hearts (pink, gold) | "Baa!" + gold/cream burst rings + hearts |
| Olive | "Peep!" + 2 music notes | "Coo!" + 2 notes | "Coo!" + gold/white burst rings + notes |
| Judah | "Rawr!" + sound-wave arcs | "Roar!" + amber burst + arcs | "ROAR!" + gold/amber burst rings + big arcs |
| Ember | "Hi!" + orange ring + sparks | "Amen!" + ring + sparks | "Amen!" + gold rings + two spark bursts |
| Selah | "Crack!" + gold zigzag | "Splash!" + teal ring + droplets | "Splash!" + teal/gold rings + droplets |

### New idle animations
**Pip**
- Lambkin: grass tufts and a daisy sway ±6°, 3s, origin at base, staggered 1s.
- Little Lamb: bell jingle lines flash on at 75–85% of a 3.2s loop;
  a music note floats up (10px, −34px), 4s loop, visible in the last 45%.
- Lamb of Light: a light glint runs around the halo (stroke dash sweeps,
  2.6s linear, follows the halo float); two feathers drift down
  (sway ±12px, fall 100px, rotate ±25°), 6s, staggered 3s.

**Olive**
- Fledgling: "peep" note floats up (as above); a leaf falls
  (−18px, 60px, rotate 200°), 5s loop, appears at 40%.
- Olive: leaf falls from the branch (same); one feather drifts down, 6s.
- Dove of Peace: gold light trail behind the dove (dots drift 40px back
  and fade), 2s, staggered 0.7s; a feather drifts down, 6s.

**Judah**
- Cub: a butterfly loops around (path through 4 points, 7s) with wings
  beating (scaleX 1 → 0.25, 0.3s).
- Young Judah: yawn (dark mouth opens scaleY 0 → 1 from the top at
  84–92% of a 6s loop); dust motes float up 16px, 4s, staggered 1.3s.
- Lion of Judah: crown jewel flash (star scales 0.3 → 1.2 and fades,
  at 80% of a 3.4s loop); wind wisps slide 60px sideways and fade, 4s,
  staggered 1.3s.

**Ember**
- Spark: tiny embers pop up (8px, −46px) and fade, 2.6s, staggered 0.9s.
- Ember: wax drip slides 34–38px down the candle, 6s loop (appears at
  30%); smoke wisp rises 30px and fades, 4s.
- Vigil Flame: eight light rays behind the flame rotate 360° every 30s,
  linear.

**Selah**
- Hatchling: egg crack glows (opacity 0.15 → 1, 2.8s); bubbles rise
  (6px, −90px) and fade, 4s, staggered 1.3s.
- Young Selah: two ripple rings at the base scale 0.5 → 1.4 while
  fading, 3s, staggered 1.5s; rising bubbles.
- Guardian: teal and gold ripples, rising bubbles, a star twinkles on
  the horn tip (1.8s).

All of these stop under reduced motion; bubbles and particles then show
statically.
