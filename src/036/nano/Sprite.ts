import Texture from './Texture';
import Frame from './Frame';
import Scene from './Scene';
import DisplayObjectContainer from './DisplayObjectContainer';
import PackColor from './PackColor';

export default class Sprite extends DisplayObjectContainer
{
    type: string = 'Sprite';

    texture: Texture;
    frame: Frame;

    protected vertexData: Float32Array;
    protected vertexTint: Uint32Array;
    protected vertexAlpha: Float32Array;
    protected vertexColor: Uint32Array;

    private _tint: number = 0xffffff;
    private _prevTextureID: number = -1;

    constructor (scene: Scene, x: number, y: number, texture: string, frame?: string | number)
    {
        super(scene, x, y);

        this.vertexData = new Float32Array(24).fill(0);
        this.vertexTint = new Uint32Array(4).fill(0xffffff);
        this.vertexAlpha = new Float32Array(4).fill(1);
        this.vertexColor = new Uint32Array(4).fill(4294967295);

        this.setTexture(texture, frame);

        this.updateTransform();
    }

    setTexture (key: string | Texture, frame?: string | number)
    {
        if (key instanceof Texture)
        {
            this.texture = key;
        }
        else
        {
            this.texture = this.scene.textures.get(key);
        }

        return this.setFrame(frame);
    }

    setFrame (key?: string | number)
    {
        const frame: Frame = this.texture.get(key);

        this.frame = frame;

        this.setSize(frame.sourceSizeWidth, frame.sourceSizeHeight);

        if (frame.pivot)
        {
            this.setOrigin(frame.pivot.x, frame.pivot.y);
        }

        const data = this.vertexData;

        //  This rarely changes, so we'll set it here, rather than every frame:

        data[2] = frame.u0;
        data[3] = frame.v0;

        data[8] = frame.u0;
        data[9] = frame.v1;

        data[14] = frame.u1;
        data[15] = frame.v1;

        data[20] = frame.u1;
        data[21] = frame.v0;

        this.dirty = true;

        this.hasTexture = true;

        return this;
    }

    private packColors ()
    {
        const alpha = this.vertexAlpha;
        const tint = this.vertexTint;
        const color = this.vertexColor;

        //  In lots of cases, this *never* changes, so cache it here:
        color[0] = PackColor(tint[0], alpha[0]);
        color[1] = PackColor(tint[1], alpha[1]);
        color[2] = PackColor(tint[2], alpha[2]);
        color[3] = PackColor(tint[3], alpha[3]);

        this.dirty = true;

        return this;
    }

    setAlpha (topLeft: number = 1, topRight: number = topLeft, bottomLeft: number = topLeft, bottomRight: number = topLeft)
    {
        const alpha = this.vertexAlpha;

        alpha[0] = topLeft;
        alpha[1] = topRight;
        alpha[2] = bottomLeft;
        alpha[3] = bottomRight;

        return this.packColors();
    }

    setTint (topLeft: number = 0xffffff, topRight: number = topLeft, bottomLeft: number = topLeft, bottomRight: number = topLeft)
    {
        const tint = this.vertexTint;

        tint[0] = topLeft;
        tint[1] = topRight;
        tint[2] = bottomLeft;
        tint[3] = bottomRight;

        return this.packColors();
    }

    updateVertices (F32: Float32Array, U32: Uint32Array, offset: number)
    {
        const data = this.vertexData;

        //  Skip all of this if not dirty
        if (this.dirty)
        {
            const frame = this.frame;
            const origin = this._origin;
    
            let w0: number;
            let w1: number;
            let h0: number;
            let h1: number;
    
            const { a, b, c, d, tx, ty } = this.worldTransform;
    
            if (frame.trimmed)
            {
                w1 = frame.spriteSourceSizeX - (origin.x * frame.sourceSizeWidth);
                w0 = w1 + frame.spriteSourceSizeWidth;
    
                h1 = frame.spriteSourceSizeY - (origin.y * frame.sourceSizeHeight);
                h0 = h1 + frame.spriteSourceSizeHeight;
            }
            else
            {
                w1 = -origin.x * frame.sourceSizeWidth;
                w0 = w1 + frame.sourceSizeWidth;
    
                h1 = -origin.y * frame.sourceSizeHeight;
                h0 = h1 + frame.sourceSizeHeight;
            }
    
            //  top left
            data[0] = (w1 * a) + (h1 * c) + tx;
            data[1] = (w1 * b) + (h1 * d) + ty;
    
            //  bottom left
            data[6] = (w1 * a) + (h0 * c) + tx;
            data[7] = (w1 * b) + (h0 * d) + ty;
    
            //  bottom right
            data[12] = (w0 * a) + (h0 * c) + tx;
            data[13] = (w0 * b) + (h0 * d) + ty;
    
            //  top right
            data[18] = (w0 * a) + (h1 * c) + tx;
            data[19] = (w0 * b) + (h1 * d) + ty;

            this.dirty = false;
        }

        const textureIndex = this.texture.glIndex;

        //  Do we have a different texture ID?
        if (textureIndex !== this._prevTextureID)
        {
            this._prevTextureID = textureIndex;

            data[4] = textureIndex;
            data[10] = textureIndex;
            data[16] = textureIndex;
            data[22] = textureIndex;
        }

        //  Copy the data to the array buffer
        F32.set(data, offset);

        const color = this.vertexColor;

        //  Copy the vertex colors to the Uint32 view (as the data copy above overwrites them)
        U32[offset + 5] = color[0];
        U32[offset + 11] = color[2];
        U32[offset + 17] = color[3];
        U32[offset + 23] = color[1];
    }

    set alpha (value: number)
    {
        this._alpha = value;

        this.setAlpha(value);
    }

    get tint (): number
    {
        return this._tint;
    }

    set tint (value: number)
    {
        this._tint = value;

        this.setTint(value);
    }

    /*
        vertexData array structure:

        0 = topLeft.x
        1 = topLeft.y
        2 = frame.u0
        3 = frame.v0
        4 = textureIndex
        5 = topLeft.packedColor

        6 = bottomLeft.x
        7 = bottomLeft.y
        8 = frame.u0
        9 = frame.v1
        10 = textureIndex
        11 = bottomLeft.packedColor

        12 = bottomRight.x
        13 = bottomRight.y
        14 = frame.u1
        15 = frame.v1
        16 = textureIndex
        17 = bottomRight.packedColor

        18 = topRight.x
        19 = topRight.y
        20 = frame.u1
        21 = frame.v0
        22 = textureIndex
        23 = topRight.packedColor
    */
}
