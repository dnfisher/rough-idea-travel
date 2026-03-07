'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MessageSquare, MapPin, Calendar, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeroVideoBackground } from '@/components/homepage/HeroVideoBackground';
import { storeDestinationContext } from '@/lib/destination-url';
import { Footer } from '@/components/layout/Footer';

const CLASH: React.CSSProperties = {
  fontFamily: "'Clash Display', system-ui, sans-serif",
};

const SECTION_LABEL: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  color: '#6B6258',
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
  textAlign: 'center',
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
  destinationData: Record<string, unknown> | null;
}

function ShowcaseScroller({
  showcase,
  brokenImages,
  onBrokenImage,
  onCardClick,
  reverse = false,
  style,
}: {
  showcase: ShowcaseDestination[] | null;
  brokenImages: Set<string>;
  onBrokenImage: (slug: string) => void;
  onCardClick: (dest: ShowcaseDestination) => void;
  reverse?: boolean;
  style?: React.CSSProperties;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const rafRef = useRef<number>(0);
  const initRef = useRef(false);

  const animate = useCallback(() => {
    const el = rowRef.current;
    if (el && !pausedRef.current) {
      if (reverse) {
        el.scrollLeft -= 0.5;
        if (el.scrollLeft <= 0) {
          el.scrollLeft = el.scrollWidth / 2;
        }
      } else {
        el.scrollLeft += 0.5;
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
    }
    rafRef.current = requestAnimationFrame(animate);
  }, [reverse]);

  useEffect(() => {
    const el = rowRef.current;
    if (el && reverse && !initRef.current) {
      // Start from midpoint so reverse scroll has room
      el.scrollLeft = el.scrollWidth / 2;
      initRef.current = true;
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate, reverse]);

  const items = showcase?.filter(d => !brokenImages.has(d.slug)) ?? [];
  // Duplicate items for seamless loop
  const displayItems = showcase === null
    ? Array.from({ length: 8 }).map((_, i) => ({ key: `skel-${i}`, skeleton: true as const }))
    : [...items, ...items].map((dest, i) => ({ key: `${dest.slug}-${i}`, skeleton: false as const, dest }));

  return (
    <div
      ref={rowRef}
      className="popular-trips__row"
      style={style}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      {displayItems.map(item =>
        item.skeleton ? (
          <div key={item.key} className="destination-card animate-shimmer" />
        ) : (
          <div
            key={item.key}
            className="destination-card"
            onClick={() => onCardClick(item.dest)}
          >
            {item.dest.imageUrl && (
              <img
                className="destination-card__image"
                src={item.dest.imageUrl}
                alt={item.dest.name}
                loading="lazy"
                onError={() => onBrokenImage(item.dest.slug)}
              />
            )}
            <div className="destination-card__overlay" />
            <div className="destination-card__content">
              {item.dest.country && (
                <p className="destination-card__country">{item.dest.country}</p>
              )}
              <p className="destination-card__name">{item.dest.name}</p>
              <span className="destination-card__cta">Explore →</span>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [showcase, setShowcase] = useState<ShowcaseDestination[] | null>(null);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/showcase', { signal: controller.signal })
      .then(r => r.json())
      .then(data => setShowcase(Array.isArray(data) ? data : []))
      .catch(() => setShowcase([]));
    return () => controller.abort();
  }, []);

  const handleShowcaseCardClick = (dest: ShowcaseDestination) => {
    if (dest.destinationData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      storeDestinationContext(dest.slug, { summary: dest.destinationData as any });
    }
    router.push(`/destination/${dest.slug}`);
  };

  return (
    <div className="homepage" style={{ minHeight: '100vh', background: '#0F0E0D' }}>

      {/* Nav */}
      <nav className={`homepage-nav${scrolled ? ' scrolled' : ''}`}>
        <span style={{ ...CLASH, fontSize: 24, fontWeight: 700, color: '#F2EEE8', letterSpacing: '-0.02em' }}>
          ROUGH IDEA<span style={{ color: '#E8833A' }}>.</span>
        </span>
        <Link
          href="/auth/signin"
          style={{
            border: '1.5px solid rgba(242,238,232,0.25)',
            color: '#F2EEE8',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: '0.02em',
            borderRadius: 20,
            padding: '8px 20px',
            textDecoration: 'none',
            display: 'inline-block',
            transition: 'border-color 0.2s, background 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(242,238,232,0.5)'; e.currentTarget.style.background = 'rgba(242,238,232,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(242,238,232,0.25)'; e.currentTarget.style.background = 'transparent'; }}
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingBottom: '12vh' }}>
        <HeroVideoBackground />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 880, padding: '0 24px' }}>
          <h1 style={{
            fontFamily: "'Geograph', 'Plus Jakarta Sans', sans-serif",
            fontSize: 'clamp(44px, 6vw, 80px)',
            fontWeight: 500,
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            margin: 0,
            textShadow: '0 2px 32px rgba(0,0,0,0.5)',
          }}>
            <span style={{ color: '#F2EEE8', display: 'block' }}>Your next trip,</span>
            <span style={{ ...HEADLINE_GRADIENT, letterSpacing: '-0.02em', display: 'block', fontWeight: 700 }}>
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

      {/* Section A — Popular Trips (hidden when empty or all broken) */}
      {(showcase === null || showcase.some(d => !brokenImages.has(d.slug))) && (
        <section className="popular-trips">
          <div className="popular-trips__header">
            <p className="popular-trips__eyebrow">POPULAR TRIPS</p>
            <h2 className="popular-trips__title">Where will you go?</h2>
            <p className="popular-trips__sub">A few trips people are planning right now.</p>
          </div>

          <ShowcaseScroller
            showcase={showcase ? showcase.filter((_, i) => i % 2 === 0) : null}
            brokenImages={brokenImages}
            onBrokenImage={(slug) => setBrokenImages(prev => new Set(prev).add(slug))}
            onCardClick={handleShowcaseCardClick}
          />
          <ShowcaseScroller
            showcase={showcase ? showcase.filter((_, i) => i % 2 === 1) : null}
            brokenImages={brokenImages}
            onBrokenImage={(slug) => setBrokenImages(prev => new Set(prev).add(slug))}
            onCardClick={handleShowcaseCardClick}
            reverse
            style={{ marginTop: 14 }}
          />
        </section>
      )}

      {/* Section B — How It Works */}
      <section style={{ background: '#0F0E0D', padding: '100px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ ...SECTION_LABEL, marginBottom: 56 }}>
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

      {/* Section C — Secondary CTA */}
      <section className="secondary-cta">
        <p className="secondary-cta__eyebrow">FREE TO USE · NO ACCOUNT NEEDED</p>
        <h2 className="secondary-cta__headline">Ready to find your next trip?</h2>
        <p className="secondary-cta__sub">
          Answer three quick questions and we&apos;ll show you where you should go — matched to your dates, budget, and travel style.
        </p>
        <Link href="/explore" className="btn-primary-lg">
          Start Exploring →
        </Link>
      </section>

      <Footer />

    </div>
  );
}
