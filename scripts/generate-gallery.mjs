import fs from 'fs';
import path from 'path';

const root = process.cwd();
const sketchesDir = path.join(root, 'sketches');
const readmePath = path.join(root, 'README.md');
const galleryPath = path.join(root, 'gallery.json');

const START = '<!-- GALLERY:START -->';
const END   = '<!-- GALLERY:END -->';

const norm = s => s.replace(/\u2013|\u2014/g, '-'); // en/em dash -> hyphen
const toPosix = p => p.split(path.sep).join('/');

function safeJSON(p) {
  try { return JSON.parse(fs.readFileSync(p,'utf8')); }
  catch { return null; }
}

function readMeta(dir) {
  const metaPath = path.join(dir, 'meta.json');
  const folder = path.basename(dir);
  const meta = fs.existsSync(metaPath) ? (safeJSON(metaPath) || {}) : {};

  if (!meta.title) meta.title = folder.replace(/^\d{4}-\d{2}-\d{2}_?/, '').replace(/[_-]/g,' ').trim() || folder;
  if (!meta.date) {
    const m = folder.match(/^(\d{4}-\d{2}-\d{2})/);
    meta.date = m ? m[1] : new Date().toISOString().slice(0,10);
  }
  meta.tools ||= [];
  meta.tags ||= [];
  meta.description ||= '';

  return meta;
}

function findPreview(dir) {
  for (const n of ['preview.png','preview.gif','preview.jpg','preview.webp']) {
    const p = path.join(dir, n);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function build() {
  if (!fs.existsSync(sketchesDir)) fs.mkdirSync(sketchesDir, { recursive:true });

  const entries = fs.readdirSync(sketchesDir)
    .filter(n => !n.startsWith('_'))
    .map(n => path.join(sketchesDir, n))
    .filter(p => fs.statSync(p).isDirectory());

  const items = [];
  for (const dir of entries) {
    const folder = norm(path.basename(dir)); // нормализуем дефисы в имени папки
    const meta = readMeta(dir);
    const prev = findPreview(dir);
    if (!prev) continue; // без превью не включаем

    items.push({
      title: meta.title,
      date:  meta.date,
      tools: meta.tools,
      tags:  meta.tags,
      description: meta.description,
      preview: toPosix(path.relative(root, prev)).replace(/\u2013|\u2014/g,'-'),
      repoPath: `https://github.com/${process.env.GH_OWNER || 'marjanblan'}/${process.env.GH_REPO || 'creative-coding'}/tree/main/${toPosix(path.relative(root, dir)).replace(/\u2013|\u2014/g,'-')}`
    });
  }

  // Новые — сверху
  items.sort((a,b) => new Date(b.date) - new Date(a.date));

  fs.writeFileSync(galleryPath, JSON.stringify(items, null, 2));

  // Таблица в README (между маркерами)
  if (fs.existsSync(readmePath)) {
    let md = fs.readFileSync(readmePath, 'utf8');
    const table = [
      '| Preview | Title | Date |',
      '|---|---|---|',
      ...items.map(it => `| ![](${it.preview}) | [${it.title}](${it.repoPath}) | ${it.date} |`)
    ].join('\n');

    if (!md.includes(START)) {
      md += `\n\n${START}\n${table}\n${END}\n`;
    } else {
      md = md.replace(new RegExp(`${START}[\\s\\S]*?${END}`), `${START}\n${table}\n${END}`);
    }
    fs.writeFileSync(readmePath, md);
  }

  console.log(`Gallery: ${items.length} items`);
}

build();
