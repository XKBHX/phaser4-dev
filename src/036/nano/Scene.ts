import Game from './Game';
import Loader from './Loader';
import TextureManager from './TextureManager';
import Container from './gameobjects/Container';
import Camera from './Camera';

export default class Scene
{
    camera: Camera;
    game: Game;
    load: Loader;
    textures: TextureManager;
    world: Container;

    constructor (game: Game)
    {
        this.game = game;
        this.load = game.loader;
        this.textures = game.textures;
        this.world = new Container(this, 0, 0);
        this.camera = new Camera(this, 0, 0);
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
