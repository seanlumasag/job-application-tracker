import { useEffect, useState } from 'react';
import { ApplicationRow, SkeletonStack, STAGES, useAppContext } from './AppLayout';

function ApplicationsPage() {
  const {
    applications,
    loading,
    stageFilter,
    setStageFilter,
    submitCreate,
    createForm,
    createFormError,
    createBusy,
    handleCreateChange,
    showDetail,
    openCreateFormOnNavigate,
    setOpenCreateFormOnNavigate,
  } = useAppContext();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!openCreateFormOnNavigate) return;
    setShowForm(true);
    setOpenCreateFormOnNavigate(false);
  }, [openCreateFormOnNavigate, setOpenCreateFormOnNavigate]);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Applications</h2>
          <p>Create new records, filter by stage, and drill into details.</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="primary"
            onClick={() => setShowForm((prev) => !prev)}
          >
            {showForm ? 'Close' : 'Add Application'}
          </button>
        </div>
      </div>
      {showForm && (
        <form className="app-form" onSubmit={submitCreate}>
          <div className="form-grid two-col">
            <label className="field">
              <span>Company</span>
              <input
                type="text"
                value={createForm.company}
                onChange={(event) => handleCreateChange('company', event.target.value)}
                placeholder="Acme Corp"
                required
              />
            </label>
            <label className="field">
              <span>Role</span>
              <input
                type="text"
                value={createForm.role}
                onChange={(event) => handleCreateChange('role', event.target.value)}
                placeholder="Product Operations Lead"
                required
              />
            </label>
            <label className="field">
              <span>Location</span>
              <input
                type="text"
                value={createForm.location ?? ''}
                onChange={(event) => handleCreateChange('location', event.target.value)}
                placeholder="Remote / NYC"
              />
            </label>
            <label className="field">
              <span>Job URL</span>
              <input
                type="url"
                value={createForm.jobUrl ?? ''}
                onChange={(event) => handleCreateChange('jobUrl', event.target.value)}
                placeholder="https://company.com/job"
              />
            </label>
            <label className="field full">
              <span>Notes</span>
              <textarea
                rows={3}
                value={createForm.notes ?? ''}
                onChange={(event) => handleCreateChange('notes', event.target.value)}
                placeholder="Relevant context, recruiter, referral details, etc."
              />
            </label>
          </div>
          <div className="form-actions">
            <p className="muted">Creates in stage SAVED and stamps last touch now.</p>
            {createFormError && <p className="form-error">{createFormError}</p>}
            <button type="submit" className="primary" disabled={createBusy}>
              {createBusy ? 'Adding…' : 'Add application'}
            </button>
          </div>
        </form>
      )}
      <div className="filter-row">
        <button
          type="button"
          className={stageFilter === 'ALL' ? 'active' : ''}
          onClick={() => setStageFilter('ALL')}
        >
          ALL
        </button>
        {STAGES.map((stage) => (
          <button
            key={stage}
            type="button"
            className={stageFilter === stage ? 'active' : ''}
            onClick={() => setStageFilter(stage)}
          >
            {stage === 'INTERVIEW' ? 'INTERVIEW' : stage}
          </button>
        ))}
      </div>
      <div className="application-list">
        {loading && !applications.length ? (
          <SkeletonStack count={5} tall />
        ) : applications.length ? (
          applications.map((app) => <ApplicationRow key={app.id} app={app} onSelect={showDetail} />)
        ) : (
          <p className="empty">No applications yet.</p>
        )}
      </div>
    </section>
  );
}

export default ApplicationsPage;
