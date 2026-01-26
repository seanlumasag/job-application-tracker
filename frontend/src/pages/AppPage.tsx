import { useAppContext } from './AppLayout';

function AppPage() {
  const {
    applications,
    summary,
    boardStages,
    visibleApplications,
    showDetail,
    goToApplications,
    formatRelative,
  } = useAppContext();

  return (
    <section className="board-shell">
      <div className="board-summary">
        <div className="summary-pill">
          <span>Total</span>
          <strong>{applications.length}</strong>
        </div>
        <div className="summary-pill">
          <span>Interviews</span>
          <strong>{summary?.stageCounts?.INTERVIEW ?? 0}</strong>
        </div>
        <div className="summary-pill">
          <span>Offers</span>
          <strong>{summary?.stageCounts?.OFFER ?? 0}</strong>
        </div>
        <div className="summary-pill warning">
          <span>Overdue tasks</span>
          <strong>{summary?.overdueTasks ?? 0}</strong>
        </div>
      </div>

      <div className="board-columns">
        {boardStages.map((column) => {
          const columnApps = visibleApplications.filter((app) => app.stage === column.stage);
          return (
            <div key={column.stage} className={`board-column tone-${column.tone}`}>
              <div className="board-column-header">
                <div className="column-title">
                  <span className="column-label">{column.label}</span>
                  <span className="column-count">{columnApps.length}</span>
                </div>
                <button type="button" className="column-add" onClick={goToApplications}>
                  +
                </button>
              </div>
              <div className="board-column-body">
                {columnApps.length ? (
                  columnApps.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      className="board-card"
                      onClick={() => showDetail(app)}
                    >
                      <div className="card-title">{app.role}</div>
                      <div className="card-sub">{app.company}</div>
                      <div className="card-tags">
                        {app.location && <span className="tag">{app.location}</span>}
                        {app.jobUrl && <span className="tag outline">Link</span>}
                      </div>
                      <div className="card-meta">Last touch {formatRelative(app.lastTouchAt)}</div>
                    </button>
                  ))
                ) : (
                  <button type="button" className="board-empty" onClick={goToApplications}>
                    Add Job
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default AppPage;
