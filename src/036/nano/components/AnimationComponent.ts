import IAnimationData from './IAnimationData';
import IAnimationPlayConfig from './IAnimationPlayConfig';
import Frame from '../Frame';
import { ITextureComponent } from './TextureComponent';
import { IParentComponent } from './ParentComponent';

type Constructor<T = {}> = new (...args: any[]) => T;
type Animateable = Constructor<ITextureComponent & IParentComponent>

export function AnimationComponent<TBase extends Animateable>(Base: TBase)
{
    return class AnimationComponent extends Base
    {
        anims: Map<string, Frame[]>;
        animData: IAnimationData;
    
        constructor (...args: any[])
        {
            super(args);
    
            this.anims = new Map();
    
            //  Holds all the data for the current animation only
            this.animData = {
                currentAnim: '',
                currentFrames: [],
                frameIndex: 0,
                animSpeed: 0,
                nextFrameTime: 0,
                repeatCount: 0,
                isPlaying: false,
                yoyo: false,
                pendingStart: false,
                playingForward: true,
                delay: 0,
                repeatDelay: 0,
                onStart: null,
                onRepeat: null,
                onComplete: null
            };
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
            if (!this.anims.has(key))
            {
                this.anims.set(key, this.texture.getFramesInRange(prefix, start, end, zeroPad, suffix));
            }
    
            return this;
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
        play (key: string, config: IAnimationPlayConfig = {})
        {
            const {
                speed = 24,
                repeat = 0,
                yoyo = false,
                startFrame = 0,
                delay = 0,
                repeatDelay = 0,
                onStart = null,
                onRepeat = null,
                onComplete = null,
                forceRestart = false
            } = config;
    
            const data = this.animData;
    
            if (data.isPlaying)
            {
                if (data.currentAnim !== key)
                {
                    this.stop();
                }
                else if (!forceRestart)
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
                data.nextFrameTime = data.animSpeed + delay;
                data.isPlaying = true;
                data.playingForward = true;
                data.yoyo = yoyo;
                data.repeatCount = repeat;
                data.delay = delay;
                data.repeatDelay = repeatDelay;
                data.onStart = onStart;
                data.onRepeat = onRepeat;
                data.onComplete = onComplete;
    
                //  If there is no start delay, we set the first frame immediately
                if (delay === 0)
                {
                    this.setFrame(data.currentFrames[data.frameIndex]);
    
                    if (onStart)
                    {
                        onStart(this, key);
                    }
                }
                else
                {
                    data.pendingStart = true;
                }
            }
    
            return this;
        }
    
        stop ()
        {
            const data = this.animData;
    
            data.isPlaying = false;
            data.currentAnim = '';
    
            if (data.onComplete)
            {
                data.onComplete(this, data.currentAnim);
            }

            return this;
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
    
                    if (data.onRepeat)
                    {
                        data.onRepeat(this, data.currentAnim);
                    }
    
                    data.nextFrameTime += data.repeatDelay;
                }
                else
                {
                    data.frameIndex--;
    
                    return this.stop();
                }
            }
    
            this.setFrame(data.currentFrames[data.frameIndex]);
    
            data.nextFrameTime += data.animSpeed;

            return this;
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
    
                    if (data.onRepeat)
                    {
                        data.onRepeat(this, data.currentAnim);
                    }
    
                    data.nextFrameTime += data.repeatDelay;
                }
                else
                {
                    data.frameIndex = 0;
    
                    return this.stop();
                }
            }
    
            this.setFrame(data.currentFrames[data.frameIndex]);
    
            data.nextFrameTime += data.animSpeed;

            return this;
        }
    
        update (delta: number, now: number)
        {
            super.update(delta, now);
    
            const data = this.animData;
    
            if (!data.isPlaying)
            {
                return;
            }
    
            data.nextFrameTime -= delta * 1000;
            
            //  Clamp to zero, otherwise a huge delta could cause animation playback issues
            data.nextFrameTime = Math.max(data.nextFrameTime, 0);
    
            //  It's time for a new frame
            if (data.nextFrameTime === 0)
            {
                //  Is this the start of our animation?
                if (data.pendingStart)
                {
                    if (data.onStart)
                    {
                        data.onStart(this, data.currentAnim);
                    }
    
                    data.pendingStart = false;
                    data.nextFrameTime = data.animSpeed;
                }
                else if (data.playingForward)
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
    };
}

export interface IAnimationComponent
{
    anims: Map<string, Frame[]>;
    animData: IAnimationData;
    addAnimation (key: string, frames: string[] | number[]): this;
    addAnimationFromAtlas (key: string, prefix: string, start: number, end: number, zeroPad?: number, suffix?: string): this;
    removeAnimation (key: string): this;
    clearAnimations (): this;
    play (key: string, config?: IAnimationPlayConfig): this;
    stop (): this;
    nextFrame (): this;
    prevFrame (): this;
    update (delta?: number, now?: number): void;
    isPlaying: boolean;
    isPlayingForward: boolean;
    currentAnimation: string;
}
