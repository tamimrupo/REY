export type BlogSection = { heading: string; paragraphs: string[] };

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingMinutes: number;
  sections: BlogSection[];
  related: { label: string; href: string }[];
};

export const POSTS: BlogPost[] = [
  {
    slug: "book-rental-vs-buying-bangladesh",
    title: "Book Rental vs Buying in Bangladesh: What Actually Costs Less",
    description:
      "Do the real math on renting books versus buying them in Bangladesh — the cost of a new hardcover against a monthly rental plan, and when each one wins.",
    date: "2026-10-06",
    readingMinutes: 4,
    sections: [
      {
        heading: "The real cost of owning a book in Bangladesh",
        paragraphs: [
          "A new paperback in Dhaka runs roughly ৳300 to ৳800; a hardcover or an imported title easily crosses ৳1,000 and can reach several thousand. Buy one a week and you are spending ৳1,200 to ৳8,000 a month on books you will most likely read once and shelve.",
          "The uncomfortable truth about buying is that the expensive part is not the book — it is the second read. Most books get finished once, then sit. If you are the kind of reader who finishes a novel and moves straight to the next one, you are paying for ownership you do not use.",
        ],
      },
      {
        heading: "What renting actually costs",
        paragraphs: [
          "A book rental plan changes the unit of payment from per-book to per-month. REY BD's plans start at ৳299 a month for two books at a time, ৳499 for four, and ৳799 for eight. A one-time ৳500 security deposit is refundable, and delivery in Dhaka starts from ৳40 — BD Post is free.",
          "There is no per-book charge. You pick the titles, they arrive at your door, and when the month is up the finished books are collected and your next box is on its way. The cost stays flat whether you read slowly or clear the whole stack.",
        ],
      },
      {
        heading: "The break-even math",
        paragraphs: [
          "If you finish two books a month, buying costs anywhere from ৳600 to ৳3,000+. The same two books on a rental plan cost ৳299 plus a small delivery fee. Read four books a month and the gap widens further: roughly ৳1,200 to ৳6,000+ to buy against ৳499 to rent.",
          "Rental wins the moment you read more than you re-read. It loses only for the handful of books you genuinely return to — the ones worth keeping, annotating, or lending.",
        ],
      },
      {
        heading: "When buying still wins",
        paragraphs: [
          "Reference books you consult repeatedly. Books you want to write in. Gifts, and the few titles with real sentimental value. For everything else — the novels, the bestsellers, the one-time reads — renting keeps the money in your pocket and the shelves clear.",
        ],
      },
    ],
    related: [
      { label: "See the rental plans", href: "/plans" },
      { label: "Browse the library", href: "/library" },
      { label: "How it works", href: "/how-it-works" },
    ],
  },
  {
    slug: "how-to-read-more-books",
    title: "How to Read More Books in Bangladesh (Without Buying Them)",
    description:
      "Practical ways to actually read more in 2026 — build the habit, keep the next book ready, and borrow instead of buying so cost never stops you.",
    date: "2026-10-06",
    readingMinutes: 4,
    sections: [
      {
        heading: "Start small, then let the habit grow",
        paragraphs: [
          "You do not need two hours a night. Fifteen minutes a day is a book a month. The habit compounds — and the single biggest predictor of reading more is simply always having a book within reach.",
          "Pick a fixed slot — the commute, the last ten minutes before sleep — and let the routine do the work motivation cannot.",
        ],
      },
      {
        heading: "Always have the next book ready",
        paragraphs: [
          "Most people stop reading not from lack of interest, but from friction: finishing one book and having nothing lined up. A subscription removes that gap. With two to eight books at a time, the next title is already on the shelf before you finish the current one.",
          "Choose the next book when you are excited about reading, not when you are already between books.",
        ],
      },
      {
        heading: "Match the format to the moment",
        paragraphs: [
          "A dense novel rewards a quiet evening; a short-story collection fits a commute. Keep both on hand. Bengali short stories, for example, are perfect in fifteen-minute bursts, while a long novel carries a lazy weekend.",
        ],
      },
      {
        heading: "Borrow instead of buying",
        paragraphs: [
          "Cost is a real, silent reason people read less. When every book is a purchase, reading becomes a decision to spend — and the answer is often no. Renting flips it: the books are already paid for, so the only decision left is what to read next.",
        ],
      },
    ],
    related: [
      { label: "Start a plan from ৳299/mo", href: "/plans" },
      { label: "Browse by genre", href: "/genres" },
    ],
  },
  {
    slug: "best-books-2026-bangladesh",
    title: "Best Books to Read in 2026 in Bangladesh",
    description:
      "The books readers in Bangladesh are borrowing most in 2026 — fiction that stays with you, ideas that change how you think, and page-turners for the weekend.",
    date: "2026-10-06",
    readingMinutes: 5,
    sections: [
      {
        heading: "Fiction that stays with you",
        paragraphs: [
          "A Little Life is the kind of novel readers finish and immediately press on a friend — long, intense, and hard to shake. 1984 remains the reference point for the world we are still arguing about, and A Game of Thrones is where the fantasy readers start before they cannot stop.",
          "All three are on the REY BD shelves, ready to be borrowed instead of bought.",
        ],
      },
      {
        heading: "Books that change how you think",
        paragraphs: [
          "101 Essays That Will Change The Way You Think earns its title for readers who want their nonfiction in short, sharp doses. 12 Rules for Life is the perennial conversation-starter, whether you agree with it or argue with it.",
          "For something that stretches further, A Brief History of Time is still the shortest route from armchair to the edges of physics.",
        ],
      },
      {
        heading: "Page-turners for the weekend",
        paragraphs: [
          "11/22/63 is Stephen King at his most compulsive — time travel, history, and a love story that keeps the pages turning. If you want a long weekend to disappear, this is the one to pick.",
        ],
      },
      {
        heading: "Try one, rent the next",
        paragraphs: [
          "Every title above is available in the library. Pick a plan, add the ones you want to your box, and swap them for the next batch when the month is up. Reading more in 2026 is less about willpower than about removing the cost and the friction.",
        ],
      },
    ],
    related: [
      { label: "A Little Life", href: "/library/a-little-life" },
      { label: "101 Essays That Will Change The Way You Think", href: "/library/101-essays-that-will-change-the-way-you-think" },
      { label: "11/22/63", href: "/library/11-22-63" },
      { label: "1984", href: "/library/1984" },
      { label: "A Brief History of Time", href: "/library/a-brief-history-of-time" },
      { label: "Browse the library", href: "/library" },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}
