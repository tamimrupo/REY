"use client";

/**
 * Last-resort boundary: this one renders outside the root layout, so it cannot
 * rely on the app stylesheet. Plain inline styles keep it legible either way.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          color: "#090909",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
          padding: "2rem",
        }}
      >
        <main style={{ maxWidth: "34rem" }}>
          <p
            style={{
              margin: 0,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "0.7rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#525252",
            }}
          >
            REY BD
          </p>
          <h1 style={{ margin: "1.5rem 0 0", fontSize: "2.25rem", lineHeight: 1.05 }}>
            The site failed to start.
          </h1>
          <p style={{ margin: "1.25rem 0 0", color: "#525252", lineHeight: 1.6 }}>
            Something went wrong before the page could load. Reloading usually clears it.
          </p>
          {error.digest ? (
            <p style={{ margin: "1rem 0 0", fontSize: "0.75rem", color: "#6f6f6f" }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "2rem",
              padding: "0.8rem 1.5rem",
              border: "1px solid #090909",
              borderRadius: "4px",
              background: "#090909",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
