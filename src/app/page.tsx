'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Sun, Route, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { HeroVideoBackground } from '@/components/homepage/HeroVideoBackground';

const CLASH: React.CSSProperties = {
  fontFamily: "'Clash Display', system-ui, sans-serif",
};

const HEADLINE_GRADIENT: React.CSSProperties = {
  background: 'linear-gradient(90deg, #2ABFBF 0%, #E8833A 55%, #C4A882 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const FEATURE_CARDS = [
  {
    icon: MapPin,
    title: 'Smart Suggestions',
    desc: 'AI-powered destination ideas tailored to your vague preferences',
  },
  {
    icon: Sun,
    title: 'Weather Intel',
    desc: 'Side-by-side climate data for your exact travel window',
  },
  {
    icon: Route,
    title: 'Full Itinerary',
    desc: 'Day-by-day plans with routes, restaurants, and local tips',
  },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="homepage" style={{ minHeight: '100vh', background: '#0F0E0D' }}>

      {/* Nav */}
      <nav className={`homepage-nav${scrolled ? ' scrolled' : ''}`}>
        <span style={{ ...CLASH, fontSize: 20, fontWeight: 500, color: '#F2EEE8', letterSpacing: '0.02em' }}>
          ROUGH IDEA<span style={{ color: '#E8833A' }}>.</span>
        </span>
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
            display: 'inline-block',
            transition: 'background 0.15s ease',
          }}
        >
          Start Exploring
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingBottom: '12vh' }}>
        <HeroVideoBackground />

        {/* Text content — sits above overlay */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 960, padding: '0 24px' }}>
          <h1 style={{
            ...CLASH,
            fontSize: 'clamp(48px, 6.5vw, 84px)',
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: '0.04em',
            margin: 0,
          }}>
            <span style={{ color: '#F2EEE8', display: 'block' }}>Got a rough idea?</span>
            <span style={{ ...HEADLINE_GRADIENT, letterSpacing: '0.04em', display: 'block' }}>
              We&apos;ll plan the rest.
            </span>
          </h1>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16,
            fontWeight: 300,
            color: '#A89F94',
            lineHeight: 1.7,
            letterSpacing: '0.01em',
            textAlign: 'center',
            maxWidth: 480,
            margin: '24px auto 0',
            opacity: 0.85,
          }}>
            Tell us when, where-ish, and what you&apos;re into. Our AI compares
            destinations, checks the weather, and builds your perfect itinerary.
          </p>

          <Link
            href="/explore"
            style={{
              background: '#2ABFBF',
              color: '#0F0E0D',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '0.02em',
              borderRadius: 12,
              padding: '15px 32px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 40,
              transition: 'background 0.15s ease, transform 0.15s ease',
            }}
          >
            Start Exploring →
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator">
          <ChevronDown className="scroll-indicator__icon" size={18} color="#6B6258" />
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            fontWeight: 400,
            color: '#6B6258',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}>
            Scroll
          </span>
        </div>
      </section>

      {/* Feature cards */}
      <section style={{ background: '#0F0E0D', padding: '80px 24px 100px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {FEATURE_CARDS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature-card">
              <Icon size={28} color="#2ABFBF" style={{ marginBottom: 20 }} />
              <h3 style={{ ...CLASH, fontSize: 18, fontWeight: 500, color: '#F2EEE8', margin: '0 0 8px' }}>
                {title}
              </h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 400, color: '#A89F94', lineHeight: 1.6, margin: 0 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
