-- -----------------------------------------------------------------------------
-- Book series
-- -----------------------------------------------------------------------------
-- A catalogue needs to say "this is Himu #1, that is Himu #16" so the shop can
-- offer "read this next" instead of a flat pile of titles.
--
-- `series` is free text on purpose: there is no reliable authority for Bangla
-- series data (Open Library has nothing for Humayun Ahmed), so the admin owns
-- it, and the importer only fills it in when Open Library actually says
-- "series:...".
alter table books add column if not exists series text;
alter table books add column if not exists series_order int;

create index if not exists books_series_idx on books (series) where series is not null;

comment on column books.series is 'Series name, e.g. Himu or A Song of Ice and Fire.';
comment on column books.series_order is 'Position within the series, 1-based. Null when unknown.';
