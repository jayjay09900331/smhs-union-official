const fs = require('fs');
const path = '/Users/linjay/Projects/smhs-union-official/backend/src/index.ts';
let code = fs.readFileSync(path, 'utf8');

// Fix GET /api/posts/:id
code = code.replace(
  /SELECT id, content, category, likes, comment_count, created_at FROM posts WHERE id = \? AND status = \?/g,
  "SELECT id, content, category, likes, comment_count, created_at, admin_reply FROM posts WHERE id = ? AND status = ?"
);
code = code.replace(
  /\.bind\(id, 'active'\)/, // First match is GET /api/posts/:id (for post, not comments!)
  ".bind(id, 'approved')"
);

// Fix POST /api/posts/:id/like
code = code.replace(
  /\.bind\(postId, 'active'\)/g, // this matches both like and comments routes!
  ".bind(postId, 'approved')"
);

// Fix Admin Stats
code = code.replace(
  /totalPosts = await db\.prepare\('SELECT COUNT\(\*\) as c FROM posts WHERE status = \?'\)\.bind\('active'\)/,
  "totalPosts = await db.prepare('SELECT COUNT(*) as c FROM posts WHERE status = ?').bind('approved')"
);

// Fix Admin Restore
code = code.replace(
  /UPDATE posts SET status = \? WHERE id = \?'\)\.bind\('active'/,
  "UPDATE posts SET status = ? WHERE id = ?').bind('approved'"
);

fs.writeFileSync(path, code);
