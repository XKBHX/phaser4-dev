//  Base Texture

export default class Texture
{
    key: string;

    width: number;
    height: number;

    image: HTMLImageElement;

    gl: WebGLRenderingContext;
    glTexture: WebGLTexture;
    glIndex: number = 0;

    _onLoadCallback: Function;

    constructor (key: string, gl: WebGLRenderingContext, glIndex: number = 0)
    {
        this.key = key;

        this.gl = gl;
        this.glIndex = glIndex;
    }

    onLoad ()
    {
        // console.log(this.key, 'loaded');

        const gl = this.gl;

        this.glTexture = this.gl.createTexture();

        gl.activeTexture(gl.TEXTURE0 + this.glIndex);

        gl.bindTexture(gl.TEXTURE_2D, this.glTexture);

        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        this.width = this.image.width;
        this.height = this.image.height;

        //  POT only
        // gl.generateMipmap(gl.TEXTURE_2D);

        this.image.onload = null;

        if (this._onLoadCallback)
        {
            this._onLoadCallback(this);
        }
    }

    load (url: string, callback?: Function)
    {
        // console.log(this.key, 'loading');

        this.image = new Image();

        this.image.onload = () => this.onLoad();

        this.image.src = url;

        if (callback)
        {
            this._onLoadCallback = callback;
        }

        // Image is immediately-available / cached
        if (this.image.complete && this.image.width && this.image.height)
        {
            this.onLoad();
        }
    }
}