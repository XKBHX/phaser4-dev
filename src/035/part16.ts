import Sprite from './TexturedSprite';
import TexturedQuadShader from './TexturedQuadShader';
import { Ortho } from '@phaserjs/math-matrix4-funcs';

//  Textured quads

export default function ()
{
    const canvas = document.getElementById('game') as HTMLCanvasElement;

    canvas.width = 800;
    canvas.height = 600;

    const gl: WebGLRenderingContext = canvas.getContext('webgl');
    
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

    const sprites: Sprite[] = [];

    const maxSprites = 1;
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
    const singleIndexSize = 4;

    //  The size of our ArrayBuffer
    const bufferByteSize = maxSpritesPerBatch * singleSpriteByteSize;

    //  Our ArrayBuffer + View
    const dataTA = new Float32Array(bufferByteSize);

    let ibo = [];

    //  Seed the index buffer
    for (let i = 0; i < (maxSpritesPerBatch * singleIndexSize); i += singleIndexSize)
    {
        ibo.push(i + 0, i + 1, i + 2, i + 2, i + 3, i + 0);
    }

    //  Some textured sprites

    for (let i = 0; i < 8; i++)
    {
        let x = Math.floor(Math.random() * resolution.x);
        let y = Math.floor(Math.random() * resolution.y);
        let s = 0.2 + Math.random() * 0.8;
        let r = Math.random();

        let sprite = new Sprite(x, y, 256, 256);

        sprite.setRotation(r);
        
        sprite.setScale(s);
       
        sprites.push(sprite);
    }

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

    //  Load a test texture
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);

    //  1x1 temp pixel image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([ 0, 255, 0, 255 ]));

    const image = new Image();

    image.addEventListener('load', () => {

        gl.bindTexture(gl.TEXTURE_2D, texture);

        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
       
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);

        gl.generateMipmap(gl.TEXTURE_2D);

        render();

    });

    //  Load the image ...
    image.src = '../assets/f-texture.png';
    
    const stride = 32;

    function flush (offset: number)
    {
        if (offset === bufferByteSize)
        {
            gl.bufferData(gl.ARRAY_BUFFER, dataTA, gl.DYNAMIC_DRAW);
        }
        else
        {
            let view = dataTA.subarray(0, offset);

            //  What's the difference here? We're drawing into a new subarray view anyway, maybe we don't
            //  actually need the subarray at all?

            gl.bufferSubData(gl.ARRAY_BUFFER, 0, view);
            // gl.bufferData(gl.ARRAY_BUFFER, view, gl.DYNAMIC_DRAW);
        }

        gl.drawElements(gl.TRIANGLES, ibo.length, gl.UNSIGNED_SHORT, 0);
    }

    function render ()
    {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);

        //  All quads using the same texture for now ...
        gl.uniform1i(uTextureLocation, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

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

        let bytesOffset = 0;
        let spriteOffset = 0;

        sprites.forEach((sprite) => {

            if (sprite.visible)
            {
                sprite.updateVertices();
                sprite.batch(dataTA, spriteOffset);

                //  The offset here is the offset into the array, NOT a byte size!
                spriteOffset += singleSpriteSize;

                bytesOffset += singleSpriteByteSize;

                if (bytesOffset === bufferByteSize)
                {
                    flush(bytesOffset);

                    bytesOffset = 0;
                    spriteOffset = 0;
                }
            }

        });

        if (bytesOffset > 0)
        {
            flush(bytesOffset);
        }

        requestAnimationFrame(render);
    }
}
