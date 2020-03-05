import Game from 'nano/Game';
import Sprite from 'nano/Sprite';
import Scene from 'nano/Scene';

class Demo extends Scene
{
    sprite: Sprite;

    constructor (game: Game)
    {
        super(game);
    }

    create ()
    {
        this.textures.addColor('red', '#ff0000', 128, 128);
        // this.textures.addGrid('grid', '#ff0000', '#00ff00', 128, 128, 4, 8);
        this.textures.addGrid('stripes', '#ff0000', '#00ff00', 256, 256, 8, 1);

        this.sprite = new Sprite(this, 400, 300, 'stripes');

        this.world.addChild(this.sprite);
    }

    update ()
    {
        this.sprite.rotation += 0.01;
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
