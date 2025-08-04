#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

const root = process.cwd();

async function collectFiles() {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isFile()) {
      if ([
        'service-worker.js',
        'package.json',
        'package-lock.json',
        'README.md',
        'LICENSE',
        '.gitignore'
      ].includes(entry.name)) continue;
      const ext = path.extname(entry.name);
      if (['.html', '.css', '.js', '.json', '.ico', '.png', '.svg'].includes(ext)) {
        files.push(entry.name);
      }
    } else if (entry.isDirectory() && entry.name === 'icons') {
      const iconFiles = await fs.readdir(path.join(root, 'icons'));
      for (const f of iconFiles) {
        if (!f.startsWith('.')) {
          files.push(`icons/${f}`);
        }
      }
    }
  }
  files.sort();
  return [''].concat(files);
}

function buildArray(files) {
  const base = '${BASE_PATH}';
  const lines = files.map((f) =>
    f ? `  \`${base}/${f}\`` : `  \`${base}/\``
  );
  return `const APP_SHELL = [\n${lines.join(',\n')}\n];`;
}

async function updateServiceWorker() {
  const files = await collectFiles();
  const swPath = path.join(root, 'service-worker.js');
  let sw = await fs.readFile(swPath, 'utf8');
  sw = sw.replace(/const APP_SHELL = \[[\s\S]*?\];/, buildArray(files));
  await fs.writeFile(swPath, sw);
  console.log(`Updated APP_SHELL with ${files.length} entries.`);
}

updateServiceWorker().catch((err) => {
  console.error(err);
  process.exit(1);
});
