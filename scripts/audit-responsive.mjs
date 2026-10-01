/**
 * Responsive audit harness.
 *
 * Drives a headless browser over every page at four widths and reports what
 * actually hurts: page-level horizontal overflow, content clipped with no way to
 * reach it, elements hanging off the viewport, controls too small to tap, and
 * tables that only work sideways.
 *
 * Usage:
 *   npm run audit:responsive             # report
 *   npm run audit:responsive -- --shots  # report + full-page screenshots
 *   npm run audit:responsive -- --width 390 --page /library
 *
 * Needs `playwright-core` (a devDependency) and a Chromium-based browser:
 * it uses the browser in AUDIT_BROWSER, else Edge, else Chrome, else Playwright's
 * own download. Find the report in `.audit/` (git-ignored).
 */
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.AUDIT_BASE ?? "http://localhost:3000";
const OUT = path.join(process.cwd(), ".audit");

const CANDIDATES = [
  process.env.AUDIT_BROWSER,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/microsoft-edge",
  "/usr/bin/google-chrome",
].filter(Boolean);

const WIDTHS = [
  { w: 1440, h: 900, name: "1440" },
  { w: 1024, h: 768, name: "1024" },
  { w: 768, h: 1024, name: "768" },
  { w: 390, h: 844, name: "390" },
];

/** Everything worth knowing about one page at one width. */
const PROBE = `(() => {
  const vw = window.innerWidth;
  const doc = document.documentElement;

  const desc = (el) => {
    const cls = typeof el.className === "string" ? el.className.split(/\\s+/).slice(0, 3).join(".") : "";
    return el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (cls ? "." + cls : "");
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const inScroller = (el) => {
    let node = el.parentElement;
    while (node && node !== doc) {
      const s = getComputedStyle(node);
      if (s.overflowX === "auto" || s.overflowX === "scroll") return true;
      node = node.parentElement;
    }
    return false;
  };
  // Screen-reader-only text, truncation and form fields clip on purpose.
  const intentional = (el) => {
    if (el.classList.contains("sr-only")) return true;
    if (getComputedStyle(el).textOverflow === "ellipsis") return true;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return true;
    return false;
  };

  const outside = [];
  const clipped = [];
  const small = [];

  for (const el of doc.querySelectorAll("body *")) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);

    if (!inScroller(el) && (r.right > vw + 1 || r.left < -1) && s.position !== "fixed" && outside.length < 12) {
      outside.push({ el: desc(el), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) });
    }

    if (!intentional(el) && el.scrollWidth > el.clientWidth + 2 && (s.overflowX === "hidden" || s.overflowX === "clip") && clipped.length < 12) {
      clipped.push({ el: desc(el), scrollW: el.scrollWidth, clientW: el.clientWidth, text: (el.textContent || "").trim().slice(0, 40) });
    }

    const tag = el.tagName.toLowerCase();
    const interactive = tag === "a" || tag === "button" || el.getAttribute("role") === "button";
    if (interactive) {
      const inlineInProse = s.display === "inline" && el.closest("p, li, .cms-article");
      if (!inlineInProse && (r.height < 24 || r.width < 24) && small.length < 12) {
        small.push({ el: desc(el), w: Math.round(r.width), h: Math.round(r.height), text: (el.textContent || "").trim().slice(0, 28) });
      }
    }
  }

  const tables = Array.from(doc.querySelectorAll("table")).map((t) => {
    const wrap = t.parentElement;
    const scroller = wrap ? getComputedStyle(wrap).overflowX : "";
    return {
      w: Math.round(t.getBoundingClientRect().width),
      scroller: scroller === "auto" || scroller === "scroll",
      cards: getComputedStyle(t.querySelector("tbody tr") ?? t).display === "block",
      labels: t.querySelectorAll("tbody td[data-label]").length,
    };
  });

  return {
    vw,
    scrollW: doc.scrollWidth,
    pageOverflow: doc.scrollWidth - vw,
    fonts: Array.from(new Set(Array.from(doc.querySelectorAll("h1, h2, p, li, td, th, label"))
      .filter(visible)
      .map((el) => Math.round(parseFloat(getComputedStyle(el).fontSize))))).sort((a, b) => a - b),
    outside,
    clipped,
    small,
    tables,
  };
})()`;

const SHOTS = path.join(OUT, "shots");

async function signIn(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "load" });
  const email = process.env.AUDIT_EMAIL;
  const password = process.env.AUDIT_PASSWORD;
  if (!email || !password) return false;
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  return !page.url().includes("/login");
}

