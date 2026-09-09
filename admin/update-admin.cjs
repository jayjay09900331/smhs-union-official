const fs = require("fs");
const path = "./src/main.ts";
let code = fs.readFileSync(path, "utf8");

// Add Approve button logic to table
// Existing buttons are 隱藏, 恢復, 刪除. We need to add "審核並回覆" for pending posts.
// The render logic is: const statusMap: Record<string, string> = { active: '活躍', hidden: '已隱藏', deleted: '已刪除' };
code = code.replace(
  "deleted: '已刪除'",
  "deleted: '已刪除', pending: '待審核', approved: '已發布'"
);
code = code.replace(
  "deleted: 'bg-red-100 text-red-800'",
  "deleted: 'bg-red-100 text-red-800', pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800'"
);

// We need to inject the "Approve" button action in renderPostsTable
const actionButtonsStr = `
                <button class="action-btn hide-btn" data-id="\${post.id}">隱藏</button>
`;
const newActionButtonsStr = `
                \${post.status === 'pending' ? \`<button class="action-btn approve-btn" data-id="\${post.id}">審核並回覆</button>\` : ''}
                \${post.status === 'approved' || post.status === 'active' ? \`<button class="action-btn hide-btn" data-id="\${post.id}">隱藏</button>\` : ''}
`;
code = code.replace(/<button class="action-btn hide-btn" data-id="\$\{post\.id\}">隱藏<\/button>/, newActionButtonsStr);

// Add event listener for approve-btn in setupPostsListeners
const approveListener = `
  document.querySelectorAll('.approve-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = (e.target as HTMLElement).dataset.id;
      if (!id) return;
      const reply = prompt('請輸入要回覆給這篇貼文的內容 (留白代表純通過)：');
      if (reply !== null) {
        try {
          const res = await fetch(\`\${BASE_URL}/api/admin/posts/\${id}/approve\`, {
            method: 'PUT',
            headers: { 'Authorization': \`Bearer \${adminToken}\`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ reply })
          });
          const data = await res.json();
          if (data.success) {
            showToast('已審核並發布貼文');
            fetchAdminPosts(currentPage);
          } else {
            showToast(data.error || '審核失敗', 'error');
          }
        } catch (err) {
          showToast('連線錯誤', 'error');
        }
      }
    });
  });
`;

code = code.replace(
  "document.querySelectorAll('.hide-btn').forEach",
  approveListener + "\n  document.querySelectorAll('.hide-btn').forEach"
);

// Also we should update the filter tabs in HTML or just default to pending/all.
// The default in index.html is likely showing active.

fs.writeFileSync(path, code);
