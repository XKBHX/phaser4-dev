import { WebGL2Renderer } from '@phaserjs/renderer-webgl2';
import { ImageFile } from '@phaserjs/loader-filetypes';
import { Ortho, Matrix4, Translate, RotateX, RotateY, RotateZ, Scale } from '@phaserjs/math-matrix4';
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

layout(location=0) in vec3 aVertexPosition;
layout(location=1) in vec2 aVertexNormal;
layout(location=2) in vec2 aOffset;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

out vec2 outUV;

void main()
{
    outUV = aVertexNormal;

    //  Final vertex position
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);

    gl_Position.xy += aOffset;
}
`;

const fs = `#version 300 es
precision highp float;

uniform sampler2D tex;

in vec2 outUV;

out vec4 fragColor;

void main() {
    fragColor = texture(tex, outUV);
}
`;

let app = new WebGL2Renderer(document.getElementById('game') as HTMLCanvasElement);

app.setClearColor(0.6, 0.6, 0, 1);

let program = app.createProgram(vs, fs);

let quad = createQuad(0, 0, 512, 512);

//  Working instances - all get positioned relative to the first quad - rotation + scale happens per instance too

let positions = app.createVertexBuffer(app.gl.FLOAT, 2, quad.position);
let uvs = app.createVertexBuffer(app.gl.FLOAT, 2, quad.uvs);
let offsets = app.createVertexBuffer(app.gl.FLOAT, 2, new Float32Array([ 0, 0, 1, 0, 0, -1, 1, -1 ]));

let triangleArray = app.createVertexArray();

triangleArray.vertexAttributeBuffer(0, positions);
triangleArray.vertexAttributeBuffer(1, uvs);
triangleArray.instanceAttributeBuffer(2, offsets);

let projectionMatrix = new Matrix4();
Ortho(projectionMatrix, 0, app.width, app.height, 0, 0, 1000);

let modelViewMatrix = new Matrix4();

let x = 0;
let y = 0;
let z = 0;
let r = 0;
let scaleX = 1;
let scaleY = 1;


ImageFile('stone', '../assets/512x512.png').load().then((file) => {

    let t = app.createTexture2D(file.data);

    let drawCall = app.createDrawCall(program, triangleArray)

    drawCall.uniform('uProjectionMatrix', projectionMatrix.getArray());
    drawCall.texture('tex', t);

    function render ()
    {
        modelViewMatrix.identity();

        Translate(modelViewMatrix, x, y, z);
        RotateZ(modelViewMatrix, r);
        Scale(modelViewMatrix, scaleX, scaleY, 1);

        drawCall.uniform('uModelViewMatrix', modelViewMatrix.getArray());

        app.clear();
    
        drawCall.draw();

        requestAnimationFrame(render);
    }

    render();

});
