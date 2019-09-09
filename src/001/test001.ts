//  Test 1 (star import) result:
//      No tree-shaking
//      Bundle: 15.8KB
import * as Phaser from 'phaser';

let r1 = Phaser.Device.Browser.isChrome();

console.log('Test 1:', r1.chrome, r1.chromeVersion);

//  Test 2 (named module) result:
//      No tree-shaking
//      Bundle: 15.8KB
import { Device } from 'phaser';

let r2 = Device.Browser.isChrome();

console.log('Test 2:', r2.chrome, r2.chromeVersion);

//  Test 3 (Device module import) result:
//      Full tree-shaking
//      Bundle: 199 bytes
import * as Device from 'phaser/src/device';

let r3 = Device.Browser.isChrome();

console.log('Test 3:', r3.chrome, r3.chromeVersion);

//  Test 4 (Device.Browser module import) result:
//      Full tree-shaking
//      Bundle: 199 bytes
import * as Browser from 'phaser/src/device/browser';

let r4 = Browser.isChrome();

console.log('Test 4:', r4.chrome, r4.chromeVersion);

//  Test 5 (function import) result:
//      Tree-shaking n/a
//      Bundle: 199 bytes
import { isChrome } from 'phaser/src/device/browser/isChrome';

let r5 = isChrome();

console.log('Test 5:', r5.chrome, r5.chromeVersion);








/*
import { Game } from 'phaser/src/Game';
import { ImageFile } from 'phaser/src/loader/filetypes/ImageFile';

new Game((game) => {

    game.draw('Phaser 4 Test 001');

    ImageFile('logo', '../assets/logo.png').load().then((file) => {

        for (let i = 0; i < 10; i++)
        {
            let x = Math.random() * 700;
            let y = Math.random() * 500;

            game.drawImage(file.data, x, y);
        }
    });

});
*/

