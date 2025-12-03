DELETE FROM pending_sales
WHERE status = 'pending';

TRUNCATE TABLE notifications RESTART IDENTITY;