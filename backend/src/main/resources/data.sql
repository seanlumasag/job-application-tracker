INSERT INTO users (id, email, password_hash, created_at, updated_at)
VALUES
    (1, 'demo@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5T0C5Ul9kY01/1i/8uRIXV4Yg8Zb9oS', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO applications (id, company, role, job_url, location, notes, stage, last_touch_at, stage_changed_at, user_id, created_at, updated_at)
VALUES
    (1, 'Acme', 'Backend Engineer', 'https://example.com/jobs/1', 'Remote', 'Referred by Sam', 'SAVED', now(), now(), 1, now(), now()),
    (2, 'Beta Corp', 'Full Stack Developer', 'https://example.com/jobs/2', 'New York, NY', 'Applied via LinkedIn', 'APPLIED', now(), now(), 1, now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, application_id, title, status, due_at, snooze_until, notes, completed_at, created_at, updated_at)
VALUES
    (1, 1, 'Follow up with recruiter', 'OPEN', now() + interval '2 days', null, 'Send a short follow-up email', null, now(), now()),
    (2, 2, 'Prep for phone screen', 'OPEN', now() + interval '4 days', null, 'Review role requirements', null, now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO stage_events (id, application_id, from_stage, to_stage, note, actor, created_at)
VALUES
    (1, 2, 'SAVED', 'APPLIED', 'Submitted application', 'system', now())
ON CONFLICT (id) DO NOTHING;

SELECT setval('applications_id_seq', (SELECT COALESCE(MAX(id), 1) FROM applications));
SELECT setval('tasks_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tasks));
SELECT setval('stage_events_id_seq', (SELECT COALESCE(MAX(id), 1) FROM stage_events));
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
