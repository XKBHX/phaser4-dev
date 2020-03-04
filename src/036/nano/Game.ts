import DOMContentLoaded from './DOMContentLoaded';
import AddToDOM from './AddToDOM';
import WebGLRenderer from './WebGLRenderer';
import Loader from './Loader';
import Scene from './Scene';
import TextureManager from './TextureManager';
import IGameConfig from './IGameConfig';
import EventEmitter from './EventEmitter';

export default class Game extends EventEmitter
{
    VERSION: string = '4.0.0-beta1';

    renderer: WebGLRenderer;

    isPaused: boolean = false;
    isBooted: boolean = false;

    loader: Loader;
    textures: TextureManager;

    scene: Scene;

    private lastTick: number;
    lifetime: number = 0;
    elapsed: number = 0;

    //  The current game frame
    frame: number = 0;

    //  How many Game Objects were made dirty this frame?
    dirtyFrame: number = 0;

    constructor (config?: IGameConfig)
    {
        super();

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

    pause ()
    {
        this.isPaused = true;

        this.emit('pause');
    }

    resume ()
    {
        this.isPaused = false;

        this.emit('resume');
    }

    boot (width: number, height: number, backgroundColor: number, parent: string | HTMLElement)
    {
        this.isBooted = true;
        this.lastTick = Date.now();

        this.textures = new TextureManager(this);
        this.loader = new Loader(this);

        const renderer = new WebGLRenderer(width, height);

        renderer.setBackgroundColor(backgroundColor);

        AddToDOM(renderer.canvas, parent);

        this.renderer = renderer;

        this.banner(this.VERSION);

        //  Visibility API
        document.addEventListener('visibilitychange', () => {

            this.emit('visibilitychange', document.hidden);

            if (document.hidden)
            {
                this.pause();
            }
            else
            {
                this.resume();
            }

        });

        // window.addEventListener('blur', () => this.pause());
        // window.addEventListener('focus', () => this.resume());

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

        this.emit('boot');

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

        requestAnimationFrame(() => this.step());
    }

    banner (version: string)
    {
        console.log(
            '%c  %c  %cPhaser Nano v' + version + '%c https://phaser4.io',
            'padding: 2px; background: linear-gradient(to right, #00bcc3, #3e0081)',
            'padding: 2px; background: #3e0081 url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAJ1BMVEUALon///+9tJQAAABv9v92d2IAn6qHEhL/DQ3/fCUOOlNMPUD/uz24pItZAAAAaElEQVQI12OAA/YCKKPyOANbWgKQUdFZkOLiBmJ0zHIRdAEKWXR0uQimABnWu3elpIEYhoKCYS4ui8EModBQRQMG09AgQSBQBmpvBzOABhYpAYEBg3FpEJAOZgCqAdEGDAzGIACk4QAAsv0aPCHrnowAAAAASUVORK5CYII=) no-repeat;',
            'padding: 2px 20px 2px 8px; color: #fff; background: linear-gradient(to right, #3e0081 90%, #3e0081 10%, #00bcc3)',
            ''
        );
    }

    step ()
    {
        const now = Date.now();
        const delta = now - this.lastTick;

        const dt = delta / 1000;

        this.lifetime += dt;
        this.elapsed = dt;
        this.lastTick = now;

        //  The frame always advances by 1 each step (even when paused)
        this.frame++;
    
        if (this.isPaused)
        {
            this.renderer.render(this.scene.world, 0);

            requestAnimationFrame(() => this.step());

            return;
        }

        this.dirtyFrame = 0;

        this.emit('step', dt);

        this.scene.world.update(dt);

        this.scene.update(dt, now);

        this.renderer.render(this.scene.world, this.dirtyFrame);

        this.emit('render', this.renderer.dirtySprites, this.renderer.cachedSprites);

        requestAnimationFrame(() => this.step());
    }

}
