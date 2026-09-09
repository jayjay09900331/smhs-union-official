const fs = require('fs');
const path = '/Users/linjay/Projects/smhs-union-official/admin/src/main.ts';
let code = fs.readFileSync(path, 'utf8');

const initAppTarget = `  // Init Listeners
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {`;

const authSwitchCode = `  // Auth Switch & Register
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  document.getElementById('show-register')?.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm?.classList.add('hidden');
    registerForm?.classList.remove('hidden');
    document.getElementById('auth-title')!.textContent = '申請成為管理員';
  });

  document.getElementById('show-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm?.classList.add('hidden');
    loginForm?.classList.remove('hidden');
    document.getElementById('auth-title')!.textContent = '管理員登入';
  });

  registerForm?.addEventListener('submit', async (e) => {
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
      
      showToast('申請已送出，請等候管理員核准！');
      (registerForm as HTMLFormElement).reset();
      document.getElementById('show-login')?.click();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '送出申請';
    }
  });

  // Init Listeners
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {`;

code = code.replace(initAppTarget, authSwitchCode);

// Add applications-section logic
const sidebarTarget = `        case 'settings-section':
          break;`;

const newSidebar = `        case 'settings-section':
          break;
        case 'applications-section':
          renderApplications();
          break;`;
code = code.replace(sidebarTarget, newSidebar);


const apiFuncs = `// --------------------------
// Applications
// --------------------------
async function renderApplications() {
  const tbody = document.getElementById('applications-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">載入中...</td></tr>';
  
  try {
    const data = await apiFetch('/api/admin/applications');
    const apps = data.applications || [];
    if (apps.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">目前沒有待審核的申請</td></tr>';
      return;
    }
    
    tbody.innerHTML = '';
    apps.forEach((app: any) => {
      const tr = document.createElement('tr');
      tr.innerHTML = \`
        <td>\${app.name}</td>
        <td>\${app.username}</td>
        <td><span class="status-badge status-pending" style="color:orange;">待審核</span></td>
        <td>
          <button class="btn-approve" data-username="\${app.username}">核准</button>
          <button class="btn-reject" data-username="\${app.username}">駁回</button>
        </td>
      \`;
      tbody.appendChild(tr);
    });
    
    tbody.querySelectorAll('.btn-approve').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const username = (e.target as HTMLElement).getAttribute('data-username')!;
        if (confirm(\`確定要核准 \${username} 成為管理員嗎？\`)) {
          await handleApplication(username, 'approve');
        }
      });
    });
    
    tbody.querySelectorAll('.btn-reject').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const username = (e.target as HTMLElement).getAttribute('data-username')!;
        if (confirm(\`確定要駁回 \${username} 的申請嗎？\`)) {
          await handleApplication(username, 'reject');
        }
      });
    });
    
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:red;">載入失敗</td></tr>';
  }
}

async function handleApplication(username: string, action: 'approve' | 'reject') {
  try {
    const data = await apiFetch(\`/api/admin/applications/\${username}\`, {
      method: 'PUT',
      body: JSON.stringify({ action })
    });
    showToast(data.message || '操作成功');
    renderApplications();
  } catch (err: any) {
    showToast(err.message, 'error');
  }
}

`;

code = code.replace(`function initApp() {`, apiFuncs + `\nfunction initApp() {`);

fs.writeFileSync(path, code);
