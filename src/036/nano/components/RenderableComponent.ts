import { IAlphaComponent } from './AlphaComponent';
import { ITextureComponent } from './TextureComponent';
import { IVisibleComponent } from './VisibleComponent';

type Constructor<T = {}> = new (...args: any[]) => T;
type CanRender = Constructor<IAlphaComponent & ITextureComponent & IVisibleComponent>;

export function RenderableComponent<TBase extends CanRender>(Base: TBase)
{
    return class RenderableComponent extends Base
    {
        renderable: boolean = true;
    
        setRenderable (value: boolean)
        {
            this.renderable = value;
    
            return this;
        }

        willRender (): boolean
        {
            return (this.visible && this.renderable && this.alpha > 0 && this.hasTexture);
        }
    };
}

export interface IRenderableComponent
{
    renderable: boolean;
    setRenderable: (value: boolean) => this;
    willRender: () => boolean;
}
