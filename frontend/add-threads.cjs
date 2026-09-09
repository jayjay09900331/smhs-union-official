const fs = require('fs');

const indexHtmlPath = '/Users/linjay/Projects/smhs-union-official/frontend/index.html';
let html = fs.readFileSync(indexHtmlPath, 'utf8');

const targetIG = `      <a href="https://www.instagram.com/smhs_sa/" target="_blank" class="fab-btn ig-btn" title="追蹤 Instagram" id="ig-link">
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      </a>`;

const newThreads = `      <a href="#" target="_blank" class="fab-btn threads-btn" title="追蹤 Threads" id="threads-link">
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z"/>
        </svg>
      </a>`;

html = html.replace(targetIG, targetIG + '\n' + newThreads);
fs.writeFileSync(indexHtmlPath, html);

const styleCssPath = '/Users/linjay/Projects/smhs-union-official/frontend/src/style.css';
let css = fs.readFileSync(styleCssPath, 'utf8');

const targetCss = `.ig-btn {
  background-color: #E1306C;
  color: white;
}
.ig-btn:hover {
  background-color: #C13584;
}`;

const newCss = `.ig-btn {
  background-color: #E1306C;
  color: white;
}
.ig-btn:hover {
  background-color: #C13584;
}
.threads-btn {
  background-color: #000000;
  color: white;
}
.threads-btn:hover {
  background-color: #333333;
}`;

css = css.replace(targetCss, newCss);
fs.writeFileSync(styleCssPath, css);
