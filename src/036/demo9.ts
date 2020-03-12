import Game from 'nano/Game';
import Sprite from 'nano/gameobjects/Sprite';
import Scene from 'nano/Scene';
import Ease from 'nano/math/Ease';

class Demo extends Scene
{
    sprite1: Sprite;
    duration: number;
    elapsed: number;

    constructor (game: Game)
    {
        super(game);
    }

    preload ()
    {
        this.load.image('brain', '../assets/brain.png');
    }

    create ()
    {
        this.sprite1 = new Sprite(this, 400, 100, 'brain');
        
        this.world.addChild(this.sprite1);

        this.duration = 2000;
        this.elapsed = 0;
    }

    update (delta: number)
    {
        this.elapsed += (delta * 1000);

        let reset = false;

        if (this.elapsed > this.duration)
        {
            this.elapsed = this.duration;

            reset = true;
        }

        let v = Ease(this.elapsed / this.duration, 'inOutSine');

        this.sprite1.y = 100 + (v * 300);

        if (reset)
        {
            this.elapsed = 0;
        }
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
