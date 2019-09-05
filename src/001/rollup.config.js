import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

const extensions = [
    '.js', '.jsx', '.ts', '.tsx'
];

export default {

    input: './src/001/test001.ts',

    output: {
        file: './src/001/test001.js',
        format: 'es'
    },

    plugins: [
        resolve({
            extensions
        }),

        commonjs(),

        babel({ extensions, include: [ 'src/**/*', 'node_modules/phaser/**/*' ]})

    ]
};