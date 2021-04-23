"use strict";

function checkNumber(n, min, max) {
  return n < min || n > max ? false : true;
}

// --------------------
class SystemObject {
  constructor(parentSelector) {
    this._parentSelector = parentSelector;
    this._parent = document.querySelector(parentSelector);
    if (!this._parent) this._parent = document.body;
  }
  get parentSelector() {
    return this._parentSelector;
  }
  get parent() {
    return this._parent;
  }
}

class Layer extends SystemObject {
  constructor(parentSelector = null, context = "2d") {
    super(parentSelector);
    this._canvas = document.createElement("canvas");
    this._ctx = this._canvas.getContext(context);
    this.append(this._parent);
    this.fitInParent();
  }
  append(parentElement) {
    if (!parentElement instanceof HTMLElement)
      throw new Error("Not a HTMLElement.");
    parentElement.appendChild(this._canvas);
    this._parent = parentElement;
  }
  fitInParent() {
    if (!this._parent) return;
    const parentStyle = this._parent.style;
    if (parentStyle.position !== "relative") {
      parentStyle.position = "relative";
    }
    const canvasStyle = this._canvas.style;
    canvasStyle.position = "absolute";
    canvasStyle.top = 0;
    canvasStyle.left = 0;
    this._canvas.width = this._parent.clientWidth;
    this._canvas.height = this._parent.clientHeight;
  }
  justResize() {
    this._canvas.width = this._parent.clientWidth;
    this._canvas.height = this._parent.clientHeight;
  }
  draw() {
    this._ctx.beginPath();
    this._ctx.moveTo(20, 20);
    this._ctx.lineTo(130, 130);
    this._ctx.stroke();
    this._ctx.closePath();
  }
  get context() {
    return this._ctx;
  }
  get canvas() {
    return this._canvas;
  }
}

class LayerList extends SystemObject {
  MAX_LAYER_NUMBER = 99;
  constructor(n = 0, parentSelector = null, context = "2d") {
    super(parentSelector);
    this._list = [];
    this.createLayers(n);
  }
  createLayers(n) {
    if (checkNumber(n, 1, this.MAX_LAYER_NUMBER) === false)
      throw new Error("Out of Number");
    //-------
    for (let count = 0; count < n; count++)
      this._list.push(new Layer(this._parentSelector));
    //-------
  }
  resize() {
    this._list.forEach((layer) => layer.justResize());
  }
  fitInParent() {
    this._list.forEach((layer) => layer.fitInParent());
  }
  render() {
    this._list.forEach((layer) => layer.draw());
  }
  get list() {
    return this._list;
  }
}

class World extends SystemObject {
  // *** canvasSelector must be 'Canvas Object' in HTML. ***
  constructor(parentSelector, nLayers = 1, context = "2d") {
    super(parentSelector);
    this._layers = new LayerList(nLayers, parentSelector, context);
    this._isWorking = false;
    this.init();
  }
  init() {
    this.addEventListeners();
    this._isWorking = true;
  }
  addEventListeners() {
    window.addEventListener("resize", () => this._layers.resize());
  }
  update() {
    if (this._isWorking === false) return;
    this._layers.render();
  }
  set parent(parentElement) {
    if (!parentElement instanceof HTMLElement)
      throw new Error("Not a HTMLElement");
    this._parent = parentElement;
    this._layers.fitInParent();
  }
  get isWorking() {
    return this._isWorking;
  }
  get layers() {
    return this._layers;
  }
}

let stage = new World(".stage");

function animate() {
  stage.update();
  requestAnimationFrame(animate); // 60 fps
}

animate();
