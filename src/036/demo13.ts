import Game from 'nano/Game';
import Sprite from 'nano/Sprite';
import Scene from 'nano/Scene';

class Demo extends Scene
{
    sprite1: Sprite;
    sprite2: Sprite;
    sprite3: Sprite;

    constructor (game: Game)
    {
        super(game);

        //  Or we can't debug it with Spector!
        this.game.renderer.optimizeRedraw = false;
    }

    preload ()
    {
        this.load.setPath('../assets/');
        this.load.atlas('test', 'atlas-notrim.png', 'atlas-notrim.json');
        this.load.image('bubble', 'bubble256.png');
    }

    create ()
    {
        /**
         * Need to split into 2 passes. First, opaque objects (a Frame level property?)
         * Render them all with depth buffer enabled, using z index.
         * 
         * Then, disable depth buffer and render all transparent objects, back to front,
         * using a shader that tests against the depth buffer to see if the fragment
         * should be drawn or not.
         */

        this.sprite1 = new Sprite(this, 400, 240, 'test', 'brain');
        this.sprite2 = new Sprite(this, 400, 300, 'test', 'f-texture');
        this.sprite3 = new Sprite(this, 400, 250, 'bubble');

        this.sprite1.z = 2;
        this.sprite2.z = 0;
        this.sprite3.z = 3;

        this.world.addChild(this.sprite1, this.sprite2, this.sprite3);
        // this.world.addChild(this.sprite3, this.sprite2, this.sprite1);
    }

    update ()
    {
        // this.sprite1.rotation += 0.01;
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
