import CheckShaderMaxIfStatements from './CheckShaderMaxIfStatements';
import Sprite from './Sprite';
import Texture from './Texture';
import Frame from './Frame';
import SpriteShader from './SpriteMultiShader';
import { Matrix4, Translate, Rotate } from '@phaserjs/math-matrix4';
import { Ortho } from '@phaserjs/math-matrix4-funcs';
import { gsap } from '../../node_modules/gsap/index';

//  Update Merged Transform to cache rotation and scale

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

    let maxTextures: number = CheckShaderMaxIfStatements(gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS), gl);

    //  Create temp textures to stop WebGL errors on mac os
    for (let i = 0; i < maxTextures; i++)
    {
        let tempTexture = gl.createTexture();

        gl.activeTexture(gl.TEXTURE0 + i);

        gl.bindTexture(gl.TEXTURE_2D, tempTexture);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([ 0, 0, 255, 255 ]));
    }

    const uTextureLocationIndex = Array.from(Array(maxTextures).keys());

    let fragmentShaderSource = SpriteShader.fragmentShader;

    fragmentShaderSource = fragmentShaderSource.replace(/%count%/gi, `${maxTextures}`);
    fragmentShaderSource = fragmentShaderSource.replace(/%forloop%/gi, generateSampleSrc(maxTextures));

    //  Create the shaders

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    
    gl.shaderSource(vertexShader, SpriteShader.vertexShader);
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
    const uCameraMatrix = gl.getUniformLocation(program, 'uCameraMatrix');
    const uTextureLocation = gl.getUniformLocation(program, 'uTexture');

    gl.enableVertexAttribArray(vertexPositionAttrib);
    gl.enableVertexAttribArray(vertexTextureCoord);
    gl.enableVertexAttribArray(vertexTextureIndex);

    //  The size in bytes per element in the dataArray
    const size = 4;

    // const spriteCols = 30;
    // const spriteRows = 30;

    const maxSpritesPerBatch = 2000;

    //  Size in bytes of a single vertex

    /**
     * Each vertex contains:
     * 
     *  position (x,y - 2 floats)
     *  texture coord (x,y - 2 floats)
     *  texture index (float)
     */
    const singleVertexByteSize = 20;

    //  Size of a single sprite in array elements
    //  Each vertex = 5 elements, so 5 * 4
    const singleSpriteSize = 20;

    //  Size in bytes of a single sprite
    const singleSpriteByteSize = singleVertexByteSize * size;

    //  Size in bytes of a single vertex indicies
    const singleIndexByteSize = 4;

    //  Number of elements per sprite index
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

    /*
    let elementIndexExtension = gl.getExtension('OES_element_index_uint');

    if (!elementIndexExtension)
    {
        throw new Error('OES_element_index_uint unsupported. Aborting');
    }

    const indexTA = new Uint32Array(ibo);
    */

    //  Our buffers
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, dataTA, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ibo), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    //  Free willy
    ibo = [];

    //  This matrix will convert from pixels to clip space - it only needs to be set when the canvas is sized
    const projectionMatrix = Ortho(0, resolution.x, resolution.y, 0, -1000, 1000);

    const cameraMatrix = new Matrix4();
    
    const stride = singleVertexByteSize;

    //  Textures ...
    const textures: Texture[] = [];
    const frames: Frame[] = [];

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

            texture.load('../assets/' + url, onLoadCallback);

            textures.push(texture);

        });
    }

    loadTextures([
        'diamonds32x24x5.png'
    ]);

    const sprites: Sprite[] = [];

    let stats;
    let paused: boolean = false;

    let cx = 0;

    function create ()
    {
        stats = new window['Stats']();
        stats.domElement.id = 'stats';
        document.body.append(stats.domElement);

        let toggle = document.getElementById('toggle');

        toggle.addEventListener('click', () => {

            paused = (paused) ? false: true;

        });

        //  Create the Frames

        let baseTexture = textures[0];

        for (let x: number = 0; x < 160; x += 32)
        {
            frames.push(new Frame(baseTexture, x, 0, 32, 24));
        }

        //  Create some sprites

        const sprite1 = new Sprite(100, 100, frames[0]).setOrigin(0.5);
        const sprite2 = new Sprite(300, 100, frames[1]).setOrigin(0.5);
        const sprite3 = new Sprite(500, 100, frames[2]).setOrigin(0.5);

        sprites.push(sprite1, sprite2, sprite3);

        gsap.to(sprite1, { duration: 1, scaleX: 2, scaleY: 2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        gsap.to(sprite2, { duration: 1, rotation: Math.PI * 2, ease: 'linear', repeat: -1 });
        gsap.to(sprite3, { duration: 1, y: 300, yoyo: true, ease: 'sine.inOut', repeat: -1 });

        //  Start ...

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

    const activeTextures = Array(maxTextures);
    let currentActiveTexture = 0;

    function render ()
    {
        stats.begin();

        if (paused)
        {
            requestAnimationFrame(render);

            stats.end();

            return;
        }

        //  Move the camera

        // Translate(cameraMatrix, Math.sin(cx) * 2, Math.cos(cx) * 2, 0);
        // cx += 0.01;

        //  Render ...

        //  Reset textures

        currentActiveTexture = 0;

        textures.forEach((texture) => {
            texture.glIndex = -1;
        });

        //  CLS

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(uCameraMatrix, false, cameraMatrix);
        gl.uniform1iv(uTextureLocation, uTextureLocationIndex);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        gl.vertexAttribPointer(vertexPositionAttrib, 2, gl.FLOAT, false, stride, 0);    // size = 8
        gl.vertexAttribPointer(vertexTextureCoord, 2, gl.FLOAT, false, stride, 8);      // size = 8
        gl.vertexAttribPointer(vertexTextureIndex, 1, gl.FLOAT, false, stride, 8 + 8);  // size = 4

        let total = 0;

        for (let i = 0; i < sprites.length; i++)
        {
            let sprite = sprites[i];
            let texture = sprite.frame.texture;

            if (texture.glIndex === -1)
            {
                if (currentActiveTexture < maxTextures)
                {
                    //  Make this texture active
                    activeTextures[currentActiveTexture] = texture;

                    texture.glIndex = currentActiveTexture;

                    gl.activeTexture(gl.TEXTURE0 + currentActiveTexture);
                    gl.bindTexture(gl.TEXTURE_2D, texture.glTexture);

                    currentActiveTexture++;
                }
                else
                {
                    //  We've run out, flush + recycle the oldest one
                    //  TODO
                }
            }

            //  The offset here is the offset into the array, NOT a byte size!
            sprite.batch(dataTA, total * singleSpriteSize);

            //  if size = batch limit, flush here
            if (total === maxSpritesPerBatch)
            {
                flush(total);
    
                total = 0;
            }
            else
            {
                total++;
            }
        }

        if (total > 0)
        {
            flush(total);
        }

        requestAnimationFrame(render);

        stats.end();
    }
}
