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

class BunnyDepth {
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
    setTexture(texture) {
        this.texture = texture;
        this._size.set(texture.width, texture.height);
        // this.dirty = true;
        // this.updateVertices();
        return this;
    }
    stepNoTexture(dataTA, offset, depth) {
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
        dataTA[offset + 2] = depth;
        dataTA[offset + 3] = this.uv.topLeft.x;
        dataTA[offset + 4] = this.uv.topLeft.y;
        dataTA[offset + 5] = this.bottomLeft.x;
        dataTA[offset + 6] = this.bottomLeft.y;
        dataTA[offset + 7] = depth;
        dataTA[offset + 8] = this.uv.bottomLeft.x;
        dataTA[offset + 9] = this.uv.bottomLeft.y;
        dataTA[offset + 10] = this.bottomRight.x;
        dataTA[offset + 11] = this.bottomRight.y;
        dataTA[offset + 12] = depth;
        dataTA[offset + 13] = this.uv.bottomRight.x;
        dataTA[offset + 14] = this.uv.bottomRight.y;
        dataTA[offset + 15] = this.topRight.x;
        dataTA[offset + 16] = this.topRight.y;
        dataTA[offset + 17] = depth;
        dataTA[offset + 18] = this.uv.topRight.x;
        dataTA[offset + 19] = this.uv.topRight.y;
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

var SingleTexturedQuadShaderDepth = {
    fragmentShader: `
precision mediump float;

varying vec2 vTextureCoord;

uniform sampler2D uTexture;

void main (void)
{
    gl_FragColor = texture2D(uTexture, vTextureCoord);
}`,
    vertexShader: `
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uProjectionMatrix;

varying vec2 vTextureCoord;

void main (void)
{
    vTextureCoord = aTextureCoord;

    gl_Position = uProjectionMatrix * vec4(aVertexPosition, 1.0);
}`
};

//  Using a single texture (so no massive if statement in the shader source)
//  gains us 6fps when rendering 150,000 bunnies. Without the 'if' it's 46fps. With, it's 40fps.
//  200,000 bunnies = 30fps (with multi texture), 35fps with single texture.
//  100,000 bunnies = 57-60fps (with multi texture), 60fps with single texture.
function bunnymarkSingleTextureDepth () {
    const resolution = { x: 800, y: 600 };
    const bounds = { left: 0, top: 0, right: resolution.x, bottom: resolution.y };
    const canvas = document.getElementById('game');
    canvas.width = resolution.x;
    canvas.height = resolution.y;
    const contextOptions = {
        alpha: false,
        antialias: false,
        premultipliedAlpha: false,
        stencil: false,
        preserveDrawingBuffer: false
    };
    const gl = canvas.getContext('webgl', contextOptions);
    //  Create the shaders
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, SingleTexturedQuadShaderDepth.fragmentShader);
    gl.compileShader(fragmentShader);
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, SingleTexturedQuadShaderDepth.vertexShader);
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
    //  number of bunnies on the stage
    let count = 0;
    //  The maximum number of bunnies to render
    let maxCount = 500000;
    //  Number of bunnies to add each frame
    let amount = 200;
    //  Are we adding bunnies or not?
    let isAdding = false;
    //  Number of bunnies to start with
    let startBunnyCount = 1000;
    const maxSpritesPerBatch = 4096;
    // const maxSpritesPerBatch = 10000;
    //  The size in bytes per element in the dataArray
    const size = 4;
    //  Size in bytes of a single vertex
    /**
     * Each vertex contains:
     *
     *  position (x,y,z - 3 floats)
     *  texture coord (x,y - 2 floats)
     */
    const singleVertexSize = 20;
    //  Size of a single sprite in array elements
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
    function ortho(width, height, near, far) {
        const m00 = -2 * (1 / -width);
        const m11 = -2 * (1 / height);
        const m22 = 2 * (1 / (near - far));
        return new Float32Array([m00, 0, 0, 0, 0, m11, 0, 0, 0, 0, m22, 0, -1, 1, 0, 1]);
    }
    //  This matrix will convert from pixels to clip space - it only needs to be set when the canvas is sized
    const projectionMatrix = ortho(resolution.x, resolution.y, -10000, 10000);
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
            texture.load('../assets/bunnies/' + url, onLoadCallback);
            textures.push(texture);
        });
    }
    loadTextures([
        'rabbitv3.png'
    ]);
    const bunnies = [];
    function addBunnies(num) {
        for (let i = 0; i < num; i++) {
            let x = (count % 2) * 800;
            let bunny = new BunnyDepth(x, 0, textures[0]);
            bunny.bounds = bounds;
            bunnies.push(bunny);
            count++;
        }
    }
    let stats;
    let counter;
    let paused = false;
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
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.DEPTH_TEST);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
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
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
        gl.uniform1i(uTextureLocation, 0);
        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        // gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        // gl.activeTexture(gl.TEXTURE0);
        /**
         * Each vertex contains:
         *
         *  position (x,y,z - 3 floats)
         *  texture coord (x,y - 2 floats)
         *
         * 5 floats = 5 * 4 bytes = 20 bytes per vertex. This is our stride.
         *
         * The offset is how much data should be skipped at the start of each chunk.
         *
         * In our index, the color data is right after the position data.
         * Position is 2 floats, so the offset for the coord is 2 * 4 bytes = 8 bytes.
         * Texture Coord is 2 floats, so the offset for Texture Index is 2 * 4 bytes = 8 bytes, plus the 8 from position
         */
        gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, stride, 0); // size = 12
        gl.vertexAttribPointer(vertexTextureCoord, 2, gl.FLOAT, false, stride, 12); // size = 8
        let size = 0;
        for (let i = bunnies.length - 1; i >= 0; i--) {
            let bunny = bunnies[i];
            //  The offset here is the offset into the array, NOT a byte size!
            bunny.stepNoTexture(dataTA, size * singleSpriteSize, i / 10000);
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

// part25();
// bunnymark();
// bunnymarkNoColor();
// bunnymarkSingleTexture();
// bunnymarkNoColorMerged();
// DOMContentLoaded(bunnymarkNoColorMerged);
// DOMContentLoaded(bunnymarkSingleTexture);
DOMContentLoaded(bunnymarkSingleTextureDepth);
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
