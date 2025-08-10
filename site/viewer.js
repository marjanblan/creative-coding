function getParam(name) {
  const u = new URL(location.href);
  return u.searchParams.get(name);
}
function slugFromPreview(preview) {
  const m = preview.match(/sketches\/([^/]+)\//);
  return m ? m[1] : null;
}

async function main() {
  const res = await fetch('./gallery.json', { cache: 'no-store' });
  const items = await res.json();

  const slug = getParam('slug');
  const item = slug
    ? items.find(it => slugFromPreview(it.preview) === slug)
    : null;

  const v = document.getElementById('viewer');

  if (!item) {
    v.innerHTML = `<p style="opacity:.7">Sketch not found.</p>`;
    return;
  }

  const el = document.createElement('div');
  const date = new Date(item.date).toLocaleDateString();

  el.innerHTML = `
    <div>
      <img src="${item.preview}?v=${Date.now()}" alt="${item.title}">
    </div>
    <div class="meta">
      <h1 class="title">${item.title}</h1>
      <div class="sub">${date}${item.tools?.length ? ' · ' + item.tools.join(', ') : ''}</div>
      ${item.description ? `<p style="opacity:.85;max-width:60ch">${item.description}</p>` : ''}
      <div class="actions">
        <a class="btn" href="${item.preview}" target="_blank" rel="noopener">Open preview</a>
        <a class="btn ghost" href="${item.repoPath}" target="_blank" rel="noopener">Open on GitHub</a>
      </div>
    </div>
  `;
  v.appendChild(el);
}
main();
