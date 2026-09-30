import { CmsArticle, MissingPage } from "@/components/cms-article";
import { getCmsPage } from "@/lib/data";

export const metadata = { title: "How it works" };

export default async function HowItWorksPage() {
  const page = await getCmsPage("how-it-works");
  if (!page) return <MissingPage slug="how-it-works" />;
  return <CmsArticle page={page} />;
}
