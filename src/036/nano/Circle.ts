export default class Circle
{
    x: number;
    y: number;
    radius: number;

    constructor (x: number = 0, y: number = 0, radius: number = 0)
    {
        this.set(x, y, radius);
    }

    set (x: number = 0, y: number = 0, radius: number = 0)
    {
        this.x = x;
        this.y = y;
        this.radius = radius;

        return this;
    }

    contains (px: number, py: number): boolean
    {
        const { x, y, radius } = this;

        var dx = (x - px) * (x - px);
        var dy = (y - py) * (y - py);

        return (dx + dy) <= (radius * radius);
    }

    get diameter (): number
    {
        return this.radius * 2;
    }

    set diameter (value: number)
    {
        this.radius = value * 0.5;
    }

}