import Vec2 from '../Vec2';
import IDisplayObject from 'nano/IDisplayObject';

type Constructor<T = {}> = new (...args: any[]) => T;
type DisplayObject = Constructor<IDisplayObject>

export function PositionComponent<TBase extends DisplayObject>(Base: TBase)
{
    return class PositionComponent extends Base
    {
        private _position: Vec2 = new Vec2(1, 1);

        setPosition (x: number, y: number = x)
        {
            this._position.set(x, y);
    
            return this.updateCache();
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
    };
}

export interface IPositionComponent
{
    x: number;
    y: number;
    setPosition (x: number, y?: number): this;
}
