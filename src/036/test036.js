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
        this.dirtySprites = 0;
        this.cachedSprites = 0;
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
        this.dirtySprites = 0;
        this.cachedSprites = 0;
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
        this.spriteCount = 0;
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
        let currentActiveTexture = this.currentActiveTexture;
        const children = container.children;
        for (let i = 0; i < children.length; i++) {
            let entity = children[i];
            if (entity.willRender()) {
                if (entity.hasTexture) {
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
                    if (entity.dirty) {
                        this.dirtySprites++;
                    }
                    else {
                        this.cachedSprites++;
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
            this.dirty = true;
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
            this.dirty = true;
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
        if (this.dirty) {
            this.scene.game.dirtyFrame++;
        }
        const children = this.children;
        for (let i = 0; i < children.length; i++) {
            children[i].update(dt, now);
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
        this.dirty = true;
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
        if (this.isPaused) {
            this.renderer.render(this.scene, 0);
            requestAnimationFrame(() => this.step());
            return;
        }
        this.dirtyFrame = 0;
        this.emit('step', dt, now);
        this.scene.world.update(dt, now);
        this.scene.update(dt, now);
        this.renderer.render(this.scene, this.dirtyFrame);
        this.emit('render', this.renderer.dirtySprites, this.renderer.cachedSprites);
        requestAnimationFrame(() => this.step());
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
        this.dirty = true;
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
        this.dirty = true;
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
            this.dirty = false;
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

class AnimatedSprite extends Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);
        this.type = 'AnimatedSprite';
        this.anims = new Map();
        //  Holds all the data for the current animation only
        this.animData = {
            currentAnim: '',
            currentFrames: [],
            frameIndex: 0,
            animSpeed: 0,
            nextFrameTime: 0,
            repeatCount: 0,
            isPlaying: false,
            yoyo: false,
            pendingStart: false,
            playingForward: true,
            delay: 0,
            repeatDelay: 0,
            onStart: null,
            onRepeat: null,
            onComplete: null
        };
    }
    addAnimation(key, frames) {
        if (!this.anims.has(key)) {
            this.anims.set(key, this.texture.getFrames(frames));
        }
        return this;
    }
    addAnimationFromAtlas(key, prefix, start, end, zeroPad = 0, suffix = '') {
        if (!this.anims.has(key)) {
            this.anims.set(key, this.texture.getFramesInRange(prefix, start, end, zeroPad, suffix));
        }
        return this;
    }
    removeAnimation(key) {
        this.anims.delete(key);
        return this;
    }
    clearAnimations() {
        this.anims.clear();
        return this;
    }
    //  If animation already playing, calling this does nothing (use restart to restart one)
    play(key, config = {}) {
        const { speed = 24, repeat = 0, yoyo = false, startFrame = 0, delay = 0, repeatDelay = 0, onStart = null, onRepeat = null, onComplete = null, forceRestart = false } = config;
        const data = this.animData;
        if (data.isPlaying) {
            if (data.currentAnim !== key) {
                this.stop();
            }
            else if (!forceRestart) {
                //  This animation is already playing? Just return then.
                return this;
            }
        }
        if (this.anims.has(key)) {
            data.currentFrames = this.anims.get(key);
            data.currentAnim = key;
            data.frameIndex = startFrame;
            data.animSpeed = 1000 / speed;
            data.nextFrameTime = data.animSpeed + delay;
            data.isPlaying = true;
            data.playingForward = true;
            data.yoyo = yoyo;
            data.repeatCount = repeat;
            data.delay = delay;
            data.repeatDelay = repeatDelay;
            data.onStart = onStart;
            data.onRepeat = onRepeat;
            data.onComplete = onComplete;
            //  If there is no start delay, we set the first frame immediately
            if (delay === 0) {
                this.setFrame(data.currentFrames[data.frameIndex]);
                if (onStart) {
                    onStart(this, key);
                }
            }
            else {
                data.pendingStart = true;
            }
        }
        return this;
    }
    stop() {
        const data = this.animData;
        data.isPlaying = false;
        data.currentAnim = '';
        if (data.onComplete) {
            data.onComplete(this, data.currentAnim);
        }
    }
    nextFrame() {
        const data = this.animData;
        data.frameIndex++;
        //  There are no more frames, do we yoyo or repeat or end?
        if (data.frameIndex === data.currentFrames.length) {
            if (data.yoyo) {
                data.frameIndex--;
                data.playingForward = false;
            }
            else if (data.repeatCount === -1 || data.repeatCount > 0) {
                data.frameIndex = 0;
                if (data.repeatCount !== -1) {
                    data.repeatCount--;
                }
                if (data.onRepeat) {
                    data.onRepeat(this, data.currentAnim);
                }
                data.nextFrameTime += data.repeatDelay;
            }
            else {
                data.frameIndex--;
                return this.stop();
            }
        }
        this.setFrame(data.currentFrames[data.frameIndex]);
        data.nextFrameTime += data.animSpeed;
    }
    prevFrame() {
        const data = this.animData;
        data.frameIndex--;
        //  There are no more frames, do we repeat or end?
        if (data.frameIndex === -1) {
            if (data.repeatCount === -1 || data.repeatCount > 0) {
                data.frameIndex = 0;
                data.playingForward = true;
                if (data.repeatCount !== -1) {
                    data.repeatCount--;
                }
                if (data.onRepeat) {
                    data.onRepeat(this, data.currentAnim);
                }
                data.nextFrameTime += data.repeatDelay;
            }
            else {
                data.frameIndex = 0;
                return this.stop();
            }
        }
        this.setFrame(data.currentFrames[data.frameIndex]);
        data.nextFrameTime += data.animSpeed;
    }
    update(delta, now) {
        super.update(delta, now);
        const data = this.animData;
        if (!data.isPlaying) {
            return;
        }
        data.nextFrameTime -= delta * 1000;
        //  Clamp to zero, otherwise a huge delta could cause animation playback issues
        data.nextFrameTime = Math.max(data.nextFrameTime, 0);
        //  It's time for a new frame
        if (data.nextFrameTime === 0) {
            //  Is this the start of our animation?
            if (data.pendingStart) {
                if (data.onStart) {
                    data.onStart(this, data.currentAnim);
                }
                data.pendingStart = false;
                data.nextFrameTime = data.animSpeed;
            }
            else if (data.playingForward) {
                this.nextFrame();
            }
            else {
                this.prevFrame();
            }
        }
    }
    get isPlaying() {
        return this.animData.isPlaying;
    }
    get isPlayingForward() {
        return (this.animData.isPlaying && this.animData.playingForward);
    }
    get currentAnimation() {
        return this.animData.currentAnim;
    }
}

class Demo extends Scene$1 {
    constructor(game) {
        super(game);
        const text = document.getElementById('cacheStats');
        this.game.on('render', (dirty, cached) => {
            const cacheUtilisation = (cached / (cached + dirty)) * 100;
            text['value'] = 'Cached: ' + cacheUtilisation + '% - Dirty: ' + dirty + ' / ' + cached;
        });
    }
    preload() {
        this.load.setPath('../assets/');
        this.load.atlas('items', 'cartoon-items.png', 'cartoon-items.json');
    }
    createItem(key, x, y) {
        const item = new AnimatedSprite(this, x, y, 'items', key + '-1');
        this.world.addChild(item);
        item.addAnimationFromAtlas(key, key + '-', 1, 8);
        item.play(key, { speed: 10, repeat: -1 });
    }
    create() {
        this.createItem('coin-silver', 200, 150);
        this.createItem('cup', 400, 150);
        this.createItem('gem', 600, 150);
        this.createItem('heart', 200, 300);
        this.createItem('lightning', 400, 300);
        this.createItem('meat', 600, 300);
        this.createItem('medkit', 200, 450);
        this.createItem('pouch', 400, 450);
        this.createItem('star', 600, 450);
    }
}
function demo26 () {
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
// demo10();
// demo11();
// demo12();
// demo13();
// demo14();
// demo15();
// demo16();
// demo17();
// demo18();
// demo19();
// demo20();
// demo21();
// demo22();
// demo23();
// demo24();
// demo25();
demo26();
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
