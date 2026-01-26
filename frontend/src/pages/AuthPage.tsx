import { useState } from 'react';
import type { FormEvent } from 'react';
import { authService } from '../services/authService';
import { apiClient } from '../lib/apiClient';
import './AuthPage.css';

type AuthPageProps = {
  mode: 'signin' | 'signup';
  onNavigate: (path: string) => void;
};

const COPY = {
  signin: {
    title: 'Welcome back',
    subtitle: 'Sign in to stay on top of every application.',
    cta: 'Sign in',
    switchText: 'New to JobTrack?',
    switchLink: 'Create an account',
    switchPath: '/signup',
  },
  signup: {
    title: 'Create your workspace',
    subtitle: 'Start tracking your search in minutes.',
    cta: 'Create account',
    switchText: 'Already have an account?',
    switchLink: 'Sign in',
    switchPath: '/signin',
  },
};

function AuthPage({ mode, onNavigate }: AuthPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const copy = COPY[mode];

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response =
        mode === 'signup'
          ? await authService.signup(email, password)
          : await authService.login(email, password);
      sessionStorage.setItem('jat.token', response.token);
      apiClient.defaults.headers.common.Authorization = `Bearer ${response.token}`;
      onNavigate('/app');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <button type="button" className="auth-back" onClick={() => onNavigate('/')}>
          ← Back to home
        </button>
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-mark">JT</div>
            <div>
              <div className="auth-name">JobTrack</div>
              <div className="auth-sub">workspace</div>
            </div>
          </div>
          <h1>{copy.title}</h1>
          <p className="auth-subtitle">{copy.subtitle}</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-submit" disabled={busy}>
              {busy ? 'Working…' : copy.cta}
            </button>
          </form>
          <div className="auth-switch">
            <span>{copy.switchText}</span>
            <button type="button" onClick={() => onNavigate(copy.switchPath)}>
              {copy.switchLink}
            </button>
          </div>
        </div>
        <div className="auth-aside">
          <div className="auth-aside-card">
            <p className="auth-quote">
              “JobTrack keeps my pipeline and follow-ups in one place. I finally
              know what to do next.”
            </p>
            <div className="auth-person">
              <span className="auth-avatar">AL</span>
              <div>
                <div className="auth-person-name">Avery Lee</div>
                <div className="auth-person-role">Product designer</div>
              </div>
            </div>
          </div>
          <div className="auth-metrics">
            <div>
              <div className="auth-metric-value">3.2x</div>
              <div className="auth-metric-copy">more interviews tracked</div>
            </div>
            <div>
              <div className="auth-metric-value">24h</div>
              <div className="auth-metric-copy">average follow-up cycle</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
