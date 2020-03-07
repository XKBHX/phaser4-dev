import WebGLRenderer from './WebGLRenderer';
import DisplayObject from './DisplayObject';
import Scene from './Scene';

export default class Camera extends DisplayObject
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

    update ()
    {
        if (this.dirty)
        {
            //  sync wt to mt
            const mat = this.matrix;
            const { a, b, c, d, tx, ty } = this.worldTransform;

            const viewportW = this.renderer.width * this.originX;
            const viewportH = this.renderer.height * this.originY;

            mat[0] = a;
            mat[1] = b;
            mat[4] = c;
            mat[5] = d;

            //  combinates viewport translation + scrollX/Y

            mat[12] = (a * -viewportW) + (c * -viewportH) + (viewportW + tx);
            mat[13] = (b * -viewportW) + (d * -viewportH) + (viewportH + ty);

            // mat[12] = viewportW + tx; // combines translation to center of viewport + scrollX
            // mat[13] = viewportH + ty; // combines translation to center of viewport + scrollY
            // this.translate(-viewportW, -viewportH);
            // console.log(mat);

            this.dirty = false;
        }
    }

    /*
    translate (x: number, y: number)
    {
        const matrix = this.matrix;

        const m00 = matrix[0];
        const m01 = matrix[1];
        const m10 = matrix[4];
        const m11 = matrix[5];
        const m30 = matrix[12];
        const m31 = matrix[13];

        matrix[12] = m00 * x + m10 * y + m30;
        matrix[13] = m01 * x + m11 * y + m31;
    }
    */
}
