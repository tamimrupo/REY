-- =============================================================================
-- REY BD — seed data (safe to re-run)
-- Adapt prices/numbers in the admin dashboard afterwards.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Genres
-- ---------------------------------------------------------------------------
insert into genres (name, slug, sort_order) values
  ('Biography','biography',1),
  ('Business','business',2),
  ('Classic','classic',3),
  ('Drama','drama',4),
  ('Fantasy','fantasy',5),
  ('Fiction','fiction',6),
  ('Health','health',7),
  ('History','history',8),
  ('Islamic','islamic',9),
  ('Kids','kids',10),
  ('Philosophy','philosophy',11),
  ('Romance','romance',12),
  ('Science','science',13),
  ('Self-help','self-help',14),
  ('Thriller','thriller',15),
  ('Bengali','bengali',16)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Plans
-- ---------------------------------------------------------------------------
insert into plans (name, slug, tagline, price_monthly, books_per_month, security_deposit, is_popular, sort_order) values
  ('Starter Explorer','starter-explorer','A gentle start — two books at a time.',299.00,2,500.00,false,1),
  ('Avid Bibliophile','avid-bibliophile','For the reader who finishes a book a week.',499.00,4,500.00,true,2),
  ('Collector''s Edition','collectors-edition','Eight books a month. No waiting around.',799.00,8,500.00,false,3)
on conflict (slug) do update set
  price_monthly = excluded.price_monthly,
  books_per_month = excluded.books_per_month,
  tagline = excluded.tagline;

insert into plan_features (plan_id, feature, sort_order)
select p.id, f.feature, f.sort_order
from plans p
join (values
  ('starter-explorer','Pick 2 books at a time',1),
  ('starter-explorer','Return or swap each month',2),
  ('starter-explorer','Cancel anytime',3),
  ('avid-bibliophile','Pick 4 books at a time',1),
  ('avid-bibliophile','Return or swap each month',2),
  ('avid-bibliophile','Priority on new arrivals',3),
  ('collectors-edition','Pick 8 books at a time',1),
  ('collectors-edition','Return or swap each month',2),
  ('collectors-edition','First access to rare titles',3)
) as f(slug, feature, sort_order) on f.slug = p.slug
where not exists (
  select 1 from plan_features pf where pf.plan_id = p.id and pf.feature = f.feature
);

-- ---------------------------------------------------------------------------
-- Authors
-- ---------------------------------------------------------------------------
insert into authors (name, slug) values
  ('Viktor E. Frankl','viktor-e-frankl'),
  ('Brianna Wiest','brianna-wiest'),
  ('Stephen King','stephen-king'),
  ('Jordan B. Peterson','jordan-b-peterson'),
  ('George Orwell','george-orwell'),
  ('James Patterson','james-patterson'),
  ('Stephen Hawking','stephen-hawking'),
  ('Charles Dickens','charles-dickens'),
  ('Sarah J. Maas','sarah-j-maas'),
  ('George R. R. Martin','george-r-r-martin'),
  ('Colleen Hoover','colleen-hoover'),
  ('Agatha Christie','agatha-christie'),
  ('Dan Brown','dan-brown'),
  ('Sukumar Roy','sukumar-roy'),
  ('Karl Marx','karl-marx'),
  ('Henry Gray','henry-gray')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Books
