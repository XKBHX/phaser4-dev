import Game from 'nano/Game';
import Scene from 'nano/Scene';

class Demo extends Scene
{
    constructor (game: Game)
    {
        super(game);
    }

    preload ()
    {
        this.load.setPath('../assets');

        this.load.spritesheet('diamonds', 'diamonds32x24x5.png', { frameWidth: 32, frameHeight: 24 });
        this.load.spritesheet('pack', '32x32-item-pack.png', { frameWidth: 32, frameHeight: 32 });
    }

    create ()
    {
        document.getElementById('toggle').addEventListener('click', () => {
            this.game.isPaused = (this.game.isPaused) ? false: true;
        });

        const totalDiamondFrames: number = this.textures.get('diamonds').frames.size - 1;
        const totalPackFrames: number = this.textures.get('pack').frames.size - 1;

        for (let i: number = 0; i < 128; i++)
        {
            let x: number = Math.floor(Math.random() * this.game.renderer.resolution.x);
            let y: number = Math.floor(Math.random() * this.game.renderer.resolution.y);
            let frame: number = Math.floor(Math.random() * totalPackFrames);

            this.add.sprite(x, y, 'pack', frame);
        }

        for (let i: number = 0; i < 64; i++)
        {
            let x: number = Math.floor(Math.random() * this.game.renderer.resolution.x);
            let y: number = Math.floor(Math.random() * this.game.renderer.resolution.y);
            let frame: number = Math.floor(Math.random() * totalDiamondFrames);

            this.add.sprite(x, y, 'diamonds', frame);
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
