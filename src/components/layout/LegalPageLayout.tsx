import React from 'react';
import Link from 'next/link';
import { Footer } from './Footer';

interface LegalPageLayoutProps {
  title: string;
  intro: string;
  children: React.ReactNode;
  crosslinks: { label: string; href: string }[];
}

const CLASH: React.CSSProperties = { fontFamily: "'Clash Display', system-ui, sans-serif" };

export function LegalPageLayout({ title, intro, crosslinks, children }: LegalPageLayoutProps) {
  return (
    <div className="legal-page homepage">
      {/* Nav */}
      <header className="homepage-nav" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ ...CLASH, fontSize: 22, fontWeight: 600, color: '#F2EEE8', textDecoration: 'none', letterSpacing: '-0.02em' }}>
            ROUGH IDEA<span style={{ color: '#E8833A' }}>.</span>
          </a>
          <Link
            href="/explore"
            style={{
              background: '#2ABFBF',
              color: '#0F0E0D',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.02em',
              borderRadius: 10,
              padding: '9px 20px',
              textDecoration: 'none',
            }}
          >
            Start Exploring
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="legal-content">
        <div className="legal-header">
          <p className="legal-header__category">LEGAL</p>
          <h1 className="legal-header__title">{title}</h1>
          <p className="legal-header__updated">Last updated: March 2026</p>
          <p className="legal-header__intro">{intro}</p>
        </div>

        {children}

        {/* Cross-links */}
        <div className="legal-crosslinks">
          {crosslinks.map(({ label, href }) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
