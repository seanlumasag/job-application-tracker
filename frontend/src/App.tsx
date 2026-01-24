import { useEffect, useMemo, useState } from 'react';
import { apiClient } from './lib/apiClient';
import { applicationService, type ApplicationPayload } from './services/applicationService';
import { authService } from './services/authService';
import { dashboardService } from './services/dashboardService';
import { taskService, type TaskPayload } from './services/taskService';
import { auditService } from './services/auditService';
import type {
  Application,
  AuthResponse,
  DashboardActivityResponse,
  DashboardNextActionsResponse,
  DashboardSummaryResponse,
  Stage,
  StageEvent,
  Task,
  TaskStatus,
  AuditEvent,
} from './types';
import './App.css';

const STAGES: Stage[] = ['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'];
const STAGE_TRANSITIONS: Record<Stage, Stage[]> = {
  SAVED: ['APPLIED', 'WITHDRAWN'],
  APPLIED: ['INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'],
  INTERVIEW: ['OFFER', 'REJECTED', 'WITHDRAWN'],
  OFFER: ['REJECTED', 'WITHDRAWN'],
  REJECTED: [],
  WITHDRAWN: [],
};

type TaskFilter = 'ALL' | 'DUE_TODAY' | 'DUE_WEEK' | 'OVERDUE' | 'DONE';

const emptyApplicationPayload = (): ApplicationPayload => ({
  company: '',
  role: '',
  jobUrl: '',
  location: '',
  notes: '',
});

