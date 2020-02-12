export default function ()
{
    const fs = `
    precision mediump float;
    
    void main (void) {
        gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
    }
    `;
    
    const vs = `
    attribute vec3 aVertexPosition;
    
    void main (void) {
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
    
    //  Remember: 0 x 0 is the center of the viewport, -1 on the left +1 on the right
    //  and the y axis goes up (-1 at the bottom to +1 at the top)
    
    //  indices wind anti-clockwise starting from top-left (in this case)
    
    const vertices = new Float32Array([
        -0.5, 0.5, 0.0,     // vertex 0
        -0.5, -0.5, 0.0,    // vertex 1
        0.5, -0.5, 0.0,     // vertex 2
        0.5, 0.5, 0.0       // vertex 3
    ]);
    
    const indices = new Uint16Array([ 3, 2, 1, 3, 1, 0 ]);
    
    const vertexBuffer = gl.createBuffer();
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    //  Should do: gl.bindBuffer(gl.ARRAY_BUFFER, null) unless creating another buffer right away (or rendering)
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    
    function render ()
    {
        gl.clearColor(0, 0, 0, 1);
        gl.enable(gl.DEPTH_TEST);
    
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, 1024, 768);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexPositionAttrib);
    
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }
    
    render();
}
