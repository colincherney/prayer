---
version: 1
slug: "src-app-group-id-tsx"
primary_target: "src/app/group/[id].tsx"
related_targets: ["src/app/groups.tsx"]
---

# Groups surfaces: list (src/app/groups.tsx) and group page (src/app/group/[id].tsx)

Mode: Operate. Native iOS-first Expo app; inherits the established Saint Central world (theme.ts palettes cream/navy/forest/pink, Playfair Display + Inter, companion pets, Hearth).

Audience: church members with a code and people in public open circles, equally. Everything anonymous; no personal identifier anywhere, owner included.
Main job on a group page: share a request. Hearth is the centerpiece. Failure to avoid: looking off from the rest of the app.

## Direction contract

THESIS: A group is a fire you share at, not a feed you scroll. Refuses the forum arrangement of header, pills, banner, then an endless post list where your own requests drown among everyone else's.

OWN-WORLD: The app's theme tokens unchanged. The hearth is the full-width hero card in its warm wood and firelight; one accent-filled primary action; a native-style segmented control in bgSoft/surface; prayers as quiet surface cards with Playfair body text; counts in Inter. Groups list as inset grouped lists with small fire/lock glyph chips.

STORY: The visitor sees their circle's companions around the fire, understands that sharing is the first move, shares, then switches to Yours to see how many prayed for what they shared, or stays on Circle to pray for others.

FIRST VIEWPORT: Back + group name (Playfair) and one meta line (members · private/public · anonymous). Hearth full width directly below. Directly under the hearth: "Share a prayer with this circle" primary button. Then the Circle | Yours segmented control with counts, first prayers peeking at the fold.

FORM: Circle / Yours tabs, position 5 of 7 on my ranked list. seed:5515172a918c0beb

SIGNATURE: Sharing flares the fire (existing flare prop); the Yours tab shows a "prayed for" count per request, and when it rises since last visit the count reads as new.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- Decision round ran through the structured question tool (ASCII previews) instead of the decision page.
