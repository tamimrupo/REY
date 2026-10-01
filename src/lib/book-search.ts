/**
 * Book metadata lookup — the engine behind "search a title, click import".
 *
 * Open Library is the primary source: it needs no API key and answers fine from
 * serverless hosts. Google Books is used *only* when GOOGLE_BOOKS_API_KEY is
 * set, because the anonymous Google quota is spent almost instantly
 * (HTTP 429 "Quota exceeded … Queries per day") and would otherwise break every
 * search for everyone.
 *
 * Everything here is safe to run on the server only — it makes outbound calls.
 */

import { normalizeIsbn } from "@/lib/import";

export type BookSource = "openlibrary" | "google";

export type BookCandidate = {
  source: BookSource;
  /** Stable id within the source: an OL work key (OL…W) or a Google volume id. */
  id: string;
  title: string;
  subtitle: string | null;
  authors: string[];
  isbn: string | null;
  publisher: string | null;
  year: number | null;
  pages: number | null;
  /** Human language name, e.g. "English" / "Bangla". */
  language: string | null;
  subjects: string[];
  description: string | null;
  coverUrl: string | null;
  /** How many editions exist — a rough popularity signal. */
  editions: number | null;
  /** Series this book belongs to, when the source says so. */
  series: string | null;
  /** Reading position inside that series, when it can be worked out. */
  seriesOrder: number | null;
  /** Portrait for the first author, when the source has one. */
  authorPhoto: string | null;
};

export type SearchOutcome = {
  results: BookCandidate[];
  totalFound: number | null;
  /** A human note shown under the search box (e.g. about Bengali script). */
  hint: string | null;
  error?: string;
};

/** A candidate plus whether the shop already carries it. */
export type BookSearchRow = BookCandidate & {
  existing: { id: string; slug: string } | null;
};

/* -------------------------------------------------------------------------- */
/* Query helpers                                                               */
/* -------------------------------------------------------------------------- */

const ISBN_RE = /^(?:\d{9}[\dXx]|\d{13})$/;

/** True for anything that should be looked up as an ISBN rather than a title. */
export function looksLikeIsbn(query: string): boolean {
  return ISBN_RE.test(query.replace(/[-\s]/g, ""));
}

/** True when the query contains Bengali script, which Open Library cannot index. */
export function hasBengaliScript(query: string): boolean {
  return /[\u0980-\u09ff]/.test(query);
}

/* -------------------------------------------------------------------------- */
/* Bengali transliteration                                                     */
/* -------------------------------------------------------------------------- */

/** Consonants, in the order the script teaches them. */
const CONSONANTS: Record<string, string> = {
  ক: "k", খ: "kh", গ: "g", ঘ: "gh", ঙ: "ng",
  চ: "ch", ছ: "chh", জ: "j", ঝ: "jh", ঞ: "n",
  ট: "t", ঠ: "th", ড: "d", ঢ: "dh", ণ: "n",
  ত: "t", থ: "th", দ: "d", ধ: "dh", ন: "n",
  প: "p", ফ: "ph", ব: "b", ভ: "bh", ম: "m",
  য: "j", র: "r", ল: "l", শ: "sh", ষ: "sh", স: "s", হ: "h",
  ড়: "r", ঢ়: "rh", য়: "y", ৎ: "t",
};

/** Independent vowels and the vowel signs that follow a consonant. */
const VOWELS: Record<string, string> = {
  অ: "a", আ: "a", ই: "i", ঈ: "i", উ: "u", ঊ: "u", ঋ: "ri",
  এ: "e", ঐ: "oi", ও: "o", ঔ: "ou",
};

const VOWEL_SIGNS: Record<string, string> = {
  "া": "a", "ি": "i", "ী": "i", "ু": "u", "ূ": "u", "ৃ": "ri",
  "ে": "e", "ৈ": "oi", "ো": "o", "ৌ": "ou",
};

const SIGNS: Record<string, string> = {
  "ং": "ng", "ঁ": "n", "ঃ": "h",
};

const VIRAMA = "\u09cd";

