function AddToDOM(element, parent) {
    let target;
    if (parent) {
        if (typeof parent === 'string') {
            //  Hopefully an element ID
            target = document.getElementById(parent);
        }
        else if (typeof parent === 'object' && parent.nodeType === 1) {
            //  Quick test for a HTMLElement
            target = parent;
        }
    }
    else if (element.parentElement) {
        return element;
    }
    //  Fallback, covers an invalid ID and a non HTMLElement object
    if (!target) {
        target = document.body;
    }
    target.appendChild(element);
    return element;
}
//# sourceMappingURL=AddToDOM.js.map

function isCordova() {
    return (window.hasOwnProperty('cordova'));
}
//# sourceMappingURL=isCordova.js.map

function DOMContentLoaded(callback) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        callback();
        return;
    }
    const check = () => {
        document.removeEventListener('deviceready', check, true);
        document.removeEventListener('DOMContentLoaded', check, true);
        window.removeEventListener('load', check, true);
        callback();
    };
    if (!document.body) {
        window.setTimeout(check, 20);
    }
    else if (isCordova()) {
        document.addEventListener('deviceready', check, true);
    }
    else {
        document.addEventListener('DOMContentLoaded', check, true);
        window.addEventListener('load', check, true);
    }
}
//# sourceMappingURL=DOMContentLoaded.js.map

//  From Pixi v5
const fragTemplate = [
    'precision mediump float;',
    'void main(void){',
    'float test = 0.1;',
    '%forloop%',
    'gl_FragColor = vec4(0.0);',
    '}',
].join('\n');
function generateSrc(maxIfs) {
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
function CheckShaderMaxIfStatements (maxIfs, gl) {
    const shader = gl.createShader(gl.FRAGMENT_SHADER);
    while (true) {
        const fragmentSrc = fragTemplate.replace(/%forloop%/gi, generateSrc(maxIfs));
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

const shaderSource = {
    fragmentShader: `
precision highp float;

varying vec2 vTextureCoord;
varying float vTextureId;
varying vec4 vTintColor;

uniform sampler2D uTexture[%count%];

void main (void)
{
    vec4 color;

    %forloop%

    gl_FragColor = color * vec4(vTintColor.bgr * vTintColor.a, vTintColor.a);
}`,
    vertexShader: `
precision highp float;

attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
attribute float aTextureId;
attribute vec4 aTintColor;

uniform mat4 uProjectionMatrix;
uniform mat4 uCameraMatrix;

varying vec2 vTextureCoord;
varying float vTextureId;
varying vec4 vTintColor;

void main (void)
{
    vTextureCoord = aTextureCoord;
    vTextureId = aTextureId;
    vTintColor = aTintColor;

    gl_Position = uProjectionMatrix * uCameraMatrix * vec4(aVertexPosition, 0.0, 1.0);
}`
};
class MultiTextureQuadShader {
    constructor(renderer, config = {}) {
        this.renderer = renderer;
        this.gl = renderer.gl;
        const { batchSize = 2000, dataSize = 4, indexSize = 4, vertexElementSize = 6, quadIndexSize = 6, fragmentShader = shaderSource.fragmentShader, vertexShader = shaderSource.vertexShader } = config;
        this.batchSize = batchSize;
        this.dataSize = dataSize;
        this.indexSize = indexSize;
        this.vertexElementSize = vertexElementSize;
        this.vertexByteSize = vertexElementSize * dataSize;
        this.quadByteSize = this.vertexByteSize * 4;
        this.quadElementSize = vertexElementSize * 4;
        this.quadIndexSize = quadIndexSize;
        this.bufferByteSize = batchSize * this.quadByteSize;
        this.createBuffers();
        this.createShaders(fragmentShader, vertexShader);
    }
    createBuffers() {
        let ibo = [];
        //  Seed the index buffer
        for (let i = 0; i < (this.batchSize * this.indexSize); i += this.indexSize) {
            ibo.push(i + 0, i + 1, i + 2, i + 2, i + 3, i + 0);
        }
        this.data = new ArrayBuffer(this.bufferByteSize);
        this.index = new Uint16Array(ibo);
        this.vertexViewF32 = new Float32Array(this.data);
        this.vertexViewU32 = new Uint32Array(this.data);
        const gl = this.gl;
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.data, gl.DYNAMIC_DRAW);
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.index, gl.STATIC_DRAW);
        //  Tidy-up
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        ibo = [];
    }
    createShaders(fragmentShaderSource, vertexShaderSource) {
        const gl = this.gl;
        const maxTextures = this.renderer.maxTextures;
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
        fragmentShaderSource = fragmentShaderSource.replace(/%count%/gi, `${maxTextures}`);
        fragmentShaderSource = fragmentShaderSource.replace(/%forloop%/gi, src);
        //  Create the shaders
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);
        this.program = program;
        const vertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
        const vertexTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');
        const vertexTextureIndex = gl.getAttribLocation(program, 'aTextureId');
        const vertexColor = gl.getAttribLocation(program, 'aTintColor');
        const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
        const uCameraMatrix = gl.getUniformLocation(program, 'uCameraMatrix');
        const uTextureLocation = gl.getUniformLocation(program, 'uTexture');
        gl.enableVertexAttribArray(vertexPosition);
        gl.enableVertexAttribArray(vertexTextureCoord);
        gl.enableVertexAttribArray(vertexTextureIndex);
        gl.enableVertexAttribArray(vertexColor);
        this.attribs = {
            position: vertexPosition,
            textureCoord: vertexTextureCoord,
            textureIndex: vertexTextureIndex,
            color: vertexColor
        };
        this.uniforms = {
            projectionMatrix: uProjectionMatrix,
            cameraMatrix: uCameraMatrix,
            textureLocation: uTextureLocation
        };
    }
    packColor(rgb, alpha) {
        let ua = ((alpha * 255) | 0) & 0xFF;
        return ((ua << 24) | rgb) >>> 0;
    }
    bind() {
        const gl = this.gl;
        const renderer = this.renderer;
        const stride = this.vertexByteSize;
        const uniforms = this.uniforms;
        const attribs = this.attribs;
        gl.useProgram(this.program);
        gl.uniformMatrix4fv(uniforms.projectionMatrix, false, renderer.projectionMatrix);
        gl.uniformMatrix4fv(uniforms.cameraMatrix, false, renderer.camera.matrix);
        gl.uniform1iv(uniforms.textureLocation, renderer.textureIndex);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(attribs.position, 2, gl.FLOAT, false, stride, 0); // size = 8
        gl.vertexAttribPointer(attribs.textureCoord, 2, gl.FLOAT, false, stride, 8); // size = 8
        gl.vertexAttribPointer(attribs.textureIndex, 1, gl.FLOAT, false, stride, 8 + 8); // size = 4
        gl.vertexAttribPointer(attribs.color, 4, gl.UNSIGNED_BYTE, true, stride, 8 + 8 + 4); // size = 4
        this.count = 0;
    }
    batchSprite(sprite) {
        if (this.count === this.batchSize) {
            this.flush();
        }
        let offset = this.count * this.quadElementSize;
        const F32 = this.vertexViewF32;
        const U32 = this.vertexViewU32;
        const frame = sprite.frame;
        const textureIndex = frame.texture.glIndex;
        const vertices = sprite.updateVertices();
        const topLeft = vertices[0];
        const topRight = vertices[1];
        const bottomLeft = vertices[2];
        const bottomRight = vertices[3];
        F32[offset++] = topLeft.x;
        F32[offset++] = topLeft.y;
        F32[offset++] = frame.u0;
        F32[offset++] = frame.v0;
        F32[offset++] = textureIndex;
        U32[offset++] = this.packColor(topLeft.color, topLeft.alpha);
        F32[offset++] = bottomLeft.x;
        F32[offset++] = bottomLeft.y;
        F32[offset++] = frame.u0;
        F32[offset++] = frame.v1;
        F32[offset++] = textureIndex;
        U32[offset++] = this.packColor(bottomLeft.color, bottomLeft.alpha);
        F32[offset++] = bottomRight.x;
        F32[offset++] = bottomRight.y;
        F32[offset++] = frame.u1;
        F32[offset++] = frame.v1;
        F32[offset++] = textureIndex;
        U32[offset++] = this.packColor(bottomRight.color, bottomRight.alpha);
        F32[offset++] = topRight.x;
        F32[offset++] = topRight.y;
        F32[offset++] = frame.u1;
        F32[offset++] = frame.v0;
        F32[offset++] = textureIndex;
        U32[offset++] = this.packColor(topRight.color, topRight.alpha);
        this.count++;
    }
    flush() {
        const count = this.count;
        if (count === 0) {
            return;
        }
        const gl = this.gl;
        const offset = count * this.quadByteSize;
        if (offset === this.bufferByteSize) {
            gl.bufferData(gl.ARRAY_BUFFER, this.data, gl.DYNAMIC_DRAW);
        }
        else {
            let view = this.vertexViewF32.subarray(0, offset);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, view);
        }
        gl.drawElements(gl.TRIANGLES, count * this.quadIndexSize, gl.UNSIGNED_SHORT, 0);
        this.count = 0;
    }
}

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

