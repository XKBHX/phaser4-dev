import Vec2 from './Vec2';
import IMatrix2d from './IMatrix2d';

export default function LocalToGlobal (transform: IMatrix2d, x: number, y: number, outPoint: Vec2 = new Vec2()): Vec2
{
    const { a, b, c, d, tx, ty } = transform;

    outPoint.x = (a * x) + (c * y) + tx;
    outPoint.y = (b * x) + (d * y) + ty;

    return outPoint;
}