/**
 * Renders Bengali script as Latin letters, so it can be searched.
 *
 * It follows the writing system rather than a pronunciation dictionary: a
 * consonant takes its inherent vowel only when nothing follows to silence it
 * (a vowel sign, a virama, or the end of the word). That is enough to turn
 * পথের পাঁচালী into "pather panchali" and হুমায়ূন আহমেদ into "humayun ahmed" —
 * the spellings the outside catalogues actually index.
 *
 * It is a search aid, never a display: the shop keeps the Bangla.
 */
export function transliterateBengali(input: string): string {
  let out = "";
  // য়, ড় and ঢ় are composition exclusions, so NFC will not join the letter and
  // its nukta — some keyboards send them as two code points. Join them here, or
  // হুমায়ূন comes out as "humaja una".
  const composed = input
    .replace(/\u09af\u09bc/g, "\u09df")
    .replace(/\u09a1\u09bc/g, "\u09dc")
    .replace(/\u09a2\u09bc/g, "\u09dd")
    .normalize("NFC");
  const chars = Array.from(composed);
  // য is "j" at the start of a word and "y" after a vowel — সুয → suj, মায়া → maya.
  let afterVowel = false;

  for (let i = 0; i < chars.length; i += 1) {
    const char = chars[i];
    const next = chars[i + 1];

    if (char in CONSONANTS) {
      out += char === "য" && afterVowel ? "y" : CONSONANTS[char];
      // Inherent vowel: only when the consonant is not silenced by what follows
      // — a vowel sign, a virama, the end of the word, or a space.
      const silenced =
        next === VIRAMA || next === " " || next === "\u09bc" || (next ? next in VOWEL_SIGNS : true);
      if (!silenced) out += "a";
      afterVowel = false;
      continue;
    }

    if (char in VOWEL_SIGNS) {
      out += VOWEL_SIGNS[char];
      afterVowel = true;
      continue;
    }

    if (char in VOWELS) {
      out += VOWELS[char];
      afterVowel = true;
      continue;
    }

    if (char in SIGNS) {
      out += SIGNS[char];
      afterVowel = false;
      continue;
    }

    if (char === VIRAMA) {
      afterVowel = false;
      continue;
    }

    // Any other Bengali mark (nukta and friends) is a join, not a separator:
    // ignoring it is what keeps হুমায়ূন as "humayun" rather than "humaya una".
    if (char >= "\u0980" && char <= "\u09ff") continue;

    // Bengali digits, and anything already Latin, pass through.
    if (char >= "০" && char <= "৯") {
      out += String(char.codePointAt(0)! - 0x09e6);
      afterVowel = false;
      continue;
    }

    out += /[a-zA-Z0-9\s'&.-]/.test(char) ? char : " ";
    afterVowel = false;
  }

  return out.replace(/\s+/g, " ").trim();
}

/**
 * The spellings worth searching for a Bengali query.
 *
 * Bengali leaves many inherent vowels unwritten but unspoken — আহমেদ is
 * "Ahmed", not "Ahamed" — and no rule recovers that reliably. So we search the
 * literal transliteration *and* a version with the medial vowels closed up, in
 * one query, and let the catalogue decide. Two spellings of the same intent is
 * cheaper than a pronunciation dictionary.
 */
export function bengaliSearchVariants(input: string): string[] {
  const written = transliterateBengali(input);
  const closed = written.replace(/a(?=[bcdfghjklmnpqrstvwxyz])/g, "");
  return [...new Set([written, closed])].filter((variant) => variant.trim().length >= 3);
}

/* -------------------------------------------------------------------------- */
/* Mapping: Open Library                                                       */
/* -------------------------------------------------------------------------- */

const LANGUAGE_NAMES: Record<string, string> = {
  eng: "English",
  ben: "Bangla",
  hin: "Hindi",
  urd: "Urdu",
  ara: "Arabic",
  fra: "French",
  fre: "French",
  spa: "Spanish",
  deu: "German",
  ger: "German",
  por: "Portuguese",
  rus: "Russian",
  tam: "Tamil",
  nep: "Nepali",
  san: "Sanskrit",
  ita: "Italian",
  nld: "Dutch",
  dut: "Dutch",
  swe: "Swedish",
  pol: "Polish",
  tur: "Turkish",
  vie: "Vietnamese",
  tha: "Thai",
  mal: "Malayalam",
  kan: "Kannada",
  tel: "Telugu",
  mar: "Marathi",
  guj: "Gujarati",
  pan: "Punjabi",
  sin: "Sinhala",
  per: "Persian",
  fas: "Persian",
  heb: "Hebrew",
  ind: "Indonesian",
  msa: "Malay",
  may: "Malay",
  fil: "Filipino",
  tgl: "Filipino",
  ukr: "Ukrainian",
  ron: "Romanian",
  rum: "Romanian",
  ell: "Greek",
  gre: "Greek",
  ces: "Czech",
  cze: "Czech",
  hun: "Hungarian",
  dan: "Danish",
  nor: "Norwegian",
  fin: "Finnish",
  jpn: "Japanese",
  kor: "Korean",
  zho: "Chinese",
  chi: "Chinese",
};

/** Codes that mean "no idea", not a language. */
const LANGUAGE_UNKNOWN = new Set(["und", "mul", "zxx", "mis", "sgn", "art"]);

/**
 * Maps an ISO code to a display name. Unknown codes come back as null rather
 * than as "Pol", and the import then falls back to English — a wrong label on a
 * book page is worse than a blank one.
 */
export function languageName(code: string | null | undefined): string | null {
  if (!code) return null;
  const key = code.trim().toLowerCase().slice(0, 3);
  if (!key || LANGUAGE_UNKNOWN.has(key)) return null;
  return LANGUAGE_NAMES[key] ?? null;
}

/** Subject strings that are catalogue plumbing rather than a genre. */
const SUBJECT_NOISE = [
  "translations into",
  "accessible book",
  "protected daisy",
  "large type books",
  "open library staff picks",
  "in library",
  "internet archive",
  "bestseller",
];

/**
 * Ordered most-specific first: "science fiction" has to win before "fiction"
 * or "science" gets a look in.
 */
const GENRE_KEYWORDS: { match: string; name: string }[] = [
  { match: "science fiction", name: "Science Fiction" },
  { match: "young adult", name: "Young Adult" },
  { match: "graphic novel", name: "Comics & Graphic Novels" },
  { match: "comic", name: "Comics & Graphic Novels" },
  { match: "detective", name: "Crime & Detective" },
  { match: "mystery", name: "Mystery" },
  { match: "thriller", name: "Thriller" },
  { match: "suspense", name: "Thriller" },
  { match: "fantasy", name: "Fantasy" },
  { match: "romance", name: "Romance" },
  { match: "historical fiction", name: "Historical Fiction" },
  { match: "poetry", name: "Poetry" },
  { match: "autobiograph", name: "Biography" },
  { match: "biography", name: "Biography" },
  { match: "self-help", name: "Self-Help" },
  { match: "self help", name: "Self-Help" },
  { match: "business", name: "Business" },
  { match: "economics", name: "Economics" },
  { match: "psychology", name: "Psychology" },
  { match: "philosophy", name: "Philosophy" },
  { match: "islam", name: "Religion" },
  { match: "christian", name: "Religion" },
  { match: "religion", name: "Religion" },
  { match: "history", name: "History" },
  { match: "cooking", name: "Cooking" },
  { match: "travel", name: "Travel" },
  { match: "medicine", name: "Health" },
  { match: "health", name: "Health" },
  { match: "education", name: "Education" },
  { match: "drama", name: "Drama" },
  { match: "essay", name: "Essays" },
  { match: "classic", name: "Classics" },
  { match: "children", name: "Children's" },
  { match: "juvenile", name: "Children's" },
  { match: "science", name: "Science" },
  { match: "fiction", name: "Fiction" },
];

function usableSubjects(subjects: string[] | null | undefined): string[] {
  return (subjects ?? [])
    .map((raw) => String(raw).trim())
    .filter((value) => {
      if (!value || value.length > 60 || value.includes(":")) return false;
      const lower = value.toLowerCase();
      return !SUBJECT_NOISE.some((noise) => lower.startsWith(noise));
    });
}

/**
 * Picks something shelf-like out of Open Library's subject soup, which mixes
 * genres with metadata ("series:Harry_Potter", "Translations into Indonesian").
 * A known genre keyword wins; otherwise the first usable subject is kept.
 */
export function pickGenre(subjects: string[] | null | undefined): string | null {
  const usable = usableSubjects(subjects);
  if (!usable.length) return null;

  for (const { match, name } of GENRE_KEYWORDS) {
    if (usable.some((subject) => subject.toLowerCase().includes(match))) return name;
  }

  const first = usable[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/** Collapses tags/entities/whitespace out of a description blob. */
export function cleanText(input: string | null | undefined): string | null {
  if (!input) return null;
  const text = String(input)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
  return text || null;
}

/** Open Library returns `first_sentence` as a string, array or object. */
function firstSentence(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : null;
  if (typeof value === "object" && value !== null) {
    const inner = (value as Record<string, unknown>).value;
    return typeof inner === "string" ? inner : null;
  }
  return null;
}

function yearFrom(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const match = String(value).match(/\d{4}/);
  if (!match) return null;
  const year = Number(match[0]);
  return year >= 1000 && year <= 2100 ? year : null;
}

/**
 * Open Library renders cover sizes on demand, and some sizes are permanently
 * missing or wedged. `-M` is the reliable workhorse for previews; the importer
 * upgrades to `-L` with a fallback chain.
 */
/**
 * Pulls a series out of Open Library's subject tags: "series:Harry_Potter" or
 * "series: A Song of Ice and Fire #2". Only the explicit "series:" form counts —
 * anything else is too speculative to put on a book page.
 */
export function pickSeries(
  subjects: string[] | null | undefined,
): { name: string; order: number | null } | null {
  for (const raw of subjects ?? []) {
    const match = String(raw).match(/^\s*series\s*[:/]\s*(.+)$/i);
    if (!match) continue;

    let name = match[1].replace(/_/g, " ").replace(/\s+/g, " ").trim();
    let order: number | null = null;

    const trailing = name.match(/#\s*(\d+)\s*$/);
    if (trailing) {
      order = Number(trailing[1]);
      name = name.replace(/#\s*\d+\s*$/, "").trim();
    }

    if (!name || name.length > 80) continue;
    return { name, order };
  }
  return null;
}

/**
 * Reading position from a title that states it — "Book 3", "Part 2", "#4".
 * Deliberately conservative: a bare number in a title ("1984") is not an order.
 */
export function guessSeriesOrder(title: string | null | undefined): number | null {
  const value = String(title ?? "");
  const match =
    value.match(/#\s*(\d{1,3})\b/) ??
    value.match(/\b(?:book|part|volume|vol)\.?\s*(\d{1,3})\b/i);
  if (!match) return null;
  const order = Number(match[1]);
  return Number.isFinite(order) && order > 0 ? order : null;
}

/** Series name/position for a candidate, from the source's own metadata. */
function seriesFields(
  subjects: string[] | null | undefined,
  title: string,
): { series: string | null; seriesOrder: number | null } {
  const found = pickSeries(subjects);
  return {
    series: found?.name ?? null,
    seriesOrder: guessSeriesOrder(title) ?? found?.order ?? null,
  };
}

export function openLibraryCoverUrl(coverId: unknown, size: "S" | "M" | "L" = "M"): string | null {
  const id = Number(coverId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return `https://covers.openlibrary.org/b/id/${id}-${size}.jpg`;
}

/** Author portraits live under a different path than book covers. */
export function openLibraryAuthorPhoto(photoId: unknown, size: "S" | "M" | "L" = "M"): string | null {
  const id = Number(photoId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return `https://covers.openlibrary.org/a/id/${id}-${size}.jpg`;
}

/**
 * Sizes to try for a cover, best first. Non-Open-Library hosts get a single
 * attempt — there is nothing to cascade.
 */
export function coverVariants(url: string): { url: string; timeoutMs: number }[] {
  const match = url.match(/^(https:\/\/covers\.openlibrary\.org\/[ab]\/id\/\d+)-[SML]\.jpg$/i);
  if (!match) return [{ url, timeoutMs: 8000 }];

  return ["L", "M", "S"].map((size) => ({
    url: `${match[1]}-${size}.jpg`,
    // A wedged size hangs until the deadline, so keep each attempt short.
    timeoutMs: size === "L" ? 4000 : 5000,
  }));
}

export type OpenLibraryDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  author_key?: string[];
  first_publish_year?: number;
  cover_i?: number;
  isbn?: string[];
  publisher?: string[];
  subject?: string[];
  language?: string[];
  number_of_pages_median?: number;
  first_sentence?: unknown;
  edition_count?: number;
};

/** Turns one Open Library search hit into a candidate. */
export function mapOpenLibraryDoc(doc: OpenLibraryDoc): BookCandidate | null {
  const title = cleanText(doc.title);
  if (!title) return null;

  // Prefer an ISBN-13 — that is what most shops and covers are keyed on.
  const isbns = (doc.isbn ?? []).map((value) => normalizeIsbn(value)).filter(Boolean) as string[];
  const isbn = isbns.find((value) => value.length === 13) ?? isbns[0] ?? null;

  return {
    source: "openlibrary",
    id: String(doc.key ?? "").replace(/^\/works\//, ""),
    title: title.slice(0, 300),
    subtitle: null,
    authors: (doc.author_name ?? []).filter(Boolean).slice(0, 3),
    isbn,
    publisher: doc.publisher?.[0] ?? null,
    year: yearFrom(doc.first_publish_year),
    pages: doc.number_of_pages_median ?? null,
    language: languageName(doc.language?.[0]),
    subjects: (doc.subject ?? []).slice(0, 6),
    description: cleanText(firstSentence(doc.first_sentence)),
    coverUrl: openLibraryCoverUrl(doc.cover_i),
    editions: doc.edition_count ?? null,
    authorPhoto: null,
    ...seriesFields(doc.subject, title),
  };
}

export type OpenLibraryWork = {
  title?: string;
  description?: unknown;
  subjects?: string[];
  covers?: number[];
  first_publish_date?: string;
  first_publish_year?: number;
  authors?: { author?: { key?: string } }[];
};

/** Merges a /works/OL…W detail response onto a candidate. */
export function mapOpenLibraryWork(work: OpenLibraryWork, id: string): BookCandidate | null {
  const title = cleanText(work.title);
  if (!title) return null;

  let description: string | null = null;
  if (typeof work.description === "string") description = cleanText(work.description);
  else if (work.description && typeof work.description === "object") {
    description = cleanText((work.description as { value?: string }).value);
  }

  return {
    source: "openlibrary",
    id,
    title: title.slice(0, 300),
    subtitle: null,
    authors: [],
    isbn: null,
    publisher: null,
    year: yearFrom(work.first_publish_date ?? work.first_publish_year),
    pages: null,
    language: null,
    subjects: (work.subjects ?? []).slice(0, 6),
    description,
    coverUrl: openLibraryCoverUrl(work.covers?.[0]),
    editions: null,
    authorPhoto: null,
    ...seriesFields(work.subjects, title),
  };
}

export type OpenLibraryEdition = {
  title?: string;
  subtitle?: string;
  languages?: { key?: string }[];
  number_of_pages?: number;
  publishers?: string[];
  publish_date?: string;
  covers?: number[];
  works?: { key?: string }[];
};

export function editionLanguage(edition: OpenLibraryEdition): string | null {
  return languageName(edition.languages?.[0]?.key?.split("/").pop() ?? null);
}

/**
 * Overlays exact edition data onto a work-level candidate.
 *
 * The work knows the description and the author; the edition — the physical
 * copy an ISBN points at — knows the page count, publisher and language the shop
 * is actually buying. Together they make a complete record.
 */
export function applyEdition(candidate: BookCandidate, edition: OpenLibraryEdition): BookCandidate {
  return {
    ...candidate,
    title: cleanText(edition.title) ?? candidate.title,
    subtitle: cleanText(edition.subtitle) ?? candidate.subtitle,
    language: editionLanguage(edition) ?? candidate.language,
    pages: edition.number_of_pages ?? candidate.pages,
    publisher: edition.publishers?.[0] ?? candidate.publisher,
    year: yearFrom(edition.publish_date) ?? candidate.year,
    coverUrl: openLibraryCoverUrl(edition.covers?.[0]) ?? candidate.coverUrl,
  };
}

/** "OL66554W@9780141439518" → the work, plus the exact edition that was chosen. */
export function splitCandidateId(id: string): { workId: string; isbn: string | null } {
  const [head, tail] = id.split("@");
  return { workId: head.replace(/^\/works\//, ""), isbn: normalizeIsbn(tail ?? null) };
}

/* -------------------------------------------------------------------------- */
/* Mapping: Google Books (optional, needs GOOGLE_BOOKS_API_KEY)                */
/* -------------------------------------------------------------------------- */

export type GoogleVolume = {
  id?: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    description?: string;
    pageCount?: number;
    publishedDate?: string;
    publisher?: string;
    language?: string;
    categories?: string[];
    industryIdentifiers?: { type?: string; identifier?: string }[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
};

/**
 * Google serves small thumbnails over http. Ask for the largest zoom that is
 * reliably available and force https.
 */
export function upgradeGoogleCover(url: string | null | undefined): string | null {
  if (!url) return null;
  return url
    .replace(/^http:\/\//i, "https://")
    .replace(/&zoom=\d/, "&zoom=2")
    .replace(/&edge=curl/, "");
}

export function mapGoogleVolume(volume: GoogleVolume): BookCandidate | null {
  const info = volume.volumeInfo;
  const title = cleanText(info?.title);
  const id = volume.id;
  if (!title || !id) return null;

  const identifiers = info?.industryIdentifiers ?? [];
  const isbn13 = identifiers.find((entry) => entry.type === "ISBN_13")?.identifier;
  const isbn10 = identifiers.find((entry) => entry.type === "ISBN_10")?.identifier;

  return {
    source: "google",
    id,
    title: title.slice(0, 300),
    subtitle: cleanText(info?.subtitle),
    authors: (info?.authors ?? []).filter(Boolean).slice(0, 3),
    isbn: normalizeIsbn(isbn13 ?? isbn10 ?? null),
    publisher: cleanText(info?.publisher),
    year: yearFrom(info?.publishedDate),
    pages: info?.pageCount ?? null,
    language: languageName(info?.language),
    subjects: (info?.categories ?? []).slice(0, 6),
    description: cleanText(info?.description),
    coverUrl: upgradeGoogleCover(info?.imageLinks?.thumbnail ?? info?.imageLinks?.smallThumbnail),
    editions: null,
    // volumes.list has no series field; Google's answer would need another call.
    series: null,
    seriesOrder: null,
    authorPhoto: null,
  };
}

/* -------------------------------------------------------------------------- */
/* Networking                                                                  */
/* -------------------------------------------------------------------------- */

const SEARCH_FIELDS = [
  "key",
  "title",
  "author_name",
  "author_key",
  "first_publish_year",
  "cover_i",
  "isbn",
  "publisher",
  "subject",
  "language",
  "number_of_pages_median",
  "first_sentence",
  "edition_count",
].join(",");

/** fetch with a hard deadline — these hosts are occasionally very slow. */
async function fetchJson<T>(url: string, timeoutMs: number, cacheSeconds: number): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      // Repeat searches are cheap: one upstream call per query per hour.
      cache: "force-cache",
      next: { revalidate: cacheSeconds },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** The physical copy an ISBN points at — exact pages, publisher and language. */
async function fetchEdition(isbn: string): Promise<OpenLibraryEdition | null> {
  return fetchJson<OpenLibraryEdition>(
    `https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json`,
    12_000,
    86_400,
  );
}

async function searchOpenLibrary(query: string, limit: number): Promise<{ results: BookCandidate[]; total: number | null }> {
  const asIsbn = looksLikeIsbn(query) ? normalizeIsbn(query) : null;
  const q = asIsbn ? `isbn:${asIsbn}` : query;

  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(Math.min(50, Math.max(1, limit))));
  url.searchParams.set("fields", SEARCH_FIELDS);
  // Relevance order: a search box should answer the question that was asked.
  // (Sorting by popularity drags in unrelated bestsellers instead.)

  const payload = await fetchJson<{ numFound?: number; docs?: OpenLibraryDoc[] }>(url.toString(), 12_000, 3600);
  const docs = payload?.docs ?? [];
  const results = docs.map(mapOpenLibraryDoc).filter((row): row is BookCandidate => Boolean(row));
  const total = typeof payload?.numFound === "number" ? payload.numFound : null;

  if (!asIsbn) return { results, total };

  // An ISBN identifies one exact copy, so the edition record outranks the
  // work's aggregated — and often contradictory — edition data. Without this a
  // Penguin paperback comes back as "Spanish, 351 pages".
  let rows: BookCandidate[] = results.map((row) => ({ ...row, isbn: asIsbn }));
  const edition = await fetchEdition(asIsbn);
  if (edition && rows.length) rows = [applyEdition(rows[0], edition)];

  // Remember which edition was picked so the importer re-reads it too.
  rows = rows.filter((row) => Boolean(row.id)).map((row) => ({ ...row, id: `${row.id}@${asIsbn}` }));

  return { results: rows, total };
}

async function searchGoogle(query: string, limit: number): Promise<BookCandidate[]> {
  const key = process.env.GOOGLE_BOOKS_API_KEY?.trim();
  if (!key) return [];

  const asIsbn = looksLikeIsbn(query) ? normalizeIsbn(query) : null;
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", asIsbn ? `isbn:${asIsbn}` : query);
  url.searchParams.set("maxResults", String(Math.min(40, Math.max(1, limit))));
  url.searchParams.set("printType", "books");
  url.searchParams.set("key", key);

  const payload = await fetchJson<{ items?: GoogleVolume[] }>(url.toString(), 12_000, 3600);
  return (payload?.items ?? []).map(mapGoogleVolume).filter((row): row is BookCandidate => Boolean(row));
}

function dedupe(candidates: BookCandidate[]): BookCandidate[] {
  const seen = new Set<string>();
  const out: BookCandidate[] = [];
  for (const candidate of candidates) {
    const key = candidate.isbn
      ? `isbn:${candidate.isbn}`
      : `${candidate.title.toLowerCase()}|${(candidate.authors[0] ?? "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(candidate);
  }
  return out;
}

/**
 * Searches for a title, author or ISBN.
 *
 * Google results (when a key is configured) are merged ahead of Open Library,
 * because they carry a full description; Open Library fills in the rest.
 */
export async function searchBooks(query: string, limit = 12): Promise<SearchOutcome> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return { results: [], totalFound: null, hint: null };

  const bengali = hasBengaliScript(trimmed);
  // Bengali script is not indexed anywhere useful, so search the Latin spelling
  // of it instead and say so. The shop still keeps the Bangla the admin typed.
  const variants = bengali ? bengaliSearchVariants(trimmed) : [];
  const searched = variants[0] ?? trimmed;
  const queries = variants.length ? variants : [trimmed];
  const usesKey = Boolean(process.env.GOOGLE_BOOKS_API_KEY?.trim());

  const [google, ...libraries] = await Promise.all([
    usesKey ? searchGoogle(searched, limit) : Promise.resolve([]),
    ...queries.map((query) => searchOpenLibrary(query, limit)),
  ]);

  const results = dedupe([...google, ...libraries.flatMap((library) => library.results)]).slice(
    0,
    limit,
  );
  const totalFound = libraries.reduce<number | null>((best, library) => {
    if (typeof library.total !== "number") return best;
    return best === null ? library.total : Math.max(best, library.total);
  }, null);

  let hint: string | null = null;
  if (bengali) {
    hint = results.length
      ? `Bengali script: searched as “${queries.join("” and “")}”, which is how the outside ` +
        `catalogues index it. Rename it to the Bangla afterwards and the shop keeps that.`
      : `Bengali script: searched as “${queries.join("” and “")}” and found nothing. Try just the ` +
        `author, or add the book by hand — it will keep the Bangla title.`;
  } else if (!results.length) {
    hint =
      "Nothing matched. Try just the author or a shorter title — and remember the catalogue is " +
      "strongest for titles published in English.";
  }

  return {
    results,
    totalFound,
    hint,
  };
}

/** Re-reads one candidate from its source, so the client only ever sends an id. */
export async function fetchCandidate(source: BookSource, id: string): Promise<BookCandidate | null> {
  if (!id) return null;

  if (source === "google") {
    const key = process.env.GOOGLE_BOOKS_API_KEY?.trim();
    if (!key) return null;
    const payload = await fetchJson<GoogleVolume>(
      `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(id)}?key=${key}`,
      15_000,
      86_400,
    );
    return payload ? mapGoogleVolume(payload) : null;
  }

  const { workId, isbn } = splitCandidateId(id);
  const work = await fetchJson<OpenLibraryWork>(
    `https://openlibrary.org/works/${encodeURIComponent(workId)}.json`,
    15_000,
    86_400,
  );
  if (!work) return null;

  let candidate = mapOpenLibraryWork(work, workId);
  if (!candidate) return null;

  // When the admin picked a specific ISBN, re-read that exact edition as well.
  if (isbn) {
    const edition = await fetchEdition(isbn);
    if (edition) {
      candidate = applyEdition(candidate, edition);
      candidate.isbn = isbn;
    }
  }

  // Author names live behind a second call — worth it, the card shows them.
  // The same response carries the portrait Open Library holds for them.
  const authorKeys = (work.authors ?? [])
    .map((entry) => entry.author?.key)
    .filter((key): key is string => Boolean(key))
    .slice(0, 3);

  const people = await Promise.all(
    authorKeys.map(async (key) => {
      const authorId = key.replace(/^\/authors\//, "");
      const payload = await fetchJson<{ name?: string; photos?: number[] }>(
        `https://openlibrary.org/authors/${encodeURIComponent(authorId)}.json`,
        10_000,
        86_400,
      );
      return {
        name: cleanText(payload?.name),
        photo: openLibraryAuthorPhoto(payload?.photos?.[0], "M"),
      };
    }),
  );

  candidate.authors = people.map((person) => person.name).filter((name): name is string => Boolean(name));
  candidate.authorPhoto = people.find((person) => person.photo)?.photo ?? null;
  candidate.subjects = (work.subjects ?? []).slice(0, 6);

  return candidate;
}

/* -------------------------------------------------------------------------- */
/* Covers                                                                      */
/* -------------------------------------------------------------------------- */

export type DownloadedImage = { bytes: ArrayBuffer; contentType: string };

/** Pulls cover bytes so they can be re-hosted in our own storage bucket. */
export async function downloadImage(url: string, timeoutMs = 12_000): Promise<DownloadedImage | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "image/*" },
    });
    if (!response.ok) {
      console.warn(`[rey] cover download ${response.status} for ${url}`);
      return null;
    }

    const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!contentType.startsWith("image/")) {
      console.warn(`[rey] cover download not an image (${contentType}) for ${url}`);
      return null;
    }

    const bytes = await response.arrayBuffer();
    // Guards against a placeholder page being saved as a cover.
    if (bytes.byteLength < 512 || bytes.byteLength > 6_000_000) {
      console.warn(`[rey] cover download odd size (${bytes.byteLength}) for ${url}`);
      return null;
    }

    return { bytes, contentType };
  } catch (error) {
    console.warn(`[rey] cover download failed for ${url}: ${error instanceof Error ? error.message : error}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function extensionFor(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("svg")) return "svg";
  return "jpg";
}
