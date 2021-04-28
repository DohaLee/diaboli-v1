"use strict";

let _canvas = null;
let _contextType = null;
let _ctx = null;
let _id = null;

let _img = null;

onmessage = function (evt) {
  const { key, data } = evt.data;
  switch (key) {
    case "init":
      [_canvas, _contextType, img] = data;
      _ctx = _canvas.getContext(_contextType);
      _img = img;
      break;
    case "draw":
      draw(data); // [img, x, y, w, h]
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

function draw(data) {
  const [imgNumber, x, y, w, h] = data;
  console.log("Asd");
  function render() {
    if (img.list[0]) {
      _ctx.drawImage(_img[0], x, y, w, h);
      _id = requestAnimationFrame(render);
    }
  }
  render();
}
function resize(width, height) {
  _canvas.width = width;
  _canvas.height = height;
}
