function isCordova() {
  return window.hasOwnProperty('cordova');
}

function isWindows() {
  return /Windows/.test(navigator.userAgent);
}

function AddToDOM(element, parent) {
  var target;

  if (parent) {
    if (typeof parent === 'string') {
      target = document.getElementById(parent);
    } else if (typeof parent === 'object' && parent.nodeType === 1) {
      target = parent;
    }
  } else if (element.parentElement) {
    return element;
  }

  if (!target) {
    target = document.body;
  }

  target.appendChild(element);
  return element;
}

function DOMContentLoaded(callback) {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    callback();
    return;
  }

  var check = () => {
    document.removeEventListener('deviceready', check, true);
    document.removeEventListener('DOMContentLoaded', check, true);
    window.removeEventListener('load', check, true);
    callback();
  };

  if (!document.body) {
    window.setTimeout(check, 20);
  } else if (isCordova()) {
    document.addEventListener('deviceready', check, true);
  } else {
    document.addEventListener('DOMContentLoaded', check, true);
    window.addEventListener('load', check, true);
  }
}

class Game {
  constructor(init) {
    this.isBooted = false;
    this.isRunning = false;
    this._initCallback = init;
    DOMContentLoaded(() => this.boot());
  }

  boot() {
    console.log('Phaser 4.0.0-alpha.3');
    this.isBooted = true;
    this.createDebugCanvas();
    AddToDOM(this.canvas);

    this._initCallback(this);
  }

  createDebugCanvas() {
    var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 800;
    var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 600;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.context = this.canvas.getContext('2d');
    this.context.fillStyle = '#2d2d2d';
    this.context.fillRect(0, 0, width, height);
  }

  drawImage(image) {
    var x = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var y = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    this.context.drawImage(image, x, y);
  }

  draw(text) {
    this.context.fillStyle = '#ff0000';
    this.context.fillText(text, 10, 40);
    this.context.fillStyle = '#0000ff';
    this.context.fillText(text, 10, 20);
    this.context.fillStyle = '#ffff00';
    this.context.fillText(text, 10, 60);
  }

  text(x, y, text) {
    this.context.fillStyle = '#00ff00';
    this.context.font = '16px Courier';
    this.context.fillText(text, x, y);
  }

}

var BaseLoaderState;

(function (BaseLoaderState) {
  BaseLoaderState[BaseLoaderState["IDLE"] = 0] = "IDLE";
  BaseLoaderState[BaseLoaderState["LOADING"] = 1] = "LOADING";
  BaseLoaderState[BaseLoaderState["PROCESSING"] = 2] = "PROCESSING";
  BaseLoaderState[BaseLoaderState["COMPLETE"] = 3] = "COMPLETE";
  BaseLoaderState[BaseLoaderState["SHUTDOWN"] = 4] = "SHUTDOWN";
  BaseLoaderState[BaseLoaderState["DESTROYED"] = 5] = "DESTROYED";
})(BaseLoaderState || (BaseLoaderState = {}));

var FileState;

(function (FileState) {
  FileState[FileState["PENDING"] = 0] = "PENDING";
  FileState[FileState["LOADING"] = 1] = "LOADING";
  FileState[FileState["LOADED"] = 2] = "LOADED";
  FileState[FileState["FAILED"] = 3] = "FAILED";
  FileState[FileState["PROCESSING"] = 4] = "PROCESSING";
  FileState[FileState["ERRORED"] = 5] = "ERRORED";
  FileState[FileState["COMPLETE"] = 6] = "COMPLETE";
  FileState[FileState["DESTROYED"] = 7] = "DESTROYED";
  FileState[FileState["POPULATED"] = 8] = "POPULATED";
  FileState[FileState["TIMED_OUT"] = 9] = "TIMED_OUT";
  FileState[FileState["ABORTED"] = 10] = "ABORTED";
})(FileState || (FileState = {}));

new Game(game => {
  game.text(10, 10, 'Phaser 4 Test 008 - ' + isWindows());
});
