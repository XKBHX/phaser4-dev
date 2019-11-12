import { WebGL2Renderer } from '@phaserjs/renderer-webgl2';
import { ImageFile } from '@phaserjs/loader-filetypes';
import { Matrix4, Translate, RotateZ, Scale, LoadMatrix2D } from '@phaserjs/math-matrix4';
import { Matrix2D, ITRS } from '@phaserjs/math-matrix2d';
import { Ortho } from '@phaserjs/math-matrix4-funcs';
import { Vec2 } from '@phaserjs/math-vec2';

function createQuad (x: number, y: number, width: number, height: number)
{
    const TL = new Vec2(x, y);
    const TR = new Vec2(x + width, y);
    const BL = new Vec2(x, y + height);
    const BR = new Vec2(x + width, y + height);

    //  flipped from v3 and it works fine!
    const UVTL = new Vec2(0, 1);
    const UVTR = new Vec2(1, 1);
    const UVBL = new Vec2(0, 0);
    const UVBR = new Vec2(1, 0);

    return {
        position: new Float32Array([
            TL.x, TL.y,
            TR.x, TR.y,
            BL.x, BL.y,
            BL.x, BL.y,
            TR.x, TR.y,
            BR.x, BR.y
        ]),
        uvs: new Float32Array([
            UVTL.x, UVTL.y,
            UVTR.x, UVTR.y,
            UVBL.x, UVBL.y,
            UVBL.x, UVBL.y,
            UVTR.x, UVTR.y,
            UVBR.x, UVBR.y
        ]),
    }
}

const vs = `#version 300 es
precision highp float;

layout(location=0) in vec3 position;
layout(location=1) in vec2 uv;

uniform mat4 uModelViewMatrix;

uniform SceneUniforms {
    mat4 uProjectionMatrix;
};

out vec2 outUV;

void main()
{
    outUV = uv;

    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(position, 1.0);
}
`;

const fs = `#version 300 es
precision highp float;

layout(std140, column_major) uniform;

uniform SceneUniforms {
    mat4 uProjectionMatrix;
};

uniform sampler2D texture0;

in vec2 outUV;

out vec4 fragColor;

void main() {
    fragColor = texture(texture0, outUV);
}
`;

let app = new WebGL2Renderer(document.getElementById('game') as HTMLCanvasElement);

app.setClearColor(0.2, 0.4, 0, 1);

// app.gl.disable(app.gl.CULL_FACE);
// app.gl.disable(app.gl.DEPTH_TEST);

let program = app.createProgram(vs, fs);

let quad = createQuad(0, 0, 512, 512);

let positions = app.createVertexBuffer(app.gl.FLOAT, 2, quad.position);
let uvs = app.createVertexBuffer(app.gl.FLOAT, 2, quad.uvs);

let batch = app.createVertexArray();
batch.vertexAttributeBuffer(0, positions);
batch.vertexAttributeBuffer(1, uvs);

let projectionMatrix = Ortho(0, app.width, app.height, 0, 0, 1000);

let sub = app.createUniformBuffer([
    app.gl.FLOAT_MAT4
]);

sub.set(0, projectionMatrix.getArray());
sub.update();

let spriteMatrix = new Matrix2D();

let modelViewMatrix = new Matrix4();

let x = 0;
let y = 0;
let r = 0;
let scaleX = 1;
let scaleY = 1;

ImageFile('stone', '../assets/512x512.png').load().then((file) => {

    let t = app.createTexture2D(file.data);

    let drawCall = app.createDrawCall(program, batch);

    drawCall.uniformBlock('SceneUniforms', sub);
    drawCall.texture('texture0', t);

    function render ()
    {
        ITRS(spriteMatrix, x, y, r, scaleX, scaleY);

        LoadMatrix2D(modelViewMatrix, spriteMatrix);

        drawCall.uniform('uModelViewMatrix', modelViewMatrix.getArray());

        app.clear();
    
        drawCall.draw();

        requestAnimationFrame(render);
    }

    render();

});
