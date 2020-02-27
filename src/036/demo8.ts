import Game from 'Game';
import Sprite from 'Sprite';
import Scene from 'Scene';
import EventEmitter from 'EventEmitter';

class Demo extends Scene
{
    constructor (game: Game)
    {
        super(game);
    }

    preload ()
    {
        this.load.setPath('../assets/');

        this.load.image('grid', 'uv-grid-diag.png');
        this.load.image('512', 'checker.png');
        this.load.image('128', 'lance-overdose-loader-eye.png');
        this.load.image('logo', 'logo.png');
        this.load.image('brain', 'brain.png');
    }

    create ()
    {
        let ee = new EventEmitter();

        ee.once('logo', (x, y) => {

            this.world.addChild(new Sprite(this, x, y, 'logo'));

        });

        ee.on('brain', (x, y) => {

            this.world.addChild(new Sprite(this, x, y, 'brain'));

        });

        console.log(ee.eventNames());

        this.game.renderer.canvas.addEventListener('click', (event) => {

            if (event.clientY < 200)
            {
                ee.emit('logo', 400, 300);
            }
            else
            {
                ee.emit('brain', event.clientX, event.clientY);
            }

        });
    }
}

export default function ()
{
    let game = new Game({
        width: 800,
        height: 600,
        backgroundColor: 0x000066,
        parent: 'gameParent',
        scene: Demo
    });

    document.getElementById('toggle').addEventListener('click', () => {
        game.isPaused = (game.isPaused) ? false: true;
    });
}
