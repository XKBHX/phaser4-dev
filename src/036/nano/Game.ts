import { DOMContentLoaded, AddToDOM } from '@phaserjs/dom';
import WebGLRenderer from './WebGLRenderer';
import Loader from './Loader';
import Scene from './Scene';
import TextureManager from './TextureManager';
import IGameConfig from './IGameConfig';

export default class Game
{
    VERSION: string = '4.0.0-beta1';

    renderer: WebGLRenderer;

    isPaused: boolean = false;
    isBooted: boolean = false;

    loader: Loader;
    textures: TextureManager;

    scene: Scene;

    constructor (config?: IGameConfig)
    {
        const {
            width = 800,
            height = 600,
            backgroundColor = 0x00000,
            parent = document.body,
            scene = new Scene(this)
        } = config;

        this.scene = scene;

        DOMContentLoaded(() => this.boot(width, height, backgroundColor, parent));
    }

    boot (width: number, height: number, backgroundColor: number, parent: string | HTMLElement)
    {
        this.isBooted = true;

        this.textures = new TextureManager(this);
        this.loader = new Loader(this);

        const renderer = new WebGLRenderer(width, height);

        renderer.setBackgroundColor(backgroundColor);

        AddToDOM(renderer.canvas, parent);

        this.renderer = renderer;

        this.banner(this.VERSION);

        const scene = this.scene;

        if (scene instanceof Scene)
        {
            this.scene = this.createSceneFromInstance(scene);
        }
        else if (typeof scene === 'object')
        {
            this.scene = this.createSceneFromObject(scene);
        }
        else if (typeof scene === 'function')
        {
            this.scene = this.createSceneFromFunction(scene);
        }

        this.scene.init();
        this.scene.preload();

        if (this.loader.totalFilesToLoad() > 0)
        {
            this.loader.start(() => this.start());
        }
        else
        {
            this.start();
        }
    }

    createSceneFromInstance (newScene: Scene): Scene
    {
        newScene.game = this;
        newScene.load = this.loader;

        return newScene;
    }

    createSceneFromObject (scene: any): Scene
    {
        let newScene = new Scene(this);

        //  Extract callbacks

        const defaults = [ 'init', 'preload', 'create', 'update', 'render' ];

        defaults.forEach((method) => {

            if (scene.hasOwnProperty(method))
            {
                newScene[method] = scene[method];
            }

        });

        return newScene;
    }

    createSceneFromFunction (scene: any): Scene
    {
        var newScene = new scene(this);

        if (newScene instanceof Scene)
        {
            return this.createSceneFromInstance(newScene);
        }
        else
        {
            return newScene;
        }
    }

    start ()
    {
        this.scene.create();

        requestAnimationFrame((time) => this.step(time));
    }

    banner (version: string)
    {
        console.log(
            '%cPhaser Nano v' + version + '%c https://phaser4.io',
            'padding: 2px 20px; color: #fff; background: linear-gradient(to right, #00bcc3, #3e0081 10%, #3e0081 90%, #3e0081 10%, #00bcc3)',
            ''
        );
    }

    step (time: DOMHighResTimeStamp)
    {
        if (this.isPaused)
        {
            requestAnimationFrame((time) => this.step(time));

            return;
        }

        this.scene.world.update();

        this.scene.update(time);

        this.renderer.render(this.scene.world);

        requestAnimationFrame((time) => this.step(time));
    }

}
