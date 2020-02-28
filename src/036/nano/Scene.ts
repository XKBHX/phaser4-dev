import Game from './Game';
import Loader from './Loader';
import TextureManager from './TextureManager';
import DisplayObjectContainer from './DisplayObjectContainer';

export default class Scene
{
    game: Game;
    load: Loader;
    textures: TextureManager;
    world: DisplayObjectContainer;

    constructor (game: Game)
    {
        this.game = game;
        this.load = game.loader;
        this.textures = game.textures;
        this.world = new DisplayObjectContainer();
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

    update (delta?: number, time?: number)
    {
    }

}
