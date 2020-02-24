//  A Matrix2D contains six elements in a short-form of the 3x3 Matrix, with the last column ignored.
//  |----|----|----|
//  | a  | b  | 0  |
//  |----|----|----|
//  | c  | d  | 0  |
//  |----|----|----|
//  | tx | ty | 1  |
//  |----|----|----|
class Matrix2D {
    /**
     * Creates an instance of Matrix2D.
     *
     * @param {number} [a=1] - X scale.
     * @param {number} [b=0] - X skew.
     * @param {number} [c=0] - Y skew.
     * @param {number} [d=1] - Y scale.
     * @param {number} [tx=0] - X translation
     * @param {number} [ty=0] - Y translation
     * @memberof Matrix2D
     */
    constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
        this.set(a, b, c, d, tx, ty);
    }
    set(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;
        return this;
    }
    identity() {
        return this.set();
    }
    toArray() {
        return [this.a, this.b, this.c, this.d, this.tx, this.ty];
    }
    fromArray(src) {
        return this.set(src[0], src[1], src[2], src[3], src[4], src[5]);
    }
    [Symbol.iterator]() {
        const data = this.toArray();
        return data[Symbol.iterator]();
    }
}

class Vec2 {
    /**
     * Creates an instance of a Vector2.
     *
     * @param {number} [x=0] - X component
     * @param {number} [y=0] - Y component
     * @memberof Vec2
     */
    constructor(x = 0, y = 0) {
        this.set(x, y);
    }
    /**
     * Sets the components of this Vector2.
     *
     * @param {number} [x=0] - X component
     * @param {number} [y=0] - Y component
     * @returns {Vec2}
     * @memberof Vec2
     */
    set(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        return this;
    }
    /**
     * Sets all components of this Vector2 to zero.
     *
     * @returns {Vec2}
     * @memberof Vec2
     */
    zero() {
        return this.set();
    }
    /**
     * Returns a new array containg the Vector2 component values.
     *
     * @returns {number[]}
     * @memberof Vec2
     */
    getArray() {
        return [this.x, this.y];
    }
    /**
     * Sets the values of this Vector2 based on the given array, or array-like object, such as a Float32.
     *
     * The source must have 2 elements, starting from index 0 through to index 1.
     *
     * @param {number[]} src - The source array to copy the values from.
     * @returns {Vec2}
     * @memberof Vec2
     */
    fromArray(src) {
        return this.set(src[0], src[1]);
    }
    [Symbol.iterator]() {
        const data = this.getArray();
        return data[Symbol.iterator]();
    }
}

class Transform {
    constructor(x = 0, y = 0, rotation = 0, scaleX = 1, scaleY = 1) {
        this.local = new Matrix2D();
        this.world = new Matrix2D();
        this._position = new Vec2(x, y);
        this._scale = new Vec2(scaleX, scaleY);
        this._skew = new Vec2(0, 0);
        this._origin = new Vec2(0, 0);
        this._rotation = rotation;
        this.dirty = true;
    }
    update() {
        if (!this.dirty) {
            return false;
        }
        const { _a, _b, _c, _d, _position } = this;
        // tx = this._position.x - ((this._origin.x * a) + (this._origin.y * c));
        // ty = this._position.y - ((this._origin.x * b) + (this._origin.y * d));
        this.local.set(_a, _b, _c, _d, _position.x, _position.y);
        this.dirty = false;
        return true;
    }
    setPosition(x, y) {
        this._position.set(x, y);
        this.dirty = true;
        return this;
    }
    setScale(scaleX, scaleY = scaleX) {
        this._scale.set(scaleX, scaleY);
        this.dirty = true;
        this.updateCache();
        return this;
    }
    setSkew(skewX, skewY) {
        this._skew.set(skewX, skewY);
        this.dirty = true;
        this.updateCache();
        return this;
    }
    setOrigin(originX, originY = originX) {
        this._origin.set(originX, originY);
        this.dirty = true;
        return this;
    }
    setRotation(rotation) {
        this.rotation = rotation;
        return this;
    }
    updateCache() {
        const { _rotation, _skew, _scale } = this;
        this._a = Math.cos(_rotation + _skew.y) * _scale.x;
        this._b = Math.sin(_rotation + _skew.y) * _scale.x;
        this._c = -Math.sin(_rotation - _skew.x) * _scale.y;
        this._d = Math.cos(_rotation - _skew.x) * _scale.y;
    }
    set x(value) {
        this._position.x = value;
        this.dirty = true;
    }
    get x() {
        return this._position.x;
    }
    set y(value) {
        this._position.y = value;
        this.dirty = true;
    }
    get y() {
        return this._position.y;
    }
    set rotation(value) {
        this._rotation = value;
        this.dirty = true;
        this.updateCache();
    }
    get rotation() {
        return this._rotation;
    }
    set scaleX(value) {
        this._scale.x = value;
        this.dirty = true;
        this.updateCache();
    }
    get scaleX() {
        return this._scale.x;
    }
    set scaleY(value) {
        this._scale.y = value;
        this.dirty = true;
        this.updateCache();
    }
    get scaleY() {
        return this._scale.y;
    }
    set originX(value) {
        this._origin.x = value;
        this.dirty = true;
    }
    get originX() {
        return this._origin.x;
    }
    set originY(value) {
        this._origin.y = value;
        this.dirty = true;
    }
    get originY() {
        return this._origin.y;
    }
    set skewX(value) {
        this._skew.x = value;
        this.dirty = true;
        this.updateCache();
    }
    get skewX() {
        return this._skew.x;
    }
    set skewY(value) {
        this._skew.y = value;
        this.dirty = true;
        this.updateCache();
    }
    get skewY() {
        return this._skew.y;
    }
}

