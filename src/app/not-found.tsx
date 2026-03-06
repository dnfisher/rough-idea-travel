import { NotFoundAnimation } from "@/components/NotFoundAnimation";
import Link from "next/link";

const CLASH: React.CSSProperties = { fontFamily: "'Clash Display', system-ui, sans-serif" };

export default function NotFound() {
  return (
    <div className="explore-page min-h-screen flex flex-col" style={{ background: "var(--background, #0F0E0D)" }}>
      <header
        style={{
          borderBottom: "1px solid var(--border, #2E2B25)",
          background: "rgba(28,26,23,0.85)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <a
            href="/"
            style={{
              ...CLASH,
              fontSize: "24px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--foreground, #F2EEE8)",
              textDecoration: "none",
            }}
          >
            ROUGH IDEA<span style={{ color: "var(--dp-orange, #E8833A)" }}>.</span>
          </a>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <NotFoundAnimation />
        <div className="notfound-message">
          <span className="notfound-message__text">This page got lost in transit.</span>
          <Link href="/" className="notfound-message__btn">
            Take me home
          </Link>
        </div>
      </main>
    </div>
  );
}
