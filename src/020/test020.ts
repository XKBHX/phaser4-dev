import { WebGL2Renderer, DrawCall } from '@phaserjs/renderer-webgl2';
import { ImageFile } from '@phaserjs/loader-filetypes';

const vs = `#version 300 es

layout(location=0) in vec2 inPosition;
layout(location=1) in vec2 inUV;

out vec2 uv;

void main() {
    uv = inUV;
    gl_Position = vec4(inPosition, 1.0, 1.0);
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

app.setClearColor(0.2, 0.2, 0.2, 1);

//  In case browser has draft extensions enabled
// app.state.multiDrawInstanced = false;

let program = app.createProgram(vs, fs);

let totalQuads = 0;
let totalPixels = 0;

const textureWidth = 1024;
const textureHeight = 1024;

const frameWidth = 1024;
const frameHeight = 1024;

const UV0 = { x: 0, y: 0 };
const UV1 = { x: 0, y: 1 };
const UV2 = { x: 1, y: 1 };
const UV3 = { x: 1, y: 0 };

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
    // 1,073,741,824 pixels = 38fps (1024 quads)
    // 805,306,368 pixels = 50fps (768 quads)
    // 662,700,032 pixels = 59fps (632 quads)
    // 536,870,912 pixels = 60fps (512 quads)

    const max = 632;

    totalQuads += max;
    totalPixels += ((textureWidth * textureHeight) * max);
    
    let width = textureWidth;
    let height = textureHeight;

    const data = [];
    
    const x = 0;
    const y = 0;

    for (let i = 0; i < max; i++)
    {
        let TL = app.getXY(x, y);
        let TR = app.getXY(x + width, y);
        let BL = app.getXY(x, y + height);
        let BR = app.getXY(x + width, y + height);

        getUV(0);
    
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

ImageFile('stone', '/100-phaser3-snippets/public/assets/background-glitch.png').load().then((file) => {

    let texture = app.createTexture2D(file.data, textureWidth, textureHeight, { flipY: false });

    const draws: DrawCall[] = [];

    for (let i = 0; i < 1; i++)
    {
        draws.push(buildDraw(texture));
    }

    console.log('total quads', totalQuads);
    console.log('total pixels', totalPixels);

    function render ()
    {
        app.clear();

        draws.forEach((drawCall) => {
            drawCall.draw();
        });

        requestAnimationFrame(render);
    }

    render();

});
