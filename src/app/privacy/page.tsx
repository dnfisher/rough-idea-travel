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
