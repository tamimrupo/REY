/**
 * REY BD — approved sales copy for the Messenger sales bot.
 *
 * This is the single source of truth for what the agent may say. Every string
 * is the approved copy from the sales-scripts doc (Bangla + English). The LLM
 * may use these verbatim or adapt them slightly, but must stay on-brand and
 * fact-accurate — it must NEVER invent a price, a deposit term, a delivery
 * time, or a book title that is not already in this file.
 *
 * `[title]`, `[shelf]`, `[link]` are template placeholders. The agent fills
 * them only from the live catalog / lead context, and never with a title that
 * is not actually in the catalog.
 */

export interface Script {
  /** Stable id, matches the sales-scripts doc. */
  id: string;
  /** Human intent this script answers. */
  intent: string;
  /** What typically triggers it. */
  trigger: string;
  en: string;
  bn: string;
}

/* -------------------------------------------------------------------------- */
/* Brand facts (verified — do not invent)                                      */
/* -------------------------------------------------------------------------- */

export const BRAND_FACTS = `REY BD is a Dhaka book-rental subscription.
Plans: Starter ৳299/mo (2 books) · Avid ৳499/mo (4 books, most popular) · Collector ৳799/mo (8 books).
One-time ৳500 refundable deposit (charged once, returned when the plan ends; normal wear is free; it only ever applies to a lost or ruined book).
No due dates, no fines, cancel or pause any month.
Catalog: 223 titles (Tagore 32, Humayun Ahmed 28, Satyajit Ray 20, Zafar Iqbal 11), new titles every week.
Delivery: Dhaka & Chattogram same/next day; everywhere else in Bangladesh 2–4 days. Free via BD Post Book Post, otherwise ~৳40 a trip. You can check the package at the door.
Payment: bKash / Nagad / Rocket.
Signup: rey.bd/plans (site: rey.bd).
Competitor: Bookcentric charges ৳300–1,100 for the same idea.`;

export const TONE_RULES = `Tone is the whole game — the no-pressure brand IS the close. Sell relief, never urgency.
1. One value fact + one question (or one low-stakes CTA) per message. Never stack asks.
2. Mirror the customer's language: reply in Bangla if they write Bangla, English if they write English. Use Bangla for depth/trust.
3. Close with a reversible yes ("Start with Starter ৳299 — cancel anytime, deposit refunded when you stop"). Never sell commitment — sell "cancel anytime".
4. Preempt, don't rebut: lead with risk-reversal (refundable deposit, normal wear free, cancel anytime).
5. Treat deposit questions as BUYING SIGNALS — the lead is past price, onto mechanics. Reassure and move to signup.
6. Never use countdowns, scarcity, or guilt. The only urgency allowed is gentle opportunity cost ("every month you wait is a month of books unread").
7. Keep every reply short (≤ 80 words English, comparable in Bangla).
8. Never invent facts. Only use the brand facts above. If asked something unknown, say you'll check and stay honest.`;

/* -------------------------------------------------------------------------- */
/* Scripts                                                                     */
/* -------------------------------------------------------------------------- */

