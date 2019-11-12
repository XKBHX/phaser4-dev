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

    gl_Position = uModelViewMatrix * vec4(position, 1.0);
    // gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(position, 1.0);
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

// let projectionMatrix = Ortho(0, app.width, app.height, 0, 0, 1000);
let projectionMatrix = new Matrix4();

let sub = app.createUniformBuffer([
    app.gl.FLOAT_MAT4
]);

sub.set(0, projectionMatrix.getArray());
sub.update();

let spriteMatrix = new Matrix2D();

let modelViewMatrix = new Matrix4(0.001943367510308644, -0.000259982855851115, 0, 0, -0.00019498714188833624, -0.002591156680411525, 0, 0, 0, 0, -0.002, 0, -0.99609375, 0.9921875, -1, 1);

// ITRS(spriteMatrix, 2, 3, 0.1, 1, 1);
// LoadMatrix2D(modelViewMatrix, spriteMatrix);

console.log(projectionMatrix.getArray());
// (16) [0.001953125, 0, 0, 0, 0, -0.0026041666666666665, 0, 0, 0, 0, -0.002, 0, -1, 1, -1, 1]

Translate(projectionMatrix, 2, 3, 0);
RotateZ(projectionMatrix, 0.1);
Scale(projectionMatrix, 1, 1, 1);

console.log(projectionMatrix.getArray());
// (16) [0.9950041652780257, 0.09983341664682815, 0, 0, -0.09983341664682815, 0.9950041652780257, 0, 0, 0, 0, 1, 0, 2, 3, 0, 1]

// console.log(modelViewMatrix.getArray());
// console.log(spriteMatrix.getArray());

//  shader = proj * model * position

//  proj                        model                       sprite
//  -----------------------------------------------------------------
//  0.001953125                 0.9950041652780257          a
//  0                           0.09983341664682815         b
//  0                           0
//  0                           0
//  0                           -0.09983341664682815        c
//  -0.0026041666666666665      0.9950041652780257          d
//  0                           0
//  0                           0
//  0                           2                           tx
//  0                           3                           ty
//  -0.002                      1
//  0                           0
//  -1                          0
//  1                           0
//  -1                          0
//  1                           1

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
        // ITRS(spriteMatrix, x, y, r, scaleX, scaleY);

        // LoadMatrix2D(modelViewMatrix, spriteMatrix);

        drawCall.uniform('uModelViewMatrix', modelViewMatrix.getArray());

        // drawCall.uniform('uModelViewMatrix', spriteMatrix.getArray());

        app.clear();
    
        drawCall.draw();

        requestAnimationFrame(render);
    }

    render();

});
