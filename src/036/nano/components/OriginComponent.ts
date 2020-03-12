import Vec2 from '../math/Vec2';

type Constructor<T = {}> = new (...args: any[]) => T;

export function OriginComponent<TBase extends Constructor>(Base: TBase)
{
    return class OriginComponent extends Base
    {
        private _origin: Vec2 = new Vec2(0.5, 0.5);

        setOrigin (originX: number, originY: number = originX)
        {
            this._origin.set(originX, originY);
    
            return this;
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
    };
}

export interface IOriginComponent
{
    originX: number;
    originY: number;
    setOrigin (originX: number, originY: number): this;
}
