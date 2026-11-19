const BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', 'Samuel', 'Kings',
  'Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms?', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah',
  'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke',
  'John', 'Acts', 'Romans', 'Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians',
  'Thessalonians', 'Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', 'Peter', 'Jude', 'Revelation',
].join('|');

const REFERENCE = new RegExp(String.raw`\b((?:[123] )?(?:${BOOKS})) (\d+)(?::(\d+)(?:[–-](\d+))?|[–-](\d+))?\b`);
const FULL_REFERENCE = new RegExp(`^${REFERENCE.source}$`);

export function findBibleReference(text: string): string | undefined {
  return text.match(REFERENCE)?.[0];
}

export function parseBibleReference(reference: string) {
  const match = reference.match(FULL_REFERENCE);
  if (!match) return null;

  const [, book, chapter, verse, lastVerse, lastChapter] = match;
  return {
    book,
    firstChapter: Number(chapter),
    lastChapter: Number(lastChapter ?? chapter),
    firstVerse: Number(verse ?? 1),
    lastVerse: Number(lastVerse ?? verse ?? Infinity),
  };
}
