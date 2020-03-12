import Game from 'nano/Game';
import Sprite from 'nano/gameobjects/Sprite';
import Scene from 'nano/Scene';
import Stats from 'nano/stats/Stats';

class Box extends Sprite
{
    //  0 = left to right
    //  1 = top to bottom
    //  2 = right to left
    //  3 = bottom to top
    private direction: number = 0;
    private speed: number = 2;
    private startX: number;
    private startY: number;
    private endX: number;
    private endY: number;

    constructor (scene: Scene, x: number, y: number, texture: string, frame?: string | number, direction: number = 0, size: number = 512)
    {
        super(scene, x, y, texture, frame);

        this.direction = direction;

        if (direction === 0)
        {
            //  Box is in the top-left
            this.startX = x;
            this.startY = y;
    
            this.endX = x + size;
            this.endY = y + size;
        }
        else if (direction === 1)
        {
            //  Box is in the top-right
            this.startX = x - size;
            this.startY = y;
    
            this.endX = x;
            this.endY = y + size;
        }
        else if (direction === 2)
        {
            //  Box is in the bottom-right
            this.startX = x - size;
            this.startY = y - size;
    
            this.endX = x;
            this.endY = y;
        }
        else if (direction === 3)
        {
            //  Box is in the bottom-left
            this.startX = x;
            this.startY = y - size;
    
            this.endX = x + size;
            this.endY = y;
        }
    }

    update (dt: number, now: number)
    {
        super.update(dt, now);

        switch (this.direction)
        {
            case 0: {
                this.x += this.speed;

                if (this.x >= this.endX)
                {
                    this.x = this.endX;
                    this.direction = 1;
                }
            } break;

            case 1: {
                this.y += this.speed;

                if (this.y >= this.endY)
                {
                    this.y = this.endY;
                    this.direction = 2;
                }
            } break;

            case 2: {
                this.x -= this.speed;

                if (this.x <= this.startX)
                {
                    this.x = this.startX;
                    this.direction = 3;
                }
            } break;

            case 3: {
                this.y -= this.speed;

                if (this.y <= this.startY)
                {
                    this.y = this.startY;
                    this.direction = 0;
                }
            } break;
        }
    }
}

class Demo extends Scene
{
    container: Sprite;

    logo1: Sprite;
    logo2: Sprite;
    logo3: Sprite;
    logo4: Sprite;

    constructor (game: Game)
    {
        super(game);

        new Stats(game, 'base');
    }

    preload ()
    {
        this.load.image('checker', '../assets/checker.png');
        this.load.image('logo', '../assets/logo.png');
        this.load.image('brain', '../assets/brain.png');
        this.load.image('clown', '../assets/clown.png');
    }

    create ()
    {
        this.container = new Sprite(this, 400, 300, 'checker');

        const child1 = new Box(this, -256, -256, 'brain', null, 0);
        const child2 = new Box(this, 256, -256, 'brain', null, 1);
        const child3 = new Box(this, 256, 256, 'brain', null, 2);
        const child4 = new Box(this, -256, 256, 'brain', null, 3);

        //  Logo stack
        const child5 = new Sprite(this, 0, 0, 'logo').setScale(0.7);
        const child6 = new Sprite(this, 0, 0, 'logo').setScale(0.8);
        const child7 = new Sprite(this, 0, 0, 'logo').setScale(0.9);
        const child8 = new Sprite(this, 0, 0, 'logo').setScale(1.0);

        this.logo1 = child5;
        this.logo2 = child6;
        this.logo3 = child7;
        this.logo4 = child8;

        this.container.addChild(child1, child2, child3, child4, child5, child6, child7, child8);

        this.world.addChild(this.container);

        this.world.addChild(new Sprite(this, 100, 100, 'clown'));
        this.world.addChild(new Sprite(this, 700, 100, 'clown'));
        this.world.addChild(new Sprite(this, 100, 500, 'clown'));
        this.world.addChild(new Sprite(this, 700, 500, 'clown'));
    }

    update ()
    {
        this.container.rotation += 0.005;

        this.logo1.rotation += 0.037;
        this.logo2.rotation += 0.038;
        this.logo3.rotation += 0.039;
        this.logo4.rotation += 0.040;
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
}
