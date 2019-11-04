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

const app = new WebGL2Renderer(document.getElementById('game') as HTMLCanvasElement);

app.setClearColor(0, 0, 0, 1);

const program = app.createProgram(vs, fs);

const positions = app.createVertexBuffer(app.gl.FLOAT, 2, new Float32Array([
    -0.5, -0.5,
    0.5, -0.5,
    0.0, 0.5, 
]));

const colors = app.createVertexBuffer(app.gl.UNSIGNED_BYTE, 3, new Uint8Array([
    255, 0, 0,
    0, 255, 0,
    0, 0, 255
]));

const vertexArray = app.createVertexArray();

vertexArray.vertexAttributeBuffer(0, positions, {});
vertexArray.vertexAttributeBuffer(1, colors, { normalized: true });

const drawCall = app.createDrawCall(program, vertexArray);

app.clear();

drawCall.draw();
