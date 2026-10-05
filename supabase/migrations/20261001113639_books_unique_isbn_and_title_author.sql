-- =============================================================================
-- REY BD — books: unique ISBN and (title, author) indexes
--
-- Recorded from the version already applied to the linked project
-- (dldhibwxltrvzoqtiyqz) on 2026-10-01. It was missing from this folder, so
-- local migrations did not match the database.
--
-- The importer already refuses duplicates, but nothing stopped a second
-- insert arriving by another route (a CSV with the same book, a retry).
-- These indexes make it impossible rather than merely unlikely.
--
-- Safe to re-run.
-- =============================================================================

create unique index if not exists books_isbn_key
  on public.books (isbn)
  where isbn is not null and btrim(isbn) <> '';

create unique index if not exists books_title_author_key
  on public.books (lower(btrim(title)), coalesce(author_id, '00000000-0000-0000-0000-000000000000'::uuid));
