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

    private _size: Vec2;

    constructor (x: number, y: number, width: number, height: number, r: number, g: number, b: number, a: number)
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

        dataTA[offset + 6] = this.bottomLeft.x;
        dataTA[offset + 7] = this.bottomLeft.y;
        dataTA[offset + 8] = this.rgba.r;
        dataTA[offset + 9] = this.rgba.g;
        dataTA[offset + 10] = this.rgba.b;
        dataTA[offset + 11] = this.rgba.a;

        dataTA[offset + 12] = this.bottomRight.x;
        dataTA[offset + 13] = this.bottomRight.y;
        dataTA[offset + 14] = this.rgba.r;
        dataTA[offset + 15] = this.rgba.g;
        dataTA[offset + 16] = this.rgba.b;
        dataTA[offset + 17] = this.rgba.a;

        dataTA[offset + 18] = this.topRight.x;
        dataTA[offset + 19] = this.topRight.y;
        dataTA[offset + 20] = this.rgba.r;
        dataTA[offset + 21] = this.rgba.g;
        dataTA[offset + 22] = this.rgba.b;
        dataTA[offset + 23] = this.rgba.a;
    }


}