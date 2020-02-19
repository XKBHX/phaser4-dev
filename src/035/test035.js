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

class Matrix2D {
  constructor() {
    var a = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    var b = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var c = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var d = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
    var tx = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
    var ty = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
    this.set(a, b, c, d, tx, ty);
  }

  set() {
    var a = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    var b = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var c = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var d = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
    var tx = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
    var ty = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.tx = tx;
    this.ty = ty;
    return this;
  }

  identity() {
    return this.set();
  }

  toArray() {
    return [this.a, this.b, this.c, this.d, this.tx, this.ty];
  }

  fromArray(src) {
    return this.set(src[0], src[1], src[2], src[3], src[4], src[5]);
  }

  [Symbol.iterator]() {
    var data = this.toArray();
    return data[Symbol.iterator]();
  }

}

class Vec2 {
  constructor() {
    var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    this.set(x, y);
  }

  set() {
    var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    this.x = x;
    this.y = y;
    return this;
  }

  zero() {
    return this.set();
  }

  getArray() {
    return [this.x, this.y];
  }

  fromArray(src) {
    return this.set(src[0], src[1]);
  }

  [Symbol.iterator]() {
    var data = this.getArray();
    return data[Symbol.iterator]();
  }

}

class Transform {
  constructor() {
    var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var rotation = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var scaleX = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
    var scaleY = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
    this.local = new Matrix2D();
    this.world = new Matrix2D();
    this._position = new Vec2(x, y);
    this._scale = new Vec2(scaleX, scaleY);
    this._skew = new Vec2(0, 0);
    this._origin = new Vec2(0, 0);
    this._rotation = rotation;
    this.dirty = true;
  }

  update() {
    if (!this.dirty) {
      return false;
    }

    var {
      _a,
      _b,
      _c,
      _d,
      _position
    } = this;
    this.local.set(_a, _b, _c, _d, _position.x, _position.y);
    this.dirty = false;
    return true;
  }

  setPosition(x, y) {
    this._position.set(x, y);

    this.dirty = true;
    return this;
  }

  setScale(scaleX) {
    var scaleY = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : scaleX;

    this._scale.set(scaleX, scaleY);

    this.dirty = true;
    this.updateCache();
    return this;
  }

  setSkew(skewX, skewY) {
    this._skew.set(skewX, skewY);

    this.dirty = true;
    this.updateCache();
    return this;
  }

  setOrigin(originX) {
    var originY = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : originX;

    this._origin.set(originX, originY);

    this.dirty = true;
    return this;
  }

  setRotation(rotation) {
    this.rotation = rotation;
    return this;
  }

  updateCache() {
    var {
      _rotation,
      _skew,
      _scale
    } = this;
    this._a = Math.cos(_rotation + _skew.y) * _scale.x;
    this._b = Math.sin(_rotation + _skew.y) * _scale.x;
    this._c = -Math.sin(_rotation - _skew.x) * _scale.y;
    this._d = Math.cos(_rotation - _skew.x) * _scale.y;
  }

  set x(value) {
    this._position.x = value;
    this.dirty = true;
  }

  get x() {
    return this._position.x;
  }

  set y(value) {
    this._position.y = value;
    this.dirty = true;
  }

  get y() {
    return this._position.y;
  }

  set rotation(value) {
    this._rotation = value;
    this.dirty = true;
    this.updateCache();
  }

  get rotation() {
    return this._rotation;
  }

  set scaleX(value) {
    this._scale.x = value;
    this.dirty = true;
    this.updateCache();
  }

  get scaleX() {
    return this._scale.x;
  }

  set scaleY(value) {
    this._scale.y = value;
    this.dirty = true;
    this.updateCache();
  }

  get scaleY() {
    return this._scale.y;
  }

  set originX(value) {
    this._origin.x = value;
    this.dirty = true;
  }

  get originX() {
    return this._origin.x;
  }

  set originY(value) {
    this._origin.y = value;
    this.dirty = true;
  }

  get originY() {
    return this._origin.y;
  }

  set skewX(value) {
    this._skew.x = value;
    this.dirty = true;
    this.updateCache();
  }

  get skewX() {
    return this._skew.x;
  }

  set skewY(value) {
    this._skew.y = value;
    this.dirty = true;
    this.updateCache();
  }

  get skewY() {
    return this._skew.y;
  }

}

