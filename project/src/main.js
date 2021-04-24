"use strict";

// Path

const OFFSCREEN_PATH = "src/offscreen.js";

// --------------------

function checkNumber(n, min, max) {
  return n < min || n > max ? false : true;
}

// --------------------
class SystemObject {
  constructor(parentSelector) {
    this._parentSelector = parentSelector;
    this._parent = document.querySelector(parentSelector);
    if (!this._parent) this._parent = document.body;
    this._useWorker = "OffscreenCanvas" in window;
  }
  get useWorker() {
    return this._useWorker;
  }
  get parentSelector() {
    return this._parentSelector;
  }
  get parent() {
    return this._parent;
  }
}

class Layer extends SystemObject {
  constructor(parentSelector = null, contextType = "2d") {
    super(parentSelector);
    this._canvas = document.createElement("canvas");
    this.append(this._parent);
    this.fitInParent();

    this._running = false;
    this._contextType = contextType;
    if (this._useWorker) {
      this._offscreen = this._canvas.transferControlToOffscreen();
      this._worker = new Worker(OFFSCREEN_PATH);
      this._worker.onmessage = function (e) {};
      this.sendMessageToWorker(
        "init",
        [this._offscreen, this._contextType],
        [this._offscreen]
      );
    } else {
      this._ctx = this._canvas.getContext(this._contextType);
    }
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
    if (this._useWorker) {
      this.sendMessageToWorker("resize", [
        this._parent.clientWidth,
        this._parent.clientHeight,
      ]);
    } else {
      this._canvas.width = this._parent.clientWidth;
      this._canvas.height = this._parent.clientHeight;
    }
  }
  sendMessageToWorker(key, data, etc = null) {
    this._worker.postMessage(
      {
        key,
        data,
      },
      etc
    );
  }

  start() {
    this.running = true;
  }
  stop() {
    this.running = false;
  }
  set running(bool) {
    if (this._useWorker) {
      // Use Worker.
      if (bool) {
        // Run.
        this.sendMessageToWorker("draw", [100, 200]);
      } else {
        // Stop.
        this.sendMessageToWorker("stop", []);
      }
    } else {
      // No Worker
      if (bool) {
        // Run.
        this._ctx.beginPath();
        this._ctx.moveTo(20, 20);
        this._ctx.lineTo(130, 130);
        this._ctx.stroke();
        this._ctx.closePath();
      } else {
        // Stop.
        if (this._rAf_id) cancelAnimationFrame(this._rAf_id);
      }
    }
    this._running = bool;
  }

  get running() {
    return this._running;
  }
  get worker() {
    return this._worker;
  }
  get offscreen() {
    return this._offscreen;
  }
  get contextType() {
    return this._contextType;
  }
  get context() {
    return this._ctx;
  }
  get canvas() {
    return this._canvas;
  }
}

class LayerManager extends SystemObject {
  rAf_id = 0;
  MAX_LAYER_NUMBER = 99;
  constructor(n = 0, parentSelector = null, contextType = "2d") {
    super(parentSelector);
    this._contextType = contextType;
    this._list = [];
    this.createLayers(n);
  }
  createLayers(n) {
    if (checkNumber(n, 1, this.MAX_LAYER_NUMBER) === false)
      throw new Error("Out of Number");
    //-------
    for (let count = 0; count < n; count++)
      this._list.push(new Layer(this._parentSelector, this._contextType));
    //-------
  }
  resize() {
    this._list.forEach((layer) => layer.justResize());
  }
  fitInParent() {
    this._list.forEach((layer) => layer.fitInParent());
  }
  startRendering() {
    this._list.forEach((layer) => layer.start());
    if (!this._useWorker) {
      this.rAf_id = requestAnimationFrame(() => this.startRendering()); // 60 fps
    }
  }
  stopRendering() {
    this._list.forEach((layer) => layer.stop());
    if (!this._useWorker) {
      cancelAnimationFrame(this.rAf_id);
    }
  }
  get contextType() {
    return this._contextType;
  }
  get list() {
    return this._list;
  }
}

class World extends SystemObject {
  // *** canvasSelector must be 'Canvas Object' in HTML. ***
  constructor(parentSelector, nLayers = 1, contextType = "2d") {
    super(parentSelector);
    this._layers = new LayerManager(nLayers, parentSelector, contextType);
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
  run() {
    if (this._isWorking === false) return;
    this._layers.startRendering();
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

stage.run();
