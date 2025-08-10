/* ===== Vanilla runtime (no external libs) ===== */

// ---- tiny seeded PRNG (mulberry32)
function mulberry32(seed) {
  let t = seed >>> 0;
  return function() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- classic Perlin 2D (gradient noise)
function makePerlin2D(rand) {
  const p = new Uint8Array(512);
  const perm = new Uint8Array(256);
  for (let i = 0; i < 256; i++) perm[i] = i;
  // shuffle
  for (let i = 255; i > 0; i--) {
    const j = (rand() * (i + 1)) | 0;
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];

  const grad2 = [
    [ 1, 0],[ -1, 0],[ 0, 1],[ 0,-1],
    [ 1, 1],[ -1, 1],[ 1,-1],[ -1,-1]
  ];
  const fade = t => t*t*t*(t*(t*6-15)+10);
  const lerp = (a,b,t) => a + t*(b-a);

  function dot(g, x, y) { return g[0]*x + g[1]*y; }

  return function noise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const g00 = grad2[p[X   + p[Y  ]] & 7];
    const g10 = grad2[p[X+1 + p[Y  ]] & 7];
    const g01 = grad2[p[X   + p[Y+1]] & 7];
    const g11 = grad2[p[X+1 + p[Y+1]] & 7];

    const u = fade(xf);
    const v = fade(yf);

    const n00 = dot(g00, xf    , yf    );
    const n10 = dot(g10, xf-1  , yf    );
    const n01 = dot(g01, xf    , yf-1  );
    const n11 = dot(g11, xf-1  , yf-1  );

    const nx0 = lerp(n00, n10, u);
    const nx1 = lerp(n01, n11, u);
    const nxy = lerp(nx0, nx1, v);
    // Перлин даёт ~[-1..1], это нам и нужно
    return nxy;
  };
}

/* ===== Your sketch (ported) ===== */

const CANVAS_W = 1080;
const CANVAS_H = 1350;

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// настройки «как у canvas-sketch»
const settings = {
  dimensions: [CANVAS_W, CANVAS_H],
  animate: true,
  duration: 12,   // секунд в петле
  fps: 24,
  pixelsPerInch: 72,
  exportPixelRatio: 1
};

// Загружаем шрифт (через FontFace API) — путь относительно demo/index.html
async function loadFont(name, url, descriptors = {}) {
  const ff = new FontFace(name, `url(${url})`, descriptors);
  await ff.load();
  document.fonts.add(ff);
  await document.fonts.ready;
}

// детерминированный рандом + шум
const SEED = 129;
const rnd = mulberry32(SEED);
const noise2D = makePerlin2D(rnd);

// палитра
const palette = ['#FF4B41', '#9745FF', '#72F5A4', '#FFC0F0', '#FFE64F'];

// лупинг: добавляем круговую компоненту к координатам шума
function loopNoise(u, v, playhead, radius = 1.5, scale = 1.0) {
  const a = playhead * Math.PI * 2; // 0..2π
  const x = u * scale + radius * Math.cos(a);
  const y = v * scale + radius * Math.sin(a);
  return noise2D(x, y); // ~[-1..1]
}

function mapRange(v, inMin, inMax, outMin, outMax) {
  const t = (v - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

async function start() {
  // подгружаем шрифт
  await loadFont(
    'CoupeurCarve',
    './assets/fonts/CoupeurCarve-SemiBold.otf',
    { weight: '100 900' }
  );

  const [width, height] = settings.dimensions;
  canvas.width = width;
  canvas.height = height;

  const cols = 64;
  const rows = 120;
  const margin = width * 0.1;
  const gw = width  - margin * 2;
  const gh = height - margin * 2;
  const cw = gw / cols;
  const ch = gh / rows;

  let startTime = performance.now();

  function frame(now) {
    const t = (now - startTime) / 1000;                 // сек
    const playhead = (t % settings.duration) / settings.duration; // 0..1

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

    // сетка частиц
    for (let y = 0; y < rows; y++) {
      const k = palette.length;
      const rowOffset = (4 * y) % k;

      for (let x = 0; x < cols; x++) {
        const cx = margin + x * cw + cw / 2;
        const cy = margin + y * ch + ch / 2;

        const u = cols <= 1 ? 0.5 : x / (cols - 1);
        const v = rows <= 1 ? 0.5 : y / (rows - 1);

        const n = loopNoise(u, v, playhead, 1.5, 1.0);

        const radius = cw * 0.2 * mapRange(n, -1, 1, 0.1, 2.4);
        const dx = mapRange(n, -1, 1, -cw * 0.1, cw * 0.1);
        const dy = mapRange(n, -1, 1, -ch * 0.1, ch * 0.1);

        const colorIdx = (x + rowOffset) % k;
        ctx.fillStyle = palette[colorIdx];

        ctx.save();
        ctx.translate(cx + dx, cy + dy);

        const n2 = loopNoise(u + 5, v + 5, playhead, 2.0, 1.0);
        const isSquare = n2 > 0;

        if (isSquare) {
          const s = radius * 0.8;
          ctx.fillRect(-s / 2, -s / 2, s, s);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

start().catch(err => {
  console.error('Demo failed:', err);
  ctx.fillStyle = '#f33';
  ctx.font = '16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
  ctx.fillText('Demo error: ' + err.message, 16, 24);
});
