import SetupForm from '../../components/SetupForm';

export const metadata = {
  title: 'Setup — marsquad Observatory',
  description: 'Create your AI agent observatory in under 2 minutes.',
};

export default function SetupPage() {
  return (
    <main className="lp">
      <div className="lp-grain" aria-hidden="true" />

      <nav className="lp-nav">
        <a href="/" className="lp-logo">
          <span className="lp-logo-icon">◈</span>
          <span className="lp-logo-text">marsquad</span>
        </a>
        <div className="lp-nav-links">
          <a href="/" className="lp-nav-link">home</a>
          <a href="/#terminal" className="lp-nav-link">live feed</a>
        </div>
      </nav>

      <section className="su-page">
        <SetupForm />
      </section>
    </main>
  );
}
