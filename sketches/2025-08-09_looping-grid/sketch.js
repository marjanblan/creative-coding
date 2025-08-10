// ---- use UMD globals (без require) ----
const CS = window.canvasSketch;
const rnd = window.canvasSketchUtil.random;
const { mapRange } = window.canvasSketchUtil.math;

console.log('[sketch] file loaded', !!CS, !!rnd);

const settings = {
  dimensions: [1080, 1350],
  animate: true,
  duration: 12,
  fps: 24,
  pixelsPerInch: 72,
  exportPixelRatio: 1
};

async function loadFont(name, url, descriptors = {}) {
  const f = new FontFace(name, `url(${url})`, descriptors);
  await f.load();
  document.fonts.add(f);
  await document.fonts.ready;
}

// фиксируем случайность
const SEED = 129;
rnd.setSeed(SEED);
const palette = ['#FF4B41', '#9745FF', '#72F5A4', '#FFC0F0', '#FFE64F'];

const sketch = async () => {
  console.log('[sketch] create');
  // путь от demo/index.html -> ./assets/fonts/...
  await loadFont(
    'CoupeurCarve',
    './assets/fonts/CoupeurCarve-SemiBold.otf',
    { weight: '100 900' }
  );

  return ({ context: ctx, width, height, playhead }) => {
    // фон
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // заголовки
    ctx.save();
    ctx.fillStyle = '#9745FF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `100 ${Math.round(width * 0.2)}px 'CoupeurCarve', sans-serif`;
    ctx.fillText('GLITCH', width / 2, height * 0.112);

    ctx.fillStyle = '#000';
    ctx.font = `20px 'CoupeurCarve', sans-serif`;
    ctx.fillText('Issue 02', width * 0.515, height * 0.038);

    ctx.fillStyle = '#9745FF';
    ctx.font = `20px 'CoupeurCarve', sans-serif`;
    ctx.fillText('When Machines Dream in Noise', width / 2, height * 0.95);
    ctx.restore();

    // сетка
    const cols = 64, rows = 120;
    const margin = width * 0.1;
    const gw = width - margin * 2;
    const gh = height - margin * 2;
    const cw = gw / cols;
    const ch = gh / rows;

    const angle = playhead * Math.PI * 2; // плавная петля

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cx = margin + x * cw + cw / 2;
        const cy = margin + y * ch + ch / 2;

        const u = cols <= 1 ? 0.5 : x / (cols - 1);
        const v = rows <= 1 ? 0.5 : y / (rows - 1);

        const n = rnd.noise4D(u, v, Math.cos(angle), Math.sin(angle), 1.5, 1);

        const r = cw * 0.2 * mapRange(n, -1, 1, 0.1, 2.4);
        const dx = mapRange(n, -1, 1, -cw * 0.1, cw * 0.1);
        const dy = mapRange(n, -1, 1, -ch * 0.1, ch * 0.1);

        const k = palette.length;
        const rowOffset = (4 * y) % k;
        const idx = (x + rowOffset) % k;
        ctx.fillStyle = palette[idx];

        ctx.save();
        ctx.translate(cx + dx, cy + dy);

        const sn = rnd.noise4D(u + 5, v + 5, Math.cos(angle) * 2, Math.sin(angle) * 2);
        if (sn > 0) {
          const s = r * 0.8;
          ctx.beginPath();
          ctx.rect(-s / 2, -s / 2, s, s);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  };
};

// запускаем на наш <canvas id="c">
CS(sketch, {
  ...settings,
  canvas: document.getElementById('c'),
  context: '2d'
});
