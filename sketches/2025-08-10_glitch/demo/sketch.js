/**
 * GLITCH — generative poster
 * Author: Ruslan Mashkov (@marjanblan)
 * Runtime: vanilla canvas + seeded random + loopable value noise
 */

const $ = s => document.querySelector(s);
const canvas = $('#c');
const ctx = canvas.getContext('2d', { alpha: false });

function fitCanvas() {
  const p = canvas.parentElement;
  const cssW = p.clientWidth, cssH = p.clientHeight;
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener('resize', fitCanvas);

let running = true, t0 = performance.now(), last = t0, elapsed = 0;
const settings = { animate:true, duration:12, fps:60 };
$('#btnPlay').onclick  = () => { if (!running){ running = true; last = performance.now(); requestAnimationFrame(loop); } };
$('#btnPause').onclick = () => running = false;
$('#btnFS').onclick    = () => document.documentElement.requestFullscreen?.();

/* seeded rnd + simple loop noise */
let SEED = 129;
function mulberry32(a){return function(){let t=(a+=0x6D2B79F5)|0;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}}
const rnd = mulberry32(SEED);
function hash(x, y){let t=x*374761393+y*668265263+(SEED|0)*1442695041;t=(t^(t>>13))*1274126177;return ((t^(t>>16))>>>0)/4294967295;}
function lerp(a,b,t){return a+(b-a)*t;}
function smooth(t){return t*t*(3-2*t);}
function noise2D(x,y){const x0=Math.floor(x),y0=Math.floor(y),x1=x0+1,y1=y0+1;const sx=smooth(x-x0),sy=smooth(y-y0);const n00=hash(x0,y0),n10=hash(x1,y0),n01=hash(x0,y1),n11=hash(x1,y1);const nx0=lerp(n00,n10,sx),nx1=lerp(n01,n11,sx);return lerp(nx0,nx1,sy)*2-1;}
function loopNoise(u,v,playhead,scale=1.5){const a=Math.cos(playhead*2*Math.PI),b=Math.sin(playhead*2*Math.PI);return 0.5*(noise2D(u*scale+a,v*scale+b)+noise2D(u*scale-b,v*scale+a));}
function mapRange(v,a,b,c,d){return c+(v-a)*(d-c)/(b-a);}

async function loadFont(name,url,desc={}){const f=new FontFace(name,`url(${url})`,desc);await f.load();document.fonts.add(f);await document.fonts.ready;}

const palette = ['#FF4B41', '#9745FF', '#72F5A4', '#FFC0F0', '#FFE64F'];

async function create(){
  await loadFont('CoupeurCarve', './assets/fonts/CoupeurCarve-SemiBold.otf', { weight: '100 900' });

  return ({ context, width, height, playhead }) => {
	context.fillStyle = '#000'; context.fillRect(0,0,width,height);

	// header
	context.save();
	context.fillStyle = '#9745FF';
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	context.font = `100 ${Math.round(width * 0.2)}px 'CoupeurCarve', sans-serif`;
	context.fillText('GLITCH', width/2, height*0.112);

	context.fillStyle = '#000';
	context.font = `20px 'CoupeurCarve', sans-serif`;
	context.fillText('Issue 02', width*0.515, height*0.038);

	context.fillStyle = '#9745FF';
	context.font = `20px 'CoupeurCarve', sans-serif`;
	context.fillText('When Machines Dream in Noise', width/2, height*0.95);
	context.restore();

	// grid
	const cols = 64, rows = 120;
	const margin = width * 0.1;
	const gw = width - margin*2;
	const gh = height - margin*2;
	const cw = gw / cols;
	const ch = gh / rows;

	for (let y=0; y<rows; y++){
	  for (let x=0; x<cols; x++){
		const cx = margin + x*cw + cw/2;
		const cy = margin + y*ch + ch/2;

		const u = cols<=1 ? 0.5 : x/(cols-1);
		const v = rows<=1 ? 0.5 : y/(rows-1);

		const n = loopNoise(u, v, playhead, 1.5);
		const radius = cw * 0.2 * mapRange(n, -1, 1, 0.1, 2.4);
		const dx = mapRange(n, -1, 1, -cw*0.1, cw*0.1);
		const dy = mapRange(n, -1, 1, -ch*0.1, ch*0.1);

		const rowOffset = (4*y) % palette.length;
		const idx = (x + rowOffset) % palette.length;
		context.fillStyle = palette[idx];

		context.save();
		context.translate(cx + dx, cy + dy);

		const s = loopNoise(u+5, v+5, playhead, 3.0);
		if (s > 0) {
		  const size = radius * 0.8;
		  context.beginPath();
		  context.rect(-size/2, -size/2, size, size);
		  context.fill();
		} else {
		  context.beginPath();
		  context.arc(0,0,radius,0,Math.PI*2);
		  context.fill();
		}
		context.restore();
	  }
	}
  };
}

/* runtime */
function loop(ts){
  if (!running) return;
  const dt = (ts - last)/1000; last = ts;
  if (settings.animate) elapsed = (ts - t0)/1000;
  const width = canvas.clientWidth, height = canvas.clientHeight;
  const playhead = settings.duration>0 ? (elapsed % settings.duration)/settings.duration : 0;
  render?.({ context: ctx, width, height, playhead, time: elapsed, delta: dt });
  requestAnimationFrame(loop);
}
let render;
(async function init(){ fitCanvas(); render = await create(); last = performance.now(); requestAnimationFrame(loop); })();
