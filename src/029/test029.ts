import { WebGL2Renderer } from '@phaserjs/renderer-webgl2';
import { ImageFile } from '@phaserjs/loader-filetypes';
import { Matrix2D } from '@phaserjs/math-matrix2d';
import { Ortho } from '@phaserjs/math-matrix4-funcs';
import { Vec2 } from '@phaserjs/math-vec2';
import { gsap } from '../../node_modules/gsap/index';

class Quad 
{
    transform: Matrix2D;

    topLeft: Vec2;
    topRight: Vec2;
    bottomLeft: Vec2;
    bottomRight: Vec2;

    private _x: number;
    private _y: number;
    private _w: number;
    private _h: number;

    private dirty: boolean;

    constructor (x: number, y: number, width: number, height: number)
    {
        this._x = x;
        this._y = y;
        this._w = width;
        this._h = height;

        this.transform = new Matrix2D();

        this.topLeft = new Vec2();
        this.topRight = new Vec2();
        this.bottomLeft = new Vec2();
        this.bottomRight = new Vec2();

        this.dirty = true;

        this.update();
    }

    set x (value: number)
    {
        this._x = value;
        this.dirty = true;
    }

    get x (): number
    {
        return this._x;
    }

    set y (value: number)
    {
        this._y = value;
        this.dirty = true;
    }

    get y (): number
    {
        return this._y;
    }

    update (): boolean
    {
        if (!this.dirty)
        {
            return false;
        }

        const x0: number = this._x;
        const x1: number = x0 + this._w;
        const y0: number = this._y;
        const y1: number = y0 + this._h;

        const transform = this.transform;

        this.topLeft.set(transform.getX(x0, y0), transform.getY(x0, y0));
        this.topRight.set(transform.getX(x1, y0), transform.getY(x1, y0));
        this.bottomLeft.set(transform.getX(x0, y1), transform.getY(x0, y1));
        this.bottomRight.set(transform.getX(x1, y1), transform.getY(x1, y1));

        this.dirty = false;

        return true;
    }
}

const vs = `#version 300 es
precision highp float;

layout(location=0) in vec2 position;
layout(location=1) in vec2 uv;

uniform SceneUniforms {
    mat4 uProjectionMatrix;
};

out vec2 outUV;

void main()
{
    outUV = uv;

    gl_Position = uProjectionMatrix * vec4(position, 0.0, 1.0);
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

let program = app.createProgram(vs, fs);

let projectionMatrix = Ortho(0, app.width, app.height, 0, -1000, 1000);

let sub = app.createUniformBuffer([ app.gl.FLOAT_MAT4 ]);

sub.set(0, projectionMatrix.getArray()).update();




let quad = new Quad(4, 8, 32, 32);

const UVTL = new Vec2(0, 1);
const UVTR = new Vec2(1, 1);
const UVBL = new Vec2(0, 0);
const UVBR = new Vec2(1, 0);

//  The size in bytes per element in the dataArray
const size = 4;

//  24 elements per quad (until we index them anyway) = size * (quads * 24)
// const dataTA = new Float32Array(size * 24);

const dataTA = new Float32Array([
    quad.topLeft.x, quad.topLeft.y,
    UVTL.x, UVTL.y,

    quad.topRight.x, quad.topRight.y,
    UVTR.x, UVTR.y,

    quad.bottomLeft.x, quad.bottomLeft.y,
    UVBL.x, UVBL.y,

    quad.bottomLeft.x, quad.bottomLeft.y,
    UVBL.x, UVBL.y,

    quad.topRight.x, quad.topRight.y,
    UVTR.x, UVTR.y,

    quad.bottomRight.x, quad.bottomRight.y,
    UVBR.x, UVBR.y
]);

console.log(dataTA.byteLength, 'bytes', dataTA.byteLength / 1e+6, 'MB');

let buffer = app.createInterleavedBuffer(size * 4, dataTA);

let batch = app.createVertexArray();

batch.vertexAttributeBuffer(0, buffer, {
    type: app.gl.FLOAT,
    size: 2,
    offset: 0,
    stride: size * 4
});

batch.vertexAttributeBuffer(1, buffer, {
    type: app.gl.FLOAT,
    size: 2,
    offset: size * 2,
    stride: size * 4
});

ImageFile('sprites', '../assets/shinyball.png').load().then((file) => {

    let t = app.createTexture2D(file.data);

    let drawCall = app.createDrawCall(program, batch);

    drawCall.uniformBlock('SceneUniforms', sub);
    drawCall.texture('texture0', t);

    gsap.to(quad, { duration: 4, x: 900, y: 700, ease: 'sine.inOut',  yoyo: true, repeat: -1 });

    function render ()
    {
        if (quad.update())
        {
            dataTA[0] = quad.topLeft.x;
            dataTA[1] = quad.topLeft.y;
            dataTA[4] = quad.topRight.x;
            dataTA[5] = quad.topRight.y;
            dataTA[8] = quad.bottomLeft.x;
            dataTA[9] = quad.bottomLeft.y;
            dataTA[12] = quad.bottomLeft.x;
            dataTA[13] = quad.bottomLeft.y;
            dataTA[16] = quad.topRight.x;
            dataTA[17] = quad.topRight.y;
            dataTA[20] = quad.bottomRight.x;
            dataTA[21] = quad.bottomRight.y;

            buffer.data(dataTA);
        }

        app.clear();
    
        drawCall.draw();

        requestAnimationFrame(render);
    }

    render();

});
