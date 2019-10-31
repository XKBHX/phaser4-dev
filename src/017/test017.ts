import { WebGL2Renderer } from '@phaserjs/renderer-webgl2';
import { ImageFile } from '@phaserjs/loader-filetypes';

const vs = `#version 300 es

layout(location=0) in vec2 inPosition;
layout(location=1) in vec2 inUV;

out vec2 uv;
out vec2 pos;

void main() {
    uv = inUV;
    pos = inPosition;
    gl_Position = vec4(inPosition, 1.0, 1.0);
}
`;

const fs = `#version 300 es
precision highp float;

in vec2 uv;
in vec2 pos;

uniform sampler2D tex;

out vec4 fragColor;

void main() {
    // fragColor = texture(tex, uv);
    // fragColor = vec4(0.5, 1.0, 0.0, 1.0);
    fragColor = vec4((pos.x * 0.5 + 0.5), (pos.y * 0.5 + 0.5), 0.2, 1.0);
}
`;

let app = new WebGL2Renderer(document.getElementById('game') as HTMLCanvasElement);

app.setClearColor(0.2, 0.2, 0.2, 1);

let program = app.createProgram(vs, fs);

//  1024 per row
//  1024 * 128 = 131072
//  1024 * 256 = 262144
//  1024 * 512 = 524288
//  1024 * 768 = 786432
//  1024 * 1024 = 1048576

//  2048 per row (overdraw = 2)
//  2048 * 128 = 262144
//  2048 * 256 = 524288
//  2048 * 512 = 1048576
//  2048 * 768 = 1572864
//  2048 * 1024 = 2097152

//  4096 per row (overdraw = 4)
//  4096 * 128 = 524288
//  4096 * 256 = 1048576
//  4096 * 512 = 2097152
//  4096 * 768 = 3145728
//  4096 * 896 = 3670016
//  4096 * 1024 = 4,194,304

//  8192 per row (overdraw = 8)
//  8192 * 128 = 1048576
//  8192 * 256 = 2097152
//  8192 * 512 = 4,194,304
//  8192 * 768 = 6,291,456
//  8192 * 896 = 7,340,032
//  8192 * 1024 = 8,388,608

const row = 1024;
const overdraw = 4;
const max = (row * overdraw) * 1024;

let width = 1;
let height = 1;

const UV0 = { x: 0, y: 0 };
const UV1 = { x: 0, y: 1 };
const UV2 = { x: 1, y: 1 };
const UV3 = { x: 1, y: 0 };

const data = [];

let x = 0;
let y = 0;
let d = 0;

for (let i = 0; i < max; i++)
{
    let TL = app.getXY(x, y);
    let TR = app.getXY(x + width, y);
    let BL = app.getXY(x, y + height);
    let BR = app.getXY(x + width, y + height);

    data.push(
        TL.x, TL.y,
        UV0.x, UV0.y,

        BL.x, BL.y,
        UV1.x, UV1.y,

        BR.x, BR.y,
        UV2.x, UV2.y,

        BR.x, BR.y,
        UV2.x, UV2.y,

        TR.x, TR.y,
        UV3.x, UV3.y,

        TL.x, TL.y,
        UV0.x, UV0.y
    );

    x += width;

    if (x === app.width)
    {
        x = 0;

        d++;

        if (d === overdraw)
        {
            y += height;
            d = 0;
        }
    }
}

const size = 4;

//  Interleaved Buffer Test + Index Buffer

const dataTA = new Float32Array(data);

console.log(max, 'sprites', dataTA.byteLength, 'bytes', dataTA.byteLength / 1e+6, 'MB');

let buffer = app.createInterleavedBuffer(size * 4, dataTA); 

console.log(buffer);

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

ImageFile('stone', '../assets/2x2.png').load().then((file) => {

    let texture = app.createTexture2D(file.data, width, height, { flipY: false });

    let drawCall = app.createDrawCall(program, vertexArray).texture('tex', texture);

    console.log(vertexArray);
    console.log(drawCall);

    function render ()
    {
        app.clear();
        
        // for (let i = 0; i < max / batchSize; i++)
        // {
            // drawCall.drawRanges([ i * (batchSize - 1), batchSize ]);
            // drawCall.draw();
        // }

        // drawCall.drawRanges([ 0, (512 * 256) * 6 ]);
        drawCall.draw();

        // drawCall.drawRanges([ (512 * 256) * 6, (512 * 256) * 6 ]);
        // drawCall.draw();

        requestAnimationFrame(render);
    }

    render();

});
