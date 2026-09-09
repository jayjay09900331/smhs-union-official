const fs = require('fs');

const newList = "['機掰', '傻逼', '智障', '尼哥', '婊子', '狗娘養', '草泥馬', '草你媽', 'fuck', 'shit', 'damn', 'bitch', 'asshole', 'dick', 'pussy', 'wtf', 'stfu', '死全家', '低能', '腦殘', '弱智', '外勞', '番仔', '死玻璃', '台女', '母豬','傻屌','憨Ｂ','憨B','憨兒']";
const newBackendList = "[\n  '機掰', '傻逼', '智障', '尼哥', '婊子', '狗娘養', '草泥馬', '草你媽', 'fuck', 'shit', 'damn', 'bitch', 'asshole', 'dick', 'pussy', 'wtf', 'stfu', '死全家', '低能', '腦殘', '弱智', '外勞', '番仔', '死玻璃', '台女', '母豬', '傻屌', '憨Ｂ', '憨B', '憨兒'\n]";

const frontendPath = '/Users/linjay/Projects/smhs-union-official/frontend/src/main.ts';
let frontend = fs.readFileSync(frontendPath, 'utf8');
frontend = frontend.replace(/const profanityWords = \[.*?\];/g, "const profanityWords = " + newList + ";");
fs.writeFileSync(frontendPath, frontend);

const backendPath = '/Users/linjay/Projects/smhs-union-official/backend/src/index.ts';
let backend = fs.readFileSync(backendPath, 'utf8');
backend = backend.replace(/const PROFANITY_LIST = \[\s*[\s\S]*?\s*\];/g, "const PROFANITY_LIST = " + newBackendList + ";");
fs.writeFileSync(backendPath, backend);
