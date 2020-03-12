import Scene from '../Scene';
import Sprite from './Sprite';
import * as Components from '../components';
import Install from '../components/Install';
import IAnimatedSprite from './IAnimatedSprite';

export default class AnimatedSprite extends Install(Sprite, [
    Components.AnimationComponent
])
{
    constructor (scene: Scene, x: number, y: number, texture: string, frame?: string | number)
    {
        super();

        this.setScene(scene);
        this.setTexture(texture, frame);
        this.setPosition(x, y);
    }
}

export default interface AnimatedSprite extends IAnimatedSprite {}
