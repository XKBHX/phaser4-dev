import Game from 'nano/Game';
import Sprite from 'nano/Sprite';
import Scene from 'nano/Scene';
import Mouse from 'nano/Mouse';
import Ellipse from 'nano/Ellipse';

class Demo extends Scene
{
    isDragging: boolean = false;

    constructor (game: Game)
    {
        super(game);
    }

    preload ()
    {
        this.load.setPath('../assets/');
        this.load.image('rocket', 'rocket.png');
    }

    create ()
    {
        const mouse = new Mouse(this.game.renderer.canvas);

        const sprite1 = new Sprite(this, 400, 300, 'rocket');

        sprite1.setInteractive(new Ellipse(0, 0, 310, 80));

        sprite1.setAlpha(0.7);

        this.world.addChild(sprite1);

        mouse.on('pointerup', () => {

            this.isDragging = false;
            sprite1.setAlpha(0.7);

        });

        mouse.on('pointerdown', () => {

            if (mouse.hitTest(sprite1))
            {
                this.isDragging = true;
                sprite1.setAlpha(1);
            }

        });

        mouse.on('pointermove', (x: number, y: number) => {

            if (this.isDragging)
            {
                sprite1.setPosition(x, y);
            }

        });
    }
}

export default function ()
{
    let game = new Game({
        width: 800,
        height: 600,
        backgroundColor: 0x00bcc3,
        parent: 'gameParent',
        scene: Demo
    });

    document.getElementById('toggle').addEventListener('click', () => {
        game.isPaused = (game.isPaused) ? false: true;
    });
}
