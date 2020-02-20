import Bunny from './Bunny';
import Texture from './Texture';
import MultiTexturedQuadShader from './MultiTexturedQuadShader';
import { Ortho } from '@phaserjs/math-matrix4-funcs';

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
function checkMaxIfStatementsInShader (maxIfs: number, gl: WebGLRenderingContext): number
{
    const shader = gl.createShader(gl.FRAGMENT_SHADER);

    while (true)
    {
        const fragmentSrc = fragTemplate.replace(/%forloop%/gi, generateIfTestSrc(maxIfs));

        gl.shaderSource(shader, fragmentSrc);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        {
            maxIfs = (maxIfs / 2) | 0;
        }
        else
        {
            // valid!
            break;
        }
    }

    return maxIfs;
}

function generateIfTestSrc (maxIfs: number): string
{
    let src = '';

    for (let i = 0; i < maxIfs; ++i)
    {
        if (i > 0)
        {
            src += '\nelse ';
        }

        if (i < maxIfs - 1)
        {
            src += `if(test == ${i}.0){}`;
        }
    }

    return src;
}

function generateSampleSrc (maxTextures: number): string
{
    let src = '';

    for (let i = 0; i < maxTextures; i++)
    {
        if (i > 0)
        {
            src += '\n    else ';
        }

        if (i < maxTextures - 1)
        {
            src += `if (vTextureId < ${i}.5)`;
        }

        src += '\n    {';
        src += `\n        color = texture2D(uTexture[${i}], vTextureCoord);`;
        src += '\n    }';
    }

    return src;
}

export default function ()
{
    const resolution = { x: 800, y: 600 };
    const bounds = { left: 0, top: 0, right: resolution.x, bottom: resolution.y };

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
    
    //  Multi-texture support
    let maxTextures = checkMaxIfStatementsInShader(gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS), gl);

    console.log('maxTextures', maxTextures, 'out of', gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS));

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
    const vertexColorAttrib = gl.getAttribLocation(program, 'aColor');
    const vertexTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');
    const vertexTextureIndex = gl.getAttribLocation(program, 'aTextureId');

    const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
    const uTextureLocation = gl.getUniformLocation(program, 'uTexture');

    gl.enableVertexAttribArray(vertexPositionAttrib);
    gl.enableVertexAttribArray(vertexColorAttrib);
    gl.enableVertexAttribArray(vertexTextureCoord);
    gl.enableVertexAttribArray(vertexTextureIndex);

    //  number of bunnies on the stage
    let count = 0;

    //  The maximum number of bunnies to render
    let maxCount = 200000;

    //  Number of bunnies to add each frame
    let amount = 500;

    let isAdding = false;

    //  Number of bunnies to start with
    let startBunnyCount = 30000;




    const maxSpritesPerBatch = 20000;

    //  The size in bytes per element in the dataArray
    const size = 4;

    //  Size in bytes of a single vertex

    /**
     * Each vertex contains:
     * 
     *  position (x,y - 2 floats)
     *  color (r,g,b,a - 4 floats)
     *  texture coord (x,y - 2 floats)
     *  texture index (float)
     */
    const singleVertexSize = 36;

    //  Size of a single sprite in array elements
    //  Each vertex = 9 elements, so 9 * 4
    const singleSpriteSize = 36;

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
    
    const stride = 36;

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

        urls.forEach((url, index) => {

            let texture = new Texture(url, gl, textures.length);

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

    const bunnies: Bunny[] = [];

    function addBunnies (num)
    {
        for (let i = 0; i < num; i++)
        {
            let texture = textures[count % textures.length];
            let x = (count % 2) * 800;

            let bunny = new Bunny(x, 0, 25, 32);

            bunny.bounds = bounds;

            bunny.setTexture(texture);

            bunnies.push(bunny);

            count++;
        }
    }

    let stats;
    let counter: HTMLSpanElement;

    function create ()
    {
        if (startBunnyCount > 0)
        {
            addBunnies(startBunnyCount);
        }

        stats = new window['Stats']();
        stats.domElement.id = 'stats';
        document.body.append(stats.domElement);

        counter = document.createElement('span');
        counter.innerText = count.toString();
        document.body.append(counter);

        window.addEventListener('mousedown', () => {
            isAdding = true;
        });

        window.addEventListener('mouseup', () => {
            isAdding = false;
        });

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
        stats.begin();

        if (isAdding && count < maxCount)
        {
            addBunnies(amount);
            counter.innerText = count.toString();
        }

        const activeTextures = Array(maxTextures).fill(0);

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
         *  color (r,g,b,a - 4 floats)
         *  texture coord (x,y - 2 floats)
         *  texture index (float)
         * 
         * 9 floats = 9 * 4 bytes = 36 bytes per vertex. This is our stride.
         * 
         * The offset is how much data should be skipped at the start of each chunk.
         * 
         * In our index, the color data is right after the position data.
         * Position is 2 floats, so the offset for the color is 2 * 4 bytes = 8 bytes.
         * Color is 4 floats, so the offset for the texture coord is 4 * 4 bytes = 16 bytes, plus the 8 from the position.
         * Texture Coord is 2 floats, so the offset for Texture Index is 2 * 4 bytes = 8 bytes, plus the 16 from color + 8 from position
         */

        gl.vertexAttribPointer(vertexPositionAttrib, 2, gl.FLOAT, false, stride, 0);         // size = 8
        gl.vertexAttribPointer(vertexColorAttrib, 4, gl.FLOAT, false, stride, 8);            // size = 16
        gl.vertexAttribPointer(vertexTextureCoord, 2, gl.FLOAT, false, stride, 16 + 8);      // size = 8
        gl.vertexAttribPointer(vertexTextureIndex, 1, gl.FLOAT, false, stride, 16 + 8 + 8);  // size = 4

        let size = 0;

        for (let i = 0; i < bunnies.length; i++)
        {
            let bunny = bunnies[i];
            let texture = bunny.texture;

            if (activeTextures[texture.glIndex] === 0)
            {
                gl.activeTexture(gl.TEXTURE0 + texture.glIndex);
                gl.bindTexture(gl.TEXTURE_2D, texture.glTexture);
                activeTextures[texture.glIndex] = 1;
            }

            bunny.step();

            //  The offset here is the offset into the array, NOT a byte size!
            bunny.batchMultiTexture(dataTA, size * singleSpriteSize);

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
