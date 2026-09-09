const fs = require('fs');
const path = '/Users/linjay/Projects/smhs-union-official/backend/src/index.ts';
let ts = fs.readFileSync(path, 'utf8');

const targetDeleteComment = `app.delete('/api/admin/comments/:id', authorizeAdmin, async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));

  const comment = await db
    .prepare('SELECT post_id FROM comments WHERE id = ?')
    .bind(id)
    .first<{ post_id: number }>();

  if (!comment) return c.json({ error: '留言不存在' }, 404);

  await db.batch([
    db.prepare('UPDATE comments SET status = ? WHERE id = ?').bind('deleted', id),
    db.prepare('UPDATE posts SET comment_count = MAX(comment_count - 1, 0) WHERE id = ?').bind(comment.post_id),
  ]);

  return c.json({ success: true, message: '留言已刪除' });
});`;

const newRoutes = `// --- PUT /api/admin/comments/:id/hide — 隱藏留言 ---
app.put('/api/admin/comments/:id/hide', authorizeAdmin, async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const comment = await db.prepare('SELECT post_id FROM comments WHERE id = ?').bind(id).first<{ post_id: number }>();
  if (!comment) return c.json({ error: '留言不存在' }, 404);

  await db.batch([
    db.prepare('UPDATE comments SET status = ? WHERE id = ?').bind('hidden', id),
    db.prepare('UPDATE posts SET comment_count = MAX(comment_count - 1, 0) WHERE id = ?').bind(comment.post_id),
  ]);
  return c.json({ success: true, message: '留言已隱藏' });
});

// --- PUT /api/admin/comments/:id/restore — 恢復留言 ---
app.put('/api/admin/comments/:id/restore', authorizeAdmin, async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const comment = await db.prepare('SELECT post_id FROM comments WHERE id = ?').bind(id).first<{ post_id: number }>();
  if (!comment) return c.json({ error: '留言不存在' }, 404);

  await db.batch([
    db.prepare('UPDATE comments SET status = ? WHERE id = ?').bind('active', id),
    db.prepare('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?').bind(comment.post_id),
  ]);
  return c.json({ success: true, message: '留言已恢復' });
});

// --- DELETE /api/admin/comments/:id — 刪除留言 ---
app.delete('/api/admin/comments/:id', authorizeAdmin, async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));

  const comment = await db
    .prepare('SELECT post_id FROM comments WHERE id = ?')
    .bind(id)
    .first<{ post_id: number }>();

  if (!comment) return c.json({ error: '留言不存在' }, 404);

  await db.batch([
    db.prepare('DELETE FROM comments WHERE id = ?').bind(id),
    db.prepare('UPDATE posts SET comment_count = MAX(comment_count - 1, 0) WHERE id = ?').bind(comment.post_id),
  ]);

  return c.json({ success: true, message: '留言已刪除' });
});`;

ts = ts.replace(targetDeleteComment, newRoutes);
fs.writeFileSync(path, ts);