const emptyTaskPayload = (): TaskPayload => ({
  title: '',
  dueAt: '',
  notes: '',
  snoozeUntil: '',
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
  const [stageEvents, setStageEvents] = useState<StageEvent[]>([]);
  const [stageEventsLoading, setStageEventsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [updateBusy, setUpdateBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [transitionBusy, setTransitionBusy] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('ALL');
  const [taskForm, setTaskForm] = useState<TaskPayload>(() => emptyTaskPayload());
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [taskBusy, setTaskBusy] = useState(false);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [selectedAuditEvent, setSelectedAuditEvent] = useState<AuditEvent | null>(null);

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
      setTasks([]);
      setAuditEvents([]);
      setSelectedAuditEvent(null);
      setAuditLoading(false);
      setError('');
      return;
    }
    refreshDashboard();
    loadAuditEvents();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    refreshApplications(stageFilter);
  }, [token, stageFilter]);

  useEffect(() => {
    if (!selectedApp) {
      setEditForm(emptyApplicationPayload());
      setTasks([]);
      setTasksLoading(false);
      setTaskForm(emptyTaskPayload());
      setEditingTaskId(null);
      setStageEvents([]);
      return;
    }
    setEditForm({
      company: selectedApp.company,
      role: selectedApp.role,
      jobUrl: selectedApp.jobUrl ?? '',
      location: selectedApp.location ?? '',
      notes: selectedApp.notes ?? '',
    });
    void loadStageEvents(selectedApp.id);
    void loadTasks(selectedApp.id);
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
      setSelectedApp((prev) => {
        if (!prev) return null;
        const updated = apps.find((app) => app.id === prev.id);
        return updated ?? prev;
      });
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

  async function loadStageEvents(applicationId: number) {
    setStageEventsLoading(true);
    try {
      const events = await applicationService.listStageEvents(applicationId);
      setStageEvents(events);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load stage history';
      setError(message);
      setStageEvents([]);
    } finally {
      setStageEventsLoading(false);
    }
  }

  async function loadTasks(applicationId: number) {
    setTasksLoading(true);
    try {
      const taskList = await taskService.listForApplication(applicationId);
      setTasks(taskList);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(message);
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }

  async function loadAuditEvents() {
    setAuditLoading(true);
    try {
      const events = await auditService.list(0, 25);
      setAuditEvents(events);
      setSelectedAuditEvent((prev) => prev ?? events[0] ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load activity feed';
      setError(message);
      setAuditEvents([]);
      setSelectedAuditEvent(null);
    } finally {
      setAuditLoading(false);
    }
  }

  const handleCreateChange = (field: keyof ApplicationPayload, value: string) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditChange = (field: keyof ApplicationPayload, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const normalizeTaskPayload = (payload: TaskPayload): TaskPayload => ({
    title: payload.title.trim(),
    dueAt: payload.dueAt?.trim() ? payload.dueAt : null,
    snoozeUntil: payload.snoozeUntil?.trim() ? payload.snoozeUntil : null,
    notes: payload.notes?.trim() || null,
  });

  const handleTaskChange = (field: keyof TaskPayload, value: string) => {
    setTaskForm((prev) => ({ ...prev, [field]: value }));
  };

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      dueAt: toDateTimeLocal(task.dueAt),
      snoozeUntil: toDateTimeLocal(task.snoozeUntil),
      notes: task.notes ?? '',
    });
  };

  const resetTaskForm = () => {
    setEditingTaskId(null);
    setTaskForm(emptyTaskPayload());
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

  const submitTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedApp) return;
    if (!taskForm.title.trim()) {
      setError('Task title is required');
      return;
    }
    const payload = normalizeTaskPayload(taskForm);
    setTaskBusy(true);
    setError('');
    try {
      let saved: Task;
      if (editingTaskId) {
        saved = await taskService.update(editingTaskId, payload);
      } else {
        saved = await taskService.create(selectedApp.id, payload);
      }
      setTasks((prev) => sortTasks(prev.filter((task) => task.id !== saved.id).concat(saved)));
      resetTaskForm();
      await loadAuditEvents();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save task';
      setError(message);
    } finally {
      setTaskBusy(false);
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

  const handleStageTransition = async (nextStage: Stage) => {
    if (!selectedApp) return;
    if (selectedApp.stage === nextStage) {
      setError('Stage is already set to that value.');
      return;
    }
    const allowed = STAGE_TRANSITIONS[selectedApp.stage] ?? [];
    if (!allowed.includes(nextStage)) {
      setError(`Cannot move from ${selectedApp.stage} to ${nextStage}.`);
      return;
    }

    setTransitionBusy(true);
    setError('');
    try {
      const updated = await applicationService.transitionStage(selectedApp.id, nextStage);
      setSelectedApp(updated);
      setApplications((prev) => prev.map((app) => (app.id === updated.id ? updated : app)));
      await loadStageEvents(updated.id);
      await refreshApplications(stageFilter);
      await loadAuditEvents();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update stage';
      setError(message);
    } finally {
      setTransitionBusy(false);
    }
  };

  const toggleTaskStatus = async (task: Task, nextStatus: TaskStatus) => {
    const previous = tasks;
    const optimistic = tasks.map((item) =>
      item.id === task.id
        ? {
            ...item,
            status: nextStatus,
            completedAt: nextStatus === 'DONE' ? new Date().toISOString() : null,
          }
        : item,
    );
    setTasks(sortTasks(optimistic));
    try {
      const updated = await taskService.updateStatus(task.id, nextStatus);
      setTasks((prev) => sortTasks(prev.map((item) => (item.id === updated.id ? updated : item))));
      if (nextStatus === 'DONE') {
        await loadAuditEvents();
      }
    } catch (err) {
      setTasks(previous);
      const message = err instanceof Error ? err.message : 'Failed to update task status';
      setError(message);
    }
  };

  const activityMax = useMemo(() => {
    if (!activity) return 1;
    return Math.max(
      1,
      ...activity.items.map((item) => Math.max(item.stageTransitions, item.taskCompletions)),
    );
  }, [activity]);

  const applicationLookup = useMemo(() => {
    const map = new Map<number, string>();
    applications.forEach((app) => {
      map.set(app.id, `${app.company} — ${app.role}`);
    });
    return map;
  }, [applications]);

  const filteredTasks = useMemo(() => {
    const startOfToday = startOfDay(new Date());
    const startOfTomorrow = addDays(startOfToday, 1);
    const startOfWeek = startOfWeekMonday(new Date());
    const startOfNextWeek = addDays(startOfWeek, 7);

    return tasks.filter((task) => {
      const due = task.dueAt ? new Date(task.dueAt) : null;
      switch (taskFilter) {
        case 'DUE_TODAY':
          return (
            task.status === 'OPEN' &&
            !!due &&
            due >= startOfToday &&
            due < startOfTomorrow
          );
        case 'DUE_WEEK':
          return task.status === 'OPEN' && !!due && due >= startOfWeek && due < startOfNextWeek;
        case 'OVERDUE':
          return task.status === 'OPEN' && !!due && due < startOfToday;
        case 'DONE':
          return task.status === 'DONE';
        case 'ALL':
        default:
          return true;
      }
    });
  }, [taskFilter, tasks]);

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

            <div className="panel feed-panel">
              <div className="panel-header">
                <div>
                  <h2>Activity feed</h2>
                  <p>Latest stage transitions and task events.</p>
                </div>
                <button type="button" className="ghost" onClick={loadAuditEvents} disabled={auditLoading}>
                  {auditLoading ? 'Loading…' : 'Refresh'}
                </button>
              </div>
              <div className="feed-grid">
                <div className="feed-list">
                  {auditLoading ? (
                    <p className="empty">Loading activity…</p>
                  ) : auditEvents.length ? (
                    auditEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        className={`feed-row ${selectedAuditEvent?.id === event.id ? 'active' : ''}`}
                        onClick={() => setSelectedAuditEvent(event)}
                      >
                        <div className="feed-row-main">
                          <span className="feed-type">{event.type}</span>
                          <span className="feed-summary">{describeEvent(event, applicationLookup)}</span>
                        </div>
                        <span className="feed-time">{formatRelative(event.createdAt)}</span>
                      </button>
                    ))
                  ) : (
                    <p className="empty">No activity yet.</p>
                  )}
                </div>
                <div className="feed-detail">
                  {selectedAuditEvent ? (
                    <>
                      <div className="feed-detail-header">
                        <span className="feed-type">{selectedAuditEvent.type}</span>
                        <span className="feed-time">{formatDateTime(selectedAuditEvent.createdAt)}</span>
                      </div>
                      <p className="feed-summary">{describeEvent(selectedAuditEvent, applicationLookup)}</p>
                      <dl className="feed-meta">
                        <div>
                          <dt>Entity</dt>
                          <dd>
                            {selectedAuditEvent.entityType} #{selectedAuditEvent.entityId ?? '—'}
                          </dd>
                        </div>
                        <div>
                          <dt>Actor</dt>
                          <dd>{extractActor(selectedAuditEvent) || 'Unknown'}</dd>
                        </div>
                        <div>
                          <dt>Correlation</dt>
                          <dd>{selectedAuditEvent.correlationId || '—'}</dd>
                        </div>
                      </dl>
                      <div className="feed-note">
                        <h4>Note</h4>
                        <p>{extractNote(selectedAuditEvent) || 'No note provided.'}</p>
                      </div>
                    </>
                  ) : (
                    <p className="empty">Select an event to see details.</p>
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
              <div className="detail-card stage-card">
                <div className="stage-card-header">
                  <h3>Stage controls</h3>
                  <span className="stage-chip">{selectedApp.stage}</span>
                </div>
                <p className="muted">
                  Allowed transitions depend on the current stage. Updates last touch automatically.
                </p>
                <div className="stage-actions">
                  {STAGE_TRANSITIONS[selectedApp.stage].length === 0 ? (
                    <p className="empty">Terminal stage. No further transitions.</p>
                  ) : (
                    STAGE_TRANSITIONS[selectedApp.stage].map((stage) => (
                      <button
                        key={stage}
                        type="button"
                        className="ghost stage-button"
                        disabled={transitionBusy}
                        onClick={() => handleStageTransition(stage)}
                      >
                        Move to {stage}
                      </button>
                    ))
                  )}
                </div>
                <div className="last-touch">
                  <span className="muted">Last touch</span>
                  <strong>{formatDateTime(selectedApp.lastTouchAt)}</strong>
                </div>
              </div>
              <div className="detail-card tasks-card">
                <div className="panel-header">
                  <div>
                    <h3>Tasks</h3>
                    <p className="muted">Create and manage follow-ups for this application.</p>
                  </div>
                  <div className="task-filters">
                    {[
                      { key: 'ALL', label: 'All' },
                      { key: 'DUE_TODAY', label: 'Due today' },
                      { key: 'DUE_WEEK', label: 'Due this week' },
                      { key: 'OVERDUE', label: 'Overdue' },
                      { key: 'DONE', label: 'Done' },
                    ].map((filter) => (
                      <button
                        key={filter.key}
                        type="button"
                        className={taskFilter === filter.key ? 'ghost active' : 'ghost'}
                        onClick={() => setTaskFilter(filter.key as TaskFilter)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
                <form className="task-form" onSubmit={submitTask}>
                  <div className="form-grid two-col">
                    <label className="field">
                      <span>Title</span>
                      <input
                        type="text"
                        value={taskForm.title}
                        onChange={(event) => handleTaskChange('title', event.target.value)}
                        required
                        placeholder="Schedule recruiter screen"
                      />
                    </label>
                    <label className="field">
                      <span>Due at</span>
                      <input
                        type="datetime-local"
                        value={taskForm.dueAt ?? ''}
                        onChange={(event) => handleTaskChange('dueAt', event.target.value)}
                      />
                    </label>
                    <label className="field full">
                      <span>Notes</span>
                      <textarea
                        rows={3}
                        value={taskForm.notes ?? ''}
                        onChange={(event) => handleTaskChange('notes', event.target.value)}
                        placeholder="Add prep links or who to email."
                      />
                    </label>
                  </div>
                  <div className="form-actions">
                    <div className="muted">
                      {editingTaskId ? 'Editing existing task' : 'Creates an OPEN task'}
                    </div>
                    <div className="task-form-actions">
                      {editingTaskId && (
                        <button type="button" className="ghost" onClick={resetTaskForm} disabled={taskBusy}>
                          Cancel edit
                        </button>
                      )}
                      <button type="submit" className="primary" disabled={taskBusy}>
                        {taskBusy
                          ? 'Saving…'
                          : editingTaskId
                            ? 'Save task changes'
                            : 'Add task'}
                      </button>
                    </div>
                  </div>
                </form>
                <div className="task-list">
                  {tasksLoading ? (
                    <p className="empty">Loading tasks…</p>
                  ) : filteredTasks.length ? (
                    filteredTasks.map((task) => (
                      <div key={task.id} className={`task-item ${task.status === 'DONE' ? 'done' : ''}`}>
                        <label className="task-check">
                          <input
                            type="checkbox"
                            checked={task.status === 'DONE'}
                            onChange={() =>
                              toggleTaskStatus(task, task.status === 'DONE' ? 'OPEN' : 'DONE')
                            }
                          />
                          <span />
                        </label>
                        <div className="task-main">
                          <div className="task-title-row">
                            <span className="task-title">{task.title}</span>
                            {task.dueAt && (
                              <span className="due-tag">
                                Due {formatDateTime(task.dueAt)} ({formatRelative(task.dueAt)})
                              </span>
                            )}
                          </div>
                          {task.notes && <p className="task-notes">{task.notes}</p>}
                        </div>
                        <div className="task-actions">
                          <button type="button" className="ghost" onClick={() => startEditTask(task)}>
                            Edit
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty">No tasks for this application yet.</p>
                  )}
                </div>
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
                <h3>Stage history</h3>
                {stageEventsLoading ? (
                  <p className="empty">Loading history…</p>
                ) : stageEvents.length ? (
                  <ul className="timeline">
                    {stageEvents.map((event) => (
                      <li key={event.id} className="timeline-item">
                        <div className="timeline-stage">
                          <span>{event.fromStage}</span>
                          <span className="arrow">→</span>
                          <span>{event.toStage}</span>
                        </div>
                        <div className="timeline-meta">
                          <span>{formatDateTime(event.createdAt)}</span>
                          {event.actor && <span className="actor">{event.actor}</span>}
                        </div>
                        {event.note && <p className="timeline-note">{event.note}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty">No stage transitions recorded yet.</p>
                )}
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

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfWeekMonday(date: Date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function sortTasks(list: Task[]) {
  return [...list].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'OPEN' ? -1 : 1;
    }
    const aTime = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
    if (aTime !== bTime) return aTime - bTime;
    return a.id - b.id;
  });
}

function parsePayload(payload?: string | null): Record<string, unknown> | null {
  if (!payload) return null;
  try {
    const parsed = JSON.parse(payload);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function describeEvent(event: AuditEvent, applicationLookup: Map<number, string>) {
  const payload = parsePayload(event.payload);
  const payloadAppId = typeof payload?.applicationId === 'number' ? payload.applicationId : undefined;
  const applicationId =
    event.entityType === 'application'
      ? event.entityId ?? payloadAppId
      : payloadAppId ?? event.entityId;
  const appLabel =
    applicationId && applicationLookup.get(applicationId)
      ? applicationLookup.get(applicationId)
      : applicationId
        ? `Application #${applicationId}`
        : 'Unknown application';

  switch (event.type) {
    case 'application.stage_changed':
      return `${appLabel}: ${(payload?.fromStage as string | undefined) ?? 'Unknown'} → ${(payload?.toStage as string | undefined) ?? 'Unknown'}`;
    case 'task.created': {
      const title = typeof payload?.title === 'string' ? payload.title : '';
      return `${appLabel}: Task created${title ? ` — ${title}` : ''}`;
    }
    case 'task.completed': {
      const title = typeof payload?.title === 'string' ? payload.title : '';
      return `${appLabel}: Task completed${title ? ` — ${title}` : ''}`;
    }
    default:
      return `${event.type}${appLabel ? ` · ${appLabel}` : ''}`;
  }
}

function extractActor(event: AuditEvent) {
  const payload = parsePayload(event.payload);
  const actor = payload?.actor;
  return typeof actor === 'string' ? actor : null;
}

function extractNote(event: AuditEvent) {
  const payload = parsePayload(event.payload);
  const note = (payload?.note ?? payload?.notes) as unknown;
  if (typeof note === 'string') {
    const trimmed = note.trim();
    return trimmed || null;
  }
  return null;
}

export default App;
