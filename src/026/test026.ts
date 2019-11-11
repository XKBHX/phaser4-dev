import { WebGL2Renderer } from '@phaserjs/renderer-webgl2';
import { ImageFile } from '@phaserjs/loader-filetypes';
import { Ortho, Matrix4, Translate, RotateZ, Scale } from '@phaserjs/math-matrix4';
import { LookAt, Multiply } from '@phaserjs/math-matrix4-funcs';
import { Vec2 } from '@phaserjs/math-vec2';
import { Vec3 } from '@phaserjs/math-vec3';

const vs = `#version 300 es

layout(location=0) in vec2 position;
layout(location=1) in vec2 uv;

// layout(std140, column_major) uniform;

// uniform SceneUniforms {
    // mat4 viewProj;
// };

uniform mat4 uModel;

const vec2 proj = vec2(512.0, -512.0);
const vec2 center = vec2(-1.0, 1.0);

out vec2 vUV;

void main()
{
    vUV = uv;
    gl_Position = vec4((position / proj) + center, 0.0, 1.0);
    //gl_Position = viewProj * uModel * vec4(position, 1.0, 1.0);
}
`;

const fs = `#version 300 es
precision highp float;

// layout(std140, column_major) uniform;

// uniform SceneUniforms {
    // mat4 viewProj;
// };

uniform sampler2D tex;

in vec2 vUV;

out vec4 fragColor;

void main() {
    fragColor = texture(tex, vUV);
    // fragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

let app = new WebGL2Renderer(document.getElementById('game') as HTMLCanvasElement);

app.setClearColor(0.2, 0.4, 0, 1);

app.gl.disable(app.gl.CULL_FACE);
app.gl.disable(app.gl.DEPTH_TEST);

let program = app.createProgram(vs, fs);

let positions = app.createVertexBuffer(app.gl.FLOAT, 2, app.getQuadPosition(0, 0, 313, 512));
let uvs = app.createVertexBuffer(app.gl.FLOAT, 2, new Float32Array([ 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0 ]));

let triangleArray = app.createVertexArray().vertexAttributeBuffer(0, positions).vertexAttributeBuffer(1, uvs);

// let viewMatrix = Matrix4Funcs.

let cameraPosition = new Vec3(512, 512, 10);
let lookPosition = new Vec3(512, -512, 0);
let orientation = new Vec3(0, 1, 0);

let viewMatrix = LookAt(cameraPosition, lookPosition, orientation);

// let viewMatrix = new Matrix4();

let projMatrix = new Matrix4();

// Ortho(projMatrix, 0, 10, -5, 5, 0, 1000);
Ortho(projMatrix, 0, app.width, app.height, 0, -1000, 1000);

let mvpMatrix = Multiply(projMatrix, viewMatrix);

// console.log(viewProj.getArray());

/*
let sub = app.createUniformBuffer([
    app.gl.FLOAT_MAT4
]);

sub.set(0, mvpMatrix.getArray());
sub.update();
*/

let modelMatrix = new Matrix4();

let x = 0;
let y = 0;
let z = 0;
let r = 0;
let scaleX = 1;
let scaleY = 1;

//  313 x 512
ImageFile('stone', '/100-phaser3-snippets/public/assets/patchouli.png').load().then((file) => {

    let t = app.createTexture2D(file.data);

    let drawCall = app.createDrawCall(program, triangleArray)

    // drawCall.uniformBlock('SceneUniforms', sub);
    drawCall.texture('tex', t);

    function render ()
    {
        modelMatrix.identity();

        Translate(modelMatrix, x, y, z);
        // RotateZ(modelMatrix, r);
        // Scale(modelMatrix, scaleX, scaleY, 1);

        drawCall.uniform('uModel', modelMatrix.getArray());

        app.clear();
    
        drawCall.draw();

        requestAnimationFrame(render);
    }

    render();

});
