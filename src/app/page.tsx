'use client';

import React, { useEffect, useState } from 'react';
import { MessageSquare, MapPin, Calendar, ChevronDown } from 'lucide-react';
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

const STEPS = [
  {
    icon: MessageSquare,
    color: '#2ABFBF',
    number: 'STEP 01',
    title: 'Tell us your rough idea',
    body: "When, how far, who's coming, and what kind of trip you're after. Three quick steps.",
  },
  {
    icon: MapPin,
    color: '#E8833A',
    number: 'STEP 02',
    title: 'We find your destinations',
    body: 'AI-matched trips ranked by how well they fit you — with real weather data, cost estimates, and local knowledge.',
  },
  {
    icon: Calendar,
    color: '#C4A882',
    number: 'STEP 03',
    title: 'Get your full itinerary',
    body: 'Day-by-day plans with routes, stays, restaurants, and things to do. Book directly from the app.',
  },
];

interface ShowcaseDestination {
  name: string;
  country: string | null;
  slug: string;
  imageUrl: string | null;
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [showcase, setShowcase] = useState<ShowcaseDestination[] | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetch('/api/showcase')
      .then(r => r.json())
      .then(data => setShowcase(Array.isArray(data) ? data : []))
      .catch(() => setShowcase([]));
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
          }}
        >
          Start Exploring
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingBottom: '12vh' }}>
        <HeroVideoBackground />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 880, padding: '0 24px' }}>
          <h1 style={{
            ...CLASH,
            fontSize: 'clamp(44px, 6vw, 80px)',
            fontWeight: 400,
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            margin: 0,
            textShadow: '0 2px 32px rgba(0,0,0,0.5)',
          }}>
            <span style={{ color: '#F2EEE8', display: 'block' }}>Your next trip,</span>
            <span style={{ ...HEADLINE_GRADIENT, letterSpacing: '-0.02em', display: 'block' }}>
              planned in three questions.
            </span>
          </h1>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 17,
            fontWeight: 400,
            color: 'rgba(242, 238, 232, 0.82)',
            lineHeight: 1.7,
            letterSpacing: '0.01em',
            textAlign: 'center',
            maxWidth: 500,
            margin: '20px auto 0',
            textShadow: '0 1px 24px rgba(0,0,0,0.75)',
          }}>
            Tell us when, how far, and what you&apos;re into.
            We&apos;ll find where you should go — matched to the weather,
            your budget, and a full day-by-day itinerary.
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
            }}
          >
            Start Exploring →
          </Link>
        </div>

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

      {/* Section A — How It Works */}
      <section style={{ background: '#0F0E0D', padding: '100px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            color: '#6B6258',
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            textAlign: 'center',
            marginBottom: 56,
          }}>
            HOW IT WORKS
          </p>
          <div className="steps-row">
            {STEPS.map(({ icon: Icon, color, number, title, body }) => (
              <div key={number} className="step">
                <Icon size={28} color={color} />
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  margin: 0,
                }}>
                  {number}
                </p>
                <h3 style={{ ...CLASH, fontSize: 18, fontWeight: 500, color: '#F2EEE8', margin: 0 }}>
                  {title}
                </h3>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 400,
                  color: '#A89F94',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section B — Popular Trips (hidden when empty) */}
      {(showcase === null || showcase.length > 0) && (
        <section style={{ background: '#252219', padding: '80px 0 80px 24px', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 1080, margin: '0 auto 32px', paddingRight: 24 }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 600,
              color: '#6B6258',
              textTransform: 'uppercase',
              letterSpacing: '0.09em',
              marginBottom: 12,
            }}>
              POPULAR TRIPS
            </p>
            <h2 style={{ ...CLASH, fontSize: 24, fontWeight: 500, color: '#F2EEE8', margin: '0 0 8px' }}>
              Where will you go?
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 400,
              color: '#A89F94',
              margin: 0,
            }}>
              A few trips people are planning right now.
            </p>
          </div>

          <div className="destination-teaser-row">
            {showcase === null
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="destination-teaser-card animate-shimmer"
                    style={{ flexShrink: 0 }}
                  />
                ))
              : showcase.map(dest => (
                  <Link
                    key={dest.slug}
                    href="/explore"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="destination-teaser-card">
                      {dest.imageUrl && (
                        <img
                          src={dest.imageUrl}
                          alt={dest.name}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      )}
                      <div className="destination-teaser-card__overlay" />
                      <span className="destination-teaser-card__explore">Explore →</span>
                      <div className="destination-teaser-card__info">
                        {dest.country && (
                          <p style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 11,
                            fontWeight: 400,
                            color: '#6B6258',
                            margin: '0 0 2px',
                          }}>
                            {dest.country}
                          </p>
                        )}
                        <p style={{
                          ...CLASH,
                          fontSize: 16,
                          fontWeight: 500,
                          color: '#ffffff',
                          margin: 0,
                        }}>
                          {dest.name}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
            }
          </div>
        </section>
      )}

      {/* Section C — Trust line */}
      <div className="trust-line">
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          fontWeight: 400,
          color: '#6B6258',
          margin: '0 0 24px',
        }}>
          Free to use. No account needed to explore.
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
          }}
        >
          Start Exploring →
        </Link>
      </div>

    </div>
  );
}
