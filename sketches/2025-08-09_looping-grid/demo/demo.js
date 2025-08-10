// sketches/<slug>/demo/demo.js
// Универсальный раннер для ../sketch.js (ESM)

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { alpha: false });

let running = true;
let raf = 0;
let start = performance.now();
let last = start;
let api = null;      // экспорт из ../sketch.js
let inst = null;     // инстанс, который вернул setup()
const state = {};    // твоя произвольная память между кадрами

// DPR + ресайз
function resize() {
  const ratio = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  // 4:5 постер
  const W = 1080, H = 1350;
  canvas.width = Math.round(W * ratio);
  canvas.height = Math.round(H * ratio);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
resize();
addEventListener('resize', resize, { passive: true });

// Игровой цикл
function loop(t) {
  const dt = (t - last) / 1000;
  last = t;

  // Очистка
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ветвление по типу экспорта
  try {
    if (inst && typeof inst.update === 'function') inst.update(dt, state);
    if (inst && typeof inst.render === 'function') inst.render(ctx, t - start, state);
    else if (typeof api === 'function') api(ctx, t - start, state);
  } catch (err) {
    drawError(err);
    running = false;
  }

  if (running) raf = requestAnimationFrame(loop);
}

function drawError(err) {
  console.error(err);
  ctx.save();
  ctx.fillStyle = '#111';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#f33';
  ctx.font = '16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial';
  const msg = (err && (err.stack || err.message)) ? String(err.stack || err.message) : String(err);
  wrapText(ctx, 'Sketch error:\n' + msg, 20, 30, (canvas.width/ (window.devicePixelRatio||1)) - 40, 20);
  ctx.restore();
}
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const lines = String(text).split('\n');
  for (const line of lines) {
    let cur = '', words = line.split(' ');
    for (let n=0; n<words.length; n++) {
      const test = cur + words[n] + ' ';
      if (ctx.measureText(test).width > maxWidth && n>0) {
        ctx.fillText(cur, x, y); y += lineHeight; cur = words[n] + ' ';
      } else cur = test;
    }
    ctx.fillText(cur, x, y); y += lineHeight;
  }
}

// Управление play/pause из родителя (viewer)
addEventListener('message', (e) => {
  if (!e.data || typeof e.data !== 'object') return;
  if (e.data.type === 'play') play();
  if (e.data.type === 'pause') pause();
});

// Хоткеи в самом демо
addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); play(); }
  if (e.key.toLowerCase() === 'p') pause();
  if (e.key.toLowerCase() === 'f') (canvas.requestFullscreen?.() || document.body.requestFullscreen?.());
});

function play() {
  if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
}
function pause() {
  running = false; cancelAnimationFrame(raf);
}

// Загрузка пользовательского скетча
(async function boot(){
  try {
    const mod = await import('../sketch.js');    // <- твой код
    api = mod.default ?? mod;

    // Если есть setup({ canvas, ctx }) — инициализируем, получаем { update, render }
    if (api && typeof api.setup === 'function') {
      inst = api.setup({ canvas, ctx, state }) || null;
    }

    // Если экспорт — чистая функция (draw), просто поедем
    start = last = performance.now();
    running = true;
    raf = requestAnimationFrame(loop);
  } catch (err) {
    drawError(err);
  }
})();
