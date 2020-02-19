export default {

    fragmentShader: `
    precision mediump float;

    varying vec4 vColor;
    varying vec2 vTextureCoord;

    uniform sampler2D uTexture;
    
    void main (void)
    {
        gl_FragColor = texture2D(uTexture, vTextureCoord) * vColor;
    }
    `,
    
    vertexShader: `
    attribute vec4 aColor;
    attribute vec2 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uProjectionMatrix;

    varying vec4 vColor;
    varying vec2 vTextureCoord;
    
    void main (void)
    {
        vColor = aColor;
        vTextureCoord = aTextureCoord;
    
        gl_Position = uProjectionMatrix * vec4(aVertexPosition, 0.0, 1.0);
    }
    `

}
