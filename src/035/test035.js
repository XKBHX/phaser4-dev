function part03 () {
  var fs = "\n    precision mediump float;\n\n    varying vec4 vColor;\n    \n    void main (void)\n    {\n        gl_FragColor = vec4(vColor.x, vColor.y, vColor.z, 1.0);\n    }\n    ";
  var vs = "\n    attribute vec4 aColor;\n    attribute vec3 aVertexPosition;\n\n    varying vec4 vColor;\n    \n    void main (void)\n    {\n        vColor = aColor;\n\n        gl_Position = vec4(aVertexPosition, 1.0); \n    }\n    ";
  var canvas = document.getElementById('game');
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
  gl.enableVertexAttribArray(vertexPositionAttrib);
  gl.enableVertexAttribArray(vertexColorAttrib);
  var vertices = new Float32Array([-0.5, 0.5, 0.0, 1.0, 0.0, 0.0, 1.0, -0.5, -0.5, 0.0, 1.0, 1.0, 0.0, 1.0, 0.5, -0.5, 0.0, 1.0, 1.0, 0.0, 1.0, 0.5, 0.5, 0.0, 1.0, 0.0, 0.0, 1.0]);
  var indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  var stride = 28;

  function render() {
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, 1024, 768);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, stride, 0);
    gl.vertexAttribPointer(vertexColorAttrib, 4, gl.FLOAT, false, stride, 12);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  }

  render();
}

part03();
//# sourceMappingURL=test035.js.map
