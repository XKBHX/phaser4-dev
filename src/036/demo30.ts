import Game from 'nano/Game';
import Scene from 'nano/Scene';
import Sprite from 'nano/Sprite';

class Demo extends Scene
{
    sprite;

    constructor (game: Game)
    {
        super(game);
    }

    preload ()
    {
        this.load.setPath('../assets/');
        this.load.image('logo', 'logo.png');
    }

    create ()
    {
        const sprite = new Sprite(this, 400, 300, 'logo');

        console.log(sprite);

        sprite.setWibble(2);
        sprite.setWobble(0.5);

        console.log(sprite.wibble);

        this.world.addChild(sprite);

        this.sprite = sprite;
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
}
