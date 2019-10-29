import { WebGL2Renderer } from '@phaserjs/renderer-webgl2';
import { ImageFile } from '@phaserjs/loader-filetypes';

const vs = `#version 300 es

layout(location=0) in vec4 position;
layout(location=1) in vec2 tUv;

out vec2 uv;

void main() {
    uv = tUv;
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

let cutX = 0;
let cutY = 0;
let cutWidth = 313;
let cutHeight = 512;
let sourceWidth = 313;
let sourceHeight = 512;

let u0 = cutX / sourceWidth;
let v0 = cutY / sourceHeight;
let u1 = (cutX + cutWidth) / sourceWidth;
let v1 = (cutY + cutHeight) / sourceHeight;

let x = 0;
let y = 0;

//  Convert from pixels to clip-space

function getX (pos, app)
{
    return pos / app.width * 2 - 1;
}

function getY (pos, app)
{
    return pos / app.height * -2 + 1;
}

function getQuadPosition (app, x, y, width, height)
{
    //  tl
    //  tr
    //  bl

    //  bl
    //  tr
    //  br

    return new Float32Array([
        getX(x, app), getY(y, app),
        getX(x + width, app), getY(y, app),
        getX(x, app), getY(y + height, app),
        getX(x, app), getY(y + height, app),
        getX(x + width, app), getY(y, app),
        getX(x + width, app), getY(y + height, app)
    ]);
}

let positions = app.createVertexBuffer(app.gl.FLOAT, 2, getQuadPosition(app, 0, 0, 313, 512));

let uvs = app.createVertexBuffer(app.gl.FLOAT, 2, new Float32Array([
    0.0, 1.0,
    1.0, 1.0,
    0.0, 0.0,

    0.0, 0.0,
    1.0, 1.0,
    1.0, 0.0
]));

let triangleArray = app.createVertexArray().vertexAttributeBuffer(0, positions).vertexAttributeBuffer(1, uvs);
 
ImageFile('stone', '/100-phaser3-snippets/public/assets/patchouli.png').load().then((file) => {

    let t = app.createTexture2D(file.data);

    let drawCall = app.createDrawCall(program, triangleArray).texture('tex', t);

    app.clear();

    drawCall.draw();

});
