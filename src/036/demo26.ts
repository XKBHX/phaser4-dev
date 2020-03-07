import Game from 'nano/Game';
import Scene from 'nano/Scene';
import AnimatedSprite from 'nano/AnimatedSprite';

class Demo extends Scene
{
    constructor (game: Game)
    {
        super(game);

        const text = document.getElementById('cacheStats');

        this.game.on('render', (dirty: number, cached: number) => {

            const cacheUtilisation = (cached / (cached + dirty)) * 100;

            text['value'] = 'Cached: ' + cacheUtilisation + '% - Dirty: ' + dirty + ' / ' + cached;

        });
    }

    preload ()
    {
        this.load.setPath('../assets/');
        this.load.atlas('items', 'cartoon-items.png', 'cartoon-items.json');
    }

    createItem (key, x, y)
    {
        const item = new AnimatedSprite(this, x, y, 'items', key + '-1');

        this.world.addChild(item);

        item.addAnimationFromAtlas(key, key + '-', 1, 8);

        item.play(key, { speed: 10, repeat: -1 });
    }

    create ()
    {
        this.createItem('coin-silver', 200, 150);
        this.createItem('cup', 400, 150);
        this.createItem('gem', 600, 150);

        this.createItem('heart', 200, 300);
        this.createItem('lightning', 400, 300);
        this.createItem('meat', 600, 300);

        this.createItem('medkit', 200, 450);
        this.createItem('pouch', 400, 450);
        this.createItem('star', 600, 450);
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
