type Constructor<T = {}> = new (...args: any[]) => T;

export function SizeComponent<TBase extends Constructor>(Base: TBase)
{
    return class SizeComponent extends Base
    {
        width: number;
        height: number;

        setSize (width: number, height: number)
        {
            this.width = width;
            this.height = height;
    
            return this;
        }
    };
}

export interface ISizeComponent
{
    width: number;
    height: number;
    setSize (width: number, height: number): this;
}
