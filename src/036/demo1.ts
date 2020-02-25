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
        this.load.image('logo', '../assets/logo.png');
    }

    create ()
    {
        document.getElementById('toggle').addEventListener('click', () => {
            this.game.isPaused = (this.game.isPaused) ? false: true;
        });

        const texture = this.game.textures.get('logo');
        const frame = texture.get();

        const sprite1 = new Sprite(400, 300, frame).setOrigin(0.5);

        this.game.sprites.push(sprite1);

        this.sprite1 = sprite1;
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