//  Rotates the target Matrix4 by the angle on its z axis, then returns the target Matrix4
function RotateZ(target, angle) {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const { m00, m01, m02, m03, m10, m11, m12, m13 } = target;
    target.m00 = m00 * c + m10 * s;
    target.m01 = m01 * c + m11 * s;
    target.m02 = m02 * c + m12 * s;
    target.m03 = m03 * c + m13 * s;
    target.m10 = m10 * c - m00 * s;
    target.m11 = m11 * c - m01 * s;
    target.m12 = m12 * c - m02 * s;
    target.m13 = m13 * c - m03 * s;
    return target;
}
//# sourceMappingURL=RotateZ.js.map

//  Scales the target Matrix4 by the x, y and z values, then returns the target Matrix4
function Scale(target, scaleX, scaleY, scaleZ) {
    target.m00 *= scaleX;
    target.m01 *= scaleX;
    target.m02 *= scaleX;
    target.m03 *= scaleX;
    target.m10 *= scaleY;
    target.m11 *= scaleY;
    target.m12 *= scaleY;
    target.m13 *= scaleY;
    target.m20 *= scaleZ;
    target.m21 *= scaleZ;
    target.m22 *= scaleZ;
    target.m23 *= scaleZ;
    return target;
}
//# sourceMappingURL=Scale.js.map

//  Translates the target Matrix4 by the x, y and z values, then returns the target Matrix4
function Translate(target, x = 0, y = 0, z = 0) {
    const { m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33 } = target;
    target.m30 = m00 * x + m10 * y + m20 * z + m30;
    target.m31 = m01 * x + m11 * y + m21 * z + m31;
    target.m32 = m02 * x + m12 * y + m22 * z + m32;
    target.m33 = m03 * x + m13 * y + m23 * z + m33;
    return target;
}
//# sourceMappingURL=Translate.js.map

