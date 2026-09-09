const fs = require('fs');
const path = '/Users/linjay/Projects/smhs-union-official/admin/src/main.ts';
let ts = fs.readFileSync(path, 'utf8');

// 1. Add "詳細" button to post actions
const actionTarget = `<div class="actions">
              \${p.status === 'pending' ? \`<button class="btn btn-sm btn-success" onclick="approvePost(\${p.id})">審核並回覆</button>\` : ''}
              \${p.status === 'approved' || p.status === 'active' ? \`<button class="btn btn-sm btn-warning" onclick="updatePostStatus(\${p.id}, 'hide')">隱藏</button>\` : ''}
              \${p.status === 'hidden' ? \`<button class="btn btn-sm btn-success" onclick="updatePostStatus(\${p.id}, 'restore')">恢復</button>\` : ''}
              \${p.status !== 'deleted' ? \`<button class="btn btn-sm btn-danger" onclick="deletePost(\${p.id})">刪除</button>\` : ''}
            </div>`;

const actionReplacement = `<div class="actions">
              <button class="btn btn-sm btn-primary" onclick="viewPostDetail(\${p.id})">查看詳細/留言</button>
              \${p.status === 'pending' ? \`<button class="btn btn-sm btn-success" onclick="approvePost(\${p.id})">審核並回覆</button>\` : ''}
              \${p.status === 'approved' || p.status === 'active' ? \`<button class="btn btn-sm btn-warning" onclick="updatePostStatus(\${p.id}, 'hide')">隱藏</button>\` : ''}
              \${p.status === 'hidden' ? \`<button class="btn btn-sm btn-success" onclick="updatePostStatus(\${p.id}, 'restore')">恢復</button>\` : ''}
              \${p.status !== 'deleted' ? \`<button class="btn btn-sm btn-danger" onclick="deletePost(\${p.id})">刪除</button>\` : ''}
            </div>`;

ts = ts.replace(actionTarget, actionReplacement);

// 2. Put tools in Dashboard. We can just load Posts and Reports right into the Dashboard view!
// In renderDashboard, append posts and reports.
const targetRenderDash = `    </div>
  \`;
}`;
const replaceRenderDash = `    </div>
    
    <div style="margin-top: 2rem;">
      <h3 style="margin-bottom: 1rem; border-bottom: 2px solid var(--border); padding-bottom: 0.5rem;">快速管理貼文</h3>
      <div id="dash-posts-container"></div>
    </div>
    
    <div style="margin-top: 2rem;">
      <h3 style="margin-bottom: 1rem; border-bottom: 2px solid var(--border); padding-bottom: 0.5rem;">快速處理檢舉</h3>
      <div id="dash-reports-container"></div>
    </div>
  \`;
  
  // Also render them inside dashboard!
  renderPosts(document.getElementById('dash-posts-container')!);
  renderReports(document.getElementById('dash-reports-container')!);
}`;
ts = ts.replace(targetRenderDash, replaceRenderDash);

fs.writeFileSync(path, ts);
