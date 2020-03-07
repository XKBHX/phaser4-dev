import CheckShaderMaxIfStatements from './CheckShaderMaxIfStatements';
import MultiTextureQuadShader from './MultiTextureQuadShader';
import Texture from './Texture';
import DisplayObjectContainer from './DisplayObjectContainer';
import Sprite from './Sprite';
import { Container } from './Container';
import Camera from './Camera';
import SpriteBuffer from './SpriteBuffer';
import Scene from './Scene';

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

    width: number;
    height: number;
    resolution: number;
    
    projectionMatrix: Float32Array;
    textureIndex: number[];
    
    maxTextures: number = 0;
    activeTextures: Texture[];
    currentActiveTexture: number;
    startActiveTexture: number;
    spriteCount: number;

    dirtySprites: number = 0;
    cachedSprites: number = 0;

    clearBeforeRender: boolean = true;
    optimizeRedraw: boolean = true;
    autoResize: boolean = true;

    contextLost: boolean = false;
    elementIndexExtension: OES_element_index_uint;

    constructor (width: number, height: number, resolution: number = 1)
    {
        this.width = width;
        this.height = height;
        this.resolution = resolution;

        const canvas = document.createElement('canvas');

        canvas.addEventListener('webglcontextlost', (event) => this.onContextLost(event), false);
        canvas.addEventListener('webglcontextrestored', () => this.onContextRestored(), false);

        this.canvas = canvas;

        this.initContext();

        this.shader = new MultiTextureQuadShader(this);
    }

    initContext ()
    {
        const gl = this.canvas.getContext('webgl', this.contextOptions);

        this.gl = gl;

        this.elementIndexExtension = gl.getExtension('OES_element_index_uint');

        this.getMaxTextures();

        // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthFunc
        // gl.enable(gl.DEPTH_TEST);
        // gl.depthFunc(gl.LESS);

        if (this.shader)
        {
            this.shader.gl = gl;
        }

        this.resize(this.width, this.height, this.resolution);
    }

    resize (width: number, height: number, resolution: number = 1)
    {
        this.width = width * resolution;
        this.height = height * resolution;
        this.resolution = resolution;
    
        const canvas = this.canvas;

        canvas.width = this.width;
        canvas.height = this.height;
    
        if (this.autoResize)
        {
            canvas.style.width = this.width / resolution + 'px';
            canvas.style.height = this.height / resolution + 'px';
        }
    
        this.gl.viewport(0, 0, this.width, this.height);

        this.projectionMatrix = this.ortho(width, height, -10000, 10000);
    }

    ortho (width: number, height: number, near: number, far: number): Float32Array
    {
        const m00: number = -2 * (1 / -width);
        const m11: number = -2 * (1 / height);
        const m22: number = 2 * (1 / (near - far));

        return new Float32Array([ m00, 0, 0, 0, 0, m11, 0, 0, 0, 0, m22, 0, -1, 1, 0, 1 ]);
    }

    onContextLost (event)
    {
        event.preventDefault();

        this.contextLost = true;
    }

    onContextRestored ()
    {
        this.contextLost = false;

        this.initContext();
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
        this.activeTextures = Array(maxTextures);

        this.currentActiveTexture = 0;
        this.startActiveTexture = 0;
    }

    isSizePowerOfTwo (width: number, height: number): boolean
    {
        if (width < 1 || height < 1)
        {
            return false;
        }

        return ((width & (width - 1)) === 0) && ((height & (height - 1)) === 0);
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

    render (scene: Scene, dirtyFrame: number)
    {
        if (this.contextLost)
        {
            return;
        }

        const gl = this.gl;

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.dirtySprites = 0;
        this.cachedSprites = 0;

        if (this.optimizeRedraw && dirtyFrame === 0)
        {
            return;
        }

        this.currentActiveTexture = 0;
        this.startActiveTexture++;

        const shader = this.shader;

        //  CLS

        gl.viewport(0, 0, this.width, this.height);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        const cls = this.clearColor;

        if (this.clearBeforeRender)
        {
            gl.clearColor(cls[0], cls[1], cls[2], cls[3]);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        this.spriteCount = 0;

        shader.bind(scene.camera);

        this.renderChildren(scene.world);

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
                if (entity.hasTexture)
                {
                    let texture = (entity as Sprite).texture;

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

                    if (entity.dirty)
                    {
                        this.dirtySprites++;
                    }
                    else
                    {
                        this.cachedSprites++;
                    }

                    shader.batchSprite(entity as Sprite);
                }

                if (entity.type === 'SpriteBuffer')
                {
                    if (shader.batchSpriteBuffer(entity as SpriteBuffer))
                    {
                        //  Reset active textures
                        this.currentActiveTexture = 0;
                        this.startActiveTexture++;
                    }
                }
                else if (entity.size)
                {
                    // Render the children, if it has any
                    this.renderChildren(entity);
                }
            }
        }
    }

}
