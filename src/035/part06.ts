export default function ()
{
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

    uniform vec2 resolution;

    varying vec4 vColor;
    
    void main (void)
    {
        vColor = aColor;

        float x = aVertexPosition.x / resolution.x * 2.0 - 1.0;
        float y = aVertexPosition.y / resolution.y * -2.0 + 1.0;
    
        gl_Position = vec4(x, y, 0.0, 1.0); 
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
    const projectionVector = gl.getUniformLocation(program, 'resolution');

    gl.enableVertexAttribArray(vertexPositionAttrib);
    gl.enableVertexAttribArray(vertexColorAttrib);
    
    //  We can pass in the vertex coordinates as screen-space values
    //  instead of clip-space, as they're being converted in the shader

    const vertices = [];
    const indices = [];
    let totalQuads = 0;

    /**
     * This function will add the vertices for a new quad into the vertices
     * array. It'll also add in the indicies.
     * 
     * Values are in screen-space.
     * RGBA values are floats 0-1.
     */
    function addQuad (x, y, width = 64, height = 64, r = 1, g = 1, b = 1, a = 1)
    {
        //  top-left
        vertices.push(x, y, r, g, b, a);

        //  bottom-left
        vertices.push(x, y + height, r, g, b, a);

        //  bottom-right
        vertices.push(x + width, y + height, r, g, b, a);

        //  top-right
        vertices.push(x + width, y, r, g, b, a);

        const offset = totalQuads * 4;

        indices.push(
            offset, offset + 1, offset + 2,
            offset, offset + 2, offset + 3
        );

        totalQuads++;
    }

    //  Generate a bunch of random quads
    //  This is still static data right now, but we're progressing
    for (let i = 0; i < 128; i++)
    {
        let x = Math.random() * 750;
        let y = Math.random() * 550;
        let w = 32 + Math.random() * 64;
        let h = 32 + Math.random() * 128;
        let r = Math.random();
        let g = Math.random();
        let b = Math.random();

        addQuad(x, y, w, h, r, g, b, 0.75);
    }

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

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

        gl.uniform2f(projectionVector, canvas.clientWidth, canvas.clientHeight);

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
