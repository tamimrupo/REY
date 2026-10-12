/**
 * GSC round-1 on-page copy, transcribed verbatim from the content worker's
 * source file (QDesk SEO/rey.bd/content/gsc-round-1-copy.md). Keyed by the
 * catalog slug of the page each block targets, so the author and book pages
 * can look up a per-page override without a database change.
 *
 * Nothing here is derived at render time and nothing is invented: the strings
 * are the exact copy, punctuation included. Where the source left a choice
 * (e.g. the Bangla title for পুতুল নাচের ইতিকথা) the recommended default is used.
 */

export type BestOfBook = {
  /** The bolded lead of the bullet — the title (Bangla or Latin). */
  bold: string;
  /** Everything after the bold, including the transliteration and note. */
  rest: string;
};

export type AuthorCopy = {
  /** <title> override. */
  title?: string;
  /** Meta-description override. */
  description?: string;
  /** H1 override (falls back to the author's name when absent). */
  h1?: string;
  /** Replaces the AuthorCard bio paragraph (Parvej Husen Talukder). */
  bio?: string;
  /** The editorial "best of" block rendered below the H1, above the shelf. */
  bestOf?: {
    intro: string[];
    books: BestOfBook[];
    hook?: string;
  };
  /** Person JSON-LD node (name + sameAs). `url` is derived from the slug. */
  person?: { name: string; sameAs: string[] };
};

export type BookCopy = {
  /** <title> override. */
  title?: string;
  /** Meta-description override. */
  description?: string;
  /** H1 override. */
  h1?: string;
  /** English summary paragraphs (Rich Dad Poor Dad). */
  summary?: string[];
  /** "Why rent it" bullets. */
  whyRent?: string[];
  /** Compact plans lines. */
  plans?: string[];
  /** Short FAQ. */
  faq?: { q: string; a: string }[];
  /** Bangla summary paragraphs, rendered with lang="bn". */
  banglaSummary?: string[];
  /** The "পিডিএফ নয় — ভাড়া নিন" line (bold lead + rest). */
  pdfLine?: { bold: string; rest: string };
  /** Book schema upgrades (genre + LeaseOut offer). */
  schema?: { genre: string[]; offer: { price: number; currency: string } };
};

const BOOKS_HEADING = "His books in the club:";
export { BOOKS_HEADING };

const WIKI = "https://en.wikipedia.org/wiki";
const GR = "https://www.goodreads.com/author/show";