class Camera {
    constructor(renderer, width, height) {
        if (!width) {
            width = renderer.width;
        }
        if (!height) {
            height = renderer.height;
        }
        this.renderer = renderer;
        this.matrix = new Matrix4();
        this.width = width;
        this.height = height;
    }
    set x(value) {
        this._x = value;
        Translate(this.matrix, value, this._y);
    }
    get x() {
        return this._x;
    }
    set y(value) {
        this._y = value;
        Translate(this.matrix, this._x, value);
    }
    get y() {
        return this._y;
    }
    set rotation(value) {
        this._rotation = value;
        RotateZ(this.matrix, value);
    }
    get rotation() {
        return this._rotation;
    }
    set scaleX(value) {
        this._scaleX = value;
        Scale(this.matrix, value, this._scaleY, 1);
    }
    get scaleX() {
        return this._scaleX;
    }
    set scaleY(value) {
        this._scaleY = value;
        Scale(this.matrix, this._scaleX, value, 1);
    }
    get scaleY() {
        return this._scaleY;
    }
}

class WebGLRenderer {
    constructor(width, height, resolution = 1) {
        this.contextOptions = {
            alpha: false,
            antialias: false,
            premultipliedAlpha: false,
            stencil: false,
            preserveDrawingBuffer: false
        };
        this.clearColor = [0, 0, 0, 1];
        this.maxTextures = 0;
        this.clearBeforeRender = true;
        this.autoResize = true;
        this.contextLost = false;
        this.width = width;
        this.height = height;
        this.resolution = resolution;
        const canvas = document.createElement('canvas');
        canvas.addEventListener('webglcontextlost', (event) => this.onContextLost(event), false);
        canvas.addEventListener('webglcontextrestored', () => this.onContextRestored(), false);
        this.canvas = canvas;
        this.initContext();
        this.shader = new MultiTextureQuadShader(this);
        this.camera = new Camera(this);
    }
    initContext() {
        const gl = this.canvas.getContext('webgl', this.contextOptions);
        this.gl = gl;
        this.getMaxTextures();
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        if (this.shader) {
            this.shader.gl = gl;
        }
        this.resize(this.width, this.height, this.resolution);
    }
    resize(width, height, resolution = 1) {
        this.width = width * resolution;
        this.height = height * resolution;
        this.resolution = resolution;
        const canvas = this.canvas;
        canvas.width = this.width;
        canvas.height = this.height;
        if (this.autoResize) {
            canvas.style.width = this.width / resolution + 'px';
            canvas.style.height = this.height / resolution + 'px';
        }
        this.gl.viewport(0, 0, this.width, this.height);
        this.projectionMatrix = this.ortho(width, height, -1000, 1000);
    }
    ortho(width, height, near, far) {
        const m00 = -2 * (1 / -width);
        const m11 = -2 * (1 / height);
        const m22 = 2 * (1 / (near - far));
        return new Float32Array([m00, 0, 0, 0, 0, m11, 0, 0, 0, 0, m22, 0, -1, 1, 0, 1]);
    }
    onContextLost(event) {
        event.preventDefault();
        this.contextLost = true;
    }
    onContextRestored() {
        this.contextLost = false;
        this.initContext();
    }
    setBackgroundColor(color) {
        const clearColor = this.clearColor;
        const r = color >> 16 & 0xFF;
        const g = color >> 8 & 0xFF;
        const b = color & 0xFF;
        const a = (color > 16777215) ? color >>> 24 : 255;
        clearColor[0] = r / 255;
        clearColor[1] = g / 255;
        clearColor[2] = b / 255;
        clearColor[3] = a / 255;
        return this;
    }
    getMaxTextures() {
        const gl = this.gl;
        let maxTextures = CheckShaderMaxIfStatements(gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS), gl);
        //  Create temp textures to stop WebGL errors on mac os
        for (let i = 0; i < maxTextures; i++) {
            let tempTexture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, tempTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
        }
        this.maxTextures = maxTextures;
        this.textureIndex = Array.from(Array(maxTextures).keys());
        this.activeTextures = Array(maxTextures);
        this.currentActiveTexture = 0;
        this.startActiveTexture = 0;
    }
    isSizePowerOfTwo(width, height) {
        return (width > 0 && (width & (width - 1)) === 0 && height > 0 && (height & (height - 1)) === 0);
    }
    createGLTexture(source) {
        const gl = this.gl;
        const glTexture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glTexture);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        const pot = this.isSizePowerOfTwo(source.width, source.height);
        const wrap = (pot) ? gl.REPEAT : gl.CLAMP_TO_EDGE;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
        if (pot) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
        return glTexture;
    }
    render(world) {
        if (this.contextLost) {
            return;
        }
        this.currentActiveTexture = 0;
        this.startActiveTexture++;
        const shader = this.shader;
        //  CLS
        const gl = this.gl;
        const cls = this.clearColor;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.viewport(0, 0, this.width, this.height);
        if (this.clearBeforeRender) {
            gl.clearColor(cls[0], cls[1], cls[2], cls[3]);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
        shader.bind();
        this.renderChildren(world);
        shader.flush();
    }
    renderChildren(container) {
        const gl = this.gl;
        const shader = this.shader;
        const maxTextures = this.maxTextures;
        const activeTextures = this.activeTextures;
        const startActiveTexture = this.startActiveTexture;
        let currentActiveTexture = this.currentActiveTexture;
        const children = container.children;
        for (let i = 0; i < children.length; i++) {
            let entity = children[i];
            if (entity.willRender()) {
                //  Entity has a texture ...
                if (entity.texture) {
                    let texture = entity.texture;
                    if (texture.glIndexCounter < startActiveTexture) {
                        texture.glIndexCounter = startActiveTexture;
                        if (currentActiveTexture < maxTextures) {
                            //  Make this texture active
                            activeTextures[currentActiveTexture] = texture;
                            texture.glIndex = currentActiveTexture;
                            gl.activeTexture(gl.TEXTURE0 + currentActiveTexture);
                            gl.bindTexture(gl.TEXTURE_2D, texture.glTexture);
                            currentActiveTexture++;
                            this.currentActiveTexture = currentActiveTexture;
                        }
                    }
                    shader.batchSprite(entity);
                }
                //  Render the children, if it has any
                if (entity.size) {
                    this.renderChildren(entity);
                }
            }
        }
    }
}

