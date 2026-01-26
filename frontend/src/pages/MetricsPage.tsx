import { useEffect, useState } from 'react';
import { metricsService } from '../services/metricsService';
import type { MetricsResponse } from '../types';
import { useAppContext } from './AppLayout';

function MetricsPage() {
  const { token } = useAppContext();
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await metricsService.get();
        setMetrics(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load metrics';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [token]);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Metrics</h2>
          <p>System-level counts across the workspace.</p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading && <p className="empty">Loading metrics…</p>}
      {!loading && metrics && (
        <div className="metrics-grid">
          <div className="metric-card">
            <span>Users</span>
            <strong>{metrics.users}</strong>
          </div>
          <div className="metric-card">
            <span>Applications</span>
            <strong>{metrics.applications}</strong>
          </div>
          <div className="metric-card">
            <span>Tasks</span>
            <strong>{metrics.tasks}</strong>
          </div>
          <div className="metric-card">
            <span>Stage events</span>
            <strong>{metrics.stageEvents}</strong>
          </div>
          <div className="metric-card">
            <span>Audit events</span>
            <strong>{metrics.auditEvents}</strong>
          </div>
        </div>
      )}
    </section>
  );
}

export default MetricsPage;
