let fs = require('fs-extra');
let parseArgs = require('minimist');

let source = './src/';
let template = './src/template';
let sourceHTML = 'index.html';
let sourceRollupConfig = 'rollup.config.js';
let sourceTS = 'test001.ts';
let sourceTSConfig = 'tsconfig.json';

// https://www.npmjs.com/package/minimist

//  Can do: `npm run create -- -f rich
let argv = parseArgs(process.argv, { alias: { f: 'folder' }});

// console.log(argv);

let folder = argv.folder;

if (!folder)
{
    //  If no argument is given, look for the most recent folder and use that

    function getDirectories (path)
    {
        return fs.readdirSync(path).filter(function (file)
        {
            return fs.statSync(path + '/' + file).isDirectory();
        });
    }

    let inputDirs = getDirectories(source);
    let maxDir = 0;

    for (let i = 0; i < inputDirs.length; i++)
    {
        let d = parseInt(inputDirs[i]);

        if (!isNaN(d))
        {
            maxDir = Math.max(maxDir, d);
        }
    }

    maxDir++;

    folder = maxDir.toString().padStart(3, '0');
}

let dest = source + folder + '/';

console.log(dest);

if (!fs.existsSync(dest))
{
    fs.copySync(template, dest, { errorOnExist: true, overwrite: false });

    fs.moveSync(dest + sourceTS, dest + 'test' + folder + '.ts');


}