class File {
    constructor(type, key, url, loadHandler, config) {
        this.hasLoaded = false;
        this.type = type;
        this.key = key;
        this.url = url;
        this.loadHandler = loadHandler;
        this.config = config;
    }
}

class Loader {
    constructor(game) {
        this.baseURL = '';
        this.path = '';
        this.crossOrigin = undefined;
        this.maxParallelDownloads = 32;
        this.isLoading = false;
        this.game = game;
        this.reset();
    }
    reset() {
        this.isLoading = false;
        this.queue = [];
        this.inflight = new Map();
    }
    start(onComplete) {
        if (this.isLoading) {
            return;
        }
        // console.log('Loader.start', this.totalFilesToLoad());
        if (this.queue.length > 0) {
            this.isLoading = true;
            this.onComplete = onComplete;
            this.nextFile();
        }
        else {
            onComplete();
        }
    }
    nextFile() {
        // let total: number = this.inflight.size;
        let total = this.queue.length;
        if (total) {
            //  One at a time ...
            let file = this.queue.shift();
            this.inflight.set(file.url, file);
            // console.log('Loader.nextFile', file.key, file.url);
            file.loadHandler(file);
        }
        else if (this.inflight.size === 0) {
            this.stop();
        }
    }
    stop() {
        this.isLoading = false;
        this.onComplete();
    }
    fileComplete(file) {
        this.inflight.delete(file.url);
        this.nextFile();
    }
    fileError(file) {
        this.inflight.delete(file.url);
        this.nextFile();
    }
    totalFilesToLoad() {
        return this.queue.length + this.inflight.size;
    }
    image(key, url) {
        let file = new File('image', key, this.getURL(key, url, '.png'), (file) => this.imageTagLoader(file));
        this.queue.push(file);
        return this;
    }
    spritesheet(key, url, frameConfig) {
        let file = new File('spritesheet', key, this.getURL(key, url, '.png'), (file) => this.imageTagLoader(file));
        file.config = frameConfig;
        this.queue.push(file);
        return this;
    }
    imageTagLoader(file) {
        // console.log('Loader.imageTagLoader', file.key);
        // console.log(this);
        file.data = new Image();
        if (this.crossOrigin) {
            file.data.crossOrigin = this.crossOrigin;
        }
        file.data.onload = () => {
            // console.log('File.data.onload', file.key);
            file.data.onload = null;
            file.data.onerror = null;
            file.hasLoaded = true;
            if (file.type === 'image') {
                this.game.textures.addImage(file.key, file.data);
            }
            else if (file.type === 'spritesheet') {
                this.game.textures.addSpriteSheet(file.key, file.data, file.config);
            }
            this.fileComplete(file);
        };
        file.data.onerror = () => {
            // console.log('File.data.onerror', file.key);
            file.data.onload = null;
            file.data.onerror = null;
            file.hasLoaded = true;
            this.fileError(file);
        };
        file.data.src = file.url;
        //  Image is cached / available immediately
        if (file.data.complete && file.data.width && file.data.height) {
            file.data.onload = null;
            file.data.onerror = null;
            file.hasLoaded = true;
            if (file.type === 'image') {
                this.game.textures.addImage(file.key, file.data);
            }
            else if (file.type === 'spritesheet') {
                this.game.textures.addSpriteSheet(file.key, file.data, file.config);
            }
            this.fileComplete(file);
        }
    }
    getURL(key, url, extension) {
        if (!url) {
            url = key + extension;
        }
        return this.baseURL + this.path + url;
    }
    setBaseURL(url) {
        if (url !== '' && url.substr(-1) !== '/') {
            url = url.concat('/');
        }
        this.baseURL = url;
        return this;
    }
    setPath(path) {
        if (path !== '' && path.substr(-1) !== '/') {
            path = path.concat('/');
        }
        this.path = path;
        return this;
    }
    setCORS(crossOrigin) {
        this.crossOrigin = crossOrigin;
        return this;
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
//# sourceMappingURL=Vec2.js.map

class DisplayObject {
    constructor() {
        this.texture = null;
        this.frame = null;
        this.visible = true;
        this.renderable = true;
        this._position = new Vec2();
        this._scale = new Vec2(1, 1);
        this._skew = new Vec2();
        this._origin = new Vec2(0.5, 0.5);
        this._rotation = 0;
        this._alpha = 1;
        this.localTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
        this.worldTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
    }
    updateTransform() {
        const parent = this.parent;
        const lt = this.localTransform;
        const wt = this.worldTransform;
        lt.tx = this.x;
        lt.ty = this.y;
        if (!parent) {
            wt.a = lt.a;
            wt.b = lt.b;
            wt.c = lt.c;
            wt.d = lt.d;
            wt.tx = lt.tx;
            wt.ty = lt.ty;
            return;
        }
        const pt = parent.worldTransform;
        let { a, b, c, d, tx, ty } = lt;
        wt.a = a * pt.a + b * pt.c;
        wt.b = a * pt.b + b * pt.d;
        wt.c = c * pt.a + d * pt.c;
        wt.d = c * pt.b + d * pt.d;
        wt.tx = tx * pt.a + ty * pt.c + pt.tx;
        wt.ty = tx * pt.b + ty * pt.d + pt.ty;
        /*
        a = wt.a;
        b = wt.b;
        c = wt.c;
        d = wt.d;

        const determ = (a * d) - (b * c);

        if (a || b)
        {
            const r = Math.sqrt((a * a) + (b * b));

            // this.worldRotation = (b > 0) ? Math.acos(a / r) : -Math.acos(a / r);
            // this.worldScale.x = r;
            // this.worldScale.y = determ / r;
        }
        else if (c || d)
        {
            var s = Math.sqrt((c * c) + (d * d));

            // this.worldRotation = Phaser.Math.HALF_PI - ((d > 0) ? Math.acos(-c / s) : -Math.acos(c / s));
            // this.worldScale.x = determ / s;
            // this.worldScale.y = s;
        }
        else
        {
            // this.worldScale.x = 0;
            // this.worldScale.y = 0;
        }

        //  Set the World values
        // this.worldAlpha = this.alpha * p.worldAlpha;
        // this.worldPosition.x = wt.tx;
        // this.worldPosition.y = wt.ty;

        // reset the bounds each time this is called!
        // this._currentBounds = null;
        */
        return this;
    }
    willRender() {
        return (this.visible && this.renderable && this._alpha > 0);
    }
    setAlpha(alpha = 1) {
        this._alpha = alpha;
        return this;
    }
    setSize(width, height) {
        this.width = width;
        this.height = height;
        return this;
    }
    setPosition(x, y) {
        this._position.set(x, y);
        return this.updateTransform();
    }
    setScale(scaleX, scaleY = scaleX) {
        this._scale.set(scaleX, scaleY);
        return this.updateCache();
    }
    setSkew(skewX, skewY) {
        this._skew.set(skewX, skewY);
        return this.updateCache();
    }
    setOrigin(originX, originY = originX) {
        this._origin.set(originX, originY);
        return this;
    }
    setRotation(rotation) {
        this._rotation = rotation;
        return this.updateCache();
    }
    updateCache() {
        const transform = this.localTransform;
        const { _rotation, _skew, _scale } = this;
        transform.a = Math.cos(_rotation + _skew.y) * _scale.x;
        transform.b = Math.sin(_rotation + _skew.y) * _scale.x;
        transform.c = -Math.sin(_rotation - _skew.x) * _scale.y;
        transform.d = Math.cos(_rotation - _skew.x) * _scale.y;
        return this.updateTransform();
    }
    set x(value) {
        this._position.x = value;
        this.updateTransform();
    }
    get x() {
        return this._position.x;
    }
    set y(value) {
        this._position.y = value;
        this.updateTransform();
    }
    get y() {
        return this._position.y;
    }
    set rotation(value) {
        this._rotation = value;
        this.updateCache();
    }
    get rotation() {
        return this._rotation;
    }
    set scaleX(value) {
        this._scale.x = value;
        this.updateCache();
    }
    get scaleX() {
        return this._scale.x;
    }
    set scaleY(value) {
        this._scale.y = value;
        this.updateCache();
    }
    get scaleY() {
        return this._scale.y;
    }
    set skewX(value) {
        this._skew.x = value;
        this.updateCache();
    }
    get skewX() {
        return this._skew.x;
    }
    set skewY(value) {
        this._skew.y = value;
        this.updateCache();
    }
    get skewY() {
        return this._skew.y;
    }
    get alpha() {
        return this._alpha;
    }
    set alpha(value) {
        this._alpha = value;
    }
}

class DisplayObjectContainer extends DisplayObject {
    constructor() {
        super();
        this.children = [];
    }
    addChild(...child) {
        child.forEach((entity) => {
            this.addChildAt(entity, this.children.length);
        });
        return this;
    }
    addChildAt(child, index) {
        if (index >= 0 && index <= this.children.length) {
            if (child.parent) {
                child.parent.removeChild(child);
            }
            child.parent = this;
            this.children.splice(index, 0, child);
        }
        return child;
    }
    swapChildren(child1, child2) {
        if (child1 !== child2) {
            return;
        }
        let index1 = this.getChildIndex(child1);
        let index2 = this.getChildIndex(child2);
        if (index1 < 0 || index2 < 0) {
            throw new Error('swap: Both children must belong to the same parent');
        }
        this.children[index1] = child2;
        this.children[index2] = child1;
    }
    getChildIndex(child) {
        const index = this.children.indexOf(child);
        if (index === -1) {
            throw new Error('Supplied DisplayObject not child of the caller');
        }
        return index;
    }
    setChildIndex(child, index) {
        const children = this.children;
        if (index < 0 || index >= children.length) {
            throw new Error('Index ' + index + ' out of bounds');
        }
        const currentIndex = this.getChildIndex(child);
        children.splice(currentIndex, 1);
        children.splice(index, 0, child);
    }
    getChildAt(index) {
        if (index < 0 || index >= this.size) {
            throw new Error('Index ' + index + ' out of bounds');
        }
        return this.children[index];
    }
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index === -1) {
            return;
        }
        return this.removeChildAt(index);
    }
    removeChildAt(index) {
        const child = this.getChildAt(index);
        if (child) {
            child.parent = undefined;
            this.children.splice(index, 1);
        }
        return child;
    }
    removeChildren(beginIndex = 0, endIndex) {
        const children = this.children;
        if (endIndex === undefined) {
            endIndex = children.length;
        }
        const range = endIndex - beginIndex;
        if (range > 0 && range <= endIndex) {
            const removed = children.splice(beginIndex, range);
            removed.forEach((child) => {
                child.parent = undefined;
            });
            return removed;
        }
        else if (range === 0 && children.length === 0) {
            return [];
        }
        else {
            throw new Error('Range Error. Values out of bounds');
        }
    }
    update() {
        const children = this.children;
        for (let i = 0; i < children.length; i++) {
            children[i].update();
        }
    }
    updateTransform() {
        super.updateTransform();
        const children = this.children;
        for (let i = 0; i < children.length; i++) {
            children[i].updateTransform();
        }
        return this;
    }
    get size() {
        return this.children.length;
    }
}

