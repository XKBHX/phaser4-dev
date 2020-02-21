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

class BunnyMergedTransform {
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
        this.bounds = null;
        this._a = 1;
        this._b = 0;
        this._c = 0;
        this._d = 1;
        this._tx = 0;
        this._ty = 0;
        this.gravity = 0.75;
        this.speedX = Math.random() * 10;
        this.speedY = (Math.random() * 10) - 5;
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
        this.setOrigin(0.5, 1);
        // this.updateVertices();
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
        // this.dirty = true;
        // this.updateVertices();
        return this;
    }
    step(dataTA, offset) {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        if (this.x > this.bounds.right) {
            this.speedX *= -1;
            this.x = this.bounds.right;
        }
        else if (this.x < this.bounds.left) {
            this.speedX *= -1;
            this.x = this.bounds.left;
        }
        if (this.y > this.bounds.bottom) {
            this.speedY *= -0.85;
            this.y = this.bounds.bottom;
            if (Math.random() > 0.5) {
                this.speedY -= Math.random() * 6;
            }
        }
        else if (this.y < this.bounds.top) {
            this.speedY = 0;
            this.y = this.bounds.top;
        }
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
    stepNoTexture(dataTA, offset) {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        if (this.x > this.bounds.right) {
            this.speedX *= -1;
            this.x = this.bounds.right;
        }
        else if (this.x < this.bounds.left) {
            this.speedX *= -1;
            this.x = this.bounds.left;
        }
        if (this.y > this.bounds.bottom) {
            this.speedY *= -0.85;
            this.y = this.bounds.bottom;
            if (Math.random() > 0.5) {
                this.speedY -= Math.random() * 6;
            }
        }
        else if (this.y < this.bounds.top) {
            this.speedY = 0;
            this.y = this.bounds.top;
        }
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

var MultiTexturedQuadShader = {
    fragmentShader: `
precision mediump float;

varying vec2 vTextureCoord;
varying float vTextureId;

uniform sampler2D uTexture[%count%];

void main (void)
{
    vec4 color;

    %forloop%

    gl_FragColor = color;
}`,
    vertexShader: `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
attribute float aTextureId;

uniform mat4 uProjectionMatrix;

varying vec2 vTextureCoord;
varying float vTextureId;

void main (void)
{
    vTextureCoord = aTextureCoord;
    vTextureId = aTextureId;

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

//  Multi-Texture Assigned at run-time, not hard coded into render
const fragTemplate = [
    'precision mediump float;',
    'void main(void){',
    'float test = 0.1;',
    '%forloop%',
    'gl_FragColor = vec4(0.0);',
    '}',
].join('\n');
//  From Pixi v5:
function checkMaxIfStatementsInShader(maxIfs, gl) {
    const shader = gl.createShader(gl.FRAGMENT_SHADER);
    while (true) {
        const fragmentSrc = fragTemplate.replace(/%forloop%/gi, generateIfTestSrc(maxIfs));
        gl.shaderSource(shader, fragmentSrc);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            maxIfs = (maxIfs / 2) | 0;
        }
        else {
            // valid!
            break;
        }
    }
    return maxIfs;
}
function generateIfTestSrc(maxIfs) {
    let src = '';
    for (let i = 0; i < maxIfs; ++i) {
        if (i > 0) {
            src += '\nelse ';
        }
        if (i < maxIfs - 1) {
            src += `if(test == ${i}.0){}`;
        }
    }
    return src;
}
function generateSampleSrc(maxTextures) {
    let src = '';
    for (let i = 0; i < maxTextures; i++) {
        if (i > 0) {
            src += '\n    else ';
        }
        if (i < maxTextures - 1) {
            src += `if (vTextureId < ${i}.5)`;
        }
        src += '\n    {';
        src += `\n        color = texture2D(uTexture[${i}], vTextureCoord);`;
        src += '\n    }';
    }
    return src;
}
function bunnymarkNoColorMerged () {
    const resolution = { x: 800, y: 600 };
    const bounds = { left: 0, top: 0, right: resolution.x, bottom: resolution.y };
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
    //  Multi-texture support
    let maxTextures = checkMaxIfStatementsInShader(gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS), gl);
    console.log('maxTextures', maxTextures, 'out of', gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS));
    //  Create temp textures to stop WebGL errors on mac os
    for (let i = 0; i < maxTextures; i++) {
        let tempTexture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, tempTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
    }
    const uTextureLocationIndex = Array.from(Array(maxTextures).keys());
    let fragmentShaderSource = MultiTexturedQuadShader.fragmentShader;
    fragmentShaderSource = fragmentShaderSource.replace(/%count%/gi, `${maxTextures}`);
    fragmentShaderSource = fragmentShaderSource.replace(/%forloop%/gi, generateSampleSrc(maxTextures));
    // console.log(fragmentShaderSource);
    //  Create the shaders
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, MultiTexturedQuadShader.vertexShader);
    gl.compileShader(vertexShader);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    const vertexPositionAttrib = gl.getAttribLocation(program, 'aVertexPosition');
    const vertexTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');
    const vertexTextureIndex = gl.getAttribLocation(program, 'aTextureId');
    const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
    const uTextureLocation = gl.getUniformLocation(program, 'uTexture');
    gl.enableVertexAttribArray(vertexPositionAttrib);
    gl.enableVertexAttribArray(vertexTextureCoord);
    gl.enableVertexAttribArray(vertexTextureIndex);
    //  number of bunnies on the stage
    let count = 0;
    //  The maximum number of bunnies to render
    let maxCount = 200000;
    //  Number of bunnies to add each frame
    let amount = 200;
    //  Are we adding bunnies or not?
    let isAdding = false;
    //  Number of bunnies to start with
    let startBunnyCount = 1000;
    // const maxSpritesPerBatch = 2000;
    const maxSpritesPerBatch = 10000;
    //  The size in bytes per element in the dataArray
    const size = 4;
    //  Size in bytes of a single vertex
    /**
     * Each vertex contains:
     *
     *  position (x,y - 2 floats)
     *  texture coord (x,y - 2 floats)
     *  texture index (float)
     */
    const singleVertexSize = 20;
    //  Size of a single sprite in array elements
    //  Each vertex = 9 elements, so 9 * 4
    const singleSpriteSize = 20;
    //  Size in bytes of a single sprite
    const singleSpriteByteSize = singleVertexSize * size;
    //  Size in bytes of a single vertex indicies
    const singleIndexByteSize = 4;
    //  Size in bytes of a single vertex indicies
    const singleSpriteIndexSize = 6;
    //  The size of our ArrayBuffer
    const bufferByteSize = maxSpritesPerBatch * singleSpriteByteSize;
    //  Our ArrayBuffer + View
    const dataTA = new Float32Array(bufferByteSize);
    let ibo = [];
    //  Seed the index buffer
    for (let i = 0; i < (maxSpritesPerBatch * singleIndexByteSize); i += singleIndexByteSize) {
        ibo.push(i + 0, i + 1, i + 2, i + 2, i + 3, i + 0);
    }
    //  Our buffers
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, dataTA, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ibo), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    //  This matrix will convert from pixels to clip space - it only needs to be set when the canvas is sized
    const projectionMatrix = Ortho(0, resolution.x, resolution.y, 0, -1000, 1000);
    const stride = 20;
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
            texture.load('../assets/bunnies/' + url, onLoadCallback);
            textures.push(texture);
        });
    }
    loadTextures([
        'rabbitv3.png',
        'rabbitv3_ash.png',
        'rabbitv3_batman.png',
        'rabbitv3_bb8.png',
        'rabbitv3_frankenstein.png',
        'rabbitv3_neo.png',
        'rabbitv3_sonic.png',
        'rabbitv3_spidey.png',
        'rabbitv3_stormtrooper.png',
        'rabbitv3_superman.png',
        'rabbitv3_tron.png',
        'rabbitv3_wolverine.png'
    ]);
    const bunnies = [];
    function addBunnies(num) {
        for (let i = 0; i < num; i++) {
            let texture = textures[count % textures.length];
            let x = (count % 2) * 800;
            let bunny = new BunnyMergedTransform(x, 0, texture);
            bunny.bounds = bounds;
            bunnies.push(bunny);
            count++;
        }
    }
    let stats;
    let counter;
    let paused = false;
    window['bunnies'] = bunnies;
    console.log('max', maxSpritesPerBatch, 'size', bufferByteSize);
    function create() {
        {
            addBunnies(startBunnyCount);
        }
        let parent = document.getElementById('gameParent');
        stats = new window['Stats']();
        stats.domElement.id = 'stats';
        document.body.append(stats.domElement);
        counter = document.createElement('div');
        counter.innerText = count.toString();
        parent.append(counter);
        let toggle = document.getElementById('toggle');
        toggle.addEventListener('click', () => {
            paused = (paused) ? false : true;
        });
        let game = document.getElementById('game');
        game.addEventListener('mousedown', () => {
            isAdding = true;
        });
        game.addEventListener('mouseup', () => {
            isAdding = false;
        });
        //  Prepare textures
        for (let i = 0; i < textures.length; i++) {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, textures[i].glTexture);
        }
        render();
    }
    function flush(count) {
        const offset = count * singleSpriteByteSize;
        if (offset === bufferByteSize) {
            gl.bufferData(gl.ARRAY_BUFFER, dataTA, gl.DYNAMIC_DRAW);
        }
        else {
            let view = dataTA.subarray(0, offset);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, view);
        }
        gl.drawElements(gl.TRIANGLES, count * singleSpriteIndexSize, gl.UNSIGNED_SHORT, 0);
    }
    function render() {
        if (paused) {
            requestAnimationFrame(render);
            return;
        }
        stats.begin();
        if (isAdding && count < maxCount) {
            addBunnies(amount);
            counter.innerText = count.toString();
        }
        // const activeTextures = Array(maxTextures).fill(0);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
        gl.uniform1iv(uTextureLocation, uTextureLocationIndex);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        /**
         * Each vertex contains:
         *
         *  position (x,y - 2 floats)
         *  texture coord (x,y - 2 floats)
         *  texture index (float)
         *
         * 5 floats = 5 * 4 bytes = 20 bytes per vertex. This is our stride.
         *
         * The offset is how much data should be skipped at the start of each chunk.
         *
         * In our index, the color data is right after the position data.
         * Position is 2 floats, so the offset for the coord is 2 * 4 bytes = 8 bytes.
         * Texture Coord is 2 floats, so the offset for Texture Index is 2 * 4 bytes = 8 bytes, plus the 8 from position
         */
        gl.vertexAttribPointer(vertexPositionAttrib, 2, gl.FLOAT, false, stride, 0); // size = 8
        gl.vertexAttribPointer(vertexTextureCoord, 2, gl.FLOAT, false, stride, 8); // size = 8
        gl.vertexAttribPointer(vertexTextureIndex, 1, gl.FLOAT, false, stride, 8 + 8); // size = 4
        let size = 0;
        for (let i = 0; i < bunnies.length; i++) {
            let bunny = bunnies[i];
            //  The offset here is the offset into the array, NOT a byte size!
            bunny.step(dataTA, size * singleSpriteSize);
            //  if size = batch limit, flush here
            if (size === maxSpritesPerBatch) {
                flush(size);
                size = 0;
            }
            else {
                size++;
            }
        }
        if (size > 0) {
            flush(size);
        }
        requestAnimationFrame(render);
        stats.end();
    }
}

bunnymarkNoColorMerged();
// bunnymarkSingleTexture();
//  Next steps:
//  X Bunny mark (because, why not?)
//  * Multi Textures keep index 0 free for exceeding max
//  * Multi Textures round-robin, don't use glIndex
//  X Multi Textures assigned at run-time up to max
//  X Multi-texture support
//  * Texture Frames (UV) support
//  * Camera matrix, added to the shader (projection * camera * vertex pos), so we can move the camera around, rotate it, etc.
//  X Sub-data buffer with batch flush, like current renderer handles it
//  * Transform stack test (Quad with children, children of children, etc)
//  * Instead of a Quad class, try a class that can have any number of vertices in it (ala Rope), or any vertex moved
//  * Encode color as a single float, rather than a vec4
//  X Add a basic display list, so the buffer is cleared each frame and populated via the list
//  X Try adding all quads to a single huge buffer on creation (remove on destruction), then in the render loop
//    copy chunks from this buffer to the gl buffer - depends how fast typed array copies are vs. pushing elements by index
//# sourceMappingURL=test035.js.map
