import Scene from '../Scene';
import Install from '../components/Install';
import * as Components from '../components';
import IGameObject from './IGameObject';

export default class GameObject extends Install(class {}, [
    Components.AlphaComponent,
    Components.DirtyComponent,
    Components.ParentComponent,
    Components.OriginComponent,
    Components.PositionComponent,
    Components.RenderableComponent,
    Components.RotationComponent,
    Components.ScaleComponent,
    Components.SceneComponent,
    Components.SizeComponent,
    Components.SkewComponent,
    Components.TransformComponent,
    Components.VisibleComponent
])
{
    constructor (scene: Scene, x: number = 0, y: number = 0)
    {
        super();

        this.scene = scene;
        this._position.set(x, y);
        this.dirty = true;
    }

};

export default interface GameObject extends IGameObject {}
