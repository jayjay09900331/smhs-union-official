const fs = require("fs");
const path = "./src/main.ts";
let code = fs.readFileSync(path, "utf8");

// statusMap
code = code.replace(/const statusMap: Record<string, string> = \{[^\}]+\};/, "const statusMap: Record<string, string> = { active: '活躍', hidden: '已隱藏', deleted: '已刪除', pending: '待審核', 'approved': '已發布' };");

// colorMap
code = code.replace(/const statusColor: Record<string, string> = \{[^\}]+\};/, "const statusColor: Record<string, string> = { active: 'bg-green-100 text-green-800', hidden: 'bg-yellow-100 text-yellow-800', deleted: 'bg-red-100 text-red-800', pending: 'bg-orange-100 text-orange-800', approved: 'bg-green-100 text-green-800' };");

// Update table actions
code = code.replace(/<button class="action-btn hide-btn" data-id="\$\{post\.id\}">隱藏<\/button>/, `
  \${post.status === 'pending' ? \`<button class="action-btn approve-btn" style="background:var(--primary);color:white;border:none;padding:2px 8px;border-radius:4px" data-id="\${post.id}">審核並回覆</button>\` : ''}
  \${post.status === 'approved' || post.status === 'active' ? \`<button class="action-btn hide-btn" data-id="\${post.id}">隱藏</button>\` : ''}
`);

// Inject event listener for approve
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

code = code.replace(/document\.querySelectorAll\('\.hide-btn'\)\.forEach/, approveListener + "\n  document.querySelectorAll('.hide-btn').forEach");

// Fix HTML tabs default to all instead of pending, actually the tabs in admin are static.
// Let's also add 'pending' to the DOM filter options.
fs.writeFileSync(path, code);
