import Sprite from './Sprite';
import QuadShader from './QuadShader';
import { Ortho } from '@phaserjs/math-matrix4-funcs';

//  Stacked transform matrix (Container plus children)

export default function ()
{
    const canvas = document.getElementById('game') as HTMLCanvasElement;

    canvas.width = 800;
    canvas.height = 600;

    const gl: WebGLRenderingContext = canvas.getContext('webgl');
    
    //  Create the shaders
    
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    
    gl.shaderSource(fragmentShader, QuadShader.fragmentShader);
    gl.compileShader(fragmentShader);
    
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    
    gl.shaderSource(vertexShader, QuadShader.vertexShader);
    gl.compileShader(vertexShader);
    
    const program = gl.createProgram();
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    gl.useProgram(program);
    
    const vertexPositionAttrib = gl.getAttribLocation(program, 'aVertexPosition');
    const vertexColorAttrib = gl.getAttribLocation(program, 'aColor');
    const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');

    gl.enableVertexAttribArray(vertexPositionAttrib);
    gl.enableVertexAttribArray(vertexColorAttrib);
    
    const resolution = { x: 800, y: 600 };

    const sprites: Sprite[] = [];

    const maxSprites = 404;
    const maxSpritesPerBatch = 100;

    //  The size in bytes per element in the dataArray
    const size = 4;

    //  Size in bytes of a single vertex
    const singleVertexSize = 24;

    //  Size of a single sprite in array elements
    const singleSpriteSize = 24;

    //  Size in bytes of a single sprite
    const singleSpriteByteSize = singleVertexSize * size;

    //  Size in bytes of a single vertex indicies
    const singleIndexSize = 4;

    //  The size of our ArrayBuffer
    const bufferByteSize = maxSpritesPerBatch * singleSpriteByteSize;

    //  Our ArrayBuffer + View
    const dataTA = new Float32Array(bufferByteSize);

    let ibo = [];
    let iboIndex = 0;

    let x = 0;
    let y = 0;
    
    for (let i = 0; i < maxSprites; i++)
    {
        // let x = Math.floor(Math.random() * resolution.x);
        // let y = Math.floor(Math.random() * resolution.y);
        // let s = 0.1 + Math.random() * 0.2;

        // let s = 0.2;

        let r = Math.min(1, 0.2 + Math.random());
        let g = Math.min(1, 0.2 + Math.random());
        let b = Math.min(1, 0.2 + Math.random());
    
        let sprite = new Sprite(x, y, 32, 32, r, g, b, 1);
    
        // sprite.setOrigin(0.5);
        // sprite.setScale(s);
   
        sprites.push(sprite);

        if (i < maxSpritesPerBatch)
        {
            ibo.push(iboIndex + 0, iboIndex + 1, iboIndex + 2, iboIndex + 2, iboIndex + 3, iboIndex + 0);

            iboIndex += singleIndexSize;
        }

        x += 32;

        if (x === 800)
        {
            x = 0;
            y += 32;
        }
    }

    console.log('sprites array', sprites.length);
    console.log(maxSprites, 'sprites total', dataTA.byteLength, 'bytes', dataTA.byteLength / 1e+6, 'MB');
    console.log('maxSpritesPerBatch', maxSpritesPerBatch, 'bytes:', bufferByteSize, 'batch', dataTA.length / singleSpriteSize);

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

    const stride = 24;

    function flush (offset: number)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

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

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        gl.vertexAttribPointer(vertexPositionAttrib, 2, gl.FLOAT, false, stride, 0);
        gl.vertexAttribPointer(vertexColorAttrib, 4, gl.FLOAT, false, stride, 8);

        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);

        gl.drawElements(gl.TRIANGLES, ibo.length, gl.UNSIGNED_SHORT, 0);
    }

    function render ()
    {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.viewport(0, 0, canvas.width, canvas.height);
    
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
    
    render();
}
