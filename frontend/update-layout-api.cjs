const fs = require('fs');

// 1. Update main.ts
const tsPath = '/Users/linjay/Projects/smhs-union-official/frontend/src/main.ts';
let ts = fs.readFileSync(tsPath, 'utf8');

// fetchPosts
ts = ts.replace(
  "data: json.posts || [],",
  `data: (json.posts || []).map((p: any) => ({
      id: p.id,
      content: p.content,
      category: p.category,
      createdAt: p.created_at,
      likeCount: p.likes,
      commentCount: p.comment_count,
      adminReply: p.admin_reply
    })),`
);

// fetchPostDetail
ts = ts.replace(
  /async function fetchPostDetail.*?return res\.json\(\);\n\}/s,
  `async function fetchPostDetail(id: string): Promise<{ post: Post, comments: Comment[] }> {
  const res = await fetch(\`\${BASE_URL}/api/posts/\${id}\`);
  if (!res.ok) throw new Error('Failed to fetch post details');
  const data = await res.json();
  return {
    post: {
      id: data.post.id,
      content: data.post.content,
      category: data.post.category,
      createdAt: data.post.created_at,
      likeCount: data.post.likes,
      commentCount: data.post.comment_count,
      adminReply: data.post.admin_reply
    },
    comments: (data.comments || []).map((c: any) => ({
      id: c.id,
      content: c.content,
      createdAt: c.created_at
    }))
  };
}`
);

// likePostApi
ts = ts.replace(
  /async function likePostApi.*?return res\.json\(\);\n\}/s,
  `async function likePostApi(id: string): Promise<{ likeCount: number }> {
  const res = await fetch(\`\${BASE_URL}/api/posts/\${id}/like\`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to like post');
  const data = await res.json();
  return { likeCount: data.likes };
}`
);

// addComment
ts = ts.replace(
  /async function addComment.*?return res\.json\(\);\n\}/s,
  `async function addComment(postId: string, content: string): Promise<Comment> {
  const res = await fetch(\`\${BASE_URL}/api/posts/\${postId}/comments\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  if (!res.ok) throw new Error('Failed to add comment');
  const data = await res.json();
  return {
    id: data.comment.id,
    content: data.comment.content,
    createdAt: data.comment.created_at
  };
}`
);

fs.writeFileSync(tsPath, ts);

// 2. Update style.css
const cssPath = '/Users/linjay/Projects/smhs-union-official/frontend/src/style.css';
let css = fs.readFileSync(cssPath, 'utf8');

// Replace the last .posts-container logic
css = css.replace(
  /\/\* 3-column grid for posts like IG \*\/\n\.posts-container \{[\s\S]*?align-items: start;\n\}/,
  `/* 2-column grid inside a glassmorphism wrapper */
.posts-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  align-items: start;
  
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  padding: 2.5rem;
  max-width: 900px;
  margin: 0 auto 3rem auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
}

.post-card {
  font-size: 1.05rem;
}`
);

// update media queries for new grid
css = css.replace(
  /grid-template-columns: repeat\(3, 1fr\);/,
  `grid-template-columns: repeat(2, 1fr);`
);

fs.writeFileSync(cssPath, css);
