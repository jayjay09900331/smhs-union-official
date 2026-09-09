const fs = require('fs');
const path = '/Users/linjay/Projects/smhs-union-official/backend/src/index.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Modify POST /api/admin/login
const oldLogin = `  const admin = await db
    .prepare('SELECT * FROM admins WHERE username = ?')
    .bind(body.username)
    .first<{ username: string; password: string; name: string }>();

  if (!admin || admin.password !== body.password) {
    return c.json({ error: '帳號或密碼錯誤' }, 401);
  }`;

const newLogin = `  const admin = await db
    .prepare('SELECT * FROM admins WHERE username = ?')
    .bind(body.username)
    .first<{ username: string; password: string; name: string; status: string }>();

  if (!admin || admin.password !== body.password) {
    return c.json({ error: '帳號或密碼錯誤' }, 401);
  }
  
  if (admin.status === 'pending') {
    return c.json({ error: '您的帳號尚在審核中，請等候管理員核准' }, 403);
  }`;

code = code.replace(oldLogin, newLogin);

// 2. Add Register API, Applications API, and Approve/Reject API right after login API
const loginRouteEnd = `  return c.json({ token, username: admin.username, name: admin.name });
});`;

const newRoutes = `  return c.json({ token, username: admin.username, name: admin.name });
});

// --- POST /api/admin/register ---
app.post('/api/admin/register', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{ username?: string; password?: string; name?: string }>();
  
  if (!body.username || !body.password || !body.name) {
    return c.json({ error: '請填寫所有欄位' }, 400);
  }

  try {
    await db
      .prepare('INSERT INTO admins (username, password, name, status) VALUES (?, ?, ?, ?)')
      .bind(body.username, body.password, body.name, 'pending')
      .run();
    return c.json({ success: true, message: '申請已送出，請等候管理員審核' });
  } catch (err: any) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return c.json({ error: '該帳號已存在或已申請過' }, 409);
    }
    return c.json({ error: '註冊失敗' }, 500);
  }
});

// --- GET /api/admin/applications ---
app.get('/api/admin/applications', adminAuth, async (c) => {
  const db = c.env.DB;
  const { results } = await db
    .prepare("SELECT username, name, status FROM admins WHERE status = 'pending'")
    .all();
  return c.json({ applications: results });
});

// --- PUT /api/admin/applications/:username ---
app.put('/api/admin/applications/:username', adminAuth, async (c) => {
  const db = c.env.DB;
  const username = c.req.param('username');
  const body = await c.req.json<{ action: 'approve' | 'reject' }>();

  if (body.action === 'approve') {
    await db.prepare("UPDATE admins SET status = 'approved' WHERE username = ?").bind(username).run();
    return c.json({ success: true, message: '已核准申請' });
  } else if (body.action === 'reject') {
    await db.prepare("DELETE FROM admins WHERE username = ? AND status = 'pending'").bind(username).run();
    return c.json({ success: true, message: '已駁回並刪除申請' });
  }
  return c.json({ error: '無效的操作' }, 400);
});`;

code = code.replace(loginRouteEnd, newRoutes);

fs.writeFileSync(path, code);
