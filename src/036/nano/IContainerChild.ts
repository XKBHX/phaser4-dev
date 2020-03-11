import { IContainerComponent } from './components/ContainerComponent';

export interface IContainerChild
{
    type: string;
    parent: IContainerComponent;
    hasTexture: boolean;
    update: (dt?: number, now?: number) => void;
    updateTransform: () => this;
    willRender: () => boolean;
    numChildren: number;
}
