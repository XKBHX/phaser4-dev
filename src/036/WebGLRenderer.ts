import CheckShaderMaxIfStatements from './CheckShaderMaxIfStatements';
import { Matrix4 } from '@phaserjs/math-matrix4';
import MultiTextureQuadShader from 'MultiTextureQuadShader';
import Texture from 'Texture';
import Sprite from 'Sprite';
import { Ortho } from '@phaserjs/math-matrix4-funcs';

export default class WebGLRenderer
{
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;

    contextOptions: WebGLContextAttributes = {
        alpha: false,
        antialias: true,
        premultipliedAlpha: false,
        stencil: false,
        preserveDrawingBuffer: false
    };

    shader: MultiTextureQuadShader;

    resolution = { x: 0, y: 0 };
    maxTextures: number = 0;

    projectionMatrix: Matrix4;
    cameraMatrix: Matrix4;
    textureIndex: number[];

    textures: Map<string, Texture>;

    activeTextures: Texture[];
    currentActiveTexture: number;

    constructor (width: number, height: number, parent: HTMLElement | string = document.body)
    {
        this.resolution.x = width;
        this.resolution.y = height;

        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;

        this.gl = this.canvas.getContext('webgl', this.contextOptions);

        if (typeof parent === 'string')
        {
            parent = document.getElementById(parent);
        }

        parent.appendChild(this.canvas);

        this.getMaxTextures();

        this.shader = new MultiTextureQuadShader(this);

        this.textures = new Map();
        this.activeTextures = Array(this.maxTextures);

        this.projectionMatrix = Ortho(0, width, height, 0, -1000, 1000);
        this.cameraMatrix = new Matrix4();
    }

    private getMaxTextures ()
    {
        const gl = this.gl;

        let maxTextures: number = CheckShaderMaxIfStatements(gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS), gl);

        //  Create temp textures to stop WebGL errors on mac os
        for (let i: number = 0; i < maxTextures; i++)
        {
            let tempTexture = gl.createTexture();
    
            gl.activeTexture(gl.TEXTURE0 + i);
    
            gl.bindTexture(gl.TEXTURE_2D, tempTexture);
    
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([ 0, 0, 255, 255 ]));
        }

        this.maxTextures = maxTextures;
        this.textureIndex = Array.from(Array(maxTextures).keys());
    }

    addTexture (texture: Texture)
    {
        this.textures.set(texture.key, texture);

        return this;
    }

    createGLTexture (source: TexImageSource): WebGLTexture
    {
        const gl = this.gl;

        const glTexture: WebGLTexture = gl.createTexture();

        gl.activeTexture(gl.TEXTURE0);

        gl.bindTexture(gl.TEXTURE_2D, glTexture);

        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        //  POT only
        // gl.generateMipmap(gl.TEXTURE_2D);

        return glTexture;
    }

    render (sprites: Sprite[])
    {
        //  Reset textures

        this.textures.forEach((texture) => {
            texture.glIndex = -1;
        });

        let currentActiveTexture = 0;

        const shader = this.shader;
        const maxTextures = this.maxTextures;
        const activeTextures = this.activeTextures;

        //  CLS

        const gl = this.gl;

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.viewport(0, 0, this.resolution.x, this.resolution.y);

        shader.bind();

        for (let i: number = 0; i < sprites.length; i++)
        {
            let sprite = sprites[i];
            let texture = sprite.frame.texture;

            if (texture.glIndex === -1)
            {
                if (currentActiveTexture < maxTextures)
                {
                    //  Make this texture active
                    activeTextures[currentActiveTexture] = texture;

                    texture.glIndex = currentActiveTexture;

                    gl.activeTexture(gl.TEXTURE0 + currentActiveTexture);
                    gl.bindTexture(gl.TEXTURE_2D, texture.glTexture);

                    currentActiveTexture++;
                }
                else
                {
                    //  We've run out, flush + recycle the oldest one
                    //  TODO
                }
            }

            sprite.update();

            if (sprite.visible)
            {
                shader.batchSprite(sprite);
            }
        }

        shader.flush();
    }

}
