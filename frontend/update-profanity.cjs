const fs = require('fs');
const path = '/Users/linjay/Projects/smhs-union-official/frontend/src/main.ts';
let ts = fs.readFileSync(path, 'utf8');

// Replace the submit handler to check profanity
const submitStart = `  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (postContent.value.trim().length === 0) return;`;

const profanityCheck = `
    const contentText = postContent.value.trim();
    const profanityWords = ['幹', '靠北', '三字經', '機掰', '傻逼', '智障', '尼哥', '婊子', '狗娘養', '草泥馬', '草你媽', 'fuck', 'shit', 'damn', 'bitch', 'asshole', 'dick', 'pussy', 'wtf', 'stfu', '死全家', '低能', '腦殘', '弱智', '外勞', '番仔', 'gay', '死玻璃', '台女', '母豬'];
    
    // Normalize and check
    const normalizeText = (text) => text.toLowerCase().replace(/\\s+/g, '').replace(/[～~!@#$%\^&\*()\\-_=+\\.。,，]+/g, '');
    const normalizedContent = normalizeText(contentText);
    
    const foundProfanity = profanityWords.find(word => normalizedContent.includes(normalizeText(word)));
    if (foundProfanity) {
      showToast('⚠️ 請注意您的用詞，內容包含不當用語，無法送出！', 'error');
      return;
    }
`;

ts = ts.replace(submitStart, submitStart + profanityCheck);
fs.writeFileSync(path, ts);
