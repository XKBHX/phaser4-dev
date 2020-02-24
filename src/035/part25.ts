import { Transform } from '@phaserjs/math-transform';
import { Vec2 } from '@phaserjs/math-vec2';

export default function ()
{
    //  Single quad with shader

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
    #ifdef GL_ES
    precision mediump float;
    #endif
    
    uniform float time;
    uniform vec2 resolution;
    
    const int TV_MODE_SCANLINES = 1;
    const int TV_MODE_SLANT = 2;
    
    const float rgbPixZoom = 2.0;
    const float scanlineStep = 10.0;
    const float scanlineIntensity = 0.7;
    
    const int tvMode = TV_MODE_SLANT;
    //const int tvMode = TV_MODE_SCANLINES;
    
    void main( void ) {
      vec2 spd = vec2(
        2.0 * sin( ( (4.1*sin(time/(6.5*time))-10.2) + (5.4*sin(time/12.0)+10.0) + (4.2*sin(time/12.10)+0.00) + (1.00*sin(time*(0.00125*sin(time/2.3)+0.49))) ) / 2.0),
        2.0 * cos( ( (4.0*cos(time/(6.0*time))-12.2) + (5.5*cos(time/12.0)+10.0) + (8.0*cos(time/13.23)+0.00) + (1.00*sin(time*(0.00125*sin(time/3.1)+0.50))) ) / 2.0)
      );
      
      vec2 pos = vec2(
        (gl_FragCoord.x - resolution.x/2.0) * spd.x / resolution.x / (0.25*sin(time/1.3)+1.0) / 0.50,
        (gl_FragCoord.y - resolution.y/2.0) * spd.y / resolution.y / (0.25*cos(time/1.0)+3.0) / 0.50
      );
    
      float diagonalPos = 1.66 * sin(length(vec2(pos.x, pos.y)));
    
      vec4 image = vec4(
        sin(pos.y*(0.80-diagonalPos)*20.0) * cos(spd.y*(0.80-diagonalPos)*20.0) + 1.0,
        sin(pos.y*(0.90-diagonalPos)*23.0) * cos(spd.y*(0.90-diagonalPos)*23.0) + 1.0,
        sin(pos.y*(1.00-diagonalPos)*21.0) * cos(spd.y*(1.00-diagonalPos)*21.0) + 1.0,
        1.0
      );
    
      image *= vec4(
        sin(pos.x+spd.x+(0.9-diagonalPos)*20.0) * cos(pos.y*spd.y/(0.9-diagonalPos)*20.0),
        cos(pos.x+spd.x+(0.8-diagonalPos)*21.0) * cos(pos.y*spd.y/(0.8-diagonalPos)*19.0),
        sin(pos.x+spd.x+(1.0-diagonalPos)*19.0) * sin(pos.y*spd.y/(1.0-diagonalPos)*21.0),
        1.0
      );
      
      vec4 colorAdjust = vec4(1.66, 1.1, 1.5, 1.0);
    
      image = clamp(image*colorAdjust, 0.0, 1.0);
    
      float rgbPos; // 0-red, 1-blue, 2-green
      vec4 rgbFilter;
      
      // rotate R, G and B pixels based on scanline
      if (tvMode == TV_MODE_SLANT) {
        float rgbShift = floor(mod((resolution.y-gl_FragCoord.y)/rgbPixZoom, 3.0));
        rgbPos = floor(mod(gl_FragCoord.x/rgbPixZoom+rgbShift, 3.0)); 
        rgbFilter = vec4(
          float(rgbPos == 0.0),
          float(rgbPos == 1.0),
          float(rgbPos == 2.0),
          1.0
        );
      } else if (tvMode == TV_MODE_SCANLINES) {
        float lineIndex = floor(mod((resolution.y-gl_FragCoord.y)/rgbPixZoom, scanlineStep));
        bool  isScanline = lineIndex == (scanlineStep-1.0);
        rgbPos = floor(mod(gl_FragCoord.x/rgbPixZoom, 3.0));
        rgbFilter = vec4(
          float(rgbPos == 0.0) * (isScanline ? scanlineIntensity : 1.0),
          float(rgbPos == 1.0) * (isScanline ? scanlineIntensity : 1.0),
          float(rgbPos == 2.0) * (isScanline ? scanlineIntensity : 1.0),
          1.0
        );
      } else {
        rgbFilter = vec4(1.0, 1.0, 1.0, 1.0);
      }
      
      gl_FragColor = image * colorAdjust * rgbFilter;
    }
    `;
    
    const vs = `
    precision mediump float;

    attribute vec4 aColor;
    attribute vec2 aVertexPosition;

    uniform mat4 uProjectionMatrix;
    // uniform float uTime;

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
    const uTime = gl.getUniformLocation(program, 'time');
    const uResolution = gl.getUniformLocation(program, 'resolution');
    const vertexPositionAttrib = gl.getAttribLocation(program, 'aVertexPosition');
    const vertexColorAttrib = gl.getAttribLocation(program, 'aColor');

    gl.enableVertexAttribArray(vertexPositionAttrib);
    gl.enableVertexAttribArray(vertexColorAttrib);
    
    const resolution = { x: 800, y: 600 };
    // const resolution = { x: window.innerWidth, y: window.innerHeight };

    const quads: Quad[] = [];
    const max = 1;
    
    for (let i = 0; i < max; i++)
    {
        let quad = new Quad(0, 0, resolution.x, resolution.y, 1, 1, 1, 1);
    
        quad.updateVertices();
    
        quads.push(quad);
    }
    
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
    let projectionMatrix = getOrtho(0, resolution.x, resolution.y, 0, -1000, 1000);

    const stride = 24;

    const startTime = Date.now();

    function render ()
    {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.viewport(0, 0, canvas.width, canvas.height);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, dataTA, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        gl.vertexAttribPointer(vertexPositionAttrib, 2, gl.FLOAT, false, stride, 0);
        gl.vertexAttribPointer(vertexColorAttrib, 4, gl.FLOAT, false, stride, 8);

        gl.uniform1f(uTime, Math.round(Date.now() - startTime) / 1000);
        gl.uniform2f(uResolution, resolution.x, resolution.y);
        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);

        gl.drawElements(gl.TRIANGLES, ibo.length, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(render);
    }
    
    render();
}
