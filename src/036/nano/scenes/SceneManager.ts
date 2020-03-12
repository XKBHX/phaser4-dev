import Game from 'nano/Game';
import Scene from '../Scene';
import IScene from './IScene';

export default class SceneManager
{
    game: Game;
    scenes: Map<string, Scene>;

    constructor (game: Game, sceneConfig)
    {
        this.game = game;

        this.scenes = new Map();

        this.addScene(sceneConfig);
    }

    update (delta: number, now: number)
    {
        // this.scene.update(dt, now);
        // this.scene.world.update(dt, now);
    }

    render ()
    {
    }

    addScene (sceneConfig: IScene | Scene)
    {
        let scene: Scene;

        if (sceneConfig instanceof Scene)
        {
            scene = this.createSceneFromInstance(sceneConfig);
        }
        else if (typeof scene === 'object')
        {
            scene = this.createSceneFromObject(sceneConfig);
        }
        else if (typeof scene === 'function')
        {
            scene = this.createSceneFromFunction(sceneConfig);
        }

        const key: string = (sceneConfig.hasOwnProperty('key')) ? sceneConfig['key'] : 'default';

        this.scenes.set(key, scene);
    }

    createSceneFromInstance (newScene: Scene): Scene
    {
        newScene.game = this.game;
        newScene.load = this.game.loader;

        return newScene;
    }

    createSceneFromObject (scene: any): Scene
    {
        let newScene = new Scene(this.game);

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
        var newScene = new scene(this.game);

        if (newScene instanceof Scene)
        {
            return this.createSceneFromInstance(newScene);
        }
        else
        {
            return newScene;
        }
    }

}
