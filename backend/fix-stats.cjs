const fs = require('fs');
const path = '/Users/linjay/Projects/smhs-union-official/backend/src/index.ts';
let ts = fs.readFileSync(path, 'utf8');

ts = ts.replace(
  "totalPosts: totalPosts || 0,",
  "activePosts: totalPosts || 0,"
);

fs.writeFileSync(path, ts);
