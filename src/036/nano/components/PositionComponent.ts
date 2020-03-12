import Vec2 from '../math/Vec2';
import { ITransformComponent } from './TransformComponent';

type Constructor<T = {}> = new (...args: any[]) => T;
type Positionable = Constructor<ITransformComponent>

export function PositionComponent<TBase extends Positionable>(Base: TBase)
{
    return class PositionComponent extends Base
    {
        private _position: Vec2 = new Vec2();

        setPosition (x: number, y: number = x)
        {
            this._position.set(x, y);
    
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
    };
}

export interface IPositionComponent
{
    x: number;
    y: number;
    setPosition (x: number, y?: number): this;
}
