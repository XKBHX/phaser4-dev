import * as Phaser from 'phaser'

let game = new Phaser.Game();
let loader = new Phaser.Loader();

game.draw('Loading ...');

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