export const AUTHOR_COPY: Record<string, AuthorCopy> = {
  "sharadindu-bandyopadhyay": {
    title: "Sharadindu Bandyopadhyay Books to Rent in Bangladesh",
    description:
      "Rent Sharadindu Bandyopadhyay books — Byomkesh Bakshi & Samagra — delivered in Bangladesh from ৳299/month. No due dates, no fines.",
    h1: "Rent Sharadindu Bandyopadhyay books",
    bestOf: {
      intro: [
        `Sharadindu Bandyopadhyay gave Bengali readers Byomkesh Bakshi — the "truth-seeker" detective (সত্যনেষী) who solves cases with logic and observation instead of muscle. REY BD keeps his collected mysteries and his supernatural stories, ready to rent. Whether you know Byomkesh from the books or the screen, this is the shelf to meet him properly.`,
      ],
      books: [
        { bold: "Byomkesh samagra", rest: " (ব্যোমকেশ সমগ্র) — the collected Byomkesh Bakshi mysteries." },
        { bold: "Byomkesh Bakshi", rest: " — the classic detective stories that introduced সত্যনেষী." },
        { bold: "Aloukik Galpa Samagra", rest: " (অলৌকিক গল্প সমগ্র) — his supernatural fiction." },
      ],
      hook: "Each is included in every plan from ৳299/month — rent one this month, swap for the next.",
    },
    person: {
      name: "Sharadindu Bandyopadhyay",
      sameAs: [
        `${WIKI}/Sharadindu_Bandyopadhyay`,
        `${GR}/257813.Sharadindu_Bandyopadhyay`,
      ],
    },
  },

  "parvej-husen-talukder": {
    title: "Parvej Husen Talukder Books — Chorar Jhalak to Rent | REY BD",
    description:
      "Rent Parvej Husen Talukder's Chorar Jhalak from REY BD — Bangladeshi rhyme & verse, delivered in Bangladesh from ৳299/month.",
    bio: `Parvej Husen Talukder is a Bangladeshi poet and children's writer, born in 2005 in Derai Upazila, Sunamganj. He is known for his humorous rhymes (ছড়া) and poetry for young readers. His first published rhyme collection, Chorar Jhalak (2021), is the title in REY BD's catalog. He also founded Kavya Kishor International, a platform supporting young writers.`,
  },

  "humayun-ahmed": {
    bestOf: {
      intro: [
        `Humayun Ahmed is the writer most Bangladeshi readers name first — a novelist, screenwriter and filmmaker whose books sit on shelves in homes that own no others. His characters — Himu, Misir Ali, Baker Bhai — are people half the country feels it already knows. He wrote plainly, for everyone, and that is why a new reader finds him welcoming instead of intimidating. REY BD keeps his best-loved titles, ready to rent from ৳299/month.`,
      ],
      books: [
        { bold: "হিমু সমগ্র", rest: " (Himu Somogro) — the collected stories of his barefoot, yellow-panjabi wanderer." },
        { bold: "শঙ্খনীল কারাগার", rest: " (Shonkho Neel Karagar) — the family novel readers call one of his finest." },
        { bold: "জোছনা ও জননীর গল্প", rest: " (Josna O Jononir Golpo) — the Liberation War story readers suggest first." },
        { bold: "কোথাও কেউ নেই", rest: " (Kothao Keu Nei) — the novel behind one of Bangladesh's most-watched dramas." },
      ],
    },
    person: {
      name: "Humayun Ahmed",
      sameAs: [`${WIKI}/Humayun_Ahmed`, `${GR}/6983656.Humayun_Ahmed`],
    },
  },

  "rabindranath-tagore": {
    bestOf: {
      intro: [
        `Rabindranath Tagore is best known for the songs and poems that won him the Nobel Prize, but as a novelist he invented the modern Bangla story. His fiction asks the same questions we still ask — about identity, love and belonging — and it does so with a psychological honesty that was decades ahead of its time. REY BD keeps his major novels, ready to rent from ৳299/month.`,
      ],
      books: [
        { bold: "গোরা", rest: " (Gora) — the long, ambitious novel of identity and belonging many call his best." },
        { bold: "চোখের বালি", rest: " (Chokher Bali) — the sharp, psychologically honest story of a widow, a marriage and a friendship." },
      ],
    },
    person: {
      name: "Rabindranath Tagore",
      sameAs: [`${WIKI}/Rabindranath_Tagore`, `${GR}/36913.Rabindranath_Tagore`],
    },
  },

  "bibhutibhushan-bandyopadhyay": {
    bestOf: {
      intro: [
        `Bibhutibhushan Bandyopadhyay wrote about a Bengal of villages, forests and rivers with a tenderness no one else in Bangla has matched. His books feel slow, green and true — and one of them, চাঁদের পাহাড়, is among the great adventure novels in the language. REY BD keeps his best, ready to rent from ৳299/month.`,
      ],
      books: [
        { bold: "চাঁদের পাহাড়", rest: " (Chander Pahar) — the Africa-set adventure novel that proved his range." },
        { bold: "পথের পাঁচালী", rest: " (Pather Panchali) — the village novel that became the film that changed world cinema." },
        { bold: "আরণ্যক", rest: " (Aranyak) — his love letter to wilderness, at the edge of the jungle." },
      ],
    },
    person: {
      name: "Bibhutibhushan Bandyopadhyay",
      sameAs: [
        `${WIKI}/Bibhutibhushan_Bandyopadhyay`,
        `${GR}/6093739.Bibhutibhushan_Bandyopadhyay`,
      ],
    },
  },

  "muhammed-zafar-iqbal": {
    bestOf: {
      intro: [
        `Muhammed Zafar Iqbal is the writer who made science and curiosity part of Bangladeshi childhood — a scientist and storyteller whose young-adult novels have been read, re-read and passed around for a generation. His stories treat young readers as intelligent, and that is why they keep coming back. REY BD keeps his most-loved titles, ready to rent from ৳299/month.`,
      ],
      books: [
        { bold: "আমি তপু", rest: " (Ami Topu) — one of his most-read young-adult novels." },
        { bold: "দীপু নাম্বার টু", rest: " (Dipu Number Two) — the much-loved novel that was also adapted to film." },
        { bold: "আমার বন্ধু রাশেদ", rest: " (Amar Bondhu Rashed) — a story of friendship set against the Liberation War." },
        { bold: "হাত কাটা রবিন", rest: " (Hat Kata Robin) — a favourite among younger readers." },
      ],
    },
    person: {
      name: "Muhammed Zafar Iqbal",
      sameAs: [`${WIKI}/Muhammed_Zafar_Iqbal`, `${GR}/4242779.Muhammed_Zafar_Iqbal`],
    },
  },

  "satyajit-ray": {
    bestOf: {
      intro: [
        `Satyajit Ray is world-famous as a filmmaker, but Bengali readers know him as something more — the creator of Feluda, the sharp-eyed private detective whose cases they have read since childhood. (Feluda is Satyajit Ray's creation.) REY BD keeps the Feluda books, ready to rent from ৳299/month.`,
      ],
      books: [
        { bold: "Feluda Samagra", rest: " (ফেলুদা সমগ্র) — the collected Feluda mysteries." },
        { bold: "Sonar Kella", rest: " (সোনার কেল্লা) — the most famous Feluda story, set on a journey to Rajasthan." },
      ],
    },
    person: {
      name: "Satyajit Ray",
      sameAs: [`${WIKI}/Satyajit_Ray`, `${GR}/6590819.Satyajit_Ray`],
    },
  },

  // The catalog spelling of Manik's name varies between "Bandyopadhyay" (the
  // copy file's target slug) and "Bandopadhyay" (Goodreads' export). Key the
  // same block under both so the content renders whichever slug the DB uses.
  "manik-bandyopadhyay": {
    bestOf: {
      intro: [
        `Manik Bandyopadhyay brought psychological depth and social honesty to Bengali fiction. He wrote about village life, river people and the educated mind with a realism that was decades ahead of its time. REY BD keeps his two great novels, ready to rent from ৳299/month.`,
      ],
      books: [
        { bold: "পুতুল নাচের ইতিকথা", rest: " (Putul Nacher Itikatha) — the 1936 landmark of Bengali realism." },
        { bold: "পদ্মানদীর মাঝি", rest: " (Padma Nadir Majhi) — the story of the boatmen of the Padma." },
      ],
    },
    person: {
      name: "Manik Bandyopadhyay",
      sameAs: [`${WIKI}/Manik_Bandyopadhyay`, `${GR}/1199103.Manik_Bandopadhyay`],
    },
  },
  "manik-bandopadhyay": {
    bestOf: {
      intro: [
        `Manik Bandyopadhyay brought psychological depth and social honesty to Bengali fiction. He wrote about village life, river people and the educated mind with a realism that was decades ahead of its time. REY BD keeps his two great novels, ready to rent from ৳299/month.`,
      ],
      books: [
        { bold: "পুতুল নাচের ইতিকথা", rest: " (Putul Nacher Itikatha) — the 1936 landmark of Bengali realism." },
        { bold: "পদ্মানদীর মাঝি", rest: " (Padma Nadir Majhi) — the story of the boatmen of the Padma." },
      ],
    },
    person: {
      name: "Manik Bandyopadhyay",
      sameAs: [`${WIKI}/Manik_Bandyopadhyay`, `${GR}/1199103.Manik_Bandopadhyay`],
    },
  },
};