class Scene {
    constructor(game) {
        this.game = game;
        this.load = game.loader;
        this.textures = game.textures;
        this.world = new DisplayObjectContainer();
    }
    init() {
    }
    preload() {
    }
    create() {
    }
    update(time) {
    }
}

class Frame {
    constructor(texture, key, x, y, width, height) {
        this.texture = texture;
        this.key = key;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.updateUVs();
    }
    updateUVs() {
        const { x, y, width, height } = this;
        const sourceWidth = this.texture.width;
        const sourceHeight = this.texture.height;
        this.u0 = x / sourceWidth;
        this.v0 = y / sourceHeight;
        this.u1 = (x + width) / sourceWidth;
        this.v1 = (y + height) / sourceHeight;
    }
}

//  Base Texture
class Texture {
    constructor(key, image) {
        this.glIndex = 0;
        this.glIndexCounter = -1;
        this.key = key;
        this.image = image;
        this.frames = new Map();
        this.width = this.image.width;
        this.height = this.image.height;
        this.add('__BASE', 0, 0, this.width, this.height);
    }
    add(key, x, y, width, height) {
        if (this.frames.has(key)) {
            return null;
        }
        let frame = new Frame(this, key, x, y, width, height);
        this.frames.set(key, frame);
        if (!this.firstFrame || this.firstFrame.key === '__BASE') {
            this.firstFrame = frame;
        }
        return frame;
    }
    get(key) {
        //  null, undefined, empty string, zero
        if (!key) {
            return this.firstFrame;
        }
        let frame = this.frames.get(key);
        if (!frame) {
            console.warn('Texture.frame missing: ' + key);
            frame = this.firstFrame;
        }
        return frame;
    }
}

