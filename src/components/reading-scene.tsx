/**
 * The hand-drawn line-art scene the reference layouts lean on.
 *
 * Drawn here as vector strokes rather than generated as a bitmap: it scales to
 * any screen, weighs about two kilobytes, inherits the ink colour from the page,
 * and costs no image request. Spot fills are ink; everything else is a 1.6px
 * stroke, the same weight the references use.
 */
export function ReadingScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 150"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Two readers with books arriving at a doorstep"
      className={className}
    >
      {/* ---- Left: a reader curled up with an open book ---- */}
      <circle cx="46" cy="52" r="11" />
      <path d="M34 48c2-8 9-12 16-10" />
      <path d="M35 63c-6 4-9 11-9 19v18h40V82c0-8-3-15-9-19" />
      <path d="M40 100v18M56 100v14" />
      <path d="M28 118h34" />
      {/* the book in their lap */}
      <path d="M38 78h16l6 8-6 8H38l-6-8 6-8Z" />
      <path d="M48 78v16" />

      {/* ---- Middle: books in flight, and the flow between them ---- */}
      <path d="M96 44h30v22H96z" />
      <path d="M96 44h30" />
      <path d="M100 50h22M100 56h16" />
      <path d="M140 30h34v26h-34z" />
      <path d="M146 36h22M146 42h14M146 48h18" />
      <path d="M186 46h28v20h-28z" />
      <path d="M192 52h16M192 58h10" />

      <path d="M120 88c14 10 30 14 46 12" strokeDasharray="4 6" />
      <path d="M162 104l6-4-4-7" />
      <path d="M178 76c12 2 22 8 30 16" strokeDasharray="4 6" />

      {/* ---- Right: a reader at the door, parcel under arm ---- */}
      <circle cx="264" cy="44" r="12" />
      <path d="M250 40c3-9 11-13 20-10" />
      <path d="M246 60c-5 5-8 12-8 20v22h52V80c0-9-3-16-9-21" />
      <path d="M254 102v18M280 102v16" />
      <path d="M244 120h44" />
      {/* the parcel being handed over */}
      <path d="M282 66h20v16h-20z" />
      <path d="M282 72h20M292 66v16" />
      <path d="M292 82v6h-9" />

      {/* ---- Ground line, the way the references anchor a scene ---- */}
      <path d="M22 140h296" strokeDasharray="2 8" />
    </svg>
  );
}
