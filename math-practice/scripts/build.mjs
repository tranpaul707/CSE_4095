import { mkdir, copyFile, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist/src', { recursive: true });
for (const file of ['index.html', 'src/app.js', 'src/engine.js', 'src/state.js', 'src/styles.css']) {
  await copyFile(file, `dist/${file}`);
}
console.log('Static production app built in dist/');
