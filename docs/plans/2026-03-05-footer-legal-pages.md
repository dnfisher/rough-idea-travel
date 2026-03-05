# Footer Component & Legal Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract a shared `<Footer />` component, replace the two inline footers, and create three legal pages (`/privacy`, `/terms`, `/cookies`) with a shared layout.

**Architecture:** One new `Footer` component at `src/components/layout/Footer.tsx`. One `LegalPageLayout` component at `src/components/layout/LegalPageLayout.tsx`. Legal pages are standard Next.js App Router server components (no client-side JS needed). Footer CSS already exists in `globals.css` — no CSS changes needed there. Legal page CSS is appended to `globals.css`.

**Tech Stack:** Next.js 15 App Router, React server components, existing CSS classes in `globals.css`.

---

## Context

### What already exists (do not recreate)
- All footer CSS classes (`.footer`, `.footer__inner`, `.footer__top`, `.footer__bottom`, `.footer__nav`, `.footer__legal`, `.footer__logo`, `.footer__tagline`, `.footer__copy`) are in `src/app/globals.css` lines ~769–878
- Inline footer markup exists in `src/app/page.tsx` (~lines 287–311) — needs to be replaced with the component
- Inline footer markup exists in `src/app/favorites/FavoritesClient.tsx` (~lines 463–488) — needs to be replaced with the component
- Secondary CTA section already exists on the homepage — do not change it

### What is wrong with the current inline footers
1. Copyright says "© 2025" — needs to be "© 2026 Rough Idea Travel LLC · roughidea.co"
2. Legal links point to `href="#"` — need to point to `/privacy`, `/terms`, `/cookies`
3. It's duplicated in two files — a shared component fixes both

### Clash Display heading pattern (use throughout)
```tsx
const CLASH: React.CSSProperties = { fontFamily: "'Clash Display', system-ui, sans-serif" };
```
Do NOT use `.font-display` CSS class — Tailwind v4 compiles it statically.

---

## Task 1: Create `<Footer />` component

**Files:**
- Create: `src/components/layout/Footer.tsx`

**Step 1: Create the file**

```tsx
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">
          <div>
            <p className="footer__logo">ROUGH IDEA<span>.</span></p>
            <p className="footer__tagline">AI-powered trip planning</p>
          </div>
          <nav className="footer__nav">
            <a href="#">How It Works</a>
            <a href="#">About</a>
            <a href="#">Blog</a>
            <a href="#">Contact</a>
          </nav>
        </div>
        <div className="footer__bottom">
          <p className="footer__copy">© 2026 Rough Idea Travel LLC · roughidea.co</p>
          <div className="footer__legal">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/cookies">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

**Step 2: Verify TypeScript**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && npx tsc --noEmit 2>&1 | grep "Footer" | head -5
```
Expected: no errors.

**Step 3: Commit**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && git add src/components/layout/Footer.tsx && git commit -m "feat: add shared Footer component with 2026 copyright and real legal links"
```

---

## Task 2: Replace inline footers with `<Footer />`

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/favorites/FavoritesClient.tsx`

### page.tsx

**Step 1: Add the import**

At the top of `src/app/page.tsx`, add:
```tsx
import { Footer } from '@/components/layout/Footer';
```

**Step 2: Replace inline footer**

Find this block (around line 287):
```tsx
      {/* Footer */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__top">
            <div>
              <p className="footer__logo">ROUGH IDEA<span>.</span></p>
              <p className="footer__tagline">AI-powered trip planning</p>
            </div>
            <nav className="footer__nav">
              <a href="#">How It Works</a>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Contact</a>
            </nav>
          </div>
          <div className="footer__bottom">
            <p className="footer__copy">© 2025 Rough Idea Travel. All rights reserved.</p>
            <div className="footer__legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
```

Replace with:
```tsx
      <Footer />
```

### FavoritesClient.tsx

**Step 3: Add the import**

