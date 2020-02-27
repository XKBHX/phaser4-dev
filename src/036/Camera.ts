import { Matrix4, Translate, RotateZ, Scale } from '@phaserjs/math-matrix4';
import WebGLRenderer from 'WebGLRenderer';

export default class Camera
{
    matrix: Matrix4;
    renderer: WebGLRenderer;

    readonly width: number;
    readonly height: number;

    private _x: number;
    private _y: number;
    private _rotation: number;
    private _scaleX: number;
    private _scaleY: number;

    constructor (renderer: WebGLRenderer, width?: number, height?: number)
    {
        if (!width)
        {
            width = renderer.resolution.x;
        }

        if (!height)
        {
            height = renderer.resolution.y;
        }

        this.renderer = renderer;

        this.matrix = new Matrix4();

        this.width = width;
        this.height = height;
    }

    set x (value: number)
    {
        this._x = value;

        Translate(this.matrix, value, this._y);
    }

    get x (): number
    {
        return this._x;
    }

    set y (value: number)
    {
        this._y = value;

        Translate(this.matrix, this._x, value);
    }

    get y (): number
    {
        return this._y;
    }

    set rotation (value: number)
    {
        this._rotation = value;

        RotateZ(this.matrix, value);
    }

    get rotation (): number
    {
        return this._rotation;
    }

    set scaleX (value: number)
    {
        this._scaleX = value;

        Scale(this.matrix, value, this._scaleY, 1);
    }

    get scaleX (): number
    {
        return this._scaleX;
    }

    set scaleY (value: number)
    {
        this._scaleY = value;

        Scale(this.matrix, this._scaleX, value, 1);
    }

    get scaleY (): number
    {
        return this._scaleY;
    }

}
