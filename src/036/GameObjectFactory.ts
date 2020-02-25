import Scene from 'Scene';
import DisplayList from 'DisplayList';
import Sprite from 'Sprite';

export default class GameObjectFactory
{
    private scene: Scene;
    private displayList: DisplayList;

    constructor (scene: Scene)
    {
        this.scene = scene;
        this.displayList = scene.children;
    }

    sprite (x: number, y: number, texture: string, frame?: string | number): Sprite
    {
        let sprite = new Sprite(this.scene, x, y, texture, frame);

        this.displayList.add(sprite);

        return sprite;
    }


}