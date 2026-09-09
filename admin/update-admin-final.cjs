const fs = require("fs");
const path = "./src/main.ts";
let code = fs.readFileSync(path, "utf8");

// 1. Update Tabs
code = code.replace(
  "<div class=\"tab ${postsStatus==='all'?'active':''}\" onclick=\"setPostsStatus('all')\">全部</div>",
  "<div class=\"tab ${postsStatus==='all'?'active':''}\" onclick=\"setPostsStatus('all')\">全部</div>\\n          <div class=\"tab ${postsStatus==='pending'?'active':''}\" onclick=\"setPostsStatus('pending')\">待審核</div>\\n          <div class=\"tab ${postsStatus==='approved'?'active':''}\" onclick=\"setPostsStatus('approved')\">已發布</div>"
);

// Remove the old 'active' tab as it's confusing now (or we can keep it if old posts are active)
// We already migrated to 'approved'.
code = code.replace(
  "<div class=\"tab ${postsStatus==='active'?'active':''}\" onclick=\"setPostsStatus('active')\">活躍</div>",
  ""
);

// 2. Update Badge
code = code.replace(
  "case 'active': return '<span class=\"badge badge-success\">活躍</span>';",
  "case 'active': return '<span class=\"badge badge-success\">活躍</span>';\\n    case 'approved': return '<span class=\"badge badge-success\">已發布</span>';"
);
// replace 'pending' badge text to 待處理 / 待審核
code = code.replace(
  "case 'pending': return '<span class=\"badge badge-warning\">待處理</span>';",
  "case 'pending': return '<span class=\"badge badge-warning\">待處理/審核</span>';"
);

// 3. Update Action Buttons
const oldActions = "${p.status === 'active' ? `<button class=\"btn btn-sm btn-warning\" onclick=\"updatePostStatus(${p.id}, 'hide')\">隱藏</button>` : ''}";
const newActions = "${p.status === 'pending' ? `<button class=\"btn btn-sm btn-success\" onclick=\"approvePost(${p.id})\">審核並回覆</button>` : ''}\n              ${p.status === 'approved' || p.status === 'active' ? `<button class=\"btn btn-sm btn-warning\" onclick=\"updatePostStatus(${p.id}, 'hide')\">隱藏</button>` : ''}";
code = code.replace(oldActions, newActions);

// 4. Add approvePost function to window
const approveFn = `
(window as any).approvePost = async (id: number) => {
  const reply = prompt('請輸入要回覆給這篇貼文的內容 (留白代表純通過)：');
  if (reply === null) return;
  try {
    const res = await apiFetch(\`/api/admin/posts/\${id}/approve\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    });
    if (res.success) {
      showToast('已審核並發布貼文');
      fetchPosts();
    }
  } catch (err) {
    showToast('連線錯誤', 'error');
  }
};
`;

code = code.replace(
  "(window as any).setPostsStatus =",
  approveFn + "\n  (window as any).setPostsStatus ="
);

fs.writeFileSync(path, code);
