# SMHS Union Official 🎓

海星中學學生會官方匿名板 — 暢所欲言，匿名發聲

## 功能特色

- 📝 **完全匿名發文** — 無需登入，任何人都可以發文
- 💬 **匿名留言** — 在貼文下方留言討論
- ❤️ **按讚互動** — 同 IP 不可重複按讚
- 🚫 **髒話過濾** — 內建中文髒話詞庫，自動擋下不當內容
- 🛡️ **防洗版** — IP 限速機制，每分鐘最多 3 篇貼文
- 🚨 **檢舉功能** — 任何人可檢舉不當貼文
- 👮 **管理後台** — 學生會幹部可登入管理貼文與檢舉

## 技術棧

| 組件 | 技術 |
|------|------|
| 後端 | [Hono](https://hono.dev/) + Cloudflare Workers + D1 (SQLite) |
| 前端 | Vanilla TypeScript + Vite |
| 管理後台 | Vanilla TypeScript + Vite |
| 部署 | Cloudflare Workers (後端) + Cloudflare Pages (前端) |

## 專案結構

```
smhs-union-official/
├── backend/        # Cloudflare Workers API
├── frontend/       # 匿名板前端
├── admin/          # 管理後台
└── README.md
```

## 快速開始

### 1. 後端
```bash
cd backend
npm install
npm run db:init    # 初始化本地 D1 資料庫
npm run dev        # 啟動本地開發 (http://localhost:8787)
```

### 2. 前端
```bash
cd frontend
npm install
npm run dev        # 啟動本地開發 (http://localhost:5173)
```

### 3. 管理後台
```bash
cd admin
npm install
npm run dev        # 啟動本地開發 (http://localhost:5174)
```

預設管理員帳號：`admin` / `admin123`（請部署後立即修改密碼）

## 部署

### Cloudflare

```bash
# 1. 建立 D1 資料庫
wrangler d1 create smhs-union-db
# 將回傳的 database_id 填入 backend/wrangler.toml

# 2. 設定 JWT Secret
wrangler secret put JWT_SECRET

# 3. 初始化遠端資料庫
cd backend && npm run db:init:remote

# 4. 部署後端 (Worker)
cd backend && npm run deploy

# 5. 部署前端 (Pages)
cd frontend && npm run build
# 上傳 dist/ 到 Cloudflare Pages

# 6. 部署管理後台 (Pages)
cd admin && npm run build
# 上傳 dist/ 到 Cloudflare Pages
```

## API 文檔

### 公開 API（無需認證）

| 方法 | 路由 | 說明 |
|------|------|------|
| GET | `/api/posts` | 取得貼文列表 |
| POST | `/api/posts` | 匿名發文 |
| GET | `/api/posts/:id` | 單篇貼文 + 留言 |
| POST | `/api/posts/:id/like` | 按讚/取消讚 |
| POST | `/api/posts/:id/comments` | 匿名留言 |
| POST | `/api/posts/:id/report` | 檢舉貼文 |

### 管理員 API（需 JWT）

| 方法 | 路由 | 說明 |
|------|------|------|
| POST | `/api/admin/login` | 管理員登入 |
| GET | `/api/admin/stats` | 儀表板統計 |
| GET | `/api/admin/posts` | 查看所有貼文 |
| PUT | `/api/admin/posts/:id/hide` | 隱藏貼文 |
| DELETE | `/api/admin/posts/:id` | 刪除貼文 |
| GET | `/api/admin/reports` | 查看檢舉 |
| PUT | `/api/admin/reports/:id` | 處理檢舉 |

## License

MIT © SMHS Student Union
