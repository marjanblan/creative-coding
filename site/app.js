async function main() {
  try {
    const res = await fetch('./gallery.json', { cache: 'no-store' });
    const items = await res.json();
    const grid = document.getElementById('grid');

    // новые — первыми
    items.sort((a, b) => new Date(b.date) - new Date(a.date));

    for (const it of items) {
      const el = document.createElement('article');
      el.className = 'card';

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = it.preview;
      img.alt = it.title;
      img.addEventListener('click', () => window.open(it.preview, '_blank'));

      const meta = document.createElement('div');
      meta.className = 'meta';
      const tools = (it.tools && it.tools.length) ? ` · ${it.tools.join(', ')}` : '';
      meta.innerHTML = `
        <a href="${it.repoPath}" target="_blank" rel="noopener" title="Open on GitHub">
          <h3 class="title">${it.title}</h3>
        </a>
        <div class="sub">${new Date(it.date).toLocaleDateString()}${tools}</div>
      `;

      el.appendChild(img);
      el.appendChild(meta);
      grid.appendChild(el);

      // мягкое появление
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      requestAnimationFrame(() => {
        el.style.transition = 'opacity .25s ease, transform .25s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    }
  } catch (e) {
    console.error('Failed to load gallery.json', e);
    const grid = document.getElementById('grid');
    if (grid) grid.innerHTML = '<p style="opacity:.6">Could not load gallery.json</p>';
  }
}
main();
