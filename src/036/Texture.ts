//  Base Texture

import WebGLRenderer from 'WebGLRenderer';
import Frame from 'Frame';

export default class Texture
{
    key: string;

    width: number;
    height: number;

    image: HTMLImageElement;

    renderer: WebGLRenderer;
    glTexture: WebGLTexture;
    glIndex: number = 0;
    glIndexCounter: number = -1;

    frames: Map<string | number, Frame>;

    constructor (key: string, image: HTMLImageElement)
    {
        this.key = key;

        this.image = image;

        this.frames = new Map();

        this.width = this.image.width;
        this.height = this.image.height;

        //  Add default frame
        this.frames.set('__base', new Frame(this, 0, 0, this.width, this.height));
    }

    get (key: string | number = '__base')
    {
        return this.frames.get(key);
    }

}
