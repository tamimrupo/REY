import { HowItWorks } from "@/components/how-it-works";
import { getBooksCount } from "@/lib/data";

export const metadata = {
  title: "How it works",
  description:
    "Pick a plan, choose your books, and read at your own pace — REY BD delivers to your door across Bangladesh and collects the ones you have finished.",
  alternates: { canonical: "/how-it-works" },
  openGraph: { url: "/how-it-works" },
};

export default async function HowItWorksPage() {
  const bookCount = await getBooksCount();
  return <HowItWorks bookCount={bookCount} />;
}
