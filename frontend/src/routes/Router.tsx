import { useCallback, useEffect, useState } from 'react';
import { AuthProvider } from '../lib/authContext';
import AppLayout from '../pages/AppLayout';
import AppPage from '../pages/AppPage';
import ApplicationsPage from '../pages/ApplicationsPage';
import ApplicationDetailPage from '../pages/ApplicationDetailPage';
import TasksPage from '../pages/TasksPage';
import MetricsPage from '../pages/MetricsPage';
import SettingsPage from '../pages/SettingsPage';
import LandingPage from '../pages/LandingPage';
import AuthPage from '../pages/AuthPage';

const normalizePath = (path: string) => {
  if (!path) return '/';
  const trimmed = path.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
};

function Router() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const handlePop = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const navigate = useCallback(
    (to: string) => {
      const next = normalizePath(to);
      if (next === path) return;
      window.history.pushState({}, '', next);
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      setPath(next);
    },
    [path],
  );

  const isAppRoute = path === '/app' || path.startsWith('/app/');
  const isSignIn = path === '/signin';
  const isSignUp = path === '/signup';

  const appChild =
    path === '/app'
      ? <AppPage />
      : path === '/app/applications'
        ? <ApplicationsPage />
        : path === '/app/tasks'
          ? <TasksPage />
          : path === '/app/metrics'
            ? <MetricsPage />
            : path === '/app/settings'
              ? <SettingsPage />
              : <ApplicationDetailPage />;

  return (
    <AuthProvider>
      {isAppRoute ? (
        <AppLayout routePath={path} onNavigate={navigate}>
          {appChild}
        </AppLayout>
      ) : isSignIn ? (
        <AuthPage mode="signin" onNavigate={navigate} />
      ) : isSignUp ? (
        <AuthPage mode="signup" onNavigate={navigate} />
      ) : (
        <LandingPage onNavigate={navigate} />
      )}
    </AuthProvider>
  );
}

export default Router;
