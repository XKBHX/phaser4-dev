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
        const uniforms = this.uniforms;
        gl.useProgram(this.program);
        gl.uniformMatrix4fv(uniforms.projectionMatrix, false, renderer.projectionMatrix);
        gl.uniformMatrix4fv(uniforms.cameraMatrix, false, renderer.camera.matrix);
        gl.uniform1iv(uniforms.textureLocation, renderer.textureIndex);
        this.bindBuffers(this.indexBuffer, this.vertexBuffer);
    }
    bindBuffers(indexBuffer, vertexBuffer) {
        const gl = this.gl;
        const stride = this.vertexByteSize;
        const attribs = this.attribs;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        //  attributes must be reset whenever you change buffers
        gl.vertexAttribPointer(attribs.position, 2, gl.FLOAT, false, stride, 0); // size = 8
        gl.vertexAttribPointer(attribs.textureCoord, 2, gl.FLOAT, false, stride, 8); // size = 8
        gl.vertexAttribPointer(attribs.textureIndex, 1, gl.FLOAT, false, stride, 8 + 8); // size = 4
        gl.vertexAttribPointer(attribs.color, 4, gl.UNSIGNED_BYTE, true, stride, 8 + 8 + 4); // size = 4
        this.count = 0;
    }
    batchSpriteBuffer(buffer) {
        if (buffer.size > 0) {
            this.flush();
            buffer.render();
            //  Restore buffers
            this.bindBuffers(this.indexBuffer, this.vertexBuffer);
            return true;
        }
        return false;
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

class Camera {
    constructor(renderer, width, height) {
        this._x = 0;
        this._y = 0;
        this._rotation = 0;
        this._scaleX = 1;
        this._scaleY = 1;
        if (!width) {
            width = renderer.width;
        }
        if (!height) {
            height = renderer.height;
        }
        this.renderer = renderer;
        this.matrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        this.width = width;
        this.height = height;
    }
    translate(x, y, z = 0) {
        const matrix = this.matrix;
        const m00 = matrix[0];
        const m01 = matrix[1];
        const m02 = matrix[2];
        const m03 = matrix[3];
        const m10 = matrix[4];
        const m11 = matrix[5];
        const m12 = matrix[6];
        const m13 = matrix[7];
        const m20 = matrix[8];
        const m21 = matrix[9];
        const m22 = matrix[10];
        const m23 = matrix[11];
        const m30 = matrix[12];
        const m31 = matrix[13];
        const m32 = matrix[14];
        const m33 = matrix[15];
        matrix[12] = m00 * x + m10 * y + m20 * z + m30;
        matrix[13] = m01 * x + m11 * y + m21 * z + m31;
        matrix[14] = m02 * x + m12 * y + m22 * z + m32;
        matrix[15] = m03 * x + m13 * y + m23 * z + m33;
    }
    scale(scaleX, scaleY) {
        const matrix = this.matrix;
        matrix[0] *= scaleX;
        matrix[1] *= scaleX;
        matrix[2] *= scaleX;
        matrix[3] *= scaleX;
        matrix[4] *= scaleY;
        matrix[5] *= scaleY;
        matrix[6] *= scaleY;
        matrix[7] *= scaleY;
    }
    rotate(angle) {
        const s = Math.sin(angle);
        const c = Math.cos(angle);
        const matrix = this.matrix;
        const m00 = matrix[0];
        const m01 = matrix[1];
        const m02 = matrix[2];
        const m03 = matrix[3];
        const m10 = matrix[4];
        const m11 = matrix[5];
        const m12 = matrix[6];
        const m13 = matrix[7];
        matrix[0] = m00 * c + m10 * s;
        matrix[1] = m01 * c + m11 * s;
        matrix[2] = m02 * c + m12 * s;
        matrix[3] = m03 * c + m13 * s;
        matrix[4] = m10 * c - m00 * s;
        matrix[5] = m11 * c - m01 * s;
        matrix[6] = m12 * c - m02 * s;
        matrix[7] = m13 * c - m03 * s;
    }
    set x(value) {
        this._x = value;
        this.translate(value, this._y);
    }
    get x() {
        return this._x;
    }
    set y(value) {
        this._y = value;
        this.translate(this._x, value);
    }
    get y() {
        return this._y;
    }
    set rotation(value) {
        this._rotation = value;
        this.rotate(value);
    }
    get rotation() {
        return this._rotation;
    }
    set scaleX(value) {
        this._scaleX = value;
        this.scale(value, this._scaleY);
    }
    get scaleX() {
        return this._scaleX;
    }
    set scaleY(value) {
        this._scaleY = value;
        this.scale(this._scaleX, value);
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
        this.elementIndexExtension = gl.getExtension('OES_element_index_uint');
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
                if (entity.type === 'SpriteBuffer') {
                    if (shader.batchSpriteBuffer(entity)) {
                        //  Reset active textures
                        this.currentActiveTexture = 0;
                        this.startActiveTexture++;
                    }
                }
                else if (entity.size) {
                    // Render the children, if it has any
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
        this.type = 'DisplayObjectContainer';
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
    update(dt) {
        const children = this.children;
        for (let i = 0; i < children.length; i++) {
            children[i].update(dt);
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
    update(delta, time) {
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

class EE {
    constructor(callback, context, once = false) {
        this.callback = callback;
        this.context = context;
        this.once = once;
    }
}
class EventEmitter {
    constructor() {
        this._events = new Map();
    }
    on(event, callback, context = this, once = false) {
        if (typeof callback !== 'function') {
            throw new TypeError('The listener must be a function');
        }
        const listener = new EE(callback, context, once);
        const listeners = this._events.get(event);
        if (!listeners) {
            this._events.set(event, new Set([listener]));
        }
        else {
            listeners.add(listener);
        }
        return this;
    }
    once(event, callback, context = this) {
        return this.on(event, callback, context, true);
    }
    /**
     * Clear an event by name.
     */
    clearEvent(event) {
        this._events.delete(event);
        return this;
    }
    /**
     * Return an array listing the events for which the emitter has registered listeners.
     */
    eventNames() {
        return [...this._events.keys()];
    }
    /**
     * Return the listeners registered for a given event.
     */
    listeners(event) {
        const out = [];
        const listeners = this._events.get(event);
        listeners.forEach((ee) => {
            out.push(ee.callback);
        });
        return out;
    }
    /**
     * Return the number of listeners listening to a given event.
     */
    listenerCount(event) {
        const listeners = this._events.get(event);
        return (listeners) ? listeners.size : 0;
    }
    /**
     * Calls each of the listeners registered for a given event.
     */
    emit(event, ...args) {
        if (!this._events.has(event)) {
            return false;
        }
        const listeners = this._events.get(event);
        for (const ee of listeners) {
            ee.callback.apply(ee.context, args);
            if (ee.once) {
                listeners.delete(ee);
            }
        }
        if (listeners.size === 0) {
            this._events.delete(event);
        }
        return true;
    }
    /**
     * Remove the listeners of a given event.
     *
     * @param event
     * @param callback
     * @param context
     * @param once
     */
    off(event, callback, context, once) {
        if (!callback) {
            //  Remove all events matching the given key
            this._events.delete(event);
        }
        else {
            const listeners = this._events.get(event);
            const hasContext = !context;
            const hasOnce = (once !== undefined);
            for (const ee of listeners) {
                if (ee.callback === callback && (hasContext && ee.context === console) && (hasOnce && ee.once === once)) {
                    listeners.delete(ee);
                }
            }
            if (listeners.size === 0) {
                this._events.delete(event);
            }
        }
        return this;
    }
    /**
     * Remove all listeners, or those of the specified event.
     *
     * @param event
     */
    removeAllListeners(event) {
        if (!event) {
            this._events.clear();
        }
        else {
            this._events.delete(event);
        }
    }
}

class Game extends EventEmitter {
    constructor(config) {
        super();
        this.VERSION = '4.0.0-beta1';
        this.isPaused = false;
        this.isBooted = false;
        this.lifetime = 0;
        this.elapsed = 0;
        const { width = 800, height = 600, backgroundColor = 0x00000, parent = document.body, scene = new Scene(this) } = config;
        this.scene = scene;
        DOMContentLoaded(() => this.boot(width, height, backgroundColor, parent));
    }
    pause() {
        this.isPaused = true;
        this.emit('pause');
    }
    resume() {
        this.isPaused = false;
        this.emit('resume');
    }
    boot(width, height, backgroundColor, parent) {
        this.isBooted = true;
        this.lastTick = Date.now();
        this.textures = new TextureManager(this);
        this.loader = new Loader(this);
        const renderer = new WebGLRenderer(width, height);
        renderer.setBackgroundColor(backgroundColor);
        AddToDOM(renderer.canvas, parent);
        this.renderer = renderer;
        this.banner(this.VERSION);
        //  Visibility API
        document.addEventListener('visibilitychange', () => {
            this.emit('visibilitychange', document.hidden);
            if (document.hidden) {
                this.pause();
            }
            else {
                this.resume();
            }
        });
        window.addEventListener('blur', () => this.pause());
        window.addEventListener('focus', () => this.resume());
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
        this.emit('boot');
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
        requestAnimationFrame(() => this.step());
    }
    banner(version) {
        console.log('%cPhaser Nano v' + version + '%c https://phaser4.io', 'padding: 2px 20px; color: #fff; background: linear-gradient(to right, #00bcc3, #3e0081 10%, #3e0081 90%, #3e0081 10%, #00bcc3)', '');
    }
    step() {
        const now = Date.now();
        const delta = now - this.lastTick;
        const dt = delta / 1000;
        this.lifetime += dt;
        this.elapsed = dt;
        this.lastTick = now;
        if (this.isPaused) {
            //  Otherwise SpectorGL can't debug the scene
            this.renderer.render(this.scene.world);
            requestAnimationFrame(() => this.step());
            return;
        }
        this.emit('step', dt);
        this.scene.world.update(dt);
        this.scene.update(dt, now);
        this.renderer.render(this.scene.world);
        requestAnimationFrame(() => this.step());
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
        this.type = 'Sprite';
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
        if (key instanceof Texture) {
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

class SpriteBuffer {
    constructor(game, maxSize) {
        this.type = 'SpriteBuffer';
        this.visible = true;
        this.renderable = true;
        this.children = [];
        this.texture = null;
        this.dirty = false;
        this.game = game;
        this.renderer = game.renderer;
        this.gl = game.renderer.gl;
        this.shader = game.renderer.shader;
        this.resetBuffers(maxSize);
    }
    //  TODO: Split to own function so Shader can share it?
    resetBuffers(maxSize) {
        const gl = this.gl;
        const shader = this.shader;
        const indexSize = shader.indexSize;
        this.indexType = gl.UNSIGNED_SHORT;
        if (maxSize > 65535) {
            if (!this.renderer.elementIndexExtension) {
                console.warn('Browser does not support OES uint element index. SpriteBuffer.maxSize cannot exceed 65535');
                maxSize = 65535;
            }
            else {
                this.indexType = gl.UNSIGNED_INT;
            }
        }
        let ibo = [];
        //  Seed the index buffer
        for (let i = 0; i < (maxSize * indexSize); i += indexSize) {
            ibo.push(i + 0, i + 1, i + 2, i + 2, i + 3, i + 0);
        }
        this.data = new ArrayBuffer(maxSize * shader.quadByteSize);
        if (this.indexType === gl.UNSIGNED_SHORT) {
            this.index = new Uint16Array(ibo);
        }
        else {
            this.index = new Uint32Array(ibo);
        }
        this.vertexViewF32 = new Float32Array(this.data);
        this.vertexViewU32 = new Uint32Array(this.data);
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.data, gl.STATIC_DRAW);
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.index, gl.STATIC_DRAW);
        //  Tidy-up
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        ibo = [];
        this.size = 0;
        this.maxSize = maxSize;
        this.quadIndexSize = shader.quadIndexSize;
        this.activeTextures = [];
    }
    render() {
        const gl = this.gl;
        this.shader.bindBuffers(this.indexBuffer, this.vertexBuffer);
        if (this.dirty) {
            gl.bufferData(gl.ARRAY_BUFFER, this.data, gl.STATIC_DRAW);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.index, gl.STATIC_DRAW);
            this.dirty = false;
        }
        //  For now we'll allow just the one texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.activeTextures[0].glTexture);
        gl.drawElements(gl.TRIANGLES, this.size * this.quadIndexSize, this.indexType, 0);
    }
    add(source) {
        if (this.size === this.maxSize) {
            return;
        }
        const textureIndex = 0;
        this.activeTextures[textureIndex] = source.texture;
        let offset = this.size * this.shader.quadElementSize;
        const F32 = this.vertexViewF32;
        const U32 = this.vertexViewU32;
        const frame = source.frame;
        const vertices = source.updateVertices();
        const topLeft = vertices[0];
        const topRight = vertices[1];
        const bottomLeft = vertices[2];
        const bottomRight = vertices[3];
        F32[offset++] = topLeft.x;
        F32[offset++] = topLeft.y;
        F32[offset++] = frame.u0;
        F32[offset++] = frame.v0;
        F32[offset++] = textureIndex;
        U32[offset++] = this.shader.packColor(topLeft.color, topLeft.alpha);
        F32[offset++] = bottomLeft.x;
        F32[offset++] = bottomLeft.y;
        F32[offset++] = frame.u0;
        F32[offset++] = frame.v1;
        F32[offset++] = textureIndex;
        U32[offset++] = this.shader.packColor(bottomLeft.color, bottomLeft.alpha);
        F32[offset++] = bottomRight.x;
        F32[offset++] = bottomRight.y;
        F32[offset++] = frame.u1;
        F32[offset++] = frame.v1;
        F32[offset++] = textureIndex;
        U32[offset++] = this.shader.packColor(bottomRight.color, bottomRight.alpha);
        F32[offset++] = topRight.x;
        F32[offset++] = topRight.y;
        F32[offset++] = frame.u1;
        F32[offset++] = frame.v0;
        F32[offset++] = textureIndex;
        U32[offset++] = this.shader.packColor(topRight.color, topRight.alpha);
        this.size++;
        this.dirty = true;
    }
    willRender() {
        return (this.visible && this.renderable);
    }
    update() {
    }
    updateTransform() {
    }
}

class Scene$1 {
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
    update(delta, time) {
    }
}

class Demo extends Scene$1 {
    constructor(game) {
        super(game);
        this.cx = 0;
    }
    preload() {
        this.load.setPath('../assets/');
        this.load.image('cat', 'ultimatevirtues.gif');
        this.load.spritesheet('tiles', 'gridtiles.png', { frameWidth: 32, frameHeight: 32 });
    }
    create() {
        this.world.addChild(new Sprite(this, 400, 300, 'cat'));
        const buffer = new SpriteBuffer(this.game, 100000);
        const brain = new Sprite(this, 0, 0, 'tiles');
        for (let i = 0; i < buffer.maxSize; i++) {
            let x = -800 + Math.floor(Math.random() * 1600);
            let y = -300 + Math.floor(Math.random() * 1200);
            let f = Math.floor(Math.random() * 140);
            let s = Math.random() * 2;
            let r = Math.random() * Math.PI * 2;
            brain.setPosition(x, y);
            brain.setFrame(f);
            brain.setScale(s);
            brain.setRotation(r);
            buffer.add(brain);
        }
        this.world.addChild(buffer);
    }
    update(delta) {
        this.game.renderer.camera.x = Math.sin(this.cx) * 2;
        this.game.renderer.camera.y = Math.cos(this.cx) * 2;
        this.cx += 0.01;
    }
}
function demo10 () {
    let game = new Game({
        width: 800,
        height: 600,
        backgroundColor: 0x000033,
        parent: 'gameParent',
        scene: Demo
    });
    document.getElementById('toggle').addEventListener('click', () => {
        game.isPaused = (game.isPaused) ? false : true;
    });
}

// demo6();
// demo7();
// demo8();
// demo9();
demo10();
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
