async function main() {
  try {
    const res = await fetch('./gallery.json', { cache: 'no-store' });
    const items = await res.json();
    const grid = document.getElementById('grid');

    for (const it of items) {
      const el = document.createElement('article');
      el.className = 'card';
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.src = it.preview;
      img.alt = it.title;

      const meta = document.createElement('div');
      meta.className = 'meta';
      const tools = (it.tools && it.tools.length) ? ` · ${it.tools.join(', ')}` : '';
      meta.innerHTML = `
        <a href="${it.repoPath}" target="_blank" rel="noopener">
          <h3 class="title">${it.title}</h3>
        </a>
        <div class="sub">${new Date(it.date).toLocaleDateString()}${tools}</div>
      `;

      el.appendChild(img);
      el.appendChild(meta);
      grid.appendChild(el);
    }
  } catch (e) {
    console.error('Failed to load gallery.json', e);
  }
}
main();
