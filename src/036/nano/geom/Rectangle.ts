export default class Rectangle
{
    x: number;
    y: number;
    width: number;
    height: number;

    constructor (x: number = 0, y: number = 0, width: number = 0, height: number = 0)
    {
        this.set(x, y, width, height);
    }

    set (x: number = 0, y: number = 0, width: number = 0, height: number = 0): Rectangle
    {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        return this;
    }

    contains (px: number, py: number): boolean
    {
        const { x, y, width, height } = this;

        if (width <= 0 || height <= 0)
        {
            return false;
        }
    
        return (x <= px && x + width >= px && y <= py && y + height >= py);
    }
}