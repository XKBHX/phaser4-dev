import { DrawCall, WebGL2Renderer } from '@phaserjs/renderer-webgl2';
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

app.resize(window.innerWidth, window.innerHeight);
app.setClearColor(0.0, 0.0, 0.2, 1);

let program = app.createProgram(vs, fs);

function getQuadPosition (x: number, y: number, width: number, height: number): number[]
{
    const TL = app.getXY(x, y);
    const TR = app.getXY(x + width, y);
    const BL = app.getXY(x, y + height);
    const BR = app.getXY(x + width, y + height);
   
    return [
        TL.x, TL.y,
        TR.x, TR.y,
        BL.x, BL.y,
        BL.x, BL.y,
        TR.x, TR.y,
        BR.x, BR.y
    ];
}

let w = 32;
let h = 32;
let vbo = [];
let uvo = [];
// let batchSize = 10000;
// let batchSize = 20000;
// let batchSize = 40000;
let batchSize = 80000;

// let max = 240000;
let max = 480000;
// let max = 960000;
// let max = 1920000;

console.log(max, 'sprites');

for (let i = 0; i < max; i++)
{
    let x = Math.abs(Math.random() * app.width);
    let y = Math.abs(Math.random() * app.height);

    let TL = app.getXY(x, y);
    let TR = app.getXY(x + w, y);
    let BL = app.getXY(x, y + h);
    let BR = app.getXY(x + w, y+ h);

    vbo.push(
        TL.x, TL.y,
        TR.x, TR.y,
        BL.x, BL.y,
        BL.x, BL.y,
        TR.x, TR.y,
        BR.x, BR.y
    );

    uvo.push(0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0);

    /*
    if (i > 0 && i % batchSize === 0)
    {
        console.log('Created batch', i, vao.length, vbo.length, uvo.length);

        let positions = app.createVertexBuffer(app.gl.FLOAT, 2, new Float32Array(vbo));
        let uvs = app.createVertexBuffer(app.gl.FLOAT, 2, new Float32Array(uvo));

        vao.push(app.createVertexArray().vertexAttributeBuffer(0, positions).vertexAttributeBuffer(1, uvs));

        vbo = [];
        uvo = [];
    }
    */
}

let positions = app.createVertexBuffer(app.gl.FLOAT, 2, new Float32Array(vbo));
let uvs = app.createVertexBuffer(app.gl.FLOAT, 2, new Float32Array(uvo));
let vao = app.createVertexArray().vertexAttributeBuffer(0, positions).vertexAttributeBuffer(1, uvs);

ImageFile('stone', '/100-phaser3-snippets/public/assets/babyface.png').load().then((file) => {
// ImageFile('stone', '/phaser3-examples/public/assets/sprites/phaser-ship.png').load().then((file) => {

    let t = app.createTexture2D(file.data);
    let drawCall = app.createDrawCall(program, vao).texture('tex', t);

    console.log(drawCall);

    /*
    let drawCalls: DrawCall[] = [];

    console.log(vao);

    for (let i = 0; i < vao.length; i++)
    {
        drawCalls.push(app.createDrawCall(program, vao[i]).texture('tex', t));
    }
    */

    const num = Math.floor(max / batchSize);
    // let s = '';

    // for (let i = 0; i < max / batchSize; i++)
    // {
    //     s = s.concat('[ ' + (i * (batchSize - 1)).toString() + ', ' + batchSize.toString() + ' ], ');
    // }

    // console.log(s);

    function render ()
    {
        app.clear();

        /*
        drawCalls.forEach((drawCall) => {
            drawCall.draw();
        })
        */

        //  100 sprites = 600 elements
        //  1 sprite = 6 elements (max * 6)

        // drawCall.drawRanges([ 0, 300 ]);
        // drawCall.draw();

        // drawCall.drawRanges([ 300, 300 ]);
        // drawCall.draw();

        //  6 * 40000 = 240,000 (max)

        for (let i = 0; i < max / batchSize; i++)
        {
            drawCall.drawRanges([ i * (batchSize - 1), batchSize ]);
            drawCall.draw();
        }

        // drawCall.drawRanges([ 0, 40000 ], [ 39999, 40000 ], [ 79998, 40000 ], [ 119997, 40000 ], [ 159996, 40000 ], [ 199995, 40000 ], [ 239994, 40000 ], [ 279993, 40000 ], [ 319992, 40000 ], [ 359991, 40000 ], [ 399990, 40000 ], [ 439989, 40000 ], [ 479988, 40000 ], [ 519987, 40000 ], [ 559986, 40000 ], [ 599985, 40000 ], [ 639984, 40000 ], [ 679983, 40000 ], [ 719982, 40000 ], [ 759981, 40000 ], [ 799980, 40000 ], [ 839979, 40000 ], [ 879978, 40000 ], [ 919977, 40000 ]);
        // drawCall.draw();

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

});
