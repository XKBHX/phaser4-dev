export default class Vertex
{
    x: number;
    y: number;
    color: number;
    alpha: number;

    constructor (x: number = 0, y: number = 0, color: number = 16777215, alpha: number = 1)
    {
        this.x = x;
        this.y = y;
        this.color = color;
        this.alpha = alpha;
    }
}