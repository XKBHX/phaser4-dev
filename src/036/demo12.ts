import Game from 'nano/Game';
import Sprite from 'nano/Sprite';
import Scene from 'nano/Scene';

class Demo extends Scene
{
    sprite: Sprite;

    constructor (game: Game)
    {
        super(game);
    }

    preload ()
    {
        this.load.setPath('../assets/');
        this.load.atlas('test', 'atlas-notrim.png', 'atlas-notrim.json');
        // this.load.atlas('test', 'atlas-trimmed.png', 'atlas-trimmed.json');
    }

    create ()
    {
        this.sprite = new Sprite(this, 400, 300, 'test', 'hello');

        this.world.addChild(this.sprite);
    }

    update ()
    {
        this.sprite.rotation += 0.01;
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
