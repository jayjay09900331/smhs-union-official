#!/bin/bash

echo "🚀 開始發布 海星學生會匿名板..."

echo "----------------------------------------"
echo "📦 1. 發布前台 (Frontend)..."
cd frontend
npm install
npm run build
npx wrangler pages deploy dist --project-name smhs-union-official-frontend
cd ..

echo "----------------------------------------"
echo "🛠️ 2. 發布後台 (Admin)..."
cd admin
npm install
npm run build
npx wrangler pages deploy dist --project-name smhs-union-official-admin
cd ..

echo "----------------------------------------"
echo "⚙️ 3. 發布後端 API (Backend)..."
cd backend
npm install
npm run deploy
cd ..

echo "----------------------------------------"
echo "✅ 全部發布完成！"
