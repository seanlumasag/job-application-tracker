import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  memo,
  type ReactNode,
} from 'react';
import { useAuth } from '../lib/authContext';
import { applicationService, type ApplicationPayload } from '../services/applicationService';
import { authService } from '../services/authService';
import { dashboardService } from '../services/dashboardService';
import { taskService, type TaskPayload } from '../services/taskService';
import { auditService } from '../services/auditService';
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
} from '../types';
import './AppPage.css';

export const STAGES: Stage[] = ['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'];

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

type ViewKey = 'dashboard' | 'applications' | 'detail' | 'tasks' | 'metrics' | 'settings';
type AuthMode = 'login' | 'signup';

type AppLayoutProps = {
  routePath: string;
  onNavigate: (path: string) => void;
  children: ReactNode;
};

type AppContextValue = {
  token: string;
  view: ViewKey;
  applications: Application[];
  summary: DashboardSummaryResponse | null;
  nextActions: DashboardNextActionsResponse | null;
  activity: DashboardActivityResponse | null;
  activityWindow: 7 | 30;
  nextActionsWindow: 7 | 30;
  stageFilter: Stage | 'ALL';
  loading: boolean;
  error: string;
  boardQuery: string;
  boardStages: Array<{ stage: Stage; label: string; tone: string }>;
  visibleApplications: Application[];
  selectedApp: Application | null;
  createForm: ApplicationPayload;
  editForm: ApplicationPayload;
  stageEvents: StageEvent[];
  stageEventsLoading: boolean;
  createBusy: boolean;
  updateBusy: boolean;
  deleteBusy: boolean;
  transitionBusy: boolean;
  tasks: Task[];
  tasksLoading: boolean;
  taskFilter: TaskFilter;
  filteredTasks: Task[];
  taskForm: TaskPayload;
  editingTaskId: number | null;
  taskBusy: boolean;
  createFormError: string;
  editFormError: string;
  taskFormError: string;
  auditEvents: AuditEvent[];
  auditLoading: boolean;
  selectedAuditEvent: AuditEvent | null;
  staleApplications: Application[];
  staleDays: number;
  staleLoading: boolean;
  setBoardQuery: (value: string) => void;
  setStageFilter: (value: Stage | 'ALL') => void;
  setActivityWindow: (value: 7 | 30) => void;
  setNextActionsWindow: (value: 7 | 30) => void;
  setStaleDays: (value: number) => void;
  setTaskFilter: (value: TaskFilter) => void;
  setSelectedAuditEvent: (value: AuditEvent | null) => void;
  handleCreateChange: (field: keyof ApplicationPayload, value: string) => void;
  handleEditChange: (field: keyof ApplicationPayload, value: string) => void;
  handleTaskChange: (field: keyof TaskPayload, value: string) => void;
  submitCreate: (event: React.FormEvent) => Promise<void>;
  submitUpdate: (event: React.FormEvent) => Promise<void>;
  submitTask: (event: React.FormEvent) => Promise<void>;
  refreshApplications: (targetStage?: Stage | 'ALL', silent?: boolean) => Promise<void>;
  refreshDashboard: () => Promise<void>;
  loadAuditEvents: () => Promise<void>;
  resetTaskForm: () => void;
  startEditTask: (task: Task) => void;
  toggleTaskStatus: (task: Task, nextStatus: TaskStatus) => Promise<void>;
  deleteApplication: () => Promise<void>;
  handleStageTransition: (nextStage: Stage) => Promise<void>;
  moveApplicationStage: (appId: number, nextStage: Stage) => Promise<void>;
  showDetail: (app: Application) => void;
  goToDashboard: () => void;
  goToApplications: () => void;
  goToApplicationsWithCreate: () => void;
  openCreateFormOnNavigate: boolean;
  setOpenCreateFormOnNavigate: (value: boolean) => void;
  goToDetail: (appId: number) => void;
  goToTasks: () => void;
  goToMetrics: () => void;
  goToSettings: () => void;
  formatDate: (value: string) => string;
  formatDateTime: (value: string) => string;
  formatRelative: (value: string) => string;
};

const AppContext = createContext<AppContextValue | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppLayout');
  }
  return context;
};

