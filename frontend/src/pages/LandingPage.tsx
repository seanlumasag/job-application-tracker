import type { KeyboardEvent } from 'react';
import './LandingPage.css';

type LandingPageProps = {
  onNavigate: (path: string) => void;
};

const NAV_OFFSET = 84;

const linkTargets: Record<string, string> = {
  Features: '#features',
  Solutions: '#solutions',
  Overview: '#top',
  Status: '/app',
  Changelog: '/app',
  Releases: '/app',
  'AI copilots': '#features',
  Huddles: '#features',
  Search: '#solutions',
  Automations: '#features',
  Integrations: '#solutions',
  Teams: '#solutions',
  'Solo searchers': '#solutions',
  'Career switchers': '#solutions',
  'Bootcamp grads': '#solutions',
  Recruiters: '#solutions',
  'Help center': '/app',
  Blog: '/app',
  Templates: '/app',
  Community: '/app',
  Events: '/app',
  About: '/app',
  Careers: '/app',
  Press: '/app',
  Brand: '/app',
  Contact: '#footer',
  'Download JobTrack': '/app',
  Privacy: '/app',
  Terms: '/app',
  'Cookie preferences': '/app',
};

const resolveTarget = (label: string) => linkTargets[label] ?? '/app';

const featurePills = [
  { label: 'Kanban stages', icon: '🗂️' },
  { label: 'Quick add', icon: '⚡' },
  { label: 'Follow-ups', icon: '🗓️' },
  { label: 'Notes & links', icon: '📝' },
  { label: 'Last touch', icon: '🔖' },
];

const featureRows = [featurePills.slice(0, 3), featurePills.slice(3)];

const contextBullets = [
  'See every application at a glance.',
  'Update stages, tasks, and notes in one place.',
  'Jump between stages without losing history.',
];

const stats = [
  {
    value: '6',
    copy: 'default stages to keep your pipeline structured',
  },
  {
    value: '1',
    copy: 'board view to see the entire search at a glance',
  },
  {
    value: '∞',
    copy: 'applications, notes, and follow-ups',
  },
];



function LandingPage({ onNavigate }: LandingPageProps) {
  const handleNavigate = (target: string) => {
    if (target.startsWith('#')) {
      const sectionId = target.slice(1);
      const section = document.getElementById(sectionId);
      if (section) {
        const top = section.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
        window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
        window.history.replaceState(null, '', `#${sectionId}`);
      }
      return;
    }

    onNavigate(target);
  };

  const handleAppCTA = () => handleNavigate('/signup');
  const handleSignIn = () => handleNavigate('/signin');
  const handleKeyNavigate = (event: KeyboardEvent<HTMLElement>, target: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNavigate(target);
    }
  };

  return (
    <div className="landing" id="top">
      <div className="landing-bg landing-bg-left" />
      <div className="landing-bg landing-bg-right" />

      <header className="landing-nav">
        <div
          className="brand"
          role="button"
          tabIndex={0}
          onClick={() => handleNavigate('#top')}
          onKeyDown={(event) => handleKeyNavigate(event, '#top')}
        >
          <div className="brand-mark">JT</div>
          <div className="brand-copy">
            <span className="brand-name">JobTrack</span>
          </div>
        </div>
        <nav className="nav-links">
          <button className="link-button" type="button" onClick={() => handleNavigate(resolveTarget('Features'))}>
            Features
          </button>
          <button className="link-button" type="button" onClick={() => handleNavigate(resolveTarget('Solutions'))}>
            Solutions
          </button>
        </nav>
        <div className="nav-actions">
          <button className="ghost" type="button" onClick={handleSignIn}>
            Sign in
          </button>
          <button className="filled" type="button" onClick={handleAppCTA}>
            Get started
          </button>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <h1>
              <span className="headline-line">Your job search,</span>
              <span className="headline-line">
                organized in one board.
              </span>
            </h1>
            <p className="lede">
              Track every application, update stages in one click, and never
              miss a follow-up. JobTrack keeps your pipeline clean and current.
            </p>
            <div className="cta-row">
              <button
                className="filled"
                type="button"
                onClick={handleAppCTA}
              >
                Get started
              </button>
              <button
                className="secondary"
                type="button"
                onClick={handleSignIn}
              >
                Sign in
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <img
              className="dashboard-shot"
              src="/pic_dashboard.png"
              alt="JobTrack dashboard showing the application board"
              loading="lazy"
            />
            <div className="feature-pills">
              {featureRows.map((row, rowIndex) => (
                <div key={`feature-row-${rowIndex}`} className="feature-row">
                  {row.map((pill) => (
                    <span key={pill.label} className="pill">
                      <span className="pill-icon">{pill.icon}</span>
                      {pill.label}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="ai-section" id="features">
          <div className="ai-shell">
            <div className="ai-copy">
              <h2>Everything you need to run a job search.</h2>
              <p>
                Track stages, log follow-ups, and keep notes attached to each
                application. The board and detail view stay in sync so you can
                move fast without losing context.
              </p>
            </div>
            <div className="ai-content">
              <div className="app-shots">
                <img
                  className="app-shot"
                  src="/pic_overview_stage.png"
                  alt="Application overview with stage controls"
                  loading="lazy"
                />
                <img
                  className="app-shot"
                  src="/pic_addapplication.png"
                  alt="Add application form"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="context-section" id="solutions">
          <div className="context-shell">
            <div className="context-heading">
              <h2>
                Keep your search <span className="accent">in motion.</span>
              </h2>
              <p>
                Jump between the board and detail view to update stages, add notes,
                and capture follow-ups without losing your place.
              </p>
            </div>

            <div className="context-grid">
              <div className="context-left">
                <div className="context-bullets">
                  {contextBullets.map((item, idx) => (
                    <div key={item} className="context-item">
                      <span className="context-bar" />
                      <div className={`context-text ${idx === 1 ? 'highlight' : ''}`}>
                        {item}
                        {idx === 1 && (
                          <p className="context-sub">
                            Stage changes log automatically, so you always know what moved
                            and when.
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="context-stat">
                  <div className="stat-number">0 missed</div>
                  <div className="stat-copy">
                    follow-ups when reminders are set
                  </div>
                </div>
              </div>

              <div className="context-window">
                <img
                  className="context-shot"
                  src="/pic_tasks_edit.png"
                  alt="Tasks and edit fields view"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="stats-section" id="stats">
          <div className="stats-shell">
            <h2>Built for the real workflow.</h2>
            <div className="stats-grid">
              {stats.map((stat) => (
                <div key={stat.value} className="stat-block">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-description">{stat.copy}</div>
                </div>
              ))}
            </div>
          </div>
        </section>


        <footer className="footer" id="footer">
          <div className="footer-shell">
            <div className="footer-bottom">
              <div className="footer-legal">
                ©2026 JobTrack. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default LandingPage;
