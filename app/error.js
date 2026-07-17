"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Error({ error, reset }) {
  const [reported, setReported] = useState(false);

  useEffect(() => {
    // Log to console for local debugging
    console.error("[RootError]", error);

    // Report to server so we can see it in Vercel logs
    try {
      const payload = {
        message: error?.message || "Unknown error",
        stack: error?.stack || "",
        digest: error?.digest || "",
        url: typeof window !== "undefined" ? window.location.href : "",
        ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
        timestamp: new Date().toISOString(),
        level: "root",
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
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: "#07070b" }}
    >
      <div className="text-center max-w-md w-full">
        <h1
          className="text-3xl font-bold text-white mb-3"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Something went wrong
        </h1>

        <p
          className="text-white/70 mb-4"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          An unexpected error occurred. Please try again.
        </p>

        {/* Always show error details — temporary for iOS debugging */}
        <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/[0.05] px-4 py-3 text-left">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-white/40">
            Error Details {reported && "(reported ✓)"}
          </p>
          <p className="break-words font-mono text-xs text-red-300">
            {error?.message || "No error message available"}
          </p>
          {error?.digest && (
            <p className="mt-1 font-mono text-[10px] text-white/30">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-block px-6 py-2.5 rounded-xl font-medium text-white text-sm transition-opacity hover:opacity-90 cursor-pointer"
            style={{
              fontFamily: "Poppins, sans-serif",
              background: "linear-gradient(120deg,#a78bfa,#22d3ee)",
            }}
          >
            Try again
          </button>

          <Link
            href="/dashboard"
            className="inline-block px-6 py-2.5 rounded-xl font-medium text-cyan-400 text-sm border border-white/10 hover:border-white/20 hover:text-cyan-300 transition-colors"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
