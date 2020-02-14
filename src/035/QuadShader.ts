export default {

    fragmentShader: `
    precision mediump float;

    varying vec4 vColor;
    
    void main (void)
    {
        gl_FragColor = vec4(vColor.r, vColor.g, vColor.b, vColor.a);
    }
    `,
    
    vertexShader: `
    attribute vec4 aColor;
    attribute vec2 aVertexPosition;

    uniform mat4 uProjectionMatrix;

    varying vec4 vColor;
    
    void main (void)
    {
        vColor = aColor;
    
        gl_Position = uProjectionMatrix * vec4(aVertexPosition, 0.0, 1.0);
    }
    `

}
