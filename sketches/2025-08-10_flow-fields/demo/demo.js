const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { alpha: false });

let running = true;
let handle = null;

function resize() {
  const ratio = window.devicePixelRatio || 1;
  const W = 1080, H = 1350; // 4:5
  canvas.width = W * ratio;
  canvas.height = H * ratio;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
resize();
addEventListener('resize', resize, { passive: true });

function draw(t) {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const W = canvas.width / (window.devicePixelRatio || 1);
  const H = canvas.height / (window.devicePixelRatio || 1);

  for (let i = 0; i < 220; i++) {
    const a = i * 0.27 + t * 0.0013;
    const r = (Math.sin(i * 0.08 + t * 0.002) * 0.35 + 0.65) * Math.min(W, H) * 0.45;
    const x = W * 0.5 + Math.cos(a) * r;
    const y = H * 0.5 + Math.sin(a * 1.3) * r * 0.6;
    ctx.beginPath();
    ctx.arc(x, y, 4 + 2 * Math.sin(t * 0.003 + i), 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${(i * 5 + t * 0.05) % 360} 80% 60%)`;
    ctx.fill();
  }

  if (running) handle = requestAnimationFrame(draw);
}

function play() {
  if (!running) {
    running = true;
    handle = requestAnimationFrame(draw);
  }
}
function pause() {
  running = false;
  if (handle) cancelAnimationFrame(handle);
}

handle = requestAnimationFrame(draw);

addEventListener('message', (e) => {
  if (!e.data || typeof e.data !== 'object') return;
  if (e.data.type === 'play') play();
  if (e.data.type === 'pause') pause();
});
