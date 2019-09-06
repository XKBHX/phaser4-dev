let fs = require('fs-extra');
let parseArgs = require('minimist');
let { execSync } = require('child_process');

let source = './src/';

//  Can do: `npm run build -- 001 (or just npm run build for it to build the most recent folder)
let argv = parseArgs(process.argv);

let folder = argv._[2];

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

    folder = maxDir.toString().padStart(3, '0');
}

let dest = source + folder;

if (fs.existsSync(dest))
{
    // console.log('building', dest);

    let s = execSync('tsc --traceResolution --project ' + dest);

    console.log(s.toString());
}
else
{
    console.log('Failed to find test', dest);
}
