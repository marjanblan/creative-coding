const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { alpha: false });

function resize() {
  const ratio = window.devicePixelRatio || 1;
  const w = 1080, h = 1350; // poster aspect
  canvas.width = w * ratio;
  canvas.height = h * ratio;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
resize();
window.addEventListener('resize', resize);

function rnd(a,b){ return a + Math.random()*(b-a); }

function draw(t) {
  // background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // sample generative: drifting circles
  const W = canvas.width / (window.devicePixelRatio || 1);
  const H = canvas.height / (window.devicePixelRatio || 1);
  const n = 120;
  for (let i=0;i<n;i++){
    const x = (Math.sin(0.001*t + i)*0.5+0.5) * W;
    const y = (Math.cos(0.0012*t + i*0.7)*0.5+0.5) * H;
    const r = 6 + 4*Math.sin(0.002*t + i);
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fillStyle = `hsl(${(i*7 + t*0.02)%360} 80% 60%)`;
    ctx.fill();
  }

  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
