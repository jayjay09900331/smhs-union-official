-- ==========================================
-- SMHS Union Official Anonymous Board
-- D1 Database Schema
-- ==========================================

-- 貼文
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    category TEXT DEFAULT '一般',
    ip_hash TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    likes INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
);

-- 留言
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    ip_hash TEXT NOT NULL,
    floor INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- 按讚紀錄（同 IP 不可重複按同一篇）
CREATE TABLE IF NOT EXISTS likes (
    post_id INTEGER NOT NULL,
    ip_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (post_id, ip_hash),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- 檢舉
CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER,
    comment_id INTEGER,
    reason TEXT NOT NULL,
    ip_hash TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL
);

-- 管理員帳號
CREATE TABLE IF NOT EXISTS admins (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    name TEXT NOT NULL
);

-- 限速紀錄
CREATE TABLE IF NOT EXISTS rate_limits (
    ip_hash TEXT NOT NULL,
    action TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_posts_status_created ON posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category, status);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON rate_limits(ip_hash, action, timestamp);

-- 預設管理員帳號（請部署後立即修改密碼）
INSERT OR IGNORE INTO admins (username, password, name)
VALUES ('admin', 'admin123', '學生會管理員');
