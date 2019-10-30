import * as M2D from '@phaserjs/math-matrix2d';
import { WebGL2Renderer } from '@phaserjs/renderer-webgl2';
import { ImageFile } from '@phaserjs/loader-filetypes';

const xvs = `#version 300 es

layout(location=0) in vec4 inPosition;
layout(location=1) in vec3 inColor;

out vec3 color;

void main() {
    color = inColor;
    gl_Position = inPosition;
}
`;

const xfs = `#version 300 es
precision highp float;

in vec3 color;

uniform sampler2D tex;

out vec4 fragColor;

void main() {
    // fragColor = texture(tex, uv);
    fragColor = vec4(color, 1.0);
}
`;

const vs = `#version 300 es

layout(location=0) in vec4 inPosition;

void main() {
    gl_Position = inPosition;
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

// app.resize(window.innerWidth, window.innerHeight);
app.setClearColor(0.1, 0.1, 0.1, 1);

let program = app.createProgram(vs, fs);

let x = 64;
let y = 64;
let width = 96;
let height = 128;

const TL = app.getXY(x, y);
const TR = app.getXY(x + width, y);
const BL = app.getXY(x, y + height);
const BR = app.getXY(x + width, y + height);

//  Indices working for quad vertices! Finally!!!

let vertices = app.createVertexBuffer(app.gl.FLOAT, 2, new Float32Array([ TL.x, TL.y, BL.x, BL.y, BR.x, BR.y, TR.x, TR.y ]));
let indices = app.createIndexBuffer(app.gl.UNSIGNED_SHORT, 3, new Uint16Array([ 0, 1, 2, 2, 3, 0 ]));
let vertexArray = app.createVertexArray().vertexAttributeBuffer(0, vertices).indexBuffer(indices);

// let vertices = app.createVertexBuffer(app.gl.FLOAT, 2, new Float32Array([ TL.x, TL.y, BL.x, BL.y, BR.x, BR.y, BR.x, BR.y, TR.x, TR.y, TL.x, TL.y ]));
// let colors = app.createVertexBuffer(app.gl.FLOAT, 3, new Float32Array([ 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0 ]));
// let colors = app.createVertexBuffer(app.gl.FLOAT, 3, new Float32Array([ 1.0, 0.0, 0.0, 0.0, 1.0, 0.0 ]));
// let colorIndices = app.createIndexBuffer(app.gl.UNSIGNED_SHORT, 1, new Uint16Array([ 0, 0, 0, 1, 1, 1 ]));
// let vertexArray = app.createVertexArray().indexBuffer(indices).vertexAttributeBuffer(0, vertices);
// let vertexArray = app.createVertexArray().vertexAttributeBuffer(0, vertices).indexBuffer(indices);
// let vertexArray = app.createVertexArray();
// vertexArray.vertexAttributeBuffer(0, vertices);
// vertexArray.indexBuffer(indices);
// vertexArray.vertexAttributeBuffer(0, vertices);
// vertexArray.vertexAttributeBuffer(1, colors);
// vertexArray.indexBuffer(colorIndices);

ImageFile('stone', '/100-phaser3-snippets/public/assets/poop.png').load().then((file) => {

    let texture = app.createTexture2D(file.data);

    // let drawCall = app.createDrawCall(program, vertexArray).texture('tex', texture);

    let drawCall = app.createDrawCall(program, vertexArray);

    // console.log(vertices);
    // console.log(indices);
    console.log(vertexArray);
    console.log(drawCall);

    function render ()
    {
        app.clear();
        
        drawCall.draw();

        requestAnimationFrame(render);
    }

    render();

});
