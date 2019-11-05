import { WebGL2Renderer } from '@phaserjs/renderer-webgl2';
import { ImageFile } from '@phaserjs/loader-filetypes';

const vs = `#version 300 es

layout(std140, column_major) uniform;

layout(location=0) in vec4 position;
layout(location=1) in vec2 uv;
layout(location=2) in vec4 normal;

uniform SceneUniforms {
    mat4 viewProj;
    vec4 eyePosition;
    vec4 lightPosition;
};

uniform mat4 uModel;

out vec3 vPosition;
out vec2 vUV;
out vec3 vNormal;

void main()
{
    vec4 worldPosition = uModel * position;
    vPosition = worldPosition.xyz;
    vUV = uv;
    vNormal = (uModel * normal).xyz;
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

uniform sampler2D tex;

in vec3 vPosition;
in vec2 vUV;
in vec3 vNormal;

out vec4 fragColor;

void main()
{
    vec3 color = texture(tex, vUV).rgb;
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

const app = new WebGL2Renderer(document.getElementById('game') as HTMLCanvasElement);

app.setClearColor(0, 0, 0, 1);
app.setDepthTest();

const program = app.createProgram(vs, fs);

let mat4 = window.glMatrix.mat4;
let vec3 = window.glMatrix.vec3;

let box = window.utils.createBox({dimensions: [1.0, 1.0, 1.0]})

let positions = app.createVertexBuffer(app.gl.FLOAT, 3, box.positions);
let uv = app.createVertexBuffer(app.gl.FLOAT, 2, box.uvs);
let normals = app.createVertexBuffer(app.gl.FLOAT, 3, box.normals);

let boxArray = app.createVertexArray()
.vertexAttributeBuffer(0, positions)
.vertexAttributeBuffer(1, uv)
.vertexAttributeBuffer(2, normals)

let projMatrix = mat4.create();

mat4.perspective(projMatrix, Math.PI / 2, 1024 / 768, 0.1, 10.0);

let viewMatrix = mat4.create();
let eyePosition = vec3.fromValues(1, 1, 1);
mat4.lookAt(viewMatrix, eyePosition, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));

let viewProjMatrix = mat4.create();
mat4.multiply(viewProjMatrix, projMatrix, viewMatrix);

let lightPosition = vec3.fromValues(1, 1, 0.5);

let sceneUniformBuffer = app.createUniformBuffer([
    app.gl.FLOAT_MAT4,
    app.gl.FLOAT_VEC4,
    app.gl.FLOAT_VEC4
])
.set(0, viewProjMatrix)
.set(1, eyePosition)
.set(2, lightPosition)
.update();

let modelMatrix = mat4.create();
let rotateXMatrix = mat4.create();
let rotateYMatrix = mat4.create();

let angleX = 0;
let angleY = 0;

ImageFile('logo', '../assets/512x512.png').load().then((file) => {

    let texture = app.createTexture2D(file.data, 512, 512, { flipY: true, maxAnisotropy: app.state.maxTextureAnisotropy });

    let drawCall = app.createDrawCall(program, boxArray)
    .uniformBlock("SceneUniforms", sceneUniformBuffer)
    .texture("tex", texture);

    function render ()
    {
        angleX += 0.01;
        angleY += 0.02;

        mat4.fromXRotation(rotateXMatrix, angleX);
        mat4.fromYRotation(rotateYMatrix, angleY);
        mat4.multiply(modelMatrix, rotateXMatrix, rotateYMatrix);

        drawCall.uniform("uModel", modelMatrix);

        app.clear();
        drawCall.draw()

        requestAnimationFrame(render);
    }

    render();

});
