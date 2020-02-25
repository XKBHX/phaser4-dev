import Texture from 'Texture';

export default class Frame
{
    texture: Texture;
    key: string | number;
    x: number;
    y: number;
    width: number;
    height: number;

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

        this.updateUVs();
    }

    updateUVs ()
    {
        const { x, y, width, height } = this;

        const sourceWidth = this.texture.width;
        const sourceHeight = this.texture.height;

        this.u0 = x / sourceWidth;
        this.v0 = y / sourceHeight;

        this.u1 = (x + width) / sourceWidth;
        this.v1 = (y + height) / sourceHeight;
    }
}
