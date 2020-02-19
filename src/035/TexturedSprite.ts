import Texture from './Texture';
import { Transform } from '@phaserjs/math-transform';
import { Vec2 } from '@phaserjs/math-vec2';

export default class Sprite extends Transform
{
    readonly topLeft: Vec2;
    readonly topRight: Vec2;
    readonly bottomLeft: Vec2;
    readonly bottomRight: Vec2;

    readonly rgba;

    visible: boolean = true;
    texture: Texture = null;

    uv = {
        topLeft: { x: 0, y: 0 },
        topRight: { x: 1, y: 0 },
        bottomLeft: { x: 0, y: 1 },
        bottomRight: { x: 1, y: 1 }
    };

    private _size: Vec2;

    constructor (x: number, y: number, width: number, height: number, r: number = 1, g: number = 1, b: number = 1, a: number = 1)
    {
        super(x, y);

        this._size = new Vec2(width, height);

        this.topLeft = new Vec2();
        this.topRight = new Vec2();
        this.bottomLeft = new Vec2();
        this.bottomRight = new Vec2();

        this.rgba = { r, g, b, a };

        this.updateVertices();
    }

    setTexture (texture: Texture)
    {
        this.texture = texture;

        this._size.set(texture.width, texture.height);

        this.dirty = true;

        this.updateVertices();

        return this;
    }

    updateVertices (): boolean
    {
        if (!this.dirty)
        {
            return false;
        }

        this.update();

        const w: number = this._size.x;
        const h: number = this._size.y;

        const x0: number = -(this._origin.x * w);
        const x1: number = x0 + w;
        const y0: number = -(this._origin.y * h);
        const y1: number = y0 + h;

        const { a, b, c, d, tx, ty } = this.local;

        //  Cache the calculations to avoid 8 getX/Y function calls:

        const x0a: number = x0 * a;
        const x0b: number = x0 * b;
        const y0c: number = y0 * c;
        const y0d: number = y0 * d;

        const x1a: number = x1 * a;
        const x1b: number = x1 * b;
        const y1c: number = y1 * c;
        const y1d: number = y1 * d;

        this.topLeft.set(x0a + y0c + tx, x0b + y0d + ty);
        this.topRight.set(x1a + y0c + tx, x1b + y0d + ty);
        this.bottomLeft.set(x0a + y1c + tx, x0b + y1d + ty);
        this.bottomRight.set(x1a + y1c + tx, x1b + y1d + ty);

        return true;
    }    

    batch (dataTA: Float32Array, offset: number)
    {
        dataTA[offset + 0] = this.topLeft.x;
        dataTA[offset + 1] = this.topLeft.y;
        dataTA[offset + 2] = this.rgba.r;
        dataTA[offset + 3] = this.rgba.g;
        dataTA[offset + 4] = this.rgba.b;
        dataTA[offset + 5] = this.rgba.a;
        dataTA[offset + 6] = this.uv.topLeft.x;
        dataTA[offset + 7] = this.uv.topLeft.y;

        dataTA[offset + 8] = this.bottomLeft.x;
        dataTA[offset + 9] = this.bottomLeft.y;
        dataTA[offset + 10] = this.rgba.r;
        dataTA[offset + 11] = this.rgba.g;
        dataTA[offset + 12] = this.rgba.b;
        dataTA[offset + 13] = this.rgba.a;
        dataTA[offset + 14] = this.uv.bottomLeft.x;
        dataTA[offset + 15] = this.uv.bottomLeft.y;

        dataTA[offset + 16] = this.bottomRight.x;
        dataTA[offset + 17] = this.bottomRight.y;
        dataTA[offset + 18] = this.rgba.r;
        dataTA[offset + 19] = this.rgba.g;
        dataTA[offset + 20] = this.rgba.b;
        dataTA[offset + 21] = this.rgba.a;
        dataTA[offset + 22] = this.uv.bottomRight.x;
        dataTA[offset + 23] = this.uv.bottomRight.y;

        dataTA[offset + 24] = this.topRight.x;
        dataTA[offset + 25] = this.topRight.y;
        dataTA[offset + 26] = this.rgba.r;
        dataTA[offset + 27] = this.rgba.g;
        dataTA[offset + 28] = this.rgba.b;
        dataTA[offset + 29] = this.rgba.a;
        dataTA[offset + 30] = this.uv.topRight.x;
        dataTA[offset + 31] = this.uv.topRight.y;
    }

}