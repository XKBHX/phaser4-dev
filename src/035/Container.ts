import { Transform } from '@phaserjs/math-transform';

export default class Container extends Transform
{
    children = [];
    visible: boolean = true;

    constructor (x: number, y: number)
    {
        super(x, y);
    }

    addChild (child)
    {
        if (this.children.indexOf(child) === -1)
        {
            this.children.push(child);
        }
    }

}