At the top of `src/app/favorites/FavoritesClient.tsx`, add:
```tsx
import { Footer } from '@/components/layout/Footer';
```

**Step 4: Replace inline footer**

Find this block (around line 463):
```tsx
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__top">
            <div>
              <p className="footer__logo">ROUGH IDEA<span>.</span></p>
              <p className="footer__tagline">AI-powered trip planning</p>
            </div>
            <nav className="footer__nav">
              <a href="#">How It Works</a>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Contact</a>
            </nav>
          </div>
          <div className="footer__bottom">
            <p className="footer__copy">© 2025 Rough Idea Travel. All rights reserved.</p>
            <div className="footer__legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
```

Replace with:
```tsx
      <Footer />
```

**Step 5: Verify build**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && npx tsc --noEmit 2>&1 | head -20
```
Expected: only the pre-existing `wishlists/route.ts` errors, nothing new.

**Step 6: Commit**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && git add src/app/page.tsx src/app/favorites/FavoritesClient.tsx && git commit -m "refactor: replace inline footers with shared Footer component"
```

---

## Task 3: Add legal page CSS to globals.css

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Append the following CSS block at the end of the file**

```css
/* ── Legal Pages ─────────────────────────────────────────── */
.legal-page {
  background: #0F0E0D;
  min-height: 100vh;
}

.legal-content {
  max-width: 720px;
  margin: 0 auto;
  padding: 80px 32px 120px;
}

.legal-header {
  margin-bottom: 48px;
  padding-bottom: 32px;
  border-bottom: 1px solid #2E2B25;
}

.legal-header__category {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #6B6258;
  text-transform: uppercase;
  letter-spacing: 0.09em;
}

.legal-header__title {
  font-family: 'Clash Display', system-ui, sans-serif;
  font-size: 36px;
  font-weight: 500;
  color: #F2EEE8;
  margin-top: 8px;
  line-height: 1.1;
}

.legal-header__updated {
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: #6B6258;
  margin-top: 8px;
}

.legal-header__intro {
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  font-weight: 400;
  color: #A89F94;
  line-height: 1.7;
  margin-top: 16px;
}

.legal-section {
  margin-top: 40px;
}

.legal-section h2 {
  font-family: 'Clash Display', system-ui, sans-serif;
  font-size: 20px;
  font-weight: 500;
  color: #F2EEE8;
  margin-bottom: 14px;
}

.legal-section p {
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  font-weight: 400;
  color: #A89F94;
  line-height: 1.75;
  margin-bottom: 14px;
}

.legal-section ul {
  padding-left: 20px;
  margin-bottom: 14px;
}

.legal-section li {
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  color: #A89F94;
  line-height: 1.75;
  margin-bottom: 6px;
}

.legal-section strong {
  color: #F2EEE8;
  font-weight: 600;
}

.legal-section a {
  color: #2ABFBF;
  text-decoration: none;
}

.legal-section a:hover {
  text-decoration: underline;
}

.legal-contact-box {
  margin-top: 48px;
  padding: 20px 24px;
  background: #1C1A17;
  border: 1px solid #2E2B25;
  border-left: 3px solid #2ABFBF;
  border-radius: 0 12px 12px 0;
}

.legal-contact-box p {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: #A89F94;
  margin: 0;
  line-height: 1.6;
}

.legal-contact-box strong {
  color: #F2EEE8;
}

.legal-crosslinks {
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid #2E2B25;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.legal-crosslinks a {
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  color: #6B6258;
  text-decoration: none;
  transition: color 0.15s ease;
}

.legal-crosslinks a:hover {
  color: #2ABFBF;
}
```

**Step 2: Verify**

Check the end of `src/app/globals.css` to confirm the block is appended.

