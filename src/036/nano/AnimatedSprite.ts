import Texture from './Texture';
import Frame from './Frame';
import Scene from './Scene';
import Sprite from './Sprite';

export default class AnimatedSprite extends Sprite
{
    type: string = 'AnimatedSprite';

    anims: Map<string, Frame[]>;

    currentAnim: string;
    currentFrames: Frame[];
    frameIndex: number = 0;
    animSpeed: number = 0;
    nextFrame: number = 0;
    isPlaying: boolean = false;

    constructor (scene: Scene, x: number, y: number, texture: string, frame?: string | number)
    {
        super(scene, x, y, texture, frame);

        this.anims = new Map();
    }

    addAnimation (key: string, frames: string[] | number[])
    {
        if (!this.anims.has(key))
        {
            this.anims.set(key, this.texture.getFrames(frames));
        }

        return this;
    }

    addAnimationFromAtlas (key: string, prefix: string, start: number, end: number, zeroPad: number = 0, suffix: string = '')
    {
        const frameKeys = [];

        const diff: number = (start < end) ? 1 : -1;

        //  Adjust because we use i !== end in the for loop
        end += diff;

        for (let i: number = start; i !== end; i += diff)
        {
            frameKeys.push(prefix + i.toString().padStart(zeroPad, '0') + suffix);
        }

        return this.addAnimation(key, frameKeys);
    }

    removeAnimation (key: string)
    {
        this.anims.delete(key);

        return this;
    }

    clearAnimations ()
    {
        this.anims.clear();

        return this;
    }

    //  If animation already playing, call this does nothing (use restart to restart one)
    play (key: string, speed: number = 24, repeat: number = 0, startFrame: number = 0, yoyo: boolean = false)
    {
        if (this.isPlaying)
        {
            if (this.currentAnim !== key)
            {
                this.stop();
            }
            else
            {
                //  This animation is already playing? Just return then.
                return this;
            }
        }

        if (this.anims.has(key))
        {
            this.currentFrames = this.anims.get(key);

            this.currentAnim = key;

            this.frameIndex = startFrame;

            this.animSpeed = 1000 / speed;

            this.nextFrame = this.animSpeed;

            this.isPlaying = true;
        }

        return this;
    }

    stop ()
    {
        this.isPlaying = false;

        //  emit event?
    }

    update (delta: number)
    {
        super.update(delta);

        if (!this.isPlaying)
        {
            return;
        }

        this.nextFrame -= delta * 1000;

        if (this.nextFrame <= 0)
        {
            this.frameIndex++;

            if (this.frameIndex === this.currentFrames.length)
            {
                this.frameIndex = 0;
            }

            this.setFrame(this.currentFrames[this.frameIndex]);

            this.nextFrame += this.animSpeed;
        }
    }
}
