import AnimatedSprite from "./AnimatedSprite";

export default interface IAnimationPlayConfig
{
    speed?: number;
    repeat?: number;
    yoyo?: boolean;
    startFrame?: number;
    delay?: number;
    repeatDelay?: number;
    forceRestart?: boolean;
    onStart?: (sprite: AnimatedSprite, animation: string) => void;
    onRepeat?: (sprite: AnimatedSprite, animation: string) => void;
    onComplete?: (sprite: AnimatedSprite, animation: string) => void;
}
