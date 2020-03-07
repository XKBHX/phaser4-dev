import Game from 'nano/Game';
import Sprite from 'nano/Sprite';
import Scene from 'nano/Scene';
import Mouse from 'nano/Mouse';

class Demo extends Scene
{
    cx: number = 0;

    constructor (game: Game)
    {
        super(game);
    }

    preload ()
    {
        this.load.image('grid', '../assets/512x512.png');
        this.load.image('box', '../assets/128x128.png');
    }

    create ()
    {
        const mouse = new Mouse(this.game.renderer.canvas);

        this.world.addChild(new Sprite(this, 400, 300, 'grid'));
        this.world.addChild(new Sprite(this, 0, 0, 'box').setOrigin(0));
        this.world.addChild(new Sprite(this, 800, 600, 'box').setOrigin(1, 1));
        this.world.addChild(new Sprite(this, 0, 600, 'box').setOrigin(0, 1));
        this.world.addChild(new Sprite(this, 800, 0, 'box').setOrigin(1, 0));

        mouse.on('pointerdown', (x: number, y: number) => {

            // this.camera.rotation += 0.1;
            this.camera.alpha -= 0.1;

        });
    }

    update ()
    {
        this.camera.x = Math.sin(this.cx) * 200;
        this.camera.y = Math.cos(this.cx) * 100;

        this.cx += 0.04;
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
