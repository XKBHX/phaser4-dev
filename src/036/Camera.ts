import WebGLRenderer from 'WebGLRenderer';

export default class Camera
{
    matrix: Float32Array;
    renderer: WebGLRenderer;

    readonly width: number;
    readonly height: number;

    private _x: number = 0;
    private _y: number = 0;
    private _rotation: number = 0;
    private _scaleX: number = 1;
    private _scaleY: number = 1;

    constructor (renderer: WebGLRenderer, width?: number, height?: number)
    {
        if (!width)
        {
            width = renderer.width;
        }

        if (!height)
        {
            height = renderer.height;
        }

        this.renderer = renderer;

        this.matrix = new Float32Array([ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ]);

        this.width = width;
        this.height = height;
    }

    private translate (x: number, y: number, z: number = 0)
    {
        const matrix = this.matrix;

        const m00 = matrix[0];
        const m01 = matrix[1];
        const m02 = matrix[2];
        const m03 = matrix[3];
        const m10 = matrix[4];
        const m11 = matrix[5];
        const m12 = matrix[6];
        const m13 = matrix[7];
        const m20 = matrix[8];
        const m21 = matrix[9];
        const m22 = matrix[10];
        const m23 = matrix[11];
        const m30 = matrix[12];
        const m31 = matrix[13];
        const m32 = matrix[14];
        const m33 = matrix[15];

        matrix[12] = m00 * x + m10 * y + m20 * z + m30;
        matrix[13] = m01 * x + m11 * y + m21 * z + m31;
        matrix[14] = m02 * x + m12 * y + m22 * z + m32;
        matrix[15] = m03 * x + m13 * y + m23 * z + m33;
    }

    private scale (scaleX: number, scaleY: number)
    {
        const matrix = this.matrix;

        matrix[0] *= scaleX;
        matrix[1] *= scaleX;
        matrix[2] *= scaleX;
        matrix[3] *= scaleX;
    
        matrix[4] *= scaleY;
        matrix[5] *= scaleY;
        matrix[6] *= scaleY;
        matrix[7] *= scaleY;
    }

    private rotate (angle: number)
    {
        const s: number = Math.sin(angle);
        const c: number = Math.cos(angle);

        const matrix = this.matrix;
    
        const m00 = matrix[0];
        const m01 = matrix[1];
        const m02 = matrix[2];
        const m03 = matrix[3];
        const m10 = matrix[4];
        const m11 = matrix[5];
        const m12 = matrix[6];
        const m13 = matrix[7];

        matrix[0] = m00 * c + m10 * s;
        matrix[1] = m01 * c + m11 * s;
        matrix[2] = m02 * c + m12 * s;
        matrix[3] = m03 * c + m13 * s;
        matrix[4] = m10 * c - m00 * s;
        matrix[5] = m11 * c - m01 * s;
        matrix[6] = m12 * c - m02 * s;
        matrix[7] = m13 * c - m03 * s;
    }

    set x (value: number)
    {
        this._x = value;

        this.translate(value, this._y);
    }

    get x (): number
    {
        return this._x;
    }

    set y (value: number)
    {
        this._y = value;

        this.translate(this._x, value);
    }

    get y (): number
    {
        return this._y;
    }

    set rotation (value: number)
    {
        this._rotation = value;

        this.rotate(value);
    }

    get rotation (): number
    {
        return this._rotation;
    }

    set scaleX (value: number)
    {
        this._scaleX = value;

        this.scale(value, this._scaleY);
    }

    get scaleX (): number
    {
        return this._scaleX;
    }

    set scaleY (value: number)
    {
        this._scaleY = value;

        this.scale(this._scaleX, value);
    }

    get scaleY (): number
    {
        return this._scaleY;
    }
}
