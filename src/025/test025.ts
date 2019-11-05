import { WebGL2Renderer } from '@phaserjs/renderer-webgl2';
import { ImageFile } from '@phaserjs/loader-filetypes';

const vs = `#version 300 es

layout(std140, column_major) uniform;

layout(location=0) in vec4 position;
layout(location=1) in vec2 uv;
layout(location=2) in vec4 normal;
layout(location=3) in mat4 model;

uniform SceneUniforms {
    mat4 viewProj;
    vec4 eyePosition;
    vec4 lightPosition;
};


out vec3 vPosition;
out vec2 vUV;
out vec3 vNormal;

void main() {
    vec4 worldPosition = model * position;
    vPosition = worldPosition.xyz;
    vUV = uv;
    vNormal = (model * vec4(normal.xyz, 0.0)).xyz;
    gl_Position = viewProj * worldPosition;
}
`;

const fs = `#version 300 es
precision highp float;

layout(std140, column_major) uniform;

uniform SceneUniforms {
    mat4 viewProj;
    vec4 eyePosition;
    vec4 lightPosition;
};

uniform sampler2D uTexture;

in vec3 vPosition;
in vec2 vUV;
in vec3 vNormal;

out vec4 fragColor;
void main() {
    vec3 color = texture(uTexture, vUV).rgb;

    vec3 normal = normalize(vNormal);
    vec3 eyeVec = normalize(eyePosition.xyz - vPosition);
    vec3 incidentVec = normalize(vPosition - lightPosition.xyz);
    vec3 lightVec = -incidentVec;
    float diffuse = max(dot(lightVec, normal), 0.0);
    float highlight = pow(max(dot(eyeVec, reflect(incidentVec, normal)), 0.0), 100.0);
    float ambient = 0.1;
    fragColor = vec4(color * (diffuse + highlight + ambient), 1.0);
}
`;

const BOX_GRID_DIM = 40;
const NUM_BOXES = BOX_GRID_DIM * BOX_GRID_DIM * BOX_GRID_DIM;
const NEAR = 0.1;
const FAR = 100.0;

const app = new WebGL2Renderer(document.getElementById('game') as HTMLCanvasElement);

app.setClearColor(0, 0, 0, 1);
app.setDepthTest();

// cullBackfaces();
app.gl.enable(app.gl.CULL_FACE);

const program = app.createProgram(vs, fs);

let mat4 = window.glMatrix.mat4;
let vec3 = window.glMatrix.vec3;

let box = window.utils.createBox({ dimensions: [ 0.5, 0.5, 0.5 ] });
let positions = app.createVertexBuffer(app.gl.FLOAT, 3, box.positions);
let uv = app.createVertexBuffer(app.gl.FLOAT, 2, box.uvs);
let normals = app.createVertexBuffer(app.gl.FLOAT, 3, box.normals);

let modelMatrixData = new Float32Array(NUM_BOXES * 16);
let modelMatrices = app.createMatrixBuffer(app.gl.FLOAT_MAT4, modelMatrixData);

let boxArray = app.createVertexArray()
.vertexAttributeBuffer(0, positions)
.vertexAttributeBuffer(1, uv)
.vertexAttributeBuffer(2, normals)
.instanceAttributeBuffer(3, modelMatrices)

let projMatrix = mat4.create();

mat4.perspective(projMatrix, Math.PI / 2, 1024 / 768, NEAR, FAR);

let viewMatrix = mat4.create();
let eyePosition = vec3.fromValues(0, 22, 0);
let viewProjMatrix = mat4.create();
let lightPosition = vec3.create();

let sceneUniformBuffer = app.createUniformBuffer([
    app.gl.FLOAT_MAT4,
    app.gl.FLOAT_VEC4,
    app.gl.FLOAT_VEC4
]);

ImageFile('logo', '../assets/512x512.png').load().then((file) => {

    let texture = app.createTexture2D(file.data, 512, 512, { flipY: true, maxAnisotropy: app.state.maxTextureAnisotropy });

    let boxes = new Array(NUM_BOXES);
    let boxesDrawCall = app.createDrawCall(program, boxArray)
    .uniformBlock("SceneUniforms", sceneUniformBuffer)
    .texture("uTexture", texture);

    let rotationAxis = vec3.fromValues(1, 1, 1);
    vec3.normalize(rotationAxis, rotationAxis);

    let boxI = 0;
    let offset = -Math.floor(BOX_GRID_DIM / 2);
    for (let i = 0; i < BOX_GRID_DIM; ++i) {
        for (let j = 0; j < BOX_GRID_DIM; ++j) {
            for (let k = 0; k < BOX_GRID_DIM; ++k) {
                boxes[boxI] = {
                    rotate: boxI / Math.PI,
                    rotationMatrix: mat4.create(),
                    translationMatrix: mat4.create(),
                    // MODEL MATRICES ARE VIEWS INTO MODEL MATRIX BUFFER DATA TO AVOID
                    // COPYING
                    modelMatrix: new Float32Array(modelMatrixData.buffer, boxI * 64, 16),
                }
                mat4.fromRotation(boxes[boxI].rotationMatrix, boxes[boxI].rotate, rotationAxis);
                mat4.fromTranslation(boxes[boxI].translationMatrix, [i + offset, j + offset, k + offset]);
                ++boxI;
            }
        }
    }

    let eyeRadius = 30;
    let eyeRotation = 0;

    function render ()
    {
        eyeRotation += 0.002;

        eyePosition[0] = Math.sin(eyeRotation) * eyeRadius;
        eyePosition[2] = Math.cos(eyeRotation) * eyeRadius;
        lightPosition.set(eyePosition);
        lightPosition[0] += 5;

        mat4.lookAt(viewMatrix, eyePosition, vec3.fromValues(0, -5, 0), vec3.fromValues(0, 1, 0));
        mat4.multiply(viewProjMatrix, projMatrix, viewMatrix);
        
        sceneUniformBuffer
        .set(0, viewProjMatrix)
        .set(1, eyePosition)
        .set(2, lightPosition)
        .update();

        for (let i = 0, len = boxes.length; i < len; ++i) {
            let box = boxes[i];

            mat4.rotate(box.rotationMatrix, box.rotationMatrix, 0.02, rotationAxis);
            mat4.multiply(box.modelMatrix, box.translationMatrix, box.rotationMatrix)
        }
        modelMatrices.data(modelMatrixData);

        app.clear();
        boxesDrawCall.draw();

        requestAnimationFrame(render);
    }

    render();

});
