export default function ()
{
    //  Added the uModelTransform mat4 to the vertex shader

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
    
    //  We can pass in the vertex coordinates as screen-space values
    //  instead of clip-space, as they're being converted in the shader

    const vertices = [];
    const indices = [];

    let totalQuads = 0;

    const resolution = { x: 800, y: 600 };

    function getX (v: number): number
    {
        return v / resolution.x * 2.0 - 1.0;
    }

    function getY (v: number): number
    {
        return v / resolution.y * -2.0 + 1.0;
    }

    /**
     * This function will add the vertices for a new quad into the vertices
     * array. It'll also add in the indicies.
     * 
     * Values are in screen-space.
     * RGBA values are floats 0-1.
     */
    function addQuad (width: number = 64, height: number = 64, r: number = 1, g: number = 1, b: number = 1, a: number = 1)
    {
        // let x1 = 0 - (width / resolution.x);
        // let y1 = 0 - (height / resolution.y);
        // let x2 = 0 + (width / resolution.x);
        // let y2 = 0 + (height / resolution.y);

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

    addQuad(256, 256, 0, 1, 0, 1);

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

    //  This matrix will convert from pixels to clip space
    const projectionMatrix = getOrtho(0, resolution.x, resolution.y, 0, -1000, 1000);

    //  Our modelView matrix
    const modelTransform = new Float32Array([ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ]);

    //  Values are in screen space because we started with an ortho matrix

    let width = 256;
    let height = 256;

    Translate(modelTransform, 400, 300, 0);

    RotateZ(modelTransform, 0.4);

    //  Set origin to the center of the quad
    Translate(modelTransform, width / -2, height / -2, 0);

    //  Because it's a 1x1 unit quad, scale it to 256 x 256
    Scale(modelTransform, width, height, 0);
    
    const stride = 24;

    function render ()
    {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        //  So alpha works
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.viewport(0, 0, canvas.width, canvas.height);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(uModelTransform, false, modelTransform);

        /**
         * Each vertex contains:
         * 
         *  position (x,y - 2 floats)
         *  color (r,g,b,a - 4 floats)
         * 
         * 6 floats = 6 * 4 bytes = 24 bytes per vertex. This is our stride.
         * The offset is how much data should be skipped at the start of each chunk.
         * In our index, the color data is right after the position data.
         * Position is 2 floats, so the offset for the color is 2 * 4 bytes = 8 bytes.
         */

        // size: A GLint specifying the number of components per vertex attribute. Must be 1, 2, 3, or 4 (i.e. vec3 = 3)
        gl.vertexAttribPointer(vertexPositionAttrib, 2, gl.FLOAT, false, stride, 0);
        gl.vertexAttribPointer(vertexColorAttrib, 4, gl.FLOAT, false, stride, 8);

        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }
    
    render();
}
