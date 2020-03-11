import DisplayObjectContainer from './DisplayObjectContainer';
import IMatrix2d from './IMatrix2d';
import Vec2 from './Vec2';
import * as Components from './components';

export default interface IDisplayObject extends
    Components.IAlphaComponent,
    Components.IOriginComponent,
    Components.IPositionComponent,
    Components.IRenderableComponent,
    Components.IRotationComponent,
    Components.IScaleComponent,
    Components.ISceneComponent,
    Components.ISizeComponent,
    Components.ISkewComponent,
    Components.IVisibleComponent
{
    dirty: boolean;
    dirtyFrame: number;

    hasTexture: boolean;

    parent: DisplayObjectContainer;

    localTransform: IMatrix2d;
    worldTransform: IMatrix2d;

    updateTransform: () => this;
    updateCache: () => this;
    localToGlobal: (x: number, y: number, outPoint: Vec2) => Vec2;
    globalToLocal: (x: number, y: number, outPoint: Vec2) => Vec2;
    willRender: () => boolean;
}
