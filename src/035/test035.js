function part08 () {
  var fs = "\n    precision mediump float;\n\n    varying vec4 vColor;\n    \n    void main (void)\n    {\n        gl_FragColor = vec4(vColor.r, vColor.g, vColor.b, vColor.a);\n    }\n    ";
  var vs = "\n    attribute vec4 aColor;\n    attribute vec2 aVertexPosition;\n\n    uniform mat4 uProjectionMatrix;\n    uniform mat4 uModelTransform;\n\n    varying vec4 vColor;\n    \n    void main (void)\n    {\n        vColor = aColor;\n    \n        gl_Position = uProjectionMatrix * uModelTransform * vec4(aVertexPosition, 0.0, 1.0);\n    }\n    ";
  var canvas = document.getElementById('game');
  canvas.width = 800;
  canvas.height = 600;
  var gl = canvas.getContext('webgl');
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fs);
  gl.compileShader(fragmentShader);
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vs);
  gl.compileShader(vertexShader);
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);
  var vertexPositionAttrib = gl.getAttribLocation(program, 'aVertexPosition');
  var vertexColorAttrib = gl.getAttribLocation(program, 'aColor');
  var uModelTransform = gl.getUniformLocation(program, 'uModelTransform');
  var uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
  gl.enableVertexAttribArray(vertexPositionAttrib);
  gl.enableVertexAttribArray(vertexColorAttrib);
  var vertices = [];
  var indices = [];
  var totalQuads = 0;
  var resolution = {
    x: 800,
    y: 600
  };

  function addQuad() {
    var r = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    var g = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
    var b = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
    var a = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
    var x1 = 0;
    var y1 = 0;
    var x2 = 1;
    var y2 = 1;
    vertices.push(x1, y1, r, g, b, a);
    vertices.push(x1, y2, r, g, b, a);
    vertices.push(x2, y2, r, g, b, a);
    vertices.push(x2, y1, r, g, b, a);
    var offset = totalQuads * 4;
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
    totalQuads++;
  }

  addQuad(0, 1, 0, 1);
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  function getOrtho(left, right, bottom, top, near, far) {
    var leftRight = 1 / (left - right);
    var bottomTop = 1 / (bottom - top);
    var nearFar = 1 / (near - far);
    var m00 = -2 * leftRight;
    var m11 = -2 * bottomTop;
    var m22 = 2 * nearFar;
    var m30 = (left + right) * leftRight;
    var m31 = (top + bottom) * bottomTop;
    var m32 = (far + near) * nearFar;
    return new Float32Array([m00, 0, 0, 0, 0, m11, 0, 0, 0, 0, m22, 0, m30, m31, m32, 1]);
  }

  function Identity(src) {
    src[0] = 1;
    src[1] = 0;
    src[2] = 0;
    src[3] = 0;
    src[4] = 0;
    src[5] = 1;
    src[6] = 0;
    src[7] = 0;
    src[8] = 0;
    src[9] = 0;
    src[10] = 1;
    src[11] = 0;
    src[12] = 0;
    src[13] = 0;
    src[14] = 0;
    src[15] = 1;
    return src;
  }

  function Translate(src) {
    var x = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var y = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var z = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    var m00 = src[0];
    var m01 = src[1];
    var m02 = src[2];
    var m03 = src[3];
    var m10 = src[4];
    var m11 = src[5];
    var m12 = src[6];
    var m13 = src[7];
    var m20 = src[8];
    var m21 = src[9];
    var m22 = src[10];
    var m23 = src[11];
    var m30 = src[12];
    var m31 = src[13];
    var m32 = src[14];
    var m33 = src[15];
    var a30 = m00 * x + m10 * y + m20 * z + m30;
    var a31 = m01 * x + m11 * y + m21 * z + m31;
    var a32 = m02 * x + m12 * y + m22 * z + m32;
    var a33 = m03 * x + m13 * y + m23 * z + m33;
    src[12] = a30;
    src[13] = a31;
    src[14] = a32;
    src[15] = a33;
    return src;
  }

  function Scale(src, scaleX, scaleY, scaleZ) {
    src[0] *= scaleX;
    src[1] *= scaleX;
    src[2] *= scaleX;
    src[3] *= scaleX;
    src[4] *= scaleY;
    src[5] *= scaleY;
    src[6] *= scaleY;
    src[7] *= scaleY;
    src[8] *= scaleZ;
    src[9] *= scaleZ;
    src[10] *= scaleZ;
    src[11] *= scaleZ;
    return src;
  }

  function RotateZ(src, angle) {
    var s = Math.sin(angle);
    var c = Math.cos(angle);
    var m00 = src[0];
    var m01 = src[1];
    var m02 = src[2];
    var m03 = src[3];
    var m10 = src[4];
    var m11 = src[5];
    var m12 = src[6];
    var m13 = src[7];
    var a00 = m00 * c + m10 * s;
    var a01 = m01 * c + m11 * s;
    var a02 = m02 * c + m12 * s;
    var a03 = m03 * c + m13 * s;
    var a10 = m10 * c - m00 * s;
    var a11 = m11 * c - m01 * s;
    var a12 = m12 * c - m02 * s;
    var a13 = m13 * c - m03 * s;
    src[0] = a00;
    src[1] = a01;
    src[2] = a02;
    src[3] = a03;
    src[4] = a10;
    src[5] = a11;
    src[6] = a12;
    src[7] = a13;
    return src;
  }

  var projectionMatrix = getOrtho(0, resolution.x, resolution.y, 0, -1000, 1000);
  var modelTransform = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  var stride = 24;
  var x = 0;
  var d = true;
  var r = 0;

  function render() {
    Identity(modelTransform);
    var width = 256;
    var height = 256;
    Translate(modelTransform, x, 300, 0);
    x += d ? 4 : -4;

    if (d && x >= 800) {
      d = false;
    } else if (!d && x <= 0) {
      d = true;
    }

    RotateZ(modelTransform, r);
    r += 0.01;
    Translate(modelTransform, width / -2, height / -2, 0);
    Scale(modelTransform, width, height, 0);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(uModelTransform, false, modelTransform);
    gl.vertexAttribPointer(vertexPositionAttrib, 2, gl.FLOAT, false, stride, 0);
    gl.vertexAttribPointer(vertexColorAttrib, 4, gl.FLOAT, false, stride, 8);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

part08();
//# sourceMappingURL=test035.js.map