**Step 3: Commit**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && git add src/app/globals.css && git commit -m "feat: add legal page CSS classes"
```

---

## Task 4: Create `LegalPageLayout` component

**Files:**
- Create: `src/components/layout/LegalPageLayout.tsx`

This component renders the standard dark nav, legal content wrapper, and footer. Each legal page passes its content as children.

**Step 1: Create the file**

```tsx
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
```

**Step 2: Verify TypeScript**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && npx tsc --noEmit 2>&1 | grep "LegalPageLayout" | head -5
```
Expected: no errors.

**Step 3: Commit**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && git add src/components/layout/LegalPageLayout.tsx && git commit -m "feat: add LegalPageLayout component"
```

---

## Task 5: Create `/privacy` page

**Files:**
- Create: `src/app/privacy/page.tsx`

**Step 1: Create the file**

```tsx
import { LegalPageLayout } from '@/components/layout/LegalPageLayout';

export const metadata = {
  title: 'Privacy Policy — Rough Idea Travel',
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      intro="We take your privacy seriously. This policy explains what data we collect, how we use it, and your rights as a user of Rough Idea Travel."
      crosslinks={[
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookies' },
      ]}
    >
      <div className="legal-section">
        <h2>What Information We Collect</h2>
        <p>When you use Rough Idea Travel, we may collect the following:</p>
        <p><strong>Information you provide:</strong></p>
        <ul>
          <li>Your home city or location (used to calculate routes and distances)</li>
          <li>Travel preferences you enter into our search form (dates, interests, budget, travel party)</li>
          <li>Your email address and name if you create an account</li>
          <li>Destinations you save to wishlists</li>
        </ul>
        <p><strong>Information collected automatically:</strong></p>
        <ul>
          <li>Basic usage data (pages visited, searches performed, features used)</li>
          <li>Device type and browser information</li>
          <li>IP address (used to determine approximate region)</li>
          <li>Cookies and similar tracking technologies (see our <a href="/cookies">Cookie Policy</a> for details)</li>
        </ul>
        <p>We do not collect payment information directly — any bookings made through third-party links (Booking.com, Airbnb, etc.) are handled entirely by those services under their own privacy policies.</p>
      </div>

      <div className="legal-section">
        <h2>How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Generate personalised destination recommendations based on your search inputs</li>
          <li>Remember your saved trips and wishlist across sessions (if you have an account)</li>
          <li>Improve the accuracy and relevance of our AI matching system</li>
          <li>Send product updates or announcements if you have opted in</li>
          <li>Understand how people use the product so we can improve it</li>
          <li>Comply with legal obligations</li>
        </ul>
        <p>We do not sell your personal information to third parties. We do not use your data for advertising targeting.</p>
      </div>

      <div className="legal-section">
        <h2>Sharing Your Information</h2>
        <p>We may share your information with:</p>
        <ul>
          <li><strong>Service providers</strong> who help us operate the product (hosting, analytics, email delivery). These providers are contractually bound to use your data only for the services they provide to us.</li>
          <li><strong>Third-party booking platforms</strong> (Booking.com, Airbnb, Google) when you click through to book — at that point you are subject to their privacy policies.</li>
          <li><strong>Legal authorities</strong> if required by law or to protect the rights and safety of our users.</li>
        </ul>
        <p>We will never share or sell your data to advertisers or data brokers.</p>
      </div>

      <div className="legal-section">
        <h2>Data Retention</h2>
        <p>We retain your data for as long as your account is active or as needed to provide our services. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal or compliance purposes. Search inputs entered without an account are not stored beyond the active session.</p>
      </div>

      <div className="legal-section">
        <h2>Your Rights</h2>
        <p>Depending on where you live, you may have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Object to or restrict how we process your data</li>
          <li>Request a portable copy of your data</li>
        </ul>
        <p>To exercise any of these rights, contact us at the address below. We will respond within 30 days.</p>
      </div>

      <div className="legal-section">
        <h2>Children&apos;s Privacy</h2>
        <p>Rough Idea Travel is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will delete it.</p>
      </div>

      <div className="legal-section">
        <h2>Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify registered users of significant changes by email. Continued use of the service after changes constitutes acceptance of the updated policy.</p>
      </div>

      <div className="legal-contact-box">
        <p><strong>Rough Idea Travel LLC</strong><br />privacy@roughidea.co</p>
      </div>
    </LegalPageLayout>
  );
}
```

**Step 2: Check the route loads**

Run the dev server and visit `http://localhost:3000/privacy`. Expected: dark page with legal layout, nav, content, footer.

