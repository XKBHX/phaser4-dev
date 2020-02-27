import Texture from './Texture';
import Game from './Game';
import SpriteSheetParser from './SpriteSheetParser';
import IFrameConfig from './IFrameConfig';

export default class TextureManager
{
    textures: Map<string, Texture>;
    game: Game;

    constructor (game: Game)
    {
        this.game = game;

        this.textures = new Map();
    }

    get (key: string): Texture
    {
        if (this.textures.has(key))
        {
            return this.textures.get(key);
        }
        else
        {
            return this.textures.get('__MISSING');
        }
    }

    addImage (key: string, source: HTMLImageElement): Texture
    {
        let texture = null;

        if (!this.textures.has(key))
        {
            texture = new Texture(key, source);

            texture.glTexture = this.game.renderer.createGLTexture(texture.image);

            this.textures.set(key, texture);
        }

        return texture;
    }

    addSpriteSheet (key: string, source: HTMLImageElement, frameConfig: IFrameConfig): Texture
    {
        let texture = null;

        if (!this.textures.has(key))
        {
            texture = new Texture(key, source);

            texture.glTexture = this.game.renderer.createGLTexture(texture.image);

            SpriteSheetParser(texture, 0, 0, texture.width, texture.height, frameConfig);

            this.textures.set(key, texture);
        }

        return texture;
    }


}