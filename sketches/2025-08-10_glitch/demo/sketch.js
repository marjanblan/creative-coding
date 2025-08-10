/* GLITCH — live-view browser build (no canvas-sketch)
 * Author: Ruslan Mashkov
 * Notes: 1080×1350, DPR-aware render, auto-fit, smooth loop.
 */

(async function () {
  const LOGICAL_W = 1080;
  const LOGICAL_H = 1350;
  const LOOP_SEC = 12;
  const FONT_URL = './assets/fonts/CoupeurCarve-SemiBold.otf';

  const PALETTE = ['#FF4B41', '#9745FF', '#72F5A4', '#FFC0F0', '#FFE64F'];

  const canvas = document.getElementById('c') || document.querySelector('canvas') || (() => {
	const el = document.createElement('canvas');
	document.body.appendChild(el);
	return el;
  })();
  const ctx = canvas.getContext('2d', { alpha: false });

  Object.assign(document.documentElement.style, { height: '100%' });
  Object.assign(document.body.style, { margin: 0, height: '100%', background: '#111' });
  Object.assign(canvas.style, {
	display: 'block',
	maxWidth: '100%',
	maxHeight: '100%',
	objectFit: 'contain',
	margin: '0 auto'
  });

  await loadFont('CoupeurCarve', FONT_URL, { weight: '100 900' });

  function resize() {
	const dpr = Math.min(window.devicePixelRatio || 1, 2);
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	const scale = Math.min(vw / LOGICAL_W, vh / LOGICAL_H);
	const cssW = Math.floor(LOGICAL_W * scale);
	const cssH = Math.floor(LOGICAL_H * scale);
	canvas.width = Math.floor(cssW * dpr);
	canvas.height = Math.floor(cssH * dpr);
	canvas.style.width = cssW + 'px';
	canvas.style.height = cssH + 'px';
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function render(playhead) {
	const width = canvas.clientWidth;
	const height = canvas.clientHeight;

	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, width, height);

	// заголовки
	ctx.save();
	ctx.fillStyle = '#9745FF';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = `100 ${Math.round(width * (LOGICAL_W ? 0.2 * (width / LOGICAL_W) : 0.2))}px 'CoupeurCarve', sans-serif`;
	ctx.fillText('GLITCH', width / 2, height * 0.112);

	ctx.fillStyle = '#000';
	ctx.font = `20px 'CoupeurCarve', sans-serif`;
	ctx.fillText('Issue 02', width * 0.515, height * 0.038);

	ctx.fillStyle = '#9745FF';
	ctx.font = `20px 'CoupeurCarve', sans-serif`;
	ctx.fillText('When Machines Dream in Noise', width / 2, height * 0.95);
	ctx.restore();

	// сетка
	const cols = 64;
	const rows = 120;
	const margin = width * 0.1;
	const gw = width - margin * 2;
	const gh = height - margin * 2;
	const cw = gw / cols;
	const ch = gh / rows;

	const angle = playhead * Math.PI * 2; // 0..1 → 0..2π

	for (let y = 0; y < rows; y++) {
	  for (let x = 0; x < cols; x++) {
		const cx = margin + x * cw + cw / 2;
		const cy = margin + y * ch + ch / 2;

		// «glitch» — плавный сдвиг радиуса и смещения по синусам с разными частотами
		const u = cols <= 1 ? 0.5 : x / (cols - 1);
		const v = rows <= 1 ? 0.5 : y / (rows - 1);

		const n = Math.sin(angle + u * 6.0 + v * 3.5) * Math.cos(angle * 1.7 + u * 2.0 - v * 4.0);
		const radius = cw * 0.2 * mapRange(n, -1, 1, 0.1, 2.4);
		const dx = mapRange(Math.sin(angle * 1.3 + u * 5 - v * 2), -1, 1, -cw * 0.1, cw * 0.1);
		const dy = mapRange(Math.cos(angle * 0.9 + u * 3 + v * 4), -1, 1, -ch * 0.1, ch * 0.1);

		const k = PALETTE.length;
		const rowOffset = (4 * y) % k;
		const idx = (x + rowOffset) % k;
		ctx.fillStyle = PALETTE[idx];

		ctx.save();
		ctx.translate(cx + dx, cy + dy);

		// «квадрат или круг» — порог на другой синусоиде, чтобы не «дёргалось»
		const shapeSine = Math.sin(angle * 2 + u * 7 + v * 5);
		if (shapeSine > 0) {
		  const s = radius * 0.8;
		  ctx.beginPath();
		  ctx.rect(-s / 2, -s / 2, s, s);
		  ctx.fill();
		} else {
		  ctx.beginPath();
		  ctx.arc(0, 0, radius, 0, Math.PI * 2);
		  ctx.fill();
		}
		ctx.restore();
	  }
	}
  }

  function mapRange(n, a, b, c, d) {
	return ((n - a) / (b - a)) * (d - c) + c;
  }

  async function loadFont(name, url, descriptors = {}) {
	const ff = new FontFace(name, `url(${url})`, descriptors);
	await ff.load();
	document.fonts.add(ff);
	await document.fonts.ready;
  }

  let running = true;
  let t0 = performance.now();

  function frame(now) {
	if (!running) return;
	const elapsed = (now - t0) / 1000;
	const playhead = (elapsed % LOOP_SEC) / LOOP_SEC;
	render(playhead);
	requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

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

  window.addEventListener('keydown', (e) => {
	if (e.code === 'Space') {
	  e.preventDefault();
	  running ? window.player.pause() : window.player.play();
	}
  });

  bindButtons();
  function bindButtons() {
	const playBtn = document.querySelector('[data-action="play"], #btnPlay');
	const pauseBtn = document.querySelector('[data-action="pause"], #btnPause');
	if (playBtn) playBtn.onclick = () => window.player.play();
	if (pauseBtn) pauseBtn.onclick = () => window.player.pause();
  }
})();
