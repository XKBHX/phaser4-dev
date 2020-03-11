import Vec2 from '../Vec2';
import IDisplayObject from 'nano/IDisplayObject';

type Constructor<T = {}> = new (...args: any[]) => T;
type DisplayObject = Constructor<IDisplayObject>

export function SkewComponent<TBase extends DisplayObject>(Base: TBase)
{
    return class SkewComponent extends Base
    {
        private _skew: Vec2 = new Vec2();

        setSkew (skewX: number, skewY: number = skewX)
        {
            this._skew.set(skewX, skewY);
    
            return this.updateCache();
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
    };
}

export interface ISkewComponent
{
    skewX: number;
    skewY: number;
    setSkew (skewX: number, skewY?: number): this;
}
