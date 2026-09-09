ALTER TABLE posts ADD COLUMN admin_reply TEXT;
UPDATE posts SET status = 'approved';
