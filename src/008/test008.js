import { Game } from '@phaserjs/core';
import { ImageFile } from '@phaserjs/loader-filetypes';

new Game((game) => {

    game.text(10, 20, 'Phaser Test 3');

    ImageFile('logo', '../assets/logo.png').load().then((file) => {

        let x = 50;
        let y = 50;

        for (let i = 0; i < 10; i++)
        {
            game.drawImage(file.data, x, y);

            x += 80;
            y += 40;
        }

    });

});
