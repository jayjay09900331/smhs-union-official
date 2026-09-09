import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sign, verify } from 'hono/jwt';

// ==========================================
// Types
// ==========================================
type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

// ==========================================
// Helpers
// ==========================================

/** SHA-256 hash of the client IP (never store raw IP) */
const hashIP = async (ip: string): Promise<string> => {
  const data = new TextEncoder().encode(ip);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/** Get client IP from request headers */
const getClientIP = (c: any): string => {
  return c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '0.0.0.0';
};

/** Current Taipei time ISO string */
const taipeiNow = (): string => {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' }).replace(' ', 'T');
};

// ==========================================
// Profanity Filter (髒話過濾器)
// ==========================================

const PROFANITY_LIST: string[] = ['機掰', '傻逼', '智障', '尼哥', '婊子', '狗娘養', '草泥馬', '草你媽', 'fuck', 'shit', 'damn', 'bitch', 'asshole', 'dick', 'pussy', 'wtf', 'stfu', '死全家', '低能', '腦殘', '弱智', '外勞', '番仔', '死玻璃', '台女', '母豬', '傻屌', '憨Ｂ', '憨B', '憨兒', '破麻', '綠茶婊', '廢物', '垃圾', '畜生', '敗類', '賤人', '死媽', '死屁孩', '智缺', 'slut', 'whore', 'cunt', 'faggot', 'nigger', 'nigga', 'retard', 'kys', 'motherfucker', 'mf', 'douchebag', '幹', '幹你娘', '幹您娘', '靠北', '靠杯', '靠夭', '靠腰', '媽的', '他媽的', '操', '操你媽', '操您媽'];

/** Normalize text for profanity matching: remove spaces, convert to lowercase */
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[～~！!@#＃$＄%％^＾&＆*＊()（）\-－_＿+=＋＝.。,，]+/g, '');
};

/** Check if text contains profanity. Returns the first matched word or null. */
const checkProfanity = (text: string): string | null => {
  const normalized = normalizeText(text);
  for (const word of PROFANITY_LIST) {
    if (normalized.includes(normalizeText(word))) {
      return word;
    }
  }
  return null;
};

// ==========================================
// Rate Limiting
// ==========================================

/** Check if IP has exceeded rate limit. Returns true if rate-limited. */
const isRateLimited = async (
  db: D1Database,
  ipHash: string,
  action: string,
  maxActions: number,
  windowMinutes: number
): Promise<boolean> => {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  // Clean old entries
  await db
    .prepare('DELETE FROM rate_limits WHERE timestamp < ?')
    .bind(windowStart)
    .run();

  // Count recent actions
  const result = await db
    .prepare('SELECT COUNT(*) as count FROM rate_limits WHERE ip_hash = ? AND action = ? AND timestamp > ?')
    .bind(ipHash, action, windowStart)
    .first<number>('count');

  return (result || 0) >= maxActions;
};

/** Record a rate limit action */
const recordAction = async (db: D1Database, ipHash: string, action: string): Promise<void> => {
  await db
    .prepare('INSERT INTO rate_limits (ip_hash, action, timestamp) VALUES (?, ?, ?)')
    .bind(ipHash, action, new Date().toISOString())
    .run();
};

// ==========================================
// Admin Auth Middleware
// ==========================================

const authorizeAdmin = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  const token =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) return c.json({ error: '未授權' }, 401);

  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    if (payload.role !== 'admin') {
      return c.json({ error: '需要管理員權限' }, 403);
    }
    c.set('jwtPayload', payload);
    return await next();
  } catch (err: any) {
    return c.json({ error: 'Token 無效或已過期', message: err.message }, 401);
  }
};

// ==========================================
// Public API Routes
// ==========================================

