import WebGLRenderer from 'WebGLRenderer';
import Texture from 'Texture';
import Sprite from 'Sprite';
import { gsap } from '../../node_modules/gsap/index';

export default function ()
{
    let renderer = new WebGLRenderer(800, 600, 'gameParent');

    function loadTextures (urls: string[])
    {
        let texturesLeft = urls.length;

        const onLoadCallback = () => {

            texturesLeft--;

            if (texturesLeft === 0)
            {
                create();
            }

        }

        urls.forEach((url) => {

            let texture = new Texture(url, renderer);

            texture.load('../assets/' + url, onLoadCallback);

        });
    }

    loadTextures([
        'logo.png'
    ]);

    const sprites: Sprite[] = [];

    let paused: boolean = false;

    function create ()
    {
        document.getElementById('toggle').addEventListener('click', () => {
            paused = (paused) ? false: true;
        });

        const texture = renderer.textures.get('logo.png');
        const frame = texture.get();

        const sprite1 = new Sprite(400, 300, frame).setOrigin(0.5);

        sprites.push(sprite1);

        gsap.to(sprite1, { duration: 4, rotation: Math.PI * 2, ease: 'linear', repeat: -1 });

        step();
    }

    function step ()
    {
        if (paused)
        {
            requestAnimationFrame(step);

            return;
        }

        renderer.render(sprites);

        requestAnimationFrame(step);
    }
}
