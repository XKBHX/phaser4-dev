import Game from 'Game';
import Loader from 'Loader';

export default class Scene
{
    game: Game;
    load: Loader;

    constructor (game: Game)
    {
        this.game = game;
        this.load = game.loader;
    }

    init ()
    {
    }

    preload ()
    {

    }

    create ()
    {

    }

    update (time: DOMHighResTimeStamp)
    {

    }

}
