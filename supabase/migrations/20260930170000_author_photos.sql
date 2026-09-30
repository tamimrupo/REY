-- =============================================================================
-- REY BD — 0008: author photos
--
-- The home-page shelf shows the active book's author in a round avatar. Add an
-- optional photo for authors; when it is empty the UI falls back to the
-- author's initials, so nothing looks broken before you upload anything.
--
-- Safe to re-run. Run AFTER 20260930160000_admin_promotion_fix.sql.
-- =============================================================================

alter table authors add column if not exists avatar_url text;
