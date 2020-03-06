import Frame from './Frame';
import Scene from './Scene';
import Sprite from './Sprite';

export default class AnimatedSprite extends Sprite
{
    type: string = 'AnimatedSprite';

    anims: Map<string, Frame[]>;
    animData: { currentAnim: string; currentFrames: Frame[]; frameIndex: number; animSpeed: number; nextFrameTime: number; repeatCount: number; isPlaying: boolean; yoyo: boolean; playingForward: boolean; };

    //  More features:
    //  repeat delay
    //  anim sequence (a set of anims to play back to back - might require an array of animData objects though?)

    //  more functions: 'playReverse', 'restart', add parameter to 'stop' to let it stop when it finishes one more loop

    constructor (scene: Scene, x: number, y: number, texture: string, frame?: string | number)
    {
        super(scene, x, y, texture, frame);

        this.anims = new Map();

        this.animData = { currentAnim: '', currentFrames: [], frameIndex: 0, animSpeed: 0, nextFrameTime: 0, repeatCount: 0, isPlaying: false, yoyo: false, playingForward: true };
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

    //  If animation already playing, calling this does nothing (use restart to restart one)
    play (key: string, speed: number = 24, repeat: number = 0, yoyo: boolean = false, startFrame: number = 0)
    {
        const data = this.animData;

        if (data.isPlaying)
        {
            if (data.currentAnim !== key)
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
            data.currentFrames = this.anims.get(key);

            data.currentAnim = key;

            data.frameIndex = startFrame;

            data.animSpeed = 1000 / speed;

            data.nextFrameTime = data.animSpeed;

            data.isPlaying = true;
            data.playingForward = true;
            data.yoyo = yoyo;
            data.repeatCount = repeat;
        }

        return this;
    }

    stop ()
    {
        const data = this.animData;

        data.isPlaying = false;
        data.currentAnim = '';

        //  emit event?
    }

    nextFrame ()
    {
        const data = this.animData;

        data.frameIndex++;

        //  There are no more frames, do we yoyo or repeat or end?
        if (data.frameIndex === data.currentFrames.length)
        {
            if (data.yoyo)
            {
                data.frameIndex--;
                data.playingForward = false;
            }
            else if (data.repeatCount === -1 || data.repeatCount > 0)
            {
                data.frameIndex = 0;

                if (data.repeatCount !== -1)
                {
                    data.repeatCount--;
                }
            }
            else
            {
                return this.stop();
            }
        }

        this.setFrame(data.currentFrames[data.frameIndex]);

        data.nextFrameTime += data.animSpeed;
    }

    prevFrame ()
    {
        const data = this.animData;

        data.frameIndex--;

        //  There are no more frames, do we repeat or end?
        if (data.frameIndex === -1)
        {
            if (data.repeatCount === -1 || data.repeatCount > 0)
            {
                data.frameIndex = 0;
                data.playingForward = true;

                if (data.repeatCount !== -1)
                {
                    data.repeatCount--;
                }
            }
            else
            {
                return this.stop();
            }
        }

        this.setFrame(data.currentFrames[data.frameIndex]);

        data.nextFrameTime += data.animSpeed;
    }

    update (delta: number)
    {
        super.update(delta);

        const data = this.animData;

        if (!data.isPlaying)
        {
            return;
        }

        data.nextFrameTime -= delta * 1000;

        //  It's time for a new frame
        if (data.nextFrameTime <= 0)
        {
            if (data.playingForward)
            {
                this.nextFrame();
            }
            else
            {
                this.prevFrame();
            }
        }
    }

    get isPlaying (): boolean
    {
        return this.animData.isPlaying;
    }

    get isPlayingForward (): boolean
    {
        return (this.animData.isPlaying && this.animData.playingForward);
    }

    get currentAnimation (): string
    {
        return this.animData.currentAnim;
    }

}
