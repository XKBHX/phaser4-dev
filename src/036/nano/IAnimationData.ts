import Frame from "./Frame";
import AnimatedSprite from "./AnimatedSprite";

export default interface IAnimationData
{
    currentAnim: string;
    currentFrames: Frame[];
    frameIndex: number;
    animSpeed: number;
    nextFrameTime: number;
    repeatCount: number;
    isPlaying: boolean;
    yoyo: boolean;
    pendingStart: boolean;
    playingForward: boolean;
    delay: number;
    repeatDelay: number;
    onStart?: (sprite: AnimatedSprite, animation: string) => void;
    onRepeat?: (sprite: AnimatedSprite, animation: string) => void;
    onComplete?: (sprite: AnimatedSprite, animation: string) => void;
}
