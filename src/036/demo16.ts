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

        const chicken1 = new AnimatedSprite(this, 150, 400, 'chicken', '__orange_chicken_idle_000');
        const chicken2 = new AnimatedSprite(this, 300, 400, 'chicken', '__orange_chicken_idle_000');
        const chicken3 = new AnimatedSprite(this, 450, 400, 'chicken', '__orange_chicken_idle_000');
        const chicken4 = new AnimatedSprite(this, 600, 400, 'chicken', '__orange_chicken_idle_000');

        chicken1.addAnimationFromAtlas('die', '__orange_chicken_die_', 0, 4, 3);
        chicken2.addAnimationFromAtlas('die', '__orange_chicken_die_', 0, 4, 3);
        chicken3.addAnimationFromAtlas('die', '__orange_chicken_die_', 0, 4, 3);
        chicken4.addAnimationFromAtlas('die', '__orange_chicken_die_', 0, 4, 3);

        chicken1.play('die', { delay: 2000 });
        chicken2.play('die', { delay: 2500 });
        chicken3.play('die', { delay: 3000 });
        chicken4.play('die', { delay: 3500 });

        this.world.addChild(chicken1, chicken2, chicken3, chicken4);
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
