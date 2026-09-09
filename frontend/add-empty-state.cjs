const fs = require('fs');
const path = '/Users/linjay/Projects/smhs-union-official/frontend/src/main.ts';
let code = fs.readFileSync(path, 'utf8');

const targetLoadPosts = `    posts = [...posts, ...newPosts];
    hasMore = result.hasMore;
    
    renderNewPosts(newPosts);`;

const replacementLoadPosts = `    posts = [...posts, ...newPosts];
    hasMore = result.hasMore;
    
    if (posts.length === 0) {
      postsContainer.innerHTML = \`
        <div class="empty-state" style="text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 48px; height: 48px; margin: 0 auto 1rem auto; opacity: 0.5;">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          <p style="font-size: 1.25rem; font-weight: 500; margin-bottom: 0.5rem;">目前尚無貼文</p>
          <p style="font-size: 0.95rem; opacity: 0.8;">來成為第一個發文的人吧！</p>
        </div>
      \`;
    } else {
      renderNewPosts(newPosts);
    }`;

code = code.replace(targetLoadPosts, replacementLoadPosts);
fs.writeFileSync(path, code);
