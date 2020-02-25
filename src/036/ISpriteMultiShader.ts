export default interface ISpriteMultiShader {
    batchSize?: number;
    dataSize?: number;
    indexSize?: number;
    vertexElementSize?: number;
    quadIndexSize?: number;
    fragmentShader?: string;
    vertexShader?: string;
}
