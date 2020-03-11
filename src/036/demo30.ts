import Game from 'nano/Game';
import Scene from 'nano/Scene';
import DisplayObject from 'nano/DisplayObject';

class Demo extends Scene
{
    // sprite;

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
        const test = new DisplayObject(this, 200, 100);

        test.setAlpha(2);
        test.setScale(3, 4);

        console.log(test);

        const test2 = new DisplayObject(this, 400, 300);

        test2.setAlpha(0.5);
        test2.setScale(2, 2);

        console.log(test2);

        // const sprite = new Sprite(this, 400, 300, 'logo');

        // console.log(sprite);

        // sprite.setWibble(2);
        // sprite.setWobble(0.5);

        // console.log(sprite.wibble);

        // this.world.addChild(sprite);

        // this.sprite = sprite;
    }

    update ()
    {
        // this.sprite.rotation += 0.01;
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
