type Constructor<T = {}> = new (...args: any[]) => T;

export function RenderableComponent<TBase extends Constructor>(Base: TBase)
{
    return class RenderableComponent extends Base
    {
        renderable: boolean = true;
    
        setRenderable (value: boolean)
        {
            this.renderable = value;
    
            return this;
        }
    };
}

export interface IRenderableComponent
{
    renderable: boolean;
    setRenderable (value: boolean): this;
}
