import Texture from './Texture';

export default class Frame
{
    texture: Texture;
    key: string | number;

    //  This is the actual area of the texture to draw to canvas / webgl, including any extruded data.
    //  This is the same as the 'trimmed' + 'extruded' area from an atlas.
    x: number;
    y: number;
    width: number;
    height: number;

    trimmed: boolean = false;

    //  Original size of the image before being trimmed or added to an atlas (which can add extrude data to it).
    sourceSizeWidth: number;
    sourceSizeHeight: number;

    //  The size of the image having been trimmed, before being added to the atlas (i.e. doesn't have any extrusion values in it)
    spriteSourceSizeX: number;
    spriteSourceSizeY: number;
    spriteSourceSizeWidth: number;
    spriteSourceSizeHeight: number;

    pivot: { x: number, y: number };

    u0: number;
    v0: number;
    u1: number;
    v1: number;

    constructor (texture: Texture, key: string | number, x: number, y: number, width: number, height: number)
    {
        this.texture = texture;
        this.key = key;

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.sourceSizeWidth = width;
        this.sourceSizeHeight = height;

        this.updateUVs();
    }

    setPivot (x: number, y: number)
    {
        this.pivot = { x, y };
    }

    setSourceSize (width: number, height: number)
    {
        this.sourceSizeWidth = width;
        this.sourceSizeHeight = height;
    }

    setTrim (width: number, height: number, x: number, y: number, w: number, h: number)
    {
        this.trimmed = true;

        this.sourceSizeWidth = width;
        this.sourceSizeHeight = height;

        this.spriteSourceSizeX = x;
        this.spriteSourceSizeY = y;
        this.spriteSourceSizeWidth = w;
        this.spriteSourceSizeHeight = h;
    }

    updateUVs ()
    {
        const { x, y, width, height } = this;

        const baseTextureWidth = this.texture.width;
        const baseTextureHeight = this.texture.height;

        this.u0 = x / baseTextureWidth;
        this.v0 = y / baseTextureHeight;

        this.u1 = (x + width) / baseTextureWidth;
        this.v1 = (y + height) / baseTextureHeight;
    }
}
