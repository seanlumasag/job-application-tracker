import type { KeyboardEvent } from 'react';
import './LandingPage.css';

type LandingPageProps = {
  onNavigate: (path: string) => void;
};

const linkTargets: Record<string, string> = {
  Features: '#features',
  Solutions: '#solutions',
  Pricing: '#tiers',
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

const partnerLogos = ['gm', 'OpenAI', 'P Paramount', 'stripe', 'IBM'];
const featurePills = [
  { label: 'Plan launches', icon: '🗂️' },
  { label: 'Run projects', icon: '🏁' },
  { label: 'Chat with clients', icon: '💬' },
  { label: 'Ask an agent', icon: '🤖' },
  { label: 'Automate tasks', icon: '✨' },
];

const featureRows = [featurePills.slice(0, 3), featurePills.slice(3)];

const aiTasks = [
  'Summarize recruiter threads automatically',
  'Draft tailored follow-ups in seconds',
  'Prep for interviews with company briefs',
  'Turn on AI note-taking in huddles',
  'Organize referrals and warm intros',
  'Sync pipeline updates to your CRM',
];

const contextBullets = [
  'Meet Scout: your personal AI agent for the job search.',
  'One search to rule your pipeline, docs, and recruiter threads.',
  'Bring CRM data to every conversation automatically.',
];

const stats = [
  {
    value: '90%',
    copy: 'say JobTrack keeps their search connected across recruiters',
  },
  {
    value: '43',
    copy: 'apps stitched together by JobTrack so nothing falls through',
  },
  {
    value: '87%',
    copy: 'see faster collaboration on interviews and offer prep',
  },
];

const pricingTiers = [
  {
    name: 'Starter',
    price: '$19',
    cadence: 'per month',
    summary: 'Solo searchers and side projects.',
    highlights: [
      'Unlimited applications',
      'Interview timeline',
      'Basic AI summaries',
      'Email reminders',
    ],
    cta: 'Start free',
  },
  {
    name: 'Growth',
    price: '$49',
    cadence: 'per month',
    summary: 'Teams coordinating across recruiters.',
    highlights: [
      'Everything in Starter',
      'Shared recruiter inbox',
      'AI follow-up drafts',
      'Pipeline analytics',
    ],
    cta: 'Upgrade to Growth',
    featured: true,
  },
  {
    name: 'Scale',
    price: '$99',
    cadence: 'per month',
    summary: 'Organizations running multi-team searches.',
    highlights: [
      'Everything in Growth',
      'Custom CRM sync',
      'Audit + compliance',
      'Dedicated success lead',
    ],
    cta: 'Talk to sales',
  },
];

const footerColumns = [
  {
    heading: 'Product',
    links: ['Overview', 'Pricing', 'Status', 'Changelog', 'Releases'],
  },
  {
    heading: 'Features',
    links: ['AI copilots', 'Huddles', 'Search', 'Automations', 'Integrations'],
  },
  {
    heading: 'Solutions',
    links: ['Teams', 'Solo searchers', 'Career switchers', 'Bootcamp grads', 'Recruiters'],
  },
  {
    heading: 'Resources',
    links: ['Help center', 'Blog', 'Templates', 'Community', 'Events'],
  },
  {
    heading: 'Company',
    links: ['About', 'Careers', 'Press', 'Brand', 'Contact'],
  },
];

function LandingPage({ onNavigate }: LandingPageProps) {
  const handleNavigate = (target: string) => {
    if (target.startsWith('#')) {
      const sectionId = target.slice(1);
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', `#${sectionId}`);
      }
      return;
    }

    onNavigate(target);
  };

  const handleAppCTA = () => handleNavigate('/app');
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
            <span className="brand-sub">workspace</span>
          </div>
        </div>
        <nav className="nav-links">
          <button className="link-button" type="button" onClick={() => handleNavigate(resolveTarget('Features'))}>
            Features
          </button>
          <button className="link-button" type="button" onClick={() => handleNavigate(resolveTarget('Solutions'))}>
            Solutions
          </button>
          <button className="link-button" type="button" onClick={() => handleNavigate(resolveTarget('Pricing'))}>
            Pricing
          </button>
        </nav>
        <div className="nav-actions">
          <button className="ghost" type="button" onClick={handleAppCTA}>
            Sign in
          </button>
          <button
            className="outlined"
            type="button"
            onClick={handleAppCTA}
          >
            Request a demo
          </button>
          <button
            className="filled"
            type="button"
            onClick={handleAppCTA}
          >
            Get started
          </button>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <h1>
              JobTrack is your team&apos;s collective
              <span className="emoji">🧠</span>
              tracker.
            </h1>
            <p className="lede">
              Move faster and stay organized across every application, recruiter,
              and interview thread—now with AI to keep follow-ups on track.
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
                onClick={() => handleNavigate(resolveTarget('Pricing'))}
              >
                Find your plan →
              </button>
            </div>
            <div className="trusted">
              <span className="trusted-label">Trusted by top teams</span>
              <div className="trusted-logos">
                {partnerLogos.map((logo) => (
                  <span key={logo} className="logo-pill">
                    {logo}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="window">
              <div className="window-top">
                <div className="dots">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="window-title">Search JobTrack HQ</div>
                <div className="window-actions">
                  <span className="action-dot" />
                  <span className="action-dot" />
                </div>
              </div>
              <div className="window-body">
                <aside className="sidebar">
                  <div className="sidebar-org">
                    <span className="org-icon">A</span>
                    <span className="org-name">Acme Talent</span>
                  </div>
                  <div className="sidebar-section">
                    <div className="sidebar-item active">Inbox</div>
                    <div className="sidebar-item">Threads</div>
                    <div className="sidebar-item">Drafts</div>
                  </div>
                  <div className="sidebar-section">
                    <div className="sidebar-label">Search plan</div>
                    <div className="sidebar-item">Prospecting</div>
                    <div className="sidebar-item active">Applied</div>
                    <div className="sidebar-item">Interviews</div>
                    <div className="sidebar-item">Offers</div>
                  </div>
                  <div className="sidebar-section">
                    <div className="sidebar-label">Channels</div>
                    <div className="sidebar-item">General</div>
                    <div className="sidebar-item">Recruiters</div>
                    <div className="sidebar-item">Referrals</div>
                  </div>
                </aside>
                <section className="channel">
                  <div className="channel-header">
                    <div>
                      <div className="channel-label"># product-launch</div>
                      <div className="channel-meta">35 members · 6 pinned</div>
                    </div>
                  <button className="pill ghost" type="button" onClick={handleAppCTA}>
                    Join channel
                  </button>
                  </div>
                  <div className="message-card">
                    <div className="avatar blue">MB</div>
                    <div>
                      <div className="message-title">Resume refreshed</div>
                      <div className="message-body">
                        Matt updated the portfolio link in
                        <span className="link"> Launch tracker</span>
                      </div>
                      <div className="message-meta">
                        <span className="tag">AI note</span>
                        <span className="reaction">👍 6</span>
                      </div>
                    </div>
                  </div>
                  <div className="message-card">
                    <div className="avatar green">SP</div>
                    <div>
                      <div className="message-title">Interview scheduled</div>
                      <div className="message-body">
                        Sara set a huddle for Thursday with hiring manager.
                        <span className="link"> Join prep</span>
                      </div>
                      <div className="message-meta">
                        <span className="live">LIVE</span>
                      </div>
                    </div>
                  </div>
                  <div className="input-bar">
                    <div className="input-shell">
                      <span className="plus">+</span>
                      <input
                        placeholder="Share an update with the team"
                        aria-label="Share an update"
                      />
                      <div className="input-actions">
                        <span role="img" aria-label="lightning">
                          ⚡
                        </span>
                        <span role="img" aria-label="emoji">
                          😊
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
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
              <h2>Reimagine what&apos;s possible with AI and copilots.</h2>
              <p>
                JobTrack AI doesn&apos;t replace your team—it keeps them ahead.
                Capture every call, summarize recruiter chats, and surface next
                steps so nothing slips between applications, interviews, or
                follow-ups.
              </p>
            </div>
            <div className="ai-content">
              <div className="ai-list-card">
                {aiTasks.map((task, idx) => (
                  <div
                    key={task}
                    className={`ai-list-item ${idx === 3 ? 'active' : ''}`}
                  >
                    {task}
                  </div>
                ))}
              </div>
              <div className="ai-video-card">
                <div className="ai-video-top">
                  <div className="ai-dropdown">
                    <span role="img" aria-label="sparkles">
                      ✨
                    </span>
                    AI Notes: Off
                  </div>
                  <button className="ai-transcribe" type="button" onClick={handleAppCTA}>
                    Start AI Notes &amp; Transcription
                  </button>
                </div>
                <div className="ai-grid">
                  <div className="ai-face face-one">
                    <span className="face-name">Alex</span>
                  </div>
                  <div className="ai-face face-two">
                    <span className="face-name">Priya</span>
                  </div>
                  <div className="ai-face face-three">
                    <span className="face-name">Monica</span>
                  </div>
                  <div className="ai-face face-four">
                    <span className="face-name">Jamal</span>
                  </div>
                </div>
                <div className="ai-controls">
                  <span>📊</span>
                  <span>🎥</span>
                  <span>🎤</span>
                  <span>🎨</span>
                  <span>📝</span>
                  <span>🔍</span>
                  <span className="leave">Leave</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="context-section" id="solutions">
          <div className="context-shell">
            <div className="context-heading">
              <h2>
                Give everyone instant <span className="accent">context.</span>
              </h2>
              <p>
                Access every decision, doc, and conversation—so teams build on past work
                instead of recreating it.
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
                            AI-powered search pulls resumes, recruiter notes, interview
                            recaps, and tasks into one answer.
                          </p>
                        )}
                        {idx === 1 && (
                          <button
                            className="text-link"
                            type="button"
                            onClick={() => handleNavigate(resolveTarget('Search'))}
                          >
                            Learn about AI search →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="context-stat">
                  <div className="stat-number">97 min</div>
                  <div className="stat-copy">
                    average time saved weekly with JobTrack AI
                    <sup>1</sup>
                  </div>
                </div>
              </div>

              <div className="context-window">
                <div className="context-top">
                  <div className="context-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="context-search">
                    <span className="icon">🔍</span>
                    <input defaultValue="What is the status of Acme rollout?" />
                  </div>
                  <div className="context-avatars">
                    <span role="img" aria-label="agent">
                      🤖
                    </span>
                    <span role="img" aria-label="bell">
                      🔔
                    </span>
                    <span role="img" aria-label="help">
                      ❓
                    </span>
                  </div>
                </div>

                <div className="context-body">
                  <div className="context-answer">
                    <div className="answer-meta">
                      <span className="tag purple">AI answer</span>
                      <div className="answer-actions">
                        <span>🔄</span>
                        <span>📌</span>
                        <span>👁️</span>
                      </div>
                    </div>
                    <p>
                      Acme rollout is in flight with design refinements due Friday. See{' '}
                      <span className="link">PRD</span>,{' '}
                      <span className="link">Interview notes</span>, and{' '}
                      <span className="link">Launch checklist</span> for owners and timing.
                    </p>
                    <div className="answer-buttons">
                      <button type="button" onClick={handleAppCTA}>
                        Share
                      </button>
                      <button type="button" onClick={handleAppCTA}>
                        Sources
                      </button>
                      <button type="button" onClick={handleAppCTA}>
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="context-results">
                    <div className="filters">
                      <div className="filter-group">
                        <span className="filter">All</span>
                        <span className="filter">Messages</span>
                        <span className="filter">Files</span>
                        <span className="filter">Channels</span>
                        <span className="filter">Drive</span>
                        <span className="filter">Tasks</span>
                      </div>
                      <div className="filter-group">
                        <span className="filter">In ▾</span>
                        <span className="filter">From ▾</span>
                        <span className="filter">Most relevant ▾</span>
                      </div>
                    </div>

                    <div className="result-card">
                      <div className="result-meta">
                        <span className="avatar yellow">LZ</span>
                        <div>
                          <div className="result-name">Lisa Zhang</div>
                          <div className="result-body">
                            Here&apos;s the project brief and updated deck for Acme rollout.{' '}
                            <span className="link">Drive link</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="result-card">
                      <div className="result-meta">
                        <span className="avatar teal">MB</span>
                        <div>
                          <div className="result-name">Matt Brewer</div>
                          <div className="result-body">
                            Legal approved the vendor contracts—see the{' '}
                            <span className="link">checklist</span> for rollout dependencies.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-section" id="stats">
          <div className="stats-shell">
            <h2>We&apos;re in the business of growing careers.</h2>
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

        <section className="pricing-section" id="tiers">
          <div className="pricing-shell">
            <div className="pricing-header">
              <h2>Plans built for every stage of the search.</h2>
              <p>
                Pick a tier that matches your momentum. Every plan comes with
                smart reminders, shared notes, and the JobTrack AI assistant.
              </p>
            </div>
            <div className="pricing-grid">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`pricing-card${tier.featured ? ' featured' : ''}`}
                >
                  <div className="pricing-top">
                    <div className="pricing-name">{tier.name}</div>
                    {tier.featured && <span className="pricing-badge">Most popular</span>}
                  </div>
                  <div className="pricing-price">
                    <span className="amount">{tier.price}</span>
                    <span className="cadence">{tier.cadence}</span>
                  </div>
                  <p className="pricing-summary">{tier.summary}</p>
                  <ul className="pricing-features">
                    {tier.highlights.map((item) => (
                      <li key={item}>
                        <span className="check">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button type="button" className="pricing-cta" onClick={handleAppCTA}>
                    {tier.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="footer" id="footer">
          <div className="footer-shell">
            <div className="footer-top">
              <button className="region" type="button" onClick={handleAppCTA}>
                🌐 Change region ▾
              </button>
              <div className="footer-social">
                <span aria-hidden>in</span>
                <span aria-hidden>📷</span>
                <span aria-hidden>📘</span>
                <span aria-hidden>✖️</span>
                <span aria-hidden>▶️</span>
              </div>
            </div>

            <div className="footer-columns">
              <div
                className="footer-brand"
                role="button"
                tabIndex={0}
                onClick={() => handleNavigate(resolveTarget('Overview'))}
                onKeyDown={(event) => handleKeyNavigate(event, resolveTarget('Overview'))}
              >
                <div className="brand-mark">JT</div>
                <div className="brand-copy">
                  <span className="brand-name">JobTrack</span>
                  <span className="brand-sub">workspace</span>
                </div>
              </div>
              {footerColumns.map((col) => (
                <div key={col.heading} className="footer-col">
                  <h3>{col.heading}</h3>
                  <ul>
                    {col.links.map((link) => (
                      <li key={link}>
                        <button
                          type="button"
                          className="footer-link"
                          onClick={() => handleNavigate(resolveTarget(link))}
                        >
                          {link}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="footer-bottom">
              <div className="footer-links">
                <button
                  type="button"
                  className="footer-link"
                  onClick={() => handleNavigate(resolveTarget('Download JobTrack'))}
                >
                  Download JobTrack
                </button>
                <button
                  type="button"
                  className="footer-link"
                  onClick={() => handleNavigate(resolveTarget('Privacy'))}
                >
                  Privacy
                </button>
                <button
                  type="button"
                  className="footer-link"
                  onClick={() => handleNavigate(resolveTarget('Terms'))}
                >
                  Terms
                </button>
                <button
                  type="button"
                  className="footer-link"
                  onClick={() => handleNavigate(resolveTarget('Cookie preferences'))}
                >
                  Cookie preferences
                </button>
              </div>
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
