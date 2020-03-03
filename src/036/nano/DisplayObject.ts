import Texture from './Texture';
import Frame from './Frame';
import Vec2 from './Vec2';
import DisplayObjectContainer from './DisplayObjectContainer';
import Scene from './Scene';

export default class DisplayObject
{
    readonly scene: Scene;

    texture: Texture = null;
    frame: Frame = null;

    dirty: boolean = true;
    visible: boolean = true;
    renderable: boolean = true;
    parent: DisplayObjectContainer;

    width: number;
    height: number;

    protected _position: Vec2 = new Vec2();
    protected _scale: Vec2 = new Vec2(1, 1);
    protected _skew: Vec2 = new Vec2();
    protected _origin: Vec2 = new Vec2(0.5, 0.5);
    protected _rotation: number = 0;

    protected _alpha: number = 1;
    // private _tint: number = 0xffffff;

    localTransform: { a: number; b: number; c: number; d: number; tx: number; ty: number; };
    worldTransform: { a: number; b: number; c: number; d: number; tx: number; ty: number; };

    constructor (scene: Scene, x: number, y: number)
    {
        this.localTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
        this.worldTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };

        this.scene = scene;
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

            return;
        }

        const pt = parent.worldTransform;

        let { a, b, c, d, tx, ty } = lt;

        wt.a  = a  * pt.a + b  * pt.c;
        wt.b  = a  * pt.b + b  * pt.d;
        wt.c  = c  * pt.a + d  * pt.c;
        wt.d  = c  * pt.b + d  * pt.d;
        wt.tx = tx * pt.a + ty * pt.c + pt.tx;
        wt.ty = tx * pt.b + ty * pt.d + pt.ty;

        /*
        a = wt.a;
        b = wt.b;
        c = wt.c;
        d = wt.d;

        const determ = (a * d) - (b * c);

        if (a || b)
        {
            const r = Math.sqrt((a * a) + (b * b));

            // this.worldRotation = (b > 0) ? Math.acos(a / r) : -Math.acos(a / r);
            // this.worldScale.x = r;
            // this.worldScale.y = determ / r;
        }
        else if (c || d)
        {
            var s = Math.sqrt((c * c) + (d * d));

            // this.worldRotation = Phaser.Math.HALF_PI - ((d > 0) ? Math.acos(-c / s) : -Math.acos(c / s));
            // this.worldScale.x = determ / s;
            // this.worldScale.y = s;
        }
        else
        {
            // this.worldScale.x = 0;
            // this.worldScale.y = 0;
        }

        //  Set the World values
        // this.worldAlpha = this.alpha * p.worldAlpha;
        // this.worldPosition.x = wt.tx;
        // this.worldPosition.y = wt.ty;

        // reset the bounds each time this is called!
        // this._currentBounds = null;
        */

        return this;
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
        this._rotation = rotation;

        return this.updateCache();
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

    get alpha (): number
    {
        return this._alpha;
    }

    set alpha (value: number)
    {
        this._alpha = value;

        this.dirty = true;
    }

}
