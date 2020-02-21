import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';

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
        // {
            // file: './src/035/test035.min.js',
            // format: 'iife',
            // name: 'Phaser4Test35',
            // plugins: [ terser() ]
        // }
    ],

    plugins: [

        resolve({
            extensions
        }),

        typescript({
            tsconfig: './src/035/tsconfig.json'
        })

    ]

};