function part25 () {
    //  Single quad with shader
    class Quad extends Transform {
        constructor(x, y, width, height, r, g, b, a) {
            super(x, y);
            this._size = new Vec2(width, height);
            this.topLeft = new Vec2();
            this.topRight = new Vec2();
            this.bottomLeft = new Vec2();
            this.bottomRight = new Vec2();
            this.rgba = { r, g, b, a };
            this.updateVertices();
        }
        updateVertices() {
            if (!this.dirty) {
                return false;
            }
            this.update();
            const w = this._size.x;
            const h = this._size.y;
            const x0 = -(this._origin.x * w);
            const x1 = x0 + w;
            const y0 = -(this._origin.y * h);
            const y1 = y0 + h;
            const { a, b, c, d, tx, ty } = this.local;
            //  Cache the calculations to avoid 8 getX/Y function calls:
            const x0a = x0 * a;
            const x0b = x0 * b;
            const y0c = y0 * c;
            const y0d = y0 * d;
            const x1a = x1 * a;
            const x1b = x1 * b;
            const y1c = y1 * c;
            const y1d = y1 * d;
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
    const canvas = document.getElementById('game');
    canvas.width = 800;
    canvas.height = 600;
    const gl = canvas.getContext('webgl');
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
    const quads = [];
    const max = 1;
    for (let i = 0; i < max; i++) {
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
    function getOrtho(left, right, bottom, top, near, far) {
        const leftRight = 1 / (left - right);
        const bottomTop = 1 / (bottom - top);
        const nearFar = 1 / (near - far);
        const m00 = -2 * leftRight;
        const m11 = -2 * bottomTop;
        const m22 = 2 * nearFar;
        const m30 = (left + right) * leftRight;
        const m31 = (top + bottom) * bottomTop;
        const m32 = (far + near) * nearFar;
        return new Float32Array([m00, 0, 0, 0, 0, m11, 0, 0, 0, 0, m22, 0, m30, m31, m32, 1]);
    }
    //  This matrix will convert from pixels to clip space - it only needs to be set when the canvas is sized
    let projectionMatrix = getOrtho(0, resolution.x, resolution.y, 0, -1000, 1000);
    const stride = 24;
    const startTime = Date.now();
    function render() {
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

// part24();
part25();
//  Next steps:
//  * Encode color as a single float, rather than a vec4
//  * Update Merged Transform to cache rotation and scale
//  * Multi Textures round-robin, don't use glIndex
//  * Container class - Transform stack test (Quad with children, children of children, etc)
//  * Instead of a Quad class, try a class that can have any number of vertices in it (ala Rope), or any vertex moved
//  * Tidy-up all of the classes, boil down into tiny WebGL1 + Sprite + Container + StaticContainer renderer package
//  Done:
//  X Texture Frames (UV) support
//  X Camera matrix, added to the shader (projection * camera * vertex pos), so we can move the camera around, rotate it, etc.
//  X Static buffer but use bufferSubData to update just a small part of it (i.e. a single moving quad in a static buffer)
//  X Static test using sprites
//  X Bunny mark (because, why not?)
//  X Multi Textures assigned at run-time up to max
//  X Multi-texture support
//  X Sub-data buffer with batch flush, like current renderer handles it
//  X Add a basic display list, so the buffer is cleared each frame and populated via the list
//  X Try adding all quads to a single huge buffer on creation (remove on destruction), then in the render loop
//    copy chunks from this buffer to the gl buffer - depends how fast typed array copies are vs. pushing elements by index
//# sourceMappingURL=test035.js.map
