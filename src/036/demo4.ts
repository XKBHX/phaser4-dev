import Game from 'Game';
import Sprite from 'Sprite';
import Scene from 'Scene';

class Demo extends Scene
{
    sprite1: Sprite;

    constructor (game: Game)
    {
        super(game);
    }

    preload ()
    {
        this.load.image('logo', '../assets/512x512.png');
    }

    create ()
    {
        document.getElementById('toggle').addEventListener('click', () => {
            this.game.isPaused = (this.game.isPaused) ? false: true;
        });

        this.sprite1 = this.add.sprite(400, 300, 'logo');

        this.sprite1.setTint(0xff0000, 0x00ff00, 0xffff00, 0x0000ff);

        this.sprite1.setAlpha(1, 1, 0, 0);
    }

    update (time: DOMHighResTimeStamp)
    {
        this.sprite1.rotation += 0.01;
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
