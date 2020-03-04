import PackColor from './PackColor';

export default class Vertex
{
    x: number;
    y: number;
    packedColor: number;

    private _color: number;
    private _alpha: number;

    constructor (x: number = 0, y: number = 0, color: number = 16777215, alpha: number = 1)
    {
        this.x = x;
        this.y = y;

        this._color = color;
        this._alpha = alpha;

        this.packedColor = PackColor(color, alpha);
    }

    get alpha (): number
    {
        return this._alpha;
    }

    set alpha (value: number)
    {
        this._alpha = value;

        this.packedColor = PackColor(this._color, value);
    }

    get color (): number
    {
        return this._color;
    }

    set color (value: number)
    {
        this._color = value;

        this.packedColor = PackColor(value, this._alpha);
    }
}
