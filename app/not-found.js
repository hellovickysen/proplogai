import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: "#07070b" }}
    >
      <div className="text-center">
        <h1
          className="text-8xl font-bold mb-4"
          style={{
            fontFamily: "Poppins, sans-serif",
            background: "linear-gradient(120deg,#a78bfa,#22d3ee)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </h1>

        <h2
          className="text-2xl font-semibold text-white mb-3"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Page not found
        </h2>

        <p
          className="text-white/70 mb-8 max-w-sm mx-auto"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-block px-6 py-2.5 rounded-xl font-medium text-white text-sm transition-opacity hover:opacity-90"
            style={{
              fontFamily: "Poppins, sans-serif",
              background: "linear-gradient(120deg,#a78bfa,#22d3ee)",
            }}
          >
            Go to Dashboard
          </Link>

          <Link
            href="/"
            className="inline-block px-6 py-2.5 rounded-xl font-medium text-white/70 text-sm border border-white/10 hover:border-white/20 hover:text-white transition-colors"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
