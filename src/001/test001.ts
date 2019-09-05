import * as Phaser from 'phaser'

let game = new Phaser.Game();

game.draw('Loading ...');

Phaser.ImageFile('logo', '../assets/logo.png').load().then((file) => {
    game.drawImage(file.data, 100, 100);
});

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
