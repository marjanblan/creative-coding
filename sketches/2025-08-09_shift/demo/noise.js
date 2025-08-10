// noise.js — компактный 4D value-noise с детерминированным seed
// Авторский мини-модуль: без зависимостей, быстрый и «мягкий» (quintic easing)

function mulberry32(seed) {
  let t = seed >>> 0;
  return function() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ t >>> 15, 1 | t);
    r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
    return ((r ^ r >>> 14) >>> 0) / 4294967295;
  };
}

// хеш для решётки: смешиваем координаты и сид
function lattice(seed) {
  const rnd = mulberry32(seed);
  // берём 1024 случайных значений для ускорения (таблица)
  const table = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) table[i] = rnd();
  return function(ix, iy, iz, iw) {
    // быстрое смешивание четырёх int в индекс 0..1023
    let h = (ix * 374761393) ^ (iy * 668265263) ^ (iz * 2147483647) ^ (iw * 1597334677) ^ seed;
    // xorshift / avalanching
    h ^= h >>> 13; h = Math.imul(h, 1274126177);
    h ^= h >>> 16;
    return table[h & 1023]; // значение в углу гиперкуба
  };
}

// плавная квинтическая интерполяция
function smooth(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a, b, t) { return a + (b - a) * t; }

// фабрика 4D-шуума
export function makeNoise4D(seed = 1) {
  const at = lattice(seed >>> 0);
  return function noise4D(x, y, z, w) {
    const x0 = Math.floor(x),  y0 = Math.floor(y);
    const z0 = Math.floor(z),  w0 = Math.floor(w);
    const tx = smooth(x - x0), ty = smooth(y - y0);
    const tz = smooth(z - z0), tw = smooth(w - w0);

    // 16 углов гиперкуба
    const c0000 = at(x0,   y0,   z0,   w0  );
    const c1000 = at(x0+1, y0,   z0,   w0  );
    const c0100 = at(x0,   y0+1, z0,   w0  );
    const c1100 = at(x0+1, y0+1, z0,   w0  );
    const c0010 = at(x0,   y0,   z0+1, w0  );
    const c1010 = at(x0+1, y0,   z0+1, w0  );
    const c0110 = at(x0,   y0+1, z0+1, w0  );
    const c1110 = at(x0+1, y0+1, z0+1, w0  );

    const c0001 = at(x0,   y0,   z0,   w0+1);
    const c1001 = at(x0+1, y0,   z0,   w0+1);
    const c0101 = at(x0,   y0+1, z0,   w0+1);
    const c1101 = at(x0+1, y0+1, z0,   w0+1);
    const c0011 = at(x0,   y0,   z0+1, w0+1);
    const c1011 = at(x0+1, y0,   z0+1, w0+1);
    const c0111 = at(x0,   y0+1, z0+1, w0+1);
    const c1111 = at(x0+1, y0+1, z0+1, w0+1);

    // интерполяция по x
    const x000 = lerp(c0000, c1000, tx);
    const x100 = lerp(c0100, c1100, tx);
    const x010 = lerp(c0010, c1010, tx);
    const x110 = lerp(c0110, c1110, tx);

    const x001 = lerp(c0001, c1001, tx);
    const x101 = lerp(c0101, c1101, tx);
    const x011 = lerp(c0011, c1011, tx);
    const x111 = lerp(c0111, c1111, tx);

    // по y
    const y00 = lerp(x000, x100, ty);
    const y10 = lerp(x010, x110, ty);
    const y01 = lerp(x001, x101, ty);
    const y11 = lerp(x011, x111, ty);

    // по z
    const z0v = lerp(y00, y10, tz);
    const z1v = lerp(y01, y11, tz);

    // по w → итог [-1..1]
    return lerp(z0v, z1v, tw) * 2 - 1;
  };
}
