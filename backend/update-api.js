const fs = require("fs");
const path = "./src/index.ts";
let code = fs.readFileSync(path, "utf8");

// 1. GET /api/posts
code = code.replace(
  "const { results, meta } = await db.prepare(`SELECT * FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?`)",
  "const { results, meta } = await db.prepare(`SELECT * FROM posts WHERE status = 'approved' ORDER BY created_at DESC LIMIT ? OFFSET ?`)"
);
code = code.replace(
  "const totalRes = await db.prepare(`SELECT COUNT(*) as count FROM posts`).first<{ count: number }>();",
  "const totalRes = await db.prepare(`SELECT COUNT(*) as count FROM posts WHERE status = 'approved'`).first<{ count: number }>();"
);

// 2. POST /api/posts
code = code.replace(
  "INSERT INTO posts (content, category, ip_hash, created_at) VALUES (?, ?, ?, ?)",
  "INSERT INTO posts (content, category, ip_hash, status, created_at) VALUES (?, ?, ?, 'pending', ?)"
);
code = code.replace(
  "return c.json({ success: true, post: postRes }, 201);",
  "return c.json({ success: true, message: '貼文已送出！等待管理員回覆後將發布。', post: postRes }, 201);"
);

// 3. Admin Route
const approveRoute = `
// --- PUT /api/admin/posts/:id/approve — 審核並回覆貼文 ---
app.put('/api/admin/posts/:id/approve', authorizeAdmin, async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json<{ reply: string }>();

  await db.prepare('UPDATE posts SET status = ?, admin_reply = ? WHERE id = ?')
    .bind('approved', body.reply || null, id)
    .run();
    
  return c.json({ success: true, message: '貼文已審核發布' });
});
`;

code = code.replace(
  "// --- PUT /api/admin/posts/:id/hide",
  approveRoute + "\n// --- PUT /api/admin/posts/:id/hide"
);

fs.writeFileSync(path, code);
