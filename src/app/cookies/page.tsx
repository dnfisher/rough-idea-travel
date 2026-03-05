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
