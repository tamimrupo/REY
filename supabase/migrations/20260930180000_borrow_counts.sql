-- =============================================================================
-- REY BD — 0009: borrow counts per book
--
-- Powers the "most borrowed" ranking on the home-page shelf. It must run as
-- SECURITY DEFINER because RLS would otherwise limit the count to the caller's
-- own rentals — and a "best selling" list that only sees your own orders is
-- worthless.
--
-- It exposes nothing but a book id and a number, so there is no PII here.
--
-- Safe to re-run. Run AFTER 20260930170000_author_photos.sql.
-- =============================================================================

create or replace function public.book_borrow_counts()
returns table (book_id uuid, borrowed bigint)
language sql
stable
security definer
set search_path = public
as $$
  select r.book_id, count(*)::bigint as borrowed
    from rentals r
   where r.book_id is not null
     and r.status <> 'cancelled'
   group by r.book_id;
$$;

revoke all on function public.book_borrow_counts() from public;
grant execute on function public.book_borrow_counts() to anon, authenticated, service_role;
