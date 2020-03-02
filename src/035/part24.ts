import Sprite from './SpriteMergedTransformCamera';
import Texture from './Texture22';
import Frame from './Frame';
import SingleTexturedQuadShaderColor from './SingleTexturedQuadShaderColorCamera';
import { Matrix4, Translate, Rotate } from '@phaserjs/math-matrix4';
import { Ortho } from '@phaserjs/math-matrix4-funcs';

//  Texture Frames (UV) support

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
    const uCameraMatrix = gl.getUniformLocation(program, 'uCameraMatrix');
    const uTextureLocation = gl.getUniformLocation(program, 'uTexture');

    gl.enableVertexAttribArray(vertexPositionAttrib);
    gl.enableVertexAttribArray(vertexTextureCoord);

    //  The size in bytes per element in the dataArray
    const size = 4;

    const spriteCols = 30;
    const spriteRows = 30;

    const maxSpritesPerBatch = spriteCols * spriteRows;

    //  Size in bytes of a single vertex

    /**
     * Each vertex contains:
     * 
     *  position (x,y - 2 floats)
     *  texture coord (x,y - 2 floats)
     */
    const singleVertexByteSize = 16;

    //  Size of a single sprite in array elements
    const singleSpriteSize = 16;

    //  Size in bytes of a single sprite
    const singleSpriteByteSize = singleVertexByteSize * size;

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

        //  Prepare textures
        for (let i = 0; i < textures.length; i++)
        {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, textures[i].glTexture);
        }

        //  Create the Frames

        let baseTexture = textures[0];

        for (let x: number = 0; x < 160; x += 32)
        {
            frames.push(new Frame(baseTexture, x, 0, 32, 24));
        }

        let i = 0;

        for (let y: number = 0; y < spriteCols; y++)
        {
            for (let x: number = 0; x < spriteRows; x++)
            {
                let frame = frames[Math.floor(Math.random() * frames.length)];
                let sprite = new Sprite(x * 32, y * 24, frame);
    
                sprite.batchNoTexture(dataTA, i * singleSpriteSize);
        
                sprites.push(sprite);

                i++;
            }
        }
        
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

        //  Move the camera

        Translate(cameraMatrix, Math.sin(cx) * 2, Math.cos(cx) * 2, 0);

        cx += 0.01;

        //  Render ...

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(uCameraMatrix, false, cameraMatrix);
        gl.uniform1i(uTextureLocation, 0);

        gl.vertexAttribPointer(vertexPositionAttrib, 2, gl.FLOAT, false, stride, 0);    // size = 8
        gl.vertexAttribPointer(vertexTextureCoord, 2, gl.FLOAT, false, stride, 8);      // size = 8

        gl.drawElements(gl.TRIANGLES, maxSpritesPerBatch * singleSpriteIndexCount, gl.UNSIGNED_INT, 0);

        requestAnimationFrame(render);

        stats.end();
    }
}
