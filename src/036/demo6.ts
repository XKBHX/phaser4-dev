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
        this.load.image('box', '../assets/box-item-boxed.png');
        this.load.image('brain', '../assets/brain.png');
    }

    create ()
    {
        document.getElementById('toggle').addEventListener('click', () => {
            this.game.isPaused = (this.game.isPaused) ? false: true;
        });

        this.sprite1 = this.add.sprite(400, 300, 'logo');

        const child1 = this.add.sprite(0, 0, 'box');
        const child2 = this.add.sprite(-256, -256, 'box');
        const child3 = this.add.sprite(256, 256, 'box');

        this.sprite1.addChild(child1);
        this.sprite1.addChild(child2);
        this.sprite1.addChild(child3);
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
