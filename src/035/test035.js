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
//# sourceMappingURL=Vec2.js.map

class SpriteMergedTransform {
    constructor(x, y, texture) {
        this.rgba = { r: 1, g: 1, b: 1, a: 1 };
        this.visible = true;
        this.texture = null;
        this.uv = {
            topLeft: { x: 0, y: 0 },
            topRight: { x: 1, y: 0 },
            bottomLeft: { x: 0, y: 1 },
            bottomRight: { x: 1, y: 1 }
        };
        this._a = 1;
        this._b = 0;
        this._c = 0;
        this._d = 1;
        this._tx = 0;
        this._ty = 0;
        this.texture = texture;
        this._size = new Vec2(texture.width, texture.height);
        this.topLeft = new Vec2();
        this.topRight = new Vec2();
        this.bottomLeft = new Vec2();
        this.bottomRight = new Vec2();
        this._position = new Vec2(x, y);
        this._scale = new Vec2(1, 1);
        this._skew = new Vec2(0, 0);
        this._origin = new Vec2(0, 0);
        this._rotation = 0;
        //  Transform.update:
        this._tx = x;
        this._ty = y;
    }
    setOrigin(originX, originY = originX) {
        this._origin.set(originX, originY);
        return this;
    }
    updateCache() {
        const { _rotation, _skew, _scale } = this;
        this._a = Math.cos(_rotation + _skew.y) * _scale.x;
        this._b = Math.sin(_rotation + _skew.y) * _scale.x;
        this._c = -Math.sin(_rotation - _skew.x) * _scale.y;
        this._d = Math.cos(_rotation - _skew.x) * _scale.y;
    }
    setTexture(texture) {
        this.texture = texture;
        this._size.set(texture.width, texture.height);
        return this;
    }
    batch(dataTA, offset) {
        //  Update Vertices:
        const w = this._size.x;
        const h = this._size.y;
        const x0 = -(this._origin.x * w);
        const x1 = x0 + w;
        const y0 = -(this._origin.y * h);
        const y1 = y0 + h;
        const { _a, _b, _c, _d, _tx, _ty } = this;
        //  Cache the calculations to avoid 8 getX/Y function calls:
        const x0a = x0 * _a;
        const x0b = x0 * _b;
        const y0c = y0 * _c;
        const y0d = y0 * _d;
        const x1a = x1 * _a;
        const x1b = x1 * _b;
        const y1c = y1 * _c;
        const y1d = y1 * _d;
        this.topLeft.set(x0a + y0c + _tx, x0b + y0d + _ty);
        this.topRight.set(x1a + y0c + _tx, x1b + y0d + _ty);
        this.bottomLeft.set(x0a + y1c + _tx, x0b + y1d + _ty);
        this.bottomRight.set(x1a + y1c + _tx, x1b + y1d + _ty);
        //  Batch:
        const textureIndex = this.texture.glIndex;
        dataTA[offset + 0] = this.topLeft.x;
        dataTA[offset + 1] = this.topLeft.y;
        dataTA[offset + 2] = this.uv.topLeft.x;
        dataTA[offset + 3] = this.uv.topLeft.y;
        dataTA[offset + 4] = textureIndex;
        dataTA[offset + 5] = this.bottomLeft.x;
        dataTA[offset + 6] = this.bottomLeft.y;
        dataTA[offset + 7] = this.uv.bottomLeft.x;
        dataTA[offset + 8] = this.uv.bottomLeft.y;
        dataTA[offset + 9] = textureIndex;
        dataTA[offset + 10] = this.bottomRight.x;
        dataTA[offset + 11] = this.bottomRight.y;
        dataTA[offset + 12] = this.uv.bottomRight.x;
        dataTA[offset + 13] = this.uv.bottomRight.y;
        dataTA[offset + 14] = textureIndex;
        dataTA[offset + 15] = this.topRight.x;
        dataTA[offset + 16] = this.topRight.y;
        dataTA[offset + 17] = this.uv.topRight.x;
        dataTA[offset + 18] = this.uv.topRight.y;
        dataTA[offset + 19] = textureIndex;
    }
    batchNoTexture(dataTA, offset) {
        //  Transform.update:
        this._tx = this.x;
        this._ty = this.y;
        //  Update Vertices:
        const w = this._size.x;
        const h = this._size.y;
        const x0 = -(this._origin.x * w);
        const x1 = x0 + w;
        const y0 = -(this._origin.y * h);
        const y1 = y0 + h;
        const { _a, _b, _c, _d, _tx, _ty } = this;
        //  Cache the calculations to avoid 8 getX/Y function calls:
        const x0a = x0 * _a;
        const x0b = x0 * _b;
        const y0c = y0 * _c;
        const y0d = y0 * _d;
        const x1a = x1 * _a;
        const x1b = x1 * _b;
        const y1c = y1 * _c;
        const y1d = y1 * _d;
        this.topLeft.set(x0a + y0c + _tx, x0b + y0d + _ty);
        this.topRight.set(x1a + y0c + _tx, x1b + y0d + _ty);
        this.bottomLeft.set(x0a + y1c + _tx, x0b + y1d + _ty);
        this.bottomRight.set(x1a + y1c + _tx, x1b + y1d + _ty);
        //  Batch:
        dataTA[offset + 0] = this.topLeft.x;
        dataTA[offset + 1] = this.topLeft.y;
        dataTA[offset + 2] = this.uv.topLeft.x;
        dataTA[offset + 3] = this.uv.topLeft.y;
        dataTA[offset + 4] = this.bottomLeft.x;
        dataTA[offset + 5] = this.bottomLeft.y;
        dataTA[offset + 6] = this.uv.bottomLeft.x;
        dataTA[offset + 7] = this.uv.bottomLeft.y;
        dataTA[offset + 8] = this.bottomRight.x;
        dataTA[offset + 9] = this.bottomRight.y;
        dataTA[offset + 10] = this.uv.bottomRight.x;
        dataTA[offset + 11] = this.uv.bottomRight.y;
        dataTA[offset + 12] = this.topRight.x;
        dataTA[offset + 13] = this.topRight.y;
        dataTA[offset + 14] = this.uv.topRight.x;
        dataTA[offset + 15] = this.uv.topRight.y;
    }
    set x(value) {
        this._position.x = value;
    }
    get x() {
        return this._position.x;
    }
    set y(value) {
        this._position.y = value;
    }
    get y() {
        return this._position.y;
    }
}

