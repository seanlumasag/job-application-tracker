import { STAGES, useAppContext } from './AppLayout';

function ApplicationDetailPage() {
  const {
    selectedApp,
    deleteApplication,
    deleteBusy,
    goToApplications,
    transitionBusy,
    handleStageTransition,
    taskFilter,
    setTaskFilter,
    submitTask,
    taskForm,
    handleTaskChange,
    editingTaskId,
    resetTaskForm,
    taskBusy,
    taskFormError,
    tasksLoading,
    filteredTasks,
    toggleTaskStatus,
    startEditTask,
    submitUpdate,
    editForm,
    handleEditChange,
    editFormError,
    updateBusy,
    stageEventsLoading,
    stageEvents,
    formatDateTime,
    formatRelative,
    loading,
  } = useAppContext();
  if (!selectedApp) {
    return (
      <section className="panel detail-panel">
        <p className="empty">{loading ? 'Loading application…' : 'Application not found.'}</p>
      </section>
    );
  }

  return (
    <section className="panel detail-panel">
      <div className="panel-header">
        <div>
          <h2>{selectedApp.company}</h2>
          <p>{selectedApp.role}</p>
        </div>
        <div className="header-actions">
          <button type="button" className="ghost" onClick={goToApplications}>
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
          <p className="muted stage-helper">Choose the next stage for this application.</p>
          <div className="stage-actions">
            {STAGES.map((stage) => {
              const isCurrent = stage === selectedApp.stage;
              return (
                <button
                  key={stage}
                  type="button"
                  className={`ghost stage-button${isCurrent ? ' is-current' : ''}${
                    stage === 'REJECTED' || stage === 'WITHDRAWN' ? ' danger' : ''
                  }`}
                  disabled={transitionBusy || isCurrent}
                  onClick={() => handleStageTransition(stage)}
                >
                  {stage === 'INTERVIEW' ? 'INTERVIEW' : stage}
                </button>
              );
            })}
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
                  onClick={() => setTaskFilter(filter.key as typeof taskFilter)}
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
              {taskFormError && <p className="form-error">{taskFormError}</p>}
              <div className="task-form-actions">
                {editingTaskId && (
                  <button type="button" className="ghost" onClick={resetTaskForm} disabled={taskBusy}>
                    Cancel edit
                  </button>
                )}
                <button type="submit" className="primary" disabled={taskBusy}>
                  {taskBusy ? 'Saving…' : editingTaskId ? 'Save task changes' : 'Add task'}
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
            {editFormError && <p className="form-error">{editFormError}</p>}
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
  );
}

export default ApplicationDetailPage;
