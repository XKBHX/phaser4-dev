import WebGLRenderer from './WebGLRenderer';
import Sprite from './Sprite';
import ISpriteMultiShader from './ISpriteMultiShader';
import SpriteBuffer from './SpriteBuffer';

const shaderSource = {

    fragmentShader: `
precision highp float;

varying vec2 vTextureCoord;
varying float vTextureId;
varying vec4 vTintColor;

uniform sampler2D uTexture[%count%];

void main (void)
{
    vec4 color;

    %forloop%

    gl_FragColor = color * vec4(vTintColor.bgr * vTintColor.a, vTintColor.a);
}`,
    
    vertexShader: `
precision highp float;

attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
attribute float aTextureId;
attribute vec4 aTintColor;

uniform mat4 uProjectionMatrix;
uniform mat4 uCameraMatrix;

varying vec2 vTextureCoord;
varying float vTextureId;
varying vec4 vTintColor;

void main (void)
{
    vTextureCoord = aTextureCoord;
    vTextureId = aTextureId;
    vTintColor = aTintColor;

    gl_Position = uProjectionMatrix * uCameraMatrix * vec4(aVertexPosition, 0.0, 1.0);
}`
}

export default class MultiTextureQuadShader
{
    renderer: WebGLRenderer;
    gl: WebGLRenderingContext;

    program: WebGLProgram;

    attribs: { position: number; textureCoord: number; textureIndex: number; color: number };
    uniforms: { projectionMatrix: WebGLUniformLocation; cameraMatrix: WebGLUniformLocation; textureLocation: WebGLUniformLocation; };

    /**
     * Maximum number of quads per batch before a flush takes place.
     *
     * @type {number}
     * @memberof MultiTextureQuadShader
     */
    batchSize: number;

    /**
     * The size, in bytes, per entry in the array buffer.
     *
     * @type {number}
     * @memberof MultiTextureQuadShader
     */
    dataSize: number;

    /**
     * The size, in bytes, per entry in the element index array.
     *
     * @type {number}
     * @memberof MultiTextureQuadShader
     */
    indexSize: number;

    /**
     * The amount of elements / floats a single vertex consists of.
     * 
     * The default is 6:
     * 
     * position (x,y - 2 floats)
     * texture coord (x,y - 2 floats)
     * texture index (float)
     * packed color (vec4)
     *
     * @type {number}
     * @memberof MultiTextureQuadShader
     */
    vertexElementSize: number;

    /**
     * The size, in bytes, of a single vertex in the array buffer.
     * 
     * This is `vertexElementSize * dataSize`.
     *
     * @type {number}
     * @memberof MultiTextureQuadShader
     */
    vertexByteSize: number;

    /**
     * The size, in bytes, of a single quad in the array buffer.
     * 
     * This is `vertexByteSize * 4`.
     *
     * @type {number}
     * @memberof MultiTextureQuadShader
     */
    quadByteSize: number;

    /**
     * The size, in quantity of elements, of a single quad in the element index array.
     * 
     * This is `vertexElementSize * 4`.
     *
     * @type {number}
     * @memberof MultiTextureQuadShader
     */
    quadElementSize: number;

    /**
     * The total number of entries per quad in the element index array.
     * 
     * The IBO contains 6 entries per quad:
     * 
     * 0, 1, 2
     * 2, 3, 0
     *
     * @type {number}
     * @memberof MultiTextureQuadShader
     */
    quadIndexSize: number;

    /**
     * The size, in bytes, of the Array Buffer.
     *
     * @type {number}
     * @memberof MultiTextureQuadShader
     */
    bufferByteSize: number;

    /**
     * The Array Buffer.
     *
     * @type {ArrayBuffer}
     * @memberof MultiTextureQuadShader
     */
    data: ArrayBuffer;

    /**
     * Float32 View of the Array Buffer.
     *
     * @type {Float32Array}
     * @memberof MultiTextureQuadShader
     */
    vertexViewF32: Float32Array;

    /**
     * Uint32 View of the Array Buffer.
     *
     * @type {Uint32Array}
     * @memberof MultiTextureQuadShader
     */
    vertexViewU32: Uint32Array;

    /**
     * The Element Array Buffer.
     *
     * @type {Uint16Array}
     * @memberof MultiTextureQuadShader
     */
    index: Uint16Array;

    /**
     * The data array buffer.
     *
     * @type {WebGLBuffer}
     * @memberof MultiTextureQuadShader
     */
    vertexBuffer: WebGLBuffer;

    /**
     * The element array buffer.
     *
     * @type {WebGLBuffer}
     * @memberof MultiTextureQuadShader
     */
    indexBuffer: WebGLBuffer;

    /**
     * The total number of quads added to the batch so far.
     * Reset every bind and flush.
     *
     * @type {number}
     * @memberof MultiTextureQuadShader
     */
    count: number;

    constructor (renderer: WebGLRenderer, config: ISpriteMultiShader = {})
    {
        this.renderer = renderer;
        this.gl = renderer.gl;

        const {
            batchSize = 4096,
            dataSize = 4,
            indexSize = 4,
            vertexElementSize = 6,
            quadIndexSize = 6,
            fragmentShader = shaderSource.fragmentShader,
            vertexShader = shaderSource.vertexShader
        } = config;

        this.batchSize = batchSize;
        this.dataSize = dataSize;
        this.indexSize = indexSize;
        this.vertexElementSize = vertexElementSize;
        this.vertexByteSize = vertexElementSize * dataSize;
        this.quadByteSize = this.vertexByteSize * 4;
        this.quadElementSize = vertexElementSize * 4;
        this.quadIndexSize = quadIndexSize;
        this.bufferByteSize = batchSize * this.quadByteSize;

        this.createBuffers();
        this.createShaders(fragmentShader, vertexShader);
    }

