const fs = require('fs');
const path = '/Users/linjay/Projects/smhs-union-official/frontend/src/style.css';
let css = fs.readFileSync(path, 'utf8');

css = css.replace(
  /(\.container\s*\{\s*)max-width: 700px;/,
  '$1max-width: 1600px; width: 98%;'
);

fs.writeFileSync(path, css);
