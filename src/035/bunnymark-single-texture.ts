import Bunny from './BunnyMergedTransform';
import Texture from './Texture22';
import SingleTexturedQuadShaderColor from './SingleTexturedQuadShaderColor';

//  Using a single texture (so no massive if statement in the shader source)
//  gains us 6fps when rendering 150,000 bunnies. Without the 'if' it's 46fps. With, it's 40fps.
//  200,000 bunnies = 30fps (with multi texture), 35fps with single texture.
//  100,000 bunnies = 57-60fps (with multi texture), 60fps with single texture.

export default function ()
{
    const resolution = { x: 800, y: 600 };
    const bounds = { left: 0, top: 0, right: resolution.x, bottom: resolution.y };

    const canvas = document.getElementById('game') as HTMLCanvasElement;

    canvas.width = resolution.x;
    canvas.height = resolution.y;

    const contextOptions: WebGLContextAttributes = {
        alpha: false,
        antialias: false,
        premultipliedAlpha: false,
        stencil: false,
        preserveDrawingBuffer: false
    };

    const gl: WebGLRenderingContext = canvas.getContext('webgl', contextOptions);

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

    const maxSpritesPerBatch = 4096;
    // const maxSpritesPerBatch = 10000;

    //  The size in bytes per element in the dataArray
    const size = 4;

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
    for (let i = 0; i < (maxSpritesPerBatch * singleIndexByteSize); i += singleIndexByteSize)
    {
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

    function ortho (width: number, height: number, near: number, far: number): Float32Array
    {
        const m00: number = -2 * (1 / -width);
        const m11: number = -2 * (1 / height);
        const m22: number = 2 * (1 / (near - far));

        return new Float32Array([ m00, 0, 0, 0, 0, m11, 0, 0, 0, 0, m22, 0, -1, 1, 0, 1 ]);
    }

    //  This matrix will convert from pixels to clip space - it only needs to be set when the canvas is sized
    const projectionMatrix = ortho(resolution.x, resolution.y, -1000, 1000);
    
    const stride = singleVertexSize;

    //  Textures ...
    const textures: Texture[] = [];

    function loadTextures (urls: string[])
    {
        let texturesLeft = urls.length;

        const onLoadCallback = () => {

            texturesLeft--;

            if (texturesLeft === 0)
            {
                create();
            }

        }

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

    const bunnies: Bunny[] = [];

    function addBunnies (num: number)
    {
        for (let i = 0; i < num; i++)
        {
            let x = (count % 2) * 800;

            let bunny = new Bunny(x, 0, textures[0]);

            bunny.bounds = bounds;

            bunnies.push(bunny);

            count++;
        }
    }

    let stats;
    let counter: HTMLSpanElement;

    let paused: boolean = false;

    window['bunnies'] = bunnies;

    console.log('max', maxSpritesPerBatch, 'size', bufferByteSize);

    function create ()
    {
        if (startBunnyCount > 0)
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

            paused = (paused) ? false: true;

        });

        let game = document.getElementById('game');

        game.addEventListener('mousedown', () => {
            isAdding = true;
        });

        game.addEventListener('mouseup', () => {
            isAdding = false;
        });

        //  Prepare textures
        for (let i = 0; i < textures.length; i++)
        {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, textures[i].glTexture);
        }

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        render();
    }

    function flush (count: number)
    {
        const offset = count * singleSpriteByteSize;

        if (offset === bufferByteSize)
        {
            gl.bufferData(gl.ARRAY_BUFFER, dataTA, gl.DYNAMIC_DRAW);
        }
        else
        {
            let view = dataTA.subarray(0, offset);

            gl.bufferSubData(gl.ARRAY_BUFFER, 0, view);
        }

        gl.drawElements(gl.TRIANGLES, count * singleSpriteIndexSize, gl.UNSIGNED_SHORT, 0);
    }

    function render ()
    {
        if (paused)
        {
            requestAnimationFrame(render);

            return;
        }

        stats.begin();

        if (isAdding && count < maxCount)
        {
            addBunnies(amount);
            counter.innerText = count.toString();
        }

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // gl.enable(gl.BLEND);
        // gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
        gl.uniform1i(uTextureLocation, 0);

        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        // gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        // gl.activeTexture(gl.TEXTURE0);

        /**
         * Each vertex contains:
         * 
         *  position (x,y - 2 floats)
         *  texture coord (x,y - 2 floats)
         * 
         * 4 floats = 4 * 4 bytes = 16 bytes per vertex. This is our stride.
         * 
         * The offset is how much data should be skipped at the start of each chunk.
         * 
         * In our index, the color data is right after the position data.
         * Position is 2 floats, so the offset for the coord is 2 * 4 bytes = 8 bytes.
         * Texture Coord is 2 floats, so the offset for Texture Index is 2 * 4 bytes = 8 bytes, plus the 8 from position
         */

        gl.vertexAttribPointer(vertexPositionAttrib, 2, gl.FLOAT, false, stride, 0);    // size = 8
        gl.vertexAttribPointer(vertexTextureCoord, 2, gl.FLOAT, false, stride, 8);      // size = 8

        let size = 0;

        for (let i = 0; i < bunnies.length; i++)
        {
            let bunny = bunnies[i];

            //  The offset here is the offset into the array, NOT a byte size!
            bunny.stepNoTexture(dataTA, size * singleSpriteSize);

            //  if size = batch limit, flush here
            if (size === maxSpritesPerBatch)
            {
                flush(size);

                size = 0;
            }
            else
            {
                size++;
            }
        }

        if (size > 0)
        {
            flush(size);
        }

        requestAnimationFrame(render);

        stats.end();
    }
}
