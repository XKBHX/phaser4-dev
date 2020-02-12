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
    attribute vec3 aVertexPosition;

    varying vec4 vColor;
    
    void main (void)
    {
        vColor = aColor;

        gl_Position = vec4(aVertexPosition, 1.0); 
    }
    `;
    
    const canvas = document.getElementById('game') as HTMLCanvasElement;
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

    gl.enableVertexAttribArray(vertexPositionAttrib);
    gl.enableVertexAttribArray(vertexColorAttrib);
    
    //  Remember: 0 x 0 is the center of the viewport, -1 on the left +1 on the right
    //  and the y axis goes up (-1 at the bottom to +1 at the top)
    
    /**
  	 * #0 (-0.5,0.5) +--------------+  (0.5,0.5)  #3
	 *               |              |
	 *               |              |
	 *               |      .(0,0)  |
	 *               |              |
	 *               |              | 
	 * #1(-0.5,-0.5) +--------------+  (0.5,-0.5) #2
     */
    
    const vertices = new Float32Array([
        -0.5, 0.5, 0.0,     // vertex 0
        1.0, 0.0, 0.0, 1.0, // color 0
        -0.5, -0.5, 0.0,    // vertex 1
        1.0, 1.0, 0.0, 1.0, // color 1
        0.5, -0.5, 0.0,     // vertex 2
        1.0, 1.0, 0.0, 1.0, // color 2
        0.5, 0.5, 0.0,      // vertex 3
        1.0, 0.0, 0.0, 1.0  // color 3
    ]);

    /**
     * The most important point to realise is that a single vertex is not simply its position,
     * but a combination of all of its attributes. In this case, a position and a color make up a single vertex.
     * 
     * Position: | pos0   | pos1   | pos2   | pos3   | pos4   |
     * Color:    | color0 | color1 | color2 | color3 | color4 |
     * 
     * Each index in the index buffer refers to a combination of both the position and a color attribute.
     * That is, index 0 will fetch pos0 and color0; index 5 will fetch pos5 and color5, etc.
     */

     const indices = new Uint16Array([
        0,
        1,
        2,
        0,
        2,
        3
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    //  Should do: gl.bindBuffer(gl.ARRAY_BUFFER, null) unless creating another buffer right away (or rendering)
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const stride = 28;

    function render ()
    {
        gl.clearColor(0, 0, 0, 1);
        gl.enable(gl.DEPTH_TEST);
    
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, 1024, 768);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        /**
         * Each vertex contains:
         * 
         *  position (x,y,z - 3 floats)
         *  color (r,g,b,a - 4 floats)
         * 
         * 7 floats = 7 * 4 bytes = 28 bytes per vertex. This is our stride.
         * The offset is how much data should be skipped at the start of each chunk.
         * In our index, the color data is right after the position data.
         * Position is 3 floats, so the offset for the color is 3 * 4 bytes = 12 bytes.
         */

        // size: A GLint specifying the number of components per vertex attribute. Must be 1, 2, 3, or 4 (i.e. vec3 = 3)
        gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, stride, 0);
        gl.vertexAttribPointer(vertexColorAttrib, 4, gl.FLOAT, false, stride, 12);

        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }
    
    render();
}
