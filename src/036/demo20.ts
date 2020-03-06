import Game from 'nano/Game';
import Sprite from 'nano/Sprite';
import Scene from 'nano/Scene';
import Mouse from 'nano/Mouse';
import DisplayObjectContainer from 'nano/DisplayObjectContainer';
import Rectangle from 'nano/Rectangle';

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

        // const parent = new DisplayObjectContainer(this, 400, 300);
        // const biggie = new Sprite(this, 400, 300, 'big');
        // const box = new Sprite(this, -100, -50, 'box');

        const box = new Sprite(this, 400, 300, 'box');

        // box.setInteractive(new Rectangle(0, 0, 128, 128));
        box.setInteractive();

        // biggie.addChild(box);

        // const box = new Sprite(this, 400, 300, 'box');

        // biggie.setRotation(0.2);

        // box.setRotation(0.2);
        // box.setScale(2);
        // box.setScale(4.1, 0.6);
        // biggie.setSkew(0.5, 0);

        // this.world.addChild(biggie);
        this.world.addChild(box);

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
