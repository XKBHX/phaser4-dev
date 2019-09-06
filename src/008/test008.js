import { Game, Loader } from '../../node_modules/phaser/dist/phaser.es.js';

new Game((game) => {

    let loader = new Loader.LoaderPlugin();

    game.draw('Phaser 4 Test 008');

    loader.image('logo', '../assets/logo.png')
        .then((file) => {

            for (let i = 0; i < 10; i++)
            {
                let x = Math.random() * 700;
                let y = Math.random() * 500;
        
                game.drawImage(file.data, x, y);
            }

        });

    loader.start();

});
