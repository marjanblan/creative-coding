/* SHIFT — live-view browser build (no canvas-sketch)
 * Author: Ruslan Mashkov
 * Notes: 1080×1350 logical size, DPR-aware render, auto-fit to window.
 * Controls: window.player.play(), window.player.pause(); Space toggles.
 */

(async function () {
  // ---------- setup ----------
  const LOGICAL_W = 1080;
  const LOGICAL_H = 1350;
  const LOOP_SEC = 12;
  const FPS = 24;               // только для подсказки, рендер — rAF
  const FONT_URL = './assets/fonts/CoupeurCarve-SemiBold.otf';

  const PALETTE = ['#FF4B41', '#9745FF', '#72F5A4', '#FFC0F0', '#FFE64F'];
  const SEED = 128; // фиксируем «случайность»

  // canvas
  const canvas = document.getElementById('c') || document.querySelector('canvas') || (() => {
    const el = document.createElement('canvas');
    document.body.appendChild(el);
    return el;
  })();
  const ctx = canvas.getContext('2d', { alpha: false });

  // стили: без скролла, вписываемся в окно
  Object.assign(document.documentElement.style, { height: '100%' });
  Object.assign(document.body.style, {
    margin: 0,
    height: '100%',
    background: '#111'
  });
  Object.assign(canvas.style, {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    margin: '0 auto'
  });

  // шрифт
  await loadFont('CoupeurCarve', FONT_URL, { weight: '100 900' });

  // «рандом» через сид (мини-реализация только для noise4D не нужна — здесь не используем)
  // Для SHIFT — без шумов в тексте, шум только для точек (см. ниже).

  // ресайз под DPR
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // вписываем «логический» холст в окно, сохраняя пропорции
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.min(vw / LOGICAL_W, vh / LOGICAL_H);

    const cssW = Math.floor(LOGICAL_W * scale);
    const cssH = Math.floor(LOGICAL_H * scale);

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // чтобы рисовать в CSS‑координатах
  }
  window.addEventListener('resize', resize);
  resize();

  // ----------- рендер одного кадра -----------
  function render(playhead) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // фон
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // заголовки
    ctx.save();
    ctx.fillStyle = '#FF4B41';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `100 ${Math.round(width * (LOGICAL_W ? 0.2 * (width / LOGICAL_W) : 0.2))}px 'CoupeurCarve', sans-serif`;
    ctx.fillText('SHIFT', width / 2, height * 0.112);

    ctx.fillStyle = '#FF4B41';
    ctx.font = `20px 'CoupeurCarve', sans-serif`;
    ctx.fillText('Issue 01', width * 0.643, height * 0.064);

    ctx.font = `20px 'CoupeurCarve', sans-serif`;
    ctx.fillText('The Year Everything Moved', width / 2, height * 0.95);
    ctx.restore();

    // сетка точек
    const cols = 48;
    const rows = 48;
    const margin = width * 0.1;
    const gw = width - margin * 2;
    const gh = height - margin * 2;
    const cw = gw / cols;
    const ch = gh / rows;

    const angle = playhead * Math.PI * 2; // 0..1 → 0..2π

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // центр ячейки
        const cx = margin + x * cw + cw / 2;
        const cy = margin + y * ch + ch / 2;

        // простая «пульсация» вместо noise4D (для стабильности без canvas-sketch)
        const wave = Math.sin(angle + x * 0.15 + y * 0.12);
        const radius = cw * 0.22 * mapRange(wave, -1, 1, 0.2, 2.0);

        // цвет — «сдвиг по строкам»
        const k = PALETTE.length;
        const rowOffset = (3 * y) % k;
        const idx = (x + rowOffset) % k;
        ctx.fillStyle = PALETTE[idx];

        // рисуем круг
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ---------- хелперы ----------
  function mapRange(n, a, b, c, d) {
    return ((n - a) / (b - a)) * (d - c) + c;
  }

  async function loadFont(name, url, descriptors = {}) {
    const ff = new FontFace(name, `url(${url})`, descriptors);
    await ff.load();
    document.fonts.add(ff);
    await document.fonts.ready;
  }

  // ---------- цикл / управление ----------
  let running = true;
  let t0 = performance.now();

  function frame(now) {
    if (!running) return;
    const elapsed = (now - t0) / 1000;
    const playhead = (elapsed % LOOP_SEC) / LOOP_SEC; // 0..1
    render(playhead);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // публичные контролы (кнопки в твоём live-view могут дергать это)
  window.player = {
    play() {
      if (!running) {
        running = true;
        t0 = performance.now();
        requestAnimationFrame(frame);
      }
    },
    pause() { running = false; }
  };

  // Space = toggle
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      running ? window.player.pause() : window.player.play();
    }
  });

  // если в разметке есть кнопки с data-action, подцепимся
  bindButtons();
  function bindButtons() {
    const playBtn = document.querySelector('[data-action="play"], #btnPlay');
    const pauseBtn = document.querySelector('[data-action="pause"], #btnPause');
    if (playBtn) playBtn.onclick = () => window.player.play();
    if (pauseBtn) pauseBtn.onclick = () => window.player.pause();
  }
})();
