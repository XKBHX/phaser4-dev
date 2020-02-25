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

    frames: Map<string | number, Frame>;

    _onLoadCallback: Function;

    constructor (key: string, renderer: WebGLRenderer)
    {
        this.key = key;

        this.renderer = renderer;

        this.frames = new Map();
    }

    load (url: string, callback?: Function)
    {
        this.image = new Image();

        this.image.onload = () => this.onLoad();

        this.image.src = url;

        if (callback)
        {
            this._onLoadCallback = callback;
        }

        // Image is immediately-available / cached
        if (this.image.complete && this.image.width && this.image.height)
        {
            this.onLoad();
        }
    }

    onLoad ()
    {
        this.glTexture = this.renderer.createGLTexture(this.image);

        this.width = this.image.width;
        this.height = this.image.height;

        //  Add default frame
        this.frames.set('__base', new Frame(this, 0, 0, this.width, this.height));

        this.image.onload = null;

        this.renderer.addTexture(this);

        if (this._onLoadCallback)
        {
            this._onLoadCallback(this);
        }
    }

    get (key: string | number = '__base')
    {
        return this.frames.get(key);
    }

}
