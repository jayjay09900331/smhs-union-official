const fs = require('fs');
const path = '/Users/linjay/Projects/smhs-union-official/admin/index.html';
let html = fs.readFileSync(path, 'utf8');

// 1. Update the login section to include register
const loginSection = `        <h2>管理員登入</h2>
        <form id="login-form">
          <div class="form-group">
            <label for="username">帳號</label>
            <input type="text" id="username" required>
          </div>
          <div class="form-group">
            <label for="password">密碼</label>
            <input type="password" id="password" required>
          </div>
          <button type="submit" class="btn-primary" id="login-submit">登入</button>
        </form>`;

const newAuthSection = `        <h2 id="auth-title">管理員登入</h2>
        <!-- Login Form -->
        <form id="login-form">
          <div class="form-group">
            <label for="username">帳號</label>
            <input type="text" id="username" required>
          </div>
          <div class="form-group">
            <label for="password">密碼</label>
            <input type="password" id="password" required>
          </div>
          <button type="submit" class="btn-primary" id="login-submit">登入</button>
          <div class="auth-switch">
            還沒有帳號？ <a href="#" id="show-register">申請成為管理員</a>
          </div>
        </form>
        <!-- Register Form -->
        <form id="register-form" class="hidden">
          <div class="form-group">
            <label for="reg-name">顯示名稱</label>
            <input type="text" id="reg-name" required placeholder="例如：學生會會長">
          </div>
          <div class="form-group">
            <label for="reg-username">帳號</label>
            <input type="text" id="reg-username" required>
          </div>
          <div class="form-group">
            <label for="reg-password">密碼</label>
            <input type="password" id="reg-password" required>
          </div>
          <button type="submit" class="btn-primary" id="register-submit">送出申請</button>
          <div class="auth-switch">
            已有帳號？ <a href="#" id="show-login">返回登入</a>
          </div>
        </form>`;

html = html.replace(loginSection, newAuthSection);

// 2. Add sidebar link
const navList = `<ul class="sidebar-nav">
          <li><a href="#" data-target="dashboard-section" class="active">儀表板</a></li>
          <li><a href="#" data-target="posts-section">貼文管理</a></li>
          <li><a href="#" data-target="reports-section">檢舉處理</a></li>
          <li><a href="#" data-target="settings-section">設定</a></li>
        </ul>`;

const newNavList = `<ul class="sidebar-nav">
          <li><a href="#" data-target="dashboard-section" class="active">儀表板</a></li>
          <li><a href="#" data-target="posts-section">貼文管理</a></li>
          <li><a href="#" data-target="reports-section">檢舉處理</a></li>
          <li><a href="#" data-target="applications-section">管理員審核</a></li>
          <li><a href="#" data-target="settings-section">設定</a></li>
        </ul>`;

html = html.replace(navList, newNavList);

// 3. Add applications section
const settingsSection = `        <section id="settings-section" class="dashboard-section hidden">`;

const applicationsSection = `        <section id="applications-section" class="dashboard-section hidden">
          <h2>管理員審核</h2>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>申請人名稱</th>
                  <th>帳號</th>
                  <th>狀態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody id="applications-table-body">
                <!-- Applications will be rendered here -->
              </tbody>
            </table>
          </div>
        </section>

        <section id="settings-section" class="dashboard-section hidden">`;

html = html.replace(settingsSection, applicationsSection);

fs.writeFileSync(path, html);
