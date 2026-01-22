export type Stage = 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';

export interface Application {
  id: number;
  company: string;
  role: string;
  jobUrl?: string | null;
  location?: string | null;
  notes?: string | null;
  stage: Stage;
  lastTouchAt: string;
  stageChangedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'OPEN' | 'DONE';

export interface Task {
  id: number;
  applicationId: number;
  title: string;
  status: TaskStatus;
  dueAt?: string | null;
  snoozeUntil?: string | null;
  notes?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummaryResponse {
  stageCounts: Record<Stage, number>;
  overdueTasks: number;
}

export interface DashboardNextActionsResponse {
  dueSoonTasks: Task[];
  staleApplications: Application[];
}

export interface DashboardActivityPoint {
  date: string;
  stageTransitions: number;
  taskCompletions: number;
}

export interface DashboardActivityResponse {
  days: number;
  items: DashboardActivityPoint[];
}

export interface User {
  id: string;
  email: string;
}