**Step 3: Commit**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && git add src/app/privacy/page.tsx && git commit -m "feat: add /privacy page"
```

---

## Task 6: Create `/terms` page

**Files:**
- Create: `src/app/terms/page.tsx`

**Step 1: Create the file**

```tsx
import { LegalPageLayout } from '@/components/layout/LegalPageLayout';

export const metadata = {
  title: 'Terms of Service — Rough Idea Travel',
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      intro="By using Rough Idea Travel, you agree to these terms. Please read them carefully — they're written to be straightforward, not impenetrable."
      crosslinks={[
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Cookie Policy', href: '/cookies' },
      ]}
    >
      <div className="legal-section">
        <h2>Who We Are</h2>
        <p>Rough Idea Travel is operated by Rough Idea Travel LLC. We provide an AI-powered travel planning tool that helps people discover destinations and plan trips. We are not a travel agency, airline, hotel, or booking service.</p>
      </div>

      <div className="legal-section">
        <h2>Using the Service</h2>
        <p>Rough Idea Travel is free to explore without an account. Some features — including saving wishlists and generating full itineraries — require you to create an account.</p>
        <p>You agree to:</p>
        <ul>
          <li>Provide accurate information when using the search form</li>
          <li>Use the service for personal, non-commercial trip planning</li>
          <li>Not attempt to reverse-engineer, scrape, or abuse our AI systems</li>
          <li>Not use the service in any way that violates applicable laws</li>
        </ul>
        <p>You must be at least 18 years old to create an account.</p>
      </div>

      <div className="legal-section">
        <h2>Our Content and AI Recommendations</h2>
        <p>The destination recommendations, itineraries, weather information, and cost estimates generated by Rough Idea Travel are produced by an AI system and are provided for informational purposes only.</p>
        <p>We make reasonable efforts to ensure accuracy, but we cannot guarantee that:</p>
        <ul>
          <li>Recommendations are a perfect fit for your specific needs</li>
          <li>Cost estimates reflect actual prices at time of travel</li>
          <li>Weather data is accurate for your exact travel dates</li>
          <li>Local conditions, hours, or availability are current</li>
        </ul>
        <p>Always verify important details independently before booking. We are not responsible for any decisions made based on our recommendations.</p>
      </div>

      <div className="legal-section">
        <h2>Third-Party Booking Links</h2>
        <p>Rough Idea Travel may display links to third-party booking platforms including Booking.com, Airbnb, and Google. These links may include affiliate tracking, which means we may receive a commission if you make a booking through them — at no additional cost to you. We are not responsible for the content, pricing, availability, or practices of these third-party services.</p>
      </div>

      <div className="legal-section">
        <h2>Accounts</h2>
        <p>If you create an account, you are responsible for maintaining the security of your login credentials and for all activity that occurs under your account. We reserve the right to suspend or terminate accounts that violate these terms.</p>
      </div>

      <div className="legal-section">
        <h2>Intellectual Property</h2>
        <p>The Rough Idea Travel name, logo, and product are owned by Rough Idea Travel LLC. You may not use our branding without prior written permission. Content you submit (such as wishlist names) remains yours. By submitting it, you grant us a limited licence to store and display it as part of the service.</p>
      </div>

      <div className="legal-section">
        <h2>Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, Rough Idea Travel LLC shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service, including but not limited to travel disruptions, booking errors, or reliance on AI-generated recommendations. Our total liability to you for any claim shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
      </div>

      <div className="legal-section">
        <h2>Changes to These Terms</h2>
        <p>We may update these Terms of Service at any time. We will notify registered users of material changes. Continued use of the service constitutes acceptance of the updated terms.</p>
      </div>

      <div className="legal-section">
        <h2>Governing Law</h2>
        <p>These terms are governed by the laws of the State of New York, United States, without regard to conflict of law principles.</p>
      </div>

      <div className="legal-contact-box">
        <p><strong>Rough Idea Travel LLC</strong><br />hello@roughidea.co</p>
      </div>
    </LegalPageLayout>
  );
}
```

**Step 2: Commit**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && git add src/app/terms/page.tsx && git commit -m "feat: add /terms page"
```

