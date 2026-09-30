import { slugify } from "@/lib/format";
import type { Demand } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* CSV import                                                                  */
/* -------------------------------------------------------------------------- */

export type ImportRow = {
  title: string;
  author?: string | null;
  isbn?: string | null;
  categories?: string | null;
  genre?: string | null;
  rarity?: "common" | "rare";
  demand?: Demand;
  description?: string | null;
  price?: number | null;
  replacement_value?: number | null;
  stock?: number | null;
  image_url?: string | null;
  publisher?: string | null;
  year?: number | null;
  language?: string | null;
  pages?: number | null;
  status?: string | null;
};

export const IMPORT_HEADERS = [
  "title",
  "author",
  "isbn",
  "categories",
  "rarity",
  "description",
  "price",
  "stock",
  "image_url",
  "publisher",
  "year",
  "language",
  "status",
];

/** Minimal RFC-4180 CSV parser: handles quotes, escaped quotes and newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      pushField();
    } else if (char === "\n") {
      pushRow();
    } else if (char === "\r") {
      // ignore
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length) pushRow();

  return rows;
}

export function csvToRows(text: string): { rows: ImportRow[]; skipped: number; error?: string } {
  const table = parseCsv(text);
  if (table.length < 2) return { rows: [], skipped: 0, error: "The CSV needs a header row and at least one book." };

  const header = table[0].map((cell) => cell.trim().toLowerCase().replace(/\s+/g, "_"));
  const index = (name: string) => header.indexOf(name);

  const rows: ImportRow[] = [];
  let skipped = 0;

  for (const cells of table.slice(1)) {
    const get = (name: string) => {
      const i = index(name);
      return i === -1 ? "" : (cells[i] ?? "").trim();
    };

    const title = get("title");
    if (!title) {
      skipped += 1;
      continue;
    }

    const number = (value: string) => {
      const n = Number(value.replace(/[^\d.-]/g, ""));
      return Number.isFinite(n) && value !== "" ? n : null;
    };

    const rarity = get("rarity").toLowerCase() === "rare" ? "rare" : "common";
    const demandRaw = get("demand").toLowerCase();
    const demand: Demand = ["high", "medium", "low"].includes(demandRaw)
      ? (demandRaw as Demand)
      : "medium";

    rows.push({
      title,
      author: get("author") || null,
      isbn: get("isbn") || null,
      categories: get("categories") || null,
      genre: get("genre") || get("categories") || null,
      rarity,
      demand,
      description: get("description") || get("short_description") || null,
      price: number(get("price")),
      replacement_value: number(get("replacement_value")) ?? number(get("price")),
      stock: number(get("stock")) ?? number(get("copies")),
      image_url: get("image_url") || get("image") || null,
      publisher: get("publisher") || null,
      year: number(get("year")),
      language: get("language") || null,
      pages: number(get("pages")),
      status: get("status") || null,
    });
  }

  return { rows, skipped };
}

/* -------------------------------------------------------------------------- */
/* Open Library                                                                */
/* -------------------------------------------------------------------------- */

export const OPEN_LIBRARY_PRESETS: { key: string; label: string; query: string }[] = [
  { key: "world", label: "World popular fiction", query: "subject:fiction" },
  { key: "selfhelp", label: "Self-help / money", query: "subject:self-help OR subject:personal_finance" },
  { key: "thriller", label: "Thriller / mystery", query: "subject:thriller OR subject:mystery" },
  { key: "kids", label: "Kids / YA", query: "subject:juvenile_fiction OR subject:young_adult" },
  { key: "bangla", label: "Bangla / Bengali", query: "language:ben" },
  { key: "islamic", label: "Islamic / religion", query: "subject:islam OR subject:quran" },
  { key: "romance", label: "Romance", query: "subject:romance" },
  { key: "scifi", label: "Science fiction", query: "subject:science_fiction" },
  { key: "classics", label: "Classics", query: "subject:classics" },
];

type OpenLibraryDoc = {
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  isbn?: string[];
  publisher?: string[];
  subject?: string[];
  language?: string[];
  number_of_pages_median?: number;
};

/** Pulls a page of books from Open Library's public search API. */
export async function fetchOpenLibrary(
  query: string,
  limit = 24,
  offset = 0,
): Promise<{ rows: ImportRow[]; error?: string }> {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(Math.min(50, Math.max(5, limit))));
  url.searchParams.set("offset", String(Math.max(0, offset)));
  url.searchParams.set("sort", "want_to_read");
  url.searchParams.set("fields", "title,author_name,first_publish_year,cover_i,isbn,publisher,subject,language,number_of_pages_median");

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return { rows: [], error: `Open Library returned ${response.status}.` };

    const payload = (await response.json()) as { docs?: OpenLibraryDoc[] };
    const rows: ImportRow[] = (payload.docs ?? [])
      .filter((doc) => Boolean(doc.title))
      .map((doc) => {
        const subjects = (doc.subject ?? []).slice(0, 6);
        return {
          title: String(doc.title).trim().slice(0, 300),
          author: doc.author_name?.[0] ?? null,
          isbn: doc.isbn?.[0] ?? null,
          categories: subjects.join(", ") || null,
          genre: subjects[0] ?? null,
          rarity: "common" as const,
          demand: "medium" as const,
          description: subjects.length ? `Subjects: ${subjects.join(", ")}.` : null,
          price: null,
          replacement_value: 800,
          stock: 2,
          image_url: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
          publisher: doc.publisher?.[0] ?? null,
          year: doc.first_publish_year ?? null,
          language: doc.language?.[0] === "ben" ? "Bangla" : "English",
          pages: doc.number_of_pages_median ?? null,
          status: "publish",
        };
      });

    return { rows };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : "Could not reach Open Library." };
  }
}

/* -------------------------------------------------------------------------- */
/* De-duplication                                                              */
/* -------------------------------------------------------------------------- */

export function normalizeIsbn(isbn: string | null | undefined): string | null {
  if (!isbn) return null;
  const digits = String(isbn).replace(/[^\dXx]/g, "").toUpperCase();
  return digits.length >= 10 ? digits : null;
}

export function bookSlug(title: string): string {
  const base = slugify(title);
  return base || `book-${Date.now().toString(36)}`;
}
