/* GLITCH — live-view browser build (no canvas-sketch)
 * Author: Ruslan Mashkov
 * Notes: 1080×1350, DPR-aware render, auto-fit, smooth loop.
 */

 // GLITCH — браузерная версия с тем же поведением, что и canvas-sketch
 import { makeNoise4D } from './noise.js';
 
 const settings = {
   dimensions: [1080, 1350],
   animate: true,
   duration: 12,
   fps: 24,
   pixelsPerInch: 72,
   exportPixelRatio: 1
 };
 
 const SEED = 129;
 const noise4D = makeNoise4D(SEED);
 
 const palette = ['#FF4B41', '#9745FF','#72F5A4','#FFC0F0','#FFE64F'];
 
 async function loadFont(name, url, descriptors = {}) {
   const f = new FontFace(name, `url(${url})`, descriptors);
   await f.load();
   document.fonts.add(f);
   await document.fonts.ready;
 }
 
 function mapRange(v, a, b, c, d) {
   return c + (d - c) * ((v - a) / (b - a));
 }
 
 function fitCanvas(canvas, w, h) {
   const dpr = Math.min(window.devicePixelRatio || 1, 2);
   canvas.width = Math.round(w * dpr);
   canvas.height = Math.round(h * dpr);
   canvas.style.width = `${w}px`;
   canvas.style.height = `${h}px`;
   const ctx = canvas.getContext('2d');
   ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
   return ctx;
 }
 
 function start() {
   const canvas = document.getElementById('c');
   const [W, H] = settings.dimensions;
   const ctx = fitCanvas(canvas, W, H);
 
   let playing = true;
   const t0 = performance.now();
 
   (function frame(now) {
     if (!playing) return requestAnimationFrame(frame);
     const elapsed = (now - t0) / 1000;
     const playhead = (elapsed % settings.duration) / settings.duration;
 
     // bg
     ctx.fillStyle = '#000';
     ctx.fillRect(0, 0, W, H);
 
     // titles
     ctx.save();
     ctx.fillStyle = '#9745FF';
     ctx.textAlign = 'center';
     ctx.textBaseline = 'middle';
     ctx.font = `100 ${Math.round(W * 0.2)}px 'CoupeurCarve', sans-serif`;
     ctx.fillText('GLITCH', W / 2, H * 0.112);
 
     ctx.fillStyle = '#000 ';
     ctx.font = `20px 'CoupeurCarve', sans-serif`;
     ctx.fillText('Issue 02', W * 0.515, H * 0.038);
     
     ctx.fillStyle = '#9745FF';
     ctx.font = `20px 'CoupeurCarve', sans-serif`;
     ctx.fillText('When Machines Dream in Noise', W / 2, H * 0.95);
     ctx.restore();
 
     // grid
     const cols = 64, rows = 120;
     const margin = W * 0.1;
     const gw = W - margin * 2;
     const gh = H - margin * 2;
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
 
         const n = noise4D(u, v, Math.cos(angle), Math.sin(angle));
 
         const radius = cw * 0.2 * mapRange(n, -1, 1, 0.1, 2.4);
         const dx = mapRange(n, -1, 1, -cw * 0.1, cw * 0.1);
         const dy = mapRange(n, -1, 1, -ch * 0.1, ch * 0.1);
 
         const k = palette.length;
         const rowOffset = (4 * y) % k;
         const idx = (x + rowOffset) % k;
 
         ctx.fillStyle = palette[idx];
         ctx.save();
         ctx.translate(cx + dx, cy + dy);
 
         const sn = noise4D(u + 5, v + 5, Math.cos(angle) * 2, Math.sin(angle) * 2);
         if (sn > 0) {
           const s = radius * 0.8;
           ctx.beginPath();
           ctx.rect(-s / 2, -s / 2, s, s);
           ctx.fill();
         } else {
           ctx.beginPath();
           ctx.arc(0, 0, radius, 150, Math.PI * 2);
           ctx.fill();
         }
         ctx.restore();
       }
     }
 
     requestAnimationFrame(frame);
   })(t0);
 
   document.getElementById('btnPlay')?.addEventListener('click', () => (playing = true, start()));
   document.getElementById('btnPause')?.addEventListener('click', () => (playing = false));
 }
 
 (async () => {
   await loadFont('CoupeurCarve', './assets/fonts/CoupeurCarve-SemiBold.otf', { weight: '100 900' });
   start();
 })();
