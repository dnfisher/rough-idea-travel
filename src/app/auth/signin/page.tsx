import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const CLASH: React.CSSProperties = {
  fontFamily: "'Clash Display', system-ui, sans-serif",
};

const AUTH_IMAGES = [
  // Europe & Middle East
  { id: "photo-1506905925346-21bda4d32df4", name: "Swiss Alps", country: "Switzerland" },
  { id: "photo-1476514525535-07fb3b4ae5f1", name: "Lago di Braies", country: "Italy" },
  { id: "photo-1570077188670-e3a8d69ac5ff", name: "Santorini", country: "Greece" },
  { id: "photo-1516483638261-f4dbaf036963", name: "Manarola", country: "Italy" },
  { id: "photo-1530789253388-582c481c54b0", name: "Cappadocia", country: "Turkey" },
  { id: "photo-1504893524553-b855bce32c67", name: "Fjadrargljufur Canyon", country: "Iceland" },
  // Asia & Oceania
  { id: "photo-1518548419970-58e3b4079ab2", name: "Tanah Lot", country: "Indonesia" },
  { id: "photo-1540202404-a2f29016b523", name: "Overwater Villas", country: "Maldives" },
  { id: "photo-1528164344705-47542687000d", name: "Mount Fuji", country: "Japan" },
  { id: "photo-1536599018102-9f803c140fc1", name: "Hong Kong", country: "Hong Kong" },
  { id: "photo-1540959733332-eab4deabeeaf", name: "Tokyo", country: "Japan" },
  { id: "photo-1565967511849-76a60a516170", name: "Singapore", country: "Singapore" },
  // Americas
  { id: "photo-1493246507139-91e8fad9978e", name: "Moraine Lake", country: "Canada" },
  { id: "photo-1534430480872-3498386e7856", name: "New York City", country: "United States" },
  { id: "photo-1501594907352-04cda38ebc29", name: "Golden Gate Bridge", country: "United States" },
  { id: "photo-1483729558449-99ef09a8c325", name: "Rio de Janeiro", country: "Brazil" },
  { id: "photo-1500759285222-a95626b934cb", name: "Havana", country: "Cuba" },
];

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/explore");

  const img = AUTH_IMAGES[Math.floor(Math.random() * AUTH_IMAGES.length)];

  return (
    <div className="auth-page">
      {/* ── Left Panel: Auth Form ── */}
      <div className="auth-form-panel">
        <a href="/" className="auth-logo" style={CLASH}>
          ROUGH IDEA<span className="auth-logo__dot">.</span>
        </a>

        <div className="auth-form-content">
          <div className="auth-eyebrow">SIGN IN</div>
          <h1 className="auth-title" style={CLASH}>Welcome back</h1>
          <p className="auth-subtitle">
            Sign in to save your favourite destinations and share trip plans.
          </p>

          <div className="auth-buttons">
            <a href="/api/auth/login?provider=google" className="auth-btn">
              <svg className="auth-btn__icon" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </a>

            <a href="/api/auth/login?provider=github" className="auth-btn">
              <svg className="auth-btn__icon" viewBox="0 0 24 24" fill="#F2EEE8">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </a>
          </div>

          <p className="auth-legal">
            By signing in, you agree to our{" "}
            <a href="/terms">Terms of Service</a> and{" "}
            <a href="/privacy">Privacy Policy</a>.
          </p>
        </div>

        <a href="/" className="auth-back">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Rough Idea
        </a>
      </div>

      {/* ── Right Panel: Atmospheric Image ── */}
      <div className="auth-image-panel">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://images.unsplash.com/${img.id}?w=2400&q=90&auto=format`}
          alt={`${img.name}, ${img.country}`}
          className="auth-image-panel__bg"
        />
        <div className="auth-image-panel__overlay-left" />
        <div className="auth-image-panel__overlay-bottom" />
        <div className="auth-image-panel__glow" />
        <div className="auth-image-caption">
          <div className="auth-image-caption__name" style={CLASH}>
            {img.name}
          </div>
          <div className="auth-image-caption__country">{img.country}</div>
        </div>
      </div>
    </div>
  );
}
