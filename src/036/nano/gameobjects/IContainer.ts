import * as Components from '../components';

export default interface IContainer extends
    Components.IContainerComponent,
    Components.IDirtyComponent,
    Components.IOriginComponent,
    Components.IPositionComponent,
    Components.IRenderableComponent,
    Components.IRotationComponent,
    Components.IScaleComponent,
    Components.ISceneComponent,
    Components.ISizeComponent,
    Components.ISkewComponent,
    Components.ITransformComponent,
    Components.IVisibleComponent
    {
        update (dt: number, now: number): void;
    }
