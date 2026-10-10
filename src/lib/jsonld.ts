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

export function bookJsonLd(book: Book) {
  const author = book.authors?.name ? { "@type": "Person", name: book.authors.name } : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    ...(book.subtitle ? { alternativeHeadline: book.subtitle } : {}),
    ...(author ? { author } : {}),
    ...(book.isbn ? { isbn: book.isbn } : {}),
    ...(book.publisher ? { publisher: book.publisher } : {}),
    ...(book.published_year ? { datePublished: String(book.published_year) } : {}),
    ...(book.pages ? { numberOfPages: book.pages } : {}),
    ...(book.language ? { inLanguage: book.language } : {}),
    ...(book.description ? { description: book.description.slice(0, 300) } : {}),
    ...(book.cover_url ? { image: book.cover_url } : {}),
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
