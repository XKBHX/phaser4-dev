import { ITransformComponent } from './TransformComponent';

type Constructor<T = {}> = new (...args: any[]) => T;
type Rotateable = Constructor<ITransformComponent>

export function RotationComponent<TBase extends Rotateable>(Base: TBase)
{
    return class RotationComponent extends Base
    {
        private _rotation: number = 0;
    
        setRotation (rotation: number)
        {
            if (rotation !== this._rotation)
            {
                this._rotation = rotation;
    
                this.updateCache();
            }
    
            return this;
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
    };
}

export interface IRotationComponent
{
    rotation: number;
    setRotation (value: number): this;
}
