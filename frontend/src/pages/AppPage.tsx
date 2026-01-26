import { useState } from 'react';
import { useAppContext } from './AppLayout';
import type { Stage } from '../types';

function AppPage() {
  const {
    applications,
    boardStages,
    visibleApplications,
    showDetail,
    goToApplications,
    formatRelative,
    moveApplicationStage,
  } = useAppContext();
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropStage, setDropStage] = useState<Stage | null>(null);
  const safeVisibleApplications = Array.isArray(visibleApplications) ? visibleApplications : [];

  return (
    <section className="board-shell">
      <div className="board-summary">
        <div className="summary-pill">
          <span>Total</span>
          <strong>{applications.length}</strong>
        </div>
      </div>

      <div
        className="board-columns"
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setDropStage(null);
          }
        }}
      >
        {boardStages.map((column) => {
          const columnApps = safeVisibleApplications.filter((app) => app.stage === column.stage);
          return (
            <div key={column.stage} className={`board-column tone-${column.tone}`}>
              <div className="board-column-header">
                <div className="column-title">
                  <span className="column-label">{column.label}</span>
                </div>
                <span className="column-count">{columnApps.length}</span>
              </div>
              <div
                className={`board-column-body${dropStage === column.stage ? ' is-drop-target' : ''}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (dropStage !== column.stage) {
                    setDropStage(column.stage);
                  }
                }}
                onDragEnter={(event) => {
                  event.preventDefault();
                  if (dropStage !== column.stage) {
                    setDropStage(column.stage);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const rawId = event.dataTransfer.getData('text/plain');
                  const appId = Number(rawId);
                  if (!Number.isNaN(appId)) {
                    moveApplicationStage(appId, column.stage);
                  }
                  setDropStage(null);
                }}
              >
                {columnApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    className={`board-card${draggingId === app.id ? ' is-dragging' : ''}`}
                    onClick={() => showDetail(app)}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', String(app.id));
                      event.dataTransfer.effectAllowed = 'move';
                      setDraggingId(app.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDropStage(null);
                    }}
                  >
                    <div className="card-title">{app.role}</div>
                    <div className="card-sub">{app.company}</div>
                    <div className="card-tags">
                      {app.location && <span className="tag">{app.location}</span>}
                      {app.jobUrl && <span className="tag outline">Link</span>}
                    </div>
                    <div className="card-meta">Last touch {formatRelative(app.lastTouchAt)}</div>
                  </button>
                ))}
                <button
                  type="button"
                  className="board-empty add-button"
                  onClick={goToApplications}
                  aria-label="Add job"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default AppPage;
