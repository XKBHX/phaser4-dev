import WebGLRenderer from './WebGLRenderer';
import GameObject from './gameobjects/GameObject';
import Scene from './Scene';

export default class Camera extends GameObject
{
    matrix: Float32Array;
    renderer: WebGLRenderer;

    readonly width: number;
    readonly height: number;

    constructor (scene: Scene, x: number = 0, y: number = 0)
    {
        super(scene, x, y);

        this.renderer = scene.game.renderer;

        this.matrix = new Float32Array([ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ]);

        this.setSize(this.renderer.width, this.renderer.height);
    }

    updateTransform ()
    {
        this.dirtyFrame = this.scene.game.frame;

        const lt = this.localTransform;
        const wt = this.worldTransform;

        lt.tx = this.x;
        lt.ty = this.y;

        const mat = this.matrix;
        const { a, b, c, d, tx, ty } = lt;

        const viewportW = this.renderer.width * this.originX;
        const viewportH = this.renderer.height * this.originY;

        mat[0] = a;
        mat[1] = b;
        mat[4] = c;
        mat[5] = d;

        //  combinates viewport translation + scrollX/Y

        mat[12] = (a * -viewportW) + (c * -viewportH) + (viewportW + tx);
        mat[13] = (b * -viewportW) + (d * -viewportH) + (viewportH + ty);

        //  Store in worldTransform
        wt.a = a;
        wt.b = b;
        wt.c = c;
        wt.d = d;
        wt.tx = mat[12];
        wt.ty = mat[13];

        // mat[12] = viewportW + tx; // combines translation to center of viewport + scrollX
        // mat[13] = viewportH + ty; // combines translation to center of viewport + scrollY
        // this.translate(-viewportW, -viewportH);
        // console.log(mat);

        return this;
    }
}
