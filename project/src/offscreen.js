let _canvas = null;
let _contextType = null;
let _ctx = null;
let _id = null;

onmessage = function (evt) {
  const { key, data } = evt.data;
  switch (key) {
    case "init":
      [_canvas, _contextType] = data;
      _ctx = _canvas.getContext(_contextType);
      break;
    case "draw":
      const [x, u] = data;
      draw(x, u);
      break;
    case "resize":
      const [width, height] = data;
      resize(width, height);
      break;
    case "stop":
      cancelAnimationFrame(_id);
      break;
    default:
  }
};

// -----------------

function draw(x, u) {
  function render() {
    _ctx.beginPath();
    _ctx.moveTo(20, 20);
    _ctx.lineTo(x, u);
    _ctx.stroke();
    _ctx.closePath();
    _id = requestAnimationFrame(render);
  }
  render();
}
function resize(width, height) {
  _canvas.width = width;
  _canvas.height = height;
}
