import { useEffect, useMemo, useState } from 'react';
import { taskService } from '../services/taskService';
import type { Task } from '../types';
import { useAppContext } from './AppLayout';

type TaskBucket = 'TODAY' | 'WEEK' | 'OVERDUE';

const bucketLabels: Record<TaskBucket, string> = {
  TODAY: 'Due today',
  WEEK: 'Due this week',
  OVERDUE: 'Overdue',
};

function TasksPage() {
  const { token, applications, formatDateTime, formatRelative } = useAppContext();
  const [tasks, setTasks] = useState<Record<TaskBucket, Task[]>>({
    TODAY: [],
    WEEK: [],
    OVERDUE: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const applicationLookup = useMemo(() => {
    const map = new Map<number, string>();
    applications.forEach((app) => {
      map.set(app.id, `${app.company} — ${app.role}`);
    });
    return map;
  }, [applications]);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [today, week, overdue] = await Promise.all([
          taskService.listDueToday(),
          taskService.listDueWeek(),
          taskService.listOverdue(),
        ]);
        setTasks({ TODAY: today, WEEK: week, OVERDUE: overdue });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load tasks';
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
          <h2>Tasks</h2>
          <p>Track due dates across your applications.</p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
      <div className="task-buckets">
        {(Object.keys(bucketLabels) as TaskBucket[]).map((bucket) => (
          <div key={bucket} className="task-bucket">
            <div className="task-bucket-header">
              <span>{bucketLabels[bucket]}</span>
              <span className="count">{tasks[bucket].length}</span>
            </div>
            {loading ? (
              <p className="empty">Loading…</p>
            ) : tasks[bucket].length ? (
              tasks[bucket].map((task) => (
                <div key={task.id} className="task-item">
                  <div className="task-main">
                    <div className="task-title-row">
                      <span className="task-title">{task.title}</span>
                      {task.dueAt && (
                        <span className="due-tag">
                          Due {formatDateTime(task.dueAt)} ({formatRelative(task.dueAt)})
                        </span>
                      )}
                    </div>
                    <div className="task-notes">
                      {applicationLookup.get(task.applicationId) ?? `Application #${task.applicationId}`}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty">No tasks here.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default TasksPage;
