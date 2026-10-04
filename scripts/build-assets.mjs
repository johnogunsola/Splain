import { mkdir, copyFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
await mkdir(new URL('dist/', root), { recursive: true });
const files = ['index.html', 'index.css', 'index.js', 'section-navigation.js', 'particle-logo.css', 'particle-logo.js', 'splain-intro.css', 'splain-intro.js', 'ask-splain.css', 'ask-splain.js', 'favicon.svg', 'favicon.png', 'John-Ogunsola-CV.pdf', '_redirects'];
await Promise.all(files.map(file => copyFile(new URL(file, root), new URL(`dist/${file}`, root))));
console.log(`Prepared ${files.length} public assets.`);
