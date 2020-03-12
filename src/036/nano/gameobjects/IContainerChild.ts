import * as Components from '../components';

export default interface IContainerChild extends
    Components.IDirtyComponent,
    Components.IParentComponent,
    Components.IRenderableComponent,
    Components.ITransformComponent
    {}
