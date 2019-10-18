import { Angle, Height, Line } from '@phaserjs/geom-line';

const test: Line = new Line(0, 100, 400, 50);

console.log(test);

console.log('angle', Angle(test));
console.log('height', Height(test));
