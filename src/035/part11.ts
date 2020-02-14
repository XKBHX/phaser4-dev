import { Transform } from '@phaserjs/math-transform';
import { Vec2 } from '@phaserjs/math-vec2';
import { gsap } from '../../node_modules/gsap/index';

export default function ()
{
    //  Trying a plasma shader on the quads

    class Quad extends Transform
    {
        readonly topLeft: Vec2;
        readonly topRight: Vec2;
        readonly bottomLeft: Vec2;
        readonly bottomRight: Vec2;

        readonly rgba;
    
        private _size: Vec2;
    
        constructor (x: number, y: number, width: number, height: number, r: number, g: number, b: number, a: number)
        {
            super(x, y);
    
            this._size = new Vec2(width, height);
    
            this.topLeft = new Vec2();
            this.topRight = new Vec2();
            this.bottomLeft = new Vec2();
            this.bottomRight = new Vec2();

            this.rgba = { r, g, b, a };
    
            this.updateVertices();
        }
    
        updateVertices (): boolean
        {
            if (!this.dirty)
            {
                return false;
            }
    
            this.update();
    
            const w: number = this._size.x;
            const h: number = this._size.y;
    
            const x0: number = -(this._origin.x * w);
            const x1: number = x0 + w;
            const y0: number = -(this._origin.y * h);
            const y1: number = y0 + h;
    
            const { a, b, c, d, tx, ty } = this.local;
    
            //  Cache the calculations to avoid 8 getX/Y function calls:
    
            const x0a: number = x0 * a;
            const x0b: number = x0 * b;
            const y0c: number = y0 * c;
            const y0d: number = y0 * d;
    
            const x1a: number = x1 * a;
            const x1b: number = x1 * b;
            const y1c: number = y1 * c;
            const y1d: number = y1 * d;
    
            this.topLeft.set(x0a + y0c + tx, x0b + y0d + ty);
            this.topRight.set(x1a + y0c + tx, x1b + y0d + ty);
            this.bottomLeft.set(x0a + y1c + tx, x0b + y1d + ty);
            this.bottomRight.set(x1a + y1c + tx, x1b + y1d + ty);
    
            return true;
        }
    }
    
    const fs = `
    precision mediump float;

    uniform float uTime;
    
    varying vec2 fragCoord;
    varying vec4 vColor;
    
    const float PI = 3.14159265;
    
    void main (void)
    {
        float time = uTime * 0.2;
    
        float color1, color2, color;
        
        color1 = (sin(dot(fragCoord.xy,vec2(sin(time*3.0),cos(time*3.0)))*0.02+time*3.0)+1.0)/2.0;
        
        vec2 center = vec2(800.0/2.0, 300.0/2.0) + vec2(800.0/2.0*sin(-time*3.0),300.0/2.0*cos(-time*3.0));
        
        color2 = (cos(length(fragCoord.xy - center)*0.03)+1.0)/2.0;
        
        color = (color1+ color2)/2.0;
    
        float red   = (cos(PI*color/0.5+time*3.0)+1.0)/2.0;
        float green = (sin(PI*color/0.5+time*3.0)+1.0)/2.0;
        float blue  = (sin(+time*3.0)+1.0)/2.0;
        
        gl_FragColor = vec4(red, green, blue, vColor.a);
    }
    `;
    
    const vs = `
    precision mediump float;

    attribute vec4 aColor;
    attribute vec2 aVertexPosition;

    uniform mat4 uProjectionMatrix;
    uniform float uTime;

    varying vec2 fragCoord;
    varying vec4 vColor;
    
    void main (void)
    {
        vColor = aColor;

        fragCoord = aVertexPosition;
        
        gl_Position = uProjectionMatrix * vec4(aVertexPosition, 0.0, 1.0);
    }
    `;

    const canvas = document.getElementById('game') as HTMLCanvasElement;

    canvas.width = 800;
    canvas.height = 600;

    const gl: WebGLRenderingContext = canvas.getContext('webgl');
    
    //  Create the shaders
    
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    
    gl.shaderSource(fragmentShader, fs);
    gl.compileShader(fragmentShader);
    
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    
    gl.shaderSource(vertexShader, vs);
    gl.compileShader(vertexShader);
    
    const program = gl.createProgram();
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    gl.useProgram(program);
    
    const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const vertexPositionAttrib = gl.getAttribLocation(program, 'aVertexPosition');
    const vertexColorAttrib = gl.getAttribLocation(program, 'aColor');

    gl.enableVertexAttribArray(vertexPositionAttrib);
    gl.enableVertexAttribArray(vertexColorAttrib);
    
    const resolution = { x: 800, y: 600 };

    const quads: Quad[] = [];
    const max = 150;
    
    for (let i = 0; i < max; i++)
    {
        let x = Math.floor(Math.random() * resolution.x);
        let y = Math.floor(Math.random() * resolution.y);
        let s = 0.1 + Math.random() * 0.2;
        let r = Math.min(1, 0.2 + Math.random());
        let g = Math.min(1, 0.2 + Math.random());
        let b = Math.min(1, 0.2 + Math.random());
    
        let quad = new Quad(x, y, 256, 256, r, g, b, 0.3);
    
        quad.setOrigin(0.5);
        quad.setScale(s);

        quad.updateVertices();
    
        quads.push(quad);
    }
    
    window['quads'] = quads;

    //  The size in bytes per element in the dataArray
    const size = 4;
    const singleVertexSize = 24;
    const singleIndexSize = 4;

    const dataTA = new Float32Array(size * (max * singleVertexSize));

    let offset = 0;
    let ibo = [];
    let iboIndex = 0;

    quads.forEach((quad) => {

        dataTA[offset + 0] = quad.topLeft.x;
        dataTA[offset + 1] = quad.topLeft.y;
        dataTA[offset + 2] = quad.rgba.r;
        dataTA[offset + 3] = quad.rgba.g;
        dataTA[offset + 4] = quad.rgba.b;
        dataTA[offset + 5] = quad.rgba.a;

        dataTA[offset + 6] = quad.bottomLeft.x;
        dataTA[offset + 7] = quad.bottomLeft.y;
        dataTA[offset + 8] = quad.rgba.r;
        dataTA[offset + 9] = quad.rgba.g;
        dataTA[offset + 10] = quad.rgba.b;
        dataTA[offset + 11] = quad.rgba.a;

        dataTA[offset + 12] = quad.bottomRight.x;
        dataTA[offset + 13] = quad.bottomRight.y;
        dataTA[offset + 14] = quad.rgba.r;
        dataTA[offset + 15] = quad.rgba.g;
        dataTA[offset + 16] = quad.rgba.b;
        dataTA[offset + 17] = quad.rgba.a;

        dataTA[offset + 18] = quad.topRight.x;
        dataTA[offset + 19] = quad.topRight.y;
        dataTA[offset + 20] = quad.rgba.r;
        dataTA[offset + 21] = quad.rgba.g;
        dataTA[offset + 22] = quad.rgba.b;
        dataTA[offset + 23] = quad.rgba.a;

        ibo.push(iboIndex + 0, iboIndex + 1, iboIndex + 2, iboIndex + 2, iboIndex + 3, iboIndex + 0);

        iboIndex += singleIndexSize;
        offset += singleVertexSize;

    });

    console.log(max, 'sprites', dataTA.byteLength, 'bytes', dataTA.byteLength / 1e+6, 'MB');

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, dataTA, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ibo), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    function getOrtho (left: number, right: number, bottom: number, top: number, near: number, far: number): Float32Array
    {
        const leftRight: number = 1 / (left - right);
        const bottomTop: number = 1 / (bottom - top);
        const nearFar: number = 1 / (near - far);
      
        const m00: number = -2 * leftRight;
        const m11: number = -2 * bottomTop;
        const m22: number = 2 * nearFar;
        const m30: number = (left + right) * leftRight;
        const m31: number = (top + bottom) * bottomTop;
        const m32: number = (far + near) * nearFar;
    
        return new Float32Array([ m00, 0, 0, 0, 0, m11, 0, 0, 0, 0, m22, 0, m30, m31, m32, 1 ]);
    }

    //  This matrix will convert from pixels to clip space - it only needs to be set when the canvas is sized
    const projectionMatrix = getOrtho(0, resolution.x, resolution.y, 0, -1000, 1000);

    const stride = 24;

    quads.forEach((quad) => {

        let duration = 1 + Math.random() * 4;
        // let rotation = Math.PI * 2;
        let rotation = 0;
        let scale = 0.01 + (Math.random() / 2);
        let skewX = -4 + Math.random() * 8;
        let skewY = -4 + Math.random() * 8;
    
        //  !!! Warning !!! This uses up LOTS of CPU time AND also adds 133KB to the JS size:

        // gsap.to(quad, { duration, scaleX: scale, scaleY: scale, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        // gsap.to(quad, { duration, rotation, skewX, skewY, ease: 'sine.inOut',  yoyo: true, repeat: -1 });
        gsap.to(quad, { duration, scaleX: scale, scaleY: scale, skewX, skewY, ease: 'sine.inOut',  yoyo: true, repeat: -1 });

    });

    const startTime = Date.now();

    function render ()
    {
        let offset = 0;
        let dirty = false;

        quads.forEach((quad) => {

            if (quad.updateVertices())
            {
                dataTA[offset + 0] = quad.topLeft.x;
                dataTA[offset + 1] = quad.topLeft.y;
        
                dataTA[offset + 6] = quad.bottomLeft.x;
                dataTA[offset + 7] = quad.bottomLeft.y;
        
                dataTA[offset + 12] = quad.bottomRight.x;
                dataTA[offset + 13] = quad.bottomRight.y;
        
                dataTA[offset + 18] = quad.topRight.x;
                dataTA[offset + 19] = quad.topRight.y;
                        
                dirty = true;
            }
        
            offset += singleVertexSize;
        
        });

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.viewport(0, 0, canvas.width, canvas.height);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        if (dirty)
        {
            gl.bufferData(gl.ARRAY_BUFFER, dataTA, gl.DYNAMIC_DRAW);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        gl.vertexAttribPointer(vertexPositionAttrib, 2, gl.FLOAT, false, stride, 0);
        gl.vertexAttribPointer(vertexColorAttrib, 4, gl.FLOAT, false, stride, 8);

        gl.uniform1f(uTime, Math.round(Date.now() - startTime) / 1000);
        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);

        gl.drawElements(gl.TRIANGLES, ibo.length, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(render);
    }
    
    render();
}
