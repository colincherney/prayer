// The Companion Dex's details for each companion: where it lives, what it loves, its verse, and the colour of its
// page. Kept apart from the registry so the art files stay about art.

import type { PetId } from './registry';

export type CompanionInfo = {
  habitat: string;
  loves: string;
  verse: { text: string; ref: string };
  /** The hero's colour on its Dex page and the tint of its card. */
  hue: string;
};

export const COMPANION_INFO: Record<PetId, CompanionInfo> = {
  lamb: { habitat: 'Green pastures', loves: 'Quiet streams', verse: { text: 'The Lord is my shepherd; I shall not want.', ref: 'Psalm 23:1' }, hue: '#3E6B4A' },
  dove: { habitat: 'Olive groves', loves: 'Gentle mornings', verse: { text: 'Blessed are the peacemakers.', ref: 'Matthew 5:9' }, hue: '#3A5A8A' },
  lion: { habitat: 'Judean hills', loves: 'Brave hearts', verse: { text: 'The righteous are as bold as a lion.', ref: 'Proverbs 28:1' }, hue: '#8A5A2A' },
  ember: { habitat: 'The altar lamp', loves: 'Late-night prayers', verse: { text: 'Your word is a lamp to my feet.', ref: 'Psalm 119:105' }, hue: '#7A2E1E' },
  dragon: { habitat: 'Sea of Galilee', loves: 'Still waters', verse: { text: 'Be still, and know that I am God.', ref: 'Psalm 46:10' }, hue: '#1E5A5E' },
  pumpkin: { habitat: 'The harvest patch', loves: 'Lantern light', verse: { text: 'The light shines in the darkness.', ref: 'John 1:5' }, hue: '#8A4A1A' },
  turkey: { habitat: 'The harvest table', loves: 'Giving thanks', verse: { text: 'Give thanks to the Lord, for He is good.', ref: 'Psalm 107:1' }, hue: '#7A3E22' },
  donkey: { habitat: 'The road to Bethlehem', loves: 'Carrying good news', verse: { text: 'For unto us a child is born.', ref: 'Isaiah 9:6' }, hue: '#4A4A6A' },
  rat: { habitat: 'The granary', loves: 'Fresh beginnings', verse: { text: 'Behold, I make all things new.', ref: 'Revelation 21:5' }, hue: '#5A4A3A' },
  ox: { habitat: 'Ploughed fields', loves: 'Steady work', verse: { text: 'Love is patient, love is kind.', ref: '1 Corinthians 13:4' }, hue: '#6A4A2A' },
  tiger: { habitat: 'Mountain forests', loves: 'Courage', verse: { text: 'Be strong and courageous.', ref: 'Joshua 1:9' }, hue: '#8A5A1E' },
  rabbit: { habitat: 'Moonlit meadows', loves: 'Easter mornings', verse: { text: 'He is not here; He has risen!', ref: 'Luke 24:6' }, hue: '#5A4A8A' },
  loong: { habitat: 'Among the clouds', loves: 'Lilies of the field', verse: { text: 'Consider the lilies of the field.', ref: 'Matthew 6:28' }, hue: '#8A6A1E' },
  snake: { habitat: 'Jade gardens', loves: 'Quiet wisdom', verse: { text: 'Be still before the Lord and wait patiently.', ref: 'Psalm 37:7' }, hue: '#2E6A4A' },
  horse: { habitat: 'Open plains', loves: 'The wind', verse: { text: 'They shall mount up with wings as eagles.', ref: 'Isaiah 40:31' }, hue: '#6A3E22' },
  goat: { habitat: 'Cloud hills', loves: 'Climbing high', verse: { text: 'He makes my feet like the feet of a deer.', ref: 'Psalm 18:33' }, hue: '#4A6A3A' },
  monkey: { habitat: 'Peach orchards', loves: 'Sweet surprises', verse: { text: 'Taste and see that the Lord is good.', ref: 'Psalm 34:8' }, hue: '#8A4A5A' },
  rooster: { habitat: 'The morning fence', loves: 'First light', verse: { text: 'His mercies are new every morning.', ref: 'Lamentations 3:23' }, hue: '#8A3A1E' },
  dog: { habitat: 'By your side', loves: 'Faithful friends', verse: { text: 'A friend loves at all times.', ref: 'Proverbs 17:17' }, hue: '#2E4A8A' },
  pig: { habitat: 'Blossom farms', loves: 'Full hearts', verse: { text: 'My cup overflows.', ref: 'Psalm 23:5' }, hue: '#8A4A6A' },
};

export type CompanionGroup = 'core' | 'seasonal' | 'monthly';

const SEASONAL: PetId[] = ['pumpkin', 'turkey', 'donkey'];
const CORE: PetId[] = ['lamb', 'dove', 'lion', 'ember', 'dragon'];

export function companionGroup(id: PetId): CompanionGroup {
  if (CORE.includes(id)) return 'core';
  if (SEASONAL.includes(id)) return 'seasonal';
  return 'monthly';
}

export const GROUP_LABELS: Record<CompanionGroup, string> = {
  core: 'Core companions',
  seasonal: 'Seasonal',
  monthly: 'Monthly',
};

/** The level each evolution starts at. */
export const STAGE_LEVELS = [1, 5, 10] as const;
