import Texture from '../Texture';
import Frame from '../Frame';
import ISprite from '../ISprite';

type Constructor<T = {}> = new (...args: any[]) => T;
type Sprite = Constructor<ISprite>

export function TextureComponent<TBase extends Sprite>(Base: TBase)
{
    return class TextureComponent extends Base
    {
        texture: Texture;
        frame: Frame;
        hasTexture: boolean = false;

        setTexture (key: string | Texture, frame?: string | number)
        {
            if (key instanceof Texture)
            {
                this.texture = key;
            }
            else
            {
                this.texture = this.scene.textures.get(key);
            }
    
            if (!this.texture)
            {
                console.warn('Invalid Texture key: ' + key);
            }
            else
            {
                this.setFrame(frame);
            }
    
            return this;
        }
    
        setFrame (key?: string | number | Frame)
        {
            const frame: Frame = this.texture.get(key);
    
            if (frame === this.frame)
            {
                return this;
            }
    
            this.frame = frame;
    
            this.setSize(frame.sourceSizeWidth, frame.sourceSizeHeight);
    
            if (frame.pivot)
            {
                this.setOrigin(frame.pivot.x, frame.pivot.y);
            }
    
            const data = this.vertexData;
    
            //  This rarely changes, so we'll set it here, rather than every game step:
    
            data[2] = frame.u0;
            data[3] = frame.v0;
    
            data[8] = frame.u0;
            data[9] = frame.v1;
    
            data[14] = frame.u1;
            data[15] = frame.v1;
    
            data[20] = frame.u1;
            data[21] = frame.v0;

            this.setDirty();
    
            this.hasTexture = true;
    
            return this;
        }
    };
}

export interface ITextureComponent
{
    texture: Texture;
    frame: Frame;
    hasTexture: boolean;
    setTexture (key: string | Texture, frame?: string | number): this;
    setFrame (key?: string | number | Frame): this;
}
