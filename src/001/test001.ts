// import * as Phaser from 'phaser'

import { Game } from 'phaser/src/Game';
import { ImageFile } from 'phaser/src/loader/filetypes/ImageFile';

let game = new Game();

game.draw('Loading ...');

ImageFile('logo', '../assets/logo.png').load().then((file) => {

    for (let i = 0; i < 10; i++)
    {
        let x = Math.random() * 700;
        let y = Math.random() * 500;

        game.drawImage(file.data, x, y);
    }
});

// import { Game, Loader } from 'phaser';

// let game = new Phaser.Game();

/*
Phaser.Loader.FileTypes.ImageFile('logo', '../assets/logo.png').load().then((file) => {
    game.drawImage(file.data, 100, 100);
    game.drawImage(file.data, 200, 200);
    game.drawImage(file.data, 300, 300);
});
*/

// Phaser.ImageFile('logo', '../assets/logo.png').load().then((file) => {
//     game.drawImage(file.data, 100, 100);
// });

/*
let loader = new Phaser.Loader();

loader.image('logo', '../assets/logo.png')
    .then((file) => {
        console.log('done?!');
        console.log(file);

        game.drawImage(file.data);
    })
    .catch(() => {
        console.log('failed');
    });

loader.start();
*/
