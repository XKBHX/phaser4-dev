import Texture from './Texture';
import Frame from './Frame';

export default function (texture: Texture, data: any)
{
    let frames;

    if (Array.isArray(data.textures))
    {
        //  TP3 Format
        frames = data.textures[0].frames;
    }
    else if (Array.isArray(data.frames))
    {
        //  TP2 Format Array
        frames = data.frames;
    }
    else if (data.hasOwnProperty('frames'))
    {
        //  TP2 Format Hash
        frames = Object.values(data.frames);
    }
    else
    {
        console.warn('Invalid Texture Atlas JSON');
    }

    if (frames)
    {
        let newFrame: Frame;

        for (let i = 0; i < frames.length; i++)
        {
            let src = frames[i];

            //  The frame values are the exact coordinates to cut the frame out of the atlas from
            newFrame = texture.add(src.filename, src.frame.x, src.frame.y, src.frame.w, src.frame.h)

            //  These are the original (non-trimmed) sprite values
            if (src.trimmed)
            {
                newFrame.setTrim(
                    src.sourceSize.w,
                    src.sourceSize.h,
                    src.spriteSourceSize.x,
                    src.spriteSourceSize.y,
                    src.spriteSourceSize.w,
                    src.spriteSourceSize.h
                );
            }
            else
            {
                newFrame.setSourceSize(src.sourceSize.w, src.sourceSize.h);
            }

            if (src.rotated)
            {
                // newFrame.rotated = true;
                // newFrame.updateUVsInverted();
            }

            if (src.anchor)
            {
                newFrame.setPivot(src.anchor.x, src.anchor.y);
            }
        }
    }
}
