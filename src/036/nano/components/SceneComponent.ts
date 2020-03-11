import Scene from '../Scene';

type Constructor<T = {}> = new (...args: any[]) => T;

export function SceneComponent<TBase extends Constructor>(Base: TBase)
{
    return class SceneComponent extends Base
    {
        scene: Scene;

        setScene (scene: Scene)
        {
            this.scene = scene;
    
            return this;
        }
    };
}

export interface ISceneComponent
{
    scene: Scene;
    setScene (scene: Scene): this;
}
