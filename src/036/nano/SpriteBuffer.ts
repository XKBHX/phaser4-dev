import WebGLRenderer from './WebGLRenderer';
import Game from './Game';
import MultiTextureQuadShader from './MultiTextureQuadShader';
import Sprite from './Sprite';
import Texture from './Texture';
import DisplayObjectContainer from './DisplayObjectContainer';
import { Container } from './Container';

export default class SpriteBuffer
{
    type: string = 'SpriteBuffer';

    game: Game;
    gl: WebGLRenderingContext;
    renderer: WebGLRenderer;
    shader: MultiTextureQuadShader;

    visible: boolean = true;
    renderable: boolean = true;
    hasTexture: boolean = true;
    parent: DisplayObjectContainer;
    children: Container[] = [];
    texture: Texture = null;

    inputEnabled: boolean = false;
    inputEnabledChildren: boolean = false;

    /**
     * The Array Buffer.
     *
     * @type {ArrayBuffer}
     * @memberof SpriteBuffer
     */
    data: ArrayBuffer;

    /**
     * Float32 View of the Array Buffer.
     *
     * @type {Float32Array}
     * @memberof SpriteBuffer
     */
    vertexViewF32: Float32Array;

    /**
     * Uint32 View of the Array Buffer.
     *
     * @type {Uint32Array}
     * @memberof SpriteBuffer
     */
    vertexViewU32: Uint32Array;

    /**
     * The Element Array Buffer.
     *
     * @type {(Uint16Array|Uint32Array)}
     * @memberof SpriteBuffer
     */
    index: Uint16Array | Uint32Array;

    /**
     * The data array buffer.
     *
     * @type {WebGLBuffer}
     * @memberof SpriteBuffer
     */
    vertexBuffer: WebGLBuffer;

    /**
     * The element array buffer.
     *
     * @type {WebGLBuffer}
     * @memberof SpriteBuffer
     */
    indexBuffer: WebGLBuffer;

    size: number;
    maxSize: number;
    dirty: boolean = false;

    quadIndexSize: number;
    indexType: GLenum;

    activeTextures: Texture[];

    constructor (game: Game, maxSize: number)
    {
        this.game = game;
        this.renderer = game.renderer;
        this.gl = game.renderer.gl;
        this.shader = game.renderer.shader;

        this.resetBuffers(maxSize);
    }

    //  TODO: Split to own function so Shader can share it?
    resetBuffers (maxSize: number)
    {
        const gl = this.gl;
        const shader = this.shader;
        const indexSize = shader.indexSize;

        this.indexType = gl.UNSIGNED_SHORT;

        if (maxSize > 65535)
        {
            if (!this.renderer.elementIndexExtension)
            {
                console.warn('Browser does not support OES uint element index. SpriteBuffer.maxSize cannot exceed 65535');
                maxSize = 65535;
            }
            else
            {
                this.indexType = gl.UNSIGNED_INT;
            }
        }

        let ibo: number[] = [];
        
        //  Seed the index buffer
        for (let i: number = 0; i < (maxSize * indexSize); i += indexSize)
        {
            ibo.push(i + 0, i + 1, i + 2, i + 2, i + 3, i + 0);
        }

        this.data = new ArrayBuffer(maxSize * shader.quadByteSize);

        if (this.indexType === gl.UNSIGNED_SHORT)
        {
            this.index = new Uint16Array(ibo);
        }
        else
        {
            this.index = new Uint32Array(ibo);
        }

        this.vertexViewF32 = new Float32Array(this.data);
        this.vertexViewU32 = new Uint32Array(this.data);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.data, gl.STATIC_DRAW);
       
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.index, gl.STATIC_DRAW);

        //  Tidy-up
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        ibo = [];

        this.size = 0;
        this.maxSize = maxSize;
        this.quadIndexSize = shader.quadIndexSize;
        this.activeTextures = [];
    }

    render ()
    {
        const gl = this.gl;

        this.shader.bindBuffers(this.indexBuffer, this.vertexBuffer);

        if (this.dirty)
        {
            gl.bufferData(gl.ARRAY_BUFFER, this.data, gl.STATIC_DRAW);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.index, gl.STATIC_DRAW);

            this.dirty = false;
        }

        //  For now we'll allow just the one texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.activeTextures[0].glTexture);

        gl.drawElements(gl.TRIANGLES, this.size * this.quadIndexSize, this.indexType, 0);
    }

    add (source: Sprite)
    {
        if (this.size === this.maxSize)
        {
            return;
        }

        const textureIndex = 0;

        this.activeTextures[textureIndex] = source.texture;

        let offset = this.size * this.shader.quadElementSize;

        const F32 = this.vertexViewF32;
        const U32 = this.vertexViewU32;

        const frame = source.frame;

        const vertices = source.updateVertices();

        const topLeft = vertices[0];
        const topRight = vertices[1];
        const bottomLeft = vertices[2];
        const bottomRight = vertices[3];

        F32[offset++] = topLeft.x;
        F32[offset++] = topLeft.y;
        F32[offset++] = frame.u0;
        F32[offset++] = frame.v0;
        F32[offset++] = textureIndex;
        U32[offset++] = this.shader.packColor(topLeft.color, topLeft.alpha);

        F32[offset++] = bottomLeft.x;
        F32[offset++] = bottomLeft.y;
        F32[offset++] = frame.u0;
        F32[offset++] = frame.v1;
        F32[offset++] = textureIndex;
        U32[offset++] = this.shader.packColor(bottomLeft.color, bottomLeft.alpha);

        F32[offset++] = bottomRight.x;
        F32[offset++] = bottomRight.y;
        F32[offset++] = frame.u1;
        F32[offset++] = frame.v1;
        F32[offset++] = textureIndex;
        U32[offset++] = this.shader.packColor(bottomRight.color, bottomRight.alpha);

        F32[offset++] = topRight.x;
        F32[offset++] = topRight.y;
        F32[offset++] = frame.u1;
        F32[offset++] = frame.v0;
        F32[offset++] = textureIndex;
        U32[offset++] = this.shader.packColor(topRight.color, topRight.alpha);

        this.size++;
        this.dirty = true;
    }

    willRender (): boolean
    {
        return (this.visible && this.renderable);
    }

    update ()
    {
        // this.game.dirtyFrame++;
    }

    preRender ()
    {
        // this.game.dirtyFrame++;
    }

    updateTransform ()
    {
    }

}