/** Discover real slugs/ids so detail pages are audited too. */
async function discover(page) {
  const out = {};
  const routes = ["/library", "/authors", "/account", "/admin/orders", "/admin/customers", "/admin/books"];
  for (const route of routes) {
    await page.goto(BASE + route, { waitUntil: "load" });
    const found = await page.evaluate(() => {
      const hrefs = Array.from(document.querySelectorAll("a[href]")).map((a) => a.getAttribute("href"));
      const pick = (re) => hrefs.find((h) => h && re.test(h)) ?? null;
      return {
        book: pick(/^\/library\/[^?/]+$/),
        author: pick(/^\/author\/[^?/]+$/),
        policy: pick(/^\/p\/[^?/]+$/),
        order: pick(/^\/admin\/orders\/[0-9a-f-]{8,}$/),
        customer: pick(/^\/admin\/customers\/[0-9a-f-]{8,}$/),
        bookEdit: pick(/^\/admin\/books\/[0-9a-f-]{8,}$/),
        checkout: pick(/^\/checkout\/[0-9a-f-]{8,}$/),
      };
    });
    for (const [key, value] of Object.entries(found)) if (value && !out[key]) out[key] = value;
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const shots = args.includes("--shots");
  const onlyWidth = args.includes("--width") ? args[args.indexOf("--width") + 1] : null;
  const onlyPage = args.includes("--page") ? args[args.indexOf("--page") + 1] : null;

  fs.mkdirSync(OUT, { recursive: true });

  const executablePath = CANDIDATES.find((candidate) => fs.existsSync(candidate));
  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const signedIn = await signIn(page);
  const dyn = await discover(page);

  const pages = [
    ["/", "home"],
    ["/plans", "plans"],
    ["/library", "library"],
    [dyn.book, "book"],
    ["/authors", "authors"],
    [dyn.author, "author"],
    ["/how-it-works", "how-it-works"],
    ["/rare", "rare"],
    ["/about-us", "about"],
    ["/contact", "contact"],
    [dyn.policy, "policy"],
    ["/login", "login"],
    ["/register", "register"],
    ["/account", "account"],
    ["/account/membership", "account-membership"],
    ["/account/box", "account-box"],
    ["/account/books", "account-books"],
    ["/account/orders", "account-orders"],
    ["/account/payments", "account-payments"],
    ["/account/addresses", "account-addresses"],
    ["/account/profile", "account-profile"],
    [dyn.checkout, "checkout"],
    ["/admin", "admin"],
    ["/admin/orders", "admin-orders"],
    [dyn.order, "admin-order"],
    ["/admin/subscriptions", "admin-subscriptions"],
    ["/admin/shipments", "admin-shipments"],
    ["/admin/rentals", "admin-rentals"],
    ["/admin/payments", "admin-payments"],
    ["/admin/deposits", "admin-deposits"],
    ["/admin/customers", "admin-customers"],
    [dyn.customer, "admin-customer"],
    ["/admin/requests", "admin-requests"],
    ["/admin/notifications", "admin-notifications"],
    ["/admin/books", "admin-books"],
    [dyn.bookEdit, "admin-book-edit"],
    ["/admin/plans", "admin-plans"],
    ["/admin/import", "admin-import"],
    ["/admin/diagnostics", "admin-diagnostics"],
    ["/admin/settings", "admin-settings"],
    ["/admin/pages", "admin-pages"],
  ].filter(([href]) => Boolean(href));

  const report = [];
  const widths = onlyWidth ? WIDTHS.filter((w) => w.name === String(onlyWidth)) : WIDTHS;
  const list = onlyPage ? pages.filter(([href]) => href === onlyPage) : pages;

  for (const width of widths) {
    await page.setViewportSize({ width: width.w, height: width.h });
    for (const [href, slug] of list) {
      try {
        await page.goto(BASE + href, { waitUntil: "load", timeout: 25000 });
        // Scroll-reveal sections arm below the fold and never fire in a capture.
        await page.addStyleTag({
          content: ".reveal, .reveal[data-armed='true'] { opacity: 1 !important; transform: none !important; }",
        });
        await page.waitForTimeout(250);
        const data = await page.evaluate(PROBE);
        report.push({ width: width.name, page: href, slug, ...data });

        if (shots) {
          const dir = path.join(SHOTS, width.name);
          fs.mkdirSync(dir, { recursive: true });
          await page.screenshot({ path: path.join(dir, slug + ".png"), fullPage: true }).catch(() => {});
        }
      } catch (error) {
        report.push({ width: width.name, page: href, slug, error: String(error.message).slice(0, 120) });
      }
    }
  }

  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify({ signedIn, dynamic: dyn, report }, null, 2));

  const line = (row) => {
    if (row.error) return `  !! ${row.page.padEnd(26)} ERROR ${row.error}`;
    const bits = [];
    if (row.pageOverflow > 1) bits.push(`PAGE-OVERFLOW ${row.pageOverflow}px`);
    if (row.outside.length) bits.push(`outside:${row.outside.length} [${row.outside.map((o) => o.el).join(", ").slice(0, 70)}]`);
    if (row.clipped.length) bits.push(`CLIPPED:${row.clipped.length} [${row.clipped.map((o) => o.el).join(", ").slice(0, 70)}]`);
    if (row.small.length) bits.push(`small:${row.small.length} [${row.small.map((o) => o.text).join(" / ").slice(0, 60)}]`);
    return bits.length ? `  ${/[A-Z]{4,}/.test(bits.join("")) ? "!!" : " ."} ${row.page.padEnd(26)} ${bits.join("  ")}` : null;
  };

  console.log(`signed in: ${signedIn}`);
  for (const width of widths) {
    console.log(`\n=== ${width.name}px ===`);
    const rows = report.filter((r) => r.width === width.name).map(line).filter(Boolean);
    console.log(rows.length ? rows.join("\n") : "  clean");
  }

  const totals = {
    pageOverflow: report.filter((r) => r.pageOverflow > 1).length,
    clipped: report.filter((r) => (r.clipped ?? []).length).length,
    outside: report.filter((r) => (r.outside ?? []).length).length,
    smallTargets: report.filter((r) => (r.small ?? []).length).length,
    errors: report.filter((r) => r.error).length,
  };
  console.log("\n=== totals (page/width combinations with a finding) ===");
  console.log(JSON.stringify(totals, null, 2));

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
