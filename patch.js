const fs = require('fs');
let css = fs.readFileSync('packages/lumen/styles.css', 'utf8');
css = css.replace(
  /\.ui-spinner \{\n  display: inline-block;\n  width: 1rem;\n  height: 1rem;\n  border: 2px solid hsl\(var\(--line\)\);\n  border-top-color: currentColor;\n  border-radius: 999px;\n  color: hsl\(var\(--brand\)\);\n  animation: ui-spin 700ms linear infinite;\n  vertical-align: -0\.15em;\n\}/,
  `.ui-spinner {
  box-sizing: border-box;
  display: inline-block;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  border: 2px solid hsl(var(--line));
  border-right-color: transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  color: hsl(var(--brand));
  animation: ui-spin 700ms linear infinite;
  vertical-align: -0.15em;
}`
);
fs.writeFileSync('packages/lumen/styles.css', css);
