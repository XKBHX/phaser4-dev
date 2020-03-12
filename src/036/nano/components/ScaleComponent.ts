import Vec2 from '../Vec2';
import { ITransformComponent } from './TransformComponent';

type Constructor<T = {}> = new (...args: any[]) => T;
type Scaleable = Constructor<ITransformComponent>

export function ScaleComponent<TBase extends Scaleable>(Base: TBase)
{
    return class ScaleComponent extends Base
    {
        private _scale: Vec2 = new Vec2(1, 1);

        setScale (scaleX: number, scaleY: number = scaleX)
        {
            this._scale.set(scaleX, scaleY);
    
            return this.updateCache();
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
    };
}

export interface IScaleComponent
{
    scaleX: number;
    scaleY: number;
    setScale (scaleX: number, scaleY?: number): this;
}
