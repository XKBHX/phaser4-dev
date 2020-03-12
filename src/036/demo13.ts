import Game from 'nano/Game';
import Sprite from 'nano/gameobjects/Sprite';
import AnimatedSprite from 'nano/gameobjects/AnimatedSprite';
import Scene from 'nano/Scene';
import Keyboard from 'nano/input/Keyboard';
import Stats from 'nano/stats/Stats';

class Demo extends Scene
{
    keyboard: Keyboard;
    cannon: Sprite;

    constructor (game: Game)
    {
        super(game);

        new Stats(game);

        //  Or we can't debug it with Spector!
        // this.game.renderer.optimizeRedraw = false;
    }

    preload ()
    {
        this.load.setPath('../assets/');
        this.load.atlas('assets', 'bubbles.png', 'bubbles.json');
        this.load.image('background', 'bubbles-background.png');
    }

    create ()
    {
        const bg = new Sprite(this, 0, 0, 'background').setOrigin(0, 0);
        const header = new Sprite(this, 384, 8, 'assets', 'Header-Ui').setOrigin(0.5, 0);

        this.world.addChild(bg, header);

        //  Bubbles
        let rowMax = 10;
        let startX = 64;
        let starty = 128;
        let frame = 1;

        for (let y: number = 0; y < 6; y++)
        {
            for (let x: number = 0; x < rowMax; x++)
            {
                frame = 1 + Math.floor(Math.random() * 8);

                let bubble = new Sprite(this, startX + (x * 70), starty + (y * 62), 'assets', 'bubbles-0' + frame).setScale(0.40);

                this.world.addChild(bubble);
            }

            rowMax--;
            startX += 35;
        }

        //  Fish cannon

        const fish = new AnimatedSprite(this, 384 + 160, 900, 'assets', 'fish characters_0000000');

        fish.addAnimationFromAtlas('wiggle', 'fish characters_000000', 0, 5);

        fish.play('wiggle', { speed: 12, repeat: -1 })

        const nextBubble = new Sprite(this, 384 + 160, 930, 'assets', 'bubbles-01').setScale(0.40);
        const cannon = new Sprite(this, 384, 1000, 'assets', 'cannon_0000000').setOrigin(0.5, 1);

        this.world.addChild(fish, nextBubble, cannon);

        this.keyboard = new Keyboard();

        this.cannon = cannon;
    }

    update (delta: number)
    {
        if (this.keyboard.isDown('left') && this.cannon.rotation >= -1)
        {
            this.cannon.rotation -= 4 * delta;
        }
        else if (this.keyboard.isDown('right') && this.cannon.rotation <= 1)
        {
            this.cannon.rotation += 4 * delta;
        }
    }
}

export default function ()
{
    let game = new Game({
        width: 768,
        height: 1024,
        parent: 'gameParent',
        scene: Demo
    });

    document.getElementById('toggle').addEventListener('click', () => {
        game.isPaused = (game.isPaused) ? false: true;
    });
}
