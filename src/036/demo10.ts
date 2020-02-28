import Game from 'nano/Game';
import Sprite from 'nano/Sprite';
import SpriteBuffer from 'nano/SpriteBuffer';
import Scene from 'nano/Scene';

class Demo extends Scene
{
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
        const buffer = new SpriteBuffer(this.game, 1000);

        const brain = new Sprite(this, 0, 0, 'brain');

        for (let i = 0; i < 100; i++)
        {
            let x = Math.floor(Math.random() * 800);
            let y = Math.floor(Math.random() * 600);

            brain.setPosition(x, y);

            buffer.add(brain);
        }

        this.world.addChild(buffer);
    }

    update (delta: number)
    {
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
