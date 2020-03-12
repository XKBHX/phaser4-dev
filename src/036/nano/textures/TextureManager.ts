import Texture from './Texture';
import Game from '../Game';
import SpriteSheetParser from './SpriteSheetParser';
import IFrameConfig from './IFrameConfig';
import AtlasParser from './AtlasParser';

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

    addAtlas (key: string, source: HTMLImageElement, atlasData: Object): Texture
    {
        let texture = null;

        if (!this.textures.has(key))
        {
            texture = new Texture(key, source);

            texture.glTexture = this.game.renderer.createGLTexture(texture.image);

            AtlasParser(texture, atlasData);

            this.textures.set(key, texture);
        }

        return texture;
    }

    addColor (key: string, color: string, width: number = 32, height: number = 32): Texture
    {
        return this.addGrid(key, color, color, width, height, 0, 0);
    }

    addGrid (key: string, color1: string, color2: string, width: number = 32, height: number = 32, cols: number = 2, rows: number = 2): Texture
    {
        let texture = null;

        if (!this.textures.has(key))
        {
            const ctx = this.createCanvas(width, height);

            const colWidth = width / cols;
            const rowHeight = height / rows;

            ctx.fillStyle = color1;
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = color2;

            for (let y: number = 0; y < rows; y++)
            {
                for (let x: number = (y % 2); x < cols; x += 2)
                {
                    ctx.fillRect(x * colWidth, y * rowHeight, colWidth, rowHeight);
                }
            }

            texture = new Texture(key, ctx.canvas);

            texture.glTexture = this.game.renderer.createGLTexture(texture.image);

            this.textures.set(key, texture);
        }

        return texture;
    }

    createCanvas (width: number, height: number): CanvasRenderingContext2D
    {
        const canvas = document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;

        return canvas.getContext('2d');
    }

}