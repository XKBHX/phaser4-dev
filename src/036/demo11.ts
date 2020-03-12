import Game from 'nano/Game';
import Sprite from 'nano/Sprite';
import Scene from 'nano/Scene';
import Keyboard from 'nano/input/Keyboard';

class Demo extends Scene
{
    sprite: Sprite;
    keyboard: Keyboard;

    constructor (game: Game)
    {
        super(game);
    }

    preload ()
    {
        this.load.setPath('../assets/');
        this.load.image('ayu');
        this.load.image('hotdog');
    }

    create ()
    {
        this.sprite = new Sprite(this, 400, 300, 'ayu');

        this.world.addChild(this.sprite);

        this.keyboard = new Keyboard();

        //  Press space bar to toggle the texture
        this.keyboard.on('keydown-space', () => {

            if (this.sprite.texture.key === 'ayu')
            {
                this.sprite.setTexture('hotdog');
            }
            else
            {
                this.sprite.setTexture('ayu');
            }

        });
    }

    update (delta: number)
    {
        //  Arrows to move
        if (this.keyboard.isDown('left'))
        {
            this.sprite.x -= 300 * delta;
        }
        else if (this.keyboard.isDown('right'))
        {
            this.sprite.x += 300 * delta;
        }

        if (this.keyboard.isDown('up'))
        {
            this.sprite.y -= 300 * delta;
        }
        else if (this.keyboard.isDown('down'))
        {
            this.sprite.y += 300 * delta;
        }
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
