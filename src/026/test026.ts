import { WebGL2Renderer } from '@phaserjs/renderer-webgl2';
import { ImageFile } from '@phaserjs/loader-filetypes';
import { Ortho, Matrix4, Translate, RotateX, RotateY, RotateZ, Scale } from '@phaserjs/math-matrix4';
import { LookAt, Multiply } from '@phaserjs/math-matrix4-funcs';
import { Vec2 } from '@phaserjs/math-vec2';
import { Vec3 } from '@phaserjs/math-vec3';

function createBox (options)
{
    options = options || {};

    let dimensions = options.dimensions || [1, 1, 1];
    let position = options.position || [-dimensions[0] / 2, -dimensions[1] / 2, -dimensions[2] / 2];
    let x = position[0];
    let y = position[1];
    let z = position[2];
    let width = dimensions[0];
    let height = dimensions[1];
    let depth = dimensions[2];

    let fbl = {x: x,         y: y,          z: z + depth};
    let fbr = {x: x + width, y: y,          z: z + depth};
    let ftl = {x: x,         y: y + height, z: z + depth};
    let ftr = {x: x + width, y: y + height, z: z + depth};
    let bbl = {x: x,         y: y,          z: z };
    let bbr = {x: x + width, y: y,          z: z };
    let btl = {x: x,         y: y + height, z: z };
    let btr = {x: x + width, y: y + height, z: z };

    let positions = new Float32Array([
        //front
        fbl.x, fbl.y, fbl.z,
        fbr.x, fbr.y, fbr.z,
        ftl.x, ftl.y, ftl.z,
        ftl.x, ftl.y, ftl.z,
        fbr.x, fbr.y, fbr.z,
        ftr.x, ftr.y, ftr.z,

        //right
        fbr.x, fbr.y, fbr.z,
        bbr.x, bbr.y, bbr.z,
        ftr.x, ftr.y, ftr.z,
        ftr.x, ftr.y, ftr.z,
        bbr.x, bbr.y, bbr.z,
        btr.x, btr.y, btr.z,

        //back
        fbr.x, bbr.y, bbr.z,
        bbl.x, bbl.y, bbl.z,
        btr.x, btr.y, btr.z,
        btr.x, btr.y, btr.z,
        bbl.x, bbl.y, bbl.z,
        btl.x, btl.y, btl.z,

        //left
        bbl.x, bbl.y, bbl.z,
        fbl.x, fbl.y, fbl.z,
        btl.x, btl.y, btl.z,
        btl.x, btl.y, btl.z,
        fbl.x, fbl.y, fbl.z,
        ftl.x, ftl.y, ftl.z,

        //top
        ftl.x, ftl.y, ftl.z,
        ftr.x, ftr.y, ftr.z,
        btl.x, btl.y, btl.z,
        btl.x, btl.y, btl.z,
        ftr.x, ftr.y, ftr.z,
        btr.x, btr.y, btr.z,

        //bottom
        bbl.x, bbl.y, bbl.z,
        bbr.x, bbr.y, bbr.z,
        fbl.x, fbl.y, fbl.z,
        fbl.x, fbl.y, fbl.z,
        bbr.x, bbr.y, bbr.z,
        fbr.x, fbr.y, fbr.z
    ]);

    let uvs = new Float32Array([
        //front
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,

        //right
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,

        //back
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,

        //left
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,

        //top
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,

        //bottom
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1
    ]);

    let normals = new Float32Array([
        // front
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // right
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,

        // back
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,

        // left
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,

        // top
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,

        // bottom
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0
    ]);

    return {
        positions: positions,
        normals: normals,
        uvs: uvs
    };

};

const vs = `#version 300 es
precision mediump float;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

layout(location=0) in vec3 aVertexPosition;
layout(location=1) in vec2 aVertexNormal;

// uniform SceneUniforms {
//     mat4 viewProj;
// };

out vec2 outUV;

void main()
{
    outUV = aVertexNormal;

    //  Transformed vertex position
    vec4 vertex = uModelViewMatrix * vec4(aVertexPosition, 1.0);

    //  Final vertex position
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
}
`;

