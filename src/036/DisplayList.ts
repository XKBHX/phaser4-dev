import Scene from 'Scene';
import Game from 'Game';
import Sprite from 'Sprite';

export default class DisplayList
{
    scene: Scene;
    game: Game;
    
    list: Sprite[];

    constructor (scene: Scene)
    {
        this.scene = scene;
        this.game = scene.game;

        this.list = [];
    }

    add (child: Sprite)
    {
        const list = this.list;

        if (list.indexOf(child) === -1)
        {
            list.push(child);
        }

        return this;
    }

    remove (child: Sprite)
    {
        const list = this.list;

        const index = list.indexOf(child);

        if (index !== -1)
        {
            list.splice(index, 1);
        }

        return this;
    }


}
