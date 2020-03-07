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
        this.load.image('big', '512x512.png');
        this.load.image('box', '128x128.png');
    }

    create ()
    {
        const mouse = new Mouse(this.game.renderer.canvas);

        const box = new Sprite(this, 400, 300, 'box');

        box.setScale(2, 3);

        box.setInteractive();

        this.world.addChild(box);

        // this.camera.setPosition(-128, 0);
        // this.camera.setRotation(0.3);

        mouse.on('pointerdown', (x: number, y: number) => {

            if (mouse.hitTest(box))
            {
                console.log('hit!');
            }
            else
            {
                console.log('miss!');
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
