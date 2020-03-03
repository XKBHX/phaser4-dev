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
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uProjectionMatrix;

varying vec2 vTextureCoord;

void main (void)
{
    vTextureCoord = aTextureCoord;

    gl_Position = uProjectionMatrix * vec4(aVertexPosition, 1.0);
}`

}