// --- GET /api/posts — 取得貼文列表（分頁） ---
app.get('/api/posts', async (c) => {
  const db = c.env.DB;
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  const category = c.req.query('category');
  const offset = (page - 1) * limit;

  let query = 'SELECT id, content, category, likes, comment_count, created_at, admin_reply FROM posts WHERE status = ?';
  const params: any[] = ['approved'];

  if (category && category !== '全部') {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const posts = await db.prepare(query).bind(...params).all();

  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM posts WHERE status = ?';
  const countParams: any[] = ['approved'];
  if (category && category !== '全部') {
    countQuery += ' AND category = ?';
    countParams.push(category);
  }
  const total = await db.prepare(countQuery).bind(...countParams).first<number>('total');

  return c.json({
    posts: posts.results,
    pagination: {
      page,
      limit,
      total: total || 0,
      totalPages: Math.ceil((total || 0) / limit),
    },
  });
});

// --- POST /api/posts — 匿名發文 ---
app.post('/api/posts', async (c) => {
  const db = c.env.DB;
  const ip = getClientIP(c);
  const ipHash = await hashIP(ip);

  const body = await c.req.json<{ content: string; category?: string }>();
  const content = body.content?.trim();
  const category = body.category?.trim() || '一般';

  // Validate
  if (!content) return c.json({ error: '內容不可為空' }, 400);
  if (content.length > 500) return c.json({ error: '內容不可超過 500 字' }, 400);
  if (content.length < 1) return c.json({ error: '內容至少需要 1 個字' }, 400);

  // Profanity check
  const profanity = checkProfanity(content);
  if (profanity) {
    return c.json({ error: '⚠️ 請注意您的用詞！內容包含不當用語，無法送出！' }, 400);
  }

  // Rate limit: max 3 posts per minute
  if (await isRateLimited(db, ipHash, 'post', 3, 1)) {
    return c.json({ error: '發文太頻繁，請稍後再試' }, 429);
  }

  const now = taipeiNow();

  const result = await db
    .prepare('INSERT INTO posts (content, category, ip_hash, status, created_at) VALUES (?, ?, ?, \'pending\', ?)')
    .bind(content, category, ipHash, now)
    .run();

  await recordAction(db, ipHash, 'post');

  return c.json({
    success: true,
    post: {
      id: result.meta.last_row_id,
      content,
      category,
      likes: 0,
      comment_count: 0,
      created_at: now,
    },
  }, 201);
});

// --- GET /api/posts/:id — 取得單篇貼文 + 留言 ---
app.get('/api/posts/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));

  const post = await db
    .prepare('SELECT id, content, category, likes, comment_count, created_at, admin_reply FROM posts WHERE id = ? AND status = ?')
    .bind(id, 'approved')
    .first();

  if (!post) return c.json({ error: '貼文不存在' }, 404);

  const comments = await db
    .prepare('SELECT id, content, floor, created_at FROM comments WHERE post_id = ? AND status = ? ORDER BY floor ASC')
    .bind(id, 'active')
    .all();

  return c.json({ post, comments: comments.results });
});

// --- POST /api/posts/:id/like — 按讚/取消讚 ---
app.post('/api/posts/:id/like', async (c) => {
  const db = c.env.DB;
  const postId = parseInt(c.req.param('id'));
  const ip = getClientIP(c);
  const ipHash = await hashIP(ip);

  // Check post exists
  const post = await db
    .prepare('SELECT id, likes FROM posts WHERE id = ? AND status = ?')
    .bind(postId, 'approved')
    .first<{ id: number; likes: number }>();

  if (!post) return c.json({ error: '貼文不存在' }, 404);

  // Check if already liked
  const existing = await db
    .prepare('SELECT 1 FROM likes WHERE post_id = ? AND ip_hash = ?')
    .bind(postId, ipHash)
    .first();

  if (existing) {
    // Unlike
    await db.batch([
      db.prepare('DELETE FROM likes WHERE post_id = ? AND ip_hash = ?').bind(postId, ipHash),
      db.prepare('UPDATE posts SET likes = MAX(likes - 1, 0) WHERE id = ?').bind(postId),
    ]);
    return c.json({ liked: false, likes: Math.max(post.likes - 1, 0) });
  } else {
    // Like
    await db.batch([
      db.prepare('INSERT INTO likes (post_id, ip_hash, created_at) VALUES (?, ?, ?)').bind(
        postId,
        ipHash,
        new Date().toISOString()
      ),
      db.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').bind(postId),
    ]);
    return c.json({ liked: true, likes: post.likes + 1 });
  }
});

