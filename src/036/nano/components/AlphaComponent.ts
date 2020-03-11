import IDisplayObject from 'nano/IDisplayObject';

type Constructor<T = {}> = new (...args: any[]) => T;
type DisplayObject = Constructor<IDisplayObject>

export function AlphaComponent<TBase extends DisplayObject>(Base: TBase)
{
    return class AlphaComponent extends Base
    {
        private _alpha: number = 1;
    
        setAlpha (alpha: number = 1)
        {
            if (alpha !== this._alpha)
            {
                this._alpha = alpha;
    
                this.dirtyFrame = this.scene.game.frame;
            }
    
            return this;
        }
    
        get alpha (): number
        {
            return this._alpha;
        }
    
        set alpha (value: number)
        {
            if (value !== this._alpha)
            {
                this._alpha = value;
    
                this.dirtyFrame = this.scene.game.frame;
            }
        }
    };
}

export interface IAlphaComponent
{
    alpha: number;
    setAlpha (value: number): this;
}
