import Game from 'nano/Game';
import Sprite from 'nano/Sprite';
import Scene from 'nano/Scene';
import Mouse from 'nano/Mouse';

class Demo extends Scene
{
    grid: Sprite;

    constructor (game: Game)
    {
        super(game);
    }

    preload ()
    {
        this.load.setPath('../assets/');
        this.load.image('grid', 'checker.png');
        this.load.image('dot', 'orb-red.png');
    }

    create ()
    {
        const mouse = new Mouse(this.game.renderer.canvas);

        const grid = new Sprite(this, 400, 300, 'grid');

        grid.setInteractive();

        this.world.addChild(grid);

        this.grid = grid;

        mouse.on('pointerdown', () => {

            if (mouse.hitTest(grid))
            {
                grid.addChild(new Sprite(this, mouse.hitPoint.x, mouse.hitPoint.y, 'dot'));
            }

        });
    }

    update (delta: number)
    {
        this.grid.rotation += 0.2 * delta;
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
