import Game from './Game';
import Loader from './loader/Loader';
import TextureManager from './textures/TextureManager';
import Camera from './gameobjects/Camera';
import World from './gameobjects/World';

export default class Scene
{
    camera: Camera;
    game: Game;
    load: Loader;
    textures: TextureManager;
    world: World;

    constructor (game: Game)
    {
        this.game = game;
        this.load = game.loader;
        this.textures = game.textures;
        this.world = new World(this);
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
