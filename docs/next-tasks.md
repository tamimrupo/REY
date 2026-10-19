# Next tasks

> The owner asked to be reminded about these. Check this file when starting a
> session, and bring the open items up.

## Waiting on the owner

### Google sign-in
- Needs a **Google Cloud OAuth client** (client ID + secret) and the Google
  provider enabled in Supabase → Authentication → Providers.
- Once the credentials exist: add "Continue with Google" to `/login` and
  `/register`, keep the `next` redirect, and test with a real account.

## Ready to build

### Availability badges ("1 copy left")
- Public visitors cannot read other members' rentals, so this needs a small
  additive database view rather than a client query.
- Plan: `book_availability` view exposing only `(book_id, out_count)` over
  `rentals` where status is `out` or `returning`; grant `select` to `anon` and
  `authenticated`.
- Then: fetch counts for the 24 books on `/library`, show a badge on
  `BookCard` ("1 copy left" / "Waitlist") and a hint next to the book page CTA.
- Apply the migration to production only after reviewing it.

## Still open from earlier

- **Meta CAPI end-to-end test**: throwaway signup → `CompleteRegistration`;
  test payment → `Purchase` (then delete the test rows).
- **Resubmit `sitemap.xml`** in Google Search Console (the previous fetch
  failed).
- **Import the Bangla CSV** (Admin → Import): `bangla-books-goodreads.csv` on
  the Desktop (48 titles, untracked).
