import IFrameConfig from 'IFrameConfig';
import Texture from 'Texture';

export default function (texture: Texture, x: number, y: number, width: number, height: number, frameConfig: IFrameConfig)
{
    let {
        frameWidth = null,
        frameHeight = null,
        startFrame = 0,
        endFrame = -1,
        margin = 0,
        spacing = 0
    } = frameConfig;

    if (!frameHeight)
    {
        frameHeight = frameWidth;
    }

    //  If missing we can't proceed
    if (frameWidth === null)
    {
        throw new Error('TextureManager.SpriteSheet: Invalid frameWidth given.');
    }

    const row: number = Math.floor((width - margin + spacing) / (frameWidth + spacing));
    const column: number = Math.floor((height - margin + spacing) / (frameHeight + spacing));
    let total: number = row * column;

    if (total === 0)
    {
        console.warn('SpriteSheet frame dimensions will result in zero frames.');
    }

    if (startFrame > total || startFrame < -total)
    {
        startFrame = 0;
    }

    if (startFrame < 0)
    {
        //  Allow negative skipframes.
        startFrame = total + startFrame;
    }

    if (endFrame !== -1)
    {
        total = startFrame + (endFrame + 1);
    }

    let fx: number = margin;
    let fy: number = margin;
    let ax: number = 0;
    let ay: number = 0;

    for (let i: number = 0; i < total; i++)
    {
        ax = 0;
        ay = 0;

        let w: number = fx + frameWidth;
        let h: number = fy + frameHeight;

        if (w > width)
        {
            ax = w - width;
        }

        if (h > height)
        {
            ay = h - height;
        }

        texture.add(i, x + fx, y + fy, frameWidth - ax, frameHeight - ay);

        fx += frameWidth + spacing;

        if (fx + frameWidth > width)
        {
            fx = margin;
            fy += frameHeight + spacing;
        }
    }
}
