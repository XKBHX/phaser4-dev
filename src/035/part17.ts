import Sprite from './TexturedSprite';
import Texture from './Texture';
import TexturedQuadShader from './TexturedQuadShader';
import { Ortho } from '@phaserjs/math-matrix4-funcs';

//  Each sprite can use a different texture
//  Batch flushes on a change of texture

export default function ()
{
    const canvas = document.getElementById('game') as HTMLCanvasElement;

    canvas.width = 800;
    canvas.height = 600;

    const contextOptions: WebGLContextAttributes = {
        alpha: false,
        antialias: true,
        premultipliedAlpha: false,
        stencil: false,
        preserveDrawingBuffer: false
    };

    const gl: WebGLRenderingContext = canvas.getContext('webgl', contextOptions);
    
    //  Create the shaders
    
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    
    gl.shaderSource(fragmentShader, TexturedQuadShader.fragmentShader);
    gl.compileShader(fragmentShader);
    
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    
    gl.shaderSource(vertexShader, TexturedQuadShader.vertexShader);
    gl.compileShader(vertexShader);
    
    const program = gl.createProgram();
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.useProgram(program);
    
    const vertexPositionAttrib = gl.getAttribLocation(program, 'aVertexPosition');
    const vertexColorAttrib = gl.getAttribLocation(program, 'aColor');
    const vertexTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');
    const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
    const uTextureLocation = gl.getUniformLocation(program, 'uTexture');

    gl.enableVertexAttribArray(vertexPositionAttrib);
    gl.enableVertexAttribArray(vertexColorAttrib);
    gl.enableVertexAttribArray(vertexTextureCoord);
    
    const resolution = { x: 800, y: 600 };

    const maxSpritesPerBatch = 2000;

    //  The size in bytes per element in the dataArray
    const size = 4;

    //  Size in bytes of a single vertex

    /**
     * Each vertex contains:
     * 
     *  position (x,y - 2 floats)
     *  color (r,g,b,a - 4 floats)
     *  texture coord (x,y - 2 floats)
     */
    const singleVertexSize = 32;

    //  Size of a single sprite in array elements
    //  Each vertex = 8 elements, so 8 * 4
    const singleSpriteSize = 32;

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

    //  This matrix will convert from pixels to clip space - it only needs to be set when the canvas is sized
    const projectionMatrix = Ortho(0, resolution.x, resolution.y, 0, -1000, 1000);
    
    const stride = 32;

    //  Textures ...
    const textures: Texture[] = [];

    function loadTextures (urls: string[])
    {
        let texturesLeft = urls.length;

        const onLoadCallback = () => {

            texturesLeft--;

            if (texturesLeft === 0)
            {
                console.log('load finished');
                create();
            }

        }

        urls.forEach((url, index) => {

            let texture = new Texture(url, gl);

            texture.load('../assets/' + url, onLoadCallback);

            textures.push(texture);

        });
    }

    loadTextures([
        '128x128.png',
        'brain.png',
        'logo.png',
        'shinyball.png'
    ]);

    const sprites: Sprite[] = [];

    function create ()
    {
        //  Some textured sprites

        for (let i = 0; i < 32; i++)
        {
            let x = Math.floor(Math.random() * (resolution.x - 200));
            let y = Math.floor(Math.random() * (resolution.y - 100));

            // let s = 0.2 + Math.random() * 0.8;
            // let r = Math.random();

            let s = 1;
            let r = 0;

            let t = textures[Math.floor(Math.random() * textures.length)];

            // console.log('sprite', i, 'texture', t.key, 'at', x, y);

            let sprite = new Sprite(x, y, t.width, t.height);

            sprite.setTexture(t);
            // sprite.setRotation(r);
            // sprite.setScale(s);

            sprites.push(sprite);
        }

        /*
        let t1 = textures[0];
        let t2 = textures[1];
        let t3 = textures[2];

        let sprite1 = new Sprite(64, 64, t1.width, t1.width).setTexture(t1);
        let sprite2 = new Sprite(128, 64, t1.width, t1.width).setTexture(t1);
        let sprite3 = new Sprite(196, 64, t1.width, t1.width).setTexture(t1);
        let sprite4 = new Sprite(260, 64, t2.width, t2.width).setTexture(t2);
        let sprite5 = new Sprite(300, 64, t2.width, t2.width).setTexture(t2);
        let sprite6 = new Sprite(330, 64, t3.width, t3.width).setTexture(t3);

        sprites.push(sprite1, sprite2, sprite3, sprite4, sprite5, sprite6);
        */

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

        // const deCount = count * singleSpriteIndexSize;
        // const deStart = start * singleSpriteIndexSize;
        // console.log('drawElements:', 'size', count, 'start', start, 'count', deCount, 'offset', deStart);

        gl.drawElements(gl.TRIANGLES, count * singleSpriteIndexSize, gl.UNSIGNED_SHORT, 0);
    }

    function render ()
    {
        const renderList = sprites.map((sprite) => {

            if (sprite.visible)
            {
                sprite.updateVertices();

                return sprite;
            }

        });

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);

        //  All sprites using the same texture index for now ...
        gl.uniform1i(uTextureLocation, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        gl.activeTexture(gl.TEXTURE0);

        /**
         * Each vertex contains:
         * 
         *  position (x,y - 2 floats)
         *  color (r,g,b,a - 4 floats)
         *  texture coord (x,y - 2 floats)
         * 
         * 8 floats = 8 * 4 bytes = 32 bytes per vertex. This is our stride.
         * The offset is how much data should be skipped at the start of each chunk.
         * In our index, the color data is right after the position data.
         * Position is 2 floats, so the offset for the color is 2 * 4 bytes = 8 bytes.
         * Color is 4 floats, so the offset for the texture coord is 4 * 4 bytes = 16 bytes, plus the 8 from the position.
         */

        gl.vertexAttribPointer(vertexPositionAttrib, 2, gl.FLOAT, false, stride, 0);
        gl.vertexAttribPointer(vertexColorAttrib, 4, gl.FLOAT, false, stride, 8);
        gl.vertexAttribPointer(vertexTextureCoord, 2, gl.FLOAT, false, stride, 16 + 8);

        let prevTexture = renderList[0].texture;
        let size = 0;

        for (let i = 0; i < renderList.length; i++)
        {
            let sprite = renderList[i];

            if (sprite.texture !== prevTexture)
            {
                //  We've got a new texture, so lets flush
                // console.log('Texture', prevTexture.key, 'for', size, 'sprites');

                gl.bindTexture(gl.TEXTURE_2D, prevTexture.glTexture);

                flush(size);

                // start = i;
                size = 0;
                prevTexture = sprite.texture;
            }

            //  The offset here is the offset into the array, NOT a byte size!
            sprite.batch(dataTA, size * singleSpriteSize);

            size++;

            //  if size = batch limit, flush here
            if (size === maxSpritesPerBatch)
            {
                gl.bindTexture(gl.TEXTURE_2D, prevTexture.glTexture);

                flush(size);
    
                // start = i;
                size = 0;
                prevTexture = sprite.texture;
            }
        }

        if (size > 0)
        {
            // console.log('Final Texture', prevTexture.key, 'for', size, 'sprites');

            gl.bindTexture(gl.TEXTURE_2D, prevTexture.glTexture);

            flush(size);
        }

        requestAnimationFrame(render);
    }
}
