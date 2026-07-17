"use client";

import { useEffect, useState } from "react";

/**
 * global-error.js — catches errors from the ROOT layout that error.js cannot.
 * In Next.js App Router, error.js does NOT catch errors from its own layout.
 * This file is the safety net for layout-level crashes.
 *
 * IMPORTANT: This component replaces the entire <html> tree when triggered,
 * so it must include <html> and <body> tags.
 */
export default function GlobalError({ error, reset }) {
  const [reported, setReported] = useState(false);

  useEffect(() => {
    console.error("[GlobalError]", error);

    try {
      const payload = {
        message: error?.message || "Unknown error",
        stack: error?.stack || "",
        digest: error?.digest || "",
        url: typeof window !== "undefined" ? window.location.href : "",
        ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
        timestamp: new Date().toISOString(),
        level: "global",
      };

      fetch("/api/error-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(() => setReported(true))
        .catch(() => {});
    } catch (e) {
      // Don't let error reporting break the error boundary
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: "#07070b",
          color: "#fff",
          fontFamily: "Poppins, system-ui, sans-serif",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "500px", textAlign: "center", width: "100%" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "12px" }}>
            Something went wrong
          </h1>

          <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "16px" }}>
            A critical error occurred. This has been reported.
          </p>

          {/* Error details for debugging */}
          <div
            style={{
              borderRadius: "16px",
              border: "1px solid rgba(248,113,113,0.2)",
              background: "rgba(239,68,68,0.05)",
              padding: "12px 16px",
              textAlign: "left",
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "rgba(255,255,255,0.4)",
                marginBottom: "4px",
              }}
            >
              Error Details {reported ? "(reported ✓)" : ""}
            </p>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "12px",
                color: "#fca5a5",
                wordBreak: "break-word",
              }}
            >
              {error?.message || "No error message available"}
            </p>
            {error?.digest && (
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.3)",
                  marginTop: "4px",
                }}
              >
                Digest: {error.digest}
              </p>
            )}
          </div>

          <button
            onClick={reset}
            style={{
              background: "linear-gradient(120deg,#a78bfa,#22d3ee)",
              color: "#08080f",
              border: "none",
              borderRadius: "12px",
              padding: "10px 24px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Poppins, system-ui, sans-serif",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
