import { WebGL2Renderer } from '@phaserjs/renderer-webgl2';
import { ImageFile } from '@phaserjs/loader-filetypes';

const vs = `#version 300 es

layout(location=0) in vec2 inPosition;

void main() {
    gl_Position = vec4(inPosition, 1.0, 1.0);
    gl_PointSize = 64.0;
}
`;

const fs = `#version 300 es
precision mediump float;

uniform sampler2D tex;

out vec4 fragColor;

void main() {

    fragColor = texture(tex, gl_PointCoord);
}
`;

let app = new WebGL2Renderer(document.getElementById('game') as HTMLCanvasElement);

app.setClearColor(0.2, 0.2, 0.2, 1);

let program = app.createProgram(vs, fs);

let total = 0;

const textureWidth = 8;
const textureHeight = 8;

function buildDraw (texture)
{
    const max = 256;

    total += max;
    
    let width = 8;
    let height = 8;

    const data = [];

    for (let i = 0; i < max; i++)
    {
        let x = Math.floor(Math.random() * (app.width - width));
        let y = Math.floor(Math.random() * (app.height - height));

        let TL = app.getXY(x, y);

        data.push(TL.x, TL.y);
    }
    
    let vertices = app.createVertexBuffer(app.gl.FLOAT, 2, new Float32Array(data));

    let vertexArray = app.createVertexArray().vertexAttributeBuffer(0, vertices);

    data.length = 0;

    const dc = app.createDrawCall(program, vertexArray).texture('tex', texture);

    dc.drawPrimitive = app.gl.POINTS;

    return dc;
}

ImageFile('stone', '../assets/8x8.png').load().then((file) => {

    let texture = app.createTexture2D(file.data, textureWidth, textureHeight, { flipY: false });

    let drawCall1 = buildDraw(texture);

    console.log(total, 'total sprites');

    function render ()
    {
        app.clear();

        drawCall1.draw();

        requestAnimationFrame(render);
    }

    render();

});