-- ---------------------------------------------------------------------------
insert into books (title, slug, author_id, genre_id, cover_url, language, rarity, description, pages, published_year)
select v.title, v.slug, a.id, g.id, v.cover_url, v.language, v.rarity::book_rarity, v.description, v.pages, v.year
from (values
  ('... Trotzdem Ja zum Leben sagen','trotzdem-ja-zum-leben-sagen','viktor-e-frankl','biography',
   'https://qdeskit.com/rey/wp-content/uploads/2026/09/cover_w1600-387-400x533.jpg','German','common',
   'Viktor Frankl''s account of finding meaning in the unlikeliest of places.',192,1946),
  ('101 Essays That Will Change The Way You Think','101-essays-that-will-change-the-way-you-think','brianna-wiest','self-help',
   'https://qdeskit.com/rey/wp-content/uploads/2026/09/cover_w1600-190-400x533.jpg','English','common',
   'Short, sharp essays that reframe how you see everyday life.',336,2016),
  ('11/22/63','11-22-63','stephen-king','thriller',
   'https://qdeskit.com/rey/wp-content/uploads/2026/09/cover_w1600-438-400x533.jpg','English','common',
   'A time-travelling attempt to stop the Kennedy assassination.',849,2011),
  ('12 Rules for Life','12-rules-for-life','jordan-b-peterson','philosophy',
   'https://qdeskit.com/rey/wp-content/uploads/2026/09/cover_w1600-191-400x533.jpg','English','common',
   'An antidote to chaos: twelve principles for living well.',409,2018),
  ('1984','1984','george-orwell','classic',
   'https://qdeskit.com/rey/wp-content/uploads/2026/09/9780451524935-2.jpg','English','common',
   'Orwell''s dystopia of surveillance and language control.',328,1949),
  ('1st to Die','1st-to-die','james-patterson','thriller',
   'https://qdeskit.com/rey/wp-content/uploads/2026/09/cover_w1600-289-400x533.jpg','English','common',
   'The Women''s Murder Club takes on its first case.',424,2001),
  ('A Brief History of Time','a-brief-history-of-time','stephen-hawking','science',
   'https://qdeskit.com/rey/wp-content/uploads/2026/09/cover_w1600-388-400x533.jpg','English','common',
   'From the Big Bang to black holes, plainly explained.',212,1988),
  ('A Christmas Carol','a-christmas-carol','charles-dickens','drama',
   'https://qdeskit.com/rey/wp-content/uploads/2026/09/cover_w1600-442-400x533.jpg','English','common',
   'Scrooge, three spirits, and one very cold Christmas Eve.',112,1843),
  ('A Court of Thorns and Roses','a-court-of-thorns-and-roses','sarah-j-maas','fantasy',
   'https://qdeskit.com/rey/wp-content/uploads/2026/09/cover_w1600-29-400x533.jpg','English','common',
   'A huntress is dragged into a faerie court of masks and debts.',419,2015),
  ('A Game of Thrones','a-game-of-thrones','george-r-r-martin','fantasy',
   'https://qdeskit.com/rey/wp-content/uploads/2026/09/cover_w1600-2-400x533.jpg','English','common',
   'Noble houses play a deadly game for the Iron Throne.',694,1996),
  ('All Your Perfects','all-your-perfects','colleen-hoover','romance',
   'https://qdeskit.com/rey/wp-content/uploads/2026/09/cover_w1600-328-400x533.jpg','English','common',
   'A marriage held together by one promise.',320,2018),
  ('And Then There Were None','and-then-there-were-none','agatha-christie','thriller',
   'https://qdeskit.com/rey/wp-content/uploads/2026/09/cover_w1600-245-400x533.jpg','English','common',
   'Ten strangers, one island, and a nursery rhyme.',256,1939),
  ('Angels & Demons','angels-demons','dan-brown','thriller',
   'https://qdeskit.com/rey/wp-content/uploads/2026/09/cover_w1600-257-400x533.jpg','English','common',
   'A symbologist races an ancient brotherhood through Rome.',616,2000),
  ('Abol Tabol','abol-tabol','sukumar-roy','kids',
   null,'Bengali','rare',
   'Bangla nonsense verse that has outlived a century of readers.',96,1923),
  ('Capital, Volume I','capital-volume-i','karl-marx','philosophy',
   null,'English','rare',
   'An abridged printing of Marx''s critique of political economy.',1152,1867),
  ('Why We Sleep','why-we-sleep','henry-gray','health',
   null,'English','common',
   'A clear-eyed look at what sleep does for the body and mind.',368,2017)
) as v(title, slug, author_slug, genre_slug, cover_url, language, rarity, description, pages, year)
left join authors a on a.slug = v.author_slug
left join genres g on g.slug = v.genre_slug
on conflict (slug) do nothing;

-- One copy per title, plus a second copy for the popular English titles.
insert into book_copies (book_id, copy_code, status)
select b.id, b.slug || '-01', 'available'
from books b
where not exists (select 1 from book_copies c where c.book_id = b.id and c.copy_code = b.slug || '-01');