class Sprite extends Transform {
  constructor(x, y, width, height) {
    var r = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
    var g = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
    var b = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 1;
    var a = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 1;
    super(x, y);

    _defineProperty(this, "topLeft", void 0);

    _defineProperty(this, "topRight", void 0);

    _defineProperty(this, "bottomLeft", void 0);

    _defineProperty(this, "bottomRight", void 0);

    _defineProperty(this, "rgba", void 0);

    _defineProperty(this, "visible", true);

    _defineProperty(this, "texture", null);

    _defineProperty(this, "uv", {
      topLeft: {
        x: 0,
        y: 0
      },
      topRight: {
        x: 1,
        y: 0
      },
      bottomLeft: {
        x: 0,
        y: 1
      },
      bottomRight: {
        x: 1,
        y: 1
      }
    });

    _defineProperty(this, "_size", void 0);

    this._size = new Vec2(width, height);
    this.topLeft = new Vec2();
    this.topRight = new Vec2();
    this.bottomLeft = new Vec2();
    this.bottomRight = new Vec2();
    this.rgba = {
      r,
      g,
      b,
      a
    };
    this.updateVertices();
  }

  setTexture(texture) {
    this.texture = texture;

    this._size.set(texture.width, texture.height);

    this.dirty = true;
    this.updateVertices();
    return this;
  }

  updateVertices() {
    if (!this.dirty) {
      return false;
    }

    this.update();
    var w = this._size.x;
    var h = this._size.y;
    var x0 = -(this._origin.x * w);
    var x1 = x0 + w;
    var y0 = -(this._origin.y * h);
    var y1 = y0 + h;
    var {
      a,
      b,
      c,
      d,
      tx,
      ty
    } = this.local;
    var x0a = x0 * a;
    var x0b = x0 * b;
    var y0c = y0 * c;
    var y0d = y0 * d;
    var x1a = x1 * a;
    var x1b = x1 * b;
    var y1c = y1 * c;
    var y1d = y1 * d;
    this.topLeft.set(x0a + y0c + tx, x0b + y0d + ty);
    this.topRight.set(x1a + y0c + tx, x1b + y0d + ty);
    this.bottomLeft.set(x0a + y1c + tx, x0b + y1d + ty);
    this.bottomRight.set(x1a + y1c + tx, x1b + y1d + ty);
    return true;
  }

  batch(dataTA, offset) {
    dataTA[offset + 0] = this.topLeft.x;
    dataTA[offset + 1] = this.topLeft.y;
    dataTA[offset + 2] = this.rgba.r;
    dataTA[offset + 3] = this.rgba.g;
    dataTA[offset + 4] = this.rgba.b;
    dataTA[offset + 5] = this.rgba.a;
    dataTA[offset + 6] = this.uv.topLeft.x;
    dataTA[offset + 7] = this.uv.topLeft.y;
    dataTA[offset + 8] = this.bottomLeft.x;
    dataTA[offset + 9] = this.bottomLeft.y;
    dataTA[offset + 10] = this.rgba.r;
    dataTA[offset + 11] = this.rgba.g;
    dataTA[offset + 12] = this.rgba.b;
    dataTA[offset + 13] = this.rgba.a;
    dataTA[offset + 14] = this.uv.bottomLeft.x;
    dataTA[offset + 15] = this.uv.bottomLeft.y;
    dataTA[offset + 16] = this.bottomRight.x;
    dataTA[offset + 17] = this.bottomRight.y;
    dataTA[offset + 18] = this.rgba.r;
    dataTA[offset + 19] = this.rgba.g;
    dataTA[offset + 20] = this.rgba.b;
    dataTA[offset + 21] = this.rgba.a;
    dataTA[offset + 22] = this.uv.bottomRight.x;
    dataTA[offset + 23] = this.uv.bottomRight.y;
    dataTA[offset + 24] = this.topRight.x;
    dataTA[offset + 25] = this.topRight.y;
    dataTA[offset + 26] = this.rgba.r;
    dataTA[offset + 27] = this.rgba.g;
    dataTA[offset + 28] = this.rgba.b;
    dataTA[offset + 29] = this.rgba.a;
    dataTA[offset + 30] = this.uv.topRight.x;
    dataTA[offset + 31] = this.uv.topRight.y;
  }

}

class Texture {
  constructor(key, gl) {
    _defineProperty(this, "key", void 0);

    _defineProperty(this, "width", void 0);

    _defineProperty(this, "height", void 0);

    _defineProperty(this, "image", void 0);

    _defineProperty(this, "gl", void 0);

    _defineProperty(this, "glTexture", void 0);

    _defineProperty(this, "_onLoadCallback", void 0);

    this.key = key;
    this.gl = gl;
  }

  onLoad() {
    var gl = this.gl;
    this.glTexture = this.gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.width = this.image.width;
    this.height = this.image.height;
    this.image.onload = null;

    if (this._onLoadCallback) {
      this._onLoadCallback(this);
    }
  }

