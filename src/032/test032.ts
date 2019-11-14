import { WebGL2Renderer } from '@phaserjs/renderer-webgl2';
import { ImageFile } from '@phaserjs/loader-filetypes';
import { ITRS, Matrix2D } from '@phaserjs/math-matrix2d';
import { Ortho, LookAt, Multiply, Perspective } from '@phaserjs/math-matrix4-funcs';
import { Vec2 } from '@phaserjs/math-vec2';
import { Vec3 } from '@phaserjs/math-vec3';
import { gsap } from '../../node_modules/gsap/index';

class Quad 
{
    transform: Matrix2D;

    topLeft: Vec2;
    topRight: Vec2;
    bottomLeft: Vec2;
    bottomRight: Vec2;

    private _position: Vec3;
    private _size: Vec2;
    private _scale: Vec2;
    private _origin: Vec2;
    private _rotation: number;

    private dirty: boolean;

    constructor (x: number, y: number, z: number, width: number, height: number)
    {
        this._position = new Vec3(x, y, z);
        this._size = new Vec2(width, height);
        this._scale = new Vec2(1, 1);
        this._origin = new Vec2(0.5, 0.5);
        this._rotation = 0;

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
        this._position.x = value;
        this.dirty = true;
    }

    get x (): number
    {
        return this._position.x;
    }

    set y (value: number)
    {
        this._position.y = value;
        this.dirty = true;
    }

    get y (): number
    {
        return this._position.y;
    }

    get z (): number
    {
        return this._position.z;
    }

    set z (value: number)
    {
        this._position.z = value;
        this.dirty = true;
    }

    set rotation (value: number)
    {
        this._rotation = value;
        this.dirty = true;
    }

    get rotation (): number
    {
        return this._rotation;
    }

    set scaleX (value: number)
    {
        this._scale.x = value;
        this.dirty = true;
    }

    get scaleX (): number
    {
        return this._scale.x;
    }

    set scaleY (value: number)
    {
        this._scale.y = value;
        this.dirty = true;
    }

    get scaleY (): number
    {
        return this._scale.y;
    }

    set originX (value: number)
    {
        this._origin.x = value;
        this.dirty = true;
    }

    get originX (): number
    {
        return this._origin.x;
    }

    set originY (value: number)
    {
        this._origin.y = value;
        this.dirty = true;
    }

    get originY (): number
    {
        return this._origin.y;
    }

