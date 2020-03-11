import ISprite from '../ISprite';

type Constructor<T = {}> = new (...args: any[]) => T;
type Sprite = Constructor<ISprite>

export function QuadAlphaComponent<TBase extends Sprite>(Base: TBase)
{
    return class QuadAlphaComponent extends Base
    {
        private _alpha: number = 1;

        setAlpha (topLeft: number = 1, topRight: number = topLeft, bottomLeft: number = topLeft, bottomRight: number = topLeft)
        {
            const alpha = this.vertexAlpha;
    
            alpha[0] = topLeft;
            alpha[1] = topRight;
            alpha[2] = bottomLeft;
            alpha[3] = bottomRight;
    
            return this.packColors();
        }

        get alpha (): number
        {
            return this._alpha;
        }

        set alpha (value: number)
        {
            this._alpha = value;
    
            this.setAlpha(value);
        }
    };
}

export interface IQuadAlphaComponent
{
    alpha: number;
    setAlpha (topLeft: number, topRight?: number, bottomLeft?: number, bottomRight?: number): this;
}
