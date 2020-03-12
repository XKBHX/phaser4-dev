import * as Components from '../components';

export default interface IGameObject extends
    Components.IAlphaComponent,
    Components.IDirtyComponent,
    Components.IOriginComponent,
    Components.IParentComponent,
    Components.IPositionComponent,
    Components.IRenderableComponent,
    Components.IRotationComponent,
    Components.IScaleComponent,
    Components.ISceneComponent,
    Components.ISizeComponent,
    Components.ISkewComponent,
    Components.ITransformComponent,
    Components.IVisibleComponent
    {}
