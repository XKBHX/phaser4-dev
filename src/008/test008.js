// import { Game, Loader } from 'phaser';
// import { Browser } from 'phaser/dist/device';

// import * as Phaser from 'phaser';

// import { Game, Device } from '@phaserjs/phaser4/';

import { Game } from '@phaserjs/phaser4/Game';
import * as OS from '@phaserjs/phaser4/device/os';

new Game((game) => {

    // let loader = new Phaser.Loader.LoaderPlugin();

    game.text(10, 20, 'Phaser 4 Test 008 - ' + OS.isMacOS());

    // loader.image('logo', '../assets/logo.png')
    //     .then((file) => {

    //         for (let i = 0; i < 10; i++)
    //         {
    //             let x = Math.random() * 700;
    //             let y = Math.random() * 500;
        
    //             game.drawImage(file.data, x, y);
    //         }

    //     });

    // loader.start();

});
