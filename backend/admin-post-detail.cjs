const fs = require('fs');
const path = '/Users/linjay/Projects/smhs-union-official/backend/src/index.ts';
let ts = fs.readFileSync(path, 'utf8');

const targetAdminGetPosts = `app.get('/api/admin/posts', authorizeAdmin, async (c) => {`;

const newEndpoint = `// --- GET /api/admin/posts/:id ---
app.get('/api/admin/posts/:id', authorizeAdmin, async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const post = await db.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first();
  if (!post) return c.json({ error: '貼文不存在' }, 404);
  const comments = await db.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY floor ASC').bind(id).all();
  return c.json({ ...post, comments: comments.results });
});\n\n`;

ts = ts.replace(targetAdminGetPosts, newEndpoint + targetAdminGetPosts);
fs.writeFileSync(path, ts);
