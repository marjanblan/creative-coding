function getParam(name) {
  const u = new URL(location.href);
  return u.searchParams.get(name);
}
function slugFromPreview(preview) {
  const m = preview.match(/sketches\/([^/]+)\//);
  return m ? m[1] : null;
}
async function exists(url) {
  const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
  return r.ok;
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

  const date = new Date(item.date).toLocaleDateString();
  const demoUrl = `sketches/${slug}/demo/index.html`;

  const hasDemo = await exists(demoUrl);
  const bigPreview = `${item.preview}?v=${Date.now()}`;

  // разметка
  const el = document.createElement('div');
  el.innerHTML = `
    <div id="demo-slot"></div>
    <div class="meta">
      <h1 class="title">${item.title}</h1>
      <div class="sub">${date}${item.tools?.length ? ' · ' + item.tools.join(', ') : ''}</div>
      ${item.description ? `<p style="opacity:.85;max-width:60ch">${item.description}</p>` : ''}
      <div class="actions">
        ${hasDemo ? `<a class="btn" href="${demoUrl}" target="_blank" rel="noopener">Open live demo</a>` : ''}
        <a class="btn ghost" href="${item.repoPath}" target="_blank" rel="noopener">Open on GitHub</a>
        <a class="btn ghost" href="${bigPreview}" target="_blank" rel="noopener">Open preview</a>
      </div>
    </div>
  `;
  v.appendChild(el);

  const slot = el.querySelector('#demo-slot');

  if (hasDemo) {
    // встраиваем демо
    const frame = document.createElement('iframe');
    frame.src = demoUrl;
    frame.loading = 'lazy';
    frame.decoding = 'async';
    frame.referrerPolicy = 'no-referrer';
    frame.sandbox = 'allow-scripts allow-same-origin';
    frame.style.width = '100%';
    frame.style.height = '70vh';
    frame.style.border = '0';
    frame.style.borderRadius = '16px';
    frame.style.background = '#eee';
    slot.appendChild(frame);
  } else {
    // показываем большое превью
    const img = document.createElement('img');
    img.src = bigPreview;
    img.alt = item.title;
    img.style.width = '100%';
    img.style.maxWidth = '1000px';
    img.style.borderRadius = '16px';
    img.style.background = '#eee';
    slot.appendChild(img);
  }
}
main();
