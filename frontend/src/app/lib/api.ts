const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export type AuthTokens = {
  token: string;
  refreshToken: string;
};

const TOKEN_KEY = "jobtrack.token";
const REFRESH_KEY = "jobtrack.refreshToken";

export function getAuthTokens(): AuthTokens | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!token || !refreshToken) {
    return null;
  }
  return { token, refreshToken };
}

export function setAuthTokens(tokens: AuthTokens) {
  localStorage.setItem(TOKEN_KEY, tokens.token);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function clearAuthTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function refreshSession(refreshToken: string): Promise<AuthTokens | null> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (!data?.token || !data?.refreshToken) {
    return null;
  }

  const tokens = { token: data.token, refreshToken: data.refreshToken };
  setAuthTokens(tokens);
  return tokens;
}

async function request<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, ...init } = options;
  const headers = new Headers(init.headers);

  if (!skipAuth) {
    const tokens = getAuthTokens();
    if (tokens?.token) {
      headers.set("Authorization", `Bearer ${tokens.token}`);
    }
  }

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && !skipAuth) {
    const tokens = getAuthTokens();
    if (tokens?.refreshToken) {
      const refreshed = await refreshSession(tokens.refreshToken);
      if (refreshed) {
        return request<T>(path, options);
      }
    }
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; refreshToken: string; email: string; userId: string }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
          skipAuth: true,
        }
      ),
    signup: (email: string, password: string) =>
      request<{ token: string; refreshToken: string; email: string; userId: string }>(
        "/auth/signup",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
          skipAuth: true,
        }
      ),
    logout: (refreshToken: string) =>
      request<void>("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }),
  },
  me: () => request<{ userId: string; email: string }>("/me"),
  deleteAccount: (password: string) =>
    request<void>("/me", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    }),
  applications: {
    list: () => request<Array<ApplicationResponse>>("/applications"),
    create: (payload: ApplicationCreateRequest) =>
      request<ApplicationResponse>("/applications", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: number, payload: ApplicationUpdateRequest) =>
      request<ApplicationResponse>(`/applications/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    updateStage: (id: number, stage: string) =>
      request<ApplicationResponse>(`/applications/${id}/stage`, {
        method: "PATCH",
        body: JSON.stringify({ stage }),
      }),
    delete: (id: number) =>
      request<void>(`/applications/${id}`, {
        method: "DELETE",
      }),
  },
  tasks: {
    listForApplication: (applicationId: number) =>
      request<Array<TaskResponse>>(`/applications/${applicationId}/tasks`),
    create: (applicationId: number, payload: TaskCreateRequest) =>
      request<TaskResponse>(`/applications/${applicationId}/tasks`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    updateStatus: (id: number, status: TaskStatus) =>
      request<TaskResponse>(`/tasks/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    delete: (id: number) =>
      request<void>(`/tasks/${id}`, {
        method: "DELETE",
      }),
  },
  dashboard: {
    summary: () =>
      request<{ stageCounts: Record<string, number>; overdueTasks: number }>(
        "/dashboard/summary"
      ),
  },
};

export type ApplicationResponse = {
  id: number;
  company: string;
  role: string;
  jobUrl?: string | null;
  location?: string | null;
  notes?: string | null;
  stage: string;
  lastTouchAt?: string | null;
  stageChangedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationCreateRequest = {
  company: string;
  role: string;
  jobUrl?: string;
  location?: string;
  notes?: string;
};

export type ApplicationUpdateRequest = {
  company?: string;
  role?: string;
  jobUrl?: string | null;
  location?: string | null;
  notes?: string | null;
  stage?: string;
};

export type TaskStatus = "OPEN" | "DONE";

export type TaskResponse = {
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
};

export type TaskCreateRequest = {
  title: string;
  dueAt?: string | null;
  snoozeUntil?: string | null;
  notes?: string | null;
};
