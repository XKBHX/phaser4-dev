import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

let defaults = {
    compilerOptions: {
        target: 'esnext'
    }
};

export default {
    input: './src/001/test001.ts',
    output: {
        file: './src/001/test001.js',
        //  Change to 'iife' to enable es5 output
        //  plus also change tsconfig.json to export to es5 too
        format: 'es'
    },
    plugins: [
        resolve({
            mainFields: [ 'module' ]
        }),
        typescript({
            "typescript": require('typescript'),
            "tsconfigDefaults": defaults
        })
    ]
};