  load(url, callback) {
    this.image = new Image();

    this.image.onload = () => this.onLoad();

    this.image.src = url;

    if (callback) {
      this._onLoadCallback = callback;
    }

    if (this.image.complete && this.image.width && this.image.height) {
      this.onLoad();
    }
  }

}

var TexturedQuadShader = {
  fragmentShader: "\n    precision mediump float;\n\n    varying vec4 vColor;\n    varying vec2 vTextureCoord;\n\n    uniform sampler2D uTexture;\n    \n    void main (void)\n    {\n        gl_FragColor = texture2D(uTexture, vTextureCoord) * vColor;\n    }\n    ",
  vertexShader: "\n    attribute vec4 aColor;\n    attribute vec2 aVertexPosition;\n    attribute vec2 aTextureCoord;\n\n    uniform mat4 uProjectionMatrix;\n\n    varying vec4 vColor;\n    varying vec2 vTextureCoord;\n    \n    void main (void)\n    {\n        vColor = aColor;\n        vTextureCoord = aTextureCoord;\n    \n        gl_Position = uProjectionMatrix * vec4(aVertexPosition, 0.0, 1.0);\n    }\n    "
};

class Matrix4 {
  constructor() {
    var m00 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    var m01 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var m02 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var m03 = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    var m10 = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
    var m11 = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
    var m12 = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;
    var m13 = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 0;
    var m20 = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : 0;
    var m21 = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : 0;
    var m22 = arguments.length > 10 && arguments[10] !== undefined ? arguments[10] : 1;
    var m23 = arguments.length > 11 && arguments[11] !== undefined ? arguments[11] : 0;
    var m30 = arguments.length > 12 && arguments[12] !== undefined ? arguments[12] : 0;
    var m31 = arguments.length > 13 && arguments[13] !== undefined ? arguments[13] : 0;
    var m32 = arguments.length > 14 && arguments[14] !== undefined ? arguments[14] : 0;
    var m33 = arguments.length > 15 && arguments[15] !== undefined ? arguments[15] : 1;
    this.set(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
  }

  set() {
    var m00 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    var m01 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var m02 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var m03 = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    var m10 = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
    var m11 = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
    var m12 = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;
    var m13 = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 0;
    var m20 = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : 0;
    var m21 = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : 0;
    var m22 = arguments.length > 10 && arguments[10] !== undefined ? arguments[10] : 1;
    var m23 = arguments.length > 11 && arguments[11] !== undefined ? arguments[11] : 0;
    var m30 = arguments.length > 12 && arguments[12] !== undefined ? arguments[12] : 0;
    var m31 = arguments.length > 13 && arguments[13] !== undefined ? arguments[13] : 0;
    var m32 = arguments.length > 14 && arguments[14] !== undefined ? arguments[14] : 0;
    var m33 = arguments.length > 15 && arguments[15] !== undefined ? arguments[15] : 1;
    this.m00 = m00;
    this.m01 = m01;
    this.m02 = m02;
    this.m03 = m03;
    this.m10 = m10;
    this.m11 = m11;
    this.m12 = m12;
    this.m13 = m13;
    this.m20 = m20;
    this.m21 = m21;
    this.m22 = m22;
    this.m23 = m23;
    this.m30 = m30;
    this.m31 = m31;
    this.m32 = m32;
    this.m33 = m33;
    return this;
  }

  zero() {
    return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  identity() {
    return this.set();
  }

  getArray() {
    return [this.m00, this.m01, this.m02, this.m03, this.m10, this.m11, this.m12, this.m13, this.m20, this.m21, this.m22, this.m23, this.m30, this.m31, this.m32, this.m33];
  }

  fromArray(src) {
    return this.set(src[0], src[1], src[2], src[3], src[4], src[5], src[6], src[7], src[8], src[9], src[10], src[11], src[12], src[13], src[14], src[15]);
  }

  [Symbol.iterator]() {
    var data = this.getArray();
    return data[Symbol.iterator]();
  }

}

function Ortho(left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  var m00 = -2 * lr;
  var m11 = -2 * bt;
  var m22 = 2 * nf;
  var m30 = (left + right) * lr;
  var m31 = (top + bottom) * bt;
  var m32 = (far + near) * nf;
  return new Matrix4(m00, 0, 0, 0, 0, m11, 0, 0, 0, 0, m22, 0, m30, m31, m32, 1);
}

function part17 () {
  var canvas = document.getElementById('game');
  canvas.width = 800;
  canvas.height = 600;
  var contextOptions = {
    alpha: false,
    antialias: true,
    premultipliedAlpha: false,
    stencil: false,
    preserveDrawingBuffer: false
  };
  var gl = canvas.getContext('webgl', contextOptions);
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, TexturedQuadShader.fragmentShader);
  gl.compileShader(fragmentShader);
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, TexturedQuadShader.vertexShader);
  gl.compileShader(vertexShader);
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);
  var vertexPositionAttrib = gl.getAttribLocation(program, 'aVertexPosition');
  var vertexColorAttrib = gl.getAttribLocation(program, 'aColor');
  var vertexTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');
  var uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
  var uTextureLocation = gl.getUniformLocation(program, 'uTexture');
  gl.enableVertexAttribArray(vertexPositionAttrib);
  gl.enableVertexAttribArray(vertexColorAttrib);
  gl.enableVertexAttribArray(vertexTextureCoord);
  var resolution = {
    x: 800,
    y: 600
  };
  var maxSpritesPerBatch = 2000;
  var size = 4;
  var singleVertexSize = 32;
  var singleSpriteSize = 32;
  var singleSpriteByteSize = singleVertexSize * size;
  var singleIndexByteSize = 4;
  var singleSpriteIndexSize = 6;
  var bufferByteSize = maxSpritesPerBatch * singleSpriteByteSize;
  var dataTA = new Float32Array(bufferByteSize);
  var ibo = [];

  for (var i = 0; i < maxSpritesPerBatch * singleIndexByteSize; i += singleIndexByteSize) {
    ibo.push(i + 0, i + 1, i + 2, i + 2, i + 3, i + 0);
  }

  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, dataTA, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ibo), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  var projectionMatrix = Ortho(0, resolution.x, resolution.y, 0, -1000, 1000);
  var stride = 32;
  var textures = [];

  function loadTextures(urls) {
    var texturesLeft = urls.length;

    var onLoadCallback = () => {
      texturesLeft--;

      if (texturesLeft === 0) {
        console.log('load finished');
        create();
      }
    };

    urls.forEach((url, index) => {
      var texture = new Texture(url, gl);
      texture.load('../assets/' + url, onLoadCallback);
      textures.push(texture);
    });
  }

  loadTextures(['128x128.png', 'brain.png', 'logo.png', 'shinyball.png']);
  var sprites = [];

  function create() {
    for (var _i = 0; _i < 32; _i++) {
      var x = Math.floor(Math.random() * (resolution.x - 200));
      var y = Math.floor(Math.random() * (resolution.y - 100));
      var t = textures[Math.floor(Math.random() * textures.length)];
      var sprite = new Sprite(x, y, t.width, t.height);
      sprite.setTexture(t);
      sprites.push(sprite);
    }

    render();
  }

  function flush(count) {
    var offset = count * singleSpriteByteSize;

    if (offset === bufferByteSize) {
      gl.bufferData(gl.ARRAY_BUFFER, dataTA, gl.DYNAMIC_DRAW);
    } else {
      var view = dataTA.subarray(0, offset);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, view);
    }

    gl.drawElements(gl.TRIANGLES, count * singleSpriteIndexSize, gl.UNSIGNED_SHORT, 0);
  }

  function render() {
    var renderList = sprites.map(sprite => {
      if (sprite.visible) {
        sprite.updateVertices();
        return sprite;
      }
    });
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
    gl.uniform1i(uTextureLocation, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.activeTexture(gl.TEXTURE0);
    gl.vertexAttribPointer(vertexPositionAttrib, 2, gl.FLOAT, false, stride, 0);
    gl.vertexAttribPointer(vertexColorAttrib, 4, gl.FLOAT, false, stride, 8);
    gl.vertexAttribPointer(vertexTextureCoord, 2, gl.FLOAT, false, stride, 16 + 8);
    var prevTexture = renderList[0].texture;
    var size = 0;

    for (var _i2 = 0; _i2 < renderList.length; _i2++) {
      var sprite = renderList[_i2];

      if (sprite.texture !== prevTexture) {
        gl.bindTexture(gl.TEXTURE_2D, prevTexture.glTexture);
        flush(size);
        size = 0;
        prevTexture = sprite.texture;
      }

      sprite.batch(dataTA, size * singleSpriteSize);
      size++;

      if (size === maxSpritesPerBatch) {
        gl.bindTexture(gl.TEXTURE_2D, prevTexture.glTexture);
        flush(size);
        size = 0;
        prevTexture = sprite.texture;
      }
    }

    if (size > 0) {
      gl.bindTexture(gl.TEXTURE_2D, prevTexture.glTexture);
      flush(size);
    }

    requestAnimationFrame(render);
  }
}

part17();
//# sourceMappingURL=test035.js.map
