import { WebGL2Renderer, DrawCall } from '@phaserjs/renderer-webgl2';
import { ImageFile } from '@phaserjs/loader-filetypes';

const vs = `#version 300 es

layout(location=0) in vec2 inPosition;

void main() {
    gl_Position = vec4(inPosition, 1.0, 1.0);
}
`;

const fs = `#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
    fragColor = vec4(1.0, 0.0, 1.0, 1.0);
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

function buildDraw ()
{
    // 1,073,741,824 pixels = 38fps (1024 quads)
    // 805,306,368 pixels = 50fps (768 quads)
    // 662,700,032 pixels = 60fps (632 quads)
    // 536,870,912 pixels = 60fps (512 quads)

    const max = 1024;

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

        data.push(
            TL.x, TL.y,
            BL.x, BL.y,
            BR.x, BR.y,
            BR.x, BR.y,
            TR.x, TR.y,
            TL.x, TL.y
        );
    }
    
    let vertices = app.createVertexBuffer(app.gl.FLOAT, 2, new Float32Array(data));
    let vertexArray = app.createVertexArray();
    vertexArray.vertexAttributeBuffer(0, vertices);

    data.length = 0;
    
    return app.createDrawCall(program, vertexArray);
}

ImageFile('stone', '/100-phaser3-snippets/public/assets/background-glitch.png').load().then((file) => {

    const draws: DrawCall[] = [];

    for (let i = 0; i < 1; i++)
    {
        draws.push(buildDraw());
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
