"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardError({ error, reset }) {
  const [reported, setReported] = useState(false);

  useEffect(() => {
    // Log to console for local debugging
    console.error("[DashboardError]", error);

    // Report to server so we can see it in Vercel logs
    try {
      const payload = {
        message: error?.message || "Unknown error",
        stack: error?.stack || "",
        digest: error?.digest || "",
        url: typeof window !== "undefined" ? window.location.href : "",
        ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
        timestamp: new Date().toISOString(),
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
      className="flex min-h-[60vh] items-center justify-center px-6"
      style={{ backgroundColor: "#07070b" }}
    >
      <div className="w-full max-w-lg text-center">
        <h1
          className="mb-3 text-2xl font-bold text-white"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Dashboard Error
        </h1>

        <p
          className="mb-4 text-white/70"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Something went wrong loading the dashboard.
        </p>

        {/* Always show error details so we can diagnose iOS issue */}
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

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-block cursor-pointer rounded-xl px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{
              fontFamily: "Poppins, sans-serif",
              background: "linear-gradient(120deg,#a78bfa,#22d3ee)",
            }}
          >
            Try again
          </button>

          <Link
            href="/dashboard"
            className="inline-block rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-cyan-400 transition-colors hover:border-white/20 hover:text-cyan-300"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Reload Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
