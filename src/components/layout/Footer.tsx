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
            <a href="/explore">Start Exploring</a>
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
