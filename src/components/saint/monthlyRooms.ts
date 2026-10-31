// The 2027 monthly home rooms: palettes, banner, the "Find ___" word and verses, from
// design/saint-central-home-2027. Each unlocks on the 1st of its month (public.content_releases, id room:<key>).

import type { PrayerRoomPalette } from './prayerRoom';

export type MonthlyRoom = {
  key: MonthlyRoomName;
  label: string;
  banner: string;
  word: string;
  verses: { top: Verse[]; mid: Verse[]; low: Verse[] };
  palette: PrayerRoomPalette;
};
type Verse = { text: string; ref: string };

export const MONTHLY_ROOM_NAMES = ['m2027jan', 'm2027feb', 'm2027mar', 'm2027apr', 'm2027may', 'm2027jun', 'm2027jul', 'm2027aug', 'm2027sep', 'm2027oct', 'm2027nov', 'm2027dec'] as const;
export type MonthlyRoomName = (typeof MONTHLY_ROOM_NAMES)[number];

export const MONTHLY_ROOMS: Record<MonthlyRoomName, MonthlyRoom> = {
  m2027jan: {
    key: 'm2027jan',
    label: 'January 2027',
    banner: 'NEW YEAR · NEW MERCIES',
    word: 'renewal',
    verses: {
      top: [
        {
          text: 'Behold, I make all things new',
          ref: 'Revelation 21:5'
        },
        {
          text: 'Forget the former things',
          ref: 'Isaiah 43:18'
        }
      ],
      mid: [
        {
          text: 'His mercies never come to an end',
          ref: 'Lamentations 3:22'
        },
        {
          text: 'Teach us to number our days',
          ref: 'Psalm 90:12'
        }
      ],
      low: [
        {
          text: 'Sing to the Lord a new song',
          ref: 'Psalm 98:1'
        },
        {
          text: 'Where two or three gather, there am I',
          ref: 'Matthew 18:20'
        }
      ]
    },
    palette: {
      bg: '#0B1630',
      bgSoft: '#0B1630',
      surface: '#0C162C',
      ink: '#F2E9D8',
      inkSoft: 'rgba(242,233,216,0.85)',
      muted: 'rgba(242,233,216,0.62)',
      divider: 'rgba(255,255,255,0.16)',
      accent: '#8EC9F0',
      accentSoft: '#3E6FC8',
      pillBg: 'rgba(255,255,255,0.12)',
      pillInk: '#F2E9D8',
      cardDark: 'rgba(12,22,44,0.92)',
      cardDarkInk: '#F2E9D8',
      cardLight: 'rgba(246,243,236,0.96)',
      cardLightInk: '#1F2633',
      cardLightInkSoft: '#4A4F5A',
      cardLightPillBg: '#D6E6F5',
      cardLightPillInk: '#2E5A8A',
      statusBar: 'light-content',
      lowMuted: 'rgba(43,63,104,0.7)'
    }
  },
  m2027feb: {
    key: 'm2027feb',
    label: 'February 2027',
    banner: 'LOVE IS PATIENT',
    word: 'love',
    verses: {
      top: [
        {
          text: 'Love is patient, love is kind',
          ref: '1 Corinthians 13:4'
        },
        {
          text: 'We love because He first loved us',
          ref: '1 John 4:19'
        }
      ],
      mid: [
        {
          text: 'Above all, love each other deeply',
          ref: '1 Peter 4:8'
        },
        {
          text: 'Greater love has no one than this',
          ref: 'John 15:13'
        }
      ],
      low: [
        {
          text: 'Sing to the Lord a new song',
          ref: 'Psalm 98:1'
        },
        {
          text: 'Where two or three gather, there am I',
          ref: 'Matthew 18:20'
        }
      ]
    },
    palette: {
      bg: '#2A1A3A',
      bgSoft: '#2A1A3A',
      surface: '#2A1A3A',
      ink: '#FFF2F5',
      inkSoft: 'rgba(255,242,245,0.85)',
      muted: 'rgba(255,242,245,0.62)',
      divider: 'rgba(255,255,255,0.16)',
      accent: '#F7A7BC',
      accentSoft: '#D0587A',
      pillBg: 'rgba(255,255,255,0.12)',
      pillInk: '#FFF2F5',
      cardDark: 'rgba(42,26,58,0.92)',
      cardDarkInk: '#F2E9D8',
      cardLight: 'rgba(246,243,236,0.96)',
      cardLightInk: '#1F2633',
      cardLightInkSoft: '#4A4F5A',
      cardLightPillBg: '#F7D6E0',
      cardLightPillInk: '#A8375A',
      statusBar: 'light-content',
      lowMuted: 'rgba(106,58,90,0.7)'
    }
  },
  m2027mar: {
    key: 'm2027mar',
    label: 'March 2027',
    banner: 'BE STRONG & COURAGEOUS',
    word: 'courage',
    verses: {
      top: [
        {
          text: 'Be strong and courageous',
          ref: 'Joshua 1:9'
        },
        {
          text: 'The Lord is my strength and my shield',
          ref: 'Psalm 28:7'
        }
      ],
      mid: [
        {
          text: 'Wait for the Lord; be strong',
          ref: 'Psalm 27:14'
        },
        {
          text: 'I can do all things through Christ',
          ref: 'Philippians 4:13'
        }
      ],
      low: [
        {
          text: 'Sing to the Lord a new song',
          ref: 'Psalm 98:1'
        },
        {
          text: 'Where two or three gather, there am I',
          ref: 'Matthew 18:20'
        }
      ]
    },
    palette: {
      bg: '#5AA8D6',
      bgSoft: '#5AA8D6',
      surface: '#F6F3EC',
      ink: '#1F2633',
      inkSoft: 'rgba(31,38,51,0.85)',
      muted: 'rgba(31,38,51,0.55)',
      divider: 'rgba(31,38,51,0.14)',
      accent: '#2E6FA8',
      accentSoft: '#F2934A',
      pillBg: 'rgba(31,38,51,0.08)',
      pillInk: '#1F2633',
      cardDark: 'rgba(18,48,72,0.92)',
      cardDarkInk: '#F2E9D8',
      cardLight: 'rgba(246,243,236,0.96)',
      cardLightInk: '#1F2633',
      cardLightInkSoft: '#4A4F5A',
      cardLightPillBg: '#FCE0C8',
      cardLightPillInk: '#B5562E',
      statusBar: 'dark-content',
      lowMuted: 'rgba(242,250,236,0.85)'
    }
  },
  m2027apr: {
    key: 'm2027apr',
    label: 'April 2027',
    banner: 'HE IS RISEN · EASTERTIDE',
    word: 'hope',
    verses: {
      top: [
        {
          text: 'He is not here; He has risen',
          ref: 'Matthew 28:6'
        },
        {
          text: 'I am the resurrection and the life',
          ref: 'John 11:25'
        }
      ],
      mid: [
        {
          text: 'This is the day the Lord has made',
          ref: 'Psalm 118:24'
        },
        {
          text: 'Born again to a living hope',
          ref: '1 Peter 1:3'
        }
      ],
      low: [
        {
          text: 'Sing to the Lord a new song',
          ref: 'Psalm 98:1'
        },
        {
          text: 'Where two or three gather, there am I',
          ref: 'Matthew 18:20'
        }
      ]
    },
    palette: {
      bg: '#3A3A66',
      bgSoft: '#3A3A66',
      surface: '#1E1C3C',
      ink: '#FFFFFF',
      inkSoft: 'rgba(255,255,255,0.85)',
      muted: 'rgba(255,255,255,0.68)',
      divider: 'rgba(255,255,255,0.16)',
      accent: '#D8CCFA',
      accentSoft: '#8A6ED6',
      pillBg: 'rgba(255,255,255,0.12)',
      pillInk: '#FFFFFF',
      cardDark: 'rgba(30,28,60,0.92)',
      cardDarkInk: '#F2E9D8',
      cardLight: 'rgba(246,243,236,0.96)',
      cardLightInk: '#1F2633',
      cardLightInkSoft: '#4A4F5A',
      cardLightPillBg: '#E6DEFA',
      cardLightPillInk: '#5A3EA8',
      statusBar: 'light-content',
      lowMuted: 'rgba(30,50,30,0.65)'
    }
  },
  m2027may: {
    key: 'm2027may',
    label: 'May 2027',
    banner: 'CONSIDER THE LILIES',
    word: 'peace',
    verses: {
      top: [
        {
          text: 'Consider the lilies of the field',
          ref: 'Matthew 6:28'
        },
        {
          text: 'Do not worry about tomorrow',
          ref: 'Matthew 6:34'
        }
      ],
      mid: [
        {
          text: 'Come, Holy Spirit',
          ref: 'Acts 2:4'
        },
        {
          text: 'The fruit of the Spirit is love, joy, peace',
          ref: 'Galatians 5:22'
        }
      ],
      low: [
        {
          text: 'Sing to the Lord a new song',
          ref: 'Psalm 98:1'
        },
        {
          text: 'Where two or three gather, there am I',
          ref: 'Matthew 18:20'
        }
      ]
    },
    palette: {
      bg: '#F2B66A',
      bgSoft: '#F2B66A',
      surface: '#F6F3EC',
      ink: '#3A2410',
      inkSoft: 'rgba(58,36,16,0.85)',
      muted: 'rgba(58,36,16,0.58)',
      divider: 'rgba(31,38,51,0.14)',
      accent: '#B5562E',
      accentSoft: '#C9702E',
      pillBg: 'rgba(31,38,51,0.08)',
      pillInk: '#3A2410',
      cardDark: 'rgba(58,36,16,0.92)',
      cardDarkInk: '#F2E9D8',
      cardLight: 'rgba(246,243,236,0.96)',
      cardLightInk: '#1F2633',
      cardLightInkSoft: '#4A4F5A',
      cardLightPillBg: '#F7DDB8',
      cardLightPillInk: '#A8521E',
      statusBar: 'dark-content',
      lowMuted: 'rgba(250,246,228,0.85)'
    }
  },
  m2027jun: {
    key: 'm2027jun',
    label: 'June 2027',
    banner: 'BE STILL',
    word: 'stillness',
    verses: {
      top: [
        {
          text: 'Be still, and know that I am God',
          ref: 'Psalm 46:10'
        },
        {
          text: 'He leads me beside still waters',
          ref: 'Psalm 23:2'
        }
      ],
      mid: [
        {
          text: 'Come to me, all who are weary',
          ref: 'Matthew 11:28'
        },
        {
          text: 'In quietness and trust is your strength',
          ref: 'Isaiah 30:15'
        }
      ],
      low: [
        {
          text: 'Sing to the Lord a new song',
          ref: 'Psalm 98:1'
        },
        {
          text: 'Where two or three gather, there am I',
          ref: 'Matthew 18:20'
        }
      ]
    },
    palette: {
      bg: '#0E2A30',
      bgSoft: '#0E2A30',
      surface: '#0A2422',
      ink: '#E6FFF4',
      inkSoft: 'rgba(230,255,244,0.85)',
      muted: 'rgba(230,255,244,0.62)',
      divider: 'rgba(255,255,255,0.16)',
      accent: '#5FBF8A',
      accentSoft: '#2F8A5E',
      pillBg: 'rgba(255,255,255,0.12)',
      pillInk: '#E6FFF4',
      cardDark: 'rgba(10,36,34,0.92)',
      cardDarkInk: '#F2E9D8',
      cardLight: 'rgba(246,243,236,0.96)',
      cardLightInk: '#1F2633',
      cardLightInkSoft: '#4A4F5A',
      cardLightPillBg: '#CDEEDD',
      cardLightPillInk: '#1E6A44',
      statusBar: 'light-content',
      lowMuted: 'rgba(230,255,244,0.7)'
    }
  },
  m2027jul: {
    key: 'm2027jul',
    label: 'July 2027',
    banner: 'WINGS LIKE EAGLES',
    word: 'freedom',
    verses: {
      top: [
        {
          text: 'They will soar on wings like eagles',
          ref: 'Isaiah 40:31'
        },
        {
          text: 'Where the Spirit of the Lord is, there is freedom',
          ref: '2 Corinthians 3:17'
        }
      ],
      mid: [
        {
          text: 'The heavens declare the glory of God',
          ref: 'Psalm 19:1'
        },
        {
          text: 'He determines the number of the stars',
          ref: 'Psalm 147:4'
        }
      ],
      low: [
        {
          text: 'Sing to the Lord a new song',
          ref: 'Psalm 98:1'
        },
        {
          text: 'Where two or three gather, there am I',
          ref: 'Matthew 18:20'
        }
      ]
    },
    palette: {
      bg: '#070D24',
      bgSoft: '#070D24',
      surface: '#0A0E24',
      ink: '#F2F6FF',
      inkSoft: 'rgba(242,246,255,0.85)',
      muted: 'rgba(242,246,255,0.62)',
      divider: 'rgba(255,255,255,0.16)',
      accent: '#F2C462',
      accentSoft: '#3E6FC8',
      pillBg: 'rgba(255,255,255,0.12)',
      pillInk: '#F2F6FF',
      cardDark: 'rgba(10,14,36,0.92)',
      cardDarkInk: '#F2E9D8',
      cardLight: 'rgba(246,243,236,0.96)',
      cardLightInk: '#1F2633',
      cardLightInkSoft: '#4A4F5A',
      cardLightPillBg: '#D6E6F5',
      cardLightPillInk: '#2E5A8A',
      statusBar: 'light-content',
      lowMuted: 'rgba(242,246,255,0.6)'
    }
  },
  m2027aug: {
    key: 'm2027aug',
    label: 'August 2027',
    banner: 'THE LORD IS MY SHEPHERD',
    word: 'rest',
    verses: {
      top: [
        {
          text: 'The Lord is my shepherd',
          ref: 'Psalm 23:1'
        },
        {
          text: 'He makes me lie down in green pastures',
          ref: 'Psalm 23:2'
        }
      ],
      mid: [
        {
          text: 'My sheep hear my voice',
          ref: 'John 10:27'
        },
        {
          text: 'Goodness and mercy shall follow me',
          ref: 'Psalm 23:6'
        }
      ],
      low: [
        {
          text: 'Sing to the Lord a new song',
          ref: 'Psalm 98:1'
        },
        {
          text: 'Where two or three gather, there am I',
          ref: 'Matthew 18:20'
        }
      ]
    },
    palette: {
      bg: '#3A2A5A',
      bgSoft: '#3A2A5A',
      surface: '#2C1E3C',
      ink: '#FFF5E6',
      inkSoft: 'rgba(255,245,230,0.85)',
      muted: 'rgba(255,245,230,0.66)',
      divider: 'rgba(255,255,255,0.16)',
      accent: '#F7D27A',
      accentSoft: '#C9605A',
      pillBg: 'rgba(255,255,255,0.12)',
      pillInk: '#FFF5E6',
      cardDark: 'rgba(44,30,60,0.92)',
      cardDarkInk: '#F2E9D8',
      cardLight: 'rgba(246,243,236,0.96)',
      cardLightInk: '#1F2633',
      cardLightInkSoft: '#4A4F5A',
      cardLightPillBg: '#F7DCC8',
      cardLightPillInk: '#A8473E',
      statusBar: 'light-content',
      lowMuted: 'rgba(255,245,230,0.8)'
    }
  },
  m2027sep: {
    key: 'm2027sep',
    label: 'September 2027',
    banner: 'TASTE AND SEE',
    word: 'goodness',
    verses: {
      top: [
        {
          text: 'Taste and see that the Lord is good',
          ref: 'Psalm 34:8'
        },
        {
          text: 'I am the vine; you are the branches',
          ref: 'John 15:5'
        }
      ],
      mid: [
        {
          text: 'The harvest is plentiful',
          ref: 'Matthew 9:37'
        },
        {
          text: 'He will bear fruit in season',
          ref: 'Psalm 1:3'
        }
      ],
      low: [
        {
          text: 'Sing to the Lord a new song',
          ref: 'Psalm 98:1'
        },
        {
          text: 'Where two or three gather, there am I',
          ref: 'Matthew 18:20'
        }
      ]
    },
    palette: {
      bg: '#6AA8B8',
      bgSoft: '#6AA8B8',
      surface: '#F6F3EC',
      ink: '#2A2A12',
      inkSoft: 'rgba(42,42,18,0.85)',
      muted: 'rgba(42,42,18,0.58)',
      divider: 'rgba(31,38,51,0.14)',
      accent: '#B5562E',
      accentSoft: '#E8826A',
      pillBg: 'rgba(31,38,51,0.08)',
      pillInk: '#2A2A12',
      cardDark: 'rgba(42,46,24,0.92)',
      cardDarkInk: '#F2E9D8',
      cardLight: 'rgba(246,243,236,0.96)',
      cardLightInk: '#1F2633',
      cardLightInkSoft: '#4A4F5A',
      cardLightPillBg: '#FBE0D4',
      cardLightPillInk: '#B5563E',
      statusBar: 'dark-content',
      lowMuted: 'rgba(42,42,18,0.6)'
    }
  },
  m2027oct: {
    key: 'm2027oct',
    label: 'October 2027',
    banner: 'NEW EVERY MORNING',
    word: 'mercy',
    verses: {
      top: [
        {
          text: 'His mercies are new every morning',
          ref: 'Lamentations 3:23'
        },
        {
          text: 'Joy comes in the morning',
          ref: 'Psalm 30:5'
        }
      ],
      mid: [
        {
          text: 'For everything there is a season',
          ref: 'Ecclesiastes 3:1'
        },
        {
          text: 'Great is Your faithfulness',
          ref: 'Lamentations 3:23'
        }
      ],
      low: [
        {
          text: 'Sing to the Lord a new song',
          ref: 'Psalm 98:1'
        },
        {
          text: 'Where two or three gather, there am I',
          ref: 'Matthew 18:20'
        }
      ]
    },
    palette: {
      bg: '#2A2050',
      bgSoft: '#2A2050',
      surface: '#2A1C28',
      ink: '#FFF3E0',
      inkSoft: 'rgba(255,243,224,0.85)',
      muted: 'rgba(255,243,224,0.66)',
      divider: 'rgba(255,255,255,0.16)',
      accent: '#F7C86A',
      accentSoft: '#C9502E',
      pillBg: 'rgba(255,255,255,0.12)',
      pillInk: '#FFF3E0',
      cardDark: 'rgba(42,28,40,0.92)',
      cardDarkInk: '#F2E9D8',
      cardLight: 'rgba(246,243,236,0.96)',
      cardLightInk: '#1F2633',
      cardLightInkSoft: '#4A4F5A',
      cardLightPillBg: '#F7D8C0',
      cardLightPillInk: '#A84A2A',
      statusBar: 'light-content',
      lowMuted: 'rgba(255,243,224,0.75)'
    }
  },
  m2027nov: {
    key: 'm2027nov',
    label: 'November 2027',
    banner: 'GIVE THANKS',
    word: 'gratitude',
    verses: {
      top: [
        {
          text: 'Give thanks to the Lord, for He is good',
          ref: 'Psalm 107:1'
        },
        {
          text: 'A friend loves at all times',
          ref: 'Proverbs 17:17'
        }
      ],
      mid: [
        {
          text: 'In everything give thanks',
          ref: '1 Thessalonians 5:18'
        },
        {
          text: 'Every good and perfect gift is from above',
          ref: 'James 1:17'
        }
      ],
      low: [
        {
          text: 'Sing to the Lord a new song',
          ref: 'Psalm 98:1'
        },
        {
          text: 'Where two or three gather, there am I',
          ref: 'Matthew 18:20'
        }
      ]
    },
    palette: {
      bg: '#1A1A30',
      bgSoft: '#1A1A30',
      surface: '#1A1A30',
      ink: '#FFF3E6',
      inkSoft: 'rgba(255,243,230,0.85)',
      muted: 'rgba(255,243,230,0.62)',
      divider: 'rgba(255,255,255,0.16)',
      accent: '#E8A24B',
      accentSoft: '#C9702E',
      pillBg: 'rgba(255,255,255,0.12)',
      pillInk: '#FFF3E6',
      cardDark: 'rgba(26,26,48,0.92)',
      cardDarkInk: '#F2E9D8',
      cardLight: 'rgba(246,243,236,0.96)',
      cardLightInk: '#1F2633',
      cardLightInkSoft: '#4A4F5A',
      cardLightPillBg: '#F7DDB8',
      cardLightPillInk: '#A8521E',
      statusBar: 'light-content',
      lowMuted: 'rgba(255,243,230,0.75)'
    }
  },
  m2027dec: {
    key: 'm2027dec',
    label: 'December 2027',
    banner: 'ADVENT · COME, EMMANUEL',
    word: 'light',
    verses: {
      top: [
        {
          text: 'The light shines in the darkness',
          ref: 'John 1:5'
        },
        {
          text: 'The people walking in darkness have seen a great light',
          ref: 'Isaiah 9:2'
        }
      ],
      mid: [
        {
          text: 'Prepare the way of the Lord',
          ref: 'Isaiah 40:3'
        },
        {
          text: 'O come, let us adore Him',
          ref: 'Luke 2:15'
        }
      ],
      low: [
        {
          text: 'Sing to the Lord a new song',
          ref: 'Psalm 98:1'
        },
        {
          text: 'Where two or three gather, there am I',
          ref: 'Matthew 18:20'
        }
      ]
    },
    palette: {
      bg: '#070B1E',
      bgSoft: '#070B1E',
      surface: '#0C162C',
      ink: '#F7FAFF',
      inkSoft: 'rgba(247,250,255,0.85)',
      muted: 'rgba(247,250,255,0.62)',
      divider: 'rgba(255,255,255,0.16)',
      accent: '#F2C462',
      accentSoft: '#C9433A',
      pillBg: 'rgba(255,255,255,0.12)',
      pillInk: '#F7FAFF',
      cardDark: 'rgba(12,22,44,0.92)',
      cardDarkInk: '#F2E9D8',
      cardLight: 'rgba(246,243,236,0.96)',
      cardLightInk: '#1F2633',
      cardLightInkSoft: '#4A4F5A',
      cardLightPillBg: '#F3D2C8',
      cardLightPillInk: '#A8372E',
      statusBar: 'light-content',
      lowMuted: 'rgba(43,63,104,0.7)'
    }
  },
};
