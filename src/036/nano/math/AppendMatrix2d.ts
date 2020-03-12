import IMatrix2d from './IMatrix2d';

export default function AppendMatrix2d (mat1: IMatrix2d, mat2: IMatrix2d): IMatrix2d
{
    const a1 = mat1.a;
    const b1 = mat1.b;
    const c1 = mat1.c;
    const d1 = mat1.d;

    const a = (mat2.a * a1) + (mat2.b * c1);
    const b = (mat2.a * b1) + (mat2.b * d1);
    const c = (mat2.c * a1) + (mat2.d * c1);
    const d = (mat2.c * b1) + (mat2.d * d1);

    const tx = (mat2.tx * a1) + (mat2.ty * c1) + mat1.tx;
    const ty = (mat2.tx * b1) + (mat2.ty * d1) + mat1.ty;

    return { a, b, c, d, tx, ty };
}
