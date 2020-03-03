import Game from 'nano/Game';
import Sprite from 'nano/Sprite';
import Scene from 'nano/Scene';

class Demo extends Scene
{
    sprite1: Sprite;
    sprite2: Sprite;

    constructor (game: Game)
    {
        super(game);

        //  Or we can't debug it with Spector!
        this.game.renderer.optimizeRedraw = false;
    }

    preload ()
    {
        this.load.setPath('../assets/');
        this.load.atlas('test', 'atlas-notrim.png', 'atlas-notrim.json');
    }

    create ()
    {
        this.sprite1 = new Sprite(this, 400, 300, 'test', 'brain');
        this.sprite2 = new Sprite(this, 400, 300, 'test', 'f-texture');

        this.sprite1.z = 1;
        this.sprite2.z = 0;

        this.world.addChild(this.sprite1, this.sprite2);
    }

    update ()
    {
        // this.sprite1.rotation += 0.01;
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
