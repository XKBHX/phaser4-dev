import { Game } from 'phaser/src/Game';
import { ImageFile } from 'phaser/src/loader/filetypes/ImageFile';

let game = new Game();

game.draw('Phaser 4 Test 001');

ImageFile('logo', '../assets/logo.png').load().then((file) => {

    for (let i = 0; i < 10; i++)
    {
        let x = Math.random() * 700;
        let y = Math.random() * 500;

        game.drawImage(file.data, x, y);
    }
});
