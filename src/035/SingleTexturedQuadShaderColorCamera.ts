export default {

    fragmentShader: `
precision mediump float;

varying vec2 vTextureCoord;

uniform sampler2D uTexture;

void main (void)
{
    gl_FragColor = texture2D(uTexture, vTextureCoord);
}`,
    
    vertexShader: `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uProjectionMatrix;
uniform mat4 uCameraMatrix;

varying vec2 vTextureCoord;

void main (void)
{
    vTextureCoord = aTextureCoord;

    gl_Position = uProjectionMatrix * uCameraMatrix * vec4(aVertexPosition, 0.0, 1.0);
}`

}
