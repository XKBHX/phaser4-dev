import Scene from '../Scene';
import GameObject from './GameObject';
import PackColor from '../PackColor';
import * as Components from '../components';
import Install from '../components/Install';
import ISprite from './ISprite';

export default class Sprite extends Install(GameObject, [
    Components.ContainerComponent,
    Components.QuadAlphaComponent,
    Components.QuadTintComponent,
    Components.TextureComponent
])
{
    vertexData: Float32Array;
    vertexColor: Uint32Array;

    constructor (scene: Scene, x: number, y: number, texture: string, frame?: string | number)
    {
        super();

        this.vertexData = new Float32Array(24).fill(0);
        this.vertexColor = new Uint32Array(4).fill(4294967295);

        this.setScene(scene);
        this.setTexture(texture, frame);
        this.setPosition(x, y);
    }

    packColors ()
    {
        const alpha = this.vertexAlpha;
        const tint = this.vertexTint;
        const color = this.vertexColor;

        //  In lots of cases, this *never* changes, so cache it here:
        color[0] = PackColor(tint[0], alpha[0]);
        color[1] = PackColor(tint[1], alpha[1]);
        color[2] = PackColor(tint[2], alpha[2]);
        color[3] = PackColor(tint[3], alpha[3]);

        this.setDirty();

        return this;
    }

    updateVertices (F32: Float32Array, U32: Uint32Array, offset: number)
    {
        const data = this.vertexData;

        //  Skip all of this if not dirty
        if (this.dirty)
        {
            this.dirty = false;

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
}

export default interface Sprite extends ISprite {}

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
