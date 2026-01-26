import { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { useAppContext } from './AppLayout';

type MfaState = {
  secret: string;
  otpauthUrl: string;
};

function SettingsPage() {
  const { token } = useAppContext();
  const [profile, setProfile] = useState<{ userId: number; email: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [mfaSetup, setMfaSetup] = useState<MfaState | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaBusy, setMfaBusy] = useState(false);
  const [mfaMessage, setMfaMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const me = await authService.me();
        setProfile(me);
        setResetEmail(me.email);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load profile';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [token]);

  const handlePasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setResetMessage('');
    setError('');
    try {
      const response = await authService.requestPasswordReset(resetEmail);
      setResetMessage(response.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request reset';
      setError(message);
    }
  };

  const handleMfaSetup = async () => {
    setMfaMessage('');
    setError('');
    setMfaBusy(true);
    try {
      const response = await authService.setupMfa();
      setMfaSetup(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to setup MFA';
      setError(message);
    } finally {
      setMfaBusy(false);
    }
  };

  const handleMfaEnable = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mfaCode) return;
    setMfaMessage('');
    setError('');
    setMfaBusy(true);
    try {
      await authService.enableMfa(mfaCode);
      setMfaMessage('MFA enabled.');
      setMfaCode('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enable MFA';
      setError(message);
    } finally {
      setMfaBusy(false);
    }
  };

  const handleMfaDisable = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mfaCode) return;
    setMfaMessage('');
    setError('');
    setMfaBusy(true);
    try {
      await authService.disableMfa(mfaCode);
      setMfaMessage('MFA disabled.');
      setMfaCode('');
      setMfaSetup(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disable MFA';
      setError(message);
    } finally {
      setMfaBusy(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Settings</h2>
          <p>Manage your account and security preferences.</p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading && <p className="empty">Loading profile…</p>}

      {!loading && profile && (
        <div className="settings-grid">
          <div className="settings-card">
            <h3>Profile</h3>
            <div className="settings-row">
              <span>Email</span>
              <strong>{profile.email}</strong>
            </div>
            <div className="settings-row">
              <span>User ID</span>
              <strong>{profile.userId}</strong>
            </div>
          </div>

          <div className="settings-card">
            <h3>Password reset</h3>
            <form className="settings-form" onSubmit={handlePasswordReset}>
              <label className="field">
                <span>Reset email</span>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  required
                />
              </label>
              <button type="submit" className="primary">
                Send reset link
              </button>
              {resetMessage && <p className="muted">{resetMessage}</p>}
            </form>
          </div>

          <div className="settings-card">
            <h3>MFA</h3>
            <p className="muted">
              Generate a secret, then confirm with a 6‑digit code from your authenticator app.
            </p>
            <div className="settings-actions">
              <button type="button" className="ghost" onClick={handleMfaSetup} disabled={mfaBusy}>
                {mfaBusy ? 'Loading…' : 'Generate secret'}
              </button>
            </div>
            {mfaSetup && (
              <div className="mfa-box">
                <div>
                  <span className="muted">Secret</span>
                  <strong>{mfaSetup.secret}</strong>
                </div>
                <div className="mfa-url">{mfaSetup.otpauthUrl}</div>
              </div>
            )}
            <form className="settings-form" onSubmit={handleMfaEnable}>
              <label className="field">
                <span>6‑digit code</span>
                <input
                  type="text"
                  value={mfaCode}
                  onChange={(event) => setMfaCode(event.target.value)}
                  placeholder="123456"
                />
              </label>
              <div className="settings-actions">
                <button type="submit" className="primary" disabled={mfaBusy}>
                  Enable MFA
                </button>
                <button type="button" className="ghost" onClick={handleMfaDisable} disabled={mfaBusy}>
                  Disable MFA
                </button>
              </div>
              {mfaMessage && <p className="muted">{mfaMessage}</p>}
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default SettingsPage;