export const SCRIPTS: Script[] = [
  {
    id: "instant_reply",
    intent: "instant_reply",
    trigger: "any inbound DM",
    en: "Hey! Thanks for your message — glad you reached out. Let me get you the right answer. Quick one first: about how many books do you read in a month?",
    bn: "হ্যালো! মেসেজের জন্য ধন্যবাদ। আপনার প্রশ্নের সঠিক উত্তরটা দিচ্ছি — তার আগে একটা ছোট প্রশ্ন: আপনি মাসে আনুমানিক কয়টা বই পড়ে শেষ করেন?",
  },
  {
    id: "lead_price",
    intent: "price",
    trigger: "\"How much?\" / \"কত টাকা?\"",
    en: "From ৳299 a month. Starter ৳299 (2 books) · Avid ৳499 (4 books, most popular) · Collector ৳799 (8 books). No due dates, no fines — cancel or pause any month. Bookcentric charges ৳300–1,100 for the same idea. How many books do you usually read a month?",
    bn: "মাসে ৳২৯৯ থেকে শুরু। স্টার্টার ৳২৯৯ (২টি বই) · অ্যাভিড ৳৪৯৯ (৪টি, সবচেয়ে জনপ্রিয়) · কালেক্টর ৳৭৯৯ (৮টি)। কোনো ডিউ ডেট নেই, জরিমানা নেই — যেকোনো মাসে বাতিল বা বিরতি দিতে পারবেন। বই সেন্টার একই ধারণার জন্য ৳৩০০–১১০০ নেয়। আপনি মাসে কয়টা বই পড়েন?",
  },
  {
    id: "lead_catalog",
    intent: "catalog",
    trigger: "\"Which books?\" / \"Do you have Humayun Ahmed?\"",
    en: "We do — 223 English and Bangla titles, with new ones every week: Tagore (32), Humayun Ahmed (28), Satyajit Ray (20), Zafar Iqbal (11) and more. Browse every shelf at rey.bd. About how many books do you get through in a month, so I can suggest the right plan?",
    bn: "জি, আছে — ২২৩টি ইংরেজি ও বাংলা বই, প্রতি সপ্তাহে নতুন আসে: রবীন্দ্রনাথ (৩২টি), হুমায়ূন আহমেদ (২৮টি), সত্যজিৎ রায় (২০টি), জাফর ইকবাল (১১টি) সহ আরও অনেক। সব শেলফ দেখুন rey.bd-তে। আপনি মাসে কয়টা বই পড়েন, যাতে সঠিক প্ল্যানটা বলতে পারি?",
  },
  {
    id: "lead_delivery",
    intent: "delivery",
    trigger: "\"Do you deliver to X?\"",
    en: "We deliver all over Bangladesh. Dhaka & Chattogram same/next day; everywhere else 2–4 days. Delivery is free via BD Post Book Post, otherwise about ৳40 a trip — and you can check the package at the door. Ready when you are: sign up at rey.bd/plans.",
    bn: "সারা বাংলাদেশে ডেলিভারি করি। ঢাকা ও চট্টগ্রামে একই বা পরের দিন; বাকি সব জায়গায় ২–৪ দিন। বিডি পোস্টের বুক পোস্টে ডেলিভারি ফ্রি, নাহলে প্রায় ৳৪০ প্রতি ট্রিপ — আর প্যাকেজ দরজায় দাঁড়িয়ে দেখে নিতে পারবেন। প্রস্তুত হলে rey.bd/plans-এ সাইন আপ করুন।",
  },
  {
    id: "lead_deposit",
    intent: "deposit",
    trigger: "\"Is the ৳500 refundable?\" / \"Why the deposit?\"",
    en: "The ৳500 deposit is fully refundable — charged once, and returned when your plan ends. Normal reading wear costs nothing; it only ever applies to a lost or ruined book. So there's really nothing to risk. Ready to start? Sign up at rey.bd/plans.",
    bn: "৳৫০০ ডিপোজিট পুরোপুরি ফেরতযোগ্য — একবারই কাটা হয়, আর প্ল্যান শেষ হলে ফেরত পেয়ে যাবেন। স্বাভাবিক পড়ার ঘর্ষণে কোনো খরচ নেই; শুধু বই হারিয়ে গেলে বা নষ্ট হলে তখনই প্রযোজ্য। তাই ঝুঁকির কিছু নেই। শুরু করতে চাইলে rey.bd/plans-এ সাইন আপ করুন।",
  },
  {
    id: "lead_how_it_works",
    intent: "how_it_works",
    trigger: "\"How does it work?\" / \"is this a library?\"",
    en: "Think of it as a book subscription, not a library — so no due dates and no fines. Three simple steps: pick a plan, choose your titles, and we swap them at your doorstep (the rider takes the old books and leaves the new ones). Browse the catalog at rey.bd.",
    bn: "এটা লাইব্রেরি নয়, বরং বইয়ের সাবস্ক্রিপশন — তাই কোনো ডিউ ডেট নেই, জরিমানাও নেই। মাত্র তিনটি ধাপ: প্ল্যান বাছুন, বই পছন্দ করুন, আর আমরা দরজায় এসে বদলে দিই (পুরোনো বই নিয়ে নতুন বই রেখে যায়)। ক্যাটালগ দেখুন rey.bd-তে।",
  },
  {
    id: "lead_think_about_it",
    intent: "stall",
    trigger: "\"I'll think about it\"",
    en: "Of course, take your time — no pressure at all. A new hardcover costs about a full day's wage, so a month of reading from ৳299 is worth a look whenever you're ready. Want me to note your area so I can send you this week's new arrivals?",
    bn: "অবশ্যই, সময় নিন — কোনো চাপ নেই। একটা নতুন হার্ডকভারের দাম প্রায় এক দিনের মজুরির সমান, তাই ৳২৯৯-এ মাসভর পড়ার সুযোগটা সময় পেলে একবার দেখে নেবেন। আপনার এলাকাটা লিখে রাখব, যাতে এই সপ্তাহের নতুন বইগুলো পাঠাতে পারি?",
  },
  {
    id: "lead_just_browsing",
    intent: "just_browsing",
    trigger: "\"Just looking\"",
    en: "No rush — browse away! 223 books. 0 due dates. 0 fines. You can look through every shelf at rey.bd, and I'm here if you have any questions.",
    bn: "কোনো তাড়া নেই — দেখতে থাকুন! ২২৩টি বই। ০ ডিউ ডেট। ০ জরিমানা। rey.bd-তে সব শেলফ ঘুরে দেখুন, আর কোনো প্রশ্ন থাকলে আমি আছি।",
  },
  {
    id: "lead_book_not_found",
    intent: "book_not_found",
    trigger: "\"Do you have X?\" (not in catalog) — never say no",
    en: "That title isn't on the shelf this week — but we add new books every week, so it may land soon. Here's the closest shelf in the meantime: [link]. Want me to message you the moment a copy shows up?",
    bn: "এই বইটা এই সপ্তাহে শেলফে নেই — তবে প্রতি সপ্তাহে নতুন বই যোগ হয়, তাই শীঘ্রই আসতে পারে। ততক্ষণ কাছাকাছি একটা শেলফ দেখুন: [লিংক]। বইটা এলে কি আপনাকে জানিয়ে দেব?",
  },
  {
    id: "qual_volume",
    intent: "qual_volume",
    trigger: "qualify reading volume",
    en: "How many books do you usually get through in a month?",
    bn: "আপনি মাসে সাধারণত কয়টা বই পড়ে শেষ করেন?",
  },
  {
    id: "qual_location",
    intent: "qual_location",
    trigger: "qualify location",
    en: "Which part of the city are you in? That way I can tell you exactly when books reach you.",
    bn: "আপনি শহরের কোন এলাকায় থাকেন? তাহলে বই কবে পৌঁছাবে ঠিক করে বলতে পারব।",
  },
  {
    id: "qual_taste",
    intent: "qual_taste",
    trigger: "qualify taste",
    en: "What do you enjoy reading — Bangla or English, and what kind? I'll match your first box to it.",
    bn: "আপনি কী ধরনের বই ভালোবাসেন — বাংলা না ইংরেজি, আর কোন ধরনের? সেভাবেই প্রথম বক্সটা সাজিয়ে দেব।",
  },
  {
    id: "obj_price",
    intent: "obj_price",
    trigger: "\"৳299 is too much\"",
    en: "I hear you. A new hardcover costs about a full day's wage — and Bookcentric charges ৳300–1,100 for the same idea. REY starts at ৳299 a month, and if you read a book a week, Avid at ৳499 works out to about ৳125 a book. Worth a look?",
    bn: "বুঝতে পারছি। একটা নতুন হার্ডকভারের দাম প্রায় এক দিনের মজুরির সমান — আর বই সেন্টার একই ধারণার জন্য ৳৩০০–১১০০ নেয়। রে শুরু মাত্র ৳২৯৯ মাসে, আর সপ্তাহে একটা করে পড়লে অ্যাভিড ৳৪৯৯-এ প্রতি বই পড়ে প্রায় ৳১২৫। একবার দেখে নেবেন?",
  },
  {
    id: "obj_deposit",
    intent: "obj_deposit",
    trigger: "\"Will I get it back?\"",
    en: "Yes — the ৳500 deposit is 100% refundable, charged once, and returned when your plan ends. It only ever applies to a book that's lost or ruined; normal wear like a creased spine costs nothing.",
    bn: "জি — ৳৫০০ ডিপোজিট ১০০% ফেরতযোগ্য, একবারই কাটা হয় আর প্ল্যান শেষ হলে ফেরত পাবেন। শুধু বই হারিয়ে গেলে বা নষ্ট হলে তখনই প্রযোজ্য; ভাঁজ পড়া বা স্বাভাবিক ঘর্ষণে কোনো খরচ নেই।",
  },
  {
    id: "obj_maybe_later",
    intent: "obj_maybe_later",
    trigger: "\"Maybe later\" / stall",
    en: "No pressure at all — you can pause or cancel any month. Just remember every month you wait is a month of books unread. I'm here whenever you're ready.",
    bn: "কোনো চাপ নেই — যেকোনো মাসে বিরতি দিতে বা বাতিল করতে পারবেন। শুধু ভাবুন, অপেক্ষার প্রতিটা মাসই না-পড়া বইয়ের মাস। যখন প্রস্তুত হবেন আমি আছি।",
  },
  {
    id: "obj_book_choice",
    intent: "obj_book_choice",
    trigger: "\"Do you have what I want?\"",
    en: "We carry 223 English and Bangla titles, growing weekly — including rare Bangla books others don't stock: Tagore (32), Humayun Ahmed (28), Satyajit Ray (20), Zafar Iqbal (11). Which author should I check for you?",
    bn: "আমাদের কাছে ২২৩টি ইংরেজি ও বাংলা বই আছে, প্রতি সপ্তাহে বাড়ছে — যার মধ্যে অন্যরা রাখে না এমন দুর্লভ বাংলা বইও আছে: রবীন্দ্রনাথ (৩২), হুমায়ূন আহমেদ (২৮), সত্যজিৎ রায় (২০), জাফর ইকবাল (১১)। আপনার জন্য কোন লেখক খুঁজে দেখব?",
  },
  {
    id: "obj_delivery",
    intent: "obj_delivery",
    trigger: "\"I'm outside Dhaka\"",
    en: "We deliver nationwide. Dhaka & Chattogram are same/next day; everywhere else 2–4 days. Book Post delivery is free, otherwise about ৳40 a trip — and you can check the package at your door.",
    bn: "সারা দেশে ডেলিভারি করি। ঢাকা ও চট্টগ্রামে একই বা পরের দিন; বাকি জায়গায় ২–৪ দিন। বুক পোস্টে ডেলিভারি ফ্রি, নাহলে প্রায় ৳৪০ প্রতি ট্রিপ — আর প্যাকেজ দরজায় দাঁড়িয়ে দেখে নিতে পারবেন।",
  },
  {
    id: "obj_not_read_much",
    intent: "obj_not_read_much",
    trigger: "\"I don't read much\" / no time",
    en: "That's exactly who Starter is made for — ৳299, two books a month, no due dates, no fines, and you keep a book as long as you need. Slow readers are never penalized here.",
    bn: "এমন পাঠকের জন্যই তো স্টার্টার — মাসে ৳২৯৯, দুটি বই, কোনো ডিউ ডেট নেই, জরিমানা নেই, আর যত দিন দরকার বই রাখতে পারবেন। ধীরে পড়া পাঠককে এখানে কখনো শাস্তি দেওয়া হয় না।",
  },
  {
    id: "obj_digital_physical",
    intent: "obj_digital_physical",
    trigger: "\"Why not just read PDFs?\"",
    en: "Physical books cut screen fatigue, and many rare Bangla titles aren't cleanly digitized anyway. There's real joy in a paper book — a cozy corner, a rainy evening. Plus you read and return, so no shelf clutter.",
    bn: "ছাপা বই চোখের ক্লান্তি কমায়, আর অনেক দুর্লভ বাংলা বই ঠিকভাবে ডিজিটাল হয়নি। কাগজের বইয়ে আলাদাই আনন্দ — এক কোণে আরাম করে পড়া, বৃষ্টির বিকেল। আর পড়ে ফেরত দেন, তাই ঘরে জঞ্জালও জমে না।",
  },
  {
    id: "obj_commitment",
    intent: "obj_commitment",
    trigger: "\"What if I don't like it?\"",
    en: "There's no lock-in. Cancel or pause any month, and the ৳500 deposit is refunded when you stop. The risk is fully reversible — you're never stuck.",
    bn: "কোনো লক-ইন নেই। যেকোনো মাসে বাতিল বা বিরতি দিতে পারবেন, আর থামলে ৳৫০০ ডিপোজিট ফেরত পাবেন। ঝুঁকি পুরোপুরি ফেরানো যায় — আপনি কখনো আটকে থাকবেন না।",
  },
  {
    id: "obj_damage",
    intent: "obj_damage",
    trigger: "damage / loss worry",
    en: "Just tell us and we'll sort it out. Normal wear costs nothing; the deposit only covers a lost or ruined book — and it's refunded when your plan ends.",
    bn: "শুধু আমাদের জানান, আমরা দেখে নেব। স্বাভাবিক ঘর্ষণে কোনো খরচ নেই; ডিপোজিট শুধু বই হারালে বা নষ্ট হলে প্রযোজ্য — আর প্ল্যান শেষে সেটা ফেরতও পাবেন।",
  },
  {
    id: "obj_buy_own",
    intent: "obj_buy_own",
    trigger: "\"I already buy my own books\"",
    en: "Buying means one hardcover is about a full day's wage, and it sits on the shelf after one read. Renting means more books for less money, swapped at your door, no clutter. You might read more than you ever have.",
    bn: "কেনা মানে একটা হার্ডকভারের দাম প্রায় এক দিনের মজুরি, আর একবার পড়ে সেটা শেলফে পড়ে থাকে। রেন্টে কম টাকায় বেশি বই, দরজায় এসে বদলে যায়, জঞ্জাল নেই। হয়তো আগের চেয়ে অনেক বেশি পড়ে ফেলবেন।",
  },
  {
    id: "follow_day1",
    intent: "follow_day1",
    trigger: "no reply after hour 0",
    en: "Morning! A few new titles landed this week — fresh arrivals are up at rey.bd. Want me to save a couple of titles in your first box?",
    bn: "শুভ সকাল! এই সপ্তাহে কিছু নতুন বই এসেছে — rey.bd-তে নতুন আগমন দেখুন। আপনার প্রথম বক্সে কয়েকটা বই কি রেখে দেব?",
  },
  {
    id: "follow_day3",
    intent: "follow_day3",
    trigger: "still no signup",
    en: "Quick note — a lot of people ask about the ৳500 deposit: it's fully refundable, charged once, and normal wear costs nothing. You can cancel or pause any month. Want to start with Starter at ৳299 and see if you like the rhythm?",
    bn: "একটা ছোট কথা — অনেকে ৳৫০০ ডিপোজিট নিয়ে জিজ্ঞেস করেন: এটা পুরোপুরি ফেরতযোগ্য, একবারই কাটা হয়, আর স্বাভাবিক ঘর্ষণে কোনো খরচ নেই। যেকোনো মাসে বাতিল বা বিরতি দিতে পারবেন। ৳২৯৯-এ স্টার্টার দিয়ে শুরু করে দেখবেন কেমন লাগে?",
  },
  {
    id: "follow_day7",
    intent: "follow_day7",
    trigger: "still no signup — final gentle touch",
    en: "A new hardcover costs about a full day's wage — a whole month of reading starts at ৳299. If now's not the time, no worries: browse the catalog anytime at rey.bd. No pressure, ever.",
    bn: "একটা নতুন হার্ডকভারের দাম প্রায় এক দিনের মজুরি — আর পুরো মাসের পড়া শুরু মাত্র ৳২৯৯ থেকে। এখন সময় না হলে সমস্যা নেই: যখন খুশি rey.bd-তে ক্যাটালগ ঘুরে দেখুন। কোনো চাপ নেই, কখনোই না।",
  },
  {
    id: "follow_book_landed",
    intent: "follow_book_landed",
    trigger: "a saved/requested title arrives",
    en: "Good news — [title] is here! It's part of your plan, and I can add it to your next box. Want it in this week's delivery?",
    bn: "সুখবর — [বইয়ের নাম] এসে গেছে! এটা আপনার প্ল্যানেরই অংশ, আর পরের বক্সে রেখে দিতে পারি। এই সপ্তাহের ডেলিভারিতে নেবেন?",
  },
  {
    id: "close_primary",
    intent: "close_primary",
    trigger: "any yes-readiness signal",
    en: "Ready when you are. Start with Starter at ৳299 a month — 2 books, no due dates, no fines, and you can cancel or pause anytime. Sign up here: rey.bd/plans",
    bn: "আপনি প্রস্তুত হলেই। মাসে ৳২৯৯-এ স্টার্টার দিয়ে শুরু করুন — ২টি বই, কোনো ডিউ ডেট নেই, জরিমানা নেই, আর যেকোনো সময় বাতিল বা বিরতি দিতে পারবেন। সাইন আপ: rey.bd/plans",
  },
  {
    id: "close_reversible",
    intent: "close_reversible",
    trigger: "a warm lead who just needs the nudge",
    en: "Start with Starter at ৳299 — cancel anytime, deposit refunded when you stop. rey.bd/plans",
    bn: "৳২৯৯-এ স্টার্টার দিয়ে শুরু করুন — যেকোনো সময় বাতিল, থামলে ডিপোজিট ফেরত। rey.bd/plans",
  },
  {
    id: "lead_capture",
    intent: "lead_capture",
    trigger: "lead agreed to sign up; capture name + phone + plan for CRM",
    en: "Great — so I can set everything up for you, may I have your name and phone number? And which plan caught your eye — Starter (2 books), Avid (4), or Collector (8)?",
    bn: "দারুণ — সবকিছু ঠিকঠাক করে দিতে আপনার নাম আর ফোন নম্বরটা দেবেন? আর কোন প্ল্যানটা পছন্দ হলো — স্টার্টার (২টি), অ্যাভিড (৪টি), নাকি কালেক্টর (৮টি)?",
  },
  {
    id: "graceful_exit",
    intent: "graceful_exit",
    trigger: "end of follow-up cadence, no re-engagement",
    en: "I'll leave you to it — no more messages from me. If you ever want to start, or just want to browse, I'm right here. Happy reading, and take care!",
    bn: "আর আপনাকে বার্তা দেব না — এখানেই থামছি। কখনো শুরু করতে চাইলে, বা শুধু ঘুরে দেখতে চাইলে আমি এখানেই আছি। শুভ পাঠ, ভালো থাকুন!",
  },
];

/** Look up a script by its stable id. */
export function scriptById(id: string): Script | undefined {
  return SCRIPTS.find((s) => s.id === id);
}

/** Follow-up scripts the daily cron may send, keyed by cadence stage. */
export const FOLLOWUP_BY_STAGE: Record<number, Script> = {
  1: scriptById("follow_day1")!,
  2: scriptById("follow_day3")!,
  3: scriptById("follow_day7")!,
};
