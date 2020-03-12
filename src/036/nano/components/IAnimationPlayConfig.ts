import { IAnimationComponent } from './AnimationComponent';

export default interface IAnimationPlayConfig
{
    speed?: number;
    repeat?: number;
    yoyo?: boolean;
    startFrame?: number;
    delay?: number;
    repeatDelay?: number;
    forceRestart?: boolean;
    onStart?: (sprite: IAnimationComponent, animation: string) => void;
    onRepeat?: (sprite: IAnimationComponent, animation: string) => void;
    onComplete?: (sprite: IAnimationComponent, animation: string) => void;
}