export const BOOK_COPY: Record<string, BookCopy> = {
  "rich-dad-poor-dad": {
    title: "Rent Rich Dad Poor Dad — Robert Kiyosaki | REY BD",
    description:
      "Rent Rich Dad Poor Dad by Robert Kiyosaki from REY BD — the #1 personal-finance classic, delivered in Dhaka from ৳299/month. No due dates, no fines.",
    h1: "Rent Rich Dad, Poor Dad by Robert Kiyosaki",
    summary: [
      `Rich Dad Poor Dad is Robert T. Kiyosaki's personal-finance classic, first published in 1997 and still the book people reach for when they first think seriously about money. It is built around the two "dads" of Kiyosaki's childhood: his own highly educated father — the "poor dad" — and the father of his best friend, a self-made businessman — the "rich dad." From those two men he draws a simple lesson most of us were never taught in school: that the wealthy build and buy assets that pay them, while everyone else works for money and spends it on things that only look like assets. Its core ideas — assets versus liabilities, financial education, and working to learn rather than only to earn — have made it one of the best-selling personal-finance books ever written. It is not a get-rich scheme; it is a book about changing how you think about money, one chapter at a time.`,
    ],
    whyRent: [
      "Read it in a month and swap it for the next one.",
      "No shelf clutter — send it back when you're done.",
      "Costs a fraction of buying the paperback.",
      "It's already in the club's collection — no waiting, no searching.",
    ],
    plans: [
      "Included in every plan — 2 books ৳299/mo, 4 books ৳499/mo, 8 books ৳799/mo.",
      "One-time refundable deposit ৳500 · Dhaka delivery 1–4 days · no due dates, no fines.",
    ],
    faq: [
      { q: "How long can I keep it?", a: "No due dates — keep each book as long as you like within your plan." },
      { q: "Is there a late fee?", a: "No. There are no fines, ever." },
      { q: "What if I want to buy it?", a: "You can ask the team about buying a title outright instead of returning it." },
    ],
    schema: {
      genre: ["Personal Finance"],
      offer: { price: 299, currency: "BDT" },
    },
  },

  "putulanacher-itikatha": {
    title: "পুতুল নাচের ইতিকথা — মানিক বন্দ্যোপাধ্যায় | রে বিডি",
    description:
      "মানিক বন্দ্যোপাধ্যায়ের পুতুল নাচের ইতিকথা — রে বিডি থেকে ভাড়া নিন, ঢাকায় হোম ডেলিভারি ৳২৯৯/মাস থেকে। পিডিএফ খুঁজছেন? বৈধভাবে পড়ুন।",
    h1: "পুতুল নাচের ইতিকথা",
    banglaSummary: [
      `মানিক বন্দ্যোপাধ্যায়ের "পুতুল নাচের ইতিকথা" (১৯৩৬) বাংলা সাহিত্যের মনস্তাত্ত্বিক বাস্তবতার অন্যতম শ্রেষ্ঠ নিদর্শন। উপন্যাসের নায়ক শশী — একজন তরুণ ডাক্তার, যে কলকাতায় চিকিৎসাবিদ্যা শেষ করে ফিরে আসে নিজের গ্রামে। গ্রামের মানুষের কুসংস্কার, ভণ্ডামি আর আধুনিক শিক্ষিত মনের দ্বন্দ্ব — এই দুই শক্তির টানাপোড়েন নিয়েই এগোয় কাহিনি। শশী গ্রামের মানুষকে ভালোবাসে, কিন্তু তাদের অন্ধবিশ্বাস তাকে পীড়া দেয়; সে বদলাতে চায়, অথচ নিজের ভেতরের দ্বিধাও তাকে ছাড়ে না। মানিক বন্দ্যোপাধ্যায় এখানে সমাজের ছবি আঁকেননি শুধু, মানুষের মনের গভীর স্তর পর্যন্ত পাঠককে নামিয়ে এনেছেন। এ কারণেই প্রকাশের প্রায় নয় দশক পরেও উপন্যাসটি বাংলা কথাসাহিত্যের এক অনিবার্য নাম। যাঁরা বাংলা সাহিত্যের মাইলফলকগুলো পড়তে চান, তাঁদের জন্য এটি একটি আবশ্যিক শুরু।`,
    ],
    pdfLine: {
      bold: "পিডিএফ নয় — ভাড়া নিন:",
      rest: " লেখকের কষ্টার্জিত বই পিডিএফে নয় — প্রতি মাসে ৳২৯৯ থেকে বৈধভাবে পড়ুন, কোন জরিমানা নেই।",
    },
  },

  "padmanadir-majhi": {
    banglaSummary: [
      `মানিক বন্দ্যোপাধ্যায়ের "পদ্মানদীর মাঝি" (১৯৩৬) পদ্মা নদীর তীরের জেলে-মাঝিদের জীবন নিয়ে লেখা বাংলা কথাসাহিত্যের এক অমর উপন্যাস। প্রধান চরিত্র কুবের — একজন দরিদ্র জেলে, যে নদীর কোলেই বড় হয়েছে আর নদীই তার জীবিকা। ঋণ, দারিদ্র্য আর মহাজনের শোষণের মধ্যে বাঁচার সংগ্রাম তার নিত্যসঙ্গী। এরই ফাঁকে ফুটে ওঠে তার শ্যালিকা কপিলার প্রতি এক নিষিদ্ধ টান — ভালোবাসা আর অপরাধবোধের সেই জটিল অনুভূতি, যা উপন্যাসটিকে দিয়েছে অসাধারণ মনস্তাত্ত্বিক গভীরতা। মানিক বন্দ্যোপাধ্যায় এখানে প্রান্তিক মানুষের দুঃখ-দুর্দশা এঁকেছেন সহানুভূতির সঙ্গে, কিন্তু কোনো বাড়তি আবেগ ছাড়া। নদী, ঝড় আর জেলেপাড়ার জীবন এমনভাবে ফুটে উঠেছে যে পাঠক যেন নিজেই সেই পৃথিবীতে পা রাখেন। বাংলা সাহিত্যের শ্রেষ্ঠ উপন্যাসগুলোর তালিকায় "পদ্মানদীর মাঝি" চিরকালীন স্থান পেয়েছে।`,
    ],
  },

  "himu-somogro": {
    banglaSummary: [
      `হুমায়ূন আহমেদের "হিমু সমগ্র" বাংলা সাহিত্যের অন্যতম জনপ্রিয় চরিত্র হিমুর গল্পগুলোর সংকলন। হিমু — খালি পায়ে হাঁটা, হলুদ পাঞ্জাবি পরা এক অদ্ভুত তরুণ, যে ঢাকার রাস্তায় ঘুরে বেড়ায় আর বলে যায় এমন সব কথা, যা শুনতে সাধারণ অথচ গভীর সত্য। তার জীবনযাপনের কোনো ছক নেই, কোনো লক্ষ্য নেই — তবু তার প্রতিটি কথা পাঠককে ভাবায়। হিমুর গল্প শুরু হয়েছিল উপন্যাস হিসেবে, পরে তা হয়ে ওঠে টেলিভিশন-ঘটনা; প্রায় অর্ধেক বাংলাদেশ হিমুর সংলাপ মুখে মুখে বলতে পারে। হুমায়ূন আহমেদের লেখার সহজ ভাষা আর হিমুর নিষ্পাপ দর্শন মিলে এমন এক জগৎ তৈরি করে, যেখানে পাঠক নিজের জীবনের প্রশ্নগুলোর হালকা, সৎ উত্তর খুঁজে পায়। যাঁরা হিমুকে প্রথমবার চিনতে চান কিংবা পুরোনো প্রিয় গল্পগুলো আবার পড়তে চান, তাঁদের জন্য "হিমু সমগ্র" সেরা শুরু।`,
    ],
  },

  "chander-pahar": {
    banglaSummary: [
      `বিভূতিভূষণ বন্দ্যোপাধ্যায়ের "চাঁদের পাহাড়" (১৯৩৭) বাংলা সাহিত্যের সেরা অ্যাডভেঞ্চার উপন্যাস। এর নায়ক শঙ্কর — গ্রামের এক তরুণ, যে চাকরির সন্ধানে আফ্রিকায় পাড়ি জমায় এবং সেখানে রেলের কাজ করতে গিয়ে জড়িয়ে পড়ে এক দুঃসাহসিক অভিযানে। পর্তুগিজ অভিযাত্রী দিয়েগো আলভারেজের সঙ্গে সে খোঁজে এক রহস্যময় পর্বত — চাঁদের পাহাড়, যার অস্তিত্ব কেউ বিশ্বাস করে না। সিংহের ভয়, দুর্গম জঙ্গল, নিঃসঙ্গতা আর অজানার টান — এ একেবারে ভিন্ন বিভূতিভূষণ। গ্রাম-বাংলার কোমল গদ্যের লেখক এখানে প্রমাণ করেছেন তিনি কত বড় গল্পকার। প্রজন্মের পর প্রজন্ম এই বইটি হাতে তুলে দিয়েছে পরের প্রজন্মের হাতে। যাঁরা মনে করেন বাংলা ক্লাসিক মানেই ধীরগতির, তাঁদের জন্য "চাঁদের পাহাড়" হবে সবচেয়ে বড় চমক — এটি পড়া শুরু করলে থামানো কঠিন।`,
    ],
  },
};
