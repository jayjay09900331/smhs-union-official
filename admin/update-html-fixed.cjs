const fs = require('fs');
const path = '/Users/linjay/Projects/smhs-union-official/admin/index.html';
let html = fs.readFileSync(path, 'utf8');

// 1. Sidebar Nav
const reportsNav = `        <a href="#reports" class="nav-item" data-target="reports">
          <i class="fas fa-flag"></i> 檢舉處理
        </a>`;
const newReportsNav = `        <a href="#reports" class="nav-item" data-target="reports">
          <i class="fas fa-flag"></i> 檢舉處理
        </a>
        <a href="#applications" class="nav-item" data-target="applications">
          <i class="fas fa-user-shield"></i> 管理員審核
        </a>`;

html = html.replace(reportsNav, newReportsNav);

// 2. Sections
const settingsSection = `      <section id="view-settings" class="dashboard-section hidden">`;
const applicationsSection = `      <section id="view-applications" class="dashboard-section hidden">
        <div class="card">
          <div class="card-header">
            <h3>待審核名單</h3>
          </div>
          <div style="overflow-x:auto;">
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
        </div>
      </section>

      <section id="view-settings" class="dashboard-section hidden">`;

html = html.replace(settingsSection, applicationsSection);

fs.writeFileSync(path, html);
