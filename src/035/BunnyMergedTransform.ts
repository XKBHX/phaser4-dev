import Texture from './Texture';
import { Vec2 } from '@phaserjs/math-vec2';

export default class BunnyMergedTransform
{
    readonly topLeft: Vec2;
    readonly topRight: Vec2;
    readonly bottomLeft: Vec2;
    readonly bottomRight: Vec2;

    readonly rgba = { r: 1, g: 1, b: 1, a: 1 };

    protected _position: Vec2;
    protected _scale: Vec2;
    protected _skew: Vec2;
    protected _origin: Vec2;
    protected _rotation: number;

    visible: boolean = true;
    texture: Texture = null;

    uv = {
        topLeft: { x: 0, y: 0 },
        topRight: { x: 1, y: 0 },
        bottomLeft: { x: 0, y: 1 },
        bottomRight: { x: 1, y: 1 }
    };

    bounds = null;

    private _size: Vec2;

    private _a: number = 1;
    private _b: number = 0;
    private _c: number = 0;
    private _d: number = 1;
    private _tx: number = 0;
    private _ty: number = 0;

    gravity: number = 0.75;
    speedX: number = Math.random() * 10;
    speedY: number = (Math.random() * 10) - 5;

    constructor (x: number, y: number, texture: Texture)
    {
        this.texture = texture;
        this._size = new Vec2(texture.width, texture.height);

        this.topLeft = new Vec2();
        this.topRight = new Vec2();
        this.bottomLeft = new Vec2();
        this.bottomRight = new Vec2();

        this._position = new Vec2(x, y);
        this._scale = new Vec2(1, 1);
        this._skew = new Vec2(0, 0);
        this._origin = new Vec2(0, 0);
        this._rotation = 0;

        this.setOrigin(0.5, 1);

        // this.updateVertices();
    }

    setOrigin (originX: number, originY: number = originX)
    {
        this._origin.set(originX, originY);

        return this;
    }

    private updateCache ()
    {
        const { _rotation, _skew, _scale } = this;

        this._a = Math.cos(_rotation + _skew.y) * _scale.x;
        this._b = Math.sin(_rotation + _skew.y) * _scale.x;
        this._c = -Math.sin(_rotation - _skew.x) * _scale.y;
        this._d = Math.cos(_rotation - _skew.x) * _scale.y;
    }

    setTexture (texture: Texture)
    {
        this.texture = texture;

        this._size.set(texture.width, texture.height);

        // this.dirty = true;

        // this.updateVertices();

        return this;
    }

    step (dataTA: Float32Array, offset: number)
    {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
    
        if (this.x > this.bounds.right)
        {
            this.speedX *= -1;
            this.x = this.bounds.right;
        }
        else if (this.x < this.bounds.left)
        {
            this.speedX *= -1;
            this.x = this.bounds.left;
        }
    
        if (this.y > this.bounds.bottom)
        {
            this.speedY *= -0.85;
            this.y = this.bounds.bottom;

            if (Math.random() > 0.5)
            {
                this.speedY -= Math.random() * 6;
            }
        }
        else if (this.y < this.bounds.top)
        {
            this.speedY = 0;
            this.y = this.bounds.top;
        }

        //  Transform.update:
        this._tx = this.x;
        this._ty = this.y;

        //  Update Vertices:

        const w: number = this._size.x;
        const h: number = this._size.y;

        const x0: number = -(this._origin.x * w);
        const x1: number = x0 + w;
        const y0: number = -(this._origin.y * h);
        const y1: number = y0 + h;

        const { _a, _b, _c, _d, _tx, _ty } = this;

        //  Cache the calculations to avoid 8 getX/Y function calls:

        const x0a: number = x0 * _a;
        const x0b: number = x0 * _b;
        const y0c: number = y0 * _c;
        const y0d: number = y0 * _d;

        const x1a: number = x1 * _a;
        const x1b: number = x1 * _b;
        const y1c: number = y1 * _c;
        const y1d: number = y1 * _d;

        this.topLeft.set(x0a + y0c + _tx, x0b + y0d + _ty);
        this.topRight.set(x1a + y0c + _tx, x1b + y0d + _ty);
        this.bottomLeft.set(x0a + y1c + _tx, x0b + y1d + _ty);
        this.bottomRight.set(x1a + y1c + _tx, x1b + y1d + _ty);

        //  Batch:
        const textureIndex = this.texture.glIndex;

        dataTA[offset + 0] = this.topLeft.x;
        dataTA[offset + 1] = this.topLeft.y;
        dataTA[offset + 2] = this.uv.topLeft.x;
        dataTA[offset + 3] = this.uv.topLeft.y;
        dataTA[offset + 4] = textureIndex;

        dataTA[offset + 5] = this.bottomLeft.x;
        dataTA[offset + 6] = this.bottomLeft.y;
        dataTA[offset + 7] = this.uv.bottomLeft.x;
        dataTA[offset + 8] = this.uv.bottomLeft.y;
        dataTA[offset + 9] = textureIndex;

        dataTA[offset + 10] = this.bottomRight.x;
        dataTA[offset + 11] = this.bottomRight.y;
        dataTA[offset + 12] = this.uv.bottomRight.x;
        dataTA[offset + 13] = this.uv.bottomRight.y;
        dataTA[offset + 14] = textureIndex;

        dataTA[offset + 15] = this.topRight.x;
        dataTA[offset + 16] = this.topRight.y;
        dataTA[offset + 17] = this.uv.topRight.x;
        dataTA[offset + 18] = this.uv.topRight.y;
        dataTA[offset + 19] = textureIndex;
    }

