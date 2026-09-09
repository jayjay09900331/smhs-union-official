const BASE_URL = location.hostname === 'localhost' ? 'http://localhost:8787' : 'https://smhs-union-official-api.sa-df9.workers.dev';

// Utils
function getToken() {
  return localStorage.getItem('adminToken');
}
function setToken(token: string) {
  localStorage.setItem('adminToken', token);
}
function removeToken() {
  localStorage.removeItem('adminToken');
}

function showToast(message: string, type: 'success'|'error'|'warning' = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div style="margin-right:0.5rem"><i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'exclamation-circle'}"></i></div> <div>${message}</div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers: { ...headers, ...options.headers }});
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        removeToken();
        updateScreenState();
        showToast('登入已過期，請重新登入', 'error');
        throw new Error('Unauthorized');
      }
      throw new Error(data.error || data.message || 'API 請求失敗');
    }
    return data;
  } catch (err: any) {
    throw err;
  }
}

function escapeHtml(unsafe: string) {
  return (unsafe || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function truncate(str: string, length = 30) {
  return str.length > length ? escapeHtml(str.substring(0, length)) + '...' : escapeHtml(str);
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('zh-TW');
}
function getStatusBadge(status: string) {
  switch (status) {
    case 'active': return '<span class="badge badge-success">活躍</span>';
    case 'approved': return '<span class="badge badge-success">已發布</span>';
    case 'hidden': return '<span class="badge badge-warning">已隱藏</span>';
    case 'deleted': return '<span class="badge badge-danger">已刪除</span>';
    case 'pending': return '<span class="badge badge-warning">待處理/審核</span>';
    case 'resolved': return '<span class="badge badge-success">已處理</span>';
    case 'dismissed': return '<span class="badge badge-default">已駁回</span>';
    default: return `<span class="badge badge-default">${status}</span>`;
  }
}

// Modal handling
let currentModalCb: ((res: boolean) => void) | null = null;
function showConfirmModal(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal-container')!;
    const content = document.getElementById('modal-content')!;
    content.innerHTML = `
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" id="modal-x"><i class="fas fa-times"></i></button>
      </div>
      <div class="modal-body">
        <p>${message}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="modal-cancel">取消</button>
        <button class="btn btn-primary" id="modal-confirm">確認</button>
      </div>
    `;
    modal.classList.remove('hidden');
    
    const close = (res: boolean) => {
      modal.classList.add('hidden');
      resolve(res);
    };
    document.getElementById('modal-x')!.onclick = () => close(false);
    document.getElementById('modal-cancel')!.onclick = () => close(false);
    document.getElementById('modal-confirm')!.onclick = () => close(true);
  });
}
function showCustomModal(title: string, bodyHtml: string) {
  const modal = document.getElementById('modal-container')!;
  const content = document.getElementById('modal-content')!;
  content.innerHTML = `
    <div class="modal-header">
      <h3>${title}</h3>
      <button class="modal-close" onclick="document.getElementById('modal-container').classList.add('hidden')"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">
      ${bodyHtml}
    </div>
  `;
  modal.classList.remove('hidden');
}
(window as any).closeModal = () => document.getElementById('modal-container')!.classList.add('hidden');

// View state
let currentView = 'dashboard';
const views = ['dashboard', 'posts', 'reports', 'settings'];

function switchView(view: string) {
  if (!views.includes(view)) view = 'dashboard';
  currentView = view;
  
  views.forEach(v => {
    document.getElementById(`view-${v}`)?.classList.add('hidden');
    document.querySelector(`.nav-item[data-target="${v}"]`)?.classList.remove('active');
  });
  
  document.getElementById(`view-${view}`)?.classList.remove('hidden');
  document.querySelector(`.nav-item[data-target="${view}"]`)?.classList.add('active');
  
  const titles: Record<string, string> = {
    dashboard: '儀表板',
    posts: '貼文管理',
    reports: '檢舉處理',
    settings: '設定'
  };
  document.getElementById('page-title')!.innerText = titles[view] || '管理後台';
  
  loadViewData(view);
}

function updateScreenState() {
  if (getToken()) {
    document.getElementById('login-screen')!.classList.add('hidden');
    document.getElementById('app-screen')!.classList.remove('hidden');
    const hash = location.hash.replace('#', '');
    switchView(hash || 'dashboard');
  } else {
    document.getElementById('login-screen')!.classList.remove('hidden');
    document.getElementById('app-screen')!.classList.add('hidden');
  }
}