insert into book_copies (book_id, copy_code, status)
select b.id, b.slug || '-02', 'available'
from books b
where b.language = 'English'
  and not exists (select 1 from book_copies c where c.book_id = b.id and c.copy_code = b.slug || '-02');

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------
insert into settings (key, value) values
  ('site', jsonb_build_object(
    'name','REY BD',
    'tagline','Choose your plan, pick your books.',
    'email','hello@reybd.com',
    'phone','+880 17921 02092',
    'address','House # 28, Road # 8/A, Nikunjo-1, Dhaka-1229',
    'facebook','https://www.facebook.com/',
    'instagram','https://www.instagram.com/'
  )),
  ('announcement', jsonb_build_object(
    'enabled', true,
    'text','Free delivery on BD Post. New arrivals every week.'
  )),
  ('payments', jsonb_build_object(
    'enabled', true,
    'instructions','Send the first payment to the bKash or Nagad number below, then submit the TrxID. We verify within a few hours.',
    'methods', jsonb_build_array(
      jsonb_build_object('key','bkash','label','bKash','number','01792102092','type','Personal'),
      jsonb_build_object('key','nagad','label','Nagad','number','01792102092','type','Personal'),
      jsonb_build_object('key','rocket','label','Rocket','number','017921020925','type','Personal')
    )
  )),
  ('delivery', jsonb_build_object(
    'methods', jsonb_build_array(
      jsonb_build_object('key','steadfast','label','Steadfast','fee',40,'note','50% off'),
      jsonb_build_object('key','pathao','label','Pathao','fee',40,'note','50% off'),
      jsonb_build_object('key','redx','label','RedX','fee',40,'note','50% off'),
      jsonb_build_object('key','bdpost','label','BD Post','fee',0,'note','Free'),
      jsonb_build_object('key','other','label','Other courier','fee',40,'note','')
    )
  )),
  ('deposit', jsonb_build_object(
    'amount', 500,
    'refundable', true,
    'note','Charged on your first order and refunded when your membership ends and all books are returned.'
  ))
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- CMS pages
-- ---------------------------------------------------------------------------
insert into cms_pages (slug, title, excerpt, content, status, sort_order) values
  ('about-us','About REY',
   'A book club for people who read more than they can buy.',
   E'REY started with a simple frustration: good books are expensive, and a shelf gets heavy fast.\n\nSo we built a club. You choose a plan, pick the titles you actually want, and we deliver them to your door. Read them, return them, and swap them for the next stack. No shelf to dust, no guilt about the ones you never got to.\n\nWe are based in Nikunjo, Dhaka, and we deliver nationwide with Steadfast, Pathao, RedX and Bangladesh Post.',
   'published',1),
  ('how-it-works','How it works',
   'Three steps from sign-up to your first delivery.',
   E'1. Pick a plan — 2, 4 or 8 books a month.\n2. Choose your books from the library. Save them to your box.\n3. Pay your first month plus the refundable security deposit. We deliver within 2–4 days.\n\nEach month we email you when it is time to pick again. Return the books you have finished, keep the ones you have not, and we will send the next batch.\n\nDamaged a book? Tell us. We handle wear and tear with common sense.',
   'published',2),
  ('terms-conditions','Terms & Conditions',
   'The rules of the club.',
   E'By subscribing to REY you agree to:\n\n1. Borrow books for personal reading only. Books remain the property of REY.\n2. Return books in a readable condition within your subscription month.\n3. Pay for books that are lost or badly damaged, at replacement cost.\n4. Keep your delivery details accurate and current.\n\nWe may pause or cancel a membership that repeatedly breaches these terms.',
   'published',3),
  ('privacy-policy','Privacy Policy',
   'What we collect and why.',
   E'We collect your name, phone number, delivery address and email so we can deliver books and reach you about your membership.\n\nWe never sell your data. Payment details you submit (such as a bKash transaction ID) are used only to confirm your payment.\n\nYou can ask us to delete your account and data at any time by emailing hello@reybd.com.',
   'published',4),
  ('return-refund-deposit-policy','Return, Refund & Deposit Policy',
   'How deposits work and when refunds happen.',
   E'The security deposit is a one-time, refundable 500 BDT. It is charged with your first order and is returned when your membership ends and every borrowed book has come back to us.\n\nRefunds are issued to your bKash or Nagad number within 7 working days of the final return, minus any replacement charges for lost or damaged books.\n\nMonthly plan fees are not refundable once a delivery has been dispatched.',
   'published',5),
  ('shipping-delivery-policy','Shipping & Delivery Policy',
   'Where we deliver and how long it takes.',
   E'We deliver across Bangladesh through Steadfast, Pathao, RedX and Bangladesh Post.\n\nDhaka: 1–2 working days. Outside Dhaka: 2–4 working days.\n\nDelivery is charged at 40 BDT with our discounted courier rates, and is free with Bangladesh Post. You may check the package before accepting delivery.',
   'published',6),
  ('rental-rules','Rental Rules',
   'Keep the club pleasant for everyone.',
   E'- Read and enjoy. Notes in pencil are fine.\n- Water damage, missing pages and pet damage are not wear and tear.\n- Do not lend your books to someone else; the membership is yours.\n- Return books by the end of your cycle so the next reader can have them.\n\nIf a book is lost or damaged beyond reading, we charge replacement cost and remove it from your box.',
   'published',7),
  ('faq','FAQ & Help Centre',
   'Quick answers to the questions we get most.',
   E'Q: Can I change my plan? Yes — from your account page, at the start of any month.\n\nQ: Can I keep a book longer than a month? Yes, just keep it in your box and it stays with you.\n\nQ: What if I want a book you do not have? Use the Rare & Requests page and we will try to source it.\n\nQ: When am I charged? On sign-up, and every month on the same date afterwards.\n\nStill stuck? Email hello@reybd.com or call +880 17921 02092.',
   'published',8)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Promote your own account to admin after you sign up.
-- Replace the email, then run:
--
--   update profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');
-- ---------------------------------------------------------------------------
