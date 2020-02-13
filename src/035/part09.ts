export default function ()
{
    //  Encapsulate a quad, so we can have multple quads (still using modelTransform approach)

    const fs = `
    precision mediump float;

    varying vec4 vColor;
    
    void main (void)
    {
        gl_FragColor = vec4(vColor.r, vColor.g, vColor.b, vColor.a);
    }
    `;
    
    const vs = `
    attribute vec4 aColor;
    attribute vec2 aVertexPosition;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uModelTransform;

    varying vec4 vColor;
    
    void main (void)
    {
        vColor = aColor;
    
        gl_Position = uProjectionMatrix * uModelTransform * vec4(aVertexPosition, 0.0, 1.0);
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
    
    const vertexPositionAttrib = gl.getAttribLocation(program, 'aVertexPosition');
    const vertexColorAttrib = gl.getAttribLocation(program, 'aColor');
    const uModelTransform = gl.getUniformLocation(program, 'uModelTransform');
    const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');

    gl.enableVertexAttribArray(vertexPositionAttrib);
    gl.enableVertexAttribArray(vertexColorAttrib);
    
    const vertices = [];
    const indices = [];

    let totalQuads = 0;

    const resolution = { x: 800, y: 600 };

    //  Creates a 1 unit quad
    function addQuad (r: number = 1, g: number = 1, b: number = 1, a: number = 1)
    {
        //  A 1 unit quad
        let x1 = 0;
        let y1 = 0;
        let x2 = 1;
        let y2 = 1;

        //  top-left
        vertices.push(x1, y1, r, g, b, a);

        //  bottom-left
        vertices.push(x1, y2, r, g, b, a);

        //  bottom-right
        vertices.push(x2, y2, r, g, b, a);

        //  top-right
        vertices.push(x2, y1, r, g, b, a);

        const offset = totalQuads * 4;

        indices.push(
            offset, offset + 1, offset + 2,
            offset, offset + 2, offset + 3
        );

        totalQuads++;
    }

    class Quad
    {
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
        scaleX: number;
        scaleY: number;
        modelTransform: Float32Array;
        r: number;

        constructor (x: number, y: number, width: number, height: number, r: number = 0, g: number = 1, b: number = 0, a: number = 1)
        {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.rotation = 0;
            this.scaleX = 1;
            this.scaleY = 1;
            this.modelTransform = new Float32Array([ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ]);

            this.r = 0.01;

            addQuad(r, g, b, a);
        }

        update ()
        {
            this.rotation += this.r;

            Identity(this.modelTransform);

            //  Values are in screen space because we started with an ortho matrix
            Translate(this.modelTransform, this.x, this.y, 0);
   
            RotateZ(this.modelTransform, this.rotation);
    
            //  Set origin to the center of the quad
            Translate(this.modelTransform, this.width / -2, this.height / -2, 0);
    
            //  Because it's a 1x1 unit quad, scale it to 256 x 256
            Scale(this.modelTransform, this.width * this.scaleX, this.height * this.scaleY, 0);
        }
    }

    const quads: Quad[] = [];

    quads.push(new Quad(400, 300, 128, 128));
    quads.push(new Quad(400, 400, 64, 64, 1, 0, 0));
    quads.push(new Quad(200, 400, 64, 64, 0, 0, 1));
    quads.push(new Quad(600, 400, 64, 64, 1, 0, 1));

    window['quads'] = quads;

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
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

    function Identity (src: Float32Array): Float32Array
    {
        src[0] = 1;
        src[1] = 0;
        src[2] = 0;
        src[3] = 0;
        src[4] = 0;
        src[5] = 1;
        src[6] = 0;
        src[7] = 0;
        src[8] = 0;
        src[9] = 0;
        src[10] = 1;
        src[11] = 0;
        src[12] = 0;
        src[13] = 0;
        src[14] = 0;
        src[15] = 1;

        return src;
    }

    function Translate (src: Float32Array, x: number = 0, y: number = 0, z: number = 0): Float32Array
    {
        const m00 = src[0];
        const m01 = src[1];
        const m02 = src[2];
        const m03 = src[3];
        const m10 = src[4];
        const m11 = src[5];
        const m12 = src[6];
        const m13 = src[7];
        const m20 = src[8];
        const m21 = src[9];
        const m22 = src[10];
        const m23 = src[11];
        const m30 = src[12];
        const m31 = src[13];
        const m32 = src[14];
        const m33 = src[15];
    
        const a30 = m00 * x + m10 * y + m20 * z + m30;
        const a31 = m01 * x + m11 * y + m21 * z + m31;
        const a32 = m02 * x + m12 * y + m22 * z + m32;
        const a33 = m03 * x + m13 * y + m23 * z + m33;
    
        src[12] = a30;
        src[13] = a31;
        src[14] = a32;
        src[15] = a33;

        return src;
    }

    function Scale (src: Float32Array, scaleX: number, scaleY: number, scaleZ: number): Float32Array
    {
        src[0] *= scaleX;
        src[1] *= scaleX;
        src[2] *= scaleX;
        src[3] *= scaleX;
        src[4] *= scaleY;
        src[5] *= scaleY;
        src[6] *= scaleY;
        src[7] *= scaleY;
        src[8] *= scaleZ;
        src[9] *= scaleZ;
        src[10] *= scaleZ;
        src[11] *= scaleZ;

        return src;
    }

    function RotateZ (src: Float32Array, angle: number): Float32Array
    {
        const s: number = Math.sin(angle);
        const c: number = Math.cos(angle);
    
        const m00 = src[0];
        const m01 = src[1];
        const m02 = src[2];
        const m03 = src[3];
        const m10 = src[4];
        const m11 = src[5];
        const m12 = src[6];
        const m13 = src[7];
    
        const a00: number = m00 * c + m10 * s;
        const a01: number = m01 * c + m11 * s;
        const a02: number = m02 * c + m12 * s;
        const a03: number = m03 * c + m13 * s;
        const a10: number = m10 * c - m00 * s;
        const a11: number = m11 * c - m01 * s;
        const a12: number = m12 * c - m02 * s;
        const a13: number = m13 * c - m03 * s;
        
        src[0] = a00;
        src[1] = a01;
        src[2] = a02;
        src[3] = a03;
        src[4] = a10;
        src[5] = a11;
        src[6] = a12;
        src[7] = a13;

        return src;
    }

    //  This matrix will convert from pixels to clip space - it only needs to be set when the canvas is sized
    const projectionMatrix = getOrtho(0, resolution.x, resolution.y, 0, -1000, 1000);

    const stride = 24;

    //  This approach only works for a single quad
    function render ()
    {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.viewport(0, 0, canvas.width, canvas.height);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        gl.vertexAttribPointer(vertexPositionAttrib, 2, gl.FLOAT, false, stride, 0);
        gl.vertexAttribPointer(vertexColorAttrib, 4, gl.FLOAT, false, stride, 8);

        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);

        for (let i = 0; i < quads.length; i++)
        {
            quads[i].update();

            gl.uniformMatrix4fv(uModelTransform, false, quads[i].modelTransform);
    
            //  draw one quad at a time! Terrible for performance, but for our purposes here, it'll work.
            //  the next stage will be to not use a uniform for the model transform, as we can't batch our quads

            //  count = how many indicies are there per quad in the element array (6)
            //  offset = byte offset in element array buffer, i.e. how many indicies are there per quad (6) * 2 (as they're floats) = 12 bytes
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, i * 12);
        }

        requestAnimationFrame(render);
    }
    
    requestAnimationFrame(render);
}
