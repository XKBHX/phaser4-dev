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
    else if (window.hasOwnProperty('cordova')) {
        document.addEventListener('deviceready', check, true);
    }
    else {
        document.addEventListener('DOMContentLoaded', check, true);
        window.addEventListener('load', check, true);
    }
}

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
        const { batchSize = 4096, dataSize = 4, indexSize = 4, vertexElementSize = 6, quadIndexSize = 6, fragmentShader = shaderSource.fragmentShader, vertexShader = shaderSource.vertexShader } = config;
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
    bind(camera) {
        const gl = this.gl;
        const renderer = this.renderer;
        const uniforms = this.uniforms;
        gl.useProgram(this.program);
        gl.uniformMatrix4fv(uniforms.projectionMatrix, false, renderer.projectionMatrix);
        gl.uniformMatrix4fv(uniforms.cameraMatrix, false, camera.matrix);
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
        gl.vertexAttribPointer(attribs.textureCoord, 2, gl.FLOAT, false, stride, 8); // size = 8, offset = position
        gl.vertexAttribPointer(attribs.textureIndex, 1, gl.FLOAT, false, stride, 16); // size = 4, offset = position + tex coord
        gl.vertexAttribPointer(attribs.color, 4, gl.UNSIGNED_BYTE, true, stride, 20); // size = 4, offset = position + tex coord + index
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
        sprite.updateVertices(this.vertexViewF32, this.vertexViewU32, this.count * this.quadElementSize);
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
        this.optimizeRedraw = true;
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
    }
    initContext() {
        const gl = this.canvas.getContext('webgl', this.contextOptions);
        this.gl = gl;
        this.elementIndexExtension = gl.getExtension('OES_element_index_uint');
        this.getMaxTextures();
        // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthFunc
        // gl.enable(gl.DEPTH_TEST);
        // gl.depthFunc(gl.LESS);
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
        this.projectionMatrix = this.ortho(width, height, -10000, 10000);
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
        if (width < 1 || height < 1) {
            return false;
        }
        return ((width & (width - 1)) === 0) && ((height & (height - 1)) === 0);
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
    render(scene, dirtyFrame) {
        if (this.contextLost) {
            return;
        }
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        if (this.optimizeRedraw && dirtyFrame === 0) {
            return;
        }
        this.currentActiveTexture = 0;
        this.startActiveTexture++;
        const shader = this.shader;
        //  CLS
        gl.viewport(0, 0, this.width, this.height);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        const cls = this.clearColor;
        if (this.clearBeforeRender) {
            gl.clearColor(cls[0], cls[1], cls[2], cls[3]);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
        shader.bind(scene.camera);
        this.renderChildren(scene.world);
        shader.flush();
    }
    renderChildren(container) {
        const gl = this.gl;
        const shader = this.shader;
        const maxTextures = this.maxTextures;
        const activeTextures = this.activeTextures;
        const startActiveTexture = this.startActiveTexture;
        const children = container.children;
        for (let i = 0; i < children.length; i++) {
            let entity = children[i];
            if (!entity.willRender()) {
                continue;
            }
            if (entity.hasTexture) {
                let texture = entity.texture;
                if (texture.glIndexCounter < startActiveTexture) {
                    texture.glIndexCounter = startActiveTexture;
                    if (this.currentActiveTexture < maxTextures) {
                        //  Make this texture active
                        activeTextures[this.currentActiveTexture] = texture;
                        texture.glIndex = this.currentActiveTexture;
                        gl.activeTexture(gl.TEXTURE0 + this.currentActiveTexture);
                        gl.bindTexture(gl.TEXTURE_2D, texture.glTexture);
                        this.currentActiveTexture++;
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
        //  Link file?
        if (file.linkFile && file.linkFile.hasLoaded) {
            const imageFile = (file.type === 'atlasimage') ? file : file.linkFile;
            const jsonFile = (file.type === 'atlasjson') ? file : file.linkFile;
            this.game.textures.addAtlas(file.key, imageFile.data, jsonFile.data);
        }
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
    atlas(key, textureURL, atlasURL) {
        let textureFile = new File('atlasimage', key, this.getURL(key, textureURL, '.png'), (file) => this.imageTagLoader(file));
        let JSONFile = new File('atlasjson', key, this.getURL(key, atlasURL, '.json'), (file) => this.XHRLoader(file));
        JSONFile.config = { responseType: 'text' };
        textureFile.linkFile = JSONFile;
        JSONFile.linkFile = textureFile;
        this.queue.push(textureFile);
        this.queue.push(JSONFile);
        return this;
    }
    json(key, url) {
        let file = new File('json', key, this.getURL(key, url, '.json'), (file) => this.XHRLoader(file));
        file.config = { responseType: 'text' };
        this.queue.push(file);
        return this;
    }
    csv(key, url) {
        let file = new File('csv', key, this.getURL(key, url, '.csv'), (file) => this.XHRLoader(file));
        file.config = { responseType: 'text' };
        this.queue.push(file);
        return this;
    }
    XHRLoader(file) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', file.url, true);
        xhr.responseType = file.config['responseType'];
        xhr.onload = (event) => {
            file.hasLoaded = true;
            if (file.type === 'json' || file.type === 'atlasjson') {
                file.data = JSON.parse(xhr.responseText);
            }
            else {
                file.data = xhr.responseText;
            }
            this.fileComplete(file);
        };
        xhr.onerror = () => {
            file.hasLoaded = true;
            this.fileError(file);
        };
        xhr.send();
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

function LocalToGlobal(transform, x, y, outPoint = new Vec2()) {
    const { a, b, c, d, tx, ty } = transform;
    outPoint.x = (a * x) + (c * y) + tx;
    outPoint.y = (b * x) + (d * y) + ty;
    return outPoint;
}

function GlobalToLocal(transform, x, y, outPoint = new Vec2()) {
    const { a, b, c, d, tx, ty } = transform;
    const id = 1 / ((a * d) + (c * -b));
    outPoint.x = (d * id * x) + (-c * id * y) + (((ty * c) - (tx * d)) * id);
    outPoint.y = (a * id * y) + (-b * id * x) + (((-ty * a) + (tx * b)) * id);
    return outPoint;
}

class DisplayObject {
    constructor(scene, x = 0, y = 0) {
        this.dirty = true;
        this.dirtyFrame = 0;
        this.visible = true;
        this.renderable = true;
        this.hasTexture = false;
        this.width = 0;
        this.height = 0;
        this._position = new Vec2();
        this._scale = new Vec2(1, 1);
        this._skew = new Vec2();
        this._origin = new Vec2(0.5, 0.5);
        this._rotation = 0;
        this._alpha = 1;
        this.localTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
        this.worldTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
        this._position.set(x, y);
        this.setScene(scene);
    }
    setScene(scene) {
        this.scene = scene;
        return this;
    }
    updateTransform() {
        this.dirty = true;
        this.dirtyFrame = this.scene.game.frame;
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
            return this;
        }
        const pt = parent.worldTransform;
        let { a, b, c, d, tx, ty } = lt;
        wt.a = a * pt.a + b * pt.c;
        wt.b = a * pt.b + b * pt.d;
        wt.c = c * pt.a + d * pt.c;
        wt.d = c * pt.b + d * pt.d;
        wt.tx = tx * pt.a + ty * pt.c + pt.tx;
        wt.ty = tx * pt.b + ty * pt.d + pt.ty;
        return this;
    }
    localToGlobal(x, y, outPoint = new Vec2()) {
        return LocalToGlobal(this.worldTransform, x, y, outPoint);
    }
    globalToLocal(x, y, outPoint = new Vec2()) {
        return GlobalToLocal(this.worldTransform, x, y, outPoint);
    }
    willRender() {
        return (this.visible && this.renderable && this._alpha > 0);
    }
    setAlpha(alpha = 1) {
        if (alpha !== this._alpha) {
            this._alpha = alpha;
            this.dirtyFrame = this.scene.game.frame;
        }
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
        if (rotation !== this._rotation) {
            this._rotation = rotation;
            this.updateCache();
        }
        return this;
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
        if (value !== this._rotation) {
            this._rotation = value;
            this.updateCache();
        }
    }
    get rotation() {
        return this._rotation;
    }
    set scaleX(value) {
        if (value !== this._scale.x) {
            this._scale.x = value;
            this.updateCache();
        }
    }
    get scaleX() {
        return this._scale.x;
    }
    set scaleY(value) {
        if (value !== this._scale.y) {
            this._scale.y = value;
            this.updateCache();
        }
    }
    get scaleY() {
        return this._scale.y;
    }
    set skewX(value) {
        if (value !== this._skew.x) {
            this._skew.x = value;
            this.updateCache();
        }
    }
    get skewX() {
        return this._skew.x;
    }
    set skewY(value) {
        if (value !== this._skew.y) {
            this._skew.y = value;
            this.updateCache();
        }
    }
    get originX() {
        return this._origin.x;
    }
    set originX(value) {
        this._origin.x = value;
    }
    get originY() {
        return this._origin.y;
    }
    set originY(value) {
        this._origin.y = value;
    }
    get alpha() {
        return this._alpha;
    }
    set alpha(value) {
        if (value !== this._alpha) {
            this._alpha = value;
            this.dirtyFrame = this.scene.game.frame;
        }
    }
}

class DisplayObjectContainer extends DisplayObject {
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);
        this.type = 'DisplayObjectContainer';
        this.children = [];
        this.inputEnabled = false;
        this.inputEnabledChildren = true;
        this.updateTransform();
    }
    setInteractive(hitArea) {
        this.inputEnabled = true;
        this.inputHitArea = hitArea;
        this.inputEnabledChildren = true;
        return this;
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
            child.updateTransform();
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
            child.updateTransform();
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
                child.updateTransform();
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
    update(dt, now) {
        const children = this.children;
        for (let i = 0; i < children.length; i++) {
            children[i].update(dt, now);
        }
    }
    preRender(dt, now) {
        const game = this.scene.game;
        game.totalFrame++;
        if (this.dirtyFrame >= game.frame) {
            game.dirtyFrame++;
        }
        const children = this.children;
        for (let i = 0; i < children.length; i++) {
            children[i].preRender(dt, now);
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

class Camera extends DisplayObject {
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);
        this.renderer = scene.game.renderer;
        this.matrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        this.setSize(this.renderer.width, this.renderer.height);
    }
    updateTransform() {
        this.dirtyFrame = this.scene.game.frame;
        const lt = this.localTransform;
        const wt = this.worldTransform;
        lt.tx = this.x;
        lt.ty = this.y;
        const mat = this.matrix;
        const { a, b, c, d, tx, ty } = lt;
        const viewportW = this.renderer.width * this.originX;
        const viewportH = this.renderer.height * this.originY;
        mat[0] = a;
        mat[1] = b;
        mat[4] = c;
        mat[5] = d;
        //  combinates viewport translation + scrollX/Y
        mat[12] = (a * -viewportW) + (c * -viewportH) + (viewportW + tx);
        mat[13] = (b * -viewportW) + (d * -viewportH) + (viewportH + ty);
        //  Store in worldTransform
        wt.a = a;
        wt.b = b;
        wt.c = c;
        wt.d = d;
        wt.tx = mat[12];
        wt.ty = mat[13];
        // mat[12] = viewportW + tx; // combines translation to center of viewport + scrollX
        // mat[13] = viewportH + ty; // combines translation to center of viewport + scrollY
        // this.translate(-viewportW, -viewportH);
        // console.log(mat);
        return this;
    }
}

class Scene {
    constructor(game) {
        this.game = game;
        this.load = game.loader;
        this.textures = game.textures;
        this.world = new DisplayObjectContainer(this, 0, 0);
        this.camera = new Camera(this, 0, 0);
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
        this.trimmed = false;
        this.texture = texture;
        this.key = key;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.sourceSizeWidth = width;
        this.sourceSizeHeight = height;
        this.updateUVs();
    }
    setPivot(x, y) {
        this.pivot = { x, y };
    }
    setSourceSize(width, height) {
        this.sourceSizeWidth = width;
        this.sourceSizeHeight = height;
    }
    setTrim(width, height, x, y, w, h) {
        this.trimmed = true;
        this.sourceSizeWidth = width;
        this.sourceSizeHeight = height;
        this.spriteSourceSizeX = x;
        this.spriteSourceSizeY = y;
        this.spriteSourceSizeWidth = w;
        this.spriteSourceSizeHeight = h;
    }
    updateUVs() {
        const { x, y, width, height } = this;
        const baseTextureWidth = this.texture.width;
        const baseTextureHeight = this.texture.height;
        this.u0 = x / baseTextureWidth;
        this.v0 = y / baseTextureHeight;
        this.u1 = (x + width) / baseTextureWidth;
        this.v1 = (y + height) / baseTextureHeight;
    }
}

class Texture {
    constructor(key, image) {
        this.glIndex = 0;
        this.glIndexCounter = -1;
        this.key = key;
        this.image = image;
        this.width = image.width;
        this.height = image.height;
        this.frames = new Map();
        this.add('__BASE', 0, 0, image.width, image.height);
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
        if (key instanceof Frame) {
            key = key.key;
        }
        let frame = this.frames.get(key);
        if (!frame) {
            console.warn('Texture.frame missing: ' + key);
            frame = this.firstFrame;
        }
        return frame;
    }
    getFrames(frames) {
        const output = [];
        frames.forEach((key) => {
            output.push(this.get(key));
        });
        return output;
    }
    getFramesInRange(prefix, start, end, zeroPad = 0, suffix = '') {
        const frameKeys = [];
        const diff = (start < end) ? 1 : -1;
        //  Adjust because we use i !== end in the for loop
        end += diff;
        for (let i = start; i !== end; i += diff) {
            frameKeys.push(prefix + i.toString().padStart(zeroPad, '0') + suffix);
        }
        return this.getFrames(frameKeys);
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

function AtlasParser (texture, data) {
    let frames;
    if (Array.isArray(data.textures)) {
        //  TP3 Format
        frames = data.textures[0].frames;
    }
    else if (Array.isArray(data.frames)) {
        //  TP2 Format Array
        frames = data.frames;
    }
    else if (data.hasOwnProperty('frames')) {
        //  TP2 Format Hash
        frames = Object.values(data.frames);
    }
    else {
        console.warn('Invalid Texture Atlas JSON');
    }
    if (frames) {
        let newFrame;
        for (let i = 0; i < frames.length; i++) {
            let src = frames[i];
            //  The frame values are the exact coordinates to cut the frame out of the atlas from
            newFrame = texture.add(src.filename, src.frame.x, src.frame.y, src.frame.w, src.frame.h);
            //  These are the original (non-trimmed) sprite values
            if (src.trimmed) {
                newFrame.setTrim(src.sourceSize.w, src.sourceSize.h, src.spriteSourceSize.x, src.spriteSourceSize.y, src.spriteSourceSize.w, src.spriteSourceSize.h);
            }
            else {
                newFrame.setSourceSize(src.sourceSize.w, src.sourceSize.h);
            }
            if (src.rotated) ;
            if (src.anchor) {
                newFrame.setPivot(src.anchor.x, src.anchor.y);
            }
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
    addAtlas(key, source, atlasData) {
        let texture = null;
        if (!this.textures.has(key)) {
            texture = new Texture(key, source);
            texture.glTexture = this.game.renderer.createGLTexture(texture.image);
            AtlasParser(texture, atlasData);
            this.textures.set(key, texture);
        }
        return texture;
    }
    addColor(key, color, width = 32, height = 32) {
        return this.addGrid(key, color, color, width, height, 0, 0);
    }
    addGrid(key, color1, color2, width = 32, height = 32, cols = 2, rows = 2) {
        let texture = null;
        if (!this.textures.has(key)) {
            const ctx = this.createCanvas(width, height);
            const colWidth = width / cols;
            const rowHeight = height / rows;
            ctx.fillStyle = color1;
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = color2;
            for (let y = 0; y < rows; y++) {
                for (let x = (y % 2); x < cols; x += 2) {
                    ctx.fillRect(x * colWidth, y * rowHeight, colWidth, rowHeight);
                }
            }
            texture = new Texture(key, ctx.canvas);
            texture.glTexture = this.game.renderer.createGLTexture(texture.image);
            this.textures.set(key, texture);
        }
        return texture;
    }
    createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas.getContext('2d');
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
        //  The current game frame
        this.frame = 0;
        //  How many Game Objects were made dirty this frame?
        this.dirtyFrame = 0;
        //  How many Game Objects were processed this frame?
        this.totalFrame = 0;
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
        this.lastTick = Date.now();
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
        // window.addEventListener('blur', () => this.pause());
        // window.addEventListener('focus', () => this.resume());
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
        console.log('%c  %c  %cPhaser Nano v' + version + '%c https://phaser4.io', 'padding: 2px; background: linear-gradient(to right, #00bcc3, #3e0081)', 'padding: 2px; background: #3e0081 url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAJ1BMVEUALon///+9tJQAAABv9v92d2IAn6qHEhL/DQ3/fCUOOlNMPUD/uz24pItZAAAAaElEQVQI12OAA/YCKKPyOANbWgKQUdFZkOLiBmJ0zHIRdAEKWXR0uQimABnWu3elpIEYhoKCYS4ui8EModBQRQMG09AgQSBQBmpvBzOABhYpAYEBg3FpEJAOZgCqAdEGDAzGIACk4QAAsv0aPCHrnowAAAAASUVORK5CYII=) no-repeat;', 'padding: 2px 20px 2px 8px; color: #fff; background: linear-gradient(to right, #3e0081 90%, #3e0081 10%, #00bcc3)', '');
    }
    step() {
        const now = Date.now();
        const delta = now - this.lastTick;
        const dt = delta / 1000;
        this.lifetime += dt;
        this.elapsed = dt;
        this.lastTick = now;
        //  The frame always advances by 1 each step (even when paused)
        this.frame++;
        this.emit('step', dt, now);
        if (!this.isPaused) {
            this.scene.update(dt, now);
            this.scene.world.update(dt, now);
        }
        this.emit('update', dt, now);
        this.dirtyFrame = 0;
        this.totalFrame = 0;
        this.scene.world.preRender(dt, now);
        this.renderer.render(this.scene, this.dirtyFrame);
        this.emit('render', dt, now);
        requestAnimationFrame(() => this.step());
    }
}

function PackColor (rgb, alpha) {
    let ua = ((alpha * 255) | 0) & 0xFF;
    return ((ua << 24) | rgb) >>> 0;
}

class Sprite extends DisplayObjectContainer {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y);
        this.type = 'Sprite';
        this._tint = 0xffffff;
        this._prevTextureID = -1;
        this.vertexData = new Float32Array(24).fill(0);
        this.vertexTint = new Uint32Array(4).fill(0xffffff);
        this.vertexAlpha = new Float32Array(4).fill(1);
        this.vertexColor = new Uint32Array(4).fill(4294967295);
        this.setTexture(texture, frame);
        this.updateTransform();
    }
    setTexture(key, frame) {
        if (key instanceof Texture) {
            this.texture = key;
        }
        else {
            this.texture = this.scene.textures.get(key);
        }
        if (!this.texture) {
            console.warn('Invalid Texture key: ' + key);
        }
        else {
            this.setFrame(frame);
        }
        return this;
    }
    setFrame(key) {
        const frame = this.texture.get(key);
        if (frame === this.frame) {
            return this;
        }
        this.frame = frame;
        this.setSize(frame.sourceSizeWidth, frame.sourceSizeHeight);
        if (frame.pivot) {
            this.setOrigin(frame.pivot.x, frame.pivot.y);
        }
        const data = this.vertexData;
        //  This rarely changes, so we'll set it here, rather than every frame:
        data[2] = frame.u0;
        data[3] = frame.v0;
        data[8] = frame.u0;
        data[9] = frame.v1;
        data[14] = frame.u1;
        data[15] = frame.v1;
        data[20] = frame.u1;
        data[21] = frame.v0;
        this.dirtyFrame = this.scene.game.frame;
        this.hasTexture = true;
        return this;
    }
    packColors() {
        const alpha = this.vertexAlpha;
        const tint = this.vertexTint;
        const color = this.vertexColor;
        //  In lots of cases, this *never* changes, so cache it here:
        color[0] = PackColor(tint[0], alpha[0]);
        color[1] = PackColor(tint[1], alpha[1]);
        color[2] = PackColor(tint[2], alpha[2]);
        color[3] = PackColor(tint[3], alpha[3]);
        this.dirtyFrame = this.scene.game.frame;
        return this;
    }
    setAlpha(topLeft = 1, topRight = topLeft, bottomLeft = topLeft, bottomRight = topLeft) {
        const alpha = this.vertexAlpha;
        alpha[0] = topLeft;
        alpha[1] = topRight;
        alpha[2] = bottomLeft;
        alpha[3] = bottomRight;
        return this.packColors();
    }
    setTint(topLeft = 0xffffff, topRight = topLeft, bottomLeft = topLeft, bottomRight = topLeft) {
        const tint = this.vertexTint;
        tint[0] = topLeft;
        tint[1] = topRight;
        tint[2] = bottomLeft;
        tint[3] = bottomRight;
        return this.packColors();
    }
    updateVertices(F32, U32, offset) {
        const data = this.vertexData;
        //  Skip all of this if not dirty
        if (this.dirty) {
            this.dirty = false;
            const frame = this.frame;
            const origin = this._origin;
            let w0;
            let w1;
            let h0;
            let h1;
            const { a, b, c, d, tx, ty } = this.worldTransform;
            if (frame.trimmed) {
                w1 = frame.spriteSourceSizeX - (origin.x * frame.sourceSizeWidth);
                w0 = w1 + frame.spriteSourceSizeWidth;
                h1 = frame.spriteSourceSizeY - (origin.y * frame.sourceSizeHeight);
                h0 = h1 + frame.spriteSourceSizeHeight;
            }
            else {
                w1 = -origin.x * frame.sourceSizeWidth;
                w0 = w1 + frame.sourceSizeWidth;
                h1 = -origin.y * frame.sourceSizeHeight;
                h0 = h1 + frame.sourceSizeHeight;
            }
            //  top left
            data[0] = (w1 * a) + (h1 * c) + tx;
            data[1] = (w1 * b) + (h1 * d) + ty;
            //  bottom left
            data[6] = (w1 * a) + (h0 * c) + tx;
            data[7] = (w1 * b) + (h0 * d) + ty;
            //  bottom right
            data[12] = (w0 * a) + (h0 * c) + tx;
            data[13] = (w0 * b) + (h0 * d) + ty;
            //  top right
            data[18] = (w0 * a) + (h1 * c) + tx;
            data[19] = (w0 * b) + (h1 * d) + ty;
        }
        const textureIndex = this.texture.glIndex;
        //  Do we have a different texture ID?
        if (textureIndex !== this._prevTextureID) {
            this._prevTextureID = textureIndex;
            data[4] = textureIndex;
            data[10] = textureIndex;
            data[16] = textureIndex;
            data[22] = textureIndex;
        }
        //  Copy the data to the array buffer
        F32.set(data, offset);
        const color = this.vertexColor;
        //  Copy the vertex colors to the Uint32 view (as the data copy above overwrites them)
        U32[offset + 5] = color[0];
        U32[offset + 11] = color[2];
        U32[offset + 17] = color[3];
        U32[offset + 23] = color[1];
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

class Scene$1 {
    constructor(game) {
        this.game = game;
        this.load = game.loader;
        this.textures = game.textures;
        this.world = new DisplayObjectContainer(this, 0, 0);
        this.camera = new Camera(this, 0, 0);
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

class StatsGraph {
    constructor(name, fg, bg, width) {
        this.percentage = false;
        this.expanded = false;
        this.min = Number.POSITIVE_INFINITY;
        this.max = 0;
        this.pr = 1;
        const pr = Math.round(window.devicePixelRatio || 1);
        this.pr = pr;
        const div = document.createElement('div');
        div.style.width = '40%';
        div.style.height = '64px';
        div.style.backgroundColor = '#222035';
        div.style.overflow = 'hidden';
        div.style.position = 'relative';
        div.style.cursor = 'pointer';
        const title = document.createElement('p');
        title.style.padding = '0';
        title.style.margin = '0';
        title.style.color = fg;
        title.style.fontWeight = 'bold';
        title.style.fontFamily = "Consolas, 'Courier New', Courier, monospace";
        title.style.fontSize = '12px';
        title.innerText = name;
        const graph = document.createElement('canvas');
        graph.width = width * pr;
        graph.height = 48 * pr;
        graph.style.width = `${width}px`;
        graph.style.height = '48px';
        graph.style.position = 'absolute';
        graph.style.top = '16px';
        graph.style.right = '0';
        const overlay = document.createElement('canvas');
        overlay.width = width * pr;
        overlay.height = 48 * pr;
        overlay.style.width = `${width}px`;
        overlay.style.height = '48px';
        overlay.style.position = 'absolute';
        overlay.style.top = '16px';
        div.appendChild(title);
        div.appendChild(graph);
        div.appendChild(overlay);
        this.bg = bg;
        this.fg = fg;
        this.div = div;
        this.title = title;
        this.name = name;
        this.graph = graph;
        this.graphContext = graph.getContext('2d');
        this.overlay = overlay;
        this.overlayContext = overlay.getContext('2d');
        this.drawGrid();
        div.addEventListener('click', () => {
            if (this.expanded) {
                this.collapse();
            }
            else {
                this.expand();
            }
        });
    }
    collapse() {
        this.div.style.width = '40%';
        this.expanded = false;
    }
    expand() {
        this.div.style.width = '100%';
        this.expanded = true;
    }
    drawGrid() {
        const overlay = this.overlay;
        const overlayContext = this.overlayContext;
        overlayContext.clearRect(0, 0, overlay.width, overlay.height);
        overlayContext.strokeStyle = '#6a6a6a';
        overlayContext.globalAlpha = 0.3;
        overlayContext.lineWidth = this.pr;
        for (let y = 0; y < overlay.height / 32; y++) {
            for (let x = 0; x < overlay.width / 64; x++) {
                overlayContext.strokeRect(x * 64, y * 32, 64, 32);
            }
        }
    }
    update(value, maxValue) {
        this.min = Math.min(this.min, value);
        this.max = Math.max(this.max, value);
        const pr = this.pr;
        const graph = this.graph;
        const graphContext = this.graphContext;
        const pointX = graph.width - pr;
        const pointY = (value / maxValue) * graph.height;
        graphContext.drawImage(graph, pr, 0, pointX, graph.height, 0, 0, pointX, graph.height);
        //  Clear what was at the right of the graph by filling with bg color
        graphContext.fillStyle = '#222035';
        graphContext.globalAlpha = 1;
        graphContext.fillRect(pointX, 0, pr, graph.height);
        //  Refresh
        graphContext.fillStyle = this.fg;
        graphContext.globalAlpha = 0.4;
        graphContext.fillRect(pointX, graph.height - pointY, pr, pointY);
        graphContext.globalAlpha = 1;
        graphContext.fillRect(pointX, graph.height - pointY, pr, pr);
        //  Title
        const title = this.title;
        let displayValue = Math.round(value).toString();
        if (this.percentage) {
            displayValue = displayValue.padStart(3, ' ');
            title.innerText = this.name + ' ' + displayValue + '%';
        }
        else {
            title.innerText = displayValue + ' ' + this.name + ' (' + Math.round(this.min) + '-' + Math.round(this.max) + ')';
        }
    }
}

const TreeCSS = `
.treeContainer {
    background: white;
    font: normal normal 13px/1.4 Segoe,"Segoe UI",Calibri,Helmet,FreeSans,Sans-Serif;
    padding: 50px;
    position: absolute;
    display: none;
    left: 0;
    top: 0;
  }
  
.tree,
.tree ul {
  margin:0 0 0 1em; /* indentation */
  padding:0;
  list-style:none;
  color:#369;
  position:relative;
}

.tree ul {margin-left:.5em} /* (indentation/2) */

.tree:before,
.tree ul:before {
  content:"";
  display:block;
  width:0;
  position:absolute;
  top:0;
  bottom:0;
  left:0;
  border-left:1px solid;
}

.tree li {
  margin:0;
  padding:0 1.5em; /* indentation + .5em */
  line-height:2em; /* default list item's line-height */
  font-weight:bold;
  position:relative;
}

.tree li:before {
  content:"";
  display:block;
  width:10px; /* same with indentation */
  height:0;
  border-top:1px solid;
  margin-top:-1px; /* border top width */
  position:absolute;
  top:1em; /* (line-height/2) */
  left:0;
}

.tree li:last-child:before {
  background:white; /* same with body background */
  height:auto;
  top:1em; /* (line-height/2) */
  bottom:0;
}
`;
class StatsTree {
    constructor(stats) {
        this.visible = false;
        this.stats = stats;
        this.game = stats.game;
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = TreeCSS;
        document.body.appendChild(style);
        const div = document.createElement('div');
        div.style.display = 'none;';
        div.className = 'treeContainer';
        const title = document.createElement('p');
        title.innerText = 'World';
        div.appendChild(title);
        const root = document.createElement('ul');
        root.className = 'tree';
        div.appendChild(root);
        this.div = div;
        this.root = root;
    }
    buildList(parent, root) {
        for (let i = 0; i < root.size; i++) {
            let entity = root.children[i];
            // let id: string = `#${i} - ${entity.type}`;
            let texture = '';
            if (entity.hasTexture) {
                let textureKey = entity.texture.key;
                let frameKey = entity.frame.key;
                if (frameKey === '__BASE') {
                    texture = textureKey;
                }
                else {
                    texture = textureKey + ' - ' + frameKey;
                }
            }
            let id = `${entity.type} (${texture})`;
            let li = document.createElement('li');
            li.innerText = id;
            parent.appendChild(li);
            if (entity.size > 0) {
                let ul = document.createElement('ul');
                li.appendChild(ul);
                this.buildList(ul, entity);
            }
        }
    }
    show() {
        this.game.pause();
        const root = this.root;
        const world = this.game.scene.world;
        this.buildList(root, world);
        this.visible = true;
        this.div.style.display = 'block';
    }
    hide() {
        //  Nuke all current children
        const root = this.root;
        while (root.firstChild) {
            root.removeChild(root.firstChild);
        }
        this.game.resume();
        this.visible = false;
        this.div.style.display = 'none';
    }
}

/**
* Copyright (c) 2020, Leon Sorokin
* All rights reserved. (MIT Licensed)
*
* uPlot.js (μPlot)
* An exceptionally fast, tiny time series chart
* https://github.com/leeoniya/uPlot (v1.0.0)
*/

function debounce(fn, time) {
	let pending = null;

	function run() {
		pending = null;
		fn();
	}

	return function() {
		clearTimeout(pending);
		pending = setTimeout(run, time);
	}
}

// binary search for index of closest value
function closestIdx(num, arr, lo, hi) {
	let mid;
	lo = lo || 0;
	hi = hi || arr.length - 1;
	let bitwise = hi <= 2147483647;

	while (hi - lo > 1) {
		mid = bitwise ? (lo + hi) >> 1 : floor((lo + hi) / 2);

		if (arr[mid] < num)
			lo = mid;
		else
			hi = mid;
	}

	if (num - arr[lo] <= arr[hi] - num)
		return lo;

	return hi;
}

function getMinMax(data, _i0, _i1) {
//	console.log("getMinMax()");

	let _min = inf;
	let _max = -inf;

	for (let i = _i0; i <= _i1; i++) {
		if (data[i] != null) {
			_min = min(_min, data[i]);
			_max = max(_max, data[i]);
		}
	}

	return [_min, _max];
}

// this ensures that non-temporal/numeric y-axes get multiple-snapped padding added above/below
// TODO: also account for incrs when snapping to ensure top of axis gets a tick & value
function rangeNum(min, max, mult, extra) {
	// auto-scale Y
	const delta = max - min;
	const mag = log10(delta || abs(max) || 1);
	const exp = floor(mag);
	const incr = pow(10, exp) * mult;
	const buf = delta == 0 ? incr : 0;

	let snappedMin = round6(incrRoundDn(min - buf, incr));
	let snappedMax = round6(incrRoundUp(max + buf, incr));

	if (extra) {
		// for flat data, always use 0 as one chart extreme
		if (delta == 0) {
			if (max > 0)
				snappedMin = 0;
			else if (max < 0)
				snappedMax = 0;
		}
		else {
			// if buffer is too small, increase it
			if (snappedMax - max < incr)
				snappedMax += incr;

			if (min - snappedMin < incr)
				snappedMin -= incr;

			// if original data never crosses 0, use 0 as one chart extreme
			if (min >= 0 && snappedMin < 0)
				snappedMin = 0;

			if (max <= 0 && snappedMax > 0)
				snappedMax = 0;
		}
	}

	return [snappedMin, snappedMax];
}

const M = Math;

const abs = M.abs;
const floor = M.floor;
const round = M.round;
const ceil = M.ceil;
const min = M.min;
const max = M.max;
const pow = M.pow;
const log10 = M.log10;
const PI = M.PI;

const inf = Infinity;

function incrRound(num, incr) {
	return round(num/incr)*incr;
}

function clamp(num, _min, _max) {
	return min(max(num, _min), _max);
}

function fnOrSelf(v) {
	return typeof v == "function" ? v : () => v;
}

function retArg2(a, b) {
	return b;
}

function incrRoundUp(num, incr) {
	return ceil(num/incr)*incr;
}

function incrRoundDn(num, incr) {
	return floor(num/incr)*incr;
}

function round3(val) {
	return round(val * 1e3) / 1e3;
}

function round6(val) {
	return round(val * 1e6) / 1e6;
}

//export const assign = Object.assign;

const isArr = Array.isArray;

function isStr(v) {
	return typeof v === 'string';
}

function isObj(v) {
	return typeof v === 'object' && v !== null;
}

function copy(o) {
	let out;

	if (isArr(o))
		out = o.map(copy);
	else if (isObj(o)) {
		out = {};
		for (var k in o)
			out[k] = copy(o[k]);
	}
	else
		out = o;

	return out;
}

function assign(targ) {
	let args = arguments;

	for (let i = 1; i < args.length; i++) {
		let src = args[i];

		for (let key in src) {
			if (isObj(targ[key]))
				assign(targ[key], copy(src[key]));
			else
				targ[key] = copy(src[key]);
		}
	}

	return targ;
}

const WIDTH = "width";
const HEIGHT = "height";
const TOP = "top";
const BOTTOM = "bottom";
const LEFT = "left";
const RIGHT = "right";
const firstChild = "firstChild";
const createElement = "createElement";
const hexBlack = "#000";
const classList = "classList";

const mousemove = "mousemove";
const mousedown = "mousedown";
const mouseup = "mouseup";
const mouseleave = "mouseleave";
const dblclick = "dblclick";
const resize = "resize";
const scroll = "scroll";

const rAF = requestAnimationFrame;
const doc = document;
const win = window;
const pxRatio = devicePixelRatio;

function addClass(el, c) {
	c != null && el[classList].add(c);
}

function remClass(el, c) {
	el[classList].remove(c);
}

function setStylePx(el, name, value) {
	el.style[name] = value + "px";
}

function placeTag(tag, cls, targ) {
	let el = doc[createElement](tag);

	if (cls != null)
		addClass(el, cls);

	if (targ != null)
		targ.appendChild(el);

	return el;
}

function placeDiv(cls, targ) {
	return placeTag("div", cls, targ);
}

function trans(el, xPos, yPos) {
	el.style.transform = "translate(" + xPos + "px," + yPos + "px)";
}

const evOpts = {passive: true};

function on(ev, el, cb) {
	el.addEventListener(ev, cb, evOpts);
}

function off(ev, el, cb) {
	el.removeEventListener(ev, cb, evOpts);
}

const months = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

const days = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

function slice3(str) {
	return str.slice(0, 3);
}

const days3 = days.map(slice3);

const months3 = months.map(slice3);

function zeroPad2(int) {
	return (int < 10 ? '0' : '') + int;
}

function zeroPad3(int) {
	return (int < 10 ? '00' : int < 100 ? '0' : '') + int;
}

/*
function suffix(int) {
	let mod10 = int % 10;

	return int + (
		mod10 == 1 && int != 11 ? "st" :
		mod10 == 2 && int != 12 ? "nd" :
		mod10 == 3 && int != 13 ? "rd" : "th"
	);
}
*/

const getFullYear = 'getFullYear';
const getMonth = 'getMonth';
const getDate = 'getDate';
const getDay = 'getDay';
const getHours = 'getHours';
const getMinutes = 'getMinutes';
const getSeconds = 'getSeconds';
const getMilliseconds = 'getMilliseconds';

const subs = {
	// 2019
	YYYY:	d => d[getFullYear](),
	// 19
	YY:		d => (d[getFullYear]()+'').slice(2),
	// July
	MMMM:	d => months[d[getMonth]()],
	// Jul
	MMM:	d => months3[d[getMonth]()],
	// 07
	MM:		d => zeroPad2(d[getMonth]()+1),
	// 7
	M:		d => d[getMonth]()+1,
	// 09
	DD:		d => zeroPad2(d[getDate]()),
	// 9
	D:		d => d[getDate](),
	// Monday
	WWWW:	d => days[d[getDay]()],
	// Mon
	WWW:	d => days3[d[getDay]()],
	// 03
	HH:		d => zeroPad2(d[getHours]()),
	// 3
	H:		d => d[getHours](),
	// 9 (12hr, unpadded)
	h:		d => {let h = d[getHours](); return h == 0 ? 12 : h > 12 ? h - 12 : h;},
	// AM
	AA:		d => d[getHours]() >= 12 ? 'PM' : 'AM',
	// am
	aa:		d => d[getHours]() >= 12 ? 'pm' : 'am',
	// a
	a:		d => d[getHours]() >= 12 ? 'p' : 'a',
	// 09
	mm:		d => zeroPad2(d[getMinutes]()),
	// 9
	m:		d => d[getMinutes](),
	// 09
	ss:		d => zeroPad2(d[getSeconds]()),
	// 9
	s:		d => d[getSeconds](),
	// 374
	fff:	d => zeroPad3(d[getMilliseconds]()),
};

function fmtDate(tpl) {
	let parts = [];

	let R = /\{([a-z]+)\}|[^{]+/gi, m;

	while (m = R.exec(tpl))
		parts.push(m[0][0] == '{' ? subs[m[1]] : m[0]);

	return d => {
		let out = '';

		for (let i = 0; i < parts.length; i++)
			out += typeof parts[i] == "string" ? parts[i] : parts[i](d);

		return out;
	}
}

// https://stackoverflow.com/questions/15141762/how-to-initialize-a-javascript-date-to-a-particular-time-zone/53652131#53652131
function tzDate(date, tz) {
	let date2 = new Date(date.toLocaleString('en-US', {timeZone: tz}));
	date2.setMilliseconds(date[getMilliseconds]());
	return date2;
}

//export const series = [];

// default formatters:

function genIncrs(minExp, maxExp, mults) {
	let incrs = [];

	for (let exp = minExp; exp < maxExp; exp++) {
		for (let i = 0; i < mults.length; i++) {
			let incr = mults[i] * pow(10, exp);
			incrs.push(+incr.toFixed(abs(exp)));
		}
	}

	return incrs;
}

const incrMults = [1,2,5];

const decIncrs = genIncrs(-12, 0, incrMults);

const intIncrs = genIncrs(0, 12, incrMults);

const numIncrs = decIncrs.concat(intIncrs);

let s = 1,
	m = 60,
	h = m * m,
	d = h * 24,
	mo = d * 30,
	y = d * 365;

// starting below 1e-3 is a hack to allow the incr finder to choose & bail out at incr < 1ms
const timeIncrs = [5e-4].concat(genIncrs(-3, 0, incrMults), [
	// minute divisors (# of secs)
	1,
	5,
	10,
	15,
	30,
	// hour divisors (# of mins)
	m,
	m * 5,
	m * 10,
	m * 15,
	m * 30,
	// day divisors (# of hrs)
	h,
	h * 2,
	h * 3,
	h * 4,
	h * 6,
	h * 8,
	h * 12,
	// month divisors TODO: need more?
	d,
	d * 2,
	d * 3,
	d * 4,
	d * 5,
	d * 6,
	d * 7,
	d * 8,
	d * 9,
	d * 10,
	d * 15,
	// year divisors (# months, approx)
	mo,
	mo * 2,
	mo * 3,
	mo * 4,
	mo * 6,
	// century divisors
	y,
	y * 2,
	y * 5,
	y * 10,
	y * 25,
	y * 50,
	y * 100,
]);

function timeAxisStamps(stampCfg) {
	return stampCfg.map(s => [
		s[0],
		fmtDate(s[1]),
		s[2],
		fmtDate(s[4] ? s[1] + s[3] : s[3]),
	]);
}

const yyyy = "{YYYY}";
const NLyyyy = "\n" + yyyy;
const md = "{M}/{D}";
const NLmd = "\n" + md;

const aa = "{aa}";
const hmm = "{h}:{mm}";
const hmmaa = hmm + aa;
const ss = ":{ss}";

// [0]: minimum num secs in the tick incr
// [1]: normal tick format
// [2]: when a differing <x> is encountered - 1: sec, 2: min, 3: hour, 4: day, 5: week, 6: month, 7: year
// [3]: use a longer more contextual format
// [4]: modes: 0: replace [1] -> [3], 1: concat [1] + [3]
const _timeAxisStamps = timeAxisStamps([
	[y,        yyyy,            7,   "",                    1],
	[d * 28,   "{MMM}",         7,   NLyyyy,                1],
	[d,        md,              7,   NLyyyy,                1],
	[h,        "{h}" + aa,      4,   NLmd,                  1],
	[m,        hmmaa,           4,   NLmd,                  1],
	[s,        ss,              2,   NLmd  + " " + hmmaa,   1],
	[1e-3,     ss + ".{fff}",   2,   NLmd  + " " + hmmaa,   1],
]);

// TODO: will need to accept spaces[] and pull incr into the loop when grid will be non-uniform, eg for log scales.
// currently we ignore this for months since they're *nearly* uniform and the added complexity is not worth it
function timeAxisVals(tzDate, stamps) {
	return (self, splits, space) => {
		let incr = round3(splits[1] - splits[0]);
		let s = stamps.find(e => incr >= e[0]);

		// these track boundaries when a full label is needed again
		let prevYear = null;
		let prevDate = null;
		let prevMinu = null;

		return splits.map((split, i) => {
			let date = tzDate(split);

			let newYear = date[getFullYear]();
			let newDate = date[getDate]();
			let newMinu = date[getMinutes]();

			let diffYear = newYear != prevYear;
			let diffDate = newDate != prevDate;
			let diffMinu = newMinu != prevMinu;

			let stamp = s[2] == 7 && diffYear || s[2] == 4 && diffDate || s[2] == 2 && diffMinu ? s[3] : s[1];

			prevYear = newYear;
			prevDate = newDate;
			prevMinu = newMinu;

			return stamp(date);
		});
	}
}

function mkDate(y, m, d) {
	return new Date(y, m, d);
}

// the ensures that axis ticks, values & grid are aligned to logical temporal breakpoints and not an arbitrary timestamp
// https://www.timeanddate.com/time/dst/
// https://www.timeanddate.com/time/dst/2019.html
// https://www.epochconverter.com/timezones
function timeAxisSplits(tzDate) {
	return (self, scaleMin, scaleMax, incr, pctSpace) => {
		let splits = [];
		let isMo = incr >= mo && incr < y;

		// get the timezone-adjusted date
		let minDate = tzDate(scaleMin);
		let minDateTs = minDate / 1e3;

		// get ts of 12am (this lands us at or before the original scaleMin)
		let minMin = mkDate(minDate[getFullYear](), minDate[getMonth](), isMo ? 1 : minDate[getDate]());
		let minMinTs = minMin / 1e3;

		if (isMo) {
			let moIncr = incr / mo;
		//	let tzOffset = scaleMin - minDateTs;		// needed?
			let split = minDateTs == minMinTs ? minDateTs : mkDate(minMin[getFullYear](), minMin[getMonth]() + moIncr, 1) / 1e3;
			let splitDate = new Date(split * 1e3);
			let baseYear = splitDate[getFullYear]();
			let baseMonth = splitDate[getMonth]();

			for (let i = 0; split <= scaleMax; i++) {
				let next = mkDate(baseYear, baseMonth + moIncr * i, 1);
				let offs = next - tzDate(next / 1e3);

				split = (+next + offs) / 1e3;

				if (split <= scaleMax)
					splits.push(split);
			}
		}
		else {
			let incr0 = incr >= d ? d : incr;
			let tzOffset = floor(scaleMin) - floor(minDateTs);
			let split = minMinTs + tzOffset + incrRoundUp(minDateTs - minMinTs, incr0);
			splits.push(split);

			let date0 = tzDate(split);

			let prevHour = date0[getHours]() + (date0[getMinutes]() / m) + (date0[getSeconds]() / h);
			let incrHours = incr / h;

			while (1) {
				split = round3(split + incr);

				let expectedHour = floor(round6(prevHour + incrHours)) % 24;
				let splitDate = tzDate(split);
				let actualHour = splitDate.getHours();

				let dstShift = actualHour - expectedHour;

				if (dstShift > 1)
					dstShift = -1;

				split -= dstShift * h;

				if (split > scaleMax)
					break;

				prevHour = (prevHour + incrHours) % 24;

				// add a tick only if it's further than 70% of the min allowed label spacing
				let prevSplit = splits[splits.length - 1];
				let pctIncr = round3((split - prevSplit) / incr);

				if (pctIncr * pctSpace >= .7)
					splits.push(split);
			}
		}

		return splits;
	}
}

function timeSeriesStamp(stampCfg) {
	return fmtDate(stampCfg);
}
const _timeSeriesStamp = timeSeriesStamp('{YYYY}-{MM}-{DD} {h}:{mm}{aa}');

function timeSeriesVal(tzDate, stamp) {
	return (self, val) => stamp(tzDate(val));
}

function cursorPoints(self) {
	return self.series.map((s, i) => {
		if (i > 0) {
			let pt = placeDiv();

			pt.style.background = s.stroke || hexBlack;

			let dia = ptDia(s.width, 1);
			let mar = (dia - 1) / -2;

			setStylePx(pt, WIDTH, dia);
			setStylePx(pt, HEIGHT, dia);
			setStylePx(pt, "marginLeft", mar);
			setStylePx(pt, "marginTop", mar);

			return pt;
		}
	});
}

const cursorOpts = {
	show: true,
	x: true,
	y: true,
	lock: false,
	points: {
		show: cursorPoints,
	},

	drag: {
		setScale: true,
		x: true,
		y: false,
	},

	locked: false,
	left: -10,
	top: -10,
	idx: null,
};

const grid = {
	show: true,
	stroke: "rgba(0,0,0,0.07)",
	width: 2,
//	dash: [],
};

const ticks = assign({}, grid, {size: 10});

const font      = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
const labelFont = "bold " + font;
const lineMult = 1.5;		// font-size multiplier

const xAxisOpts = {
	type: "x",
	show: true,
	scale: "x",
	space: 50,
	gap: 5,
	size: 50,
	labelSize: 30,
	labelFont,
	side: 2,
//	class: "x-vals",
//	incrs: timeIncrs,
//	values: timeVals,
	grid,
	ticks,
	font,
};

const numSeriesLabel = "Value";
const timeSeriesLabel = "Time";

const xSeriesOpts = {
	show: true,
	scale: "x",
//	label: "Time",
//	value: v => stamp(new Date(v * 1e3)),

	// internal caches
	min: inf,
	max: -inf,
};

// alternative: https://stackoverflow.com/a/2254896
let fmtNum = new Intl.NumberFormat(navigator.language);

function numAxisVals(self, splits, space) {
	return splits.map(fmtNum.format);
}

function numAxisSplits(self, scaleMin, scaleMax, incr, pctSpace, forceMin) {
	scaleMin = forceMin ? scaleMin : +incrRoundUp(scaleMin, incr).toFixed(12);

	let splits = [];

	for (let val = scaleMin; val <= scaleMax; val = +(val + incr).toFixed(12))
		splits.push(val);

	return splits;
}

function numSeriesVal(self, val) {
	return val;
}

const yAxisOpts = {
	type: "y",
	show: true,
	scale: "y",
	space: 40,
	gap: 5,
	size: 50,
	labelSize: 30,
	labelFont,
	side: 3,
//	class: "y-vals",
//	incrs: numIncrs,
//	values: (vals, space) => vals,
	grid,
	ticks,
	font,
};

// takes stroke width
function ptDia(width, mult) {
	return max(round3(5 * mult), round3(width * mult) * 2 - 1);
}

function seriesPoints(self, si) {
	const dia = ptDia(self.series[si].width, pxRatio);
	let maxPts = self.bbox.width / dia / 2;
	return self.idxs[1] - self.idxs[0] <= maxPts;
}

const ySeriesOpts = {
//	type: "n",
	scale: "y",
	show: true,
	band: false,
	alpha: 1,
	points: {
		show: seriesPoints,
	//	stroke: "#000",
		fill: "#fff",
	//	width: 1,
	//	size: 10,
	},
//	label: "Value",
//	value: v => v,
	values: null,

	// internal caches
	min: inf,
	max: -inf,

	path: null,
	clip: null,
};

const xScaleOpts = {
	time: true,
	auto: false,
	distr: 1,
	min:  inf,
	max: -inf,
};

const yScaleOpts = assign({}, xScaleOpts, {
	time: false,
	auto: true,
});

const syncs = {};

function _sync(opts) {
	let clients = [];

	return {
		sub(client) {
			clients.push(client);
		},
		unsub(client) {
			clients = clients.filter(c => c != client);
		},
		pub(type, self, x, y, w, h, i) {
			if (clients.length > 1) {
				clients.forEach(client => {
					client != self && client.pub(type, self, x, y, w, h, i);
				});
			}
		}
	};
}

function setDefaults(d, xo, yo) {
	return [d[0], d[1]].concat(d.slice(2)).map((o, i) => assign({}, (i == 0 || o && o.side % 2 == 0 ? xo : yo), o));
}

function getYPos(val, scale, hgt, top) {
	let pctY = (val - scale.min) / (scale.max - scale.min);
	return top + (1 - pctY) * hgt;
}

function getXPos(val, scale, wid, lft) {
	let pctX = (val - scale.min) / (scale.max - scale.min);
	return lft + pctX * wid;
}

function snapNone(self, dataMin, dataMax) {
	return [dataMin, dataMax];
}

// this ensures that non-temporal/numeric y-axes get multiple-snapped padding added above/below
// TODO: also account for incrs when snapping to ensure top of axis gets a tick & value
function snapFifthMag(self, dataMin, dataMax) {
	return rangeNum(dataMin, dataMax, 0.2, true);
}

// dim is logical (getClientBoundingRect) pixels, not canvas pixels
function findIncr(valDelta, incrs, dim, minSpace) {
	let pxPerUnit = dim / valDelta;

	for (var i = 0; i < incrs.length; i++) {
		let space = incrs[i] * pxPerUnit;

		if (space >= minSpace)
			return [incrs[i], space];
	}
}

function filtMouse(e) {
	return e.button == 0;
}

function pxRatioFont(font) {
	let fontSize;
	font = font.replace(/\d+/, m => (fontSize = round(m * pxRatio)));
	return [font, fontSize];
}

function uPlot(opts, data, then) {
	const self = this;

	opts = copy(opts);

	(opts.plugins || []).forEach(p => {
		if (p.opts)
			opts = p.opts(self, opts) || opts;
	});

	let ready = false;

	const series  = setDefaults(opts.series, xSeriesOpts, ySeriesOpts);
	const axes    = setDefaults(opts.axes || [], xAxisOpts, yAxisOpts);
	const scales  = (opts.scales = opts.scales || {});

	const gutters = assign({
		x: round(yAxisOpts.size / 2),
		y: round(xAxisOpts.size / 3),
	}, opts.gutters);

//	self.tz = opts.tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
	const tzDate = opts.tzDate || (ts => new Date(ts * 1e3));

	const _timeAxisSplits = timeAxisSplits(tzDate);
	const _timeAxisVals = timeAxisVals(tzDate, _timeAxisStamps);
	const _timeSeriesVal = timeSeriesVal(tzDate, _timeSeriesStamp);

	self.series = series;
	self.axes = axes;
	self.scales = scales;

	const pendScales = {};

	// explicitly-set initial scales
	for (let k in scales) {
		let sc = scales[k];

		if (sc.min != null || sc.max != null)
			pendScales[k] = {min: sc.min, max: sc.max};
	}

	const legendOpts = assign({show: true}, opts.legend);

	// set default value
	series.forEach((s, i) => {
		// init scales & defaults
		const scKey = s.scale;

		const sc = scales[scKey] = assign({}, (i == 0 ? xScaleOpts : yScaleOpts), scales[scKey]);

		let isTime = sc.time;

		sc.range = fnOrSelf(sc.range || (i > 0 && !isTime ? snapFifthMag : snapNone));

		s.spanGaps = s.spanGaps === true ? retArg2 : fnOrSelf(s.spanGaps || []);

		let sv = s.value;
		s.value = isTime ? (isStr(sv) ? timeSeriesVal(tzDate, timeSeriesStamp(sv)) : sv || _timeSeriesVal) : sv || numSeriesVal;
		s.label = s.label || (isTime ? timeSeriesLabel : numSeriesLabel);

		if (i > 0) {
			s.width = s.width == null ? 1 : s.width;
			s.paths = s.paths || buildPaths;
			let _ptDia = ptDia(s.width, 1);
			s.points = assign({}, {
				size: _ptDia,
				width: max(1, _ptDia * .2),
			}, s.points);
			s.points.show = fnOrSelf(s.points.show);
			s._paths = null;
		}
	});

	// dependent scales inherit
	for (let k in scales) {
		let sc = scales[k];

		if (sc.from != null)
			scales[k] = assign({}, scales[sc.from], sc);
	}

	const xScaleKey = series[0].scale;
	const xScaleDistr = scales[xScaleKey].distr;

	// set axis defaults
	axes.forEach((axis, i) => {
		if (axis.show) {
			let isVt = axis.side % 2;

			let sc = scales[axis.scale];

			// this can occur if all series specify non-default scales
			if (sc == null) {
				axis.scale = isVt ? series[1].scale : xScaleKey;
				sc = scales[axis.scale];
			}

			// also set defaults for incrs & values based on axis distr
			let isTime = sc.time;

			axis.space = fnOrSelf(axis.space);
			axis.incrs = fnOrSelf(axis.incrs || (sc.distr == 2 ? intIncrs : (isTime ? timeIncrs : numIncrs)));
			axis.split = fnOrSelf(axis.split || (sc.distr == 1 && isTime ? _timeAxisSplits : numAxisSplits));
			let av = axis.values;
			axis.values = isTime ? (isArr(av) ? timeAxisVals(tzDate, timeAxisStamps(av)) : av || _timeAxisVals) : av || numAxisVals;

			axis.font      = pxRatioFont(axis.font);
			axis.labelFont = pxRatioFont(axis.labelFont);
		}
	});

	const root = self.root = placeDiv("uplot");

	if (opts.id != null)
		root.id = opts.id;

	addClass(root, opts.class);

	if (opts.title) {
		let title = placeDiv("title", root);
		title.textContent = opts.title;
	}

	let dataLen;

	// rendered data window
	let i0 = null;
	let i1 = null;
	const idxs = self.idxs = [i0, i1];

	let data0 = null;

	function setData(_data, _autoScaleX) {
		self.data = _data;
		data = _data.slice();
		data0 = data[0];
		dataLen = data0.length;

		if (xScaleDistr == 2)
			data[0] = data0.map((v, i) => i);

		resetYSeries();

		fire("setData");

		_autoScaleX !== false && autoScaleX();
	}

	self.setData = setData;

	function autoScaleX() {
		i0 = idxs[0] = 0;
		i1 = idxs[1] = dataLen - 1;

		let _min = xScaleDistr == 2 ? i0 : data[0][i0],
			_max = xScaleDistr == 2 ? i1 : data[0][i1];

		_setScale(xScaleKey, _min, _max);
	}

	function setCtxStyle(stroke, width, dash, fill) {
		ctx.strokeStyle = stroke || hexBlack;
		ctx.lineWidth = width;
		ctx.lineJoin = "round";
		ctx.setLineDash(dash || []);
		ctx.fillStyle = fill || hexBlack;
	}

	let fullWidCss;
	let fullHgtCss;

	let plotWidCss;
	let plotHgtCss;

	// plot margins to account for axes
	let plotLftCss;
	let plotTopCss;

	let plotLft;
	let plotTop;
	let plotWid;
	let plotHgt;

	self.bbox = {};

	function _setSize(width, height) {
		self.width  = fullWidCss = plotWidCss = width;
		self.height = fullHgtCss = plotHgtCss = height;
		plotLftCss  = plotTopCss = 0;

		calcPlotRect();
		calcAxesRects();

		let bb = self.bbox;

		plotLft = bb[LEFT]   = incrRound(plotLftCss * pxRatio, 0.5);
		plotTop = bb[TOP]    = incrRound(plotTopCss * pxRatio, 0.5);
		plotWid = bb[WIDTH]  = incrRound(plotWidCss * pxRatio, 0.5);
		plotHgt = bb[HEIGHT] = incrRound(plotHgtCss * pxRatio, 0.5);

		setStylePx(under, LEFT,   plotLftCss);
		setStylePx(under, TOP,    plotTopCss);
		setStylePx(under, WIDTH,  plotWidCss);
		setStylePx(under, HEIGHT, plotHgtCss);

		setStylePx(over, LEFT,    plotLftCss);
		setStylePx(over, TOP,     plotTopCss);
		setStylePx(over, WIDTH,   plotWidCss);
		setStylePx(over, HEIGHT,  plotHgtCss);

		setStylePx(wrap, WIDTH,   fullWidCss);
		setStylePx(wrap, HEIGHT,  fullHgtCss);

		can[WIDTH]  = round(fullWidCss * pxRatio);
		can[HEIGHT] = round(fullHgtCss * pxRatio);

		ready && _setScale(xScaleKey, scales[xScaleKey].min, scales[xScaleKey].max);

		ready && fire("setSize");
	}

	function setSize({width, height}) {
		_setSize(width, height);
	}

	self.setSize = setSize;

	// accumulate axis offsets, reduce canvas width
	function calcPlotRect() {
		// easements for edge labels
		let hasTopAxis = false;
		let hasBtmAxis = false;
		let hasRgtAxis = false;
		let hasLftAxis = false;

		axes.forEach((axis, i) => {
			if (axis.show) {
				let {side, size} = axis;
				let isVt = side % 2;
				let labelSize = axis.labelSize = (axis.label != null ? (axis.labelSize || 30) : 0);

				let fullSize = size + labelSize;

				if (isVt) {
					plotWidCss -= fullSize;

					if (side == 3) {
						plotLftCss += fullSize;
						hasLftAxis = true;
					}
					else
						hasRgtAxis = true;
				}
				else {
					plotHgtCss -= fullSize;

					if (side == 0) {
						plotTopCss += fullSize;
						hasTopAxis = true;
					}
					else
						hasBtmAxis = true;
				}
			}
		});

		// hz gutters
		if (hasTopAxis || hasBtmAxis) {
			if (!hasRgtAxis)
				plotWidCss -= gutters.x;
			if (!hasLftAxis) {
				plotWidCss -= gutters.x;
				plotLftCss += gutters.x;
			}
		}

		// vt gutters
		if (hasLftAxis || hasRgtAxis) {
			if (!hasBtmAxis)
				plotHgtCss -= gutters.y;
			if (!hasTopAxis) {
				plotHgtCss -= gutters.y;
				plotTopCss += gutters.y;
			}
		}
	}

	function calcAxesRects() {
		// will accum +
		let off1 = plotLftCss + plotWidCss;
		let off2 = plotTopCss + plotHgtCss;
		// will accum -
		let off3 = plotLftCss;
		let off0 = plotTopCss;

		function incrOffset(side, size) {

			switch (side) {
				case 1: off1 += size; return off1 - size;
				case 2: off2 += size; return off2 - size;
				case 3: off3 -= size; return off3 + size;
				case 0: off0 -= size; return off0 + size;
			}
		}

		axes.forEach((axis, i) => {
			let side = axis.side;

			axis._pos = incrOffset(side, axis.size);

			if (axis.label != null)
				axis._lpos = incrOffset(side, axis.labelSize);
		});
	}

	const can = placeTag("canvas");
	const ctx = self.ctx = can.getContext("2d");

	const wrap = placeDiv("wrap", root);
	const under = placeDiv("under", wrap);
	wrap.appendChild(can);
	const over = placeDiv("over", wrap);

	function setScales() {
		if (inBatch) {
			shouldSetScales = true;
			return;
		}

	//	log("setScales()", arguments);

		// cache original scales' min/max & reset
		let minMaxes = {};

		for (let k in scales) {
			let sc = scales[k];
			let psc = pendScales[k];

			minMaxes[k] = {
				min: sc.min,
				max: sc.max
			};

			if (psc != null) {
				assign(sc, psc);

				// explicitly setting the x-scale invalidates everything (acts as redraw)
				if (k == xScaleKey)
					resetYSeries();
			}
			else if (k != xScaleKey) {
				sc.min = inf;
				sc.max = -inf;
			}
		}

		// pre-range y-scales from y series' data values
		series.forEach((s, i) => {
			let k = s.scale;
			let sc = scales[k];

			// setting the x scale invalidates everything
			if (i == 0) {
				i0 = closestIdx(sc.min, data[0]);
				i1 = closestIdx(sc.max, data[0]);

				// closest indices can be outside of view
				if (data[0][i0] < sc.min)
					i0++;
				if (data[0][i1] > sc.max)
					i1--;

				idxs[0] = i0;
				idxs[1] = i1;

				s.min = data0[i0];
				s.max = data0[i1];

				let minMax = sc.range(self, sc.min, sc.max);

				sc.min = minMax[0];
				sc.max = minMax[1];
			}
			else if (s.show && pendScales[k] == null) {
				// only run getMinMax() for invalidated series data, else reuse
				let minMax = s.min == inf ? (sc.auto ? getMinMax(data[i], i0, i1) : [0,100]) : [s.min, s.max];

				// initial min/max
				sc.min = min(sc.min, s.min = minMax[0]);
				sc.max = max(sc.max, s.max = minMax[1]);
			}
		});

		// snap non-dependent scales
		for (let k in scales) {
			let sc = scales[k];

			if (sc.from == null && sc.min != inf && pendScales[k] == null) {
				let minMax = sc.range(self, sc.min, sc.max);

				sc.min = minMax[0];
				sc.max = minMax[1];
			}

			pendScales[k] = null;
		}

		// range dependent scales
		for (let k in scales) {
			let sc = scales[k];

			if (sc.from != null) {
				let base = scales[sc.from];

				if (base.min != inf) {
					let minMax = sc.range(self, base.min, base.max);
					sc.min = minMax[0];
					sc.max = minMax[1];
				}
			}
		}

		let changed = {};

		// invalidate paths of all series on changed scales
		series.forEach((s, i) => {
			let k = s.scale;
			let sc = scales[k];

			if (minMaxes[k] != null && (sc.min != minMaxes[k].min || sc.max != minMaxes[k].max)) {
				changed[k] = true;
				s._paths = null;
			}
		});

		for (let k in changed)
			fire("setScale", k);

		cursor.show && updateCursor();
	}

	// TODO: drawWrap(si, drawPoints) (save, restore, translate, clip)

	function drawPoints(si) {
	//	log("drawPoints()", arguments);

		let s = series[si];
		let p = s.points;

		const width = round3(s[WIDTH] * pxRatio);
		const offset = (width % 2) / 2;

		let outerDia = p.size * pxRatio;
		let innerDia = p.width ? (p.size - p.width * 2) * pxRatio : null;

		ctx.translate(offset, offset);

		ctx.save();

		ctx.beginPath();
		ctx.rect(plotLft - outerDia, plotTop - outerDia, plotWid + outerDia*2, plotHgt + outerDia*2);
		ctx.clip();

		ctx.globalAlpha = s.alpha;

		let pOuter = new Path2D();
		let pInner = innerDia ? new Path2D() : null;

		for (let pi = i0; pi <= i1; pi++) {
			if (data[si][pi] != null) {
				let x = round(getXPos(data[0][pi],  scales[xScaleKey], plotWid, plotLft));
				let y = round(getYPos(data[si][pi], scales[s.scale],   plotHgt, plotTop));

				pOuter.moveTo(x + outerDia/2, y);
				pOuter.arc(x, y, outerDia/2, 0, PI * 2);

				if (innerDia) {
					pInner.moveTo(x + innerDia/2, y);
					pInner.arc(x, y, innerDia/2, 0, PI * 2);
				}
			}
		}

		// outer fill
		ctx.fillStyle = (innerDia ? p.stroke : p.fill) || s.stroke || hexBlack;
		ctx.fill(pOuter);

		if (innerDia) {
			ctx.fillStyle = p.fill || s.fill || hexBlack;
			ctx.fill(pInner);
		}

		ctx.globalAlpha = 1;

		ctx.restore();

		ctx.translate(-offset, -offset);
	}

	// grabs the nearest indices with y data outside of x-scale limits
	function getOuterIdxs(ydata) {
		let _i0 = clamp(i0 - 1, 0, dataLen - 1);
		let _i1 = clamp(i1 + 1, 0, dataLen - 1);

		while (ydata[_i0] == null && _i0 > 0)
			_i0--;

		while (ydata[_i1] == null && _i1 < dataLen - 1)
			_i1++;

		return [_i0, _i1];
	}

	let dir = 1;

	function drawSeries() {
		// path building loop must be before draw loop to ensure that all bands are fully constructed
		series.forEach((s, i) => {
			if (i > 0 && s.show && s._paths == null) {
				let _idxs = getOuterIdxs(data[i]);
				s._paths = s.paths(self, i, _idxs[0], _idxs[1]);
			}
		});

		series.forEach((s, i) => {
			if (i > 0 && s.show) {
				if (s._paths)
					drawPath(i);

				if (s.points.show(self, i))
					drawPoints(i);

				fire("drawSeries", i);
			}
		});
	}

	function drawPath(si) {
		const s = series[si];

		if (dir == 1) {
			const { stroke, fill, clip } = s._paths;
			const width = round3(s[WIDTH] * pxRatio);
			const offset = (width % 2) / 2;

			setCtxStyle(s.stroke, width, s.dash, s.fill);

			ctx.globalAlpha = s.alpha;

			ctx.translate(offset, offset);

			ctx.save();

			let lft = plotLft,
				top = plotTop,
				wid = plotWid,
				hgt = plotHgt;

			let halfWid = width * pxRatio / 2;

			if (s.min == 0)
				hgt += halfWid;

			if (s.max == 0) {
				top -= halfWid;
				hgt += halfWid;
			}

			ctx.beginPath();
			ctx.rect(lft, top, wid, hgt);
			ctx.clip();

			if (clip != null)
				ctx.clip(clip);

			if (s.band) {
				ctx.fill(stroke);
				width && ctx.stroke(stroke);
			}
			else {
				width && ctx.stroke(stroke);

				if (s.fill != null)
					ctx.fill(fill);
			}

			ctx.restore();

			ctx.translate(-offset, -offset);

			ctx.globalAlpha = 1;
		}

		if (s.band)
			dir *= -1;
	}

	function buildClip(s, gaps) {
		let toSpan = new Set(s.spanGaps(self, gaps));
		gaps = gaps.filter(g => !toSpan.has(g));

		let clip = null;

		// create clip path (invert gaps and non-gaps)
		if (gaps.length > 0) {
			clip = new Path2D();

			let prevGapEnd = plotLft;

			for (let i = 0; i < gaps.length; i++) {
				let g = gaps[i];

				clip.rect(prevGapEnd, plotTop, g[0] - prevGapEnd, plotTop + plotHgt);

				prevGapEnd = g[1];
			}

			clip.rect(prevGapEnd, plotTop, plotLft + plotWid - prevGapEnd, plotTop + plotHgt);
		}

		return clip;
	}

	function buildPaths(self, is, _i0, _i1) {
		const s = series[is];

		const xdata  = data[0];
		const ydata  = data[is];
		const scaleX = scales[xScaleKey];
		const scaleY = scales[s.scale];

		const _paths = dir == 1 ? {stroke: new Path2D(), fill: null, clip: null} : series[is-1]._paths;
		const stroke = _paths.stroke;
		const width = round3(s[WIDTH] * pxRatio);

		let minY = inf,
			maxY = -inf,
			outY, outX;

		// todo: don't build gaps on dir = -1 pass
		let gaps = [];

		let accX = round(getXPos(xdata[dir == 1 ? _i0 : _i1], scaleX, plotWid, plotLft));

		// the moves the shape edge outside the canvas so stroke doesnt bleed in
		if (s.band && dir == 1 && _i0 == i0) {
			if (width)
				stroke.lineTo(-width, round(getYPos(ydata[_i0], scaleY, plotHgt, plotTop)));

			if (scaleX.min < xdata[0])
				gaps.push([plotLft, accX - 1]);
		}

		for (let i = dir == 1 ? _i0 : _i1; i >= _i0 && i <= _i1; i += dir) {
			let x = round(getXPos(xdata[i], scaleX, plotWid, plotLft));

			if (x == accX) {
				if (ydata[i] != null) {
					outY = round(getYPos(ydata[i], scaleY, plotHgt, plotTop));
					minY = min(outY, minY);
					maxY = max(outY, maxY);
				}
			}
			else {
				let addGap = false;

				if (minY != inf) {
					stroke.lineTo(accX, minY);
					stroke.lineTo(accX, maxY);
					stroke.lineTo(accX, outY);
					outX = accX;
				}
				else
					addGap = true;

				if (ydata[i] != null) {
					outY = round(getYPos(ydata[i], scaleY, plotHgt, plotTop));
					stroke.lineTo(x, outY);
					minY = maxY = outY;

					// prior pixel can have data but still start a gap if ends with null
					if (x - accX > 1 && ydata[i-1] == null)
						addGap = true;
				}
				else {
					minY = inf;
					maxY = -inf;
				}

				if (addGap) {
					let prevGap = gaps[gaps.length - 1];

					if (prevGap && prevGap[0] == outX)			// TODO: gaps must be encoded at stroke widths?
						prevGap[1] = x;
					else
						gaps.push([outX, x]);
				}

				accX = x;
			}
		}

		if (s.band) {
			let overShoot = width * 100, _iy, _x;

			// the moves the shape edge outside the canvas so stroke doesnt bleed in
			if (dir == -1 && _i0 == i0) {
				_x = plotLft - overShoot;
				_iy = _i0;
			}

			if (dir == 1 && _i1 == i1) {
				_x = plotLft + plotWid + overShoot;
				_iy = _i1;

				if (scaleX.max > xdata[dataLen - 1])
					gaps.push([accX, plotLft + plotWid]);
			}

			stroke.lineTo(_x, round(getYPos(ydata[_iy], scaleY, plotHgt, plotTop)));
		}

		if (dir == 1) {
			_paths.clip = buildClip(s, gaps);

			if (s.fill != null) {
				let fill = _paths.fill = new Path2D(stroke);

				let zeroY = round(getYPos(0, scaleY, plotHgt, plotTop));
				fill.lineTo(plotLft + plotWid, zeroY);
				fill.lineTo(plotLft, zeroY);
			}
		}

		if (s.band)
			dir *= -1;

		return _paths;
	}

	function getIncrSpace(axis, min, max, canDim) {
		let minSpace = axis.space(self, min, max, canDim);
		let incrs = axis.incrs(self, min, max, canDim, minSpace);
		let incrSpace = findIncr(max - min, incrs, canDim, minSpace);
		incrSpace.push(incrSpace[1]/minSpace);
		return incrSpace;
	}

	function drawOrthoLines(offs, ori, side, pos0, len, width, stroke, dash) {
		let offset = (width % 2) / 2;

		ctx.translate(offset, offset);

		setCtxStyle(stroke, width, dash);

		ctx.beginPath();

		let x0, y0, x1, y1, pos1 = pos0 + (side == 0 || side == 3 ? -len : len);

		if (ori == 0) {
			y0 = pos0;
			y1 = pos1;
		}
		else {
			x0 = pos0;
			x1 = pos1;
		}

		offs.forEach((off, i) => {
			if (ori == 0)
				x0 = x1 = off;
			else
				y0 = y1 = off;

			ctx.moveTo(x0, y0);
			ctx.lineTo(x1, y1);
		});

		ctx.stroke();

		ctx.translate(-offset, -offset);
	}

	function drawAxesGrid() {
		axes.forEach((axis, i) => {
			if (!axis.show)
				return;

			let scale = scales[axis.scale];

			// this will happen if all series using a specific scale are toggled off
			if (scale.min == inf)
				return;

			let side = axis.side;
			let ori = side % 2;

			let {min, max} = scale;

			let [incr, space, pctSpace] = getIncrSpace(axis, min, max, ori == 0 ? plotWidCss : plotHgtCss);

			// if we're using index positions, force first tick to match passed index
			let forceMin = scale.distr == 2;

			let splits = axis.split(self, min, max, incr, pctSpace, forceMin);

			let getPos  = ori == 0 ? getXPos : getYPos;
			let plotDim = ori == 0 ? plotWid : plotHgt;
			let plotOff = ori == 0 ? plotLft : plotTop;

			let canOffs = splits.map(val => round(getPos(val, scale, plotDim, plotOff)));

			let axisGap  = round(axis.gap * pxRatio);

			let ticks = axis.ticks;
			let tickSize = ticks.show ? round(ticks.size * pxRatio) : 0;

			// tick labels
			let values = axis.values(self, scale.distr == 2 ? splits.map(i => data0[i]) : splits, space);		// BOO this assumes a specific data/series

			let basePos  = round(axis._pos * pxRatio);
			let shiftAmt = tickSize + axisGap;
			let shiftDir = ori == 0 && side == 0 || ori == 1 && side == 3 ? -1 : 1;
			let finalPos = basePos + shiftAmt * shiftDir;
			let y        = ori == 0 ? finalPos : 0;
			let x        = ori == 1 ? finalPos : 0;

			ctx.font         = axis.font[0];
			ctx.fillStyle    = axis.stroke || hexBlack;									// rgba?
			ctx.textAlign    = ori == 0 ? "center" : side == 3 ? RIGHT : LEFT;
			ctx.textBaseline = ori == 1 ? "middle" : side == 2 ? TOP   : BOTTOM;

			let lineHeight   = axis.font[1] * lineMult;

			canOffs.forEach((off, i) => {
				if (ori == 0)
					x = off;
				else
					y = off;

				(""+values[i]).split(/\n/gm).forEach((text, j) => {
					ctx.fillText(text, x, y + j * lineHeight);
				});
			});

			// axis label
			if (axis.label) {
				ctx.save();

				let baseLpos = round(axis._lpos * pxRatio);

				if (ori == 1) {
					x = y = 0;

					ctx.translate(
						baseLpos,
						round(plotTop + plotHgt / 2),
					);
					ctx.rotate((side == 3 ? -PI : PI) / 2);

				}
				else {
					x = round(plotLft + plotWid / 2);
					y = baseLpos;
				}

				ctx.font         = axis.labelFont[0];
			//	ctx.fillStyle    = axis.labelStroke || hexBlack;						// rgba?
				ctx.textAlign    = "center";
				ctx.textBaseline = side == 2 ? TOP : BOTTOM;

				ctx.fillText(axis.label, x, y);

				ctx.restore();
			}

			// ticks
			if (ticks.show) {
				drawOrthoLines(
					canOffs,
					ori,
					side,
					basePos,
					tickSize,
					round3(ticks[WIDTH] * pxRatio),
					ticks.stroke,
				);
			}

			// grid
			let grid = axis.grid;

			if (grid.show) {
				drawOrthoLines(
					canOffs,
					ori,
					ori == 0 ? 2 : 1,
					ori == 0 ? plotTop : plotLft,
					ori == 0 ? plotHgt : plotWid,
					round3(grid[WIDTH] * pxRatio),
					grid.stroke,
					grid.dash,
				);
			}
		});

		fire("drawAxes");
	}

	function resetYSeries() {
	//	log("resetYSeries()", arguments);

		series.forEach((s, i) => {
			if (i > 0) {
				s.min = inf;
				s.max = -inf;
				s._paths = null;
			}
		});
	}

	let didPaint;

	function paint() {
		if (inBatch) {
			shouldPaint = true;
			return;
		}

	//	log("paint()", arguments);

		ctx.clearRect(0, 0, can[WIDTH], can[HEIGHT]);
		fire("drawClear");
		drawAxesGrid();
		drawSeries();
		didPaint = true;
		fire("draw");
	}

	self.redraw = paint;

	// redraw() => setScale('x', scales.x.min, scales.x.max);

	// explicit, never re-ranged (is this actually true? for x and y)
	function setScale(key, opts) {
		let sc = scales[key];

		if (sc.from == null) {
			// prevent setting a temporal x scale too small since Date objects cannot advance ticks smaller than 1ms
			if (key == xScaleKey && sc.time && axes[0].show) {
				// since scales and axes are loosly coupled, we have to make some assumptions here :(
				let incr = getIncrSpace(axes[0], opts.min, opts.max, plotWidCss)[0];

				if (incr < 1e-3)
					return;
			}

		//	log("setScale()", arguments);

			pendScales[key] = opts;

			didPaint = false;
			setScales();
			!didPaint && paint();
			didPaint = false;
		}
	}

	self.setScale = setScale;

//	INTERACTION

	let vt;
	let hz;

	// starting position
	let mouseLeft0;
	let mouseTop0;

	// current position
	let mouseLeft1;
	let mouseTop1;

	let dragging = false;

	const cursor = self.cursor = assign({}, cursorOpts, opts.cursor);

	cursor.points.show = fnOrSelf(cursor.points.show);

	const focus = cursor.focus;		// focus: {alpha, prox}
	const drag = cursor.drag;

	if (cursor.show) {
		let c = "cursor-";

		if (cursor.x) {
			mouseLeft1 = cursor.left;
			vt = placeDiv(c + "x", over);
		}

		if (cursor.y) {
			mouseTop1 = cursor.top;
			hz = placeDiv(c + "y", over);
		}
	}

	const select = placeDiv("select", over);

	const _select = self.select = {
		left:	0,
		width:	0,
		top:	0,
		height:	0,
	};

	function setSelect(opts, _fire) {
		if (opts[WIDTH] == null && drag.y)
			opts[WIDTH] = plotWidCss;

		if (opts[HEIGHT] == null && drag.x)
			opts[HEIGHT] = plotHgtCss;

		for (let prop in opts)
			setStylePx(select, prop, _select[prop] = opts[prop]);

		_fire !== false && fire("setSelect");
	}

	self.setSelect = setSelect;

	let legend = null;
	let legendRows = null;
	let multiValLegend = false;

	if (legendOpts.show) {
		legend = placeTag("table", "legend", root);

		let vals = series[1].values;
		multiValLegend = vals != null;

		let keys;

		if (multiValLegend) {
			let head = placeTag("tr", "labels", legend);
			placeTag("th", null, head);
			keys = vals(0);

			for (var key in keys)
				placeTag("th", null, head).textContent = key;
		}
		else {
			keys = {_: 0};
			addClass(legend, "inline");
		}

		legendRows = series.map((s, i) => {
			if (i == 0 && multiValLegend)
				return null;

			let _row = [];

			let row = placeTag("tr", "series", legend);

			addClass(row, s.class);

			if (!s.show)
				addClass(row, "off");

			let label = placeTag("th", null, row);

			let indic = placeDiv("ident", label);
			s.width && (indic.style.borderColor = s.stroke);
			indic.style.backgroundColor = s.fill;

			let text = placeDiv("text", label);
			text.textContent = s.label;

			if (i > 0) {
				on("click", label, e => {
					if (cursor.locked)
						return;

					filtMouse(e) && setSeries(i, {show: !s.show}, syncOpts.setSeries);
				});

				if (focus) {
					on("mouseenter", label, e => {
						if (cursor.locked)
							return;

						setSeries(i, {focus: true}, syncOpts.setSeries);
					});
				}
			}

			for (var key in keys) {
				let v = placeTag("td", null, row);
				v.textContent = "--";
				_row.push(v);
			}

			return _row;
		});
	}

	function toggleDOM(i, onOff) {
		let s = series[i];
		let label = legendOpts.show ? legendRows[i][0].parentNode : null;

		if (s.show)
			label && remClass(label, "off");
		else {
			label && addClass(label, "off");
			cursorPts && trans(cursorPts[i], 0, -10);
		}
	}

	function _setScale(key, min, max) {
		setScale(key, {min, max});
	}

	function setSeries(i, opts, pub) {
	//	log("setSeries()", arguments);

		let s = series[i];

	//	batch(() => {
			// will this cause redundant paint() if both show and focus are set?
			if (opts.focus != null)
				setFocus(i);

			if (opts.show != null) {
				s.show = opts.show;
				toggleDOM(i, opts.show);

				if (s.band) {
					// not super robust, will break if two bands are adjacent
					let ip = series[i+1] && series[i+1].band ? i+1 : i-1;
					series[ip].show = s.show;
					toggleDOM(ip, opts.show);
				}

				_setScale(xScaleKey, scales[xScaleKey].min, scales[xScaleKey].max);		// redraw
			}
	//	});

		// firing setSeries after setScale seems out of order, but provides access to the updated props
		// could improve by predefining firing order and building a queue
		fire("setSeries", i, opts);

		pub && sync.pub("setSeries", self, i, opts);
	}

	self.setSeries = setSeries;

	function _alpha(i, value) {
		series[i].alpha = value;

		if (legendRows)
			legendRows[i][0].parentNode.style.opacity = value;
	}

	function _setAlpha(i, value) {
		let s = series[i];

		_alpha(i, value);

		if (s.band) {
			// not super robust, will break if two bands are adjacent
			let ip = series[i+1].band ? i+1 : i-1;
			_alpha(ip, value);
		}
	}

	// y-distance
	const distsToCursor = Array(series.length);

	let focused = null;

	function setFocus(i) {
		if (i != focused) {
		//	log("setFocus()", arguments);

			series.forEach((s, i2) => {
				_setAlpha(i2, i == null || i2 == 0 || i2 == i ? 1 : focus.alpha);
			});

			focused = i;
			paint();
		}
	}

	if (focus && legendOpts.show) {
		on(mouseleave, legend, e => {
			if (cursor.locked)
				return;
			setSeries(null, {focus: false}, syncOpts.setSeries);
			updateCursor();
		});
	}

	// series-intersection markers
	let cursorPts = cursor.points.show(self);

	if (cursorPts) {
		cursorPts.forEach((pt, i) => {
			if (i > 0) {
				addClass(pt, "cursor-pt");
				addClass(pt, series[i].class);
				trans(pt, -10, -10);
				over.appendChild(pt);
			}
		});
	}

	let cursorRaf = 0;

	function scaleValueAtPos(pos, scale) {
		let dim = scale == xScaleKey ? plotWidCss : plotHgtCss;
		let pct = clamp(pos / dim, 0, 1);

		let sc = scales[scale];
		let d = sc.max - sc.min;
		return sc.min + pct * d;
	}

	function closestIdxFromXpos(pos) {
		let v = scaleValueAtPos(pos, xScaleKey);
		return closestIdx(v, data[0], i0, i1);
	}

	self.posToIdx = closestIdxFromXpos;
	self.posToVal = (pos, scale) => scaleValueAtPos(scale == xScaleKey ? pos : plotHgtCss - pos, scale);
	self.valToPos = (val, scale, can) => (
		scale == xScaleKey ?
		getXPos(val, scales[scale],
			can ? plotWid : plotWidCss,
			can ? plotLft : 0,
		) :
		getYPos(val, scales[scale],
			can ? plotHgt : plotHgtCss,
			can ? plotTop : 0,
		)
	);

	let inBatch = false;
	let shouldPaint = false;
	let shouldSetScales = false;
	let shouldUpdateCursor = false;

	// defers calling expensive functions
	function batch(fn) {
		inBatch = true;
		fn(self);
		inBatch = false;
		shouldSetScales && setScales();
		shouldUpdateCursor && updateCursor();
		shouldPaint && !didPaint && paint();
		shouldSetScales = shouldUpdateCursor = shouldPaint = didPaint = inBatch;
	}

	self.batch = batch;

	self.setCursor = opts => {
		mouseLeft1 = opts.left;
		mouseTop1 = opts.top;
	//	assign(cursor, opts);
		updateCursor();
	};

	function updateCursor(ts) {
		if (inBatch) {
			shouldUpdateCursor = true;
			return;
		}

	//	ts == null && log("updateCursor()", arguments);

		cursorRaf = 0;

		if (cursor.show) {
			cursor.x && trans(vt,round(mouseLeft1),0);
			cursor.y && trans(hz,0,round(mouseTop1));
		}

		let idx;

		// if cursor hidden, hide points & clear legend vals
		if (mouseLeft1 < 0) {
			idx = null;

			for (let i = 0; i < series.length; i++) {
				if (i > 0) {
					distsToCursor[i] = inf;
					cursorPts && trans(cursorPts[i], -10, -10);
				}

				if (legendOpts.show) {
					if (i == 0 && multiValLegend)
						continue;

					for (let j = 0; j < legendRows[i].length; j++)
						legendRows[i][j][firstChild].nodeValue = '--';
				}
			}

			if (focus)
				setSeries(null, {focus: true}, syncOpts.setSeries);
		}
		else {
		//	let pctY = 1 - (y / rect[HEIGHT]);

			idx = closestIdxFromXpos(mouseLeft1);

			let scX = scales[xScaleKey];

			let xPos = round3(getXPos(data[0][idx], scX, plotWidCss, 0));

			for (let i = 0; i < series.length; i++) {
				let s = series[i];

				if (i > 0 && s.show) {
					let valAtIdx = data[i][idx];

					let yPos = valAtIdx == null ? -10 : round3(getYPos(valAtIdx, scales[s.scale], plotHgtCss, 0));

					distsToCursor[i] = yPos > 0 ? abs(yPos - mouseTop1) : inf;

					cursorPts && trans(cursorPts[i], xPos, yPos);
				}
				else
					distsToCursor[i] = inf;

				if (legendOpts.show) {
					if (i == 0 && multiValLegend)
						continue;

					let src = i == 0 && xScaleDistr == 2 ? data0 : data[i];

					let vals = multiValLegend ? s.values(self, idx) : {_: s.value(self, src[idx], idx, i)};

					let j = 0;

					for (let k in vals)
						legendRows[i][j++][firstChild].nodeValue = vals[k];
				}
			}

			if (dragging) {
				// setSelect should not be triggered on move events
				if (drag.x) {
					let minX = min(mouseLeft0, mouseLeft1);
					let maxX = max(mouseLeft0, mouseLeft1);
					setStylePx(select, LEFT, _select[LEFT] = minX);
					setStylePx(select, WIDTH, _select[WIDTH] = maxX - minX);
				}

				if (drag.y) {
					let minY = min(mouseTop0, mouseTop1);
					let maxY = max(mouseTop0, mouseTop1);
					setStylePx(select, TOP, _select[TOP] = minY);
					setStylePx(select, HEIGHT, _select[HEIGHT] = maxY - minY);
				}
			}
		}

		// if ts is present, means we're implicitly syncing own cursor as a result of debounced rAF
		if (ts != null) {
			// this is not technically a "mousemove" event, since it's debounced, rename to setCursor?
			// since this is internal, we can tweak it later
			sync.pub(mousemove, self, mouseLeft1, mouseTop1, plotWidCss, plotHgtCss, idx);

			if (focus) {
				let minDist = min.apply(null, distsToCursor);

				let fi = null;

				if (minDist <= focus.prox) {
					distsToCursor.some((dist, i) => {
						if (dist == minDist)
							return fi = i;
					});
				}

				setSeries(fi, {focus: true}, syncOpts.setSeries);
			}
		}

		cursor.idx = idx;
		cursor.left = mouseLeft1;
		cursor.top = mouseTop1;

		ready && fire("setCursor");
	}

	let rect = null;

	function syncRect() {
		rect = over.getBoundingClientRect();
	}

	function mouseMove(e, src, _x, _y, _w, _h, _i) {
		if (cursor.locked)
			return;

		if (rect == null)
			syncRect();

		cacheMouse(e, src, _x, _y, _w, _h, _i, false, e != null);

		if (e != null) {
			if (cursorRaf == 0)
				cursorRaf = rAF(updateCursor);
		}
		else
			updateCursor();
	}

	function cacheMouse(e, src, _x, _y, _w, _h, _i, initial, snap) {
		if (e != null) {
			_x = e.clientX - rect.left;
			_y = e.clientY - rect.top;
		}
		else {
			_x = plotWidCss * (_x/_w);
			_y = plotHgtCss * (_y/_h);
		}

		if (snap) {
			if (_x <= 1 || _x >= plotWidCss - 1)
				_x = incrRound(_x, plotWidCss);

			if (_y <= 1 || _y >= plotHgtCss - 1)
				_y = incrRound(_y, plotHgtCss);
		}

		if (initial) {
			mouseLeft0 = _x;
			mouseTop0 = _y;
		}
		else {
			mouseLeft1 = _x;
			mouseTop1 = _y;
		}
	}

	function hideSelect() {
		setSelect({
			width:	!drag.x ? plotWidCss : 0,
			height:	!drag.y ? plotHgtCss : 0,
		}, false);
	}

	function mouseDown(e, src, _x, _y, _w, _h, _i) {
		if (e == null || filtMouse(e)) {
			dragging = true;

			cacheMouse(e, src, _x, _y, _w, _h, _i, true, true);

			if (drag.x || drag.y)
				hideSelect();

			if (e != null) {
				on(mouseup, doc, mouseUp);
				sync.pub(mousedown, self, mouseLeft0, mouseTop0, plotWidCss, plotHgtCss, null);
			}
		}
	}

	function mouseUp(e, src, _x, _y, _w, _h, _i) {
		if ((e == null || filtMouse(e))) {
			dragging = false;

			cacheMouse(e, src, _x, _y, _w, _h, _i, false, true);

			if (mouseLeft1 != mouseLeft0 || mouseTop1 != mouseTop0) {
				setSelect(_select);

				if (drag.setScale) {
					batch(() => {
						if (drag.x) {
							let fn = xScaleDistr == 2 ? closestIdxFromXpos : scaleValueAtPos;

							_setScale(xScaleKey,
								fn(_select[LEFT], xScaleKey),
								fn(_select[LEFT] + _select[WIDTH], xScaleKey),
							);
						}

						if (drag.y) {
							for (let k in scales) {
								let sc = scales[k];

								if (k != xScaleKey && sc.from == null) {
									_setScale(k,
										scaleValueAtPos(plotHgtCss - _select[TOP] - _select[HEIGHT], k),
										scaleValueAtPos(plotHgtCss - _select[TOP], k),
									);
								}
							}
						}
					});

					hideSelect();
				}
			}
			else if (cursor.lock) {
				cursor.locked = !cursor.locked;

				if (!cursor.locked)
					updateCursor();
			}

			if (e != null) {
				off(mouseup, doc, mouseUp);
				sync.pub(mouseup, self, mouseLeft1, mouseTop1, plotWidCss, plotHgtCss, null);
			}
		}
	}

	function mouseLeave(e, src, _x, _y, _w, _h, _i) {
		if (!cursor.locked && !dragging) {
			mouseLeft1 = -10;
			mouseTop1 = -10;
			// passing a non-null timestamp to force sync/mousemove event
			updateCursor(1);
		}
	}

	function dblClick(e, src, _x, _y, _w, _h, _i) {
		autoScaleX();

		if (e != null)
			sync.pub(dblclick, self, mouseLeft1, mouseTop1, plotWidCss, plotHgtCss, null);
	}

	// internal pub/sub
	const events = {};

	events[mousedown] = mouseDown;
	events[mousemove] = mouseMove;
	events[mouseup] = mouseUp;
	events[dblclick] = dblClick;
	events["setSeries"] = (e, src, idx, opts) => {
		setSeries(idx, opts);
	};

	let deb;

	if (cursor.show) {
		on(mousedown, over, mouseDown);
		on(mousemove, over, mouseMove);
		on(mouseleave, over, mouseLeave);
		drag.setScale && on(dblclick, over, dblClick);

		deb = debounce(syncRect, 100);

		on(resize, win, deb);
		on(scroll, win, deb);
	}

	// external on/off
	const hooks = self.hooks = opts.hooks || {};

	const evArg0 = [self];

	function fire(evName) {
		if (evName in hooks) {
			let args2 = evArg0.concat(Array.prototype.slice.call(arguments, 1));

			hooks[evName].forEach(fn => {
				fn.apply(null, args2);
			});
		}
	}

	(opts.plugins || []).forEach(p => {
		for (let evName in p.hooks)
			hooks[evName] = (hooks[evName] || []).concat(p.hooks[evName]);
	});

	const syncOpts = assign({
		key: null,
		setSeries: false,
	}, cursor.sync);

	const syncKey = syncOpts.key;

	const sync = syncKey != null ? (syncs[syncKey] = syncs[syncKey] || _sync()) : _sync();

	sync.sub(self);

	function pub(type, src, x, y, w, h, i) {
		events[type](null, src, x, y, w, h, i);
	}

	self.pub = pub;

	function destroy() {
		sync.unsub(self);
		off(resize, win, deb);
		off(scroll, win, deb);
		root.remove();
		fire("destroy");
	}

	self.destroy = destroy;

	function _init() {
		_setSize(opts[WIDTH], opts[HEIGHT]);

		fire("init", opts, data);

		setData(data || opts.data, false);

		if (pendScales[xScaleKey])
			setScale(xScaleKey, pendScales[xScaleKey]);
		else
			autoScaleX();

		setSelect(_select, false);

		ready = true;

		fire("ready");
	}

	if (then) {
		if (then instanceof HTMLElement) {
			then.appendChild(root);
			_init();
		}
		else
			then(self, _init);
	}
	else
		_init();
}

uPlot.assign = assign;
uPlot.tzDate = tzDate;
uPlot.fmtDate = fmtDate;
uPlot.assign = assign;
uPlot.rangeNum = rangeNum;

class StatsGraphChartJS {
    constructor(name, fg, bg, width) {
        this.percentage = false;
        this.expanded = false;
        this.min = Number.POSITIVE_INFINITY;
        this.max = 0;
        this.pr = 1;
        const pr = Math.round(window.devicePixelRatio || 1);
        this.pr = pr;
        const div = document.createElement('div');
        div.style.width = '40%';
        div.style.height = '64px';
        div.style.backgroundColor = '#222035';
        div.style.overflow = 'hidden';
        div.style.position = 'relative';
        div.style.cursor = 'pointer';
        const title = document.createElement('p');
        title.style.padding = '0';
        title.style.margin = '0';
        title.style.color = fg;
        title.style.fontWeight = 'bold';
        title.style.fontFamily = "Consolas, 'Courier New', Courier, monospace";
        title.style.fontSize = '12px';
        title.innerText = name;
        div.appendChild(title);
        this.bg = bg;
        this.fg = fg;
        this.div = div;
        this.title = title;
        this.name = name;
        div.addEventListener('click', () => {
            if (this.expanded) {
                this.collapse();
            }
            else {
                this.expand();
            }
        });
        let data = [
            [],
            []
        ];
        const opts = {
            width: width,
            height: 48,
            id: name,
            scales: {
                x: {
                    time: false
                },
                _y: {
                    range: [0, 100]
                }
            },
            cursor: {
                show: false
            },
            legend: {
                show: false,
            },
            axes: [
                {
                    show: false,
                },
                {
                    show: false,
                    label: '',
                    labelSize: 0,
                    _gap: 5,
                    _size: 50,
                    _stroke: "red",
                    grid: {
                        show: true,
                        stroke: "#eee",
                    },
                    ticks: {
                        show: false,
                    }
                }
            ],
            series: [
                {},
                {
                    stroke: fg,
                    _fill: '#b3e5fc'
                }
            ]
        };
        this.chart = new uPlot(opts, data, div);
        console.log(this.chart);
    }
    collapse() {
        this.div.style.width = '40%';
        this.expanded = false;
    }
    expand() {
        this.div.style.width = '100%';
        this.expanded = true;
    }
    update(value, maxValue, now) {
        this.min = Math.min(this.min, value);
        this.max = Math.max(this.max, value);
        const data = this.chart.data;
        const time = data[0];
        const values = data[1];
        time.push(now);
        values.push(value);
        if (time.length === 60 * 60) {
            time.shift();
            values.shift();
        }
        this.chart.setData(data);
        //  Title
        const title = this.title;
        let displayValue = Math.round(value).toString();
        if (this.percentage) {
            displayValue = displayValue.padStart(3, ' ');
            title.innerText = this.name + ' ' + displayValue + '%';
        }
        else {
            title.innerText = displayValue + ' ' + this.name + ' (' + Math.round(this.min) + '-' + Math.round(this.max) + ')';
        }
    }
}

const uPlotCSS = `
.uplot,
.uplot *,
.uplot *::before,
.uplot *::after {
	box-sizing: border-box;
}

.uplot {
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
	line-height: 1.5;
	width: max-content;
}

.uplot .title {
	text-align: center;
	font-size: 18px;
	font-weight: bold;
}

.uplot .wrap {
	position: relative;
	user-select: none;
}

.uplot .over,
.uplot .under {
	position: absolute;
	overflow: hidden;
}

.uplot canvas {
	display: block;
	position: relative;
	width: 100%;
	height: 100%;
}

.uplot .legend {
	font-size: 14px;
	margin: auto;
	text-align: center;
}

.uplot .legend.inline {
	display: block;
}

.uplot .legend.inline * {
	display: inline-block;
}

.uplot .legend.inline tr {
	margin-right: 16px;
}

.uplot .legend th {
	font-weight: 600;
}

.uplot .legend th > * {
	vertical-align: middle;
	display: inline-block;
}

.uplot .legend .ident {
	width: 1em;
	height: 1em;
	margin-right: 4px;
	border: 2px solid transparent;
}

.uplot .legend.inline th::after {
	content: ":";
	vertical-align: middle;
}

.uplot .legend .series > * {
	padding: 4px;
}

.uplot .legend .series th {
	cursor: pointer;
}

.uplot .legend .off > * {
	opacity: 0.3;
}

.uplot .select {
	background: rgba(0,0,0,0.07);
	position: absolute;
	pointer-events: none;
}

.uplot .select.off {
	display: none;
}

.uplot .cursor-x,
.uplot .cursor-y {
	position: absolute;
	left: 0;
	top: 0;
	pointer-events: none;
	will-change: transform;
	z-index: 100;
}

.uplot .cursor-x {
	height: 100%;
	border-right: 1px dashed #607D8B;
}

.uplot .cursor-y {
	width: 100%;
	border-bottom: 1px dashed #607D8B;
}

.uplot .cursor-pt {
	position: absolute;
	top: 0;
	left: 0;
	border-radius: 50%;
	filter: brightness(85%);
	pointer-events: none;
	will-change: transform;
	z-index: 100;
}
`;
class Stats {
    constructor(game, align = 'top') {
        this.width = 0;
        this.beginTime = 0;
        this.prevTime = 0;
        this.prevTime500 = 0;
        this.frames = 0;
        this.totalDirtyRenders = 0;
        this.totalCachedRenders = 0;
        this.game = game;
        this.renderer = game.renderer;
        const bounds = game.renderer.canvas.getBoundingClientRect();
        const div = document.createElement('div');
        div.style.width = `${bounds.width}px`;
        div.style.height = '64px';
        div.style.display = 'flex';
        div.style.position = 'absolute';
        div.style.zIndex = '10000';
        div.style.left = `${bounds.left}px`;
        if (align === 'top') {
            div.style.top = `${bounds.top}px`;
        }
        else if (align === 'bottom') {
            div.style.top = (bounds.bottom - 64) + 'px';
        }
        else if (align === 'base') {
            div.style.top = `${bounds.bottom}px`;
        }
        this.width = bounds.width;
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = uPlotCSS;
        document.body.appendChild(style);
        this.fpsPanel = new StatsGraphChartJS('FPS', '#0ff', '#002', this.width);
        this.renderPanel = new StatsGraph('Cached Frames', '#0f0', '#020', this.width);
        this.cachePanel = new StatsGraph('Cached Sprites', '#f08', '#201', this.width);
        this.displayTreePanel = new StatsTree(this);
        this.renderPanel.percentage = true;
        this.cachePanel.percentage = true;
        this.buttons = this.createButtons();
        div.appendChild(this.buttons);
        div.appendChild(this.fpsPanel.div);
        // div.appendChild(this.renderPanel.div);
        // div.appendChild(this.cachePanel.div);
        AddToDOM(div);
        AddToDOM(this.displayTreePanel.div);
        this.parent = div;
        game.on('step', () => {
            this.begin();
        });
        game.on('render', (delta, now) => {
            this.end(delta, now);
        });
    }
    createButtons() {
        const div = document.createElement('div');
        div.style.width = '64px';
        div.style.height = '64px';
        div.style.position = 'relative';
        div.style.cursor = 'pointer';
        div.style.flexShrink = '0';
        const playButton = document.createElement('button');
        playButton.style.width = '64px';
        playButton.style.height = '32px';
        playButton.style.cursor = 'pointer';
        playButton.innerText = '⏸️';
        div.appendChild(playButton);
        playButton.addEventListener('click', () => {
            if (this.game.isPaused) {
                this.game.resume();
                playButton.innerText = '⏸️';
            }
            else {
                this.game.pause();
                playButton.innerText = '▶️';
            }
        });
        const debugButton = document.createElement('button');
        debugButton.style.width = '64px';
        debugButton.style.height = '32px';
        debugButton.style.cursor = 'pointer';
        debugButton.innerText = 'debug';
        div.appendChild(debugButton);
        debugButton.addEventListener('click', () => {
            this.toggleDebugPanel();
        });
        return div;
    }
    toggleDebugPanel() {
        if (this.displayTreePanel.visible) {
            this.displayTreePanel.hide();
        }
        else {
            this.displayTreePanel.show();
        }
    }
    begin() {
        this.beginTime = performance.now();
    }
    end(delta, time) {
        this.frames++;
        // const time = performance.now();
        if (this.game.dirtyFrame === 0) {
            this.totalCachedRenders++;
        }
        else {
            this.totalDirtyRenders++;
        }
        //  Compute the new exponential moving average with an alpha of 0.25.
        // this.actualFps = 0.25 * this.framesThisSecond + 0.75 * this.actualFps;
        if (time >= this.prevTime500 + 500) {
            const total = this.game.totalFrame;
            const dirty = this.game.dirtyFrame;
            const cached = total - dirty;
            if (cached + dirty === 0) {
                this.cachePanel.update(100, 100);
            }
            else {
                this.cachePanel.update((cached / (cached + dirty)) * 100, 100);
            }
            const cacheUse = this.totalCachedRenders / (this.totalCachedRenders + this.totalDirtyRenders);
            this.renderPanel.update(cacheUse * 100, 100);
            this.prevTime500 = time;
            this.totalDirtyRenders = 0;
            this.totalCachedRenders = 0;
        }
        this.fpsPanel.update(delta * 1000, 100, time);
        this.prevTime = time;
        /*
        if (time >= this.prevTime + 1000)
        {
            this.fpsPanel.update((this.frames * 1000) / (time - this.prevTime), 100, now);

            this.prevTime = time;
            this.frames = 0;
        }
        */
        return time;
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
    update(dt, now) {
        super.update(dt, now);
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
class Demo extends Scene$1 {
    constructor(game) {
        super(game);
        new Stats(game, 'base');
    }
    preload() {
        this.load.image('checker', '../assets/checker.png');
        this.load.image('logo', '../assets/logo.png');
        this.load.image('brain', '../assets/brain.png');
        this.load.image('clown', '../assets/clown.png');
    }
    create() {
        this.container = new Sprite(this, 400, 300, 'checker');
        const child1 = new Box(this, -256, -256, 'brain', null, 0);
        const child2 = new Box(this, 256, -256, 'brain', null, 1);
        const child3 = new Box(this, 256, 256, 'brain', null, 2);
        const child4 = new Box(this, -256, 256, 'brain', null, 3);
        //  Logo stack
        const child5 = new Sprite(this, 0, 0, 'logo').setScale(0.7);
        const child6 = new Sprite(this, 0, 0, 'logo').setScale(0.8);
        const child7 = new Sprite(this, 0, 0, 'logo').setScale(0.9);
        const child8 = new Sprite(this, 0, 0, 'logo').setScale(1.0);
        this.logo1 = child5;
        this.logo2 = child6;
        this.logo3 = child7;
        this.logo4 = child8;
        this.container.addChild(child1, child2, child3, child4, child5, child6, child7, child8);
        this.world.addChild(this.container);
        this.world.addChild(new Sprite(this, 100, 100, 'clown'));
        this.world.addChild(new Sprite(this, 700, 100, 'clown'));
        this.world.addChild(new Sprite(this, 100, 500, 'clown'));
        this.world.addChild(new Sprite(this, 700, 500, 'clown'));
    }
    update() {
        this.container.rotation += 0.005;
        this.logo1.rotation += 0.037;
        this.logo2.rotation += 0.038;
        this.logo3.rotation += 0.039;
        this.logo4.rotation += 0.040;
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
}

// demo13();
// demo25();
// demo26();
// demo27();
// demo28();
// demo29();
demo6();
//  Next steps:
//  * Camera moving needs to dirty the renderer
//  * Base64 Loader Test
//  * Load json / csv / xml on their own
//  * Camera tint + alpha (as shader uniform)
//  * Camera background color (instead of renderer bgc)
//  * Multi Texture re-use old texture IDs when count > max supported
//  * Single Texture shader
//  * Tile Layer
//  * Instead of a Quad class, try a class that can have any number of vertices in it (ala Rope), or any vertex moved
//  Done:
//  X Input point translation
//  X Static Batch shader (Sprite Buffer)
//  X Texture Atlas Loader
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
