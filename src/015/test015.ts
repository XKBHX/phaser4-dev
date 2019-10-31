import { WebGL2Renderer } from '@phaserjs/renderer-webgl2';
import { ImageFile } from '@phaserjs/loader-filetypes';

const xvs = `#version 300 es

layout(location=0) in vec4 inPosition;
layout(location=1) in vec2 inUV;

out vec2 uv;

void main() {
    uv = inUV;
    gl_Position = inPosition;
}
`;

const xfs = `#version 300 es
precision highp float;

in vec2 uv;

uniform sampler2D tex;

out vec4 fragColor;

void main() {
    fragColor = texture(tex, uv);
}
`;

let app = new WebGL2Renderer(document.getElementById('game') as HTMLCanvasElement);

app.setClearColor(0.1, 0.1, 0.1, 1);

let program = app.createProgram(xvs, xfs);

let x = 128;
let y = 64;
let width = 256;
let height = 353;

const TL = app.getXY(x, y);
const TR = app.getXY(x + width, y);
const BL = app.getXY(x, y + height);
const BR = app.getXY(x + width, y + height);

//  Perfect but upside down unless flipY set in the texture

const UV0 = { x: 0, y: 0 };
const UV1 = { x: 0, y: 1 };
const UV2 = { x: 1, y: 1 };
const UV3 = { x: 1, y: 0 };

const data = new Float32Array([
    TL.x, TL.y,
    UV0.x, UV0.y,
    BL.x, BL.y,
    UV1.x, UV1.y,
    BR.x, BR.y,
    UV2.x, UV2.y,
    TR.x, TR.y,
    UV3.x, UV3.y
]);

const size = 4;

//  Interleaved Buffer Test + Index Buffer

let buffer = app.createInterleavedBuffer(size * 4, data);
let indices = app.createIndexBuffer(app.gl.UNSIGNED_SHORT, 3, new Uint16Array([ 0, 1, 2, 2, 3, 0 ]));

let vertexArray = app.createVertexArray();

vertexArray.vertexAttributeBuffer(0, buffer, {
    type: app.gl.FLOAT,
    size: 2,
    offset: 0,
    stride: size * 4
});

vertexArray.vertexAttributeBuffer(1, buffer, {
    type: app.gl.FLOAT,
    size: 2,
    offset: size * 2,
    stride: size * 4
});

vertexArray.indexBuffer(indices);

ImageFile('stone', '/100-phaser3-snippets/public/assets/chihuahua.png').load().then((file) => {

    let texture = app.createTexture2D(file.data, 256, 353, { flipY: false });

    let drawCall = app.createDrawCall(program, vertexArray).texture('tex', texture);

    console.log(vertexArray);
    console.log(drawCall);

    function render ()
    {
        app.clear();
        
        drawCall.draw();

        requestAnimationFrame(render);
    }

    render();

});
