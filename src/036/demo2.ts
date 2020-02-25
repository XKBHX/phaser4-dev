import Game from 'Game';
import Sprite from 'Sprite';
import Scene from 'Scene';

class Demo extends Scene
{
    sprite1: Sprite;
    sprite2: Sprite;

    constructor (game: Game)
    {
        super(game);
    }

    preload ()
    {
        this.load.setPath('../assets');

        this.load.image('logo', 'logo.png');
        this.load.image('labs', '512x512.png');
        this.load.image('brain', 'brain.png');
    }

    create ()
    {
        document.getElementById('toggle').addEventListener('click', () => {
            this.game.isPaused = (this.game.isPaused) ? false: true;
        });

        this.add.sprite(400, 300, 'labs');

        this.sprite1 = this.add.sprite(400, 300, 'logo');
        this.sprite2 = this.add.sprite(400, 300, 'brain');
    }

    update (time: DOMHighResTimeStamp)
    {
        this.sprite1.rotation += 0.02;

        this.sprite2.y += 2;

        if (this.sprite2.y > 650)
        {
            this.sprite2.y = -50;
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
