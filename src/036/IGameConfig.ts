import Scene from 'Scene';

export default interface IGameConfig {
    width?: number;
    height?: number;
    parent?: string | HTMLElement;
    backgroundColor?: number;
    scene?: Scene | Object | any;
}