//  Base Texture
class Texture {
    constructor(key, gl, glIndex = 0) {
        this.glIndex = 0;
        this.key = key;
        this.gl = gl;
        this.glIndex = glIndex;
    }
    onLoad() {
        // console.log(this.key, 'loaded');
        const gl = this.gl;
        this.glTexture = this.gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + this.glIndex);
        gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.width = this.image.width;
        this.height = this.image.height;
        //  POT only
        // gl.generateMipmap(gl.TEXTURE_2D);
        this.image.onload = null;
        if (this._onLoadCallback) {
            this._onLoadCallback(this);
        }
    }
    load(url, callback) {
        // console.log(this.key, 'loading');
        this.image = new Image();
        this.image.onload = () => this.onLoad();
        this.image.src = url;
        if (callback) {
            this._onLoadCallback = callback;
        }
        // Image is immediately-available / cached
        if (this.image.complete && this.image.width && this.image.height) {
            this.onLoad();
        }
    }
}

var SingleTexturedQuadShaderColor = {
    fragmentShader: `
precision mediump float;

varying vec2 vTextureCoord;

uniform sampler2D uTexture;

void main (void)
{
    gl_FragColor = texture2D(uTexture, vTextureCoord);
}`,
    vertexShader: `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uProjectionMatrix;

varying vec2 vTextureCoord;

void main (void)
{
    vTextureCoord = aTextureCoord;

    gl_Position = uProjectionMatrix * vec4(aVertexPosition, 0.0, 1.0);
}`
};

