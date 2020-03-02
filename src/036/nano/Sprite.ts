import Texture from './Texture';
import Frame from './Frame';
import Scene from './Scene';
import Vertex from './Vertex';
import DisplayObjectContainer from './DisplayObjectContainer';

export default class Sprite extends DisplayObjectContainer
{
    type: string = 'Sprite';

    readonly scene: Scene;

    vertices: Vertex[] = [ new Vertex(), new Vertex(), new Vertex(), new Vertex() ];

    private _tint: number = 0xffffff;

    constructor (scene: Scene, x: number, y: number, texture: string, frame?: string | number)
    {
        super();

        this.scene = scene;

        this.setTexture(texture, frame);

        this.setPosition(x, y);
    }

    setTexture (key: string | Texture, frame?: string | number)
    {
        if (key instanceof Texture)
        {
            this.texture = key;
        }
        else
        {
            this.texture = this.scene.textures.get(key);
        }

        return this.setFrame(frame);
    }

    setFrame (key?: string | number)
    {
        const frame: Frame = this.texture.get(key);

        this.frame = frame;

        this.setSize(frame.sourceSizeWidth, frame.sourceSizeHeight);

        if (frame.pivot)
        {
            this.setOrigin(frame.pivot.x, frame.pivot.y);
        }

        return this;
    }

    setAlpha (topLeft: number = 1, topRight: number = topLeft, bottomLeft: number = topLeft, bottomRight: number = topLeft)
    {
        const vertices = this.vertices;

        vertices[0].alpha = topLeft;
        vertices[1].alpha = topRight;
        vertices[2].alpha = bottomLeft;
        vertices[3].alpha = bottomRight;

        return this;
    }

    setTint (topLeft: number = 0xffffff, topRight: number = topLeft, bottomLeft: number = topLeft, bottomRight: number = topLeft)
    {
        const vertices = this.vertices;

        vertices[0].color = topLeft;
        vertices[1].color = topRight;
        vertices[2].color = bottomLeft;
        vertices[3].color = bottomRight;

        return this;
    }

    updateVertices (): Vertex[]
    {
        const frame = this.frame;
        const origin = this._origin;

        let w0: number = 0;
        let w1: number = 0;
        let h0: number = 0;
        let h1: number = 0;

        const { a, b, c, d, tx, ty } = this.worldTransform;

        if (frame.trimmed)
        {
            w1 = frame.spriteSourceSizeX - (origin.x * frame.sourceSizeWidth);
            w0 = w1 + frame.spriteSourceSizeWidth;

            h1 = frame.spriteSourceSizeY - (origin.y * frame.sourceSizeHeight);
            h0 = h1 + frame.spriteSourceSizeHeight;
        }
        else
        {
            w1 = -origin.x * frame.sourceSizeWidth;
            w0 = w1 + frame.sourceSizeWidth;

            h1 = -origin.y * frame.sourceSizeHeight;
            h0 = h1 + frame.sourceSizeHeight;
        }

        //  Cache the calculations to avoid duplicates

        const w1a: number = w1 * a;
        const w1b: number = w1 * b;
        const h1c: number = h1 * c;
        const h1d: number = h1 * d;

        const w0a: number = w0 * a;
        const w0b: number = w0 * b;
        const h0c: number = h0 * c;
        const h0d: number = h0 * d;

        const vertices = this.vertices;

        //  top left
        vertices[0].x = w1a + h1c + tx;
        vertices[0].y = w1b + h1d + ty;

        //  top right
        vertices[1].x = w0a + h1c + tx;
        vertices[1].y = w0b + h1d + ty;

        //  bottom left
        vertices[2].x = w1a + h0c + tx;
        vertices[2].y = w1b + h0d + ty;

        //  bottom right
        vertices[3].x = w0a + h0c + tx;
        vertices[3].y = w0b + h0d + ty;

        return vertices;
    }

    set alpha (value: number)
    {
        this._alpha = value;

        this.setAlpha(value);
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

}