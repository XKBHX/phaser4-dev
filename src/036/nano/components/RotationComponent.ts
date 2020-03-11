import IDisplayObject from 'nano/IDisplayObject';

type Constructor<T = {}> = new (...args: any[]) => T;
type DisplayObject = Constructor<IDisplayObject>

export function RotationComponent<TBase extends DisplayObject>(Base: TBase)
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
