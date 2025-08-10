// site/viewer.js
function getParam(name) {
  const u = new URL(location.href);
  return u.searchParams.get(name);
}
function slugFromPreview(preview) {
  const m = preview.match(/sketches\/([^/]+)\//);
  return m ? m[1] : null;
}
async function headOk(url) {
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

  const root = document.getElementById('viewer');
  if (!item) {
    root.innerHTML = `<p style="opacity:.7">Sketch not found.</p>`;
    return;
  }

  const date = new Date(item.date).toLocaleDateString();
  const demoUrl = `sketches/${slug}/demo/index.html`;
  const hasDemo = await headOk(demoUrl);
  const bigPreview = `${item.preview}?v=${Date.now()}`;

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';

  const btnPlay = document.createElement('button');
  btnPlay.className = 'btn';
  btnPlay.textContent = 'Play';

  const btnPause = document.createElement('button');
  btnPause.className = 'btn';
  btnPause.textContent = 'Pause';

  const btnFull = document.createElement('button');
  btnFull.className = 'btn';
  btnFull.textContent = 'Fullscreen';

  const btnOpenPreview = document.createElement('a');
  btnOpenPreview.className = 'btn ghost';
  btnOpenPreview.textContent = 'Open preview';
  btnOpenPreview.href = bigPreview;
  btnOpenPreview.target = '_blank';
  btnOpenPreview.rel = 'noopener';

  const btnOpenGH = document.createElement('a');
  btnOpenGH.className = 'btn ghost';
  btnOpenGH.textContent = 'Open on GitHub';
  btnOpenGH.href = item.repoPath;
  btnOpenGH.target = '_blank';
  btnOpenGH.rel = 'noopener';

  if (hasDemo) {
    toolbar.append(btnPlay, btnPause, btnFull, btnOpenPreview, btnOpenGH);
  } else {
    toolbar.append(btnOpenPreview, btnOpenGH);
  }

  // Media slot
  const slot = document.createElement('div');
  let iframe = null;

  if (hasDemo) {
    iframe = document.createElement('iframe');
    iframe.src = demoUrl;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer';
    iframe.sandbox = 'allow-scripts allow-same-origin';
    slot.appendChild(iframe);

    // buttons -> postMessage
    btnPlay.onclick = () => iframe.contentWindow?.postMessage({ type: 'play' }, '*');
    btnPause.onclick = () => iframe.contentWindow?.postMessage({ type: 'pause' }, '*');
    btnFull.onclick = async () => {
      if (iframe.requestFullscreen) iframe.requestFullscreen();
      else if (slot.requestFullscreen) slot.requestFullscreen();
    };

    // keyboard shortcuts
    addEventListener('keydown', (e) => {
      if (e.target && ['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); btnPlay.click(); }
      if (e.key.toLowerCase() === 'p') btnPause.click();
      if (e.key.toLowerCase() === 'f') btnFull.click();
      if (e.key === 'Escape') history.back();
    });
  } else {
    const img = document.createElement('img');
    img.src = bigPreview;
    img.alt = item.title;
    slot.appendChild(img);
  }

  // Meta
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.innerHTML = `
    <h1 class="title">${item.title}</h1>
    <div class="sub">${date}${item.tools?.length ? ' · ' + item.tools.join(', ') : ''}</div>
    ${item.description ? `<p style="opacity:.85;max-width:60ch">${item.description}</p>` : ''}
  `;

  // Mount
  root.replaceChildren(toolbar, slot, meta);
}

main();