function SpriteSheetParser (texture, x, y, width, height, frameConfig) {
    let { frameWidth = null, frameHeight = null, startFrame = 0, endFrame = -1, margin = 0, spacing = 0 } = frameConfig;
    if (!frameHeight) {
        frameHeight = frameWidth;
    }
    //  If missing we can't proceed
    if (frameWidth === null) {
        throw new Error('TextureManager.SpriteSheet: Invalid frameWidth given.');
    }
    const row = Math.floor((width - margin + spacing) / (frameWidth + spacing));
    const column = Math.floor((height - margin + spacing) / (frameHeight + spacing));
    let total = row * column;
    if (total === 0) {
        console.warn('SpriteSheet frame dimensions will result in zero frames.');
    }
    if (startFrame > total || startFrame < -total) {
        startFrame = 0;
    }
    if (startFrame < 0) {
        //  Allow negative skipframes.
        startFrame = total + startFrame;
    }
    if (endFrame !== -1) {
        total = startFrame + (endFrame + 1);
    }
    let fx = margin;
    let fy = margin;
    let ax = 0;
    let ay = 0;
    for (let i = 0; i < total; i++) {
        ax = 0;
        ay = 0;
        let w = fx + frameWidth;
        let h = fy + frameHeight;
        if (w > width) {
            ax = w - width;
        }
        if (h > height) {
            ay = h - height;
        }
        texture.add(i, x + fx, y + fy, frameWidth - ax, frameHeight - ay);
        fx += frameWidth + spacing;
        if (fx + frameWidth > width) {
            fx = margin;
            fy += frameHeight + spacing;
        }
    }
}

class TextureManager {
    constructor(game) {
        this.game = game;
        this.textures = new Map();
    }
    get(key) {
        if (this.textures.has(key)) {
            return this.textures.get(key);
        }
        else {
            return this.textures.get('__MISSING');
        }
    }
    addImage(key, source) {
        let texture = null;
        if (!this.textures.has(key)) {
            texture = new Texture(key, source);
            texture.glTexture = this.game.renderer.createGLTexture(texture.image);
            this.textures.set(key, texture);
        }
        return texture;
    }
    addSpriteSheet(key, source, frameConfig) {
        let texture = null;
        if (!this.textures.has(key)) {
            texture = new Texture(key, source);
            texture.glTexture = this.game.renderer.createGLTexture(texture.image);
            SpriteSheetParser(texture, 0, 0, texture.width, texture.height, frameConfig);
            this.textures.set(key, texture);
        }
        return texture;
    }
}

