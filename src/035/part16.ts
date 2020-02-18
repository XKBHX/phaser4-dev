import Container from './Container';
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

    //  Seed the index buffer
    for (let i = 0; i < (maxSpritesPerBatch * singleIndexSize); i += singleIndexSize)
    {
        ibo.push(i + 0, i + 1, i + 2, i + 2, i + 3, i + 0);
    }

    //  Our test display list

    let sprite = new Sprite(100, 100, 256, 96, 0, 1, 0, 1);
    
    // sprite.setOrigin(0.5);
    // sprite.setScale(s);
   
    sprites.push(sprite);

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

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        gl.vertexAttribPointer(vertexPositionAttrib, 2, gl.FLOAT, false, stride, 0);
        gl.vertexAttribPointer(vertexColorAttrib, 4, gl.FLOAT, false, stride, 8);
    
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
