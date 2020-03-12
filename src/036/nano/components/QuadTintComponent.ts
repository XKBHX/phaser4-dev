import ISprite from '../gameobjects/ISprite';

type Constructor<T = {}> = new (...args: any[]) => T;
type Tintable = Constructor<ISprite>

export function QuadTintComponent<TBase extends Tintable>(Base: TBase)
{
    return class QuadTintComponent extends Base
    {
        private _tint: number = 0xffffff;
        vertexTint: Uint32Array;

        constructor (...args: any[])
        {
            super(args);

            this.vertexTint = new Uint32Array(4).fill(0xffffff);
        }

        setTint (topLeft: number = 0xffffff, topRight: number = topLeft, bottomLeft: number = topLeft, bottomRight: number = topLeft)
        {
            const tint = this.vertexTint;
    
            tint[0] = topLeft;
            tint[1] = topRight;
            tint[2] = bottomLeft;
            tint[3] = bottomRight;
    
            return this.packColors();
        }
    
        get tint (): number
        {
            return this._tint;
        }
    
        set tint (value: number)
        {
            this._tint = value;
    
            this.setTint(value);
        }
    };
}

export interface IQuadTintComponent
{
    tint: number;
    vertexTint: Uint32Array;
    setTint (topLeft: number, topRight?: number, bottomLeft?: number, bottomRight?: number): this;
}