    createBuffers ()
    {
        let ibo: number[] = [];
        
        //  Seed the index buffer
        for (let i: number = 0; i < (this.batchSize * this.indexSize); i += this.indexSize)
        {
            ibo.push(i + 0, i + 1, i + 2, i + 2, i + 3, i + 0);
        }
        
        this.data = new ArrayBuffer(this.bufferByteSize);
        this.index = new Uint16Array(ibo);

        this.vertexViewF32 = new Float32Array(this.data);
        this.vertexViewU32 = new Uint32Array(this.data);

        const gl = this.gl;

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.data, gl.DYNAMIC_DRAW);
       
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.index, gl.STATIC_DRAW);

        //  Tidy-up
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        ibo = [];
    }

    createShaders (fragmentShaderSource: string, vertexShaderSource: string)
    {
        const gl = this.gl;
        const maxTextures = this.renderer.maxTextures;

        let src: string = '';

        for (let i: number = 0; i < maxTextures; i++)
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

        fragmentShaderSource = fragmentShaderSource.replace(/%count%/gi, `${maxTextures}`);
        fragmentShaderSource = fragmentShaderSource.replace(/%forloop%/gi, src);

        //  Create the shaders

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);
        
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);
        
        const program = gl.createProgram();
        
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        gl.useProgram(program);

        this.program = program;
        
        const vertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
        const vertexTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');
        const vertexTextureIndex = gl.getAttribLocation(program, 'aTextureId');
        const vertexColor = gl.getAttribLocation(program, 'aTintColor');

        const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
        const uCameraMatrix = gl.getUniformLocation(program, 'uCameraMatrix');
        const uTextureLocation = gl.getUniformLocation(program, 'uTexture');

        gl.enableVertexAttribArray(vertexPosition);
        gl.enableVertexAttribArray(vertexTextureCoord);
        gl.enableVertexAttribArray(vertexTextureIndex);
        gl.enableVertexAttribArray(vertexColor);

        this.attribs = {
            position: vertexPosition,
            textureCoord: vertexTextureCoord,
            textureIndex: vertexTextureIndex,
            color: vertexColor
        };

        this.uniforms = {
            projectionMatrix: uProjectionMatrix,
            cameraMatrix: uCameraMatrix,
            textureLocation: uTextureLocation
        };
    }

    bind ()
    {
        const gl = this.gl;
        const renderer = this.renderer;
        const uniforms = this.uniforms;

        gl.useProgram(this.program);

        gl.uniformMatrix4fv(uniforms.projectionMatrix, false, renderer.projectionMatrix);
        gl.uniformMatrix4fv(uniforms.cameraMatrix, false, renderer.camera.matrix);
        gl.uniform1iv(uniforms.textureLocation, renderer.textureIndex);

        this.bindBuffers(this.indexBuffer, this.vertexBuffer);
    }

    bindBuffers (indexBuffer: WebGLBuffer, vertexBuffer: WebGLBuffer)
    {
        const gl = this.gl;
        const stride = this.vertexByteSize;
        const attribs = this.attribs;

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        //  attributes must be reset whenever you change buffers

        gl.vertexAttribPointer(attribs.position, 2, gl.FLOAT, false, stride, 0);        // size = 8
        gl.vertexAttribPointer(attribs.textureCoord, 2, gl.FLOAT, false, stride, 8);    // size = 8, offset = position
        gl.vertexAttribPointer(attribs.textureIndex, 1, gl.FLOAT, false, stride, 16);   // size = 4, offset = position + tex coord
        gl.vertexAttribPointer(attribs.color, 4, gl.UNSIGNED_BYTE, true, stride, 20);   // size = 4, offset = position + tex coord + index

        this.count = 0;
    }

    batchSpriteBuffer (buffer: SpriteBuffer): boolean
    {
        if (buffer.size > 0)
        {
            this.flush();

            buffer.render();

            //  Restore buffers
            this.bindBuffers(this.indexBuffer, this.vertexBuffer);

            return true;
        }

        return false;
    }

    batchSprite (sprite: Sprite)
    {
        if (this.count === this.batchSize)
        {
            this.flush();
        }

        sprite.updateVertices(this.vertexViewF32, this.vertexViewU32, this.count * this.quadElementSize);

        this.count++;
    }

    flush ()
    {
        const count = this.count;

        if (count === 0)
        {
            return;
        }

        const gl = this.gl;
        const offset = count * this.quadByteSize;

        if (offset === this.bufferByteSize)
        {
            gl.bufferData(gl.ARRAY_BUFFER, this.data, gl.DYNAMIC_DRAW);
        }
        else
        {
            let view = this.vertexViewF32.subarray(0, offset);

            gl.bufferSubData(gl.ARRAY_BUFFER, 0, view);
        }

        gl.drawElements(gl.TRIANGLES, count * this.quadIndexSize, gl.UNSIGNED_SHORT, 0);

        this.count = 0;
    }

}
