"use strict";

class World {
  constructor(context = "2d", canvasSelector = "canvas") {
    this._canvas = document.querySelector(canvasSelector);
    this._ctx = this._canvas.getContext(context);
    this._canvas && this._ctx //
      ? (this._work = true)
      : (this._work = false);
    this.init();
  }
  init() {
    this.resize();
    this.addEventListeners();
  }
  resize() {
    this._canvas.width = window.innerWidth;
    this._canvas.height = window.innerHeight;
  }
  addEventListeners() {
    window.addEventListener("resize", () => this.resize());
  }
  update() {
    this._ctx.beginPath();
    this._ctx.moveTo(20, 20);
    this._ctx.lineTo(130, 130);
    this._ctx.stroke();
    this._ctx.closePath();
  }
  get work() {
    return this._work;
  }
  get canvas() {
    return this._canvas;
  }
  get ctx() {
    return this._ctx;
  }
}

let stage = new World();

function animate() {
  stage.update();
  requestAnimationFrame(animate); // 60 fps
}

animate();
