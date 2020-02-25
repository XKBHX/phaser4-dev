import Texture from './Texture';
import Frame from './Frame';
import { Vec2 } from '@phaserjs/math-vec2';

export default class Sprite
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
    frame: Frame = null;

    private _size: Vec2;

    private _a: number = 1;
    private _b: number = 0;
    private _c: number = 0;
    private _d: number = 1;
    private _tx: number = 0;
    private _ty: number = 0;

    constructor (x: number, y: number, frame: Frame)
    {
        this.frame = frame;
        this.texture = frame.texture;

        this._size = new Vec2(frame.width, frame.height);

        this.topLeft = new Vec2();
        this.topRight = new Vec2();
        this.bottomLeft = new Vec2();
        this.bottomRight = new Vec2();

        this._position = new Vec2(x, y);
        this._scale = new Vec2(1, 1);
        this._skew = new Vec2(0, 0);
        this._origin = new Vec2(0, 0);
        this._rotation = 0;

        //  Transform.update:
        this._tx = x;
        this._ty = y;
    }

    setPosition (x: number, y: number)
    {
        this._position.set(x, y);

        return this;
    }

    setScale (scaleX: number, scaleY: number = scaleX)
    {
        this._scale.set(scaleX, scaleY);

        return this.updateCache();
    }

    setSkew (skewX: number, skewY: number)
    {
        this._skew.set(skewX, skewY);

        return this.updateCache();
    }

    setOrigin (originX: number, originY: number = originX)
    {
        this._origin.set(originX, originY);

        return this;
    }

    setRotation (rotation: number)
    {
        this._rotation = rotation;

        return this.updateCache();
    }

    private updateCache ()
    {
        const { _rotation, _skew, _scale } = this;

        this._a = Math.cos(_rotation + _skew.y) * _scale.x;
        this._b = Math.sin(_rotation + _skew.y) * _scale.x;
        this._c = -Math.sin(_rotation - _skew.x) * _scale.y;
        this._d = Math.cos(_rotation - _skew.x) * _scale.y;

        return this;
    }

    setTexture (texture: Texture)
    {
        this.texture = texture;

        this._size.set(texture.width, texture.height);

        return this;
    }

    update ()
    {
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

    set rotation (value: number)
    {
        this._rotation = value;

        this.updateCache();
    }

    get rotation (): number
    {
        return this._rotation;
    }

    set scaleX (value: number)
    {
        this._scale.x = value;

        this.updateCache();
    }

    get scaleX (): number
    {
        return this._scale.x;
    }

    set scaleY (value: number)
    {
        this._scale.y = value;

        this.updateCache();
    }

    get scaleY (): number
    {
        return this._scale.y;
    }

    set skewX (value: number)
    {
        this._skew.x = value;

        this.updateCache();
    }

    get skewX (): number
    {
        return this._skew.x;
    }

    set skewY (value: number)
    {
        this._skew.y = value;

        this.updateCache();
    }

    get skewY (): number
    {
        return this._skew.y;
    }
}