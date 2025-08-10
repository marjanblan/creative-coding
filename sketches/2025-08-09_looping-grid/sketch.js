const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const { mapRange } = require('canvas-sketch-util/math');

// ---------- helpers ----------
async function loadFont(name, url, descriptors = {}) {
  // FontFace API — доступен в браузере (режим --open)
  const font = new FontFace(name, `url(${url})`, descriptors);
  const loaded = await font.load();
  document.fonts.add(loaded);
  await document.fonts.ready; // дождаться, чтобы канва рисовала уже загруженным шрифтом
}

// Settings for the sketch
const settings = {
  // Canvas dimensions (portrait orientation)
  dimensions: [1080, 1350],
  // Enable animation mode
  animate: true,
  // Duration of one complete loop (seconds)
  duration: 12,
  // Frames per second (optional; defaults to 30 if not set)
  fps: 24,
  // High‑resolution export settings
  pixelsPerInch: 72,
  export: true,     
  exportPixelRatio: 1
};

// Seed the pseudo‑random number generator once, to keep behavior reproducible
const SEED = 128;
random.setSeed(SEED);

// палитра вне цикла (не создаём массив 48*48 раз)
const palette = ['#FF4B41', '#9745FF','#72F5A4', '#FFC0F0','#FFE64F'];

// Main sketch  function
const sketch = async () => {
  await loadFont('CoupeurCarve', './assets/fonts/CoupeurCarve-SemiBold.otf', { weight: '100 900' });
  return ({ context, width, height, playhead }) => {
    // Clear the canvas with a dark background
    context.fillStyle = '#000000';
    context.fillRect(0, 0, width, height);

    // 2. Текст на фоне
    context.save();
    context.fillStyle = '#FF4B41';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = `100 ${Math.round(width * 0.2)}px 'CoupeurCarve', sans-serif`;
    context.fillText('SHIFT', width / 2, height * 0.112);
    context.font = `20px 'CoupeurCarve', sans-serif`;
    context.fillText('Issue 01', width * 0.643, height * 0.064);
    context.font = `20px 'CoupeurCarve', sans-serif`;
    context.fillText('The Year Everything Moved', width / 2, height * 0.95); // 20% высоты — как у тебя
    context.restore();

    // Grid parameters
    const cols = 48 ;
    const rows = 48;
    const margin = width * 0.1;
    const gw = width - margin * 2;
    const gh = height - margin * 2;
    const cw = gw / cols;
    const ch = gh / rows;

    // Convert the playhead (0..1) into an angle around the unit circle.
    // Multiplying by 2π ensures the values wrap around seamlessly.
    //const angle = playhead * Math.PI * 2;
    const speed = 1; // 0.5 — вдвое медленнее, 2 — вдвое быстрее
    const angle = playhead * Math.PI * 2 * speed;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Center of this cell
        const cx = margin + x * cw + cw / 2;
        const cy = margin + y * ch + ch / 2;

        // Normalized coordinates (0..1) for noise input
        const u = cols <= 1 ? 0.5 : x / (cols - 1);
        const v = rows <= 1 ? 0.5 : y / (rows - 1);

        // Sample 4D simplex noise on a loop: u,v are spatial coords; cos/sin(angle) loop around
        const n = random.noise4D(u, v, Math.cos(angle), Math.sin(angle), 1.5, 1);

        // Map noise (-1..1) to radius scaling
        const radius = cw * 0.5 * mapRange(n, -1, 1, 0.1, 2.4);

        // Displace the center based on noise for a subtle wiggle
        const dx = mapRange(n, -1, 1, -cw * 0.1, cw * 0.1);
        const dy = mapRange(n, -1, 1, -ch * 0.1, ch * 0.1);

        // Alternate colors based on grid parity
        // Палитра из 5 цветов (можешь поменять на свои)
        
        const k = palette.length;

        // Внутри двойного цикла по x,y:
        const rowOffset = (3 * y) % k;      // «джиттер» строки
        const idx = (x + rowOffset) % k;       // 2 — коэффициент "шага" по строкам
        const color = palette[idx]; 
        context.fillStyle = color;

        context.save();
        context.translate(cx + dx, cy + dy);

        // Determine shape deterministically from noise to avoid jump at loop boundary
        // Use a different offset in noise space for shape selection
        const shapeNoise = random.noise4D(u + 5, v + 5, Math.cos(angle) * 2, Math.sin(angle) * 2);
        const isSquare = shapeNoise > 0;

        if (isSquare) {
          const size = radius * 1.4;
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

// Start the sketch with the defined settings
canvasSketch(sketch, settings);