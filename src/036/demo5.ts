import Game from 'nano/Game';
import Sprite from 'nano/Sprite';
import Scene from 'nano/Scene';

class Demo extends Scene
{
    s: number = 0.01;
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
    }

    update (time: DOMHighResTimeStamp)
    {
        this.sprite1.skewX += this.s;
        this.sprite1.skewY += this.s;

        if (this.sprite1.skewX >= 0.5 || this.sprite1.skewX <= -0.5)
        {
            this.s *= -1;
        }
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