// --- POST /api/posts/:id/comments — 匿名留言 ---
app.post('/api/posts/:id/comments', async (c) => {
  const db = c.env.DB;
  const postId = parseInt(c.req.param('id'));
  const ip = getClientIP(c);
  const ipHash = await hashIP(ip);

  const body = await c.req.json<{ content: string }>();
  const content = body.content?.trim();

  if (!content) return c.json({ error: '留言不可為空' }, 400);
  if (content.length > 300) return c.json({ error: '留言不可超過 300 字' }, 400);

  // Profanity check
  const profanity = checkProfanity(content);
  if (profanity) {
    return c.json({ error: '⚠️ 請注意您的用詞！留言包含不當用語，無法送出！' }, 400);
  }

  // Rate limit: max 10 comments per minute
  if (await isRateLimited(db, ipHash, 'comment', 10, 1)) {
    return c.json({ error: '留言太頻繁，請稍後再試' }, 429);
  }

  // Check post exists
  const post = await db
    .prepare('SELECT id FROM posts WHERE id = ? AND status = ?')
    .bind(postId, 'approved')
    .first();

  if (!post) return c.json({ error: '貼文不存在' }, 404);

  // Get next floor number
  const maxFloor = await db
    .prepare('SELECT MAX(floor) as max_floor FROM comments WHERE post_id = ?')
    .bind(postId)
    .first<number>('max_floor');

  const floor = (maxFloor || 0) + 1;
  const now = taipeiNow();

  await db.batch([
    db
      .prepare('INSERT INTO comments (post_id, content, ip_hash, floor, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(postId, content, ipHash, floor, now),
    db.prepare('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?').bind(postId),
  ]);

  await recordAction(db, ipHash, 'comment');

  return c.json(
    {
      success: true,
      comment: { post_id: postId, content, floor, created_at: now },
    },
    201
  );
});

// --- POST /api/posts/:id/report — 檢舉貼文 ---
app.post('/api/posts/:id/report', async (c) => {
  const db = c.env.DB;
  const postId = parseInt(c.req.param('id'));
  const ip = getClientIP(c);
  const ipHash = await hashIP(ip);

  const body = await c.req.json<{ reason: string; comment_id?: number }>();
  const reason = body.reason?.trim();

  if (!reason) return c.json({ error: '請填寫檢舉原因' }, 400);
  if (reason.length > 200) return c.json({ error: '檢舉原因不可超過 200 字' }, 400);

  // Rate limit: max 5 reports per 10 minutes
  if (await isRateLimited(db, ipHash, 'report', 5, 10)) {
    return c.json({ error: '檢舉太頻繁，請稍後再試' }, 429);
  }

  const now = taipeiNow();

  await db
    .prepare(
      'INSERT INTO reports (post_id, comment_id, reason, ip_hash, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(postId, body.comment_id || null, reason, ipHash, now)
    .run();

  await recordAction(db, ipHash, 'report');

  return c.json({ success: true, message: '檢舉已送出，管理員會盡快處理' }, 201);
});

// ==========================================
// Admin API Routes
// ==========================================

// --- POST /api/admin/login ---
app.post('/api/admin/login', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{ username: string; password: string }>();

  const admin = await db
    .prepare('SELECT * FROM admins WHERE username = ?')
    .bind(body.username)
    .first<{ username: string; password: string; name: string; status: string }>();

  if (!admin || admin.password !== body.password) {
    return c.json({ error: '帳號或密碼錯誤' }, 401);
  }
  
  if (admin.status === 'pending') {
    return c.json({ error: '您的帳號尚在審核中，請等候管理員核准' }, 403);
  }

  const token = await sign(
    {
      username: admin.username,
      name: admin.name,
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    },
    c.env.JWT_SECRET,
    'HS256'
  );

  return c.json({ token, name: admin.name });
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
app.get('/api/admin/applications', authorizeAdmin, async (c) => {
  const db = c.env.DB;
  const { results } = await db
    .prepare("SELECT username, name, status FROM admins WHERE status = 'pending'")
    .all();
  return c.json({ applications: results });
});

// --- PUT /api/admin/applications/:username ---
app.put('/api/admin/applications/:username', authorizeAdmin, async (c) => {
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
});

// --- GET /api/admin/stats ---
app.get('/api/admin/stats', authorizeAdmin, async (c) => {
  const db = c.env.DB;

  const totalPosts = await db.prepare('SELECT COUNT(*) as c FROM posts WHERE status = ?').bind('approved').first<number>('c');
  const hiddenPosts = await db.prepare('SELECT COUNT(*) as c FROM posts WHERE status = ?').bind('hidden').first<number>('c');
  const pendingReports = await db.prepare('SELECT COUNT(*) as c FROM reports WHERE status = ?').bind('pending').first<number>('c');
  const totalComments = await db.prepare('SELECT COUNT(*) as c FROM comments WHERE status = ?').bind('active').first<number>('c');

  return c.json({
    activePosts: totalPosts || 0,
    hiddenPosts: hiddenPosts || 0,
    pendingReports: pendingReports || 0,
    totalComments: totalComments || 0,
  });
});

// --- GET /api/admin/posts — 管理員查看所有貼文（含 ip_hash） ---
// --- GET /api/admin/posts/:id ---
app.get('/api/admin/posts/:id', authorizeAdmin, async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const post = await db.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first();
  if (!post) return c.json({ error: '貼文不存在' }, 404);
  const comments = await db.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY floor ASC').bind(id).all();
  return c.json({ ...post, comments: comments.results });
});

app.get('/api/admin/posts', authorizeAdmin, async (c) => {
  const db = c.env.DB;
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '30'), 100);
  const status = c.req.query('status') || 'all';
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM posts';
  const params: any[] = [];

  if (status !== 'all') {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const posts = await db.prepare(query).bind(...params).all();

  let countQuery = 'SELECT COUNT(*) as total FROM posts';
  const countParams: any[] = [];
  if (status !== 'all') {
    countQuery += ' WHERE status = ?';
    countParams.push(status);
  }
  const total = await db.prepare(countQuery).bind(...countParams).first<number>('total');

  return c.json({
    posts: posts.results,
    pagination: { page, limit, total: total || 0, totalPages: Math.ceil((total || 0) / limit) },
  });
});


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

// --- PUT /api/admin/posts/:id/hide — 隱藏貼文 ---
app.put('/api/admin/posts/:id/hide', authorizeAdmin, async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));

  await db.prepare('UPDATE posts SET status = ? WHERE id = ?').bind('hidden', id).run();
  return c.json({ success: true, message: '貼文已隱藏' });
});