class Game {
    constructor(config) {
        this.VERSION = '4.0.0-beta1';
        this.isPaused = false;
        this.isBooted = false;
        const { width = 800, height = 600, backgroundColor = 0x00000, parent = document.body, scene = new Scene(this) } = config;
        this.scene = scene;
        DOMContentLoaded(() => this.boot(width, height, backgroundColor, parent));
    }
    boot(width, height, backgroundColor, parent) {
        this.isBooted = true;
        this.textures = new TextureManager(this);
        this.loader = new Loader(this);
        const renderer = new WebGLRenderer(width, height);
        renderer.setBackgroundColor(backgroundColor);
        AddToDOM(renderer.canvas, parent);
        this.renderer = renderer;
        this.banner(this.VERSION);
        const scene = this.scene;
        if (scene instanceof Scene) {
            this.scene = this.createSceneFromInstance(scene);
        }
        else if (typeof scene === 'object') {
            this.scene = this.createSceneFromObject(scene);
        }
        else if (typeof scene === 'function') {
            this.scene = this.createSceneFromFunction(scene);
        }
        this.scene.init();
        this.scene.preload();
        if (this.loader.totalFilesToLoad() > 0) {
            this.loader.start(() => this.start());
        }
        else {
            this.start();
        }
    }
    createSceneFromInstance(newScene) {
        newScene.game = this;
        newScene.load = this.loader;
        return newScene;
    }
    createSceneFromObject(scene) {
        let newScene = new Scene(this);
        //  Extract callbacks
        const defaults = ['init', 'preload', 'create', 'update', 'render'];
        defaults.forEach((method) => {
            if (scene.hasOwnProperty(method)) {
                newScene[method] = scene[method];
            }
        });
        return newScene;
    }
    createSceneFromFunction(scene) {
        var newScene = new scene(this);
        if (newScene instanceof Scene) {
            return this.createSceneFromInstance(newScene);
        }
        else {
            return newScene;
        }
    }
    start() {
        this.scene.create();
        requestAnimationFrame((time) => this.step(time));
    }
    banner(version) {
        console.log('%cPhaser Nano v' + version + '%c https://phaser4.io', 'padding: 2px 20px; color: #fff; background: linear-gradient(to right, #00bcc3, #3e0081 10%, #3e0081 90%, #3e0081 10%, #00bcc3)', '');
    }
    step(time) {
        if (this.isPaused) {
            requestAnimationFrame((time) => this.step(time));
            return;
        }
        this.scene.world.update();
        this.scene.update(time);
        this.renderer.render(this.scene.world);
        requestAnimationFrame((time) => this.step(time));
    }
}

//  Base Texture
class Texture$1 {
    constructor(key, image) {
        this.glIndex = 0;
        this.glIndexCounter = -1;
        this.key = key;
        this.image = image;
        this.frames = new Map();
        this.width = this.image.width;
        this.height = this.image.height;
        this.add('__BASE', 0, 0, this.width, this.height);
    }
    add(key, x, y, width, height) {
        if (this.frames.has(key)) {
            return null;
        }
        let frame = new Frame(this, key, x, y, width, height);
        this.frames.set(key, frame);
        if (!this.firstFrame || this.firstFrame.key === '__BASE') {
            this.firstFrame = frame;
        }
        return frame;
    }
    get(key) {
        //  null, undefined, empty string, zero
        if (!key) {
            return this.firstFrame;
        }
        let frame = this.frames.get(key);
        if (!frame) {
            console.warn('Texture.frame missing: ' + key);
            frame = this.firstFrame;
        }
        return frame;
    }
}

class Vertex {
    constructor(x = 0, y = 0, color = 16777215, alpha = 1) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.alpha = alpha;
    }
}

class Sprite extends DisplayObjectContainer {
    constructor(scene, x, y, texture, frame) {
        super();
        // texture: Texture = null;
        // frame: Frame = null;
        this.vertices = [new Vertex(), new Vertex(), new Vertex(), new Vertex()];
        // private _alpha: number = 1;
        this._tint = 0xffffff;
        this.scene = scene;
        this.setTexture(texture, frame);
        this.setPosition(x, y);
    }
    setTexture(key, frame) {
        if (key instanceof Texture$1) {
            this.texture = key;
        }
        else {
            this.texture = this.scene.textures.get(key);
        }
        return this.setFrame(frame);
    }
    setFrame(key) {
        const frame = this.texture.get(key);
        this.frame = frame;
        return this.setSize(frame.width, frame.height);
    }
    setAlpha(topLeft = 1, topRight = topLeft, bottomLeft = topLeft, bottomRight = topLeft) {
        const vertices = this.vertices;
        vertices[0].alpha = topLeft;
        vertices[1].alpha = topRight;
        vertices[2].alpha = bottomLeft;
        vertices[3].alpha = bottomRight;
        return this;
    }
    setTint(topLeft = 0xffffff, topRight = topLeft, bottomLeft = topLeft, bottomRight = topLeft) {
        const vertices = this.vertices;
        vertices[0].color = topLeft;
        vertices[1].color = topRight;
        vertices[2].color = bottomLeft;
        vertices[3].color = bottomRight;
        return this;
    }
    updateVertices() {
        //  Update Vertices:
        const w = this.width;
        const h = this.height;
        const x0 = -(this._origin.x * w);
        const x1 = x0 + w;
        const y0 = -(this._origin.y * h);
        const y1 = y0 + h;
        const { a, b, c, d, tx, ty } = this.worldTransform;
        //  Cache the calculations to avoid 8 getX/Y function calls:
        const x0a = x0 * a;
        const x0b = x0 * b;
        const y0c = y0 * c;
        const y0d = y0 * d;
        const x1a = x1 * a;
        const x1b = x1 * b;
        const y1c = y1 * c;
        const y1d = y1 * d;
        const vertices = this.vertices;
        //  top left
        vertices[0].x = x0a + y0c + tx;
        vertices[0].y = x0b + y0d + ty;
        //  top right
        vertices[1].x = x1a + y0c + tx;
        vertices[1].y = x1b + y0d + ty;
        //  bottom left
        vertices[2].x = x0a + y1c + tx;
        vertices[2].y = x0b + y1d + ty;
        //  bottom right
        vertices[3].x = x1a + y1c + tx;
        vertices[3].y = x1b + y1d + ty;
        return vertices;
    }
    set alpha(value) {
        this._alpha = value;
        this.setAlpha(value);
    }
    get tint() {
        return this._tint;
    }
    set tint(value) {
        this._tint = value;
        this.setTint(value);
    }
}

