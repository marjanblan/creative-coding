async function main() {
  // --- theme
  applyTheme(loadTheme());
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.onclick = toggleTheme;

  try {
    const res = await fetch('./gallery.json', { cache: 'no-store' });
    const items = await res.json();

    // новые — первыми
    items.sort((a, b) => new Date(b.date) - new Date(a.date));

    // фильтры
    const allTags = Array.from(new Set(items.flatMap(it => it.tags || []))).sort();
    renderFilters(allTags);
    const currentTag = new URL(location.href).searchParams.get('tag') || '';
    if (currentTag) activateChip(currentTag);

    renderGrid(items, currentTag);

    // обработчик клика по чипсам
    document.getElementById('filters')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      const tag = btn.dataset.tag;
      const url = new URL(location.href);
      if (url.searchParams.get('tag') === tag) {
        url.searchParams.delete('tag');
        activateChip('');
      } else {
        url.searchParams.set('tag', tag);
        activateChip(tag);
      }
      history.replaceState({}, '', url);
      renderGrid(items, url.searchParams.get('tag') || '');
    });

  } catch (e) {
    console.error('Failed to load gallery.json', e);
    const grid = document.getElementById('grid');
    if (grid) grid.innerHTML = '<p style="opacity:.6">Could not load gallery.json</p>';
  }
}

function renderFilters(tags) {
  const wrap = document.getElementById('filters');
  if (!wrap) return;
  const chips = ['All', ...tags].map(t => {
    const tag = t === 'All' ? '' : t;
    return `<button class="chip" data-tag="${tag}">${t}</button>`;
  }).join('');
  wrap.innerHTML = chips;
}
function activateChip(tag) {
  document.querySelectorAll('.chip').forEach(ch => {
    ch.classList.toggle('active', ch.dataset.tag === tag);
  });
}

function renderGrid(allItems, tag) {
  const grid = document.getElementById('grid');
  if (!grid) return;

  const items = tag ? allItems.filter(it => (it.tags || []).includes(tag)) : allItems;
  grid.innerHTML = '';

  for (const it of items) {
    const el = document.createElement('article');
    el.className = 'card';

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = it.preview;
    img.alt = it.title;

    const slug = it.preview.match(/sketches\/([^/]+)\//)?.[1] || '';
    const viewUrl = `./viewer.html?slug=${encodeURIComponent(slug)}`;

    const meta = document.createElement('div');
    meta.className = 'meta';
    const tools = (it.tools && it.tools.length) ? ` · ${it.tools.join(', ')}` : '';
    meta.innerHTML = `
      <a href="${viewUrl}">
        <h3 class="title">${it.title}</h3>
      </a>
      <div class="sub">${new Date(it.date).toLocaleDateString()}${tools}</div>
    `;

    el.appendChild(img);
    el.appendChild(meta);
    el.onclick = () => (location.href = viewUrl);
    grid.appendChild(el);

    el.style.opacity = '0';
    el.style.transform = 'translateY(6px)';
    requestAnimationFrame(() => {
      el.style.transition = 'opacity .25s ease, transform .25s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  }
}

/* --- theme helpers --- */
function loadTheme(){ return localStorage.getItem('theme') || 'dark'; }
function saveTheme(v){ localStorage.setItem('theme', v); }
function applyTheme(v){
  document.documentElement.classList.toggle('light', v === 'light');
}
function toggleTheme(){
  const next = loadTheme() === 'light' ? 'dark' : 'light';
  saveTheme(next); applyTheme(next);
}

main();
