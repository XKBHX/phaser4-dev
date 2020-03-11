import BaseDisplayObject from '../BaseDisplayObject';

type Constructor<T = BaseDisplayObject> = new (...args: any[]) => T;

export default function Wibble<TBase extends Constructor>(Base: TBase)
{
    return class Wibble extends Base
    {
        protected _wibble: number = 1;

        setWibble (value: number = 1)
        {
            if (value !== this._wibble)
            {
                this._wibble = value;

                this.setScale(value);
            }
    
            return this;
        }
    
        get wibble (): number
        {
            return this._wibble;
        }
    
        set wibble (value: number)
        {
            if (value !== this._wibble)
            {
                this._wibble = value;
            }
        }
    
    };
}
