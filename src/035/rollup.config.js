import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import sourcemaps from 'rollup-plugin-sourcemaps';

const extensions = [
    '.js', '.jsx', '.ts', '.tsx'
];

export default {

    input: './src/035/test035.ts',

    output: [
        {
            file: './src/035/test035.js',
            format: 'es',
            sourcemap: true
        },
        {
            file: './src/035/test035.min.js',
            format: 'iife',
            name: 'Phaser4',
            sourcemap: false,
            plugins: [ terser() ]
        }
    ],

    plugins: [

        sourcemaps(),

        resolve({
            extensions
        }),

        typescript({
            tsconfig: './src/035/tsconfig.json'
        })

    ]

};