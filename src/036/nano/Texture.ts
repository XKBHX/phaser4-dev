import WebGLRenderer from './WebGLRenderer';
import Frame from './Frame';

export default class Texture
{
    key: string;

    width: number;
    height: number;

    image: TexImageSource;

    renderer: WebGLRenderer;
    glTexture: WebGLTexture;
    glIndex: number = 0;
    glIndexCounter: number = -1;

    firstFrame: Frame;

    frames: Map<string | number, Frame>;

    constructor (key: string, image: TexImageSource)
    {
        this.key = key;

        this.image = image;

        this.width = image.width;
        this.height = image.height;

        this.frames = new Map();

        this.add('__BASE', 0, 0, image.width, image.height);
    }

    add (key: string | number, x: number, y: number, width: number, height: number): Frame
    {
        if (this.frames.has(key))
        {
            return null;
        }

        let frame = new Frame(this, key, x, y, width, height);

        this.frames.set(key, frame);

        if (!this.firstFrame || this.firstFrame.key === '__BASE')
        {
            this.firstFrame = frame;
        }

        return frame;
    }

    get (key?: string | number)
    {
        //  null, undefined, empty string, zero
        if (!key)
        {
            return this.firstFrame;
        }

        let frame: Frame = this.frames.get(key);

        if (!frame)
        {
            console.warn('Texture.frame missing: ' + key);

            frame = this.firstFrame;
        }

        return frame;
    }

}
