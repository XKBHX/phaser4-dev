export default {

    fragmentShader: `
precision mediump float;

varying vec4 vColor;
varying vec2 vTextureCoord;
varying float vTextureId;

uniform sampler2D uTexture[%count%];

void main (void)
{
    vec4 color;

    %forloop%

    gl_FragColor = color * vColor;
}`,
    
    vertexShader: `
attribute vec4 aColor;
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
attribute float aTextureId;

uniform mat4 uProjectionMatrix;

varying vec4 vColor;
varying vec2 vTextureCoord;
varying float vTextureId;

void main (void)
{
    vColor = aColor;
    vTextureCoord = aTextureCoord;
    vTextureId = aTextureId;

    gl_Position = uProjectionMatrix * vec4(aVertexPosition, 0.0, 1.0);
}`

}
