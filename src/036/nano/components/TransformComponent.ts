import { IDirtyComponent } from './DirtyComponent';
import { IPositionComponent } from './PositionComponent';
import { IRotationComponent } from './RotationComponent';
import { IScaleComponent } from './ScaleComponent';
import { ISkewComponent } from './SkewComponent';
import IContainerChild from '../gameobjects/IContainerChild';
import IMatrix2d from '../IMatrix2d';
import Vec2 from '../Vec2';
import LocalToGlobal from '../LocalToGlobal';
import GlobalToLocal from '../GlobalToLocal';

type Constructor<T = {}> = new (...args: any[]) => T;
type Transformable = Constructor<IDirtyComponent & IContainerChild & IPositionComponent & IRotationComponent & IScaleComponent & ISkewComponent>

export function TransformComponent<TBase extends Transformable>(Base: TBase)
{
    return class TransformComponent extends Base
    {
        localTransform: IMatrix2d;
        worldTransform: IMatrix2d;

        constructor (...args: any[])
        {
            super(args);

            this.localTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
            this.worldTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
        }

        updateCache ()
        {
            const transform = this.localTransform;
    
            const { rotation, skewX, skewY, scaleX, scaleY } = this;

            transform.a = Math.cos(rotation + skewY) * scaleX;
            transform.b = Math.sin(rotation + skewY) * scaleX;
            transform.c = -Math.sin(rotation - skewX) * scaleY;
            transform.d = Math.cos(rotation - skewX) * scaleY;
    
            return this.updateTransform();
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

        localToGlobal (x: number, y: number, outPoint: Vec2 = new Vec2()): Vec2
        {
            return LocalToGlobal(this.worldTransform, x, y, outPoint);
        }
    
        globalToLocal (x: number, y: number, outPoint: Vec2 = new Vec2()): Vec2
        {
            return GlobalToLocal(this.worldTransform, x, y, outPoint);
        }
    };
}

export interface ITransformComponent
{
    localTransform: IMatrix2d;
    worldTransform: IMatrix2d;
    updateCache (): this;
    updateTransform (): this;
    localToGlobal (x: number, y: number, outPoint?: Vec2): Vec2;
    globalToLocal (x: number, y: number, outPoint?: Vec2): Vec2;
}
