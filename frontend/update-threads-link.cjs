const fs = require('fs');
const path = '/Users/linjay/Projects/smhs-union-official/frontend/index.html';
let html = fs.readFileSync(path, 'utf8');

html = html.replace(
  '<a href="https://www.threads.net/@smhs_sa" target="_blank" class="fab-btn threads-btn" title="追蹤 Threads" id="threads-link">',
  '<a href="https://www.threads.net/@smhs_sa?xmt=AQG0KtkO5KNFJnx93aGc2Pu4vOKVLer2jwNHIwOChDRFBTQ" target="_blank" class="fab-btn threads-btn" title="追蹤 Threads" id="threads-link">'
);

fs.writeFileSync(path, html);
