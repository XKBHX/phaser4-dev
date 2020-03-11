import DisplayObjectContainer from './DisplayObjectContainer';
import IMatrix2d from './IMatrix2d';
import Scene from './Scene';
import Vec2 from './Vec2';
import LocalToGlobal from './LocalToGlobal';
import GlobalToLocal from './GlobalToLocal';
import Install from './components/Install';
import * as Components from './components';

export default class DisplayObject extends Install(class {}, [
    Components.AlphaComponent,
    Components.DirtyComponent,
    Components.OriginComponent,
    Components.PositionComponent,
    Components.RenderableComponent,
    Components.RotationComponent,
    Components.ScaleComponent,
    Components.SceneComponent,
    Components.SizeComponent,
    Components.SkewComponent,
    Components.VisibleComponent
])
{
    hasTexture: boolean = false;

    parent: DisplayObjectContainer;

    localTransform: IMatrix2d;
    worldTransform: IMatrix2d;

    constructor (scene: Scene, x: number = 0, y: number = 0)
    {
        super();

        this.localTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
        this.worldTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };

        this._position.set(x, y);

        this.setScene(scene);
    }

    updateTransform ()
    {
        this.setDirty();

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

    protected updateCache ()
    {
        const transform = this.localTransform;

        const { _rotation, _skew, _scale } = this;

        transform.a = Math.cos(_rotation + _skew.y) * _scale.x;
        transform.b = Math.sin(_rotation + _skew.y) * _scale.x;
        transform.c = -Math.sin(_rotation - _skew.x) * _scale.y;
        transform.d = Math.cos(_rotation - _skew.x) * _scale.y;

        return this.updateTransform();
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

};

export default interface DisplayObject extends
    Components.IAlphaComponent,
    Components.IDirtyComponent,
    Components.IOriginComponent,
    Components.IPositionComponent,
    Components.IRenderableComponent,
    Components.IRotationComponent,
    Components.IScaleComponent,
    Components.ISceneComponent,
    Components.ISizeComponent,
    Components.ISkewComponent,
    Components.IVisibleComponent
    {}
