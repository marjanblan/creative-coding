/* --- universal imports (node + browser) --- */
const canvasSketch = window.canvasSketch;
const random = window.canvasSketchUtil.random;
const { mapRange } = window.canvasSketchUtil.math;

/* ---------- helpers ---------- */
async function loadFont(name, url, descriptors = {}) {
  const font = new FontFace(name, `url(${url})`, descriptors);
  const loaded = await font.load();
  document.fonts.add(loaded);
  await document.fonts.ready;
}

/* ---------- settings ---------- */
const settings = {
  dimensions: [1080, 1350],
  animate: true,
  duration: 12,
  fps: 24,
  pixelsPerInch: 72,
  exportPixelRatio: 1
};

/* ---------- state ---------- */
const SEED = 129;
random.setSeed(SEED);
const palette = ['#FF4B41', '#9745FF', '#72F5A4', '#FFC0F0', '#FFE64F'];

/* ---------- sketch ---------- */
const sketch = async () => {
  // путь из sketches/<slug>/sketch.js в папку demo
  await loadFont(
    'CoupeurCarve',
    './assets/fonts/CoupeurCarve-SemiBold.otf',
    { weight: '100 900' }
  );

  return ({ context, width, height, playhead }) => {
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    // заголовки
    context.save();
    context.fillStyle = '#9745FF';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = `100 ${Math.round(width * 0.2)}px 'CoupeurCarve', sans-serif`;
    context.fillText('GLITCH', width / 2, height * 0.112);

    context.fillStyle = '#000';
    context.font = `20px 'CoupeurCarve', sans-serif`;
    context.fillText('Issue 02', width * 0.515, height * 0.038);

    context.fillStyle = '#9745FF';
    context.font = `20px 'CoupeurCarve', sans-serif`;
    context.fillText('When Machines Dream in Noise', width / 2, height * 0.95);
    context.restore();

    // сетка
    const cols = 64, rows = 120;
    const margin = width * 0.1;
    const gw = width - margin * 2;
    const gh = height - margin * 2;
    const cw = gw / cols;
    const ch = gh / rows;

    const speed = 1;
    const angle = playhead * Math.PI * 2 * speed;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cx = margin + x * cw + cw / 2;
        const cy = margin + y * ch + ch / 2;

        const u = cols <= 1 ? 0.5 : x / (cols - 1);
        const v = rows <= 1 ? 0.5 : y / (rows - 1);

        const n = random.noise4D(u, v, Math.cos(angle), Math.sin(angle), 1.5, 1);

        const radius = cw * 0.2 * mapRange(n, -1, 1, 0.1, 2.4);
        const dx = mapRange(n, -1, 1, -cw * 0.1, cw * 0.1);
        const dy = mapRange(n, -1, 1, -ch * 0.1, ch * 0.1);

        const k = palette.length;
        const rowOffset = (4 * y) % k;
        const idx = (x + rowOffset) % k;
        context.fillStyle = palette[idx];

        context.save();
        context.translate(cx + dx, cy + dy);

        const shapeNoise = random.noise4D(u + 5, v + 5, Math.cos(angle) * 2, Math.sin(angle) * 2);
        const isSquare = shapeNoise > 0;

        if (isSquare) {
          const size = radius * 0.8;
          context.beginPath();
          context.rect(-size / 2, -size / 2, size, size);
          context.fill();
        } else {
          context.beginPath();
          context.arc(0, 0, radius, 0, Math.PI * 2);
          context.fill();
        }

        context.restore();
      }
    }
  };
};

/* ---------- run (node vs browser) ---------- */
const options = _hasRequire
  ? settings
  : { ...settings, canvas: document.getElementById('c') };

canvasSketch(sketch, options);