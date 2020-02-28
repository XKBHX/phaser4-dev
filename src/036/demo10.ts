import Game from 'nano/Game';
import Sprite from 'nano/Sprite';
import SpriteBuffer from 'nano/SpriteBuffer';
import Scene from 'nano/Scene';

class Demo extends Scene
{
    cx: number = 0;
    ccx: number = 0;
    ccy: number = 0;

    constructor (game: Game)
    {
        super(game);
    }

    preload ()
    {
        this.load.setPath('../assets/');
        this.load.image('cat', 'ultimatevirtues.gif');
        this.load.spritesheet('tiles', 'gridtiles2.png', { frameWidth: 32, frameHeight: 32, margin: 1, spacing: 2 });
    }

    create ()
    {
        this.world.addChild(new Sprite(this, 400, 300, 'cat'));

        const buffer = new SpriteBuffer(this.game, 100000);

        const brain = new Sprite(this, 0, 0, 'tiles');

        for (let i = 0; i < buffer.maxSize; i++)
        {
            let x = -800 + Math.floor(Math.random() * 1600);
            let y = -300 + Math.floor(Math.random() * 1200);
            let f = Math.floor(Math.random() * 140);
            // let s = Math.random() * 2;
            // let r = Math.random() * Math.PI * 2;

            brain.setPosition(x, y);
            brain.setFrame(f);
            // brain.setScale(s);
            // brain.setRotation(r);

            buffer.add(brain);
        }

        this.world.addChild(buffer);
    }

    update (delta: number)
    {
        this.ccx = Math.sin(this.cx) * 2;
        this.ccy = Math.cos(this.cx) * 2;

        // this.game.renderer.camera.x = Math.floor(this.ccx);
        // this.game.renderer.camera.y = Math.floor(this.ccy);

        this.game.renderer.camera.x = Math.sin(this.cx) * 2;
        this.game.renderer.camera.y = Math.cos(this.cx) * 2;

        this.cx += 0.01;
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
