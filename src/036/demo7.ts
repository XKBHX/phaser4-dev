import Game from 'Game';
import Sprite from 'Sprite';
import Scene from 'Scene';

class Demo extends Scene
{
    cx: number = 0;

    constructor (game: Game)
    {
        super(game);
    }

    preload ()
    {
        this.load.image('grid', '../assets/uv-grid-diag.png');
    }

    create ()
    {
        this.world.addChild(new Sprite(this, 400, 300, 'grid'));
    }

    update ()
    {
        this.game.renderer.camera.x = Math.sin(this.cx) * 2;
        this.game.renderer.camera.y = Math.cos(this.cx) * 2;

        this.cx += 0.01;
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
