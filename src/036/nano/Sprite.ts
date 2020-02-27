import Texture from './Texture';
import Frame from './Frame';
import Scene from './Scene';
import Vertex from './Vertex';
import DisplayObjectContainer from './DisplayObjectContainer';

export default class Sprite extends DisplayObjectContainer
{
    readonly scene: Scene;

    // texture: Texture = null;
    // frame: Frame = null;

    vertices: Vertex[] = [ new Vertex(), new Vertex(), new Vertex(), new Vertex() ];

    // private _alpha: number = 1;
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
        const frame = this.texture.get(key);

        this.frame = frame;

        return this.setSize(frame.width, frame.height);
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
        //  Update Vertices:

        const w: number = this.width;
        const h: number = this.height;

        const x0: number = -(this._origin.x * w);
        const x1: number = x0 + w;
        const y0: number = -(this._origin.y * h);
        const y1: number = y0 + h;

        const { a, b, c, d, tx, ty } = this.worldTransform;

        //  Cache the calculations to avoid 8 getX/Y function calls:

        const x0a: number = x0 * a;
        const x0b: number = x0 * b;
        const y0c: number = y0 * c;
        const y0d: number = y0 * d;

        const x1a: number = x1 * a;
        const x1b: number = x1 * b;
        const y1c: number = y1 * c;
        const y1d: number = y1 * d;

        const vertices = this.vertices;

        //  top left
        vertices[0].x = x0a + y0c + tx;
        vertices[0].y = x0b + y0d + ty;

        //  top right
        vertices[1].x = x1a + y0c + tx;
        vertices[1].y = x1b + y0d + ty;

        //  bottom left
        vertices[2].x = x0a + y1c + tx;
        vertices[2].y = x0b + y1d + ty;

        //  bottom right
        vertices[3].x = x1a + y1c + tx;
        vertices[3].y = x1b + y1d + ty;

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