    update (): boolean
    {
        if (!this.dirty)
        {
            return false;
        }

        const w: number = this._size.x;
        const h: number = this._size.y;

        const x0: number = -(this._origin.x * w);
        const x1: number = x0 + w;
        const y0: number = -(this._origin.y * h);
        const y1: number = y0 + h;

        const transform = this.transform;

        ITRS(transform, this._position.x, this._position.y, this._rotation, this._scale.x, this._scale.y);

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
layout(location=2) in float z;

uniform SceneUniforms {
    mat4 uProjectionMatrix;
};

out vec2 outUV;

void main()
{
    outUV = uv;

    gl_Position = uProjectionMatrix * vec4(position, z, 1.0);
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

app.setClearColor(0, 0, 0, 1);

// app.gl.disable(app.gl.CULL_FACE);
// app.gl.disable(app.gl.DEPTH_TEST);

let program = app.createProgram(vs, fs);

let cameraPosition = new Vec3(400, 256, -256);
let lookPosition = new Vec3(400, 200, 0);
let orientation = new Vec3(0, 1, 0);

let viewMatrix = LookAt(cameraPosition, lookPosition, orientation);

let p = Perspective(180, app.width / app.height, 0, 1000);

let projectionMatrix = Multiply(p, viewMatrix);

let sub = app.createUniformBuffer([ app.gl.FLOAT_MAT4 ]);

sub.set(0, projectionMatrix.getArray()).update();

//  Replace once we've got UV frame support merged in:
const UVTL = new Vec2(0, 1);
const UVTR = new Vec2(1, 1);
const UVBL = new Vec2(0, 0);
const UVBR = new Vec2(1, 0);

let quads = [];
let max = 200;

for (let i = 0; i < max; i++)
{
    let x = Math.floor(Math.random() * app.width);
    let y = Math.floor(Math.random() * app.height);
    let z = -400 + Math.floor(Math.random() * 800);

    let quad = new Quad(x, y, 0, 64, 64);

    quads.push(quad);
}
//  The size in bytes per element in the dataArray
const size = 4;

//  29 elements per quad (until we index them anyway) = size * (quads * 29)
const dataTA = new Float32Array(size * (max * 29));
let offset = 0;

quads.forEach((quad) => {

    dataTA[offset + 0] = quad.topLeft.x;
    dataTA[offset + 1] = quad.topLeft.y;
    dataTA[offset + 2] = UVTL.x;
    dataTA[offset + 3] = UVTL.y;
    dataTA[offset + 4] = quad.z;

    dataTA[offset + 5] = quad.topRight.x;
    dataTA[offset + 6] = quad.topRight.y;
    dataTA[offset + 7] = UVTR.x;
    dataTA[offset + 8] = UVTR.y;
    dataTA[offset + 9] = quad.z;

    dataTA[offset + 10] = quad.bottomLeft.x;
    dataTA[offset + 11] = quad.bottomLeft.y;
    dataTA[offset + 12] = UVBL.x;
    dataTA[offset + 13] = UVBL.y;
    dataTA[offset + 14] = quad.z;

    dataTA[offset + 15] = quad.bottomLeft.x;
    dataTA[offset + 16] = quad.bottomLeft.y;
    dataTA[offset + 17] = UVBL.x;
    dataTA[offset + 18] = UVBL.y;
    dataTA[offset + 19] = quad.z;

    dataTA[offset + 20] = quad.topRight.x;
    dataTA[offset + 21] = quad.topRight.y;
    dataTA[offset + 22] = UVTR.x;
    dataTA[offset + 23] = UVTR.y;
    dataTA[offset + 24] = quad.z;

    dataTA[offset + 25] = quad.bottomRight.x;
    dataTA[offset + 26] = quad.bottomRight.y;
    dataTA[offset + 27] = UVBR.x;
    dataTA[offset + 28] = UVBR.y;
    dataTA[offset + 29] = quad.z;

    offset += 30;

});

console.log(max, 'sprites', dataTA.byteLength, 'bytes', dataTA.byteLength / 1e+6, 'MB');

let buffer = app.createInterleavedBuffer(size * 5, dataTA);

let batch = app.createVertexArray();

batch.vertexAttributeBuffer(0, buffer, {
    type: app.gl.FLOAT,
    size: 2,
    offset: 0,
    stride: size * 5
});

batch.vertexAttributeBuffer(1, buffer, {
    type: app.gl.FLOAT,
    size: 2,
    offset: size * 2,
    stride: size * 5
});

batch.vertexAttributeBuffer(2, buffer, {
    type: app.gl.FLOAT,
    size: 1,
    offset: size * 4,
    stride: size * 5
});

ImageFile('sprites', '../assets/box-item-boxed.png').load().then((file) => {

    let t = app.createTexture2D(file.data);

    let drawCall = app.createDrawCall(program, batch);

    drawCall.uniformBlock('SceneUniforms', sub);
    drawCall.texture('texture0', t);

    quads.forEach((quad) => {

        let x = Math.floor(Math.random() * app.width);
        let y = Math.floor(Math.random() * app.height);
        let z = -200 + Math.floor(Math.random() * 400);
        let duration = 1 + Math.random() * 4;
        let rotation = Math.PI * 2;
    
        //  !!! Warning !!! This uses up LOTS of CPU time:
        gsap.to(quad, { duration, x, y, z, rotation, ease: 'sine.inOut', yoyo: true, repeat: -1 });

    });

    function render ()
    {
        let offset = 0;
        let dirty = false;

        quads.forEach((quad) => {

            if (quad.update())
            {
                dataTA[offset + 0] = quad.topLeft.x;
                dataTA[offset + 1] = quad.topLeft.y;
                // dataTA[offset + 2] = UVTL.x;
                // dataTA[offset + 3] = UVTL.y;
                dataTA[offset + 4] = quad.z;
            
                dataTA[offset + 5] = quad.topRight.x;
                dataTA[offset + 6] = quad.topRight.y;
                // dataTA[offset + 7] = UVTR.x;
                // dataTA[offset + 8] = UVTR.y;
                dataTA[offset + 9] = quad.z;
            
                dataTA[offset + 10] = quad.bottomLeft.x;
                dataTA[offset + 11] = quad.bottomLeft.y;
                // dataTA[offset + 12] = UVBL.x;
                // dataTA[offset + 13] = UVBL.y;
                dataTA[offset + 14] = quad.z;
            
                dataTA[offset + 15] = quad.bottomLeft.x;
                dataTA[offset + 16] = quad.bottomLeft.y;
                // dataTA[offset + 17] = UVBL.x;
                // dataTA[offset + 18] = UVBL.y;
                dataTA[offset + 19] = quad.z;
            
                dataTA[offset + 20] = quad.topRight.x;
                dataTA[offset + 21] = quad.topRight.y;
                // dataTA[offset + 22] = UVTR.x;
                // dataTA[offset + 23] = UVTR.y;
                dataTA[offset + 24] = quad.z;
            
                dataTA[offset + 25] = quad.bottomRight.x;
                dataTA[offset + 26] = quad.bottomRight.y;
                // dataTA[offset + 27] = UVBR.x;
                // dataTA[offset + 28] = UVBR.y;
                dataTA[offset + 29] = quad.z;
            
                dirty = true;
            }
        
            offset += 30;
        
        });

        if (dirty)
        {
            buffer.data(dataTA);
        }

        app.clear();
    
        drawCall.draw();

        requestAnimationFrame(render);
    }

    render();

});
