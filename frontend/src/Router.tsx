import { useCallback, useEffect, useState } from 'react';
import App from './App';
import LandingPage from './LandingPage';

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

  if (isAppRoute) {
    return <App />;
  }

  return <LandingPage onNavigate={navigate} />;
}

export default Router;