    stepNoTexture (dataTA: Float32Array, offset: number)
    {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
    
        if (this.x > this.bounds.right)
        {
            this.speedX *= -1;
            this.x = this.bounds.right;
        }
        else if (this.x < this.bounds.left)
        {
            this.speedX *= -1;
            this.x = this.bounds.left;
        }
    
        if (this.y > this.bounds.bottom)
        {
            this.speedY *= -0.85;
            this.y = this.bounds.bottom;

            if (Math.random() > 0.5)
            {
                this.speedY -= Math.random() * 6;
            }
        }
        else if (this.y < this.bounds.top)
        {
            this.speedY = 0;
            this.y = this.bounds.top;
        }

        //  Transform.update:
        this._tx = this.x;
        this._ty = this.y;

        //  Update Vertices:

        const w: number = this._size.x;
        const h: number = this._size.y;

        const x0: number = -(this._origin.x * w);
        const x1: number = x0 + w;
        const y0: number = -(this._origin.y * h);
        const y1: number = y0 + h;

        const { _a, _b, _c, _d, _tx, _ty } = this;

        //  Cache the calculations to avoid 8 getX/Y function calls:

        const x0a: number = x0 * _a;
        const x0b: number = x0 * _b;
        const y0c: number = y0 * _c;
        const y0d: number = y0 * _d;

        const x1a: number = x1 * _a;
        const x1b: number = x1 * _b;
        const y1c: number = y1 * _c;
        const y1d: number = y1 * _d;

        this.topLeft.set(x0a + y0c + _tx, x0b + y0d + _ty);
        this.topRight.set(x1a + y0c + _tx, x1b + y0d + _ty);
        this.bottomLeft.set(x0a + y1c + _tx, x0b + y1d + _ty);
        this.bottomRight.set(x1a + y1c + _tx, x1b + y1d + _ty);

        //  Batch:

        dataTA[offset + 0] = this.topLeft.x;
        dataTA[offset + 1] = this.topLeft.y;
        dataTA[offset + 2] = this.uv.topLeft.x;
        dataTA[offset + 3] = this.uv.topLeft.y;

        dataTA[offset + 4] = this.bottomLeft.x;
        dataTA[offset + 5] = this.bottomLeft.y;
        dataTA[offset + 6] = this.uv.bottomLeft.x;
        dataTA[offset + 7] = this.uv.bottomLeft.y;

        dataTA[offset + 8] = this.bottomRight.x;
        dataTA[offset + 9] = this.bottomRight.y;
        dataTA[offset + 10] = this.uv.bottomRight.x;
        dataTA[offset + 11] = this.uv.bottomRight.y;

        dataTA[offset + 12] = this.topRight.x;
        dataTA[offset + 13] = this.topRight.y;
        dataTA[offset + 14] = this.uv.topRight.x;
        dataTA[offset + 15] = this.uv.topRight.y;
    }

    set x (value: number)
    {
        this._position.x = value;
    }

    get x (): number
    {
        return this._position.x;
    }

    set y (value: number)
    {
        this._position.y = value;
    }

    get y (): number
    {
        return this._position.y;
    }


}