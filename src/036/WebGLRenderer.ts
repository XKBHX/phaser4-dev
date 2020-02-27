import CheckShaderMaxIfStatements from './CheckShaderMaxIfStatements';
import { Matrix4 } from '@phaserjs/math-matrix4';
import MultiTextureQuadShader from 'MultiTextureQuadShader';
import Texture from 'Texture';
import { Ortho } from '@phaserjs/math-matrix4-funcs';
import DisplayObjectContainer from 'DisplayObjectContainer';
import Sprite from 'Sprite';
import { Container } from 'Container';
import Camera from 'Camera';

export default class WebGLRenderer
{
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;

    contextOptions: WebGLContextAttributes = {
        alpha: false,
        antialias: false,
        premultipliedAlpha: false,
        stencil: false,
        preserveDrawingBuffer: false
    };

    clearColor = [ 0, 0, 0, 1 ];

    shader: MultiTextureQuadShader;

    resolution = { x: 0, y: 0 };
    maxTextures: number = 0;

    camera: Camera;

    projectionMatrix: Matrix4;
    textureIndex: number[];

    activeTextures: Texture[];
    currentActiveTexture: number;
    startActiveTexture: number;

    clearBeforeRender: boolean = true;

    constructor (width: number, height: number)
    {
        this.resolution.x = width;
        this.resolution.y = height;

        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;

        this.gl = this.canvas.getContext('webgl', this.contextOptions);

        this.getMaxTextures();

        this.shader = new MultiTextureQuadShader(this);

        this.activeTextures = Array(this.maxTextures);

        this.projectionMatrix = Ortho(0, width, height, 0, -1000, 1000);
        this.camera = new Camera(this);

        this.startActiveTexture = 0;
    }

    setBackgroundColor (color: number)
    {
        const clearColor = this.clearColor;

        const r: number = color >> 16 & 0xFF;
        const g: number = color >> 8 & 0xFF;
        const b: number = color & 0xFF;
        const a: number = (color > 16777215) ? color >>> 24 : 255;
    
        clearColor[0] = r / 255;
        clearColor[1] = g / 255;
        clearColor[2] = b / 255;
        clearColor[3] = a / 255;

        return this;
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

    isSizePowerOfTwo (width: number, height: number): boolean
    {
        return (width > 0 && (width & (width - 1)) === 0 && height > 0 && (height & (height - 1)) === 0);
    }

    createGLTexture (source: TexImageSource): WebGLTexture
    {
        const gl = this.gl;

        const glTexture: WebGLTexture = gl.createTexture();

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glTexture);

        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        const pot = this.isSizePowerOfTwo(source.width, source.height);

        const wrap = (pot) ? gl.REPEAT : gl.CLAMP_TO_EDGE;

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);

        if (pot)
        {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        return glTexture;
    }

    render (world: DisplayObjectContainer)
    {
        this.currentActiveTexture = 0;
        this.startActiveTexture++;

        const shader = this.shader;

        //  CLS

        const gl = this.gl;
        const cls = this.clearColor;

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.viewport(0, 0, this.resolution.x, this.resolution.y);

        if (this.clearBeforeRender)
        {
            gl.clearColor(cls[0], cls[1], cls[2], cls[3]);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        shader.bind();

        world.updateTransform();

        this.renderChildren(world);

        shader.flush();
    }

    renderChildren (container: Container)
    {
        const gl = this.gl;
        const shader = this.shader;

        const maxTextures = this.maxTextures;
        const activeTextures = this.activeTextures;
        const startActiveTexture = this.startActiveTexture;

        let currentActiveTexture = this.currentActiveTexture;

        const children = container.children;

        for (let i: number = 0; i < children.length; i++)
        {
            let entity = children[i];

            if (entity.willRender())
            {
                //  Entity has a texture ...
                if (entity.texture)
                {
                    let texture = entity.texture;

                    if (texture.glIndexCounter < startActiveTexture)
                    {
                        texture.glIndexCounter = startActiveTexture;
        
                        if (currentActiveTexture < maxTextures)
                        {
                            //  Make this texture active
                            activeTextures[currentActiveTexture] = texture;
        
                            texture.glIndex = currentActiveTexture;
        
                            gl.activeTexture(gl.TEXTURE0 + currentActiveTexture);
                            gl.bindTexture(gl.TEXTURE_2D, texture.glTexture);
        
                            currentActiveTexture++;

                            this.currentActiveTexture = currentActiveTexture;
                        }
                        else
                        {
                            //  We've run out, flush + recycle the oldest one
                            //  TODO
                        }
                    }

                    shader.batchSprite(entity as Sprite);
                }

                //  Render the children, if it has any
                if (entity.size)
                {
                    this.renderChildren(entity);
                }
            }
        }
    }

}
