-- Remove seeded/demo members and their records.
-- Keeps the admin account and any collections/bills owned by admin.

DELETE FROM expenses
WHERE submitted_by_user_id IN (
  SELECT id FROM users WHERE role <> 'ADMIN' OR username IN ('amit', 'priya', 'rahul')
);

DELETE FROM collections
WHERE collected_by_user_id IN (
  SELECT id FROM users WHERE role <> 'ADMIN' OR username IN ('amit', 'priya', 'rahul')
);

DELETE FROM users
WHERE role <> 'ADMIN' OR username IN ('amit', 'priya', 'rahul');

INSERT INTO users (id, username, password_hash, full_name, role, phone)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'admin', 'Admin@skat369', 'Administrator', 'ADMIN', '')
ON CONFLICT (username) DO NOTHING;
