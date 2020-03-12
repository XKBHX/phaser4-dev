import Game from 'nano/Game';
import Scene from 'nano/Scene';
import Sprite from 'nano/gameobjects/Sprite';

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
        this.load.image('clown', 'clown.png');
    }

    create ()
    {
        const ben = new Sprite(this, 400, 300, 'logo');

        this.world.addChild(ben);

        console.log(ben);

        this.sprite = ben;

        document.body.addEventListener('click', () => {

            let x = 50 + Math.random() * 700;
            let y = 50 + Math.random() * 500;

            this.world.addChild(new Sprite(this, x, y, 'clown'));
    
        });
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
