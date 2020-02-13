export default function ()
{
    const fs = `
    precision mediump float;

    varying vec4 vColor;
    
    void main (void)
    {
        gl_FragColor = vec4(vColor.x, vColor.y, vColor.z, 1.0);
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

    /**
  	 * vertex 0      +--------------+  vertex 3
	 *               |              |
	 *               |              |
	 *               |              |
	 *               |              |
	 *               |              | 
	 * vertex 1      +--------------+  vertex 2
     */

    const vertices = new Float32Array([

        //  quad 1
        0, 0,               // vertex 0
        1.0, 0.0, 0.0, 1.0, // color 0
        0, 256,             // vertex 1
        1.0, 1.0, 0.0, 1.0, // color 1
        256, 256,           // vertex 2
        1.0, 1.0, 0.0, 1.0, // color 2
        256, 0,             // vertex 3
        1.0, 0.0, 0.0, 1.0, // color 3

        //  quad 2
        400, 60,            // vertex 0
        1.0, 0.0, 1.0, 1.0, // color 0
        400, 560,           // vertex 1
        0.0, 1.0, 0.0, 1.0, // color 1
        620, 560,           // vertex 2
        1.0, 1.0, 0.0, 1.0, // color 2
        620, 60,            // vertex 3
        1.0, 1.0, 0.0, 1.0  // color 3

    ]);

    /**
     * The most important point to realise is that a single vertex is not simply its position,
     * but a combination of all of its attributes. In this case, a position and a color make up a single vertex.
     * 
     * Position: | pos0   | pos1   | pos2   | pos3   |
     * Color:    | color0 | color1 | color2 | color3 |
     * 
     * Each index in the index buffer refers to a combination of both the position and a color attribute.
     * That is, index 0 will fetch pos0 and color0; index 5 will fetch pos5 and color5, etc.
     */

     const indices = new Uint16Array([
        // quad 1
        0, 1, 2, 0, 2, 3,

        // quad 2 (same indices as quad1 + offset of 4)
        4, 5, 6, 4, 6, 7
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const stride = 24;

    function render ()
    {
        gl.clearColor(0, 0, 0, 1);
        gl.enable(gl.DEPTH_TEST);
    
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
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
