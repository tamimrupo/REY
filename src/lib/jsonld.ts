import { SITE_URL } from "./site-url";
import { DEFAULT_SITE } from "./types";
import type { Book } from "./types";

/**
 * JSON-LD structured-data builders. Values come from the catalog/settings and
 * are rendered server-side; nothing here is invented. If the editable site
 * settings diverge from DEFAULT_SITE, update the Organization block to read
 * from getSiteSettings() instead.
 */

export function organizationJsonLd() {
  // Only real social profiles belong in `sameAs`; an empty array fails Schema.org
  // validation, so omit the property entirely when none are configured.
  const sameAs = [DEFAULT_SITE.facebook, DEFAULT_SITE.instagram].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: DEFAULT_SITE.name,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/rey-logo-black.svg`,
    email: DEFAULT_SITE.email,
    telephone: DEFAULT_SITE.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "House # 28, Road # 8/A, Nikunjo-1",
      addressLocality: "Dhaka",
      postalCode: "1229",
      addressCountry: "BD",
    },
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export type BookSchemaOverrides = {
  /** Additional genre labels (e.g. ["Personal Finance"]). */
  genre?: string[];
  /** A LeaseOut subscription offer. */
  offer?: { price: number | string; currency: string };
};

export function bookJsonLd(
  book: Book,
  overrides?: BookSchemaOverrides,
): Record<string, unknown> | null {
  const author = book.authors?.name ? { "@type": "Person", name: book.authors.name } : undefined;
  // A Book without an `author` fails Schema.org validation, so omit the schema
  // entirely rather than emit an invalid one. Pages must skip rendering when
  // this returns null.
  if (!author) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    ...(book.subtitle ? { alternativeHeadline: book.subtitle } : {}),
    author,
    ...(book.isbn ? { isbn: book.isbn } : {}),
    ...(book.publisher ? { publisher: book.publisher } : {}),
    ...(book.published_year ? { datePublished: String(book.published_year) } : {}),
    ...(book.pages ? { numberOfPages: book.pages } : {}),
    ...(book.language ? { inLanguage: book.language } : {}),
    ...(book.description ? { description: book.description.slice(0, 300) } : {}),
    ...(overrides?.genre?.length ? { genre: overrides.genre } : {}),
    ...(overrides?.offer
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: overrides.offer.currency,
            price: overrides.offer.price,
            availability: "https://schema.org/InStock",
            businessFunction: "https://schema.org/LeaseOut",
            description: "Rental via monthly subscription from ৳299/month",
          },
        }
      : {}),
    ...(book.cover_url ? { image: book.cover_url } : {}),
  };
}

export function personJsonLd(person: {
  name: string;
  url: string;
  sameAs?: string[];
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    url: person.url,
    ...(person.sameAs?.length ? { sameAs: person.sameAs } : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: { "@id": `${SITE_URL}${item.path}` },
    })),
  };
}

/**
 * Pulls Question/Answer pairs out of the CMS FAQ page's plain-text content.
 * The FAQ page stores each entry as a "Q: …" / "A: …" line pair separated by a
 * blank line; answers may wrap onto more lines. The trailing "Still stuck?"
 * prose has no "Q:" so it is ignored.
 */
export function parseFaq(content: string): { q: string; a: string }[] {
  const items: { q: string; a: string }[] = [];
  for (const block of (content ?? "").split(/\n{2,}/)) {
    let q = "";
    const answer: string[] = [];
    for (const rawLine of block.split("\n")) {
      const line = rawLine.trim();
      if (/^Q:\s*/i.test(line)) q = line.replace(/^Q:\s*/i, "").trim();
      else if (/^A:\s*/i.test(line)) answer.push(line.replace(/^A:\s*/i, "").trim());
      else if (q) answer.push(line);
    }
    if (q && answer.length) items.push({ q, a: answer.join(" ").replace(/\s+/g, " ").trim() });
  }
  return items;
}

/**
 * FAQPage JSON-LD. Returns null (render nothing) when there are no valid Q/A
 * pairs, so a malformed or empty FAQ never emits an invalid schema block.
 */
export function faqJsonLd(qas: { q: string; a: string }[]): Record<string, unknown> | null {
  const mainEntity = qas.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  }));
  if (!mainEntity.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  };
}
