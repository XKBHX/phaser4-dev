import * as Phaser from 'phaser';

let game = new Phaser.Game();
let loader = new Phaser.Loader.LoaderPlugin();

console.log(Phaser.VERSION);

game.draw('Phaser 4 Test 003');

loader.image('logo', '../assets/logo.png')
    .then((file) => {

        for (let i = 0; i < 10; i++)
        {
            let x = Math.random() * 700;
            let y = Math.random() * 500;
    
            game.drawImage(file.data, x, y);
        }

    })
    .catch(() => {
        console.log('failed');
    });

loader.start();
