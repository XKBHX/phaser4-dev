import Game from 'nano/Game';
import Sprite from 'nano/Sprite';
import Scene from 'nano/Scene';
import Mouse from 'nano/Mouse';

class Demo extends Scene
{
    constructor (game: Game)
    {
        super(game);

        this.game.renderer.optimizeRedraw = false;
    }

    preload ()
    {
        this.load.setPath('../assets/');
        this.load.image('ball', 'shinyball.png');
    }

    create ()
    {
        const mouse = new Mouse(this.game.renderer.canvas);

        // mouse.on('pointerdown', (x: number, y: number) => {

        //     this.world.addChild(new Sprite(this, x, y, 'ball'));

        // });

        mouse.on('pointermove', (x: number, y: number) => {

            if (mouse.primaryDown)
            {
                this.world.addChild(new Sprite(this, x, y, 'ball'));
            }

        });
    }
}

export default function ()
{
    let game = new Game({
        width: 800,
        height: 600,
        backgroundColor: 0x000033,
        parent: 'gameParent',
        scene: Demo
    });

    document.getElementById('toggle').addEventListener('click', () => {
        game.isPaused = (game.isPaused) ? false: true;
    });
}
