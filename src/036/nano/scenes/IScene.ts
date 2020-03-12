import Game from 'nano/Game';

export default interface IScene
{
    key: string;
    game: Game;
    init?: () => void;
    preload?: () => void;
    create: () => void;
    update?: (delta?: number, now?: number) => void;
    render?: () => void;
}