// --- PUT /api/admin/posts/:id/restore — 恢復貼文 ---
app.put('/api/admin/posts/:id/restore', authorizeAdmin, async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));

  await db.prepare('UPDATE posts SET status = ? WHERE id = ?').bind('approved', id).run();
  return c.json({ success: true, message: '貼文已恢復' });
});

// --- DELETE /api/admin/posts/:id — 刪除貼文 ---
app.delete('/api/admin/posts/:id', authorizeAdmin, async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));

  await db.batch([
    db.prepare('DELETE FROM comments WHERE post_id = ?').bind(id),
    db.prepare('DELETE FROM likes WHERE post_id = ?').bind(id),
    db.prepare('DELETE FROM posts WHERE id = ?').bind(id),
  ]);

  return c.json({ success: true, message: '貼文已刪除' });
});

// --- DELETE /api/admin/comments/:id — 刪除留言 ---
// --- PUT /api/admin/comments/:id/hide — 隱藏留言 ---
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
});

// --- GET /api/admin/reports — 查看檢舉 ---
app.get('/api/admin/reports', authorizeAdmin, async (c) => {
  const db = c.env.DB;
  const status = c.req.query('status') || 'pending';

  const reports = await db
    .prepare(
      `SELECT r.*, p.content as post_content, p.status as post_status
       FROM reports r
       LEFT JOIN posts p ON r.post_id = p.id
       WHERE r.status = ?
       ORDER BY r.created_at DESC
       LIMIT 100`
    )
    .bind(status)
    .all();

  return c.json({ reports: reports.results });
});

// --- PUT /api/admin/reports/:id — 處理檢舉 ---
app.put('/api/admin/reports/:id', authorizeAdmin, async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json<{ status: string; hide_post?: boolean }>();

  if (!['resolved', 'dismissed'].includes(body.status)) {
    return c.json({ error: '狀態無效' }, 400);
  }

  const report = await db
    .prepare('SELECT * FROM reports WHERE id = ?')
    .bind(id)
    .first<{ post_id: number; comment_id: number | null }>();

  if (!report) return c.json({ error: '檢舉不存在' }, 404);

  const statements = [
    db.prepare('UPDATE reports SET status = ? WHERE id = ?').bind(body.status, id),
  ];

  // Optionally hide the reported post
  if (body.hide_post && report.post_id) {
    statements.push(
      db.prepare('UPDATE posts SET status = ? WHERE id = ?').bind('hidden', report.post_id)
    );
  }

  await db.batch(statements);

  return c.json({ success: true, message: '檢舉已處理' });
});

// --- Admin password change ---
app.put('/api/admin/password', authorizeAdmin, async (c) => {
  const db = c.env.DB;
  const payload = c.get('jwtPayload') as { username: string };
  const body = await c.req.json<{ oldPassword: string; newPassword: string }>();

  const admin = await db
    .prepare('SELECT password FROM admins WHERE username = ?')
    .bind(payload.username)
    .first<{ password: string }>();

  if (!admin || admin.password !== body.oldPassword) {
    return c.json({ error: '舊密碼錯誤' }, 400);
  }

  if (!body.newPassword || body.newPassword.length < 6) {
    return c.json({ error: '新密碼至少需要 6 個字元' }, 400);
  }

  await db
    .prepare('UPDATE admins SET password = ? WHERE username = ?')
    .bind(body.newPassword, payload.username)
    .run();

  return c.json({ success: true, message: '密碼已更新' });
});

// ==========================================
// Health check
// ==========================================
app.get('/', (c) => c.json({ status: 'ok', service: 'SMHS Union Official API' }));

export default app;
