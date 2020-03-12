import DOMContentLoaded from './core/DOMContentLoaded';
import AddToDOM from './core/AddToDOM';
import WebGLRenderer from './renderer/WebGLRenderer';
import Loader from './loader/Loader';
import SceneManager from './scenes/SceneManager';
import TextureManager from './textures/TextureManager';
import IGameConfig from './IGameConfig';
import EventEmitter from './core/EventEmitter';
import IRenderable from './gameobjects/IRenderable';

export default class Game extends EventEmitter
{
    VERSION: string = '4.0.0-beta2';

    config: IGameConfig;

    isPaused: boolean = false;
    isBooted: boolean = false;

    loader: Loader;
    scenes: SceneManager;
    textures: TextureManager;
    renderer: WebGLRenderer;

    private lastTick: number;
    lifetime: number = 0;
    elapsed: number = 0;

    //  The current game frame
    frame: number = 0;

    //  How many Game Objects were made dirty this frame?
    dirtyFrame: number = 0;

    //  How many Game Objects were processed this frame?
    totalFrame: number = 0;

    constructor (config?: IGameConfig)
    {
        super();

        const {
            width = 800,
            height = 600,
            backgroundColor = 0x00000,
            parent = document.body,
            scene = null
        } = config;

        this.config = { width, height, backgroundColor, parent, scene };

        DOMContentLoaded(() => this.boot());
    }

    pause ()
    {
        this.isPaused = true;

        this.emit('pause');
    }

    resume ()
    {
        this.isPaused = false;

        this.lastTick = Date.now();

        this.emit('resume');
    }

    boot ()
    {
        this.isBooted = true;
        this.lastTick = Date.now();

        this.textures = new TextureManager(this);
        this.loader = new Loader(this);

        const config = this.config;

        const renderer = new WebGLRenderer(config.width, config.height);

        renderer.setBackgroundColor(config.backgroundColor);

        AddToDOM(renderer.canvas, config.parent);

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

        /*
        const scene = this.scene;

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
        */
    }

    start ()
    {
        // this.scene.create();

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
    
        this.emit('step', dt, now);

        if (!this.isPaused)
        {
            this.scenes.update(dt, now);
        }

        this.emit('update', dt, now);

        //  These should probably be moved to the Scene Manager
        //  so each Scene is classed as being dirty or not?
        this.dirtyFrame = 0;
        this.totalFrame = 0;

        //  Each Scene calls 'render' on the Renderer, that way we could cache
        //  the Scene display, if it was paused or something
        this.scenes.render();

        // const renderList: IRenderable[] = this.scene.world.preRender();

        // this.renderer.render(renderList, this.scene.camera, this.dirtyFrame);

        this.emit('render', dt, now);

        //  The frame always advances by 1 each step (even when paused)
        this.frame++;

        requestAnimationFrame(() => this.step());
    }

    destroy ()
    {
        //  TODO
    }

}
