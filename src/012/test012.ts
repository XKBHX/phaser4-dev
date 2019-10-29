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

app.setClearColor(0.3, 0.3, 0, 1);

let program = app.createProgram(vs, fs);

let positions = app.createVertexBuffer(app.gl.FLOAT, 2, app.getQuadPosition(0, 0, 313, 512));

let uvs = app.createVertexBuffer(app.gl.FLOAT, 2, new Float32Array([
    0.0, 1.0,
    1.0, 1.0,
    0.0, 0.0,

    0.0, 0.0,
    1.0, 1.0,
    1.0, 0.0
]));

let x = 0;

let triangleArray = app.createVertexArray().vertexAttributeBuffer(0, positions).vertexAttributeBuffer(1, uvs);
 
ImageFile('stone', '/100-phaser3-snippets/public/assets/patchouli.png').load().then((file) => {

    let t = app.createTexture2D(file.data);

    let drawCall = app.createDrawCall(program, triangleArray).texture('tex', t);

    function render ()
    {
        positions.data(app.getQuadPosition(x, 0, 313, 512));

        x++;

        if (x > 1024)
        {
            x = -313;
        }

        app.clear();

        drawCall.draw();

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

});