class Matrix4 {
    /**
     * Creates an instance of a Matrix4.
     *
     * Format: column-major, when typed out it looks like row-major.
     *
     * @param {number} [m00=1] - Component in column 0, row 0 position (index 0)
     * @param {number} [m01=0] - Component in column 0, row 1 position (index 1)
     * @param {number} [m02=0] - Component in column 0, row 2 position (index 2)
     * @param {number} [m03=0] - Component in column 0, row 3 position (index 3)
     * @param {number} [m10=0] - Component in column 1, row 0 position (index 4)
     * @param {number} [m11=1] - Component in column 1, row 1 position (index 5)
     * @param {number} [m12=0] - Component in column 1, row 2 position (index 6)
     * @param {number} [m13=0] - Component in column 1, row 3 position (index 7)
     * @param {number} [m20=0] - Component in column 2, row 0 position (index 8)
     * @param {number} [m21=0] - Component in column 2, row 1 position (index 9)
     * @param {number} [m22=1] - Component in column 2, row 2 position (index 10)
     * @param {number} [m23=0] - Component in column 2, row 3 position (index 11)
     * @param {number} [m30=0] - Component in column 3, row 0 position (index 12)
     * @param {number} [m31=0] - Component in column 3, row 1 position (index 13)
     * @param {number} [m32=0] - Component in column 3, row 2 position (index 14)
     * @param {number} [m33=1] - Component in column 3, row 3 position (index 15)
     * @memberof Matrix4
     */
    constructor(m00 = 1, m01 = 0, m02 = 0, m03 = 0, m10 = 0, m11 = 1, m12 = 0, m13 = 0, m20 = 0, m21 = 0, m22 = 1, m23 = 0, m30 = 0, m31 = 0, m32 = 0, m33 = 1) {
        this.set(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
    }
    /**
     * Sets the components of this Matrix4.
     *
     * If no parameters are given it resets this Matrix4 to an identity matrix.
     *
     * @param {number} [m00=1] - Component in column 0, row 0 position (index 0)
     * @param {number} [m01=0] - Component in column 0, row 1 position (index 1)
     * @param {number} [m02=0] - Component in column 0, row 2 position (index 2)
     * @param {number} [m03=0] - Component in column 0, row 3 position (index 3)
     * @param {number} [m10=0] - Component in column 1, row 0 position (index 4)
     * @param {number} [m11=1] - Component in column 1, row 1 position (index 5)
     * @param {number} [m12=0] - Component in column 1, row 2 position (index 6)
     * @param {number} [m13=0] - Component in column 1, row 3 position (index 7)
     * @param {number} [m20=0] - Component in column 2, row 0 position (index 8)
     * @param {number} [m21=0] - Component in column 2, row 1 position (index 9)
     * @param {number} [m22=1] - Component in column 2, row 2 position (index 10)
     * @param {number} [m23=0] - Component in column 2, row 3 position (index 11)
     * @param {number} [m30=0] - Component in column 3, row 0 position (index 12)
     * @param {number} [m31=0] - Component in column 3, row 1 position (index 13)
     * @param {number} [m32=0] - Component in column 3, row 2 position (index 14)
     * @param {number} [m33=1] - Component in column 3, row 3 position (index 15)
     * @returns {Matrix4}
     * @memberof Matrix4
     */
    set(m00 = 1, m01 = 0, m02 = 0, m03 = 0, m10 = 0, m11 = 1, m12 = 0, m13 = 0, m20 = 0, m21 = 0, m22 = 1, m23 = 0, m30 = 0, m31 = 0, m32 = 0, m33 = 1) {
        this.m00 = m00;
        this.m01 = m01;
        this.m02 = m02;
        this.m03 = m03;
        this.m10 = m10;
        this.m11 = m11;
        this.m12 = m12;
        this.m13 = m13;
        this.m20 = m20;
        this.m21 = m21;
        this.m22 = m22;
        this.m23 = m23;
        this.m30 = m30;
        this.m31 = m31;
        this.m32 = m32;
        this.m33 = m33;
        return this;
    }
    /**
     * Sets all components of this Matrix4 to zero.
     *
     * @returns {Matrix4}
     * @memberof Matrix4
     */
    zero() {
        return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
    /**
     * Resets this Matrix4 to an identity matrix.
     *
     * @returns {Matrix4}
     * @memberof Matrix4
     */
    identity() {
        return this.set();
    }
    /**
     * Returns a new array containg the Matrix4 component values in column-major format.
     *
     * @returns {number[]}
     * @memberof Matrix4
     */
    getArray() {
        return [this.m00, this.m01, this.m02, this.m03, this.m10, this.m11, this.m12, this.m13, this.m20, this.m21, this.m22, this.m23, this.m30, this.m31, this.m32, this.m33];
    }
    /**
     * Sets the values of this Matrix4 based on the given array, or array-like object, such as a Float32.
     *
     * The source must have 16 elements, starting from index 0 through to index 15.
     *
     * @param {number[]} src - The source array to copy the values from.
     * @returns {Matrix4}
     * @memberof Matrix4
     */
    fromArray(src) {
        return this.set(src[0], src[1], src[2], src[3], src[4], src[5], src[6], src[7], src[8], src[9], src[10], src[11], src[12], src[13], src[14], src[15]);
    }
    [Symbol.iterator]() {
        const data = this.getArray();
        return data[Symbol.iterator]();
    }
}
//# sourceMappingURL=Matrix4.js.map

function Ortho(left, right, bottom, top, near, far) {
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);
    const m00 = -2 * lr;
    const m11 = -2 * bt;
    const m22 = 2 * nf;
    const m30 = (left + right) * lr;
    const m31 = (top + bottom) * bt;
    const m32 = (far + near) * nf;
    return new Matrix4(m00, 0, 0, 0, 0, m11, 0, 0, 0, 0, m22, 0, m30, m31, m32, 1);
}
//# sourceMappingURL=Ortho.js.map

function part22 () {
    const resolution = { x: 800, y: 600 };
    const canvas = document.getElementById('game');
    canvas.width = resolution.x;
    canvas.height = resolution.y;
    const contextOptions = {
        alpha: false,
        antialias: true,
        premultipliedAlpha: false,
        stencil: false,
        preserveDrawingBuffer: false
    };
    const gl = canvas.getContext('webgl', contextOptions);
    //  Create the shaders
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, SingleTexturedQuadShaderColor.fragmentShader);
    gl.compileShader(fragmentShader);
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, SingleTexturedQuadShaderColor.vertexShader);
    gl.compileShader(vertexShader);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    const vertexPositionAttrib = gl.getAttribLocation(program, 'aVertexPosition');
    const vertexTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');
    const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
    const uTextureLocation = gl.getUniformLocation(program, 'uTexture');
    gl.enableVertexAttribArray(vertexPositionAttrib);
    gl.enableVertexAttribArray(vertexTextureCoord);
    //  The size in bytes per element in the dataArray
    const size = 4;
    const maxSpritesPerBatch = 9;
    //  Size in bytes of a single vertex
    /**
     * Each vertex contains:
     *
     *  position (x,y - 2 floats)
     *  texture coord (x,y - 2 floats)
     */
    const singleVertexSize = 16;
    //  Size of a single sprite in array elements
    const singleSpriteSize = 16;
    //  Size in bytes of a single sprite
    const singleSpriteByteSize = singleVertexSize * size;
    //  The offset amount between each sprite in the index array
    const singleSpriteElementOffset = 4;
    //  Size in bytes of a single vertex indicies
    const singleSpriteIndexCount = 6;
    //  The size of our ArrayBuffer
    const bufferByteSize = maxSpritesPerBatch * singleSpriteByteSize;
    //  Our ArrayBuffer + View
    const dataTA = new Float32Array(bufferByteSize);
    let ibo = [];
    //  Seed the index buffer
    let offset = 0;
    for (let i = 0; i < maxSpritesPerBatch; i++) {
        ibo.push(offset + 0, offset + 1, offset + 2, offset + 2, offset + 3, offset + 0);
        offset += singleSpriteElementOffset;
    }
    let elementIndexExtension = gl.getExtension('OES_element_index_uint');
    if (!elementIndexExtension) {
        throw new Error('OES_element_index_uint unsupported. Aborting');
    }
    const indexTA = new Uint32Array(ibo);
    //  Free willy
    ibo = [];
    //  Our buffers
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, dataTA, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexTA, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    //  This matrix will convert from pixels to clip space - it only needs to be set when the canvas is sized
    const projectionMatrix = Ortho(0, resolution.x, resolution.y, 0, -1000, 1000);
    const stride = singleVertexSize;
    //  Textures ...
    const textures = [];
    function loadTextures(urls) {
        let texturesLeft = urls.length;
        const onLoadCallback = () => {
            texturesLeft--;
            if (texturesLeft === 0) {
                create();
            }
        };
        urls.forEach((url) => {
            let texture = new Texture(url, gl, textures.length);
            // texture.load('../assets/bunnies/half/' + url, onLoadCallback);
            texture.load('../assets/' + url, onLoadCallback);
            textures.push(texture);
        });
    }
    loadTextures([
        'beball1.png'
    ]);
    const sprites = [];
    let stats;
    let paused = false;
    let movingSprite;
    let movingSpriteIndex;
    function create() {
        stats = new window['Stats']();
        stats.domElement.id = 'stats';
        document.body.append(stats.domElement);
        let toggle = document.getElementById('toggle');
        toggle.addEventListener('click', () => {
            paused = (paused) ? false : true;
        });
        //  Prepare textures
        for (let i = 0; i < textures.length; i++) {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, textures[i].glTexture);
        }
        for (let i = 0; i < maxSpritesPerBatch; i++) {
            let x = 128;
            let y = i * 64;
            let sprite = new SpriteMergedTransform(x, y, textures[0]);
            sprite.batchNoTexture(dataTA, i * singleSpriteSize);
            console.log('sprite', i, 'offset', i * singleSpriteSize);
            sprites.push(sprite);
        }
        //  We'll move this one
        movingSpriteIndex = 3;
        movingSprite = sprites[movingSpriteIndex];
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, dataTA, gl.STATIC_DRAW);
        render();
    }
    function render() {
        stats.begin();
        if (paused) {
            requestAnimationFrame(render);
            stats.end();
            return;
        }
        //  Move it
        movingSprite.x += 2;
        let offset = movingSpriteIndex * 16;
        movingSprite.batchNoTexture(dataTA, offset);
        //  Update JUST this one sprite in the buffer
        let view = dataTA.subarray(offset, offset + 16);
        gl.bufferSubData(gl.ARRAY_BUFFER, offset * size, view);
        if (movingSprite.x >= 800) {
            movingSprite.x = -32;
        }
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
        gl.uniform1i(uTextureLocation, 0);
        gl.vertexAttribPointer(vertexPositionAttrib, 2, gl.FLOAT, false, stride, 0); // size = 8
        gl.vertexAttribPointer(vertexTextureCoord, 2, gl.FLOAT, false, stride, 8); // size = 8
        gl.drawElements(gl.TRIANGLES, maxSpritesPerBatch * singleSpriteIndexCount, gl.UNSIGNED_INT, 0);
        requestAnimationFrame(render);
        stats.end();
    }
}

part22();
//  Next steps:
//  X Static buffer but use bufferSubData to update just a small part of it (i.e. a single moving quad in a static buffer)
//  * Multi Textures round-robin, don't use glIndex
//  * Texture Frames (UV) support
//  * Camera matrix, added to the shader (projection * camera * vertex pos), so we can move the camera around, rotate it, etc.
//  * Transform stack test (Quad with children, children of children, etc)
//  * Instead of a Quad class, try a class that can have any number of vertices in it (ala Rope), or any vertex moved
//  * Encode color as a single float, rather than a vec4
//  Done:
//  X Static test using sprites
//  X Bunny mark (because, why not?)
//  X Multi Textures assigned at run-time up to max
//  X Multi-texture support
//  X Sub-data buffer with batch flush, like current renderer handles it
//  X Add a basic display list, so the buffer is cleared each frame and populated via the list
//  X Try adding all quads to a single huge buffer on creation (remove on destruction), then in the render loop
//    copy chunks from this buffer to the gl buffer - depends how fast typed array copies are vs. pushing elements by index
//# sourceMappingURL=test035.js.map
