# SMHS Union Official

The official anonymous board for the Stella Maris High School Student Union. Built entirely on Cloudflare's serverless stack.

## Features

- **100% Anonymous**: No user accounts or logins required to post or comment.
- **Profanity Filter**: Built-in blocklist that automatically rejects posts containing inappropriate language.
- **Anti-Spam**: IP-based rate limiting (using SHA-256 hashing to ensure raw IPs are never stored).
- **Admin Dashboard**: A dedicated panel for student union members to review reports, hide posts, and manage the platform.

## Tech Stack

- **Backend**: Cloudflare Workers, Hono, D1 (SQLite)
- **Frontend / Admin**: Vanilla TypeScript, Vite
- **Deployment**: Cloudflare Pages

## Project Structure

```text
.
├── backend/        # Cloudflare Workers API
├── frontend/       # Public anonymous board
└── admin/          # Admin dashboard
```

## Local Development

### 1. Backend
```bash
cd backend
npm install
npm run db:init    # Initialize local D1 database
npm run dev        # Starts on http://localhost:8787
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev        # Starts on http://localhost:5173
```

### 3. Admin Panel
```bash
cd admin
npm install
npm run dev        # Starts on http://localhost:5174
```
*Default admin credentials for local testing: `admin` / `admin123`*

## Deployment

The project is designed to be hosted on Cloudflare.

```bash
# 1. Create a D1 database
npx wrangler d1 create smhs-union-db
# Copy the generated database_id into backend/wrangler.toml

# 2. Set the JWT secret for the admin panel
npx wrangler secret put JWT_SECRET

# 3. Apply schema to remote database
cd backend && npm run db:init:remote

# 4. Deploy backend
npm run deploy

# 5. Deploy frontends
cd ../frontend && npm run build
npx wrangler pages deploy dist --project-name smhs-union-official-frontend

cd ../admin && npm run build
npx wrangler pages deploy dist --project-name smhs-union-official-admin
```

## License

MIT © SMHS Student Union
