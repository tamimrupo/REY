"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Names the columns on a phone.
 *
 * Below `md` every table row becomes a card (see the table rules in
 * globals.css), and a card needs to say what each value *is*. Rather than
 * hand-writing `data-label` on a hundred table cells — and forgetting it on the
 * next table anyone adds — this copies the heading of each column onto its
 * cells, so the markup stays clean and every table, present and future, is
 * labelled.
 *
 * It is an enhancement, not a requirement: with no JavaScript the cards still
 * read, they just do not name their rows.
 */
export function TableLabels() {
  const pathname = usePathname();

  useEffect(() => {
    const label = () => {
      for (const table of document.querySelectorAll<HTMLTableElement>("table")) {
        const headings = Array.from(table.querySelectorAll("thead th")).map((th) =>
          (th.textContent ?? "").trim(),
        );
        if (headings.length === 0) continue;

        for (const row of table.querySelectorAll("tbody tr")) {
          const cells = Array.from(row.children) as HTMLTableCellElement[];
          cells.forEach((cell, index) => {
            // The first cell names the card, and an action cell needs no label.
            if (index === 0 || index >= headings.length) return;
            if (cell.dataset.label) return;
            if (cell.querySelector("button, form, .btn")) return;
            const heading = headings[index];
            if (heading) cell.dataset.label = heading;
          });
        }
      }
    };

    label();

    // Rows arrive after a server action without a route change, and hydration
    // mutates the tree heavily — so coalesce to one pass per frame.
    let frame = 0;
    const observer = new MutationObserver(() => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        label();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
