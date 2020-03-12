import { IContainerComponent } from './ContainerComponent';
import { ITransformComponent } from './TransformComponent';

type Constructor<T = {}> = new (...args: any[]) => T;
type Transformable = Constructor<ITransformComponent>;

export function ParentComponent<TBase extends Transformable>(Base: TBase)
{
    return class ParentComponent extends Base
    {
        parent?: IContainerComponent;
        isParent: boolean = false;
    
        setParent (parent?: IContainerComponent)
        {
            this.parent = parent;
    
            return this;
        }

        update (dt?: number, now?: number)
        {
            //  Left blank to be overridden by custom classes
        }
    };
}

export interface IParentComponent
{
    parent?: IContainerComponent;
    isParent: boolean;
    setParent (parent?: IContainerComponent): this;
    update (dt?: number, now?: number): void;
}
