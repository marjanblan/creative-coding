// --- browser globals only ---
const canvasSketch = window.canvasSketch;
const random = window.canvasSketchUtil && window.canvasSketchUtil.random;
const { mapRange } = window.canvasSketchUtil && window.canvasSketchUtil.math;

// быстрая проверка, что либы дошли
console.log('[sketch] libs:', !!canvasSketch, !!random, !!mapRange);

const settings = {
  dimensions: [1080, 1350],
  animate: true,
  fps: 24
};

const sketch = () => {
  console.log('[sketch] create');
  return ({ context, width, height }) => {
    // простая проверка рендера
    context.fillStyle = '#111';
    context.fillRect(0, 0, width, height);

    context.fillStyle = '#ff4b41';
    context.fillRect(50, 50, 200, 200);

    context.fillStyle = '#fff';
    context.font = '24px sans-serif';
    context.fillText('it works', 60, 90);
  };
};

canvasSketch(sketch, {
  ...settings,
  canvas: document.getElementById('c'),
  context: '2d' // ВАЖНО для кастомного canvas
});