// sketches/_template/demo/demo.js
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
  // bg
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // simple generative - drifting dots
  const W = canvas.width / (window.devicePixelRatio || 1);
  const H = canvas.height / (window.devicePixelRatio || 1);
  for (let i = 0; i < 140; i++) {
    const x = (Math.sin(0.001 * t + i) * 0.5 + 0.5) * W;
    const y = (Math.cos(0.0012 * t + i * 0.7) * 0.5 + 0.5) * H;
    const r = 6 + 4 * Math.sin(0.002 * t + i);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${(i * 7 + t * 0.02) % 360} 80% 60%)`;
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

// стартуем сразу
handle = requestAnimationFrame(draw);

// управление из viewer через postMessage
addEventListener('message', (e) => {
  if (!e.data || typeof e.data !== 'object') return;
  if (e.data.type === 'play') play();
  if (e.data.type === 'pause') pause();
});