---

## Task 7: Create `/cookies` page

**Files:**
- Create: `src/app/cookies/page.tsx`

**Step 1: Create the file**

```tsx
import { LegalPageLayout } from '@/components/layout/LegalPageLayout';

export const metadata = {
  title: 'Cookie Policy — Rough Idea Travel',
};

export default function CookiesPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      intro="This policy explains how Rough Idea Travel uses cookies and similar technologies, and how you can control them."
      crosslinks={[
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
      ]}
    >
      <div className="legal-section">
        <h2>What Are Cookies</h2>
        <p>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, understand how you use them, and work properly across sessions.</p>
      </div>

      <div className="legal-section">
        <h2>How We Use Cookies</h2>
        <p><strong>Essential cookies</strong> — required for the service to function, cannot be disabled:</p>
        <ul>
          <li>Session management (keeping you logged in)</li>
          <li>Security tokens (protecting your account)</li>
          <li>Remembering your search state during a session</li>
        </ul>
        <p><strong>Analytics cookies</strong> — help us understand how people use Rough Idea Travel:</p>
        <ul>
          <li>Pages visited and time spent</li>
          <li>Features used and searches performed</li>
          <li>General geographic region (country level only)</li>
        </ul>
        <p>We use privacy-focused analytics that do not track you across other websites.</p>
        <p><strong>Preference cookies</strong> — remember your settings between visits:</p>
        <ul>
          <li>Currency preference</li>
          <li>Previously searched locations (if you have an account)</li>
        </ul>
        <p>We do not use advertising cookies. We do not share cookie data with advertisers or ad networks.</p>
      </div>

      <div className="legal-section">
        <h2>Third-Party Cookies</h2>
        <p>When you click through to a third-party booking service (Booking.com, Airbnb, etc.), that service may set its own cookies on your device. We have no control over these — please refer to those services&apos; own cookie policies.</p>
      </div>

      <div className="legal-section">
        <h2>Managing Cookies</h2>
        <p>You can control cookies through your browser settings. Most browsers allow you to view, block, or delete cookies. Note that disabling essential cookies will affect the functionality of Rough Idea Travel, including the ability to stay logged in. You can also use our cookie preferences panel (accessible via the footer) to manage non-essential cookies.</p>
      </div>

      <div className="legal-section">
        <h2>Changes to This Policy</h2>
        <p>We may update this Cookie Policy from time to time. We will post any changes on this page with an updated date.</p>
      </div>

      <div className="legal-contact-box">
        <p><strong>Rough Idea Travel LLC</strong><br />privacy@roughidea.co</p>
      </div>
    </LegalPageLayout>
  );
}
```

**Step 2: Verify all three routes**

Visit:
- `http://localhost:3000/privacy`
- `http://localhost:3000/terms`
- `http://localhost:3000/cookies`

Each should show: dark background, sticky nav with logo + "Start Exploring" button, LEGAL label, title in Clash Display, body in DM Sans, contact box with teal left border, cross-links at bottom, shared footer with correct copyright and real links.

Also verify:
- Homepage footer now shows "© 2026 Rough Idea Travel LLC · roughidea.co" and real legal links
- Wishlists page footer same

**Step 3: Commit**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && git add src/app/cookies/page.tsx && git commit -m "feat: add /cookies page"
```
