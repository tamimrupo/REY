-- =============================================================================
-- REY BD -- canonical book edition dedup
--
-- Adds a nullable self-FK `canonical_book_id` on `books`. When set, the variant
-- edition's /library/[slug] page emits `alternates.canonical` pointing at the
-- primary edition's own URL instead of self-referencing, so duplicate editions
-- (e.g. chander-pahar-2 -> chander-pahar) consolidate search signals.
--
-- Safe to re-run.
-- =============================================================================

alter table books
  add column if not exists canonical_book_id uuid references books(id) on delete set null;

create index if not exists books_canonical_idx
  on books (canonical_book_id)
  where canonical_book_id is not null;

comment on column books.canonical_book_id is
  'Primary edition this variant duplicates. When set, the book page canonicalizes to the primary slug.';
