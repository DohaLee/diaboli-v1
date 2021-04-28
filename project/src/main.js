"use strict";

// Path

const OFFSCREEN_PATH = "src/offscreen.js";

// --------------------

function checkMinMax(n, min, max) {
  return n < min || n > max ? false : true;
}

class ENUM {
  constructor(keyArray) {
    this._keys = [];
    this.keys = keyArray;
    this._locked = true; // Default.
  }
  get(key) {
    return this._keys.indexOf(key);
  }
  get n() {
    return this._keys.length;
  }
  set keys(array) {
    if (this._locked) throw new Error("It is locked.");
    if (Array.isArray(array)) {
      this._keys = array;
    } else {
      throw Error("Not an Array");
    }
  }
  get keys() {
    return this._keys;
  }
  set locked(bool) {
    if (typeof bool === "boolean") this._locked = bool;
  }
  get locked() {
    return this._locked;
  }
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

class WObject {
  constructor() {}
}

// --------------------

class Img {
  constructor(imgSrcArray) {
    this.list = [];
    this.init(imgSrcArray);
  }
  init(imgSrcArray) {
    if (Array.isArray(imgSrcArray)) {
      for (const imgSrc of imgSrcArray) {
        if (typeof imgSrc !== "string") continue;
        let img = new Image();
        img.src = imgSrc;
        this.list.push(img);
      }
    }
  }
}
// Source

const img = new Img([
  "https://weraveyou.com/wp-content/uploads/2021/03/elon-musk.jpeg",
]);

class Character extends WObject {
  constructor() {
    super();
  }
}

// --------------------

class Layer extends SystemObject {
  constructor(parentSelector = null, contextType = "2d") {
    super(parentSelector);
    this._canvas = document.createElement("canvas");
    this.appended(this._parent);
    this.fitInParent();

    this._running = false;
    this._contextType = contextType;
    if (this._useWorker) {
      this._offscreen = this._canvas.transferControlToOffscreen();
      this._worker = new Worker(OFFSCREEN_PATH);
      this._worker.onmessage = function (e) {};
      console.log(img.list);
      this.sendMessageToWorker(
        "init",
        [this._offscreen, this._contextType, img.list],
        [this._offscreen]
      );
    } else {
      this._ctx = this._canvas.getContext(this._contextType);
    }
  }
  appended(parentElement) {
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
        this.sendMessageToWorker("draw", [
          0,
          Math.random() * 100, // X
          Math.random() * 100, // Y
          200, // Width
          200, // Height
        ]);
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
    if (checkMinMax(n, 1, this.MAX_LAYER_NUMBER) === false)
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
  import(wObject, layerIndex) {}
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
    this._layer = new LayerManager(nLayers, parentSelector, contextType);
    this._isWorking = false;
    this.init();
  }
  init() {
    this.addEventListeners();
    this._isWorking = true;
  }
  addEventListeners() {
    window.addEventListener("resize", () => this._layer.resize());
  }
  run() {
    if (this._isWorking === false) return;
    this._layer.startRendering();
  }
  import(wObject, layerIndex) {}
  set parent(parentElement) {
    if (!parentElement instanceof HTMLElement)
      throw new Error("Not a HTMLElement");
    this._parent = parentElement;
    this._layer.fitInParent();
  }
  get isWorking() {
    return this._isWorking;
  }
  get layer() {
    return this._layer;
  }
}

const eLAYERS = new ENUM(["MAIN", "UI"]);

const stage = new World(".stage", eLAYERS.n);

const diaboli = new Character();

stage.import(diaboli, eLAYERS.get("MAIN"));

stage.run();
