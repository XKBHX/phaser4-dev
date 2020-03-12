import { IDirtyComponent } from './DirtyComponent';

type Constructor<T = {}> = new (...args: any[]) => T;
type Dirtyable = Constructor<IDirtyComponent>

export function AlphaComponent<TBase extends Dirtyable>(Base: TBase)
{
    return class AlphaComponent extends Base
    {
        private _alpha: number = 1;
    
        setAlpha (value: number = 1)
        {
            if (value !== this._alpha)
            {
                this._alpha = value;

                this.setDirty();
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
    
                this.setDirty();
            }
        }
    };
}

export interface IAlphaComponent
{
    alpha: number;
    setAlpha (value?: number): this;
}
