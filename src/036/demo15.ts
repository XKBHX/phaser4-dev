import Game from 'nano/Game';
import AnimatedSprite from 'nano/AnimatedSprite';
import Scene from 'nano/Scene';
import Sprite from 'nano/Sprite';

class Demo extends Scene
{
    constructor (game: Game)
    {
        super(game);

        this.game.renderer.optimizeRedraw = false;
    }

    preload ()
    {
        this.load.setPath('../assets/');
        this.load.image('background', 'farm-background.png');
        this.load.atlas('chicken', 'chicken.png', 'chicken.json');
    }

    create ()
    {
        this.world.addChild(new Sprite(this, 400, 300, 'background'));

        const chicken = new AnimatedSprite(this, 400, 400, 'chicken', '__orange_chicken_idle_000');

        chicken.addAnimationFromAtlas('idle', '__orange_chicken_idle_', 0, 19, 3);
        chicken.addAnimationFromAtlas('peck', '__orange_chicken_peck_', 0, 9, 3);

        chicken.play('idle', 14);

        this.world.addChild(chicken);
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
