const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const ignoreDirs = new Set(['node_modules', '.git']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoreDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && full.endsWith('.js')) out.push(full);
  }
  return out;
}

function fail(message) {
  console.error(`\n[check] ${message}`);
  process.exit(1);
}

const indexPath = path.join(root, 'public', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');
const scriptMatches = [...indexHtml.matchAll(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi)];
const scriptSrcs = scriptMatches.map((m) => m[1]).filter((src) => !src.startsWith('/socket.io/'));
const duplicates = scriptSrcs.filter((src, i) => scriptSrcs.indexOf(src) !== i);
if (duplicates.length) fail(`duplicate script tags in index.html: ${[...new Set(duplicates)].join(', ')}`);

for (const src of scriptSrcs) {
  const filePath = path.join(root, 'public', src.replace(/^\//, ''));
  if (!fs.existsSync(filePath)) fail(`missing script referenced by index.html: ${src}`);
}

const jsFiles = walk(root).sort();
for (const file of jsFiles) {
  const rel = path.relative(root, file);
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    fail(`syntax check failed: ${rel}`);
  }
}

console.log(`[check] OK: ${jsFiles.length} JS files passed syntax check; ${scriptSrcs.length} browser modules are connected.`);
