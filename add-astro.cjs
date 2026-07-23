const fs = require('fs');
const astroFile = 'packages/astro/index.ts';
let code = fs.readFileSync(astroFile, 'utf8');

const newExports = `
export { default as LanguageToggle } from './components/LanguageToggle.astro'
export { default as Particles } from './components/Particles.astro'
export { default as ScrollReveal } from './components/ScrollReveal.astro'
export { default as Stat } from './components/Stat.astro'
`;

code = code.replace(/export \{ default as ThemeToggle \} [^\n]+/, match => match + '\n' + newExports.trim());

fs.writeFileSync(astroFile, code);
