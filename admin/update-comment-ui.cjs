const fs = require('fs');
const path = '/Users/linjay/Projects/smhs-union-official/admin/src/main.ts';
let ts = fs.readFileSync(path, 'utf8');

// Change apiFetch from public API to admin API
ts = ts.replace(
  "const post = await apiFetch(`/api/posts/${id}`); // assuming public API for full details, or admin API",
  "const post = await apiFetch(`/api/admin/posts/${id}`);"
);

// Replace the comments iteration logic
const targetCommentsLoop = `      post.comments.forEach((c: any) => {
        html += \`
          <div class="comment-item">
            <div class="comment-body">
              <div class="comment-meta">#\${c.id} · \${(c.ip_hash || '').substring(0,8)}... · \${formatDate(c.created_at)}</div>
              <div>\${escapeHtml(c.content)}</div>
            </div>
            <button class="btn btn-sm btn-danger" onclick="deleteComment(\${id}, \${c.id})"><i class="fas fa-trash"></i></button>
          </div>
        \`;
      });`;

const newCommentsLoop = `      post.comments.forEach((c: any) => {
        let badge = c.status === 'hidden' ? '<span class="badge" style="background:#f59e0b;color:white;padding:2px 6px;border-radius:4px;font-size:0.75rem;">已隱藏</span> ' : 
                    c.status === 'deleted' ? '<span class="badge" style="background:#ef4444;color:white;padding:2px 6px;border-radius:4px;font-size:0.75rem;">已刪除</span> ' : '';
        html += \`
          <div class="comment-item" style="\${c.status === 'deleted' ? 'opacity:0.5;' : ''}">
            <div class="comment-body">
              <div class="comment-meta">\${badge}#\${c.id} · \${(c.ip_hash || '').substring(0,8)}... · \${formatDate(c.created_at)}</div>
              <div>\${escapeHtml(c.content)}</div>
            </div>
            <div class="actions">
              \${(c.status === 'active' || !c.status) ? \`<button class="btn btn-sm btn-warning" onclick="updateCommentStatus(\${id}, \${c.id}, 'hide')">隱藏</button>\` : ''}
              \${c.status === 'hidden' ? \`<button class="btn btn-sm btn-success" onclick="updateCommentStatus(\${id}, \${c.id}, 'restore')">恢復</button>\` : ''}
              \${c.status !== 'deleted' ? \`<button class="btn btn-sm btn-danger" onclick="deleteComment(\${id}, \${c.id})">刪除</button>\` : ''}
            </div>
          </div>
        \`;
      });`;

ts = ts.replace(targetCommentsLoop, newCommentsLoop);

// Add updateCommentStatus function
const targetDeleteFunction = `(window as any).deleteComment = async (postId: number, commentId: number) => {`;
const newUpdateFunction = `(window as any).updateCommentStatus = async (postId: number, commentId: number, action: 'hide'|'restore') => {
  try {
    await apiFetch(\`/api/admin/comments/\${commentId}/\${action}\`, { method: 'PUT' });
    showToast('狀態已更新');
    (window as any).viewPostDetail(postId);
  } catch (e: any) {
    showToast(e.message, 'error');
  }
};

` + targetDeleteFunction;

ts = ts.replace(targetDeleteFunction, newUpdateFunction);

fs.writeFileSync(path, ts);
