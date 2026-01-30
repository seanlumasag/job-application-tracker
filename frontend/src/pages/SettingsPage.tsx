import { useEffect, useState } from 'react';
import { useAuth } from '../lib/authContext';
import { authService } from '../services/authService';
import { useAppContext } from './AppLayout';

function SettingsPage() {
  const { token, goToLanding } = useAppContext();
  const { setToken } = useAuth();
  const [profile, setProfile] = useState<{ userId: string; email: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');

  const formatUserId = (userId: string) => {
    if (userId.length <= 12) return userId;
    return `${userId.slice(0, 8)}…${userId.slice(-4)}`;
  };

  const handleCopyUserId = async (userId: string) => {
    setCopyMessage('');
    try {
      await navigator.clipboard.writeText(userId);
      setCopyMessage('Copied');
      window.setTimeout(() => setCopyMessage(''), 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to copy';
      setCopyMessage(message);
      window.setTimeout(() => setCopyMessage(''), 2000);
    }
  };

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const me = await authService.me();
        setProfile(me);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load profile';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [token]);

  const handleDeleteAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!deletePassword) return;
    setDeleteMessage('');
    setError('');
    setDeleteBusy(true);
    try {
      await authService.deleteAccount(deletePassword);
      setToken('');
      sessionStorage.removeItem('jat.token');
      goToLanding();
      window.location.assign('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete account';
      setError(message);
    } finally {
      setDeleteBusy(false);
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
              <div className="settings-value">
                <strong className="settings-user-id" title={profile.userId}>
                  {formatUserId(profile.userId)}
                </strong>
                <button
                  type="button"
                  className="text-button settings-copy"
                  onClick={() => handleCopyUserId(profile.userId)}
                  aria-label="Copy user ID"
                  title={copyMessage || 'Copy full UUID'}
                >
                  {copyMessage || 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div className="settings-card danger-card">
            <h3>Delete account</h3>
            <p className="muted">
              This permanently deletes your account and all associated data. This action cannot be undone.
            </p>
            <form className="settings-form" onSubmit={handleDeleteAccount}>
              <label className="field">
                <span>Confirm password</span>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </label>
              <div className="settings-actions">
                <button type="submit" className="ghost danger" disabled={deleteBusy}>
                  {deleteBusy ? 'Deleting…' : 'Delete account'}
                </button>
              </div>
              {deleteMessage && <p className="muted">{deleteMessage}</p>}
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default SettingsPage;
