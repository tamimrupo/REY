import { CmsArticle, MissingPage } from "@/components/cms-article";
import { getCmsPage } from "@/lib/data";

export const metadata = { title: "About us" };

export default async function AboutPage() {
  const page = await getCmsPage("about-us");
  if (!page) return <MissingPage slug="about-us" />;
  return <CmsArticle page={page} />;
}
