/* SHIFT — live-view browser build (no canvas-sketch)
 * Author: Ruslan Mashkov
 * Notes: 1080×1350 logical size, DPR-aware render, auto-fit to window.
 * Controls: window.player.play(), window.player.pause(); Space toggles.
 */

 import { makeNoise4D } from './noise.js';
 
 const settings = {
   dimensions: [1080, 1350],
   duration: 12
 };
 
 const SEED = 128;
 const noise4D = makeNoise4D(SEED);
 const palette = ['#FF4B41', '#9745FF', '#72F5A4', '#FFC0F0', '#FFE64F'];
 
 async function loadFont(name, url, descriptors = {}) {
   const f = new FontFace(name, `url(${url})`, descriptors);
   await f.load(); document.fonts.add(f); await document.fonts.ready;
 }
 
 function mapRange(v, a, b, c, d) { return c + (d - c) * ((v - a) / (b - a)); }
 
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
 
 (async function main() {
   await loadFont('CoupeurCarve', './assets/fonts/CoupeurCarve-SemiBold.otf', { weight: '100 900' });
 
   const canvas = document.getElementById('c');
   const [W, H] = settings.dimensions;
   const ctx = fitCanvas(canvas, W, H);
 
   let raf = 0;
   let playing = true;
 
   // чтобы пауза/резюм продолжали с той же фазы
   let elapsed = 0;                  // сек
   let baseTime = performance.now(); // ms
 
   function render(playhead) {
     // фон
     ctx.fillStyle = '#000';
     ctx.fillRect(0, 0, W, H);
 
     // заголовки
     ctx.save();
     ctx.fillStyle = '#FF4B41';
     ctx.textAlign = 'center';
     ctx.textBaseline = 'middle';
     ctx.font = `100 ${Math.round(W * 0.2)}px 'CoupeurCarve', sans-serif`;
     ctx.fillText('SHIFT', W / 2, H * 0.112);
 
     ctx.font = `20px 'CoupeurCarve', sans-serif`;
     ctx.fillText('Issue 01', W * 0.643, H * 0.064);
 
     ctx.font = `20px 'CoupeurCarve', sans-serif`;
     ctx.fillText('The Year Everything Moved', W / 2, H * 0.95);
     ctx.restore();
 
     // сетка
     const cols = 48, rows = 48;
     const margin = W * 0.1;
     const gw = W - margin * 2;
     const gh = H - margin * 2;
     const cw = gw / cols;
     const ch = gh / rows;
 
     const angle = playhead * Math.PI * 2;
 
     for (let y = 0; y < rows; y++) {
       for (let x = 0; x < cols; x++) {
         const cx = margin + x * cw + cw / 2;
         const cy = margin + y * ch + ch / 2;
 
         const u = cols <= 1 ? 0.5 : x / (cols - 1);
         const v = rows <= 1 ? 0.5 : y / (rows - 1);
 
         const n = noise4D(u, v, Math.cos(angle), Math.sin(angle));
 
         const radius = cw * 0.5 * mapRange(n, -1, 1, 0.1, 2.4);
         const dx = mapRange(n, -1, 1, -cw * 0.1, cw * 0.1);
         const dy = mapRange(n, -1, 1, -ch * 0.1, ch * 0.1);
 
         const k = palette.length;
         const rowOffset = (3 * y) % k;
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
   }
 
   function tick(now) {
     if (!playing) return;
     elapsed = (now - baseTime) / 1000;
     const playhead = (elapsed % settings.duration) / settings.duration;
     render(playhead);
     raf = requestAnimationFrame(tick);
   }
 
   // публичный API для кнопок
   window.__demo = {
     play() {
       if (playing) return;
       playing = true;
       baseTime = performance.now() - elapsed * 1000; // продолжить с той же фазы
       raf = requestAnimationFrame(tick);
     },
     pause() {
       if (!playing) return;
       playing = false;
       cancelAnimationFrame(raf);
     }
   };
 
   // старт
   raf = requestAnimationFrame(tick);
 })();


