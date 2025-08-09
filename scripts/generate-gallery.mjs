import fs from 'fs';
import path from 'path';
const root = process.cwd();
const sketchesDir = path.join(root, 'sketches');

function readMeta(dir) {
  const metaPath = path.join(dir, 'meta.json');
  let meta = {};
  if (fs.existsSync(metaPath)) {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  }
  const folder = path.basename(dir);
  if (!meta.title) meta.title = folder.replace(/^\d{4}-\d{2}-\d{2}_?/, '').replace(/[_-]/g, ' ') || folder;
  if (!meta.date) {
    const m = folder.match(/^(\d{4}-\d{2}-\d{2})/);
    meta.date = m ? m[1] : new Date().toISOString().slice(0,10);
  }
  return meta;
}

function findPreview(dir) {
  const cand = ['preview.gif','preview.png','preview.jpg','preview.webp'];
  for (const n of cand) {
    const p = path.join(dir, n);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function toPosix(p) { return p.split(path.sep).join('/'); }

function build() {
  if (!fs.existsSync(sketchesDir)) fs.mkdirSync(sketchesDir, { recursive: true });

  const entries = fs.readdirSync(sketchesDir)
    .filter(n => !n.startsWith('_'))
    .map(n => path.join(sketchesDir, n))
    .filter(p => fs.statSync(p).isDirectory());

  const items = [];
  for (const dir of entries) {
    const meta = readMeta(dir);
    const prev = findPreview(dir);
    if (!prev) continue;
    items.push({
      title: meta.title,
      date: meta.date,
      tools: meta.tools || [],
      tags: meta.tags || [],
      description: meta.description || '',
      preview: toPosix(path.relative(root, prev)),
      repoPath: `https://github.com/marjanblan/creative-coding/tree/main/${toPosix(path.relative(root, dir))}`
    });
  }
  items.sort((a,b) => (a.date < b.date) ? 1 : -1);

  fs.writeFileSync(path.join(root, 'gallery.json'), JSON.stringify(items, null, 2));

  const readmePath = path.join(root, 'README.md');
  if (fs.existsSync(readmePath)) {
    let md = fs.readFileSync(readmePath, 'utf8');
    const start = '<!-- GALLERY:START -->';
    const end = '<!-- GALLERY:END -->';
    const table = [
      '| Preview | Title | Date |',
      '|---|---|---|',
      ...items.map(it => `| ![](${it.preview}) | [${it.title}](${it.repoPath}) | ${it.date} |`)
    ].join('\n');
    if (!md.includes(start)) {
      md += `\n\n${start}\n${table}\n${end}\n`;
    } else {
      md = md.replace(new RegExp(`${start}[\\s\\S]*?${end}`), `${start}\n${table}\n${end}`);
    }
    fs.writeFileSync(readmePath, md);
  }

  console.log(`Gallery: ${items.length} items`);
}

build();
