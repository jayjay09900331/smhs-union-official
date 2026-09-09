const fs = require("fs");
const path = "./src/main.ts";
let code = fs.readFileSync(path, "utf8");

// Add admin_reply to interface
code = code.replace(
  "likes: number;",
  "likes: number;\n  admin_reply?: string;"
);

// 1. Update Greeting to be more human
const oldGreeting = `
function updateGreeting() {
  const greetingEl = document.getElementById("dynamic-greeting");
  if (!greetingEl) return;
  const hour = new Date().getHours();
  if (hour < 12) greetingEl.textContent = "早安";
  else if (hour < 18) greetingEl.textContent = "午安";
  else greetingEl.textContent = "晚安";
}
`;
const newGreeting = `
function updateGreeting() {
  const greetingEl = document.getElementById("dynamic-greeting");
  if (!greetingEl) return;
  const hour = new Date().getHours();
  if (hour < 12) greetingEl.textContent = "早安，今天過得好嗎？";
  else if (hour < 18) greetingEl.textContent = "午安，吃飽了嗎？";
  else greetingEl.textContent = "晚安，今天辛苦了！";
}
`;
if (code.includes(oldGreeting.trim())) {
  code = code.replace(oldGreeting.trim(), newGreeting.trim());
} else {
  // Try regex replace if exact match fails
  code = code.replace(/function updateGreeting\(\) \{[\s\S]*?\}/, newGreeting.trim());
}

// 2. Client-side Profanity Filter
const oldSubmitHandler = `
  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (postContent.value.trim().length === 0) return;
`;

const badWordsStr = "['幹', '靠杯', '靠北', '雞掰', '機掰', '媽的', '白痴', '智障', '白癡', '三字經', '垃圾']";
const newSubmitHandler = `
  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const content = postContent.value.trim();
    if (content.length === 0) return;

    const badWords = ${badWordsStr};
    if (badWords.some(w => content.includes(w))) {
      showToast('包含不當用語，為維持社群環境無法送出！', 'error');
      return;
    }
`;
code = code.replace(oldSubmitHandler, newSubmitHandler);

// 3. Update renderNewPosts to show exact time and admin reply
// We'll replace formatRelativeTime with a more exact formatter or use both.
// Let's modify formatRelativeTime or directly inject date into HTML.

const adminReplyInject = `
        </div>
      </div>
      <p class="post-content">\${escapeHtml(post.content)}</p>
      \${post.admin_reply ? \`<div class="admin-reply-box"><strong>✅ 學生會回覆：</strong>\${escapeHtml(post.admin_reply)}</div>\` : ''}
      <div class="post-footer">
`;
// Let's replace the existing HTML generation snippet inside renderNewPosts
// We look for `<p class="post-content">${escapeHtml(post.content)}</p>` and add admin reply.
code = code.replace(/<p class="post-content">\$\{escapeHtml\(post\.content\)\}<\/p>/g, `
      <p class="post-content">\${escapeHtml(post.content).replace(/\\n/g, '<br>')}</p>
      \${post.admin_reply ? \`<div class="admin-reply-box"><strong>✅ 學生會回覆：</strong><br>\${escapeHtml(post.admin_reply).replace(/\\n/g, '<br>')}</div>\` : ''}
`);

// 4. Change time formatting in renderNewPosts to include absolute time
// Replace formatRelativeTime(post.created_at) with exact time string
const newTimeFormat = `
        <span class="post-time" title="\${new Date(post.created_at).toLocaleString('zh-TW')}">
          \${new Date(post.created_at).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
`;
code = code.replace(/<span class="post-time">\$\{formatRelativeTime\(post\.created_at\)\}<\/span>/g, newTimeFormat);

fs.writeFileSync(path, code);
