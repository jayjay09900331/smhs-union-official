const fs = require('fs');
const path = '/Users/linjay/Projects/smhs-union-official/backend/src/index.ts';
let ts = fs.readFileSync(path, 'utf8');

// Replace backend PROFANITY_LIST
const oldProfanity = `const PROFANITY_LIST = [
  '幹', '靠北', '三字經', '機掰', '傻逼', '智障',
  '草泥馬', '草你媽',
  'fuck', 'shit', 'damn', 'bitch', 'asshole', 'dick', 'pussy',
  'wtf', 'stfu',
];`;

const newProfanity = `const PROFANITY_LIST = [
  '幹', '靠北', '三字經', '機掰', '傻逼', '智障', 
  '草泥馬', '草你媽', '死全家', '低能', '腦殘', '弱智',
  '尼哥', '婊子', '狗娘養', '外勞', '番仔', 'gay', '死玻璃', '台女', '母豬',
  'fuck', 'shit', 'damn', 'bitch', 'asshole', 'dick', 'pussy',
  'wtf', 'stfu',
];`;

ts = ts.replace(oldProfanity, newProfanity);

// Add custom error message to posts
ts = ts.replace(
  "return c.json({ error: '內容包含不當用語，請修改後重新發布' }, 400);",
  "return c.json({ error: '⚠️ 請注意您的用詞！內容包含不當用語，無法送出！' }, 400);"
);

// Add custom error message to comments
ts = ts.replace(
  "return c.json({ error: '留言包含不當用語，請修改後重新發布' }, 400);",
  "return c.json({ error: '⚠️ 請注意您的用詞！留言包含不當用語，無法送出！' }, 400);"
);

fs.writeFileSync(path, ts);
