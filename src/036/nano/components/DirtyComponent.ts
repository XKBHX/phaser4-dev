import { ISceneComponent } from './SceneComponent';

type Constructor<T = {}> = new (...args: any[]) => T;
type SceneChild = Constructor<ISceneComponent>

export function DirtyComponent<TBase extends SceneChild>(Base: TBase)
{
    return class DirtyComponent extends Base
    {
        dirty: boolean = true;
        dirtyFrame: number = 0;
    
        setDirty (setFrame: boolean = true)
        {
            this.dirty = true;

            if (setFrame)
            {
                this.dirtyFrame = this.scene.game.frame;
            }
    
            return this;
        }
    };
}

export interface IDirtyComponent
{
    dirty: boolean;
    dirtyFrame: number;
    setDirty (setFrame?: boolean): this;
}
