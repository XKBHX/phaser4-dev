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

//  In case browser has draft extensions enabled
app.state.multiDrawInstanced = false;

let program = app.createProgram(vs, fs);

let width = 1;
let height = 1;
let total = 0;

function buildDraw (texture)
{
    // 4194304 sprites = 1024, 4, 1024
    // 2097152 sprites = 1024, 2, 1024
    const row = 1024;
    const overdraw = 2;
    const max = (row * overdraw) * 1024;

    total += max;
    
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

ImageFile('stone', '../assets/8x8.png').load().then((file) => {

    let texture = app.createTexture2D(file.data, width, height, { flipY: false });

    let drawCall1 = buildDraw(texture);
    let drawCall2 = buildDraw(texture);
    let drawCall3 = buildDraw(texture);
    let drawCall4 = buildDraw(texture);
    let drawCall5 = buildDraw(texture);
    let drawCall6 = buildDraw(texture); // 12,582,912
    let drawCall7 = buildDraw(texture);
    let drawCall8 = buildDraw(texture);
    let drawCall9 = buildDraw(texture);
    let drawCall10 = buildDraw(texture);
    let drawCall11 = buildDraw(texture);
    let drawCall12 = buildDraw(texture); // 25,165,824 (40fps)

    console.log(total, 'total sprites');

    function render ()
    {
        app.clear();

        drawCall1.draw();
        drawCall2.draw();
        drawCall3.draw();
        drawCall4.draw();
        drawCall5.draw();
        drawCall6.draw();
        drawCall7.draw();
        drawCall8.draw();
        drawCall9.draw();
        drawCall10.draw();
        drawCall11.draw();
        drawCall12.draw();

        requestAnimationFrame(render);
    }

    render();

});
