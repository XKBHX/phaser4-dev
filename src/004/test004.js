function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

class Game {
  constructor() {
    var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 800;
    var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 600;

    _defineProperty(this, "canvas", void 0);

    _defineProperty(this, "context", void 0);

    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    document.body.appendChild(this.canvas);
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

function Android() {
  var ua = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : navigator.userAgent;
  return /Android/.test(ua);
}

function iOS() {
  var ua = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : navigator.userAgent;
  var result = {
    iOS: false,
    iOSVersion: 0,
    iPhone: false,
    iPad: false
  };

  if (/iP[ao]d|iPhone/i.test(ua)) {
    navigator.appVersion.match(/OS (\d+)/);
    result.iOS = true;
    result.iOSVersion = parseInt(RegExp.$1, 10);
    result.iPhone = ua.toLowerCase().indexOf('iphone') !== -1;
    result.iPad = ua.toLowerCase().indexOf('ipad') !== -1;
  }

  return result;
}

var game = new Game();
var {
  iOS: iOS$1,
  iOSVersion,
  iPad,
  iPhone
} = iOS();
game.text(10, 20, 'Phaser 4 Test 004');
game.text(10, 60, 'Android: ' + Android());
game.text(10, 160, 'iOS: ' + iOS$1);
game.text(10, 180, 'iOSVerion: ' + iOSVersion);
game.text(10, 200, 'iPad: ' + iPad);
game.text(10, 220, 'iPhone: ' + iPhone);
