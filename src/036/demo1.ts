import Game from 'nano/Game';
import Sprite from 'nano/Sprite';
import Scene from 'nano/Scene';

class Demo extends Scene
{
    sprite1: Sprite;

    constructor (game: Game)
    {
        super(game);
    }

    preload ()
    {
        this.load.image('logo', '../assets/logo.png');
    }

    create ()
    {
        document.getElementById('toggle').addEventListener('click', () => {
            this.game.isPaused = (this.game.isPaused) ? false: true;
        });

        this.sprite1 = this.add.sprite(400, 300, 'logo');
    }

    update (time: DOMHighResTimeStamp)
    {
        this.sprite1.rotation += 0.02;
    }
}

export default function ()
{
    new Game({
        width: 800,
        height: 600,
        backgroundColor: 0x000066,
        parent: 'gameParent',
        scene: Demo
    });
}
