import Game from 'nano/Game';
import Sprite from 'nano/Sprite';
import Scene from 'nano/Scene';
import Mouse from 'nano/input/Mouse';

class Demo extends Scene
{
    sprite1: Sprite;

    isDragging: boolean = false;

    constructor (game: Game)
    {
        super(game);
    }

    preload ()
    {
        this.load.setPath('../assets/');
        this.load.image('brain', 'brain.png');
    }

    create ()
    {
        const mouse = new Mouse(this.game.renderer.canvas);

        this.sprite1 = new Sprite(this, 400, 300, 'brain');

        this.sprite1.setInteractive();

        this.world.addChild(this.sprite1);

        mouse.on('pointerup', () => {

            this.isDragging = false;

        });

        mouse.on('pointerdown', () => {

            if (mouse.hitTest(this.sprite1))
            {
                this.isDragging = true;
            }

        });

        mouse.on('pointermove', (x: number, y: number) => {

            if (this.isDragging)
            {
                this.sprite1.setPosition(x, y);
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
