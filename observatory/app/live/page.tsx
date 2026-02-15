import ObservatoryClient from '../../components/ObservatoryClient';

export default function LivePage() {
  return (
    <main className="obs-shell">
      <ObservatoryClient />
      <div className="live-bottom-cta">
        <a className="lp-btn lp-btn--primary" href="/#deploy">
          Message Dilo to try <span className="lp-btn-arrow">→</span>
        </a>
      </div>
    </main>
  );
}
