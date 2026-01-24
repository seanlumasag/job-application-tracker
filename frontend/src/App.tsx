import { useEffect, useMemo, useState } from 'react';
import { apiClient } from './lib/apiClient';
import { applicationService, type ApplicationPayload } from './services/applicationService';
import { authService } from './services/authService';
import { dashboardService } from './services/dashboardService';
import type {
  Application,
  AuthResponse,
  DashboardActivityResponse,
  DashboardNextActionsResponse,
  DashboardSummaryResponse,
  Stage,
  Task,
} from './types';
import './App.css';

const STAGES: Stage[] = ['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'];

const emptyApplicationPayload = (): ApplicationPayload => ({
  company: '',
  role: '',
  jobUrl: '',
  location: '',
  notes: '',
});

type ViewKey = 'dashboard' | 'applications' | 'detail';
type AuthMode = 'login' | 'signup';

function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('jat.token') ?? '');
  const [view, setView] = useState<ViewKey>('dashboard');
  const [stageFilter, setStageFilter] = useState<Stage | 'ALL'>('ALL');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [nextActions, setNextActions] = useState<DashboardNextActionsResponse | null>(null);
  const [activity, setActivity] = useState<DashboardActivityResponse | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [createForm, setCreateForm] = useState<ApplicationPayload>(() => emptyApplicationPayload());
  const [editForm, setEditForm] = useState<ApplicationPayload>(() => emptyApplicationPayload());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [updateBusy, setUpdateBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
      sessionStorage.setItem('jat.token', token);
    } else {
      delete apiClient.defaults.headers.common.Authorization;
      sessionStorage.removeItem('jat.token');
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setSummary(null);
      setNextActions(null);
      setActivity(null);
      setApplications([]);
      setError('');
      return;
    }
    refreshDashboard();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    refreshApplications(stageFilter);
  }, [token, stageFilter]);

  useEffect(() => {
    if (!selectedApp) {
      setEditForm(emptyApplicationPayload());
      return;
    }
    setEditForm({
      company: selectedApp.company,
      role: selectedApp.role,
      jobUrl: selectedApp.jobUrl ?? '',
      location: selectedApp.location ?? '',
      notes: selectedApp.notes ?? '',
    });
  }, [selectedApp]);

  const refreshDashboard = async () => {
    setLoading(true);
    try {
      const [summaryData, nextActionsData, activityData] = await Promise.all([
        dashboardService.summary(),
        dashboardService.nextActions(7),
        dashboardService.activity(7),
      ]);
      setSummary(summaryData);
      setNextActions(nextActionsData);
      setActivity(activityData);
      setError('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const submitAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthBusy(true);
    setError('');
    try {
      const response: AuthResponse =
        authMode === 'signup'
          ? await authService.signup(email, password)
          : await authService.login(email, password);
      setToken(response.token);
      setEmail('');
      setPassword('');
      setView('dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setSelectedApp(null);
    setView('dashboard');
    setStageFilter('ALL');
  };

  const refreshApplications = async (targetStage: Stage | 'ALL' = stageFilter) => {
    setLoading(true);
    try {
      const apps = await applicationService.list(targetStage === 'ALL' ? undefined : targetStage);
      setApplications(apps);
      if (selectedApp) {
        const updated = apps.find((app) => app.id === selectedApp.id) ?? null;
        setSelectedApp(updated);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load applications';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const normalizePayload = (payload: ApplicationPayload): ApplicationPayload => ({
    company: payload.company.trim(),
    role: payload.role.trim(),
    jobUrl: payload.jobUrl?.trim() || null,
    location: payload.location?.trim() || null,
    notes: payload.notes?.trim() || null,
  });

  const handleCreateChange = (field: keyof ApplicationPayload, value: string) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditChange = (field: keyof ApplicationPayload, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createForm.company.trim() || !createForm.role.trim()) {
      setError('Company and role are required');
      return;
    }

    setCreateBusy(true);
    setError('');
    try {
      const payload = normalizePayload(createForm);
      const created = await applicationService.create(payload);
      setCreateForm(emptyApplicationPayload());
      if (stageFilter === 'ALL') {
        await refreshApplications('ALL');
      } else {
        setStageFilter('ALL');
      }
      setSelectedApp(created);
      setView('detail');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create application';
      setError(message);
    } finally {
      setCreateBusy(false);
    }
  };

  const submitUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedApp) return;
    if (!editForm.company.trim() || !editForm.role.trim()) {
      setError('Company and role are required');
      return;
    }

    setUpdateBusy(true);
    setError('');
    try {
      const payload = normalizePayload(editForm);
      const updated = await applicationService.update(selectedApp.id, payload);
      setSelectedApp(updated);
      setApplications((prev) => prev.map((app) => (app.id === updated.id ? updated : app)));
      await refreshApplications(stageFilter);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update application';
      setError(message);
    } finally {
      setUpdateBusy(false);
    }
  };

  const deleteApplication = async () => {
    if (!selectedApp) return;
    const confirmed = window.confirm(`Delete application for ${selectedApp.company}?`);
    if (!confirmed) return;

    setDeleteBusy(true);
    setError('');
    try {
      await applicationService.remove(selectedApp.id);
      setApplications((prev) => prev.filter((app) => app.id !== selectedApp.id));
      setSelectedApp(null);
      setView('applications');
      await refreshApplications(stageFilter);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete application';
      setError(message);
    } finally {
      setDeleteBusy(false);
    }
  };

  const activityMax = useMemo(() => {
    if (!activity) return 1;
    return Math.max(
      1,
      ...activity.items.map((item) => Math.max(item.stageTransitions, item.taskCompletions)),
    );
  }, [activity]);

  const showDetail = (app: Application) => {
    setSelectedApp(app);
    setView('detail');
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-kicker">Job Application Tracker</p>
          <h1>Operate your job search like a pipeline.</h1>
        </div>
        <div className="token-panel">
          <label htmlFor="token">JWT token</label>
          <input
            id="token"
            type="password"
            placeholder="Paste token to load data"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
          <div className="token-actions">
            <button type="button" className="ghost" onClick={() => setToken('')}>
              Clear
            </button>
            {token && (
              <button type="button" className="ghost" onClick={handleLogout}>
                Log out
              </button>
            )}
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <button
          type="button"
          className={view === 'dashboard' ? 'active' : ''}
          disabled={!token}
          onClick={() => setView('dashboard')}
        >
          Dashboard
        </button>
        <button
          type="button"
          className={view === 'applications' ? 'active' : ''}
          disabled={!token}
          onClick={() => setView('applications')}
        >
          Applications
        </button>
        {selectedApp && (
          <button
            type="button"
            className={view === 'detail' ? 'active' : ''}
            disabled={!token}
            onClick={() => setView('detail')}
          >
            Detail
          </button>
        )}
        {loading && <span className="status-chip">Syncing</span>}
        {error && <span className="status-chip error">{error}</span>}
        {!token && <span className="status-chip warn">Token required</span>}
      </nav>

      <main className="app-main">
        {!token && (
          <section className="panel auth-panel">
            <div className="panel-header">
              <div>
                <h2>{authMode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
                <p>Sign in to sync with your backend data.</p>
              </div>
              <div className="auth-toggle">
                <button
                  type="button"
                  className={authMode === 'login' ? 'active' : ''}
                  onClick={() => setAuthMode('login')}
                >
                  Log in
                </button>
                <button
                  type="button"
                  className={authMode === 'signup' ? 'active' : ''}
                  onClick={() => setAuthMode('signup')}
                >
                  Sign up
                </button>
              </div>
            </div>
            <form className="auth-form" onSubmit={submitAuth}>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </label>
              <button type="submit" className="primary" disabled={authBusy}>
                {authBusy ? 'Working…' : authMode === 'signup' ? 'Create account' : 'Log in'}
              </button>
            </form>
          </section>
        )}

        {token && view === 'dashboard' && (
          <section className="dashboard-grid">
            <div className="panel summary-panel">
              <div className="panel-header">
                <h2>Pipeline snapshot</h2>
                <p>Stage counts and overdue tasks.</p>
              </div>
              <div className="summary-grid">
                {STAGES.map((stage) => (
                  <div key={stage} className="summary-card">
                    <span>{stage}</span>
                    <strong>{summary?.stageCounts?.[stage] ?? 0}</strong>
                  </div>
                ))}
                <div className="summary-card highlight">
                  <span>Overdue tasks</span>
                  <strong>{summary?.overdueTasks ?? 0}</strong>
                </div>
              </div>
            </div>

            <div className="panel activity-panel">
              <div className="panel-header">
                <h2>Activity pulse</h2>
                <p>Transitions and completions over the last 7 days.</p>
              </div>
              <div className="activity-list">
                {activity?.items.map((item) => (
                  <div key={item.date} className="activity-row">
                    <span>{formatDate(item.date)}</span>
                    <div className="activity-bars">
                      <div
                        className="bar transitions"
                        style={{ width: `${(item.stageTransitions / activityMax) * 100}%` }}
                      />
                      <div
                        className="bar completions"
                        style={{ width: `${(item.taskCompletions / activityMax) * 100}%` }}
                      />
                    </div>
                    <span className="activity-counts">
                      {item.stageTransitions} · {item.taskCompletions}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel next-panel">
              <div className="panel-header">
                <h2>Next actions</h2>
                <p>Tasks due soon and stale applications.</p>
              </div>
              <div className="next-columns">
                <div>
                  <h3>Due soon</h3>
                  {nextActions?.dueSoonTasks?.length ? (
                    nextActions.dueSoonTasks.map((task) => (
                      <TaskRow key={task.id} task={task} />
                    ))
                  ) : (
                    <p className="empty">No due tasks in the next 7 days.</p>
                  )}
                </div>
                <div>
                  <h3>Stale applications</h3>
                  {nextActions?.staleApplications?.length ? (
                    nextActions.staleApplications.map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        className="link-row"
                        onClick={() => showDetail(app)}
                      >
                        <span>{app.company}</span>
                        <span>{app.role}</span>
                      </button>
                    ))
                  ) : (
                    <p className="empty">Everything is freshly touched.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {token && view === 'applications' && (
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Applications</h2>
                <p>Create new records, filter by stage, and drill into details.</p>
              </div>
              <div className="header-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => refreshApplications()}
                  disabled={loading}
                >
                  Refresh
                </button>
              </div>
            </div>
            <form className="app-form" onSubmit={submitCreate}>
              <div className="form-grid two-col">
                <label className="field">
                  <span>Company</span>
                  <input
                    type="text"
                    value={createForm.company}
                    onChange={(event) => handleCreateChange('company', event.target.value)}
                    placeholder="Acme Corp"
                    required
                  />
                </label>
                <label className="field">
                  <span>Role</span>
                  <input
                    type="text"
                    value={createForm.role}
                    onChange={(event) => handleCreateChange('role', event.target.value)}
                    placeholder="Product Operations Lead"
                    required
                  />
                </label>
                <label className="field">
                  <span>Location</span>
                  <input
                    type="text"
                    value={createForm.location ?? ''}
                    onChange={(event) => handleCreateChange('location', event.target.value)}
                    placeholder="Remote / NYC"
                  />
                </label>
                <label className="field">
                  <span>Job URL</span>
                  <input
                    type="url"
                    value={createForm.jobUrl ?? ''}
                    onChange={(event) => handleCreateChange('jobUrl', event.target.value)}
                    placeholder="https://company.com/job"
                  />
                </label>
                <label className="field full">
                  <span>Notes</span>
                  <textarea
                    rows={3}
                    value={createForm.notes ?? ''}
                    onChange={(event) => handleCreateChange('notes', event.target.value)}
                    placeholder="Relevant context, recruiter, referral details, etc."
                  />
                </label>
              </div>
              <div className="form-actions">
                <p className="muted">Creates in stage SAVED and stamps last touch now.</p>
                <button type="submit" className="primary" disabled={createBusy}>
                  {createBusy ? 'Adding…' : 'Add application'}
                </button>
              </div>
            </form>
            <div className="filter-row">
              <button
                type="button"
                className={stageFilter === 'ALL' ? 'active' : ''}
                onClick={() => setStageFilter('ALL')}
              >
                All
              </button>
              {STAGES.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  className={stageFilter === stage ? 'active' : ''}
                  onClick={() => setStageFilter(stage)}
                >
                  {stage}
                </button>
              ))}
            </div>
            <div className="application-list">
              {applications.length ? (
                applications.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    className="application-row"
                    onClick={() => showDetail(app)}
                  >
                    <div>
                      <h3>{app.company}</h3>
                      <p>{app.role}</p>
                    </div>
                    <div className="application-meta">
                      <span>{app.stage}</span>
                      <span>Last touch {formatRelative(app.lastTouchAt)}</span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="empty">No applications yet.</p>
              )}
            </div>
          </section>
        )}

        {token && view === 'detail' && selectedApp && (
          <section className="panel detail-panel">
            <div className="panel-header">
              <div>
                <h2>{selectedApp.company}</h2>
                <p>{selectedApp.role}</p>
              </div>
              <div className="header-actions">
                <button type="button" className="ghost" onClick={() => setView('applications')}>
                  Back to list
                </button>
                <button
                  type="button"
                  className="ghost danger"
                  onClick={deleteApplication}
                  disabled={deleteBusy}
                >
                  {deleteBusy ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
            <div className="detail-grid">
              <div className="detail-card">
                <h3>Overview</h3>
                <dl>
                  <div>
                    <dt>Stage</dt>
                    <dd>{selectedApp.stage}</dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>{selectedApp.location || '—'}</dd>
                  </div>
                  <div>
                    <dt>Job URL</dt>
                    <dd>{selectedApp.jobUrl || '—'}</dd>
                  </div>
                  <div>
                    <dt>Last touch</dt>
                    <dd>{formatDateTime(selectedApp.lastTouchAt)}</dd>
                  </div>
                  <div>
                    <dt>Stage changed</dt>
                    <dd>{selectedApp.stageChangedAt ? formatDateTime(selectedApp.stageChangedAt) : '—'}</dd>
                  </div>
                </dl>
              </div>
              <form className="detail-card form-card" onSubmit={submitUpdate}>
                <h3>Edit fields + notes</h3>
                <div className="form-grid two-col">
                  <label className="field">
                    <span>Company</span>
                    <input
                      type="text"
                      value={editForm.company}
                      onChange={(event) => handleEditChange('company', event.target.value)}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Role</span>
                    <input
                      type="text"
                      value={editForm.role}
                      onChange={(event) => handleEditChange('role', event.target.value)}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Location</span>
                    <input
                      type="text"
                      value={editForm.location ?? ''}
                      onChange={(event) => handleEditChange('location', event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Job URL</span>
                    <input
                      type="url"
                      value={editForm.jobUrl ?? ''}
                      onChange={(event) => handleEditChange('jobUrl', event.target.value)}
                    />
                  </label>
                  <label className="field full">
                    <span>Notes</span>
                    <textarea
                      rows={5}
                      value={editForm.notes ?? ''}
                      onChange={(event) => handleEditChange('notes', event.target.value)}
                      placeholder="Add interview prep, contacts, or follow-ups."
                    />
                  </label>
                </div>
                <div className="form-actions">
                  <p className="muted">Updates application and refreshes last touch.</p>
                  <button type="submit" className="primary" disabled={updateBusy}>
                    {updateBusy ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
              <div className="detail-card history">
                <h3>History</h3>
                <ul>
                  <li>Created {formatDateTime(selectedApp.createdAt)}</li>
                  <li>Last updated {formatDateTime(selectedApp.updatedAt)}</li>
                  <li>Stage moved {formatRelative(selectedApp.stageChangedAt ?? selectedApp.createdAt)}</li>
                </ul>
                <p className="empty">Stage events will appear here once enabled.</p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  return (
    <div className="task-row">
      <div>
        <strong>{task.title}</strong>
        <span>{task.status}</span>
      </div>
      <span>{task.dueAt ? formatDateTime(task.dueAt) : 'No due date'}</span>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export default App;
