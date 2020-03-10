import Game from 'nano/Game';
import Sprite from 'nano/Sprite';
import Scene from 'nano/Scene';
import Mouse from 'nano/Mouse';
import Stats from 'nano/Stats';

class Demo extends Scene
{
    constructor (game: Game)
    {
        super(game);

        new Stats(game, 'base');
    }

    preload ()
    {
        this.load.setPath('../assets/');
        this.load.image('512', '512x512.png');
        this.load.image('256', 'f-texture.png');
        this.load.image('128', '128x128.png');
        this.load.image('64', 'box-item-boxed.png');
        this.load.image('32', '32x32.png');
    }

    create ()
    {
        const mouse = new Mouse(this.game.renderer.canvas);

        const parent1 = new Sprite(this, 400, 300, '512');
        const parent2 = new Sprite(this, 0, 0, '256');
        const parent3 = new Sprite(this, 0, 0, '128');
        const parent4 = new Sprite(this, 0, 0, '64');
        const child = new Sprite(this, 0, 0, '32');

        child.setInteractive();

        parent1.addChild(parent2);
        parent2.addChild(parent3);
        parent3.addChild(parent4);
        parent4.addChild(child);

        this.world.addChild(parent1);

        mouse.on('pointerdown', (x: number, y: number) => {

            const results = mouse.hitTestChildren(parent1);

            console.log(
                (results.length > 0) ? 'Hit!' : 'None'
            );

        });
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
}
