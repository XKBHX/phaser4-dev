import * as Phaser from 'phaser'

let game = new Phaser.Game();
let loader = new Phaser.Loader();

game.draw('Loading ...');

loader.image('logo', '../assets/logo.png').then(() =>
{
    game.draw('Loaded image!!!');
});
