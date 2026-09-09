const fs = require('fs');
const path = '/Users/linjay/Projects/smhs-union-official/frontend/src/style.css';
let css = fs.readFileSync(path, 'utf8');

// Change from 2 columns to 1 column to make posts maximum width
css = css.replace(/grid-template-columns: repeat\(2, 1fr\);/g, 'grid-template-columns: 1fr;');

// Increase base font size for post-card from 1.05rem to 1.25rem and padding from 1.25rem to 2rem
css = css.replace(
  /\.post-card \{\s*height: 100%;\s*display: flex;\s*flex-direction: column;\s*font-size: 1\.05rem;\s*\}/,
  `.post-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-size: 1.25rem;
}`
);

// If there's an older .post-card rule setting padding
css = css.replace(
  /padding: 1\.25rem;/g,
  'padding: 2rem;'
);

// Remove the 900px media query since it's already 1 column
css = css.replace(
  /@media \(max-width: 900px\) \{\s*\.posts-container \{\s*grid-template-columns: repeat\(2, 1fr\);\s*\}\s*\}/g,
  ''
);

// Update max-width to 100% and reduce padding of the wrapper so cards stretch more
css = css.replace(
  /max-width: 1600px; width: 98%; padding: 2rem;/,
  'width: 100%; padding: 1.5rem;'
);

fs.writeFileSync(path, css);
