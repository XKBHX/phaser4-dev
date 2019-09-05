// import * as Phaser from 'phaser'

import { Game } from 'phaser/src/Game';
import { ImageFile } from 'phaser/src/loader/filetypes/ImageFile';

// import { Game, Loader } from 'phaser';

// let game = new Phaser.Game();

let game = new Game();

game.draw('Loading ...');

// Phaser.Loader.

ImageFile('logo', '../assets/logo.png').load().then((file) => {
    game.drawImage(file.data, 100, 100);
    game.drawImage(file.data, 150, 150);
    game.drawImage(file.data, 200, 200);
    game.drawImage(file.data, 250, 250);
    game.drawImage(file.data, 300, 300);
});

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
