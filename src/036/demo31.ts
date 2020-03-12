import Game from 'nano/Game';
import Scene from 'nano/Scene';
import Sprite from 'nano/gameobjects/Sprite';
import LogoPNG from '../assets/logo.png';

class Demo extends Scene
{
    logo: Sprite;

    constructor (game: Game)
    {
        super(game);

        //  PNG imported via '@rollup/plugin-image'
        //  with: plugins: [ image({ dom: false })] (forcing it to be base64)

        //  Also requires global.d.ts with:
        //  declare module "*.png" {
        //    const value: any;
        //    export = value;
        //  }

        //  Warning: The asset gets bundled into your JS code!
        //  Which can make it insanely huge. So, be careful.
    }

    preload ()
    {
        this.load.image('logo', LogoPNG);
    }

    create ()
    {
        this.logo = new Sprite(this, 400, 300, 'logo');

        this.world.addChild(this.logo);
    }

    update ()
    {
        this.logo.rotation += 0.01;
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
