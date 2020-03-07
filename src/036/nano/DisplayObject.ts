import Vec2 from './Vec2';
import DisplayObjectContainer from './DisplayObjectContainer';
import Scene from './Scene';
import IMatrix2d from './IMatrix2d';
import LocalToGlobal from './LocalToGlobal';
import GlobalToLocal from './GlobalToLocal';

export default class DisplayObject
{
    scene: Scene;

    dirty: boolean = true;
    visible: boolean = true;
    renderable: boolean = true;
    hasTexture: boolean = false;

    parent: DisplayObjectContainer;

    width: number = 0;
    height: number = 0;

    protected _position: Vec2 = new Vec2();
    protected _scale: Vec2 = new Vec2(1, 1);
    protected _skew: Vec2 = new Vec2();
    protected _origin: Vec2 = new Vec2(0.5, 0.5);
    protected _rotation: number = 0;

    protected _alpha: number = 1;

    localTransform: IMatrix2d;
    worldTransform: IMatrix2d;

    constructor (scene: Scene, x: number = 0, y: number = 0)
    {
        this.localTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
        this.worldTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };

        this._position.set(x, y);

        this.setScene(scene);
    }

    setScene (scene: Scene)
    {
        this.scene = scene;

        return this;
    }

    updateTransform ()
    {
        this.dirty = true;

        const parent = this.parent;

        const lt = this.localTransform;
        const wt = this.worldTransform;

        lt.tx = this.x;
        lt.ty = this.y;

        if (!parent)
        {
            wt.a = lt.a;
            wt.b = lt.b;
            wt.c = lt.c;
            wt.d = lt.d;
            wt.tx = lt.tx;
            wt.ty = lt.ty;

            return this;
        }

        const pt = parent.worldTransform;

        let { a, b, c, d, tx, ty } = lt;

        wt.a  = a  * pt.a + b  * pt.c;
        wt.b  = a  * pt.b + b  * pt.d;
        wt.c  = c  * pt.a + d  * pt.c;
        wt.d  = c  * pt.b + d  * pt.d;
        wt.tx = tx * pt.a + ty * pt.c + pt.tx;
        wt.ty = tx * pt.b + ty * pt.d + pt.ty;

        return this;
    }

    localToGlobal (x: number, y: number, outPoint: Vec2 = new Vec2()): Vec2
    {
        return LocalToGlobal(this.worldTransform, x, y, outPoint);
    }

    globalToLocal (x: number, y: number, outPoint: Vec2 = new Vec2()): Vec2
    {
        return GlobalToLocal(this.worldTransform, x, y, outPoint);
    }

    willRender (): boolean
    {
        return (this.visible && this.renderable && this._alpha > 0);
    }

    setAlpha (alpha: number = 1)
    {
        if (alpha !== this._alpha)
        {
            this._alpha = alpha;

            this.dirty = true;
        }

        return this;
    }

    setSize (width: number, height: number)
    {
        this.width = width;
        this.height = height;

        return this;
    }

    setPosition (x: number, y: number)
    {
        this._position.set(x, y);

        return this.updateTransform();
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
        if (rotation !== this._rotation)
        {
            this._rotation = rotation;

            this.updateCache();
        }

        return this;
    }

    private updateCache ()
    {
        const transform = this.localTransform;

        const { _rotation, _skew, _scale } = this;

        transform.a = Math.cos(_rotation + _skew.y) * _scale.x;
        transform.b = Math.sin(_rotation + _skew.y) * _scale.x;
        transform.c = -Math.sin(_rotation - _skew.x) * _scale.y;
        transform.d = Math.cos(_rotation - _skew.x) * _scale.y;

        return this.updateTransform();
    }

    set x (value: number)
    {
        this._position.x = value;

        this.updateTransform();
    }

    get x (): number
    {
        return this._position.x;
    }

    set y (value: number)
    {
        this._position.y = value;

        this.updateTransform();
    }

    get y (): number
    {
        return this._position.y;
    }

    set rotation (value: number)
    {
        if (value !== this._rotation)
        {
            this._rotation = value;

            this.updateCache();
        }
    }

    get rotation (): number
    {
        return this._rotation;
    }

    set scaleX (value: number)
    {
        if (value !== this._scale.x)
        {
            this._scale.x = value;

            this.updateCache();
        }
    }

    get scaleX (): number
    {
        return this._scale.x;
    }

    set scaleY (value: number)
    {
        if (value !== this._scale.y)
        {
            this._scale.y = value;

            this.updateCache();
        }
    }

    get scaleY (): number
    {
        return this._scale.y;
    }

    set skewX (value: number)
    {
        if (value !== this._skew.x)
        {
            this._skew.x = value;

            this.updateCache();
        }
    }

    get skewX (): number
    {
        return this._skew.x;
    }

    set skewY (value: number)
    {
        if (value !== this._skew.y)
        {
            this._skew.y = value;

            this.updateCache();
        }
    }

    get originX (): number
    {
        return this._origin.x;
    }

    set originX (value: number)
    {
        this._origin.x = value;
    }

    get originY (): number
    {
        return this._origin.y;
    }

    set originY (value: number)
    {
        this._origin.y = value;
    }

    get alpha (): number
    {
        return this._alpha;
    }

    set alpha (value: number)
    {
        if (value !== this._alpha)
        {
            this._alpha = value;

            this.dirty = true;
        }
    }

}
