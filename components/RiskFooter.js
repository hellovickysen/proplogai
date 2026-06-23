import Link from "next/link";

export default function RiskFooter() {
  return (
    <footer className="border-t border-white/10 py-4 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <p
          className="text-xs text-white/40 mb-2"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          PropJournal is an educational tool and does not provide financial
          advice. Trading involves substantial risk of loss. Past performance is
          not indicative of future results.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/privacy"
            className="text-xs text-white/50 hover:text-white/70 underline transition-colors"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-xs text-white/50 hover:text-white/70 underline transition-colors"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
