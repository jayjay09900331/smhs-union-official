const fs = require('fs');
const path = '/Users/linjay/Projects/smhs-union-official/admin/src/main.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Auth Switch Logic & Register Logic
const DOMContentLoadedStart = `document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const loginView = document.getElementById('login-view')!;`;

const elementsToAdd = `
  const loginForm = document.getElementById('login-form') as HTMLFormElement;
  const registerForm = document.getElementById('register-form') as HTMLFormElement;
  const showRegisterLink = document.getElementById('show-register')!;
  const showLoginLink = document.getElementById('show-login')!;
  const authTitle = document.getElementById('auth-title')!;
  
  const applicationsTableBody = document.getElementById('applications-table-body')!;
`;

const loginEvent = `  loginForm.addEventListener('submit', async (e) => {`;

const newAuthLogic = `  // Auth Switch
  showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    authTitle.textContent = '申請成為管理員';
  });

  showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    authTitle.textContent = '管理員登入';
  });

  // Register Form Submit
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (document.getElementById('reg-name') as HTMLInputElement).value;
    const username = (document.getElementById('reg-username') as HTMLInputElement).value;
    const password = (document.getElementById('reg-password') as HTMLInputElement).value;
    const submitBtn = document.getElementById('register-submit') as HTMLButtonElement;
    
    submitBtn.disabled = true;
    submitBtn.textContent = '送出中...';
    
    try {
      const res = await fetch(\`\${BASE_URL}/api/admin/register\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || '申請失敗');
      
      showToast('申請已送出，請等候管理員核准！', 'success');
      registerForm.reset();
      showLoginLink.click();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '送出申請';
    }
  });

  // Login Form Submit
  loginForm.addEventListener('submit', async (e) => {`;

code = code.replace(loginEvent, newAuthLogic);
code = code.replace(`const loginForm = document.getElementById('login-form') as HTMLFormElement;`, elementsToAdd);

// 2. Fetch and render applications
const sidebarNavClick = `        case 'settings-section':
          // Settings doesn't need to fetch data on load
          break;`;

const newSidebarNavClick = `        case 'settings-section':
          break;
        case 'applications-section':
          renderApplications();
          break;`;

code = code.replace(sidebarNavClick, newSidebarNavClick);

// 3. Applications API Functions
const apiFunctionsArea = `// ==========================================
// API Functions
// ==========================================`;

const applicationsFunctions = `
async function fetchApplications() {
  const res = await fetch(\`\${BASE_URL}/api/admin/applications\`, {
    headers: { 'Authorization': \`Bearer \${adminToken}\` }
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) logout();
    throw new Error('Failed to fetch applications');
  }
  const data = await res.json();
  return data.applications;
}

async function handleApplication(username: string, action: 'approve' | 'reject') {
  try {
    const res = await fetch(\`\${BASE_URL}/api/admin/applications/\${username}\`, {
      method: 'PUT',
      headers: { 
        'Authorization': \`Bearer \${adminToken}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '操作失敗');
    
    showToast(data.message, 'success');
    renderApplications();
  } catch (err: any) {
    showToast(err.message, 'error');
  }
}

async function renderApplications() {
  const tbody = document.getElementById('applications-table-body')!;
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">載入中...</td></tr>';
  
  try {
    const apps = await fetchApplications();
    if (apps.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">目前沒有待審核的申請</td></tr>';
      return;
    }
    
    tbody.innerHTML = '';
    apps.forEach((app: any) => {
      const tr = document.createElement('tr');
      tr.innerHTML = \`
        <td>\${escapeHTML(app.name)}</td>
        <td>\${escapeHTML(app.username)}</td>
        <td><span class="status-badge status-pending">待審核</span></td>
        <td>
          <button class="btn-approve" data-username="\${escapeHTML(app.username)}">核准</button>
          <button class="btn-reject" data-username="\${escapeHTML(app.username)}">駁回</button>
        </td>
      \`;
      tbody.appendChild(tr);
    });
    
    // Bind buttons
    tbody.querySelectorAll('.btn-approve').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const username = (e.target as HTMLElement).getAttribute('data-username')!;
        if (confirm(\`確定要核准 \${username} 成為管理員嗎？\`)) {
          handleApplication(username, 'approve');
        }
      });
    });
    
    tbody.querySelectorAll('.btn-reject').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const username = (e.target as HTMLElement).getAttribute('data-username')!;
        if (confirm(\`確定要駁回 \${username} 的申請嗎？\`)) {
          handleApplication(username, 'reject');
        }
      });
    });
    
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:red;">載入失敗</td></tr>';
  }
}
`;

code = code.replace(apiFunctionsArea, apiFunctionsArea + applicationsFunctions);

fs.writeFileSync(path, code);
