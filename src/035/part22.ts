import Sprite from './SpriteMergedTransform';
import Texture from './Texture';
import SingleTexturedQuadShaderColor from './SingleTexturedQuadShaderColor';
import { Ortho } from '@phaserjs/math-matrix4-funcs';

//  Static buffer but use bufferSubData to update just a small part of it (i.e. a single moving quad in a static buffer)

function getQueryString (parameter: string = '', defaultValue: any = '', context = location): string
{
    var output = null;
    var result = null;
    var keyValues = context.search.substring(1).split('&');

    for (var i in keyValues)
    {
        var key = keyValues[i].split('=');

        if (key.length > 1)
        {
            if (parameter && parameter === decodeURI(key[0]))
            {
                result = decodeURI(key[1]);
                break;
            }
            else
            {
                if (!output)
                {
                    output = {};
                }

                output[decodeURI(key[0])] = decodeURI(key[1]);
            }
        }
    }

    return (result) ? result : defaultValue;
}

export default function ()
{
    const resolution = { x: 800, y: 600 };

    const canvas = document.getElementById('game') as HTMLCanvasElement;

    canvas.width = resolution.x;
    canvas.height = resolution.y;

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

    for (let i = 0; i < maxSpritesPerBatch; i++)
    {
        ibo.push(offset + 0, offset + 1, offset + 2, offset + 2, offset + 3, offset + 0);

        offset += singleSpriteElementOffset;
    }

    let elementIndexExtension = gl.getExtension('OES_element_index_uint');

    if (!elementIndexExtension)
    {
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
            texture.load('../assets/' + url, onLoadCallback);

            textures.push(texture);

        });
    }

    loadTextures([
        'beball1.png'
    ]);

    const sprites: Sprite[] = [];

    let stats;
    let paused: boolean = false;
    let movingSprite: Sprite;
    let movingSpriteIndex: number;

    function create ()
    {
        stats = new window['Stats']();
        stats.domElement.id = 'stats';
        document.body.append(stats.domElement);

        let toggle = document.getElementById('toggle');

        toggle.addEventListener('click', () => {

            paused = (paused) ? false: true;

        });

        //  Prepare textures
        for (let i = 0; i < textures.length; i++)
        {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, textures[i].glTexture);
        }

        for (let i = 0; i < maxSpritesPerBatch; i++)
        {
            let x = 128;
            let y = i * 64;
    
            let sprite = new Sprite(x, y, textures[0]);
    
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

    function render ()
    {
        stats.begin();

        if (paused)
        {
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

        if (movingSprite.x >= 800)
        {
            movingSprite.x = -32;
        }

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
        gl.uniform1i(uTextureLocation, 0);

        gl.vertexAttribPointer(vertexPositionAttrib, 2, gl.FLOAT, false, stride, 0);    // size = 8
        gl.vertexAttribPointer(vertexTextureCoord, 2, gl.FLOAT, false, stride, 8);      // size = 8

        gl.drawElements(gl.TRIANGLES, maxSpritesPerBatch * singleSpriteIndexCount, gl.UNSIGNED_INT, 0);

        requestAnimationFrame(render);

        stats.end();
    }
}
