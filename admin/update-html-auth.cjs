const fs = require('fs');
const path = '/Users/linjay/Projects/smhs-union-official/admin/index.html';
let html = fs.readFileSync(path, 'utf8');

const oldLogin = `<div class="login-header">
        <h2>管理員登入</h2>
        <p>海星學生會官方匿名板</p>
      </div>
      <form id="login-form">
        <div class="form-group">
          <label for="username">使用者名稱</label>
          <input type="text" id="username" required placeholder="請輸入帳號">
        </div>
        <div class="form-group">
          <label for="password">密碼</label>
          <input type="password" id="password" required placeholder="請輸入密碼">
        </div>
        <button type="submit" class="btn btn-primary btn-block" id="login-btn">登入</button>
      </form>`;

const newAuth = `<div class="login-header">
        <h2 id="auth-title">管理員登入</h2>
        <p>海星學生會官方匿名板</p>
      </div>
      <form id="login-form">
        <div class="form-group">
          <label for="username">使用者名稱</label>
          <input type="text" id="username" required placeholder="請輸入帳號">
        </div>
        <div class="form-group">
          <label for="password">密碼</label>
          <input type="password" id="password" required placeholder="請輸入密碼">
        </div>
        <button type="submit" class="btn btn-primary btn-block" id="login-btn">登入</button>
        <div class="auth-switch">
          還沒有帳號？ <a href="#" id="show-register">申請成為管理員</a>
        </div>
      </form>
      
      <form id="register-form" class="hidden">
        <div class="form-group">
          <label for="reg-name">顯示名稱</label>
          <input type="text" id="reg-name" required placeholder="例如：學生會會長">
        </div>
        <div class="form-group">
          <label for="reg-username">帳號</label>
          <input type="text" id="reg-username" required placeholder="請輸入帳號">
        </div>
        <div class="form-group">
          <label for="reg-password">密碼</label>
          <input type="password" id="reg-password" required placeholder="請輸入密碼">
        </div>
        <button type="submit" class="btn btn-primary btn-block" id="register-submit">送出申請</button>
        <div class="auth-switch">
          已有帳號？ <a href="#" id="show-login">返回登入</a>
        </div>
      </form>`;

html = html.replace(oldLogin, newAuth);
fs.writeFileSync(path, html);
