export default function (rgb: number, alpha: number): number
{
    let ua = ((alpha * 255) | 0) & 0xFF;

    return ((ua << 24) | rgb) >>> 0;
}
