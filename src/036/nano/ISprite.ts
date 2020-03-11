import * as Components from './components';

export default interface ISprite extends
    Components.IContainerComponent,
    Components.IDirtyComponent,
    Components.IOriginComponent,
    Components.IPositionComponent,
    Components.IQuadAlphaComponent,
    Components.IQuadTintComponent,
    Components.IRenderableComponent,
    Components.IRotationComponent,
    Components.IScaleComponent,
    Components.ISceneComponent,
    Components.ISizeComponent,
    Components.ISkewComponent,
    Components.ITextureComponent,
    Components.IVisibleComponent
    {
        type: string;

        vertexData: Float32Array;
        vertexTint: Uint32Array;
        vertexAlpha: Float32Array;
        vertexColor: Uint32Array;
        _prevTextureID: number;
        packColors: () => this;
    }