function AppLayout({ routePath, onNavigate, children }: AppLayoutProps) {
  const { token, setToken } = useAuth();
  const [stageFilter, setStageFilter] = useState<Stage | 'ALL'>('ALL');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [nextActions, setNextActions] = useState<DashboardNextActionsResponse | null>(null);
  const [activity, setActivity] = useState<DashboardActivityResponse | null>(null);
  const [activityWindow, setActivityWindow] = useState<7 | 30>(7);
  const [nextActionsWindow, setNextActionsWindow] = useState<7 | 30>(7);
  const [applications, setApplications] = useState<Application[]>([]);
  const [createForm, setCreateForm] = useState<ApplicationPayload>(() => emptyApplicationPayload());
  const [editForm, setEditForm] = useState<ApplicationPayload>(() => emptyApplicationPayload());
  const [stageEvents, setStageEvents] = useState<StageEvent[]>([]);
  const [stageEventsLoading, setStageEventsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [password, setPassword] = useState('');
  const [openCreateFormOnNavigate, setOpenCreateFormOnNavigate] = useState(false);
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
  const [createFormError, setCreateFormError] = useState('');
  const [editFormError, setEditFormError] = useState('');
  const [taskFormError, setTaskFormError] = useState('');
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [selectedAuditEvent, setSelectedAuditEvent] = useState<AuditEvent | null>(null);
  const [staleApplications, setStaleApplications] = useState<Application[]>([]);
  const [staleDays, setStaleDays] = useState<number>(14);
  const [staleLoading, setStaleLoading] = useState(false);
  const [boardQuery, setBoardQuery] = useState('');
  const view: ViewKey = useMemo(() => {
    if (routePath.startsWith('/app/applications/')) return 'detail';
    if (routePath === '/app/applications') return 'applications';
    if (routePath === '/app/tasks') return 'tasks';
    if (routePath === '/app/metrics') return 'metrics';
    if (routePath === '/app/settings') return 'settings';
    return 'dashboard';
  }, [routePath]);
  const routeAppId = useMemo(() => {
    const match = routePath.match(/^\/app\/applications\/(\d+)/);
    return match ? Number(match[1]) : null;
  }, [routePath]);

  const goToDashboard = () => onNavigate('/app');
  const goToApplications = () => onNavigate('/app/applications');
  const goToApplicationsWithCreate = () => {
    setOpenCreateFormOnNavigate(true);
    onNavigate('/app/applications');
  };
  const goToDetail = (appId: number) => onNavigate(`/app/applications/${appId}`);
  const goToTasks = () => onNavigate('/app/tasks');
  const goToMetrics = () => onNavigate('/app/metrics');
  const goToSettings = () => onNavigate('/app/settings');

  useEffect(() => {
    if (!token) {
      setSummary(null);
      setNextActions(null);
      setActivity(null);
      setStaleApplications([]);
      setApplications([]);
      setTasks([]);
      setAuditEvents([]);
      setSelectedAuditEvent(null);
      setAuditLoading(false);
      setError('');
      setProfileEmail('');
      return;
    }
    refreshDashboard();
    loadAuditEvents();
    loadStaleApplications(staleDays);
    void (async () => {
      try {
        const me = await authService.me();
        setProfileEmail(me.email);
      } catch {
        setProfileEmail('');
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    refreshDashboard();
  }, [token, nextActionsWindow, activityWindow]);

  useEffect(() => {
    if (!token) return;
    loadStaleApplications(staleDays);
  }, [token, staleDays]);

  useEffect(() => {
    if (!token) return;
    refreshApplications(stageFilter);
  }, [token, stageFilter]);

  useEffect(() => {
    if (!token) return;
    if (routeAppId && stageFilter !== 'ALL') {
      setStageFilter('ALL');
    }
  }, [routeAppId, stageFilter, token]);

  useEffect(() => {
    if (!token) return;
    if (!routeAppId) {
      setSelectedApp(null);
      return;
    }
    const appList = Array.isArray(applications) ? applications : [];
    const match = appList.find((app) => app.id === routeAppId);
    if (match) {
      if (!selectedApp || selectedApp.id !== routeAppId) {
        setSelectedApp(match);
      }
      return;
    }
    if (selectedApp?.id !== routeAppId) {
      setSelectedApp(null);
    }
  }, [applications, routeAppId, token, selectedApp?.id]);

  useEffect(() => {
    if (!selectedApp || !selectedApp.id) {
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
        dashboardService.nextActions(nextActionsWindow),
        dashboardService.activity(activityWindow),
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
      goToDashboard();
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
    setStageFilter('ALL');
    onNavigate('/signin');
  };

  const refreshApplications = async (
    targetStage: Stage | 'ALL' = stageFilter,
    silent = false,
  ) => {
    setLoading(true);
    try {
      const apps = await applicationService.list(targetStage === 'ALL' ? undefined : targetStage);
      const nextApps = Array.isArray(apps) ? apps : [];
      setApplications(nextApps);
      if (!silent) setError('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load applications';
      if (!silent) setError(message);
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

  const validateApplicationPayload = (payload: ApplicationPayload) => {
    if (payload.company.trim().length < 2) return 'Company name must be at least 2 characters.';
    if (payload.role.trim().length < 2) return 'Role must be at least 2 characters.';
    if (payload.jobUrl && !/^https?:\/\//i.test(payload.jobUrl.trim())) {
      return 'Job URL must start with http:// or https://';
    }
    return '';
  };

  async function loadStageEvents(applicationId: number, silent = false) {
    setStageEventsLoading(true);
    try {
      const events = await applicationService.listStageEvents(applicationId);
      setStageEvents(events);
      if (!silent) setError('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load stage history';
      if (!silent) setError(message);
      setStageEvents([]);
    } finally {
      setStageEventsLoading(false);
    }
  }

  async function loadTasks(applicationId: number, silent = false) {
    setTasksLoading(true);
    try {
      const taskList = await taskService.listForApplication(applicationId);
      setTasks(taskList);
      if (!silent) setError('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tasks';
      if (!silent) setError(message);
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }

  async function loadAuditEvents(silent = false) {
    setAuditLoading(true);
    try {
      const events = await auditService.list(0, 25);
      setAuditEvents(events);
      setSelectedAuditEvent((prev) => prev ?? events[0] ?? null);
      if (!silent) setError('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load activity feed';
      if (!silent) setError(message);
      setAuditEvents([]);
      setSelectedAuditEvent(null);
    } finally {
      setAuditLoading(false);
    }
  }

  async function loadStaleApplications(days: number, silent = false) {
    setStaleLoading(true);
    try {
      const apps = await applicationService.listStale(days);
      setStaleApplications(apps);
      if (!silent) setError('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load stale applications';
      if (!silent) setError(message);
      setStaleApplications([]);
    } finally {
      setStaleLoading(false);
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

  const validateTaskPayload = (payload: TaskPayload) => {
    if (payload.title.trim().length < 3) return 'Task title must be at least 3 characters.';
    return '';
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
    const validationMessage = validateApplicationPayload(createForm);
    if (validationMessage) {
      setCreateFormError(validationMessage);
      setError(validationMessage);
      return;
    }
    setCreateFormError('');

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
      goToDetail(created.id);
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
    const validationMessage = validateApplicationPayload(editForm);
    if (validationMessage) {
      setEditFormError(validationMessage);
      setError(validationMessage);
      return;
    }
    setEditFormError('');

    setUpdateBusy(true);
    setError('');
    try {
      const payload = normalizePayload(editForm);
      const updated = await applicationService.update(selectedApp.id, payload);
      setSelectedApp(updated);
      setApplications((prev) => prev.map((app) => (app.id === updated.id ? updated : app)));
      await refreshApplications(stageFilter);
      await loadStaleApplications(staleDays);
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
    const validationMessage = validateTaskPayload(taskForm);
    if (validationMessage) {
      setTaskFormError(validationMessage);
      setError(validationMessage);
      return;
    }
    setTaskFormError('');
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
      goToApplications();
      await refreshApplications(stageFilter);
      await loadStaleApplications(staleDays);
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

    const appId = selectedApp.id;
    const previousApp = selectedApp;
    const previousApps = applications;
    const optimisticTimestamp = new Date().toISOString();
    const optimisticApp = {
      ...selectedApp,
      stage: nextStage,
      stageChangedAt: optimisticTimestamp,
      lastTouchAt: optimisticTimestamp,
      updatedAt: optimisticTimestamp,
    };

    setTransitionBusy(true);
    setError('');
    try {
      setSelectedApp(optimisticApp);
      setApplications((prev) =>
        prev.map((app) => (app.id === optimisticApp.id ? optimisticApp : app)),
      );
      const updated = await applicationService.transitionStage(appId, nextStage);
      setSelectedApp(updated);
      setApplications((prev) => prev.map((app) => (app.id === updated.id ? updated : app)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update stage';
      const isNetworkError = message.toLowerCase().includes('network');
      if (!isNetworkError) {
        setSelectedApp(previousApp);
        setApplications(previousApps);
      }
      setError(message);
      setTransitionBusy(false);
      void refreshApplications(stageFilter, true);
      return;
    }
    setTransitionBusy(false);
    void loadStageEvents(appId, true);
    void refreshApplications(stageFilter, true);
    void loadAuditEvents(true);
    void loadStaleApplications(staleDays, true);
  };

  const moveApplicationStage = async (appId: number, nextStage: Stage) => {
    const current = applications.find((app) => app.id === appId);
    if (!current) {
      setError('Application not found.');
      return;
    }
    if (current.stage === nextStage) {
      return;
    }

    const previousApps = applications;
    const optimisticApp = { ...current, stage: nextStage, stageChangedAt: new Date().toISOString() };
    setTransitionBusy(true);
    setError('');
    setApplications((prev) => prev.map((app) => (app.id === appId ? optimisticApp : app)));
    if (selectedApp?.id === appId) {
      setSelectedApp(optimisticApp);
    }
    try {
      const updated = await applicationService.transitionStage(appId, nextStage);
      setApplications((prev) => prev.map((app) => (app.id === updated.id ? updated : app)));
      if (selectedApp?.id === updated.id) {
        setSelectedApp(updated);
        await loadStageEvents(updated.id, true);
      }
      await loadAuditEvents(true);
      await loadStaleApplications(staleDays, true);
    } catch (err) {
      setApplications(previousApps);
      if (selectedApp?.id === appId) {
        setSelectedApp(current);
      }
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

  const filteredTasks = useMemo(() => {
    const startOfToday = startOfDay(new Date());
    const startOfTomorrow = addDays(startOfToday, 1);
    const startOfWeek = startOfWeekMonday(new Date());
    const startOfNextWeek = addDays(startOfWeek, 7);

    const safeTasks = Array.isArray(tasks) ? tasks : [];
    return safeTasks.filter((task) => {
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
    goToDetail(app.id);
  };

  const boardStages: Array<{ stage: Stage; label: string; tone: string }> = [
    { stage: 'SAVED', label: 'Saved', tone: 'sky' },
    { stage: 'APPLIED', label: 'Applied', tone: 'violet' },
    { stage: 'INTERVIEW', label: 'Interview', tone: 'green' },
    { stage: 'OFFER', label: 'Offer', tone: 'gold' },
    { stage: 'REJECTED', label: 'Rejected', tone: 'red' },
    { stage: 'WITHDRAWN', label: 'Withdrawn', tone: 'slate' },
  ];

  const visibleApplications = useMemo(() => {
    const query = boardQuery.trim().toLowerCase();
    if (!query) return applications;
    return applications.filter((app) => (
      [app.company, app.role, app.location].some((value) => value?.toLowerCase().includes(query))
    ));
  }, [applications, boardQuery]);

  const contextValue: AppContextValue = {
    token,
    view,
    applications,
    summary,
    nextActions,
    activity,
    activityWindow,
    nextActionsWindow,
    stageFilter,
    loading,
    error,
    boardQuery,
    boardStages,
    visibleApplications,
    selectedApp,
    createForm,
    editForm,
    stageEvents,
    stageEventsLoading,
    createBusy,
    updateBusy,
    deleteBusy,
    transitionBusy,
    tasks,
    tasksLoading,
    taskFilter,
    filteredTasks,
    taskForm,
    editingTaskId,
    taskBusy,
    createFormError,
    editFormError,
    taskFormError,
    auditEvents,
    auditLoading,
    selectedAuditEvent,
    staleApplications,
    staleDays,
    staleLoading,
    openCreateFormOnNavigate,
    setOpenCreateFormOnNavigate,
    setBoardQuery,
    setStageFilter,
    setActivityWindow,
    setNextActionsWindow,
    setStaleDays,
    setTaskFilter,
    setSelectedAuditEvent,
    handleCreateChange,
    handleEditChange,
    handleTaskChange,
    submitCreate,
    submitUpdate,
    submitTask,
    refreshApplications,
    refreshDashboard,
    loadAuditEvents,
    resetTaskForm,
    startEditTask,
    toggleTaskStatus,
    deleteApplication,
    handleStageTransition,
    moveApplicationStage,
    showDetail,
    goToDashboard,
    goToApplications,
    goToApplicationsWithCreate,
    goToDetail,
    goToTasks,
    goToMetrics,
    goToSettings,
    formatDate,
    formatDateTime,
    formatRelative,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="app-shell app-kanban">
        <aside className="app-sidebar">
          <button
            type="button"
            className="sidebar-brand"
            onClick={() => onNavigate('/')}
            aria-label="Go to landing page"
          >
            <div className="app-mark">JT</div>
            <div>
              <div className="sidebar-title">JobTrack</div>
              {token && (profileEmail || email) ? (
                <div className="sidebar-sub">{profileEmail || email}</div>
              ) : null}
            </div>
          </button>
          <nav className="sidebar-nav">
            <button
              type="button"
              className={view === 'dashboard' ? 'active' : ''}
              disabled={!token}
              onClick={goToDashboard}
            >
              <span className="nav-dot" />
              Board
            </button>
            <button
              type="button"
              className={view === 'applications' ? 'active' : ''}
              disabled={!token}
              onClick={goToApplications}
            >
              <span className="nav-dot" />
              Applications
            </button>
          </nav>
          <div className="sidebar-footer">
            {token ? (
              <>
                <button type="button" className="ghost" onClick={goToSettings}>
                  Account settings
                </button>
                <button type="button" className="text-button" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <span className="status-chip warn">Sign in required</span>
            )}
          </div>
        </aside>

        <div className="app-body">
          <header className="board-topbar">
            <div>
              <div className="board-title">Your Job Application Tracker</div>
              <div className="board-subtitle">
              {view === 'applications'
                ? 'Applications'
                : view === 'detail'
                  ? 'Application Detail'
                  : view === 'tasks'
                    ? 'Tasks'
                    : view === 'metrics'
                      ? 'Metrics'
                      : view === 'settings'
                        ? 'Settings'
                        : 'Board'}
              </div>
            </div>
            {view === 'dashboard' && (
              <div className="board-actions">
                <button
                  type="button"
                  className="filled add-button"
                  onClick={goToApplicationsWithCreate}
                  aria-label="Add job"
                >
                  Add Application
                </button>
              </div>
            )}
          </header>

          {error && <div className="app-alert error">{error}</div>}
          {loading && token && <div className="app-alert">Syncing latest data…</div>}

          <main className="app-main">
            {!token && (
              <section className="panel auth-panel">
                <div className="panel-header">
                  <div>
                    <h2>Sign in to access your dashboard</h2>
                    <p>Use your JobTrack account to sync applications and tasks.</p>
                  </div>
                </div>
                <div className="auth-actions">
                  <button type="button" className="filled" onClick={() => onNavigate('/signin')}>
                    Sign in
                  </button>
                  <button type="button" className="ghost" onClick={() => onNavigate('/signup')}>
                    Create account
                  </button>
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
                  <button type="submit" className="filled" disabled={authBusy}>
                    {authBusy ? 'Working…' : authMode === 'signup' ? 'Create account' : 'Log in'}
                  </button>
                </form>
              </section>
            )}

            {token && children}
          </main>
        </div>
      </div>
    </AppContext.Provider>
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

export const ApplicationRow = memo(function ApplicationRow({
  app,
  onSelect,
}: {
  app: Application;
  onSelect: (app: Application) => void;
}) {
  return (
    <button type="button" className="application-row" onClick={() => onSelect(app)}>
      <div>
        <h3>{app.company}</h3>
        <p>{app.role}</p>
      </div>
      <div className="application-meta">
        <span className={`stage-pill stage-${app.stage.toLowerCase()}`}>{app.stage}</span>
      </div>
    </button>
  );
});

export function SkeletonLine({ width = '100%', height = 12 }: { width?: string; height?: number }) {
  return <div className="skeleton" style={{ width, height }} />;
}

export function SkeletonStack({ count = 3, tall }: { count?: number; tall?: boolean }) {
  return (
    <div className="skeleton-stack">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className={tall ? 'skeleton-card' : undefined}>
          <SkeletonLine width="70%" height={tall ? 16 : 12} />
          {tall && <SkeletonLine width="40%" height={12} />}
        </div>
      ))}
    </div>
  );
}


export default AppLayout;
