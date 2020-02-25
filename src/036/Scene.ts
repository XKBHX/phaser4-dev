import Game from 'Game';
import Loader from 'Loader';
import TextureManager from 'TextureManager';
import DisplayList from 'DisplayList';
import GameObjectFactory from 'GameObjectFactory';

export default class Scene
{
    game: Game;
    load: Loader;
    textures: TextureManager;
    children: DisplayList;
    add: GameObjectFactory;

    constructor (game: Game)
    {
        this.game = game;
        this.load = game.loader;
        this.textures = game.textures;
        this.children = new DisplayList(this);
        this.add = new GameObjectFactory(this);
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

    update (time?: DOMHighResTimeStamp)
    {
    }

}
