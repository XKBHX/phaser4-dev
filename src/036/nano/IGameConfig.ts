import IScene from './scenes/IScene';

export default interface IGameConfig {
    width?: number;
    height?: number;
    parent?: string | HTMLElement;
    backgroundColor?: number;
    scene?: IScene | IScene[] | Object | any;
}
