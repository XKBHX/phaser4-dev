import { WebGL2Renderer } from '@phaserjs/renderer-webgl2';
import { ImageFile } from '@phaserjs/loader-filetypes';

const vs = `#version 300 es

layout(location=0) in vec2 inPosition;
layout(location=1) in vec2 inUV;

out vec2 uv;
// out vec2 pos;

void main() {
    uv = inUV;
    // pos = inPosition;
    gl_Position = vec4(inPosition, 1.0, 1.0);
}
`;

const fs = `#version 300 es
precision highp float;

in vec2 uv;
// in vec2 pos;

uniform sampler2D tex;

out vec4 fragColor;

void main() {
    fragColor = texture(tex, uv);
    // fragColor = vec4((pos.x * 0.5 + 0.5), (pos.y * 0.5 + 0.5), 0.2, 1.0);
}
`;

let app = new WebGL2Renderer(document.getElementById('game') as HTMLCanvasElement);

app.setClearColor(0.2, 0.2, 0.2, 1);

//  In case browser has draft extensions enabled
// app.state.multiDrawInstanced = false;

let program = app.createProgram(vs, fs);

let total = 0;
const textureWidth = 576;
const textureHeight = 64;

const frameWidth = 32;
const frameHeight = 32;
const framesPerRow = textureWidth / frameWidth;

const UV0 = { x: 0, y: 0 };
const UV1 = { x: 0, y: 1 };
const UV2 = { x: 1, y: 1 };
const UV3 = { x: 1, y: 0 };

//  0 to 17
function getUV (frame)
{
    const frameX1 = frame * frameWidth;
    const frameY1 = 0;
    const frameX2 = frameX1 + frameWidth;
    const frameY2 = frameY1 + frameHeight;

    UV0.x = frameX1 / textureWidth;
    UV0.y = frameY1 / textureHeight;

    UV1.x = frameX1 / textureWidth;
    UV1.y = frameY2 / textureHeight;

    UV2.x = frameX2 / textureWidth;
    UV2.y = frameY2 / textureHeight;

    UV3.x = frameX2 / textureWidth;
    UV3.y = frameY1 / textureHeight;
}

function buildDraw (texture)
{
    const max = 131072;

    // const max = 262144;
    // const max = 524288;
    // const max = 1048576;

    total += max;
    
    let width = 32;
    let height = 32;
    
    // let width = 8;
    // let height = 8;

    const data = [];
    
    let x = 0;
    let y = 0;

    for (let i = 0; i < max; i++)
    {
        x = Math.floor(Math.random() * (app.width - width));
        y = Math.floor(Math.random() * (app.height - height));

        let TL = app.getXY(x, y);
        let TR = app.getXY(x + width, y);
        let BL = app.getXY(x, y + height);
        let BR = app.getXY(x + width, y + height);

        // getUV(4);
        getUV(Math.floor(Math.random() * 17));
    
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
    }
    
    const size = 4;
    
    const dataTA = new Float32Array(data);
    
    data.length = 0;
    
    console.log(max, 'sprites', dataTA.byteLength, 'bytes', dataTA.byteLength / 1e+6, 'MB');
    
    let buffer = app.createInterleavedBuffer(size * 4, dataTA); 
    
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

    return app.createDrawCall(program, vertexArray).texture('tex', texture);
}

ImageFile('stone', '../assets/32x32-item-pack.png').load().then((file) => {

    let texture = app.createTexture2D(file.data, textureWidth, textureHeight, { flipY: false });

    let drawCall1 = buildDraw(texture);
    let drawCall2 = buildDraw(texture);
    let drawCall3 = buildDraw(texture);
    let drawCall4 = buildDraw(texture); // 1048576 sprites @ 17fps = 32x32 (60fps = 2x2) = 58fps = 8x8
    // let drawCall5 = buildDraw(texture);
    // let drawCall6 = buildDraw(texture);
    // let drawCall7 = buildDraw(texture);
    // let drawCall8 = buildDraw(texture);
    // let drawCall9 = buildDraw(texture);
    // let drawCall10 = buildDraw(texture);
    // let drawCall11 = buildDraw(texture);
    // let drawCall12 = buildDraw(texture);

    console.log(total, 'total sprites');

    function render ()
    {
        app.clear();

        drawCall1.draw();
        drawCall2.draw();
        drawCall3.draw();
        drawCall4.draw();
        // drawCall5.draw();
        // drawCall6.draw();
        // drawCall7.draw();
        // drawCall8.draw();
        // drawCall9.draw();
        // drawCall10.draw();
        // drawCall11.draw();
        // drawCall12.draw();

        requestAnimationFrame(render);
    }

    render();

});
