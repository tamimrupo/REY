import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// Every storefront page reads live catalog/settings data.
export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
