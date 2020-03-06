export default class Ellipse
{
    x: number;
    y: number;
    width: number;
    height: number;

    constructor (x: number = 0, y: number = 0, width: number = 0, height: number = 0)
    {
        this.set(x, y, width, height);
    }

    set (x: number = 0, y: number = 0, width: number = 0, height: number = 0): Ellipse
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
    
        //  Normalize the coords to an ellipse with center 0,0 and a radius of 0.5
        let normx: number = ((px - x) / width);
        let normy: number = ((py - y) / height);
    
        normx *= normx;
        normy *= normy;
    
        return (normx + normy < 0.25);
    }
}