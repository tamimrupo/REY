// Genre-specific SEO copy. Curated genres (the 16 with a sort_order in the
// admin) get hand-written titles, descriptions and intros; anything else falls
// back to a generic template. All copy is factual about the category itself —
// no invented inventory numbers.

export type GenreCopy = {
  title: string;
  description: string;
  intro: string;
};

const CURATED: Record<string, GenreCopy> = {
  fiction: {
    title: "Rent Fiction Books in Bangladesh",
    description:
      "Rent fiction books online in Bangladesh — the biggest shelf in the club, delivered to your door and collected when you're done.",
    intro:
      "The biggest shelf in the club. From bestsellers to quiet literary novels, rent fiction by the month and swap it for the next one — no clutter, no commitment.",
  },
  biography: {
    title: "Rent Biography Books in Bangladesh",
    description:
      "Rent biography and memoir books online in Bangladesh — real lives, delivered to your door and collected when you're done.",
    intro:
      "Lives worth reading about. From statesmen to scientists to artists, our biography shelf holds the stories of people who actually did the thing — rented by the month, delivered to your door.",
  },
  business: {
    title: "Rent Business Books in Bangladesh",
    description:
      "Rent business books in Bangladesh — strategy, finance and startup reads delivered to your door, from ৳299/month.",
    intro:
      "Sharpen how you work without buying a shelf of books you'll read once. Our business shelf covers strategy, money and startups — rented monthly, delivered to your door.",
  },
  classic: {
    title: "Rent Classic Books in Bangladesh",
    description:
      "Rent classic literature online in Bangladesh — the books everyone means when they say 'classic', delivered to your door.",
    intro:
      "The books that survived every generation. Rent the classics — Dickens, Orwell, Austen and the rest — by the month, and send them back when you're done.",
  },
  drama: {
    title: "Rent Drama Books in Bangladesh",
    description:
      "Rent drama and plays online in Bangladesh — scripts and theatre, delivered to your door and collected when you're done.",
    intro:
      "Plays and drama, from the stage to your shelf. Rent the scripts that shaped theatre — delivered to your door, returned when you're done.",
  },
  fantasy: {
    title: "Rent Fantasy Books in Bangladesh",
    description:
      "Rent fantasy books online in Bangladesh — epic worlds and magic, delivered to your door from ৳299/month.",
    intro:
      "Escape into another world for a month. Our fantasy shelf spans the epic and the strange — rent it, read it, and send it back when the next one's due.",
  },
  health: {
    title: "Rent Health Books in Bangladesh",
    description:
      "Rent health and wellness books online in Bangladesh — delivered to your door and collected when you're done.",
    intro:
      "Read up on how the body and mind actually work. Our health shelf covers wellness, habits and longevity — rented monthly, delivered to your door.",
  },
  history: {
    title: "Rent History Books in Bangladesh",
    description:
      "Rent history books online in Bangladesh — from world history to the history of Bangladesh, delivered to your door.",
    intro:
      "Understand how we got here. Our history shelf spans Bangladesh's past and the wider world — rent it by the month and return it when you're done.",
  },
  islamic: {
    title: "Rent Islamic Books in Bangladesh",
    description:
      "Rent Islamic books online in Bangladesh — delivered to your door and collected when you're done.",
    intro:
      "Faith, history and scholarship. Our Islamic shelf holds the titles readers ask for most — rented monthly, delivered to your door.",
  },
  kids: {
    title: "Rent Kids' Books in Bangladesh",
    description:
      "Rent children's books online in Bangladesh — picture books to young-adult reads, delivered to your door and swapped monthly.",
    intro:
      "Keep a growing reader stocked without buying every title. Rent children's books by the month — new ones in, finished ones back, delivered to your door.",
  },
  philosophy: {
    title: "Rent Philosophy Books in Bangladesh",
    description:
      "Rent philosophy books online in Bangladesh — the big ideas, delivered to your door and collected when you're done.",
    intro:
      "The ideas that shaped how we think. Our philosophy shelf spans the ancients to the moderns — rent it, read it slowly, return it when you're done.",
  },
  romance: {
    title: "Rent Romance Books in Bangladesh",
    description:
      "Rent romance books online in Bangladesh — from contemporary to classic love stories, delivered to your door.",
    intro:
      "Every love story on one shelf. Rent romance by the month — delivered to your door, and swapped for the next when you're ready.",
  },
  science: {
    title: "Rent Science Books in Bangladesh",
    description:
      "Rent science books online in Bangladesh — popular science and more, delivered to your door and collected when you're done.",
    intro:
      "Curiosity, on subscription. Our science shelf covers the universe, the mind and everything between — rented monthly, delivered to your door.",
  },
  "self-help": {
    title: "Rent Self-Help Books in Bangladesh",
    description:
      "Rent self-help and personal growth books online in Bangladesh — delivered to your door from ৳299/month.",
    intro:
      "The books people return to. Rent self-help and personal growth titles by the month — read them, keep the ideas, send the book back.",
  },
  thriller: {
    title: "Rent Thriller Books in Bangladesh",
    description:
      "Rent thriller and crime books online in Bangladesh — page-turners delivered to your door and collected when you're done.",
    intro:
      "Page-turners you won't want to put down. Our thriller shelf spans crime, suspense and mystery — rent it, finish it, swap it for the next.",
  },
  bengali: {
    title: "Rent Bengali Books in Bangladesh",
    description:
      "Rent Bengali books online in Bangladesh — বাংলা সাহিত্য delivered to your door and collected when you're done.",
    intro:
      "বাংলা সাহিত্য, on your shelf. Rent Bengali literature by the month — from classics to contemporary — delivered to your door and collected when you're done.",
  },
};

export function getGenreCopy(name: string, slug: string, count = 0): GenreCopy {
  const curated = CURATED[slug];
  if (curated) return curated;
  return {
    title: `Rent ${name} Books in Bangladesh`,
    description: `Rent ${name.toLowerCase()} books online in Bangladesh — delivered to your door and collected when you're done.`,
    intro: `Browse ${count} ${name.toLowerCase()} title${count === 1 ? "" : "s"} in the REY BD library — rent by the month, delivered to your door and collected when you're done.`,
  };
}
