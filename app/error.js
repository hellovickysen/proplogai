"use client";

import Link from "next/link";

export default function Error({ error, reset }) {
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
          className="text-white/70 mb-5"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          An unexpected error occurred. Please try again.
        </p>

        {error?.message && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left">
            <p className="text-xs text-white/50 font-mono break-words">
              {error.message}
            </p>
          </div>
        )}

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
