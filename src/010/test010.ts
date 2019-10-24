import { WebGL2Renderer } from '@phaserjs/renderer-webgl2';

const vs = `#version 300 es

layout(location=0) in vec4 position;
layout(location=1) in vec3 color;

out vec3 vColor; 
void main() {
    vColor = color;
    gl_Position = position;
}
`;

const fs = `#version 300 es
precision highp float;

in vec3 vColor;

out vec4 fragColor;
void main() {
    fragColor = vec4(vColor, 1.0);
}
`;

let app = new WebGL2Renderer(document.getElementById('game') as HTMLCanvasElement, {});

app.clearColor(0, 0, 0, 1);

let positions = app.createVertexBuffer(app.gl.FLOAT, 2, new Float32Array([
    -0.5, -0.5,
     0.5, -0.5,
     0.0, 0.5, 
]));

let colors = app.createVertexBuffer(app.gl.UNSIGNED_BYTE, 3, new Uint8Array([
    255, 0, 0,
    0, 255, 0,
    0, 0, 255
]));

let triangleArray = app.createVertexArray().vertexAttributeBuffer(0, positions, {}).vertexAttributeBuffer(1, colors, { normalized: true });

let program = app.createProgram(vs, fs);

let drawCall = app.createDrawCall(program, triangleArray);

app.clear();

drawCall.draw();

// program.delete();
// positions.delete();
// colors.delete();
// triangleArray.delete();
