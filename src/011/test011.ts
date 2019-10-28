import { WebGL2Renderer } from '@phaserjs/renderer-webgl2';
import { ImageFile } from '@phaserjs/loader-filetypes';

const vs = `#version 300 es

layout(location=0) in vec4 position;

out vec2 uv;

void main() {
    uv = position.xy + 0.5;
    gl_Position = position;
}
`;

const fs = `#version 300 es
precision highp float;

in vec2 uv;
uniform sampler2D tex;

out vec4 fragColor;

void main() {
    fragColor = texture(tex, uv);
}
`;

let app = new WebGL2Renderer(document.getElementById('game') as HTMLCanvasElement);

app.clearColor(0.2, 0.4, 0, 1);

let program = app.createProgram(vs, fs);

let positions = app.createVertexBuffer(app.gl.FLOAT, 2, new Float32Array([
    -0.5, -0.5,
    0.5, -0.5,
    -0.5, 0.5,
    -0.5, 0.5,
    0.5, -0.5,
    0.5, 0.5
]));

let triangleArray = app.createVertexArray().vertexAttributeBuffer(0, positions);
 
ImageFile('stone', '/100-phaser3-snippets/public/assets/patchouli.png').load().then((file) => {

    let t = app.createTexture2D(file.data, 0, 0, { flipY: true, premultiplyAlpha: true });

    let drawCall = app.createDrawCall(program, triangleArray).texture('tex', t);

    app.clear();

    drawCall.draw();

});
