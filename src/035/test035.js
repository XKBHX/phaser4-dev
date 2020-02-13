function part06 () {
  var fs = "\n    precision mediump float;\n\n    varying vec4 vColor;\n    \n    void main (void)\n    {\n        gl_FragColor = vec4(vColor.r, vColor.g, vColor.b, vColor.a);\n    }\n    ";
  var vs = "\n    attribute vec4 aColor;\n    attribute vec2 aVertexPosition;\n\n    uniform vec2 resolution;\n\n    varying vec4 vColor;\n    \n    void main (void)\n    {\n        vColor = aColor;\n\n        float x = aVertexPosition.x / resolution.x * 2.0 - 1.0;\n        float y = aVertexPosition.y / resolution.y * -2.0 + 1.0;\n    \n        gl_Position = vec4(x, y, 0.0, 1.0); \n    }\n    ";
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
  var projectionVector = gl.getUniformLocation(program, 'resolution');
  gl.enableVertexAttribArray(vertexPositionAttrib);
  gl.enableVertexAttribArray(vertexColorAttrib);
  var vertices = [];
  var indices = [];
  var totalQuads = 0;

  function addQuad(x, y) {
    var width = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 64;
    var height = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 64;
    var r = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
    var g = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
    var b = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 1;
    var a = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 1;
    vertices.push(x, y, r, g, b, a);
    vertices.push(x, y + height, r, g, b, a);
    vertices.push(x + width, y + height, r, g, b, a);
    vertices.push(x + width, y, r, g, b, a);
    var offset = totalQuads * 4;
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
    totalQuads++;
  }

  for (var i = 0; i < 128; i++) {
    var x = Math.random() * 750;
    var y = Math.random() * 550;
    var w = 32 + Math.random() * 64;
    var h = 32 + Math.random() * 128;
    var r = Math.random();
    var g = Math.random();
    var b = Math.random();
    addQuad(x, y, w, h, r, g, b, 0.75);
  }

  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  var stride = 24;

  function render() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.uniform2f(projectionVector, canvas.clientWidth, canvas.clientHeight);
    gl.vertexAttribPointer(vertexPositionAttrib, 2, gl.FLOAT, false, stride, 0);
    gl.vertexAttribPointer(vertexColorAttrib, 4, gl.FLOAT, false, stride, 8);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  }

  render();
}

part06();
//# sourceMappingURL=test035.js.map