class Box extends Sprite {
    constructor(scene, x, y, texture, frame, direction = 0, size = 512) {
        super(scene, x, y, texture, frame);
        //  0 = left to right
        //  1 = top to bottom
        //  2 = right to left
        //  3 = bottom to top
        this.direction = 0;
        this.speed = 2;
        this.direction = direction;
        if (direction === 0) {
            //  Box is in the top-left
            this.startX = x;
            this.startY = y;
            this.endX = x + size;
            this.endY = y + size;
        }
        else if (direction === 1) {
            //  Box is in the top-right
            this.startX = x - size;
            this.startY = y;
            this.endX = x;
            this.endY = y + size;
        }
        else if (direction === 2) {
            //  Box is in the bottom-right
            this.startX = x - size;
            this.startY = y - size;
            this.endX = x;
            this.endY = y;
        }
        else if (direction === 3) {
            //  Box is in the bottom-left
            this.startX = x;
            this.startY = y - size;
            this.endX = x + size;
            this.endY = y;
        }
    }
    update() {
        switch (this.direction) {
            case 0:
                {
                    this.x += this.speed;
                    if (this.x >= this.endX) {
                        this.x = this.endX;
                        this.direction = 1;
                    }
                }
                break;
            case 1:
                {
                    this.y += this.speed;
                    if (this.y >= this.endY) {
                        this.y = this.endY;
                        this.direction = 2;
                    }
                }
                break;
            case 2:
                {
                    this.x -= this.speed;
                    if (this.x <= this.startX) {
                        this.x = this.startX;
                        this.direction = 3;
                    }
                }
                break;
            case 3:
                {
                    this.y -= this.speed;
                    if (this.y <= this.startY) {
                        this.y = this.startY;
                        this.direction = 0;
                    }
                }
                break;
        }
    }
}
class Demo extends Scene {
    constructor(game) {
        super(game);
    }
    preload() {
        this.load.image('512', '../assets/checker.png');
        this.load.image('128', '../assets/lance-overdose-loader-eye.png');
        this.load.image('logo', '../assets/logo.png');
        this.load.image('brain', '../assets/brain.png');
    }
    create() {
        this.container = new Sprite(this, 400, 300, '512');
        const child1 = new Box(this, -256, -256, 'brain', null, 0);
        const child2 = new Box(this, 256, -256, 'brain', null, 1);
        const child3 = new Box(this, 256, 256, 'brain', null, 2);
        const child4 = new Box(this, -256, 256, 'brain', null, 3);
        //  Logo stack
        const child5 = new Sprite(this, 0, 0, 'logo').setScale(0.7);
        const child6 = new Sprite(this, 0, 0, 'logo').setScale(0.8);
        const child7 = new Sprite(this, 0, 0, 'logo').setScale(0.9);
        const child8 = new Sprite(this, 0, 0, 'logo').setScale(1.0);
        this.container.addChild(child1, child2, child3, child4, child5, child6, child7, child8);
        this.world.addChild(this.container);
    }
    update() {
        this.container.rotation += 0.005;
        this.container.getChildAt(4).rotation += 0.037;
        this.container.getChildAt(5).rotation += 0.038;
        this.container.getChildAt(6).rotation += 0.039;
        this.container.getChildAt(7).rotation += 0.040;
    }
}
function demo6 () {
    let game = new Game({
        width: 800,
        height: 600,
        backgroundColor: 0x000066,
        parent: 'gameParent',
        scene: Demo
    });
    document.getElementById('toggle').addEventListener('click', () => {
        game.isPaused = (game.isPaused) ? false : true;
    });
}

// import demo1 from './demo1'; // test single sprite
// import demo7 from './demo7'; // Camera class (position, scale, rotation)
// import demo8 from './demo8'; // Event Emitter
demo6();
// demo8();
//  Next steps:
//  * Camera alpha
//  * Camera background color
//  * Camera stencil?
//  * Camera bounds / cull
//  * Camera ignore | ignore except
//  * Camera scroll factor (?)
//  * Cache world values?
//  * Texture Atlas Loader
//  * Multi Texture re-use old texture IDs when count > max supported
//  * Single Texture shader
//  * Static Batch shader (Static Container?)
//  * Tile Layer
//  * Input point translation
//  * Instead of a Quad class, try a class that can have any number of vertices in it (ala Rope), or any vertex moved
//  Done:
//  X Don't defer updateTransform - do immediately
//  X Context lost handler
//  X Renderer resize handler
//  X Renderer resolution
//  X Camera class (position, scale, rotation, alpha)
//  X Container class - Transform stack test (Sprite with children, children of children, etc)
//  X Encode color as a single float, rather than a vec4 and add back to the shader
//  X Moved all code to WebGL Renderer and supporting classes
//  X Game class, single Scene, Loader, DOM Content Load handler, Texture Cache
//  X Encapsulate a Simple asset loader (images + json) and remove responsibility from the Texture class
//  X DOM Loaded handler + small boot = Game class
//  X Basic Scene class
//  X Tidy-up all of the classes, boil down into tiny WebGL1 + Sprite + Container + StaticContainer renderer package
//  X Update Merged Transform to cache rotation and scale
//  X Multi Textures round-robin, don't use glIndex
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
//# sourceMappingURL=test036.js.map