// Data Loading
async function loadViewData(view: string) {
  const container = document.getElementById(`view-${view}`)!;
  if (view === 'settings') return; // Static form
  
  container.innerHTML = `<div class="loading-container"><div class="spinner"></div><p style="margin-top:1rem">載入中...</p></div>`;
  
  try {
    if (view === 'dashboard') await renderDashboard(container);
    else if (view === 'posts') await renderPosts(container);
    else if (view === 'reports') await renderReports(container);
  } catch (err: any) {
    container.innerHTML = `<div class="card"><div class="card-body" style="color:var(--danger)">載入失敗: ${escapeHtml(err.message)}</div></div>`;
  }
}

// Dashboard
async function renderDashboard(container: HTMLElement) {
  const data = await apiFetch('/api/admin/stats');
  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon green"><i class="fas fa-file-alt"></i></div>
        <div class="stat-content">
          <h4>活躍貼文數</h4>
          <p>${data.activePosts || 0}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow"><i class="fas fa-eye-slash"></i></div>
        <div class="stat-content">
          <h4>已隱藏貼文</h4>
          <p>${data.hiddenPosts || 0}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red"><i class="fas fa-flag"></i></div>
        <div class="stat-content">
          <h4>待處理檢舉</h4>
          <p>${data.pendingReports || 0}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue"><i class="fas fa-comments"></i></div>
        <div class="stat-content">
          <h4>總留言數</h4>
          <p>${data.totalComments || 0}</p>
        </div>
      </div>
    </div>
  `;
}

// Posts
let postsStatus = 'all';
let postsPage = 1;
async function renderPosts(container: HTMLElement) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="tabs" style="margin-bottom:0; border-bottom:none">
          <div class="tab ${postsStatus==='all'?'active':''}" onclick="setPostsStatus('all')">全部</div>
          <div class="tab ${postsStatus==='pending'?'active':''}" onclick="setPostsStatus('pending')">待審核</div>
          <div class="tab ${postsStatus==='approved'?'active':''}" onclick="setPostsStatus('approved')">已發布</div>
          
          <div class="tab ${postsStatus==='hidden'?'active':''}" onclick="setPostsStatus('hidden')">已隱藏</div>
          <div class="tab ${postsStatus==='deleted'?'active':''}" onclick="setPostsStatus('deleted')">已刪除</div>
        </div>
      </div>
      <div class="card-body" style="padding:0">
        <div id="posts-table-container">
          <div class="loading-container"><div class="spinner"></div></div>
        </div>
      </div>
    </div>
  `;
  
(window as any).approvePost = async (id: number) => {
  const reply = prompt('請輸入要回覆給這篇貼文的內容 (留白代表純通過)：');
  if (reply === null) return;
  try {
    const res = await apiFetch(`/api/admin/posts/${id}/approve`, {
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

  (window as any).setPostsStatus = (status: string) => { postsStatus = status; postsPage = 1; fetchPosts(); };
  await fetchPosts();
}

async function fetchPosts() {
  const container = document.getElementById('posts-table-container');
  if (!container) return;
  try {
    container.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;
    const res = await apiFetch(`/api/admin/posts?status=${postsStatus}&page=${postsPage}`);
    const posts = res.posts || [];
    
    if (posts.length === 0) {
      container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-light)">無資料</div>`;
      return;
    }
    
    let html = `
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>內容</th>
              <th>分類</th>
              <th>IP Hash</th>
              <th>狀態</th>
              <th>按讚 / 留言</th>
              <th>建立時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
    `;
    posts.forEach((p: any) => {
      html += `
        <tr>
          <td>#${p.id}</td>
          <td style="cursor:pointer; color:var(--primary)" onclick="viewPostDetail(${p.id})">${truncate(p.content, 40)}</td>
          <td>${escapeHtml(p.category || '-')}</td>
          <td>${(p.ip_hash || '').substring(0,8)}...</td>
          <td>${getStatusBadge(p.status)}</td>
          <td>👍 ${p.likes} / 💬 ${p.comments_count || 0}</td>
          <td>${formatDate(p.created_at)}</td>
          <td>
            <div class="actions">
              ${p.status === 'pending' ? `<button class="btn btn-sm btn-success" onclick="approvePost(${p.id})">審核並回覆</button>` : ''}
              ${p.status === 'approved' || p.status === 'active' ? `<button class="btn btn-sm btn-warning" onclick="updatePostStatus(${p.id}, 'hide')">隱藏</button>` : ''}
              ${p.status === 'hidden' ? `<button class="btn btn-sm btn-success" onclick="updatePostStatus(${p.id}, 'restore')">恢復</button>` : ''}
              ${p.status !== 'deleted' ? `<button class="btn btn-sm btn-danger" onclick="deletePost(${p.id})">刪除</button>` : ''}
            </div>
          </td>
        </tr>
      `;
    });
    html += `</tbody></table></div>`;
    
    // pagination mock
    html += `
      <div class="pagination">
        <button class="page-btn" ${postsPage === 1 ? 'disabled' : ''} onclick="changePostsPage(-1)">上一頁</button>
        <span style="display:flex;align-items:center;padding:0 0.5rem">第 ${postsPage} 頁</span>
        <button class="page-btn" ${posts.length < 20 ? 'disabled' : ''} onclick="changePostsPage(1)">下一頁</button>
      </div>
      <div style="padding-bottom:1.5rem"></div>
    `;
    container.innerHTML = html;
  } catch (err: any) {
    container.innerHTML = `<div style="padding: 1rem; color: var(--danger)">${escapeHtml(err.message)}</div>`;
  }
}
(window as any).changePostsPage = (delta: number) => { postsPage += delta; fetchPosts(); };
(window as any).updatePostStatus = async (id: number, action: 'hide'|'restore') => {
  try {
    await apiFetch(`/api/admin/posts/${id}/${action}`, { method: 'PUT' });
    showToast(`成功${action === 'hide' ? '隱藏' : '恢復'}貼文`);
    fetchPosts();
  } catch (e: any) {
    showToast(e.message, 'error');
  }
};
(window as any).deletePost = async (id: number) => {
  if (await showConfirmModal('刪除貼文', '確定要刪除這篇貼文嗎？刪除後無法恢復。')) {
    try {
      await apiFetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
      showToast('貼文已刪除');
      fetchPosts();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  }
};
(window as any).viewPostDetail = async (id: number) => {
  showCustomModal(`貼文 #${id} 載入中`, `<div class="spinner"></div>`);
  try {
    const post = await apiFetch(`/api/posts/${id}`); // assuming public API for full details, or admin API
    let html = `
      <div class="post-detail-content">${escapeHtml(post.content)}</div>
      <div style="margin-bottom:1rem">
        ${getStatusBadge(post.status || 'active')}
        <span style="margin-left:1rem; color:var(--text-light)">👍 ${post.likes || 0}</span>
      </div>
      <h4>留言 (${(post.comments || []).length})</h4>
      <div class="comments-list" style="margin-top:1rem">
    `;
    if (!post.comments || post.comments.length === 0) {
      html += `<p style="color:var(--text-light)">尚無留言</p>`;
    } else {
      post.comments.forEach((c: any) => {
        html += `
          <div class="comment-item">
            <div class="comment-body">
              <div class="comment-meta">#${c.id} · ${(c.ip_hash || '').substring(0,8)}... · ${formatDate(c.created_at)}</div>
              <div>${escapeHtml(c.content)}</div>
            </div>
            <button class="btn btn-sm btn-danger" onclick="deleteComment(${id}, ${c.id})"><i class="fas fa-trash"></i></button>
          </div>
        `;
      });
    }
    html += `</div>`;
    showCustomModal(`貼文 #${id} 詳細資訊`, html);
  } catch (e: any) {
    showCustomModal('錯誤', `<p style="color:var(--danger)">${escapeHtml(e.message)}</p>`);
  }
};
(window as any).deleteComment = async (postId: number, commentId: number) => {
  if (confirm('確定要刪除此留言嗎？')) {
    try {
      await apiFetch(`/api/admin/comments/${commentId}`, { method: 'DELETE' });
      showToast('留言已刪除');
      (window as any).viewPostDetail(postId);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  }
};

// Reports
let reportsStatus = 'pending';
async function renderReports(container: HTMLElement) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="tabs" style="margin-bottom:0; border-bottom:none">
          <div class="tab ${reportsStatus==='pending'?'active':''}" onclick="setReportsStatus('pending')">待處理</div>
          <div class="tab ${reportsStatus==='resolved'?'active':''}" onclick="setReportsStatus('resolved')">已處理</div>
          <div class="tab ${reportsStatus==='dismissed'?'active':''}" onclick="setReportsStatus('dismissed')">已駁回</div>
        </div>
      </div>
      <div class="card-body" style="padding:0">
        <div id="reports-table-container">
          <div class="loading-container"><div class="spinner"></div></div>
        </div>
      </div>
    </div>
  `;
  (window as any).setReportsStatus = (status: string) => { reportsStatus = status; fetchReports(); };
  await fetchReports();
}
async function fetchReports() {
  const container = document.getElementById('reports-table-container');
  if (!container) return;
  try {
    container.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;
    const res = await apiFetch(`/api/admin/reports?status=${reportsStatus}`);
    const reports = res.reports || [];
    
    if (reports.length === 0) {
      container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-light)">無資料</div>`;
      return;
    }
    
    let html = `
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>檢舉原因</th>
              <th>貼文內容 (ID)</th>
              <th>檢舉時間</th>
              <th>狀態</th>
              ${reportsStatus === 'pending' ? '<th>操作</th>' : ''}
            </tr>
          </thead>
          <tbody>
    `;
    reports.forEach((r: any) => {
      html += `
        <tr>
          <td>#${r.id}</td>
          <td style="font-weight:500">${escapeHtml(r.reason)}</td>
          <td><a href="#" onclick="viewPostDetail(${r.post_id});return false;">#${r.post_id}</a> - ${truncate(r.post_content || '', 30)}</td>
          <td>${formatDate(r.created_at)}</td>
          <td>${getStatusBadge(r.status)}</td>
          ${reportsStatus === 'pending' ? `
          <td>
            <div class="actions">
              <button class="btn btn-sm btn-success" onclick="resolveReport(${r.id}, true)">隱藏貼文</button>
              <button class="btn btn-sm btn-secondary" onclick="resolveReport(${r.id}, false)">駁回</button>
            </div>
          </td>
          ` : ''}
        </tr>
      `;
    });
    html += `</tbody></table></div>`;
    container.innerHTML = html;
  } catch (err: any) {
    container.innerHTML = `<div style="padding: 1rem; color: var(--danger)">${escapeHtml(err.message)}</div>`;
  }
}
(window as any).resolveReport = async (id: number, hidePost: boolean) => {
  const actionName = hidePost ? '處理並隱藏貼文' : '駁回檢舉';
  if (await showConfirmModal('確認操作', `確定要「${actionName}」嗎？`)) {
    try {
      await apiFetch(`/api/admin/reports/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: hidePost ? 'resolved' : 'dismissed', hide_post: hidePost })
      });
      showToast('操作成功');
      fetchReports();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  updateScreenState();
  
  // Hash routing
  window.addEventListener('hashchange', () => {
    if (getToken()) {
      switchView(location.hash.replace('#', '') || 'dashboard');
    }
  });

  // Login
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn') as HTMLButtonElement;
    btn.disabled = true;
    btn.innerText = '登入中...';
    
    try {
      const res = await fetch(`${BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: (document.getElementById('username') as HTMLInputElement).value,
          password: (document.getElementById('password') as HTMLInputElement).value
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '登入失敗');
      
      setToken(data.token);
      showToast('登入成功');
      updateScreenState();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerText = '登入';
    }
  });

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    removeToken();
    location.hash = '';
    updateScreenState();
    showToast('已登出');
  });

  // Mobile menu
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.querySelector('.sidebar')?.classList.toggle('show');
  });

  // Change Password
  document.getElementById('password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldP = (document.getElementById('old-password') as HTMLInputElement).value;
    const newP = (document.getElementById('new-password') as HTMLInputElement).value;
    const confP = (document.getElementById('confirm-password') as HTMLInputElement).value;
    
    if (newP !== confP) {
      showToast('新密碼與確認密碼不符', 'error');
      return;
    }
    
    const btn = document.getElementById('change-pwd-btn') as HTMLButtonElement;
    btn.disabled = true;
    btn.innerText = '更新中...';
    
    try {
      await apiFetch('/api/admin/password', {
        method: 'PUT',
        body: JSON.stringify({ oldPassword: oldP, newPassword: newP })
      });
      showToast('密碼更新成功');
      (document.getElementById('password-form') as HTMLFormElement).reset();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerText = '更新密碼';
    }
  });
});
