"use client";

/**
 * Last-resort boundary for errors in the root layout itself. It replaces the
 * whole document, so it can't rely on globals.css — styles are inline.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en-AU">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#07080b",
          color: "#f4f2ec",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div>
          <p style={{ fontSize: "4rem", margin: 0 }} aria-hidden>
            🛸
          </p>
          <h1 style={{ fontSize: "2.25rem", letterSpacing: "-0.03em" }}>aduma.io has left the building (briefly)</h1>
          <p style={{ color: "#b3b5bd" }}>A big error happened. Refreshing usually sorts it.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: "1rem", padding: "0.9rem 1.5rem", borderRadius: 999, border: 0, fontWeight: 700, background: "linear-gradient(100deg,#00e5ff,#ff2bd6)", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