const fs = `#version 300 es
precision highp float;

// layout(std140, column_major) uniform;

// uniform SceneUniforms {
//     mat4 viewProj;
// };

uniform sampler2D tex;

in vec2 outUV;

out vec4 fragColor;

void main() {
    fragColor = texture(tex, outUV);
    // fragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

let app = new WebGL2Renderer(document.getElementById('game') as HTMLCanvasElement);

app.setClearColor(0.2, 0.4, 0, 1);

app.gl.enable(app.gl.CULL_FACE);
app.gl.enable(app.gl.DEPTH_TEST);

let program = app.createProgram(vs, fs);

// console.log(app.getQuadPosition(0, 0, 512, 512));

// let positions = app.createVertexBuffer(app.gl.FLOAT, 2, app.getQuadPosition(0, 0, 512, 512));
// let positions = app.createVertexBuffer(app.gl.FLOAT, 2, new Float32Array([ 0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, -0.5, -0.5, 0 ]));
// let uvs = app.createVertexBuffer(app.gl.FLOAT, 2, new Float32Array([ 1, 1, 0, 1, 1, 0, 0, 0 ]));
// let uvs = app.createVertexBuffer(app.gl.FLOAT, 2, new Float32Array([ 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0 ]));

let box = createBox({});

let positions = app.createVertexBuffer(app.gl.FLOAT, 3, box.positions);
let uvs = app.createVertexBuffer(app.gl.FLOAT, 2, box.uvs);

let triangleArray = app.createVertexArray().vertexAttributeBuffer(0, positions).vertexAttributeBuffer(1, uvs);

// let cameraPosition = new Vec3(512, 512, 10);
// let lookPosition = new Vec3(512, -512, 0);
// let orientation = new Vec3(0, 1, 0);

// let viewMatrix = LookAt(cameraPosition, lookPosition, orientation);

let modelViewMatrix = new Matrix4();
let projectionMatrix = new Matrix4();

// Ortho(projMatrix, 0, 10, -5, 5, 0, 1000);
// Ortho(projMatrix, 0, app.width, app.height, 0, -1000, 1000);

// let mvpMatrix = Multiply(projMatrix, viewMatrix);

// console.log(viewProj.getArray());

// let sub = app.createUniformBuffer([
//     app.gl.FLOAT_MAT4
// ]);

// sub.set(0, mvpMatrix.getArray());
// sub.update();

// let modelMatrix = new Matrix4();

// let x = 0;
// let y = 0;
// let z = 0;
// let r = 0;
// let scaleX = 1;
// let scaleY = 1;

//  512 x 512

let rx = 0;
let ry = 0;

ImageFile('stone', '../assets/512x512.png').load().then((file) => {

    let t = app.createTexture2D(file.data);

    let drawCall = app.createDrawCall(program, triangleArray)

    drawCall.uniform('uModelViewMatrix', modelViewMatrix.getArray());
    drawCall.uniform('uProjectionMatrix', projectionMatrix.getArray());

    // drawCall.uniformBlock('SceneUniforms', sub);

    drawCall.texture('tex', t);

    function render ()
    {
        modelViewMatrix.identity();

        RotateX(modelViewMatrix, rx);
        RotateY(modelViewMatrix, ry);

        rx += 0.01;
        ry += 0.015;
        
        // modelMatrix.identity();

        // Translate(modelMatrix, x, y, z);
        // RotateZ(modelMatrix, r);
        // Scale(modelMatrix, scaleX, scaleY, 1);

        drawCall.uniform('uModelViewMatrix', modelViewMatrix.getArray());

        app.clear();
    
        drawCall.draw();

        requestAnimationFrame(render);
    }

    render();

});
