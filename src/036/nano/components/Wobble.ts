import BaseDisplayObject from '../BaseDisplayObject';

type Constructor<T = BaseDisplayObject> = new (...args: any[]) => T;

export default function Wobble<TBase extends Constructor>(Base: TBase)
{
    return class Wobble extends Base
    {
        protected _wobble: number = 1;

        setWobble (value: number = 1)
        {
            if (value !== this._wobble)
            {
                this._wobble = value;

                this.setSkew(value, value);
            }
    
            return this;
        }
    
        get wobble (): number
        {
            return this._wobble;
        }
    
        set wobble (value: number)
        {
            if (value !== this._wobble)
            {
                this._wobble = value;
            }
        }
    
    };
}
