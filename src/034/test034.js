function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function enableBlend(gl) {
  gl.enable(gl.BLEND);
}
function setBlendFunc(gl, sfactor, dfactor, equation) {
  gl.blendFunc(sfactor, dfactor);

  if (equation) {
    gl.blendEquation(equation);
  }
}
function setBlendModeNormal(gl) {
  setBlendFunc(gl, gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.FUNC_ADD);
}

class DrawCall {
  constructor(gl, appState, program) {
    var vertexArray = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    this.gl = gl;
    this.appState = appState;
    this.currentProgram = program;
    this.drawPrimitive = gl.TRIANGLES;
    this.currentVertexArray = vertexArray;
    this.appState = appState;
    this.uniformIndices = {};
    this.uniformNames = new Array(appState.maxUniforms);
    this.uniformValues = new Array(appState.maxUniforms);
    this.uniformCount = 0;
    this.uniformBuffers = new Array(appState.maxUniformBuffers);
    this.uniformBlockNames = new Array(appState.maxUniformBuffers);
    this.uniformBlockCount = 0;
    this.textures = new Array(appState.maxTextureUnits);
    this.textureCount = 0;
    this.offsets = new Int32Array(1);
    this.numElements = new Int32Array(1);
    this.numInstances = new Int32Array(1);

    if (vertexArray) {
      this.numElements[0] = vertexArray.numElements;
      this.numInstances[0] = vertexArray.numInstances;
    }

    this.numDraws = 1;
  }

  setPrimitive(primitive) {
    this.drawPrimitive = primitive;
    return this;
  }

  uniform(name, value) {
    var index = this.uniformIndices[name];

    if (index === undefined) {
      index = this.uniformCount++;
      this.uniformIndices[name] = index;
      this.uniformNames[index] = name;
    }

    this.uniformValues[index] = value;
    return this;
  }

  uniformBlock(name, buffer) {
    var base = this.currentProgram.uniformBlocks[name];
    this.uniformBuffers[base] = buffer;
    return this;
  }

  texture(name, texture) {
    var unit = this.currentProgram.samplers[name];
    this.textures[unit] = texture;
    return this;
  }

  drawRanges() {
    this.numDraws = arguments.length;

    if (this.offsets.length < this.numDraws) {
      this.offsets = new Int32Array(this.numDraws);
    }

    if (this.numElements.length < this.numDraws) {
      this.numElements = new Int32Array(this.numDraws);
    }

    if (this.numInstances.length < this.numDraws) {
      this.numInstances = new Int32Array(this.numDraws);
    }

    for (var i = 0; i < this.numDraws; ++i) {
      var count = i < 0 || arguments.length <= i ? undefined : arguments[i];
      this.offsets[i] = count[0];
      this.numElements[i] = count[1];
      this.numInstances[i] = count[2] || 1;
    }

    return this;
  }

  draw() {
    var {
      gl,
      appState,
      currentProgram,
      uniformNames,
      uniformValues,
      uniformBuffers
    } = this;
    var {
      textures,
      drawPrimitive,
      numElements,
      numInstances,
      currentVertexArray,
      offsets,
      numDraws
    } = this;
    var {
      uniformBlockCount,
      samplerCount
    } = currentProgram;
    var indexed = false;
    this.currentProgram.bind();

    if (currentVertexArray) {
      currentVertexArray.bind();
      indexed = currentVertexArray.indexed;
    }

    for (var uIndex = 0; uIndex < this.uniformCount; uIndex++) {
      this.currentProgram.uniform(uniformNames[uIndex], uniformValues[uIndex]);
    }

    for (var base = 0; base < uniformBlockCount; base++) {
      uniformBuffers[base].bind(base);
    }

    for (var tIndex = 0; tIndex < samplerCount; tIndex++) {
      textures[tIndex].bind(tIndex);
    }

    if (appState.multiDrawInstanced) {
      var ext = appState.extensions.multiDrawInstanced;

      if (indexed) {
        ext.multiDrawElementsInstancedWEBGL(drawPrimitive, numElements, 0, currentVertexArray.indexType, offsets, 0, numInstances, 0, numDraws);
      } else {
        ext.multiDrawArraysInstancedWEBGL(drawPrimitive, offsets, 0, numElements, 0, numInstances, 0, numDraws);
      }
    } else if (indexed) {
      for (var i = 0; i < numDraws; i++) {
        gl.drawElementsInstanced(drawPrimitive, numElements[i], currentVertexArray.indexType, offsets[i], numInstances[i]);
      }
    } else {
      for (var _i = 0; _i < numDraws; _i++) {
        gl.drawArraysInstanced(drawPrimitive, offsets[_i], numElements[_i], numInstances[_i]);
      }
    }

    return this;
  }

}

function CreateDrawCall(renderer, program, vertexArray) {
  return new DrawCall(renderer.gl, renderer.state, program, vertexArray);
}

class Texture {
  constructor(gl, appState, binding, image) {
    var width = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
    var height = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
    var depth = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;
    var is3D = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : false;
    var options = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : {};
    this.gl = gl;
    this.appState = appState;
    this.binding = binding;
    this.texture = null;

    if (image && image.width) {
      width = image.width;
    }

    if (image && image.height) {
      height = image.height;
    }

    this.width = width;
    this.height = height;
    this.depth = depth;
    this.is3D = is3D;
    this.compressed = options.compressed ? true : false;

    if (this.compressed) {
      this.internalFormat = options.internalFormat;
      this.format = this.internalFormat;
      this.type = gl.UNSIGNED_BYTE;
    } else {
      if (options.internalFormat) {
        this.internalFormat = options.internalFormat;
        this.format = options.format;
        this.type = options.type;
      } else {
        this.internalFormat = gl.RGBA8;
        this.format = gl.RGBA;
        this.type = gl.UNSIGNED_BYTE;
      }
    }

    this.currentUnit = -1;
    var {
      minFilter = image ? gl.LINEAR_MIPMAP_NEAREST : gl.NEAREST,
      magFilter = image ? gl.LINEAR : gl.NEAREST,
      wrapS = gl.REPEAT,
      wrapT = gl.REPEAT,
      wrapR = gl.REPEAT,
      compareMode = gl.NONE,
      compareFunc = gl.LEQUAL,
      minLOD = null,
      maxLOD = null,
      baseLevel = null,
      maxLevel = null,
      maxAnisotropy = 1,
      flipY = false,
      premultiplyAlpha = true
    } = options;
    this.minFilter = minFilter;
    this.magFilter = magFilter;
    this.wrapS = wrapS;
    this.wrapT = wrapT;
    this.wrapR = wrapR;
    this.compareMode = compareMode;
    this.compareFunc = compareFunc;
    this.minLOD = minLOD;
    this.maxLOD = maxLOD;
    this.baseLevel = baseLevel;
    this.maxLevel = maxLevel;
    this.maxAnisotropy = Math.min(maxAnisotropy, appState.maxTextureAnisotropy);
    this.flipY = flipY;
    this.premultiplyAlpha = premultiplyAlpha;
    this.mipmaps = minFilter === gl.LINEAR_MIPMAP_NEAREST || minFilter === gl.LINEAR_MIPMAP_LINEAR;
    this.restore(image);
  }

  restore(image) {
    this.texture = null;
    this.resize(this.width, this.height, this.depth);

    if (image) {
      this.data(image);
    }

    return this;
  }

  resize(width, height) {
    var depth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var {
      gl,
      binding,
      appState
    } = this;
    var texture = this.texture;

    if (texture && width === this.width && height === this.height && depth === this.depth) {
      return this;
    }

    if (texture) {
      gl.deleteTexture(texture);
    }

    if (this.currentUnit !== -1) {
      this.appState.textures[this.currentUnit] = null;
    }

    texture = gl.createTexture();
    this.texture = texture;
    this.bind(Math.max(this.currentUnit, 0));
    this.width = width;
    this.height = height;
    this.depth = depth;
    var {
      minFilter,
      magFilter,
      wrapS,
      wrapT,
      wrapR,
      compareFunc,
      compareMode,
      flipY,
      premultiplyAlpha
    } = this;
    gl.texParameteri(binding, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(binding, gl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(binding, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(binding, gl.TEXTURE_WRAP_T, wrapT);
    gl.texParameteri(binding, gl.TEXTURE_WRAP_R, wrapR);
    gl.texParameteri(binding, gl.TEXTURE_COMPARE_FUNC, compareFunc);
    gl.texParameteri(binding, gl.TEXTURE_COMPARE_MODE, compareMode);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiplyAlpha);
    var {
      minLOD,
      maxLOD,
      baseLevel,
      maxLevel,
      maxAnisotropy,
      is3D,
      mipmaps,
      internalFormat
    } = this;

    if (minLOD !== null) {
      gl.texParameterf(binding, gl.TEXTURE_MIN_LOD, minLOD);
    }

    if (maxLOD !== null) {
      gl.texParameterf(binding, gl.TEXTURE_MAX_LOD, maxLOD);
    }

    if (baseLevel !== null) {
      gl.texParameteri(binding, gl.TEXTURE_BASE_LEVEL, baseLevel);
    }

    if (maxLevel !== null) {
      gl.texParameteri(binding, gl.TEXTURE_MAX_LEVEL, maxLevel);
    }

    if (maxAnisotropy > 1) {
      gl.texParameteri(binding, appState.textureAnisotropy.TEXTURE_MAX_ANISOTROPY_EXT, maxAnisotropy);
    }

    var levels = 1;

    if (is3D) {
      if (mipmaps) {
        levels = Math.floor(Math.log2(Math.max(Math.max(width, height), depth))) + 1;
      }

      gl.texStorage3D(binding, levels, internalFormat, width, height, depth);
    } else {
      if (mipmaps) {
        levels = Math.floor(Math.log2(Math.max(width, height))) + 1;
      }

      gl.texStorage2D(binding, levels, internalFormat, width, height);
    }

    return this;
  }

  data(data) {
    var {
      gl,
      binding,
      format,
      type,
      is3D,
      mipmaps,
      currentUnit,
      compressed
    } = this;
    var {
      width,
      height,
      depth
    } = this;
    var source = Array.isArray(data) ? data : [data];
    var numLevels = mipmaps ? source.length : 1;
    var generateMipmaps = mipmaps && source.length === 1;
    var i;
    this.bind(Math.max(currentUnit, 0));

    if (compressed) {
      if (is3D) {
        for (i = 0; i < numLevels; i++) {
          gl.compressedTexSubImage3D(binding, i, 0, 0, 0, width, height, depth, format, source[i]);
          width = Math.max(width >> 1, 1);
          height = Math.max(height >> 1, 1);
          depth = Math.max(depth >> 1, 1);
        }
      } else {
        for (i = 0; i < numLevels; i++) {
          gl.compressedTexSubImage2D(binding, i, 0, 0, width, height, format, source[i]);
          width = Math.max(width >> 1, 1);
          height = Math.max(height >> 1, 1);
        }
      }
    } else if (is3D) {
      for (i = 0; i < numLevels; i++) {
        gl.texSubImage3D(binding, i, 0, 0, 0, width, height, depth, format, type, source[i]);
        width = Math.max(width >> 1, 1);
        height = Math.max(height >> 1, 1);
        depth = Math.max(depth >> 1, 1);
      }
    } else {
      for (i = 0; i < numLevels; i++) {
        gl.texSubImage2D(binding, i, 0, 0, width, height, format, type, source[i]);
        width = Math.max(width >> 1, 1);
        height = Math.max(height >> 1, 1);
      }
    }

    if (generateMipmaps) {
      gl.generateMipmap(binding);
    }

    return this;
  }

  delete() {
    var {
      gl,
      appState
    } = this;

    if (this.texture) {
      gl.deleteTexture(this.texture);
      this.texture = null;

      if (this.currentUnit !== -1 && appState.textures[this.currentUnit] === this) {
        appState.textures[this.currentUnit] = null;
        this.currentUnit = -1;
      }
    }

    return this;
  }

  bind(unit) {
    var {
      gl,
      appState
    } = this;
    var currentTexture = appState.textures[unit];

    if (currentTexture !== this) {
      if (currentTexture) {
        currentTexture.currentUnit = -1;
      }

      if (this.currentUnit !== -1) {
        appState.textures[this.currentUnit] = null;
      }

      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(this.binding, this.texture);
      appState.textures[unit] = this;
      this.currentUnit = unit;
    }

    return this;
  }

}

var TYPE_SIZE = {
  0x1400: 1,
  0x1401: 1,
  0x1402: 2,
  0x1403: 2,
  0x1404: 4,
  0x1405: 4,
  0x1406: 4
};
function GetTypeSize(type) {
  return TYPE_SIZE[type];
}

class VertexBuffer {
  constructor(gl, appState, type, itemSize, data) {
    var usage = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : gl.STATIC_DRAW;
    var indexArray = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;
    this.gl = gl;
    this.appState = appState;
    this.buffer = null;
    var numColumns = 1;

    if (type === gl.FLOAT_MAT4 || type === gl.FLOAT_MAT4x2 || type === gl.FLOAT_MAT4x3) {
      numColumns = 4;
    } else if (type === gl.FLOAT_MAT3 || type === gl.FLOAT_MAT3x2 || type === gl.FLOAT_MAT3x4) {
      numColumns = 3;
    } else if (type === gl.FLOAT_MAT2 || type === gl.FLOAT_MAT2x3 || type === gl.FLOAT_MAT2x4) {
      numColumns = 2;
    }

    if (type === gl.FLOAT_MAT4 || type === gl.FLOAT_MAT3x4 || type === gl.FLOAT_MAT2x4) {
      itemSize = 4;
      type = gl.FLOAT;
    } else if (type === gl.FLOAT_MAT3 || type === gl.FLOAT_MAT4x3 || type === gl.FLOAT_MAT2x3) {
      itemSize = 3;
      type = gl.FLOAT;
    } else if (type === gl.FLOAT_MAT2 || type === gl.FLOAT_MAT3x2 || type === gl.FLOAT_MAT4x2) {
      itemSize = 2;
      type = gl.FLOAT;
    }

    var dataLength;
    var byteLength;

    if (typeof data === 'number') {
      dataLength = data;

      if (type) {
        data *= GetTypeSize(type);
      }

      byteLength = data;
    } else {
      byteLength = data.byteLength;
      dataLength = data['length'];
    }

    this.type = type;
    this.itemSize = itemSize;
    this.numItems = type ? dataLength / (itemSize * numColumns) : byteLength / itemSize;
    this.numColumns = numColumns;
    this.byteLength = byteLength;
    this.usage = usage;
    this.indexArray = Boolean(indexArray);
    this.integer = type === gl.BYTE || type === gl.UNSIGNED_BYTE || type === gl.SHORT || type === gl.UNSIGNED_SHORT || type === gl.INT || type === gl.UNSIGNED_INT;
    this.binding = this.indexArray ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
    this.restore(data);
  }

  restore(data) {
    var {
      gl,
      appState,
      binding,
      byteLength,
      usage
    } = this;

    if (appState.vertexArray) {
      gl.bindVertexArray(null);
      appState.vertexArray = null;
    }

    this.buffer = gl.createBuffer();
    gl.bindBuffer(binding, this.buffer);

    if (data === undefined) {
      gl.bufferData(binding, byteLength, usage);
    } else {
      gl.bufferData(binding, data, usage);
    }

    gl.bindBuffer(binding, null);
    return this;
  }

  data(data) {
    var byteOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var {
      gl,
      appState,
      binding,
      buffer
    } = this;

    if (appState.vertexArray) {
      gl.bindVertexArray(null);
      appState.vertexArray = null;
    }

    gl.bindBuffer(binding, buffer);
    gl.bufferSubData(binding, byteOffset, data);
    gl.bindBuffer(binding, null);
    return this;
  }

  delete() {
    if (this.buffer) {
      this.gl.deleteBuffer(this.buffer);
      this.buffer = null;
    }

    return this;
  }

}

function CreateIndexBuffer(renderer, type, itemSize, data) {
  var usage = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : renderer.gl.STATIC_DRAW;
  return new VertexBuffer(renderer.gl, renderer.state, type, itemSize, data, usage, true);
}

function CreateInterleavedBuffer(renderer, bytesPerVertex, data) {
  var usage = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : renderer.gl.STATIC_DRAW;
  return new VertexBuffer(renderer.gl, renderer.state, null, bytesPerVertex, data, usage);
}

var UNIFORMS = {
  SAMPLER: [0x8B5E, 0x8DCA, 0x8DD2, 0x8B62, 0x8DC1, 0x8DCF, 0x8DD7, 0x8DC4, 0x8B60, 0x8DCC, 0x8DD4, 0x8DC5, 0x8B5F, 0x8DCB, 0x8DD3],
  VEC: [0x8B50, 0x8B53, 0x8DC6, 0x8B51, 0x8B54, 0x8DC7, 0x8B52, 0x8B55, 0x8DC8],
  BOOL: [0x8B56, 0x8B57, 0x8B58, 0x8B59],
  MAT: [0x8B5A, 0x8B5B, 0x8B5C, 0x8B65, 0x8B66, 0x8B67, 0x8B68, 0x8B69, 0x8B6A]
};

var FV = 'fv';
var SAMPLER_TYPE = ['1i', 1, Int32Array, false];
var glConstMap = {
  0x8B5E: SAMPLER_TYPE,
  0x8DC1: SAMPLER_TYPE,
  0x8B62: SAMPLER_TYPE,
  0x8DC4: SAMPLER_TYPE,
  0x8DCA: SAMPLER_TYPE,
  0x8DCF: SAMPLER_TYPE,
  0x8DD2: SAMPLER_TYPE,
  0x8DD7: SAMPLER_TYPE,
  0x8B60: SAMPLER_TYPE,
  0x8DCC: SAMPLER_TYPE,
  0x8DD4: SAMPLER_TYPE,
  0x8DC5: SAMPLER_TYPE,
  0x8B5F: SAMPLER_TYPE,
  0x8DCB: SAMPLER_TYPE,
  0x8DD3: SAMPLER_TYPE,
  0x1406: ['1f', 1, Float32Array, false, 1, 0x1406, 1],
  0x8B50: ['2f', 2, Float32Array, false, 2, 0x1406, 2],
  0x8B51: ['3f', 3, Float32Array, false, 4, 0x1406, 4],
  0x8B52: ['4f', 4, Float32Array, false, 4, 0x1406, 4],
  0x1404: ['1i', 1, Int32Array, false, 1, 0x1404, 1],
  0x8B53: ['2i', 2, Int32Array, false, 2, 0x1404, 2],
  0x8B54: ['3i', 3, Int32Array, false, 4, 0x1404, 4],
  0x8B55: ['4i', 4, Int32Array, false, 4, 0x1404, 4],
  0x1405: ['1ui', 1, Uint32Array, false, 1, 0x1405, 1],
  0x8DC6: ['2ui', 2, Uint32Array, false, 2, 0x1405, 2],
  0x8DC7: ['3ui', 3, Uint32Array, false, 4, 0x1405, 4],
  0x8DC8: ['4ui', 4, Uint32Array, false, 4, 0x1405, 4],
  0x8B5A: ['2' + FV, 4, Float32Array, true, 4, 0x1406, 8],
  0x8B5B: ['3' + FV, 9, Float32Array, true, 4, 0x1406, 12],
  0x8B5C: ['4' + FV, 16, Float32Array, true, 4, 0x1406, 16],
  0x8B65: ['2x3' + FV, 6, Float32Array, true, 4, 0x1406, 8],
  0x8B66: ['2x4' + FV, 8, Float32Array, true, 4, 0x1406, 8],
  0x8B67: ['3x2' + FV, 6, Float32Array, true, 4, 0x1406, 12],
  0x8B68: ['3x4' + FV, 12, Float32Array, true, 4, 0x1406, 12],
  0x8B69: ['4x2' + FV, 8, Float32Array, true, 4, 0x1406, 16],
  0x8B6A: ['4x3' + FV, 12, Float32Array, true, 4, 0x1406, 16],
  0x8B56: ['1iv', 1, Array, false, 1, 0x1406, 1],
  0x8B57: ['2iv', 2, Array, false, 2, 0x1406, 2],
  0x8B58: ['3iv', 3, Array, false, 4, 0x1406, 4],
  0x8B59: ['4iv', 4, Array, false, 4, 0x1406, 4]
};
function GetUniformSize(type) {
  var uniformData = glConstMap[type];

  if (uniformData) {
    return {
      size: uniformData[4],
      uboType: uniformData[5],
      stride: uniformData[6]
    };
  }

  return null;
}
function GetUniform(gl, type) {
  var uniformData = glConstMap[type];

  if (uniformData) {
    var name = 'uniform';

    if (uniformData[3]) {
      name = name.concat('Matrix');
    }

    return {
      glFunc: gl[name + uniformData[0]],
      size: uniformData[1],
      cacheClass: size => new uniformData[2](size)
    };
  }

  return null;
}

class MatrixUniform {
  constructor(gl, handle, info, count) {
    this.gl = gl;
    this.handle = handle;
    this.count = count;
    var uniformData = GetUniform(gl, info.type);
    this.glFunc = uniformData.glFunc.bind(gl);
    this.cache = uniformData.cacheClass(uniformData.size * count);
  }

  set(value) {
    for (var i = 0; i < value.length; i++) {
      if (this.cache[i] !== value[i]) {
        this.glFunc(this.handle, false, value);
        this.cache.set(value);
        return;
      }
    }
  }

}

class MultiBoolUniform {
  constructor(gl, handle, info, count) {
    this.gl = gl;
    this.handle = handle;
    this.count = count;
    var uniformData = GetUniform(gl, info.type);
    this.glFunc = uniformData.glFunc;
    this.cache = new Array(uniformData.size * count).fill(false);
  }

  set(value) {
    for (var i = 0; i < value.length; i++) {
      if (this.cache[i] !== value[i]) {
        this.glFunc(this.handle, value);

        for (var j = i; j < value.length; j++) {
          this.cache[j] = value[j];
        }

        return;
      }
    }
  }

}

class MultiNumericUniform {
  constructor(gl, handle, info, count) {
    this.gl = gl;
    this.handle = handle;
    this.count = count;
    var uniformData = GetUniform(gl, info.type);
    this.glFunc = uniformData.glFunc;
    this.cache = uniformData.cacheClass(uniformData.size * count);
  }

  set(value) {
    for (var i = 0; i < value.length; i++) {
      if (this.cache[i] !== value[i]) {
        this.glFunc(this.handle, value);
        this.cache.set(value);
        return;
      }
    }
  }

}

class Shader {
  constructor(gl, appState, type, source) {
    this.gl = gl;
    this.appState = appState;
    this.type = type;
    this.source = source;
    this.restore();
  }

  restore() {
    var gl = this.gl;
    var shader = gl.createShader(this.type);
    gl.shaderSource(shader, this.source);
    gl.compileShader(shader);
    this.shader = shader;
    return this;
  }

  delete() {
    if (this.shader) {
      this.gl.deleteShader(this.shader);
      this.shader = null;
    }

    return this;
  }

  checkCompilation() {
    var gl = this.gl;
    var shader = this.shader;

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      var lines = this.source.split("\n");

      for (var i = 0; i < lines.length; ++i) {
        console.error("".concat(i + 1, ": ").concat(lines[i]));
      }
    }

    return this;
  }

}

class SingleComponentUniform {
  constructor(gl, handle, info) {
    this.gl = gl;
    this.handle = handle;
    var uniformData = GetUniform(gl, info.type);
    this.glFunc = uniformData.glFunc;
    this.cache = info.type === gl.BOOL ? false : 0;
  }

  set(value) {
    if (this.cache !== value) {
      this.glFunc(this.handle, value);
      this.cache = value;
    }
  }

}

class Program {
  constructor(gl, appState, vsSource, fsSource) {
    this.uniforms = {};
    this.uniformBlocks = {};
    this.uniformBlockCount = 0;
    this.samplers = {};
    this.samplerCount = 0;
    this.linked = false;
    this.gl = gl;
    this.appState = appState;

    if (typeof vsSource === 'string') {
      this.vertexSource = vsSource;
    } else {
      this.vertexShader = vsSource;
    }

    if (typeof fsSource === 'string') {
      this.fragmentSource = fsSource;
    } else {
      this.fragmentShader = fsSource;
    }

    this.initialize();
  }

  initialize() {
    var {
      gl,
      appState,
      vertexSource,
      fragmentSource
    } = this;

    if (appState.program === this) {
      gl.useProgram(null);
      appState.program = null;
    }

    this.linked = false;
    this.uniformBlockCount = 0;
    this.samplerCount = 0;

    if (vertexSource) {
      this.vertexShader = new Shader(gl, appState, gl.VERTEX_SHADER, vertexSource);
    }

    if (fragmentSource) {
      this.fragmentShader = new Shader(gl, appState, gl.FRAGMENT_SHADER, fragmentSource);
    }

    this.program = this.gl.createProgram();
    return this;
  }

  link() {
    var {
      gl,
      program,
      vertexShader,
      fragmentShader
    } = this;
    gl.attachShader(program, vertexShader.shader);
    gl.attachShader(program, fragmentShader.shader);
    gl.linkProgram(program);
    return this;
  }

  checkCompletion() {
    if (this.gl.getExtension('KHR_parallel_shader_compile')) {
      return this.gl.getProgramParameter(this.program, 0x91B1);
    }

    return true;
  }

  checkLinkage() {
    if (this.linked) {
      return this;
    }

    var {
      gl,
      program,
      vertexShader,
      fragmentShader,
      vertexSource,
      fragmentSource
    } = this;

    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
      this.linked = true;
      this.initVariables();
    } else {
      console.error(gl.getProgramInfoLog(program));
      vertexShader.checkCompilation();
      fragmentShader.checkCompilation();
    }

    if (vertexSource) {
      vertexShader.delete();
      this.vertexShader = null;
    }

    if (fragmentSource) {
      fragmentShader.delete();
      this.fragmentShader = null;
    }

    return this;
  }

  initVariables() {
    this.bind();
    var gl = this.gl;
    var program = this.program;
    var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    var textureUnit;

    for (var i = 0; i < numUniforms; i++) {
      var uniformInfo = gl.getActiveUniform(program, i);
      var uniformHandle = gl.getUniformLocation(program, uniformInfo.name);
      var type = uniformInfo.type;
      var numElements = uniformInfo.size;

      if (UNIFORMS.SAMPLER.indexOf(type) !== -1) {
        textureUnit = this.samplerCount++;
        this.samplers[uniformInfo.name] = textureUnit;
        gl.uniform1i(uniformHandle, textureUnit);
      } else if (UNIFORMS.VEC.indexOf(type) !== -1) {
        this.uniforms[uniformInfo.name] = new MultiNumericUniform(gl, uniformHandle, uniformInfo, numElements);
      } else if (UNIFORMS.MAT.indexOf(type) !== -1) {
        this.uniforms[uniformInfo.name] = new MatrixUniform(gl, uniformHandle, uniformInfo, numElements);
      } else if (UNIFORMS.BOOL.indexOf(type) !== -1) {
        if (numElements > 1) {
          this.uniforms[uniformInfo.name] = new MultiBoolUniform(gl, uniformHandle, uniformInfo, numElements);
        } else {
          this.uniforms[uniformInfo.name] = new SingleComponentUniform(gl, uniformHandle, uniformInfo);
        }
      } else if (type === gl.INT || type === gl.UNSIGNED_INT || type === gl.FLOAT) {
        if (numElements > 1) {
          this.uniforms[uniformInfo.name] = new MultiNumericUniform(gl, uniformHandle, uniformInfo, numElements);
        } else {
          this.uniforms[uniformInfo.name] = new SingleComponentUniform(gl, uniformHandle, uniformInfo);
        }
      } else {
        console.error('Unknown uniform type');
      }
    }

    var numUniformBlocks = gl.getProgramParameter(program, gl.ACTIVE_UNIFORM_BLOCKS);

    for (var _i = 0; _i < numUniformBlocks; _i++) {
      var blockName = gl.getActiveUniformBlockName(program, _i);
      var blockIndex = gl.getUniformBlockIndex(program, blockName);
      var uniformBlockBase = this.uniformBlockCount++;
      gl.uniformBlockBinding(program, blockIndex, uniformBlockBase);
      this.uniformBlocks[blockName] = uniformBlockBase;
    }
  }

  uniform(name, value) {
    if (this.uniforms[name]) {
      this.uniforms[name].set(value);
    }

    return this;
  }

  bind() {
    var appState = this.appState;

    if (appState.program !== this) {
      this.gl.useProgram(this.program);
      appState.program = this;
    }

    return this;
  }

  delete() {
    if (this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;

      if (this.appState.program === this) {
        this.gl.useProgram(null);
        this.appState.program = null;
      }
    }

    return this;
  }

}

function CreateProgram(renderer, vsSource, fsSource) {
  var program = new Program(renderer.gl, renderer.state, vsSource, fsSource);
  program.link().checkLinkage();
  return program;
}

function CreateTexture2D(renderer, image, width, height) {
  var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

  if (!width && image && image.width) {
    width = image.width;
  }

  if (!height && image && image.height) {
    height = image.height;
  }

  return new Texture(renderer.gl, renderer.state, renderer.gl.TEXTURE_2D, image, width, height, 0, false, options);
}

class UniformBuffer {
  constructor(gl, appState, layout) {
    var usage = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : gl.DYNAMIC_DRAW;
    this.gl = gl;
    this.appState = appState;
    this.buffer = null;
    this.dataViews = {};
    var len = layout.length;
    var offsets = new Array(len);
    var sizes = new Array(len);
    var types = new Array(len);
    this.size = 0;
    this.usage = usage;
    this.currentBase = -1;

    for (var i = 0; i < len; i++) {
      var {
        size,
        uboType,
        stride
      } = GetUniformSize(layout[i]);

      if (size === 2) {
        this.size += this.size % 2;
      } else if (size === 4) {
        this.size += (4 - this.size % 4) % 4;
      }

      offsets[i] = this.size;
      sizes[i] = stride;
      types[i] = uboType;
      this.size += stride;
    }

    this.offsets = offsets;
    this.sizes = sizes;
    this.types = types;
    this.size += (4 - this.size % 4) % 4;
    var data = new Float32Array(this.size);
    this.dataViews[gl.FLOAT] = data;
    this.dataViews[gl.INT] = new Int32Array(data.buffer);
    this.dataViews[gl.UNSIGNED_INT] = new Uint32Array(data.buffer);
    this.data = data;
    this.dirtyStart = this.size;
    this.dirtyEnd = 0;
    this.restore();
  }

  restore() {
    var gl = this.gl;
    var appState = this.appState;
    var currentBase = this.currentBase;

    if (currentBase !== -1 && appState.uniformBuffers[currentBase] === this) {
      appState.uniformBuffers[currentBase] = null;
    }

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.buffer);
    gl.bufferData(gl.UNIFORM_BUFFER, this.size * 4, this.usage);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    return this;
  }

  set(index, value) {
    var view = this.dataViews[this.types[index]];
    var offset = this.offsets[index];
    var size = this.sizes[index];

    if (this.sizes[index] === 1) {
      view[offset] = value;
    } else {
      view.set(value, offset);
    }

    if (offset < this.dirtyStart) {
      this.dirtyStart = offset;
    }

    if (this.dirtyEnd < offset + size) {
      this.dirtyEnd = offset + size;
    }

    return this;
  }

  update() {
    var gl = this.gl;

    if (this.dirtyStart >= this.dirtyEnd) {
      return this;
    }

    var data = this.data.subarray(this.dirtyStart, this.dirtyEnd);
    var offset = this.dirtyStart * 4;
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.buffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, offset, data);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    this.dirtyStart = this.size;
    this.dirtyEnd = 0;
    return this;
  }

  delete() {
    var gl = this.gl;
    var appState = this.appState;
    var currentBase = this.currentBase;

    if (this.buffer) {
      gl.deleteBuffer(this.buffer);
      this.buffer = null;

      if (currentBase !== -1 && appState.uniformBuffers[currentBase] === this) {
        appState.uniformBuffers[currentBase] = null;
      }
    }

    return this;
  }

  bind(index) {
    var gl = this.gl;
    var appState = this.appState;
    var currentBase = this.currentBase;
    var currentBuffer = appState.uniformBuffers[index];

    if (currentBuffer !== this) {
      if (currentBuffer) {
        currentBuffer.currentBase = -1;
      }

      if (currentBase !== -1) {
        appState.uniformBuffers[currentBase] = null;
      }

      gl.bindBufferBase(gl.UNIFORM_BUFFER, index, this.buffer);
      appState.uniformBuffers[index] = this;
      this.currentBase = index;
    }

    return this;
  }

}

function CreateUniformBuffer(renderer, layout) {
  var usage = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : renderer.gl.DYNAMIC_DRAW;
  return new UniformBuffer(renderer.gl, renderer.state, layout, usage);
}

class VertexArray {
  constructor(gl, appState) {
    this.gl = gl;
    this.appState = appState;
    this.vertexArray = null;
    this.indexType = null;
    this.indexed = false;
    this.numElements = 0;
    this.numInstances = 1;
    this.offsets = 0;
    this.numDraws = 1;
  }

  restore() {
    var appState = this.appState;

    if (appState.vertexArray === this) {
      appState.vertexArray = null;
    }

    if (this.vertexArray !== null) {
      this.vertexArray = this.gl.createVertexArray();
    }

    return this;
  }

  vertexAttributeBuffer(attributeIndex, vertexBuffer, options) {
    this.attributeBuffer(attributeIndex, vertexBuffer, options, false);
    return this;
  }

  instanceAttributeBuffer(attributeIndex, vertexBuffer, options) {
    this.attributeBuffer(attributeIndex, vertexBuffer, options, true);
    return this;
  }

  indexBuffer(vertexBuffer) {
    var gl = this.gl;

    if (this.vertexArray === null) {
      this.vertexArray = gl.createVertexArray();
    }

    this.bind();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexBuffer.buffer);
    this.numElements = vertexBuffer.numItems * 3;
    this.indexType = vertexBuffer.type;
    this.indexed = true;
    return this;
  }

  delete() {
    if (this.vertexArray) {
      this.gl.deleteVertexArray(this.vertexArray);
      this.vertexArray = null;

      if (this.appState.vertexArray === this) {
        this.gl.bindVertexArray(null);
        this.appState.vertexArray = null;
      }
    }

    return this;
  }

  bind() {
    if (this.appState.vertexArray !== this) {
      this.gl.bindVertexArray(this.vertexArray);
      this.appState.vertexArray = this;
    }

    return this;
  }

  attributeBuffer(attributeIndex, vertexBuffer) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var instanced = arguments.length > 3 ? arguments[3] : undefined;
    var gl = this.gl;

    if (this.vertexArray === null) {
      this.vertexArray = gl.createVertexArray();
    }

    this.bind();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer.buffer);
    var {
      type = vertexBuffer.type,
      size = vertexBuffer.itemSize,
      offset = 0,
      normalized = false,
      integer = Boolean(vertexBuffer.integer && !normalized)
    } = options;
    var {
      stride = 0
    } = options;
    var numColumns = vertexBuffer.numColumns;

    if (stride === 0) {
      stride = numColumns * size * GetTypeSize(type);
    }

    for (var i = 0; i < numColumns; i++) {
      if (integer) {
        gl.vertexAttribIPointer(attributeIndex + i, size, type, stride, offset + i * size * GetTypeSize(type));
      } else {
        gl.vertexAttribPointer(attributeIndex + i, size, type, normalized, stride, offset + i * size * GetTypeSize(type));
      }

      if (instanced) {
        gl.vertexAttribDivisor(attributeIndex + i, 1);
      }

      gl.enableVertexAttribArray(attributeIndex + i);
    }

    if (this.numDraws === 1) {
      if (instanced) {
        this.numInstances = vertexBuffer.numItems;
      } else {
        this.numElements = this.numElements || vertexBuffer.numItems;
      }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return this;
  }

}

function CreateVertexArray(renderer) {
  return new VertexArray(renderer.gl, renderer.state);
}

class WebGL2Renderer {
  constructor(canvas, contextAttributes) {
    this.width = 0;
    this.height = 0;
    this.viewport = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };
    this.currentDrawCalls = 0;
    this.contextLostExt = null;
    this.contextRestoredHandler = null;
    var gl = canvas.getContext('webgl2', contextAttributes);
    this.gl = gl;
    this.canvas = canvas;
    this.setState();
    this.initExtensions();
    this.width = gl.drawingBufferWidth;
    this.height = gl.drawingBufferHeight;
    this.setViewport(0, 0, this.width, this.height);
    enableBlend(gl);
    setBlendModeNormal(gl);
    this.setDepthTest(false);
    this.clearBits = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT;
    this.contextLostExt = null;
    this.contextRestoredHandler = null;
    canvas.addEventListener('webglcontextlost', e => {
      e.preventDefault();
    });
    canvas.addEventListener('webglcontextrestored', () => {
      this.initExtensions();

      if (this.contextRestoredHandler) {
        this.contextRestoredHandler();
      }
    });
  }

  setState() {
    var gl = this.gl;
    var maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
    var maxUniformBuffers = gl.getParameter(gl.MAX_UNIFORM_BUFFER_BINDINGS);
    var textureAnisotropy = gl.getExtension('EXT_texture_filter_anisotropic');
    this.state = {
      program: null,
      vertexArray: null,
      transformFeedback: null,
      activeTexture: -1,
      textures: new Array(maxTextureUnits),
      uniformBuffers: new Array(maxUniformBuffers),
      freeUniformBufferBases: [],
      drawFramebuffer: null,
      readFramebuffer: null,
      extensions: {
        debugShaders: gl.getExtension('WEBGL_debug_shaders'),
        multiDrawInstanced: gl.getExtension('WEBGL_multi_draw_instanced')
      },
      maxTextureUnits,
      maxUniformBuffers,
      maxUniforms: Math.min(gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS), gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)),
      textureAnisotropy,
      maxTextureAnisotropy: textureAnisotropy ? gl.getParameter(textureAnisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1,
      samples: gl.getParameter(gl.SAMPLES),
      parallelShaderCompile: Boolean(gl.getExtension('KHR_parallel_shader_compile')),
      multiDrawInstanced: Boolean(gl.getExtension('WEBGL_multi_draw_instanced'))
    };
    return this;
  }

  loseContext() {
    if (this.contextLostExt) {
      this.contextLostExt.loseContext();
    }

    return this;
  }

  restoreContext() {
    if (this.contextLostExt) {
      this.contextLostExt.restoreContext();
    }

    return this;
  }

  onContextRestored(callback) {
    this.contextRestoredHandler = callback;
    return this;
  }

  initExtensions() {
    var gl = this.gl;
    var compressed = 'WEBGL_compressed_texture_';
    var timer = 'EXT_disjoint_timer_query';
    var extensions = ['OES_texture_float_linear', 'EXT_color_buffer_float', 'EXT_texture_filter_anisotropic', compressed + 's3tc', compressed + 's3tc_srgb', compressed + 'etc', compressed + 'astc', compressed + 'pvrtc', timer, timer + '_webgl2', 'KHR_parallel_shader_compile'];
    extensions.forEach(ext => {
      gl.getExtension(ext);
    });
    this.contextLostExt = gl.getExtension('WEBGL_lose_context');
  }

  setViewport(x, y, width, height) {
    var viewport = this.viewport;

    if (viewport.width !== width || viewport.height !== height || viewport.x !== x || viewport.y !== y) {
      viewport.x = x;
      viewport.y = y;
      viewport.width = width;
      viewport.height = height;
      this.gl.viewport(x, y, width, height);
    }

    return this;
  }

  setDefaultViewport() {
    this.setViewport(0, 0, this.width, this.height);
    return this;
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = this.gl.drawingBufferWidth;
    this.height = this.gl.drawingBufferHeight;
    this.setViewport(0, 0, this.width, this.height);
    return this;
  }

  setDepthTest() {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    var gl = this.gl;

    if (value) {
      gl.enable(gl.DEPTH_TEST);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }

    return this;
  }

  setColorMask(r, g, b, a) {
    this.gl.colorMask(r, g, b, a);
    return this;
  }

  setClearColor(r, g, b, a) {
    this.gl.clearColor(r, g, b, a);
    return this;
  }

  setClearMask(mask) {
    this.clearBits = mask;
    return this;
  }

  clear() {
    this.gl.clear(this.clearBits);
    return this;
  }

}

var BaseLoaderState;

(function (BaseLoaderState) {
  BaseLoaderState[BaseLoaderState["IDLE"] = 0] = "IDLE";
  BaseLoaderState[BaseLoaderState["LOADING"] = 1] = "LOADING";
  BaseLoaderState[BaseLoaderState["PROCESSING"] = 2] = "PROCESSING";
  BaseLoaderState[BaseLoaderState["COMPLETE"] = 3] = "COMPLETE";
  BaseLoaderState[BaseLoaderState["SHUTDOWN"] = 4] = "SHUTDOWN";
  BaseLoaderState[BaseLoaderState["DESTROYED"] = 5] = "DESTROYED";
})(BaseLoaderState || (BaseLoaderState = {}));

var FileState;

(function (FileState) {
  FileState[FileState["PENDING"] = 0] = "PENDING";
  FileState[FileState["LOADING"] = 1] = "LOADING";
  FileState[FileState["LOADED"] = 2] = "LOADED";
  FileState[FileState["FAILED"] = 3] = "FAILED";
  FileState[FileState["PROCESSING"] = 4] = "PROCESSING";
  FileState[FileState["ERRORED"] = 5] = "ERRORED";
  FileState[FileState["COMPLETE"] = 6] = "COMPLETE";
  FileState[FileState["DESTROYED"] = 7] = "DESTROYED";
  FileState[FileState["POPULATED"] = 8] = "POPULATED";
  FileState[FileState["TIMED_OUT"] = 9] = "TIMED_OUT";
  FileState[FileState["ABORTED"] = 10] = "ABORTED";
})(FileState || (FileState = {}));

function XHRLoader(file) {
  var xhr = new XMLHttpRequest();
  file.xhrLoader = xhr;
  var config = file.xhrSettings;
  xhr.open('GET', file.url, config.async, config.username, config.password);
  xhr.responseType = config.responseType;
  xhr.timeout = config.timeout;
  xhr.setRequestHeader('X-Requested-With', config.requestedWith);

  if (config.header && config.headerValue) {
    xhr.setRequestHeader(config.header, config.headerValue);
  }

  if (config.overrideMimeType) {
    xhr.overrideMimeType(config.overrideMimeType);
  }

  var onLoadStart = event => file.onLoadStart(event);

  var onLoad = event => file.onLoad(event);

  var onLoadEnd = event => file.onLoadEnd(event);

  var onProgress = event => file.onProgress(event);

  var onTimeout = event => file.onTimeout(event);

  var onAbort = event => file.onAbort(event);

  var onError = event => file.onError(event);

  var eventMap = new Map([['loadstart', onLoadStart], ['load', onLoad], ['loadend', onLoadEnd], ['progress', onProgress], ['timeout', onTimeout], ['abort', onAbort], ['error', onError]]);

  for (var [key, value] of eventMap) {
    xhr.addEventListener(key, value);
  }

  file.resetXHR = () => {
    for (var [_key, _value] of eventMap) {
      xhr.removeEventListener(_key, _value);
    }
  };

  xhr.send();
}

function XHRSettings() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
    responseType: 'blob',
    async: true,
    username: '',
    password: '',
    timeout: 0
  };
  return {
    responseType: config.responseType,
    async: config.async,
    username: config.username,
    password: config.password,
    timeout: config.timeout,
    header: undefined,
    headerValue: undefined,
    requestedWith: 'XMLHttpRequest',
    overrideMimeType: undefined
  };
}

function File(key, url, type) {
  return {
    key,
    url,
    type,
    xhrLoader: undefined,
    xhrSettings: XHRSettings(),
    data: null,
    state: FileState.PENDING,
    bytesLoaded: 0,
    bytesTotal: 0,
    percentComplete: 0,

    load() {
      console.log('File.load', this.key);
      this.state = FileState.PENDING;
      XHRLoader(this);
      return new Promise((resolve, reject) => {
        this.loaderResolve = resolve;
        this.loaderReject = reject;
      });
    },

    onLoadStart(event) {
      console.log('onLoadStart');
      this.state = FileState.LOADING;
    },

    onLoad(event) {
      console.log('onLoad');
      var xhr = this.xhrLoader;
      var localFileOk = xhr.responseURL && xhr.responseURL.indexOf('file://') === 0 && xhr.status === 0;
      var success = !(event.target && xhr.status !== 200) || localFileOk;

      if (xhr.readyState === 4 && xhr.status >= 400 && xhr.status <= 599) {
        success = false;
      }

      this.onProcess().then(() => this.onComplete()).catch(() => this.onError());
    },

    onLoadEnd(event) {
      console.log('onLoadEnd');
      this.resetXHR();
      this.state = FileState.LOADED;
    },

    onTimeout(event) {
      console.log('onTimeout');
      this.state = FileState.TIMED_OUT;
    },

    onAbort(event) {
      console.log('onAbort');
      this.state = FileState.ABORTED;
    },

    onError(event) {
      console.log('onError');
      this.state = FileState.ERRORED;

      if (this.fileReject) {
        this.fileReject(this);
      }
    },

    onProgress(event) {
      console.log('onProgress');

      if (event.lengthComputable) {
        this.bytesLoaded = event.loaded;
        this.bytesTotal = event.total;
        this.percentComplete = Math.min(event.loaded / event.total, 1);
        console.log(this.percentComplete, '%');
      }
    },

    onProcess() {
      console.log('File.onProcess');
      this.state = FileState.PROCESSING;
      return new Promise((resolve, reject) => {
        resolve();
      });
    },

    onComplete() {
      console.log('onComplete!');
      this.state = FileState.COMPLETE;

      if (this.fileResolve) {
        this.fileResolve(this);
      } else if (this.loaderResolve) {
        this.loaderResolve(this);
      }
    },

    onDestroy() {
      this.state = FileState.DESTROYED;
    }

  };
}

function ImageFile(key, url) {
  if (!url) {
    url = key + '.png';
  }

  var file = File(key, url, 'image');
  file.xhrSettings.responseType = 'blob';

  file.onProcess = () => {
    console.log('ImageFile.onProcess');
    file.state = FileState.PROCESSING;
    var image = new Image();
    file.data = image;
    return new Promise((resolve, reject) => {
      image.onload = () => {
        console.log('ImageFile.onload');
        image.onload = null;
        image.onerror = null;
        file.state = FileState.COMPLETE;
        resolve(file);
      };

      image.onerror = event => {
        console.log('ImageFile.onerror');
        image.onload = null;
        image.onerror = null;
        file.state = FileState.FAILED;
        reject(file);
      };

      console.log('ImageFile.set src', file.url);
      image.src = file.url;

      if (image.complete && image.width && image.height) {
        console.log('ImageFile.instant');
        image.onload = null;
        image.onerror = null;
        file.state = FileState.COMPLETE;
        resolve(file);
      }
    });
  };

  return file;
}

class Matrix2D {
  constructor() {
    var a = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    var b = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var c = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var d = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
    var tx = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
    var ty = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
    this.set(a, b, c, d, tx, ty);
  }

  set() {
    var a = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    var b = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var c = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var d = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
    var tx = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
    var ty = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.tx = tx;
    this.ty = ty;
    return this;
  }

  identity() {
    return this.set();
  }

  toArray() {
    return [this.a, this.b, this.c, this.d, this.tx, this.ty];
  }

  fromArray(src) {
    return this.set(src[0], src[1], src[2], src[3], src[4], src[5]);
  }

  [Symbol.iterator]() {
    var data = this.toArray();
    return data[Symbol.iterator]();
  }

}

class Vec2 {
  constructor() {
    var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    this.set(x, y);
  }

  set() {
    var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    this.x = x;
    this.y = y;
    return this;
  }

  zero() {
    return this.set();
  }

  getArray() {
    return [this.x, this.y];
  }

  fromArray(src) {
    return this.set(src[0], src[1]);
  }

  [Symbol.iterator]() {
    var data = this.getArray();
    return data[Symbol.iterator]();
  }

}

class Transform {
  constructor() {
    var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var rotation = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var scaleX = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
    var scaleY = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
    this.local = new Matrix2D();
    this.world = new Matrix2D();
    this._position = new Vec2(x, y);
    this._scale = new Vec2(scaleX, scaleY);
    this._skew = new Vec2(0, 0);
    this._origin = new Vec2(0, 0);
    this._rotation = rotation;
    this.dirty = true;
  }

  update() {
    if (!this.dirty) {
      return false;
    }

    var {
      _a,
      _b,
      _c,
      _d,
      _position
    } = this;
    this.local.set(_a, _b, _c, _d, _position.x, _position.y);
    this.dirty = false;
    return true;
  }

  setPosition(x, y) {
    this._position.set(x, y);

    this.dirty = true;
    return this;
  }

  setScale(scaleX) {
    var scaleY = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : scaleX;

    this._scale.set(scaleX, scaleY);

    this.dirty = true;
    this.updateCache();
    return this;
  }

  setSkew(skewX, skewY) {
    this._skew.set(skewX, skewY);

    this.dirty = true;
    this.updateCache();
    return this;
  }

  setOrigin(originX) {
    var originY = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : originX;

    this._origin.set(originX, originY);

    this.dirty = true;
    return this;
  }

  setRotation(rotation) {
    this.rotation = rotation;
    return this;
  }

  updateCache() {
    var {
      _rotation,
      _skew,
      _scale
    } = this;
    this._a = Math.cos(_rotation + _skew.y) * _scale.x;
    this._b = Math.sin(_rotation + _skew.y) * _scale.x;
    this._c = -Math.sin(_rotation - _skew.x) * _scale.y;
    this._d = Math.cos(_rotation - _skew.x) * _scale.y;
  }

  set x(value) {
    this._position.x = value;
    this.dirty = true;
  }

  get x() {
    return this._position.x;
  }

  set y(value) {
    this._position.y = value;
    this.dirty = true;
  }

  get y() {
    return this._position.y;
  }

  set rotation(value) {
    this._rotation = value;
    this.dirty = true;
    this.updateCache();
  }

  get rotation() {
    return this._rotation;
  }

  set scaleX(value) {
    this._scale.x = value;
    this.dirty = true;
    this.updateCache();
  }

  get scaleX() {
    return this._scale.x;
  }

  set scaleY(value) {
    this._scale.y = value;
    this.dirty = true;
    this.updateCache();
  }

  get scaleY() {
    return this._scale.y;
  }

  set originX(value) {
    this._origin.x = value;
    this.dirty = true;
  }

  get originX() {
    return this._origin.x;
  }

  set originY(value) {
    this._origin.y = value;
    this.dirty = true;
  }

  get originY() {
    return this._origin.y;
  }

  set skewX(value) {
    this._skew.x = value;
    this.dirty = true;
    this.updateCache();
  }

  get skewX() {
    return this._skew.x;
  }

  set skewY(value) {
    this._skew.y = value;
    this.dirty = true;
    this.updateCache();
  }

  get skewY() {
    return this._skew.y;
  }

}

class Matrix4 {
  constructor() {
    var m00 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    var m01 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var m02 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var m03 = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    var m10 = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
    var m11 = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
    var m12 = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;
    var m13 = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 0;
    var m20 = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : 0;
    var m21 = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : 0;
    var m22 = arguments.length > 10 && arguments[10] !== undefined ? arguments[10] : 1;
    var m23 = arguments.length > 11 && arguments[11] !== undefined ? arguments[11] : 0;
    var m30 = arguments.length > 12 && arguments[12] !== undefined ? arguments[12] : 0;
    var m31 = arguments.length > 13 && arguments[13] !== undefined ? arguments[13] : 0;
    var m32 = arguments.length > 14 && arguments[14] !== undefined ? arguments[14] : 0;
    var m33 = arguments.length > 15 && arguments[15] !== undefined ? arguments[15] : 1;
    this.set(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
  }

  set() {
    var m00 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    var m01 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var m02 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var m03 = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    var m10 = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
    var m11 = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
    var m12 = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;
    var m13 = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 0;
    var m20 = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : 0;
    var m21 = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : 0;
    var m22 = arguments.length > 10 && arguments[10] !== undefined ? arguments[10] : 1;
    var m23 = arguments.length > 11 && arguments[11] !== undefined ? arguments[11] : 0;
    var m30 = arguments.length > 12 && arguments[12] !== undefined ? arguments[12] : 0;
    var m31 = arguments.length > 13 && arguments[13] !== undefined ? arguments[13] : 0;
    var m32 = arguments.length > 14 && arguments[14] !== undefined ? arguments[14] : 0;
    var m33 = arguments.length > 15 && arguments[15] !== undefined ? arguments[15] : 1;
    this.m00 = m00;
    this.m01 = m01;
    this.m02 = m02;
    this.m03 = m03;
    this.m10 = m10;
    this.m11 = m11;
    this.m12 = m12;
    this.m13 = m13;
    this.m20 = m20;
    this.m21 = m21;
    this.m22 = m22;
    this.m23 = m23;
    this.m30 = m30;
    this.m31 = m31;
    this.m32 = m32;
    this.m33 = m33;
    return this;
  }

  zero() {
    return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  identity() {
    return this.set();
  }

  getArray() {
    return [this.m00, this.m01, this.m02, this.m03, this.m10, this.m11, this.m12, this.m13, this.m20, this.m21, this.m22, this.m23, this.m30, this.m31, this.m32, this.m33];
  }

  fromArray(src) {
    return this.set(src[0], src[1], src[2], src[3], src[4], src[5], src[6], src[7], src[8], src[9], src[10], src[11], src[12], src[13], src[14], src[15]);
  }

  [Symbol.iterator]() {
    var data = this.getArray();
    return data[Symbol.iterator]();
  }

}

function Ortho(left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  var m00 = -2 * lr;
  var m11 = -2 * bt;
  var m22 = 2 * nf;
  var m30 = (left + right) * lr;
  var m31 = (top + bottom) * bt;
  var m32 = (far + near) * nf;
  return new Matrix4(m00, 0, 0, 0, 0, m11, 0, 0, 0, 0, m22, 0, m30, m31, m32, 1);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}
/*!
 * GSAP 3.0.1
 * https://greensock.com
 *
 * @license Copyright 2008-2019, GreenSock. All rights reserved.
 * Subject to the terms at https://greensock.com/standard-license or for
 * Club GreenSock members, the agreement issued with that membership.
 * @author: Jack Doyle, jack@greensock.com
*/


var _config = {
  autoSleep: 120,
  force3D: "auto",
  nullTargetWarn: 1,
  units: {
    lineHeight: ""
  }
},
    _defaults = {
  duration: .5,
  overwrite: false,
  delay: 0
},
    _bigNum = 1e8,
    _tinyNum = 1 / _bigNum,
    _2PI = Math.PI * 2,
    _HALF_PI = _2PI / 4,
    _gsID = 0,
    _sqrt = Math.sqrt,
    _cos = Math.cos,
    _sin = Math.sin,
    _isString = function _isString(value) {
  return typeof value === "string";
},
    _isFunction = function _isFunction(value) {
  return typeof value === "function";
},
    _isNumber = function _isNumber(value) {
  return typeof value === "number";
},
    _isUndefined = function _isUndefined(value) {
  return typeof value === "undefined";
},
    _isObject = function _isObject(value) {
  return typeof value === "object";
},
    _isNotFalse = function _isNotFalse(value) {
  return value !== false;
},
    _windowExists = function _windowExists() {
  return typeof window !== "undefined";
},
    _isFuncOrString = function _isFuncOrString(value) {
  return _isFunction(value) || _isString(value);
},
    _isArray = Array.isArray,
    _strictNumExp = /(?:-?\.?\d|\.)+/gi,
    _numExp = /[-+=\.]*\d+[\.e\-\+]*\d*[e\-\+]*\d*/gi,
    _complexStringNumExp = /[-+=\.]*\d+(?:\.|e-|e)*\d*/gi,
    _parenthesesExp = /\(([^()]+)\)/i,
    _relExp = /[\+-]=-?[\.\d]+/,
    _delimitedValueExp = /[#\-+\.]*\b[a-z\d-=+%.]+/gi,
    _globalTimeline,
    _win,
    _coreInitted,
    _doc,
    _globals = {},
    _installScope = {},
    _coreReady,
    _install = function _install(scope) {
  return (_installScope = _merge(scope, _globals)) && gsap;
},
    _missingPlugin = function _missingPlugin(property, value) {
  return console.warn("Invalid", property, "tween of", value, "Missing plugin? gsap.registerPlugin()");
},
    _warn = function _warn(message, suppress) {
  return !suppress && console.warn(message);
},
    _addGlobal = function _addGlobal(name, obj) {
  return name && (_globals[name] = obj) && _installScope && (_installScope[name] = obj) || _globals;
},
    _emptyFunc = function _emptyFunc() {
  return 0;
},
    _reservedProps = {},
    _lazyTweens = [],
    _lazyLookup = {},
    _plugins = {},
    _effects = {},
    _nextGCFrame = 30,
    _harnessPlugins = [],
    _callbackNames = "onComplete,onUpdate,onStart,onRepeat,onReverseComplete,onInterrupt",
    _harness = function _harness(targets) {
  var target = targets[0],
      harnessPlugin,
      i;

  if (!_isObject(target) && !_isFunction(target)) {
    return _isArray(targets) ? targets : [targets];
  }

  if (!(harnessPlugin = (target._gsap || {}).harness)) {
    i = _harnessPlugins.length;

    while (i-- && !_harnessPlugins[i].targetTest(target)) {}

    harnessPlugin = _harnessPlugins[i];
  }

  i = targets.length;

  while (i--) {
    targets[i]._gsap || (targets[i]._gsap = new GSCache(targets[i], harnessPlugin));
  }

  return targets;
},
    _getCache = function _getCache(target) {
  return target._gsap || _harness(toArray(target))[0]._gsap;
},
    _getProperty = function _getProperty(target, property) {
  var currentValue = target[property];
  return _isFunction(currentValue) ? target[property]() : _isUndefined(currentValue) && target.getAttribute(property) || currentValue;
},
    _forEachName = function _forEachName(names, func) {
  return (names = names.split(",")).forEach(func) || names;
},
    _round = function _round(value) {
  return Math.round(value * 10000) / 10000;
},
    _arrayContainsAny = function _arrayContainsAny(toSearch, toFind) {
  var l = toFind.length,
      i = 0;

  for (; toSearch.indexOf(toFind[i]) < 0 && ++i < l;) {}

  return i < l;
},
    _parseVars = function _parseVars(params, type, parent) {
  var isLegacy = _isNumber(params[1]),
      varsIndex = (isLegacy ? 2 : 1) + (type < 2 ? 0 : 1),
      vars = params[varsIndex],
      i;

  if (isLegacy) {
    vars.duration = params[1];
  }

  if (type === 1) {
    vars.runBackwards = 1;
    vars.immediateRender = _isNotFalse(vars.immediateRender);
  } else if (type === 2) {
    i = params[varsIndex - 1];
    vars.startAt = i;
    vars.immediateRender = _isNotFalse(vars.immediateRender);
  }

  vars.parent = parent;
  return vars;
},
    _lazyRender = function _lazyRender() {
  var l = _lazyTweens.length,
      a = _lazyTweens.slice(0),
      i,
      tween;

  _lazyLookup = {};
  _lazyTweens.length = 0;

  for (i = 0; i < l; i++) {
    tween = a[i];

    if (tween && tween._lazy) {
      tween.render(tween._lazy[0], tween._lazy[1], true)._lazy = 0;
    }
  }
},
    _lazySafeRender = function _lazySafeRender(animation, time, suppressEvents, force) {
  if (_lazyTweens.length) {
    _lazyRender();
  }

  animation.render(time, suppressEvents, force);

  if (_lazyTweens.length) {
    _lazyRender();
  }
},
    _numericIfPossible = function _numericIfPossible(value) {
  var n = parseFloat(value);
  return n || n === 0 ? n : value;
},
    _passThrough = function _passThrough(p) {
  return p;
},
    _setDefaults = function _setDefaults(obj, defaults) {
  for (var p in defaults) {
    if (!(p in obj)) {
      obj[p] = defaults[p];
    }
  }

  return obj;
},
    _setKeyframeDefaults = function _setKeyframeDefaults(obj, defaults) {
  for (var p in defaults) {
    if (!(p in obj) && p !== "duration" && p !== "ease") {
      obj[p] = defaults[p];
    }
  }
},
    _merge = function _merge(base, toMerge) {
  for (var p in toMerge) {
    base[p] = toMerge[p];
  }

  return base;
},
    _mergeDeep = function _mergeDeep(base, toMerge) {
  for (var p in toMerge) {
    base[p] = _isObject(toMerge[p]) ? _mergeDeep(base[p] || (base[p] = {}), toMerge[p]) : toMerge[p];
  }

  return base;
},
    _copyExcluding = function _copyExcluding(obj, excluding) {
  var copy = {},
      p;

  for (p in obj) {
    if (!(p in excluding)) {
      copy[p] = obj[p];
    }
  }

  return copy;
},
    _inheritDefaults = function _inheritDefaults(vars) {
  var parent = vars.parent || _globalTimeline,
      func = vars.keyframes ? _setKeyframeDefaults : _setDefaults;

  if (_isNotFalse(vars.inherit)) {
    while (parent) {
      func(vars, parent.vars.defaults);
      parent = parent.parent;
    }
  }

  return vars;
},
    _arraysMatch = function _arraysMatch(a1, a2) {
  var i = a1.length,
      match = i === a2.length;

  while (match && i-- && a1[i] === a2[i]) {}

  return i < 0;
},
    _addLinkedListItem = function _addLinkedListItem(parent, child, firstProp, lastProp, sortBy) {
  if (firstProp === void 0) {
    firstProp = "_first";
  }

  if (lastProp === void 0) {
    lastProp = "_last";
  }

  var prev = parent[lastProp],
      t;

  if (sortBy) {
    t = child[sortBy];

    while (prev && prev[sortBy] > t) {
      prev = prev._prev;
    }
  }

  if (prev) {
    child._next = prev._next;
    prev._next = child;
  } else {
    child._next = parent[firstProp];
    parent[firstProp] = child;
  }

  if (child._next) {
    child._next._prev = child;
  } else {
    parent[lastProp] = child;
  }

  child._prev = prev;
  child.parent = parent;
  return child;
},
    _removeLinkedListItem = function _removeLinkedListItem(parent, child, firstProp, lastProp) {
  if (firstProp === void 0) {
    firstProp = "_first";
  }

  if (lastProp === void 0) {
    lastProp = "_last";
  }

  var prev = child._prev,
      next = child._next;

  if (prev) {
    prev._next = next;
  } else if (parent[firstProp] === child) {
    parent[firstProp] = next;
  }

  if (next) {
    next._prev = prev;
  } else if (parent[lastProp] === child) {
    parent[lastProp] = prev;
  }

  child._dp = parent;
  child._next = child._prev = child.parent = null;
},
    _removeFromParent = function _removeFromParent(child, onlyIfParentHasAutoRemove) {
  if (child.parent && (!onlyIfParentHasAutoRemove || child.parent.autoRemoveChildren)) {
    child.parent.remove(child);
  }

  child._act = 0;
},
    _uncache = function _uncache(animation) {
  var a = animation;

  while (a) {
    a._dirty = 1;
    a = a.parent;
  }

  return animation;
},
    _recacheAncestors = function _recacheAncestors(animation) {
  var parent = animation.parent;

  while (parent && parent.parent) {
    parent._dirty = 1;
    parent.totalDuration();
    parent = parent.parent;
  }

  return animation;
},
    _hasNoPausedAncestors = function _hasNoPausedAncestors(animation) {
  return !animation || animation._ts && _hasNoPausedAncestors(animation.parent);
},
    _elapsedCycleDuration = function _elapsedCycleDuration(animation) {
  var cycleDuration;
  return animation._repeat ? (cycleDuration = animation.duration() + animation._rDelay) * ~~(animation._tTime / cycleDuration) : 0;
},
    _parentToChildTotalTime = function _parentToChildTotalTime(parentTime, child) {
  return child._ts > 0 ? (parentTime - child._start) * child._ts : (child._dirty ? child.totalDuration() : child._tDur) + (parentTime - child._start) * child._ts;
},
    _addToTimeline = function _addToTimeline(timeline, child, position) {
  child.parent && _removeFromParent(child);
  child._start = position + child._delay;
  child._end = child._start + (child.totalDuration() / child._ts || 0);

  _addLinkedListItem(timeline, child, "_first", "_last", timeline._sort ? "_start" : 0);

  timeline._recent = child;

  if (child._time || !child._dur && child._initted) {
    var curTime = (timeline.rawTime() - child._start) * child._ts;

    if (!child._dur || _clamp(0, child.totalDuration(), curTime) - child._tTime > _tinyNum) {
      child.render(curTime, true);
    }
  }

  _uncache(timeline);

  if (timeline._dp && timeline._time >= timeline._dur && timeline._ts && timeline._dur < timeline.duration()) {
    var tl = timeline;

    while (tl._dp) {
      tl.totalTime(tl._tTime, true);
      tl = tl._dp;
    }
  }

  return timeline;
},
    _attemptInitTween = function _attemptInitTween(tween, totalTime, force, suppressEvents) {
  _initTween(tween, totalTime);

  if (!tween._initted) {
    return 1;
  }

  if (!force && tween._pt && tween.vars.lazy) {
    _lazyTweens.push(tween);

    tween._lazy = [totalTime, suppressEvents];
    return 1;
  }
},
    _renderZeroDurationTween = function _renderZeroDurationTween(tween, totalTime, suppressEvents, force) {
  var prevRatio = tween._zTime < 0 ? 0 : 1,
      ratio = totalTime < 0 ? 0 : 1,
      repeatDelay = tween._rDelay,
      tTime = 0,
      pt,
      iteration,
      prevIteration;

  if (repeatDelay && tween._repeat) {
    tTime = _clamp(0, tween._tDur, totalTime);
    iteration = ~~(tTime / repeatDelay);

    if (iteration && iteration === tTime / repeatDelay) {
      iteration--;
    }

    prevIteration = ~~(tween._tTime / repeatDelay);

    if (prevIteration && prevIteration === tween._tTime / repeatDelay) {
      prevIteration--;
    }

    if (iteration !== prevIteration) {
      prevRatio = 1 - ratio;

      if (tween.vars.repeatRefresh) {
        tween.invalidate();
      }
    }
  }

  if (!tween._initted && _attemptInitTween(tween, totalTime, force, suppressEvents)) {
    return;
  }

  if (ratio !== prevRatio || force) {
    if (!suppressEvents || totalTime) {
      tween._zTime = totalTime;
    }

    tween.ratio = ratio;

    if (tween._from) {
      ratio = 1 - ratio;
    }

    tween._time = 0;
    tween._tTime = tTime;

    if (!suppressEvents) {
      _callback(tween, "onStart");
    }

    pt = tween._pt;

    while (pt) {
      pt.r(ratio, pt.d);
      pt = pt._next;
    }

    if (!ratio && tween._startAt && !tween._onUpdate && tween._start) {
      tween._startAt.render(totalTime, true, force);
    }

    if (tween._onUpdate && !suppressEvents) {
      _callback(tween, "onUpdate");
    }

    if (tTime && tween._repeat && !suppressEvents && tween.parent) {
      _callback(tween, "onRepeat");
    }

    if ((totalTime >= tween._tDur || totalTime < 0) && tween.ratio === ratio) {
      tween.ratio && _removeFromParent(tween, 1);

      if (!suppressEvents) {
        _callback(tween, tween.ratio ? "onComplete" : "onReverseComplete", true);

        tween._prom && tween.ratio && tween._prom();
      }
    }
  }
},
    _findNextPauseTween = function _findNextPauseTween(animation, prevTime, time) {
  var child;

  if (time > prevTime) {
    child = animation._first;

    while (child && child._start <= time) {
      if (!child._dur && child.data === "isPause" && child._start > prevTime) {
        return child;
      }

      child = child._next;
    }
  } else {
    child = animation._last;

    while (child && child._start >= time) {
      if (!child._dur && child.data === "isPause" && child._start < prevTime) {
        return child;
      }

      child = child._prev;
    }
  }
},
    _onUpdateTotalDuration = function _onUpdateTotalDuration(animation) {
  if (animation instanceof Timeline) {
    return _uncache(animation);
  }

  var repeat = animation._repeat;
  animation._tDur = !repeat ? animation._dur : repeat < 0 ? 1e20 : _round(animation._dur * (repeat + 1) + animation._rDelay * repeat);

  _uncache(animation.parent);

  return animation;
},
    _zeroPosition = {
  _start: 0,
  endTime: _emptyFunc
},
    _parsePosition = function _parsePosition(animation, position, useBuildFrom) {
  var labels = animation.labels,
      recent = animation._recent || _zeroPosition,
      clippedDuration = animation.duration() >= _bigNum ? recent.endTime(false) : animation._dur,
      i,
      offset;

  if (_isString(position) && (isNaN(position) || position in labels)) {
    i = position.charAt(0);

    if (i === "<" || i === ">") {
      return (i === "<" ? recent._start : recent.endTime(recent._repeat >= 0)) + (parseFloat(position.substr(1)) || 0);
    }

    i = position.indexOf("=");

    if (i < 0) {
      if (!(position in labels)) {
        labels[position] = clippedDuration;
      }

      return labels[position];
    }

    offset = +(position.charAt(i - 1) + position.substr(i + 1));
    return i > 1 ? _parsePosition(animation, position.substr(0, i - 1)) + offset : clippedDuration + offset;
  }

  return position == null ? clippedDuration : +position;
},
    _conditionalReturn = function _conditionalReturn(value, func) {
  return value || value === 0 ? func(value) : func;
},
    _clamp = function _clamp(min, max, value) {
  return value < min ? min : value > max ? max : value;
},
    getUnit = function getUnit(value) {
  return (value + "").substr((parseFloat(value) + "").length);
},
    clamp = function clamp(min, max, value) {
  return _conditionalReturn(value, function (v) {
    return _clamp(min, max, v);
  });
},
    _slice = [].slice,
    _isArrayLike = function _isArrayLike(value) {
  return _isObject(value) && "length" in value && value.length - 1 in value && _isObject(value[0]) && value !== _win;
},
    _flatten = function _flatten(ar, leaveStrings, accumulator) {
  if (accumulator === void 0) {
    accumulator = [];
  }

  return ar.forEach(function (value) {
    var _accumulator;

    return _isString(value) && !leaveStrings || _isArrayLike(value) ? (_accumulator = accumulator).push.apply(_accumulator, toArray(value)) : accumulator.push(value);
  }) || accumulator;
},
    toArray = function toArray(value, leaveStrings) {
  return _isString(value) && !leaveStrings && (_coreInitted || !_wake()) ? _slice.call(_doc.querySelectorAll(value), 0) : _isArray(value) ? _flatten(value, leaveStrings) : _isArrayLike(value) ? _slice.call(value, 0) : value ? [value] : [];
},
    distribute = function distribute(v) {
  if (_isFunction(v)) {
    return v;
  }

  var vars = _isObject(v) ? v : {
    each: v
  },
      ease = _parseEase(vars.ease),
      from = vars.from || 0,
      base = parseFloat(vars.base) || 0,
      cache = {},
      isDecimal = from > 0 && from < 1,
      ratios = isNaN(from) || isDecimal,
      axis = vars.axis,
      ratioX = from,
      ratioY = from;

  if (_isString(from)) {
    ratioX = ratioY = {
      center: .5,
      edges: .5,
      end: 1
    }[from] || 0;
  } else if (!isDecimal && ratios) {
    ratioX = from[0];
    ratioY = from[1];
  }

  return function (i, target, a) {
    var l = (a || vars).length,
        distances = cache[l],
        originX,
        originY,
        x,
        y,
        d,
        j,
        max,
        min,
        wrapAt;

    if (!distances) {
      wrapAt = vars.grid === "auto" ? 0 : (vars.grid || [1, _bigNum])[1];

      if (!wrapAt) {
        max = -_bigNum;

        while (max < (max = a[wrapAt++].getBoundingClientRect().left) && wrapAt < l) {}

        wrapAt--;
      }

      distances = cache[l] = [];
      originX = ratios ? Math.min(wrapAt, l) * ratioX - .5 : from % wrapAt;
      originY = ratios ? l * ratioY / wrapAt - .5 : from / wrapAt | 0;
      max = 0;
      min = _bigNum;

      for (j = 0; j < l; j++) {
        x = j % wrapAt - originX;
        y = originY - (j / wrapAt | 0);
        distances[j] = d = !axis ? _sqrt(x * x + y * y) : Math.abs(axis === "y" ? y : x);

        if (d > max) {
          max = d;
        }

        if (d < min) {
          min = d;
        }
      }

      distances.max = max - min;
      distances.min = min;
      distances.v = l = (parseFloat(vars.amount) || parseFloat(vars.each) * (wrapAt > l ? l - 1 : !axis ? Math.max(wrapAt, l / wrapAt) : axis === "y" ? l / wrapAt : wrapAt) || 0) * (from === "edges" ? -1 : 1);
      distances.b = l < 0 ? base - l : base;
      distances.u = getUnit(vars.amount || vars.each) || 0;
      ease = ease && l < 0 ? _invertEase(ease) : ease;
    }

    l = (distances[i] - distances.min) / distances.max || 0;
    return _round(distances.b + (ease ? ease(l) : l) * distances.v) + distances.u;
  };
},
    _roundModifier = function _roundModifier(v) {
  var p = v < 1 ? Math.pow(10, (v + "").length - 2) : 1;
  return function (raw) {
    return ~~(Math.round(parseFloat(raw) / v) * v * p) / p + (_isNumber(raw) ? 0 : getUnit(raw));
  };
},
    snap = function snap(snapTo, value) {
  var isArray = _isArray(snapTo),
      radius,
      is2D;

  if (!isArray && _isObject(snapTo)) {
    radius = isArray = snapTo.radius || _bigNum;
    snapTo = toArray(snapTo.values);

    if (is2D = !_isNumber(snapTo[0])) {
      radius *= radius;
    }
  }

  return _conditionalReturn(value, !isArray ? _roundModifier(snapTo) : function (raw) {
    var x = parseFloat(is2D ? raw.x : raw),
        y = parseFloat(is2D ? raw.y : 0),
        min = _bigNum,
        closest = 0,
        i = snapTo.length,
        dx,
        dy;

    while (i--) {
      if (is2D) {
        dx = snapTo[i].x - x;
        dy = snapTo[i].y - y;
        dx = dx * dx + dy * dy;
      } else {
        dx = Math.abs(snapTo[i] - x);
      }

      if (dx < min) {
        min = dx;
        closest = i;
      }
    }

    closest = !radius || min <= radius ? snapTo[closest] : raw;
    return is2D || closest === raw || _isNumber(raw) ? closest : closest + getUnit(raw);
  });
},
    random = function random(min, max, roundingIncrement, returnFunction) {
  return _conditionalReturn(_isArray(min) ? !max : !returnFunction, function () {
    return _isArray(min) ? min[~~(Math.random() * min.length)] : (roundingIncrement = roundingIncrement || 1e-5) && (returnFunction = roundingIncrement < 1 ? Math.pow(10, (roundingIncrement + "").length - 2) : 1) && ~~(Math.round((min + Math.random() * (max - min)) / roundingIncrement) * roundingIncrement * returnFunction) / returnFunction;
  });
},
    pipe = function pipe() {
  for (var _len = arguments.length, functions = new Array(_len), _key = 0; _key < _len; _key++) {
    functions[_key] = arguments[_key];
  }

  return function (value) {
    return functions.reduce(function (v, f) {
      return f(v);
    }, value);
  };
},
    unitize = function unitize(func, unit) {
  return function (value) {
    return func(parseFloat(value)) + (unit || getUnit(value));
  };
},
    normalize = function normalize(min, max, value) {
  return mapRange(min, max, 0, 1, value);
},
    _wrapArray = function _wrapArray(a, wrapper, value) {
  return _conditionalReturn(value, function (index) {
    return a[~~wrapper(index)];
  });
},
    wrap = function wrap(min, max, value) {
  var range = max - min;
  return _isArray(min) ? _wrapArray(min, wrap(0, min.length), max) : _conditionalReturn(value, function (value) {
    return (range + (value - min) % range) % range + min;
  });
},
    wrapYoyo = function wrapYoyo(min, max, value) {
  var range = max - min,
      total = range * 2;
  return _isArray(min) ? _wrapArray(min, wrapYoyo(0, min.length - 1), max) : _conditionalReturn(value, function (value) {
    value = (total + (value - min) % total) % total;
    return min + (value > range ? total - value : value);
  });
},
    _replaceRandom = function _replaceRandom(value) {
  var prev = 0,
      s = "",
      i,
      nums,
      end,
      isArray;

  while (~(i = value.indexOf("random(", prev))) {
    end = value.indexOf(")", i);
    isArray = value.charAt(i + 7) === "[";
    nums = value.substr(i + 7, end - i - 7).match(isArray ? _delimitedValueExp : _strictNumExp);
    s += value.substr(prev, i - prev) + random(isArray ? nums : +nums[0], +nums[1], +nums[2] || 1e-5);
    prev = end + 1;
  }

  return s + value.substr(prev, value.length - prev);
},
    mapRange = function mapRange(inMin, inMax, outMin, outMax, value) {
  var inRange = inMax - inMin,
      outRange = outMax - outMin;
  return _conditionalReturn(value, function (value) {
    return outMin + (value - inMin) / inRange * outRange;
  });
},
    interpolate = function interpolate(start, end, progress, mutate) {
  var func = isNaN(start + end) ? 0 : function (p) {
    return (1 - p) * start + p * end;
  };

  if (!func) {
    var isString = _isString(start),
        master = {},
        p,
        i,
        interpolators,
        l,
        il;

    progress === true && (mutate = 1) && (progress = null);

    if (isString) {
      start = {
        p: start
      };
      end = {
        p: end
      };
    } else if (_isArray(start) && !_isArray(end)) {
      interpolators = [];
      l = start.length;
      il = l - 2;

      for (i = 1; i < l; i++) {
        interpolators.push(interpolate(start[i - 1], start[i]));
      }

      l--;

      func = function func(p) {
        p *= l;
        var i = Math.min(il, ~~p);
        return interpolators[i](p - i);
      };

      progress = end;
    } else if (!mutate) {
      start = _merge(_isArray(start) ? [] : {}, start);
    }

    if (!interpolators) {
      for (p in end) {
        _addPropTween.call(master, start, p, "get", end[p]);
      }

      func = function func(p) {
        return _renderPropTweens(p, master) || (isString ? start.p : start);
      };
    }
  }

  return _conditionalReturn(progress, func);
},
    _getLabelInDirection = function _getLabelInDirection(timeline, fromTime, backward) {
  var labels = timeline.labels,
      min = _bigNum,
      p,
      distance,
      label;

  for (p in labels) {
    distance = labels[p] - fromTime;

    if (distance < 0 === !!backward && distance && min > (distance = Math.abs(distance))) {
      label = p;
      min = distance;
    }
  }

  return label;
},
    _callback = function _callback(animation, type, executeLazyFirst) {
  var v = animation.vars,
      callback = v[type],
      params,
      scope;

  if (!callback) {
    return;
  }

  params = v[type + "Params"];
  scope = v.callbackScope || animation;

  if (executeLazyFirst && _lazyTweens.length) {
    _lazyRender();
  }

  return params ? callback.apply(scope, params) : callback.call(scope, animation);
},
    _interrupt = function _interrupt(animation) {
  _removeFromParent(animation);

  if (animation.progress() < 1) {
    _callback(animation, "onInterrupt");
  }

  return animation;
},
    _quickTween,
    _createPlugin = function _createPlugin(config) {
  config = !config.name && config["default"] || config;

  var name = config.name,
      isFunc = _isFunction(config),
      Plugin = name && !isFunc && config.init ? function () {
    this._props = [];
  } : config,
      instanceDefaults = {
    init: _emptyFunc,
    render: _renderPropTweens,
    add: _addPropTween,
    kill: _killPropTweensOf,
    modifier: _addPluginModifier,
    rawVars: 0
  },
      statics = {
    targetTest: 0,
    get: 0,
    getSetter: _getSetter,
    aliases: {},
    register: 0
  };

  _wake();

  if (config !== Plugin) {
    if (_plugins[name]) {
      return;
    }

    _setDefaults(Plugin, _setDefaults(_copyExcluding(config, instanceDefaults), statics));

    _merge(Plugin.prototype, _merge(instanceDefaults, _copyExcluding(config, statics)));

    _plugins[Plugin.prop = name] = Plugin;

    if (config.targetTest) {
      _harnessPlugins.push(Plugin);

      _reservedProps[name] = 1;
    }

    name = (name === "css" ? "CSS" : name.charAt(0).toUpperCase() + name.substr(1)) + "Plugin";
  }

  _addGlobal(name, Plugin);

  if (config.register) {
    config.register(gsap, Plugin, PropTween);
  }
},
    _255 = 255,
    _colorLookup = {
  aqua: [0, _255, _255],
  lime: [0, _255, 0],
  silver: [192, 192, 192],
  black: [0, 0, 0],
  maroon: [128, 0, 0],
  teal: [0, 128, 128],
  blue: [0, 0, _255],
  navy: [0, 0, 128],
  white: [_255, _255, _255],
  olive: [128, 128, 0],
  yellow: [_255, _255, 0],
  orange: [_255, 165, 0],
  gray: [128, 128, 128],
  purple: [128, 0, 128],
  green: [0, 128, 0],
  red: [_255, 0, 0],
  pink: [_255, 192, 203],
  cyan: [0, _255, _255],
  transparent: [_255, _255, _255, 0]
},
    _hue = function _hue(h, m1, m2) {
  h = h < 0 ? h + 1 : h > 1 ? h - 1 : h;
  return (h * 6 < 1 ? m1 + (m2 - m1) * h * 6 : h < .5 ? m2 : h * 3 < 2 ? m1 + (m2 - m1) * (2 / 3 - h) * 6 : m1) * _255 + .5 | 0;
},
    splitColor = function splitColor(v, toHSL) {
  var a = !v ? _colorLookup.black : _isNumber(v) ? [v >> 16, v >> 8 & _255, v & _255] : 0,
      r,
      g,
      b,
      h,
      s,
      l,
      max,
      min,
      d,
      wasHSL;

  if (!a) {
    if (v.substr(-1) === ",") {
      v = v.substr(0, v.length - 1);
    }

    if (_colorLookup[v]) {
      a = _colorLookup[v];
    } else if (v.charAt(0) === "#") {
      if (v.length === 4) {
        r = v.charAt(1);
        g = v.charAt(2);
        b = v.charAt(3);
        v = "#" + r + r + g + g + b + b;
      }

      v = parseInt(v.substr(1), 16);
      a = [v >> 16, v >> 8 & _255, v & _255];
    } else if (v.substr(0, 3) === "hsl") {
      a = wasHSL = v.match(_strictNumExp);

      if (!toHSL) {
        h = +a[0] % 360 / 360;
        s = +a[1] / 100;
        l = +a[2] / 100;
        g = l <= .5 ? l * (s + 1) : l + s - l * s;
        r = l * 2 - g;

        if (a.length > 3) {
          a[3] *= 1;
        }

        a[0] = _hue(h + 1 / 3, r, g);
        a[1] = _hue(h, r, g);
        a[2] = _hue(h - 1 / 3, r, g);
      } else if (~v.indexOf("=")) {
        return v.match(_numExp);
      }
    } else {
      a = v.match(_strictNumExp) || _colorLookup.transparent;
    }

    a = a.map(Number);
  }

  if (toHSL && !wasHSL) {
    r = a[0] / _255;
    g = a[1] / _255;
    b = a[2] / _255;
    max = Math.max(r, g, b);
    min = Math.min(r, g, b);
    l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }

    a[0] = h + .5 | 0;
    a[1] = s * 100 + .5 | 0;
    a[2] = l * 100 + .5 | 0;
  }

  return a;
},
    _formatColors = function _formatColors(s, toHSL) {
  var colors = (s + "").match(_colorExp),
      charIndex = 0,
      parsed = "",
      i,
      color,
      temp;

  if (!colors) {
    return s;
  }

  for (i = 0; i < colors.length; i++) {
    color = colors[i];
    temp = s.substr(charIndex, s.indexOf(color, charIndex) - charIndex);
    charIndex += temp.length + color.length;
    color = splitColor(color, toHSL);

    if (color.length === 3) {
      color.push(1);
    }

    parsed += temp + (toHSL ? "hsla(" + color[0] + "," + color[1] + "%," + color[2] + "%," + color[3] : "rgba(" + color.join(",")) + ")";
  }

  return parsed + s.substr(charIndex);
},
    _colorExp = function () {
  var s = "(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#(?:[0-9a-f]{3}){1,2}\\b",
      p;

  for (p in _colorLookup) {
    s += "|" + p + "\\b";
  }

  return new RegExp(s + ")", "gi");
}(),
    _hslExp = /hsl[a]?\(/,
    _colorStringFilter = function _colorStringFilter(a) {
  var combined = a.join(" "),
      toHSL;
  _colorExp.lastIndex = 0;

  if (_colorExp.test(combined)) {
    toHSL = _hslExp.test(combined);
    a[0] = _formatColors(a[0], toHSL);
    a[1] = _formatColors(a[1], toHSL);
  }
},
    _tickerActive,
    _ticker = function () {
  var _getTime = Date.now,
      _lagThreshold = 500,
      _adjustedLag = 33,
      _startTime = _getTime(),
      _lastUpdate = _startTime,
      _gap = 1 / 60,
      _nextTime = _gap,
      _listeners = [],
      _id,
      _req,
      _raf,
      _self,
      _tick = function _tick(v) {
    var elapsed = _getTime() - _lastUpdate,
        manual = v === true,
        overlap,
        dispatch;

    if (elapsed > _lagThreshold) {
      _startTime += elapsed - _adjustedLag;
    }

    _lastUpdate += elapsed;
    _self.time = (_lastUpdate - _startTime) / 1000;
    overlap = _self.time - _nextTime;

    if (overlap > 0 || manual) {
      _self.frame++;
      _nextTime += overlap + (overlap >= _gap ? 0.004 : _gap - overlap);
      dispatch = 1;
    }

    if (!manual) {
      _id = _req(_tick);
    }

    if (dispatch) {
      _listeners.forEach(function (l) {
        return l(_self.time, elapsed, _self.frame, v);
      });
    }
  };

  _self = {
    time: 0,
    frame: 0,
    tick: function tick() {
      _tick(true);
    },
    wake: function wake() {
      if (_coreReady) {
        if (!_coreInitted && _windowExists()) {
          _win = _coreInitted = window;
          _doc = _win.document || {};
          _globals.gsap = gsap;
          (_win.gsapVersions || (_win.gsapVersions = [])).push(gsap.version);

          _install(_installScope || _win.GreenSockGlobals || !_win.gsap && _win || {});

          _raf = _win.requestAnimationFrame;
        }

        _id && _self.sleep();

        _req = _raf || function (f) {
          return setTimeout(f, (_nextTime - _self.time) * 1000 + 1 | 0);
        };

        _tickerActive = 1;

        _tick(2);
      }
    },
    sleep: function sleep() {
      (_raf ? _win.cancelAnimationFrame : clearTimeout)(_id);
      _tickerActive = 0;
      _req = _emptyFunc;
    },
    lagSmoothing: function lagSmoothing(threshold, adjustedLag) {
      _lagThreshold = threshold || 1 / _tinyNum;
      _adjustedLag = Math.min(adjustedLag, _lagThreshold, 0);
    },
    fps: function fps(_fps) {
      _gap = 1 / (_fps || 60);
      _nextTime = _self.time + _gap;
    },
    add: function add(callback) {
      _listeners.indexOf(callback) < 0 && _listeners.push(callback);

      _wake();
    },
    remove: function remove(callback) {
      var i;
      ~(i = _listeners.indexOf(callback)) && _listeners.splice(i, 1);
    },
    _listeners: _listeners
  };
  return _self;
}(),
    _wake = function _wake() {
  return !_tickerActive && _ticker.wake();
},
    _easeMap = {},
    _customEaseExp = /^[\d.\-M][\d.\-,\s]/,
    _quotesExp = /["']/g,
    _parseObjectInString = function _parseObjectInString(value) {
  var obj = {},
      split = value.substr(1, value.length - 3).split(":"),
      key = split[0],
      i = 1,
      l = split.length,
      index,
      val,
      parsedVal;

  for (; i < l; i++) {
    val = split[i];
    index = i !== l - 1 ? val.lastIndexOf(",") : val.length;
    parsedVal = val.substr(0, index);
    obj[key] = isNaN(parsedVal) ? parsedVal.replace(_quotesExp, "").trim() : +parsedVal;
    key = val.substr(index + 1).trim();
  }

  return obj;
},
    _configEaseFromString = function _configEaseFromString(name) {
  var split = (name + "").split("("),
      ease = _easeMap[split[0]];
  return ease && split.length > 1 && ease.config ? ease.config.apply(null, ~name.indexOf("{") ? [_parseObjectInString(split[1])] : _parenthesesExp.exec(name)[1].split(",").map(_numericIfPossible)) : _easeMap._CE && _customEaseExp.test(name) ? _easeMap._CE("", name) : ease;
},
    _invertEase = function _invertEase(ease) {
  return function (p) {
    return 1 - ease(1 - p);
  };
},
    _parseEase = function _parseEase(ease, defaultEase) {
  return !ease ? defaultEase : (_isFunction(ease) ? ease : _easeMap[ease] || _configEaseFromString(ease)) || defaultEase;
},
    _insertEase = function _insertEase(names, easeIn, easeOut, easeInOut) {
  if (easeOut === void 0) {
    easeOut = function easeOut(p) {
      return 1 - easeIn(1 - p);
    };
  }

  if (easeInOut === void 0) {
    easeInOut = function easeInOut(p) {
      return p < .5 ? easeIn(p * 2) / 2 : 1 - easeIn((1 - p) * 2) / 2;
    };
  }

  var ease = {
    easeIn: easeIn,
    easeOut: easeOut,
    easeInOut: easeInOut
  },
      lowercaseName;

  _forEachName(names, function (name) {
    _easeMap[name] = _globals[name] = ease;
    _easeMap[lowercaseName = name.toLowerCase()] = easeOut;

    for (var p in ease) {
      _easeMap[lowercaseName + (p === "easeIn" ? ".in" : p === "easeOut" ? ".out" : ".inOut")] = _easeMap[name + "." + p] = ease[p];
    }
  });

  return ease;
},
    _easeInOutFromOut = function _easeInOutFromOut(easeOut) {
  return function (p) {
    return p < .5 ? (1 - easeOut(1 - p * 2)) / 2 : .5 + easeOut((p - .5) * 2) / 2;
  };
},
    _configElastic = function _configElastic(type, amplitude, period) {
  var p1 = amplitude >= 1 ? amplitude : 1,
      p2 = (period || (type ? .3 : .45)) / (amplitude < 1 ? amplitude : 1),
      p3 = p2 / _2PI * (Math.asin(1 / p1) || 0),
      easeOut = function easeOut(p) {
    return p === 1 ? 1 : p1 * Math.pow(2, -10 * p) * _sin((p - p3) * p2) + 1;
  },
      ease = type === "out" ? easeOut : type === "in" ? function (p) {
    return 1 - easeOut(1 - p);
  } : _easeInOutFromOut(easeOut);

  p2 = _2PI / p2;

  ease.config = function (amplitude, period) {
    return _configElastic(type, amplitude, period);
  };

  return ease;
},
    _configBack = function _configBack(type, overshoot) {
  if (overshoot === void 0) {
    overshoot = 1.70158;
  }

  var easeOut = function easeOut(p) {
    return --p * p * ((overshoot + 1) * p + overshoot) + 1;
  },
      ease = type === "out" ? easeOut : type === "in" ? function (p) {
    return 1 - easeOut(1 - p);
  } : _easeInOutFromOut(easeOut);

  ease.config = function (overshoot) {
    return _configBack(type, overshoot);
  };

  return ease;
};

_forEachName("Linear,Quad,Cubic,Quart,Quint,Strong", function (name, i) {
  var power = i < 5 ? i + 1 : i;

  _insertEase(name + ",Power" + (power - 1), i ? function (p) {
    return Math.pow(p, power);
  } : function (p) {
    return p;
  }, function (p) {
    return 1 - Math.pow(1 - p, power);
  }, function (p) {
    return p < .5 ? Math.pow(p * 2, power) / 2 : 1 - Math.pow((1 - p) * 2, power) / 2;
  });
});

_easeMap.Linear.easeNone = _easeMap.none = _easeMap.Linear.easeIn;

_insertEase("Elastic", _configElastic("in"), _configElastic("out"), _configElastic());

(function (n, c) {
  var n1 = 1 / c,
      n2 = 2 * n1,
      n3 = 2.5 * n1,
      easeOut = function easeOut(p) {
    return p < n1 ? n * p * p : p < n2 ? n * Math.pow(p - 1.5 / c, 2) + .75 : p < n3 ? n * (p -= 2.25 / c) * p + .9375 : n * Math.pow(p - 2.625 / c, 2) + .984375;
  };

  _insertEase("Bounce", function (p) {
    return 1 - easeOut(1 - p);
  }, easeOut);
})(7.5625, 2.75);

_insertEase("Expo", function (p) {
  return p ? Math.pow(2, 10 * (p - 1)) : 0;
});

_insertEase("Circ", function (p) {
  return -(_sqrt(1 - p * p) - 1);
});

_insertEase("Sine", function (p) {
  return -_cos(p * _HALF_PI) + 1;
});

_insertEase("Back", _configBack("in"), _configBack("out"), _configBack());

_easeMap.SteppedEase = _easeMap.steps = _globals.SteppedEase = {
  config: function config(steps, immediateStart) {
    if (steps === void 0) {
      steps = 1;
    }

    var p1 = 1 / steps,
        p2 = steps + (immediateStart ? 0 : 1),
        p3 = immediateStart ? 1 : 0,
        max = 1 - _tinyNum;
    return function (p) {
      return ((p2 * _clamp(0, max, p) | 0) + p3) * p1;
    };
  }
};
_defaults.ease = _easeMap["quad.out"];
var GSCache = function GSCache(target, harness) {
  this.id = _gsID++;
  target._gsap = this;
  this.target = target;
  this.harness = harness;
  this.get = harness ? harness.get : _getProperty;
  this.set = harness ? harness.getSetter : _getSetter;
};
var Animation = function () {
  function Animation(vars, time) {
    var parent = vars.parent || _globalTimeline;
    this.vars = vars;
    this._dur = this._tDur = +vars.duration || 0;
    this._delay = +vars.delay || 0;

    if (this._repeat = vars.repeat || 0) {
      this._rDelay = vars.repeatDelay || 0;
      this._yoyo = !!vars.yoyo || !!vars.yoyoEase;

      _onUpdateTotalDuration(this);
    }

    this._ts = 1;
    this.data = vars.data;

    if (!_tickerActive) {
      _ticker.wake();
    }

    if (parent) {
      _addToTimeline(parent, this, time || time === 0 ? time : parent._time);
    }

    if (vars.reversed) {
      this.reversed(true);
    }

    if (vars.paused) {
      this.paused(true);
    }
  }

  var _proto = Animation.prototype;

  _proto.delay = function delay(value) {
    if (value || value === 0) {
      this._delay = value;
      return this;
    }

    return this._delay;
  };

  _proto.duration = function duration(value) {
    var isSetter = arguments.length,
        repeat = this._repeat,
        repeatCycles = repeat > 0 ? repeat * ((isSetter ? value : this._dur) + this._rDelay) : 0;
    return isSetter ? this.totalDuration(repeat < 0 ? value : value + repeatCycles) : this.totalDuration() && this._dur;
  };

  _proto.totalDuration = function totalDuration(value) {
    if (!arguments.length) {
      return this._tDur;
    }

    var repeat = this._repeat,
        isInfinite = (value || this._rDelay) && repeat < 0;
    this._tDur = isInfinite ? 1e20 : value;
    this._dur = isInfinite ? value : (value - repeat * this._rDelay) / (repeat + 1);
    this._dirty = 0;

    _uncache(this.parent);

    return this;
  };

  _proto.totalTime = function totalTime(_totalTime, suppressEvents) {
    _wake();

    if (!arguments.length) {
      return this._tTime;
    }

    var parent = this.parent || this._dp,
        start;

    if (parent && parent.smoothChildTiming && this._ts) {
      start = this._start;
      this._start = parent._time - (this._ts > 0 ? _totalTime / this._ts : ((this._dirty ? this.totalDuration() : this._tDur) - _totalTime) / -this._ts);
      this._end += this._start - start;

      if (!parent._dirty) {
        _uncache(parent);
      }

      while (parent.parent) {
        if (parent.parent._time !== parent._start + (parent._ts > 0 ? parent._tTime / parent._ts : (parent.totalDuration() - parent._tTime) / -parent._ts)) {
          parent.totalTime(parent._tTime, true);
        }

        parent = parent.parent;
      }

      if (!this.parent) {
        _addToTimeline(this._dp, this, this._start - this._delay);
      }
    }

    if (this._tTime !== _totalTime || !this._dur) {
      _lazySafeRender(this, _totalTime, suppressEvents);
    }

    return this;
  };

  _proto.time = function time(value, suppressEvents) {
    return arguments.length ? this.totalTime(value + _elapsedCycleDuration(this), suppressEvents) : this._time;
  };

  _proto.totalProgress = function totalProgress(value, suppressEvents) {
    return arguments.length ? this.totalTime(this.totalDuration() * value, suppressEvents) : this._tTime / this.totalDuration();
  };

  _proto.progress = function progress(value, suppressEvents) {
    return arguments.length ? this.totalTime(this.duration() * value + _elapsedCycleDuration(this), suppressEvents) : this.duration() ? this._time / this._dur : this.ratio;
  };

  _proto.iteration = function iteration(value, suppressEvents) {
    var cycleDuration = this.duration() + this._rDelay;

    return arguments.length ? this.totalTime(this._time + (value - 1) * cycleDuration, suppressEvents) : this._repeat ? ~~(this._tTime / cycleDuration) + 1 : 1;
  };

  _proto.timeScale = function timeScale(value) {
    var prevTS = this._ts;

    if (!arguments.length) {
      return prevTS || this._pauseTS;
    }

    if (!prevTS) {
      this._pauseTS = value;
      return this;
    }

    this._end = this._start + this._tDur / (this._ts = value || _tinyNum);
    return _recacheAncestors(this).totalTime(this._tTime, true);
  };

  _proto.paused = function paused(value) {
    var isPaused = !this._ts;

    if (!arguments.length) {
      return isPaused;
    }

    if (isPaused !== value) {
      if (value) {
        this._pauseTS = this._ts;
        this._pTime = this._tTime || Math.max(-this._delay, this.rawTime());
        this._ts = this._act = 0;
      } else {
        this._ts = this._pauseTS;
        value = this._tTime || this._pTime;

        if (this.progress() === 1) {
          this._tTime -= _tinyNum;
        }

        this.totalTime(value, true);
      }
    }

    return this;
  };

  _proto.startTime = function startTime(value) {
    if (arguments.length) {
      if (this.parent && this.parent._sort) {
        _addToTimeline(this.parent, this, value - this._delay);
      }

      return this;
    }

    return this._start;
  };

  _proto.endTime = function endTime(includeRepeats) {
    return this._start + (_isNotFalse(includeRepeats) ? this.totalDuration() : this.duration()) / Math.abs(this._ts);
  };

  _proto.rawTime = function rawTime(wrapRepeats) {
    var parent = this.parent || this._dp;
    return !parent ? this._tTime : wrapRepeats && (!this._ts || this._repeat && this._time && this.totalProgress() < 1) ? this._tTime % (this._dur + this._rDelay) : !this._ts ? this._tTime : _parentToChildTotalTime(parent.rawTime(wrapRepeats), this);
  };

  _proto.repeat = function repeat(value) {
    if (arguments.length) {
      this._repeat = value;
      return _onUpdateTotalDuration(this);
    }

    return this._repeat;
  };

  _proto.repeatDelay = function repeatDelay(value) {
    if (arguments.length) {
      this._rDelay = value;
      return _onUpdateTotalDuration(this);
    }

    return this._rDelay;
  };

  _proto.yoyo = function yoyo(value) {
    if (arguments.length) {
      this._yoyo = value;
      return this;
    }

    return this._yoyo;
  };

  _proto.seek = function seek(position, suppressEvents) {
    return this.totalTime(_parsePosition(this, position), _isNotFalse(suppressEvents));
  };

  _proto.restart = function restart(includeDelay, suppressEvents) {
    return this.play().totalTime(includeDelay ? -this._delay : 0, _isNotFalse(suppressEvents));
  };

  _proto.play = function play(from, suppressEvents) {
    if (from != null) {
      this.seek(from, suppressEvents);
    }

    return this.reversed(false).paused(false);
  };

  _proto.reverse = function reverse(from, suppressEvents) {
    if (from != null) {
      this.seek(from || this.totalDuration(), suppressEvents);
    }

    return this.reversed(true).paused(false);
  };

  _proto.pause = function pause(atTime, suppressEvents) {
    if (atTime != null) {
      this.seek(atTime, suppressEvents);
    }

    return this.paused(true);
  };

  _proto.resume = function resume() {
    return this.paused(false);
  };

  _proto.reversed = function reversed(value) {
    var ts = this._ts || this._pauseTS;

    if (arguments.length) {
      if (value !== this.reversed()) {
        this[this._ts ? "_ts" : "_pauseTS"] = Math.abs(ts) * (value ? -1 : 1);
        this.totalTime(this._tTime, true);
      }

      return this;
    }

    return ts < 0;
  };

  _proto.invalidate = function invalidate() {
    this._initted = 0;
    return this;
  };

  _proto.isActive = function isActive() {
    var parent = this.parent || this._dp,
        start = this._start,
        rawTime;
    return !parent || this._ts && this._initted && parent.isActive() && (rawTime = parent.rawTime(true)) >= start && rawTime < this.endTime(true) - _tinyNum;
  };

  _proto.eventCallback = function eventCallback(type, callback, params) {
    var vars = this.vars;

    if (arguments.length > 1) {
      if (!callback) {
        delete vars[type];
      } else {
        vars[type] = callback;

        if (params) {
          vars[type + "Params"] = params;
        }

        if (type === "onUpdate") {
          this._onUpdate = callback;
        }
      }

      return this;
    }

    return vars[type];
  };

  _proto.then = function then(onFulfilled) {
    var _this = this;

    if (onFulfilled === void 0) {
      onFulfilled = _emptyFunc;
    }

    return new Promise(function (resolve) {
      _this._prom = function () {
        onFulfilled(_this);
        resolve();
      };
    });
  };

  _proto.kill = function kill() {
    _interrupt(this);
  };

  return Animation;
}();

_setDefaults(Animation.prototype, {
  _time: 0,
  _start: 0,
  _end: 0,
  _tTime: 0,
  _tDur: 0,
  _dirty: 0,
  _repeat: 0,
  _yoyo: false,
  parent: 0,
  _rDelay: 0,
  _ts: 1,
  _dp: 0,
  ratio: 0,
  _zTime: -_tinyNum,
  _prom: 0
});

var Timeline = function (_Animation) {
  _inheritsLoose(Timeline, _Animation);

  function Timeline(vars, time) {
    var _this2;

    if (vars === void 0) {
      vars = {};
    }

    _this2 = _Animation.call(this, vars, time) || this;
    _this2.labels = {};
    _this2.smoothChildTiming = _isNotFalse(vars.smoothChildTiming);
    _this2.autoRemoveChildren = !!vars.autoRemoveChildren;
    _this2._sort = _isNotFalse(vars.sortChildren);
    return _this2;
  }

  var _proto2 = Timeline.prototype;

  _proto2.to = function to(targets, vars, position) {
    new Tween(targets, _parseVars(arguments, 0, this), _parsePosition(this, _isNumber(vars) ? arguments[3] : position));
    return this;
  };

  _proto2.from = function from(targets, vars, position) {
    new Tween(targets, _parseVars(arguments, 1, this), _parsePosition(this, _isNumber(vars) ? arguments[3] : position));
    return this;
  };

  _proto2.fromTo = function fromTo(targets, fromVars, toVars, position) {
    new Tween(targets, _parseVars(arguments, 2, this), _parsePosition(this, _isNumber(fromVars) ? arguments[4] : position));
    return this;
  };

  _proto2.set = function set(targets, vars, position) {
    vars.duration = 0;
    vars.parent = this;

    if (!vars.repeatDelay) {
      vars.repeat = 0;
    }

    vars.immediateRender = !!vars.immediateRender;
    new Tween(targets, vars, _parsePosition(this, position));
    return this;
  };

  _proto2.call = function call(callback, params, position) {
    return _addToTimeline(this, Tween.delayedCall(0, callback, params), _parsePosition(this, position));
  };

  _proto2.staggerTo = function staggerTo(targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams) {
    vars.duration = duration;
    vars.stagger = vars.stagger || stagger;
    vars.onComplete = onCompleteAll;
    vars.onCompleteParams = onCompleteAllParams;
    vars.parent = this;
    new Tween(targets, vars, _parsePosition(this, position));
    return this;
  };

  _proto2.staggerFrom = function staggerFrom(targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams) {
    vars.runBackwards = 1;
    vars.immediateRender = _isNotFalse(vars.immediateRender);
    return this.staggerTo(targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams);
  };

  _proto2.staggerFromTo = function staggerFromTo(targets, duration, fromVars, toVars, stagger, position, onCompleteAll, onCompleteAllParams) {
    toVars.startAt = fromVars;
    toVars.immediateRender = _isNotFalse(toVars.immediateRender);
    return this.staggerTo(targets, duration, toVars, stagger, position, onCompleteAll, onCompleteAllParams);
  };

  _proto2.render = function render(totalTime, suppressEvents, force) {
    var prevTime = this._time,
        tDur = this._dirty ? this.totalDuration() : this._tDur,
        dur = this._dur,
        tTime = totalTime > tDur - _tinyNum && totalTime >= 0 && this !== _globalTimeline ? tDur : totalTime < _tinyNum ? 0 : totalTime,
        crossingStart = this._zTime < 0 !== totalTime < 0 && this._initted,
        time,
        child,
        next,
        iteration,
        cycleDuration,
        prevPaused,
        pauseTween,
        timeScale,
        prevStart,
        prevIteration,
        yoyo;

    if (tTime !== this._tTime || force || crossingStart) {
      if (crossingStart) {
        if (!dur) {
          prevTime = this._zTime;
        }

        if (totalTime || !suppressEvents) {
          this._zTime = totalTime;
        }
      }

      time = tTime;
      prevStart = this._start;
      timeScale = this._ts;
      prevPaused = timeScale === 0;

      if (prevTime !== this._time && dur) {
        time += this._time - prevTime;
      }

      if (this._repeat) {
        yoyo = this._yoyo;
        cycleDuration = dur + this._rDelay;
        time = _round(tTime % cycleDuration);

        if (time > dur || tDur === tTime) {
          time = dur;
        }

        iteration = ~~(tTime / cycleDuration);

        if (iteration && iteration === tTime / cycleDuration) {
          time = dur;
          iteration--;
        }

        prevIteration = ~~(this._tTime / cycleDuration);

        if (prevIteration && prevIteration === this._tTime / cycleDuration) {
          prevIteration--;
        }

        if (yoyo && iteration & 1) {
          time = dur - time;
        }

        if (iteration !== prevIteration && !this._lock) {
          var rewinding = yoyo && prevIteration & 1,
              doesWrap = rewinding === (yoyo && iteration & 1);

          if (iteration < prevIteration) {
            rewinding = !rewinding;
          }

          prevTime = rewinding ? 0 : dur;
          this._lock = 1;
          this.render(prevTime, suppressEvents, !dur)._lock = 0;

          if (!suppressEvents && this.parent) {
            _callback(this, "onRepeat");
          }

          if (prevTime !== this._time || prevPaused !== !this._ts) {
            return this;
          }

          if (doesWrap) {
            this._lock = 2;
            prevTime = rewinding ? dur + 0.0001 : -0.0001;
            this.render(prevTime, true);
          }

          this._lock = 0;

          if (!this._ts && !prevPaused) {
            return this;
          }
        }
      }

      if (this._hasPause && !this._forcing && this._lock < 2) {
        pauseTween = _findNextPauseTween(this, _round(prevTime), _round(time));

        if (pauseTween) {
          tTime -= time - (time = pauseTween._start);
        }
      }

      this._tTime = tTime;
      this._time = time;
      this._act = !timeScale;

      if (!this._initted) {
        this._onUpdate = this.vars.onUpdate;
        this._initted = 1;
      }

      if (!prevTime && time && !suppressEvents) {
        _callback(this, "onStart");
      }

      if (time >= prevTime && totalTime >= 0) {
        child = this._first;

        while (child) {
          next = child._next;

          if ((child._act || time >= child._start) && child._ts && pauseTween !== child) {
            if (child.parent !== this) {
              return this.render(totalTime, suppressEvents, force);
            }

            child.render(child._ts > 0 ? (time - child._start) * child._ts : (child._dirty ? child.totalDuration() : child._tDur) + (time - child._start) * child._ts, suppressEvents, force);

            if (time !== this._time || !this._ts && !prevPaused) {
              pauseTween = 0;
              break;
            }
          }

          child = next;
        }
      } else {
        child = this._last;
        var adjustedTime = totalTime < 0 ? totalTime : time;

        while (child) {
          next = child._prev;

          if ((child._act || adjustedTime <= child._end) && child._ts && pauseTween !== child) {
            if (child.parent !== this) {
              return this.render(totalTime, suppressEvents, force);
            }

            child.render(child._ts > 0 ? (adjustedTime - child._start) * child._ts : (child._dirty ? child.totalDuration() : child._tDur) + (adjustedTime - child._start) * child._ts, suppressEvents, force);

            if (time !== this._time || !this._ts && !prevPaused) {
              pauseTween = 0;
              break;
            }
          }

          child = next;
        }
      }

      if (pauseTween && !suppressEvents) {
        this.pause();
        pauseTween.render(time >= prevTime ? 0 : -_tinyNum)._zTime = time >= prevTime ? 1 : -1;

        if (this._ts) {
          this._start = prevStart;
          return this.render(totalTime, suppressEvents, force);
        }
      }

      if (this._onUpdate && !suppressEvents) {
        _callback(this, "onUpdate", true);
      }

      if (tTime === tDur || !tTime && this._ts < 0) if (prevStart === this._start || Math.abs(timeScale) !== Math.abs(this._ts)) if (!time || tDur >= this.totalDuration()) {
        (totalTime || !dur) && _removeFromParent(this, 1);

        if (!suppressEvents && !(totalTime < 0 && !prevTime)) {
          _callback(this, tTime === tDur ? "onComplete" : "onReverseComplete", true);

          this._prom && tTime === tDur && this._prom();
        }
      }
    }

    return this;
  };

  _proto2.add = function add(child, position) {
    var _this3 = this;

    if (!_isNumber(position)) {
      position = _parsePosition(this, position);
    }

    if (!(child instanceof Animation)) {
      if (_isArray(child)) {
        child.forEach(function (obj) {
          return _this3.add(obj, position);
        });
        return _uncache(this);
      }

      if (_isString(child)) {
        return this.addLabel(child, position);
      }

      if (_isFunction(child)) {
        child = Tween.delayedCall(0, child);
      } else {
        return this;
      }
    }

    return this !== child ? _addToTimeline(this, child, position) : this;
  };

  _proto2.getChildren = function getChildren(nested, tweens, timelines, ignoreBeforeTime) {
    if (nested === void 0) {
      nested = true;
    }

    if (tweens === void 0) {
      tweens = true;
    }

    if (timelines === void 0) {
      timelines = true;
    }

    if (ignoreBeforeTime === void 0) {
      ignoreBeforeTime = -_bigNum;
    }

    var a = [],
        child = this._first;

    while (child) {
      if (child._start >= ignoreBeforeTime) {
        if (child instanceof Tween) {
          if (tweens) {
            a.push(child);
          }
        } else {
          if (timelines) {
            a.push(child);
          }

          if (nested) {
            a.push.apply(a, child.getChildren(true, tweens, timelines));
          }
        }
      }

      child = child._next;
    }

    return a;
  };

  _proto2.getById = function getById(id) {
    var animations = this.getChildren(1, 1, 1),
        i = animations.length;

    while (i--) {
      if (animations[i].vars.id === id) {
        return animations[i];
      }
    }
  };

  _proto2.remove = function remove(child) {
    if (_isString(child)) {
      return this.removeLabel(child);
    }

    if (_isFunction(child)) {
      return this.killTweensOf(child);
    }

    _removeLinkedListItem(this, child);

    if (child === this._recent) {
      this._recent = this._last;
    }

    return _uncache(this);
  };

  _proto2.totalTime = function totalTime(_totalTime2, suppressEvents) {
    if (!arguments.length) {
      return this._tTime;
    }

    this._forcing = 1;

    if (!this.parent && !this._dp && this._ts) {
      this._start = _ticker.time - (this._ts > 0 ? _totalTime2 / this._ts : (this.totalDuration() - _totalTime2) / -this._ts);
    }

    _Animation.prototype.totalTime.call(this, _totalTime2, suppressEvents);

    this._forcing = 0;
    return this;
  };

  _proto2.addLabel = function addLabel(label, position) {
    this.labels[label] = _parsePosition(this, position);
    return this;
  };

  _proto2.removeLabel = function removeLabel(label) {
    delete this.labels[label];
    return this;
  };

  _proto2.addPause = function addPause(position, callback, params) {
    var t = Tween.delayedCall(0, callback || _emptyFunc, params);
    t.data = "isPause";
    this._hasPause = 1;
    return _addToTimeline(this, t, _parsePosition(this, position));
  };

  _proto2.removePause = function removePause(position) {
    var child = this._first;
    position = _parsePosition(this, position);

    while (child) {
      if (child._start === position && child.data === "isPause") {
        _removeFromParent(child);
      }

      child = child._next;
    }
  };

  _proto2.killTweensOf = function killTweensOf(targets, props, onlyActive) {
    var tweens = this.getTweensOf(targets, onlyActive),
        i = tweens.length;

    while (i--) {
      tweens[i].kill(targets, props);
    }

    return this;
  };

  _proto2.getTweensOf = function getTweensOf(targets, onlyActive) {
    var a = [],
        parsedTargets = toArray(targets),
        child = this._first,
        children;

    while (child) {
      if (child instanceof Tween) {
        if (_arrayContainsAny(child._targets, parsedTargets) && (!onlyActive || child.isActive())) {
          a.push(child);
        }
      } else if ((children = child.getTweensOf(parsedTargets, onlyActive)).length) {
        a.push.apply(a, children);
      }

      child = child._next;
    }

    return a;
  };

  _proto2.tweenTo = function tweenTo(position, vars) {
    var tl = this,
        endTime = _parsePosition(tl, position),
        startAt = vars && vars.startAt,
        tween = Tween.to(tl, _setDefaults({
      ease: "none",
      lazy: false,
      time: endTime,
      duration: Math.abs(endTime - (startAt && "time" in startAt ? startAt.time : tl._time)) / tl.timeScale() || _tinyNum,
      onStart: function onStart() {
        tl.pause();
        var duration = Math.abs(endTime - tl._time) / tl.timeScale();

        if (tween._dur !== duration) {
          tween._dur = duration;
          tween.render(tween._time, true, true);
        }

        if (vars && vars.onStart) {
          vars.onStart.apply(tween, vars.onStartParams || []);
        }
      }
    }, vars));

    return tween;
  };

  _proto2.tweenFromTo = function tweenFromTo(fromPosition, toPosition, vars) {
    return this.tweenTo(toPosition, _setDefaults({
      startAt: {
        time: _parsePosition(this, fromPosition)
      }
    }, vars));
  };

  _proto2.recent = function recent() {
    return this._recent;
  };

  _proto2.nextLabel = function nextLabel(afterTime) {
    if (afterTime === void 0) {
      afterTime = this._time;
    }

    return _getLabelInDirection(this, _parsePosition(this, afterTime));
  };

  _proto2.previousLabel = function previousLabel(beforeTime) {
    if (beforeTime === void 0) {
      beforeTime = this._time;
    }

    return _getLabelInDirection(this, _parsePosition(this, beforeTime), 1);
  };

  _proto2.currentLabel = function currentLabel(value) {
    return arguments.length ? this.seek(value, true) : this.previousLabel(this._time + _tinyNum);
  };

  _proto2.shiftChildren = function shiftChildren(amount, adjustLabels, ignoreBeforeTime) {
    if (ignoreBeforeTime === void 0) {
      ignoreBeforeTime = 0;
    }

    var child = this._first,
        labels = this.labels,
        p;

    while (child) {
      if (child._start >= ignoreBeforeTime) {
        child._start += amount;
      }

      child = child._next;
    }

    if (adjustLabels) {
      for (p in labels) {
        if (labels[p] >= ignoreBeforeTime) {
          labels[p] += amount;
        }
      }
    }

    return _uncache(this);
  };

  _proto2.invalidate = function invalidate() {
    var child = this._first;
    this._lock = 0;

    while (child) {
      child.invalidate();
      child = child._next;
    }

    return _Animation.prototype.invalidate.call(this);
  };

  _proto2.clear = function clear(includeLabels) {
    if (includeLabels === void 0) {
      includeLabels = true;
    }

    var child = this._first,
        next;

    while (child) {
      next = child._next;
      this.remove(child);
      child = next;
    }

    this._time = this._tTime = 0;

    if (includeLabels) {
      this.labels = {};
    }

    return _uncache(this);
  };

  _proto2.totalDuration = function totalDuration(value) {
    var max = 0,
        self = this,
        child = self._last,
        prevStart = _bigNum,
        repeat = self._repeat,
        repeatCycles = repeat * self._rDelay || 0,
        isInfinite = repeat < 0,
        prev,
        end;

    if (!arguments.length) {
      if (self._dirty) {
        while (child) {
          prev = child._prev;

          if (child._dirty) {
            child.totalDuration();
          }

          if (child._start > prevStart && self._sort && child._ts && !self._lock) {
            self._lock = 1;

            _addToTimeline(self, child, child._start - child._delay);

            self._lock = 0;
          } else {
            prevStart = child._start;
          }

          if (child._start < 0 && child._ts) {
            max -= child._start;

            if (!self.parent && !self._dp || self.parent && self.parent.smoothChildTiming) {
              self._start += child._start / self._ts;
              self._time -= child._start;
              self._tTime -= child._start;
            }

            self.shiftChildren(-child._start, false, -_bigNum);
            prevStart = 0;
          }

          end = child._end = child._start + child._tDur / Math.abs(child._ts || child._pauseTS);

          if (end > max && child._ts) {
            max = _round(end);
          }

          child = prev;
        }

        self._dur = self === _globalTimeline && self._time > max ? self._time : Math.min(_bigNum, max);
        self._tDur = isInfinite && (self._dur || repeatCycles) ? 1e20 : Math.min(_bigNum, max * (repeat + 1) + repeatCycles);
        self._end = self._start + (self._tDur / Math.abs(self._ts || self._pauseTS) || 0);
        self._dirty = 0;
      }

      return self._tDur;
    }

    return isInfinite ? self : self.timeScale(self.totalDuration() / value);
  };

  Timeline.updateRoot = function updateRoot(time) {
    if (_globalTimeline._ts) {
      _lazySafeRender(_globalTimeline, _parentToChildTotalTime(time, _globalTimeline));
    }

    if (_ticker.frame >= _nextGCFrame) {
      _nextGCFrame += _config.autoSleep || 120;
      var child = _globalTimeline._first;
      if (!child || !child._ts) if (_config.autoSleep && _ticker._listeners.length < 2) {
        while (child && !child._ts) {
          child = child._next;
        }

        if (!child) {
          _ticker.sleep();
        }
      }
    }
  };

  return Timeline;
}(Animation);

_setDefaults(Timeline.prototype, {
  _lock: 0,
  _hasPause: 0,
  _forcing: 0
});

var _addComplexStringPropTween = function _addComplexStringPropTween(target, prop, start, end, setter, stringFilter, funcParam) {
  var pt = new PropTween(this._pt, target, prop, 0, 1, _renderComplexString, null, setter),
      index = 0,
      matchIndex = 0,
      result,
      startNums,
      color,
      endNum,
      chunk,
      startNum,
      hasRandom,
      a;
  pt.b = start;
  pt.e = end;
  start += "";
  end += "";

  if (hasRandom = ~end.indexOf("random(")) {
    end = _replaceRandom(end);
  }

  if (stringFilter) {
    a = [start, end];
    stringFilter(a, target, prop);
    start = a[0];
    end = a[1];
  }

  startNums = start.match(_complexStringNumExp) || [];

  while (result = _complexStringNumExp.exec(end)) {
    endNum = result[0];
    chunk = end.substring(index, result.index);

    if (color) {
      color = (color + 1) % 5;
    } else if (chunk.substr(-5) === "rgba(") {
      color = 1;
    }

    if (endNum !== startNums[matchIndex++]) {
      startNum = parseFloat(startNums[matchIndex - 1]);
      pt._pt = {
        _next: pt._pt,
        p: chunk || matchIndex === 1 ? chunk : ",",
        s: startNum,
        c: endNum.charAt(1) === "=" ? parseFloat(endNum.substr(2)) * (endNum.charAt(0) === "-" ? -1 : 1) : parseFloat(endNum) - startNum,
        m: color && color < 4 ? Math.round : 0
      };
      index = _complexStringNumExp.lastIndex;
    }
  }

  pt.c = index < end.length ? end.substring(index, end.length) : "";
  pt.fp = funcParam;

  if (_relExp.test(end) || hasRandom) {
    pt.e = 0;
  }

  this._pt = pt;
  return pt;
},
    _addPropTween = function _addPropTween(target, prop, start, end, index, targets, modifier, stringFilter, funcParam) {
  if (_isFunction(end)) {
    end = end(index || 0, target, targets);
  }

  var currentValue = target[prop],
      parsedStart = start !== "get" ? start : !_isFunction(currentValue) ? currentValue : funcParam ? target[prop.indexOf("set") || !_isFunction(target["get" + prop.substr(3)]) ? prop : "get" + prop.substr(3)](funcParam) : target[prop](),
      setter = !_isFunction(currentValue) ? _setterPlain : funcParam ? _setterFuncWithParam : _setterFunc,
      pt;

  if (_isString(end)) {
    if (~end.indexOf("random(")) {
      end = _replaceRandom(end);
    }

    if (end.charAt(1) === "=") {
      end = parseFloat(parsedStart) + parseFloat(end.substr(2)) * (end.charAt(0) === "-" ? -1 : 1) + getUnit(parsedStart);
    }
  }

  if (parsedStart !== end) {
    if (!isNaN(parsedStart + end)) {
      pt = new PropTween(this._pt, target, prop, +parsedStart || 0, end - (parsedStart || 0), typeof currentValue === "boolean" ? _renderBoolean : _renderPlain, 0, setter);

      if (funcParam) {
        pt.fp = funcParam;
      }

      if (modifier) {
        pt.modifier(modifier, this, target);
      }

      return this._pt = pt;
    }

    !currentValue && !(prop in target) && _missingPlugin(prop, end);
    return _addComplexStringPropTween.call(this, target, prop, parsedStart, end, setter, stringFilter || _config.stringFilter, funcParam);
  }
},
    _processVars = function _processVars(vars, index, target, targets, tween) {
  if (_isFunction(vars)) {
    vars = _parseFuncOrString(vars, tween, index, target, targets);
  }

  if (!_isObject(vars) || vars.style && vars.nodeType || _isArray(vars)) {
    return _isString(vars) ? _parseFuncOrString(vars, tween, index, target, targets) : vars;
  }

  var copy = {},
      p;

  for (p in vars) {
    copy[p] = _parseFuncOrString(vars[p], tween, index, target, targets);
  }

  return copy;
},
    _checkPlugin = function _checkPlugin(property, vars, tween, index, target, targets) {
  var plugin, pt, ptLookup, i;

  if (_plugins[property] && (plugin = new _plugins[property]()).init(target, plugin.rawVars ? vars[property] : _processVars(vars[property], index, target, targets, tween), tween, index, targets) !== false) {
    tween._pt = pt = new PropTween(tween._pt, target, property, 0, 1, plugin.render, plugin, 0, plugin.priority);

    if (tween !== _quickTween) {
      ptLookup = tween._ptLookup[tween._targets.indexOf(target)];
      i = plugin._props.length;

      while (i--) {
        ptLookup[plugin._props[i]] = pt;
      }
    }
  }

  return plugin;
},
    _overwritingTween,
    _initTween = function _initTween(tween, time) {
  var vars = tween.vars,
      ease = vars.ease,
      startAt = vars.startAt,
      immediateRender = vars.immediateRender,
      lazy = vars.lazy,
      onUpdate = vars.onUpdate,
      onUpdateParams = vars.onUpdateParams,
      callbackScope = vars.callbackScope,
      runBackwards = vars.runBackwards,
      yoyoEase = vars.yoyoEase,
      keyframes = vars.keyframes,
      autoRevert = vars.autoRevert,
      dur = tween._dur,
      prevStartAt = tween._startAt,
      targets = tween._targets,
      parent = tween.parent,
      fullTargets = parent && parent.data === "nested" ? parent.parent._targets : targets,
      autoOverwrite = tween._overwrite === "auto",
      tl = tween.timeline,
      cleanVars,
      i,
      p,
      pt,
      target,
      hasPriority,
      gsData,
      harness,
      plugin,
      ptLookup,
      index,
      harnessVars;

  if (tl && (!keyframes || !ease)) {
    ease = "none";
  }

  tween._ease = _parseEase(ease, _defaults.ease);
  tween._yEase = yoyoEase ? _invertEase(_parseEase(yoyoEase === true ? ease : yoyoEase, _defaults.ease)) : 0;

  if (yoyoEase && tween._yoyo && !tween._repeat) {
    yoyoEase = tween._yEase;
    tween._yEase = tween._ease;
    tween._ease = yoyoEase;
  }

  if (!tl) {
    if (prevStartAt) {
      prevStartAt.render(-1, true).kill();
    }

    if (startAt) {
      _removeFromParent(tween._startAt = Tween.set(targets, _setDefaults({
        data: "isStart",
        overwrite: false,
        parent: parent,
        immediateRender: true,
        lazy: _isNotFalse(lazy),
        startAt: null,
        delay: 0,
        onUpdate: onUpdate,
        onUpdateParams: onUpdateParams,
        callbackScope: callbackScope,
        stagger: 0
      }, startAt)));

      if (immediateRender) {
        if (time > 0) {
          !autoRevert && (tween._startAt = 0);
        } else if (dur) {
          return;
        }
      }
    } else if (runBackwards && dur) {
      if (prevStartAt) {
        !autoRevert && (tween._startAt = 0);
      } else {
        if (time) {
          immediateRender = false;
        }

        _removeFromParent(tween._startAt = Tween.set(targets, _merge(_copyExcluding(vars, _reservedProps), {
          overwrite: false,
          data: "isFromStart",
          lazy: immediateRender && _isNotFalse(lazy),
          immediateRender: immediateRender,
          stagger: 0,
          parent: parent
        })));

        if (!immediateRender) {
          _initTween(tween._startAt, time);

          if (immediateRender) {
            !autoRevert && (tween._startAt = 0);
          }
        } else if (!time) {
          return;
        }
      }
    }

    cleanVars = _copyExcluding(vars, _reservedProps);
    tween._pt = 0;
    harness = targets[0] ? _getCache(targets[0]).harness : 0;
    harnessVars = harness && vars[harness.prop];

    for (i = 0; i < targets.length; i++) {
      target = targets[i];
      gsData = target._gsap || _harness(targets)[i]._gsap;
      tween._ptLookup[i] = ptLookup = {};

      if (_lazyLookup[gsData.id]) {
        _lazyRender();
      }

      index = fullTargets === targets ? i : fullTargets.indexOf(target);

      if (harness && (plugin = new harness()).init(target, harnessVars || cleanVars, tween, index, fullTargets) !== false) {
        tween._pt = pt = new PropTween(tween._pt, target, plugin.name, 0, 1, plugin.render, plugin, 0, plugin.priority);

        plugin._props.forEach(function (name) {
          ptLookup[name] = pt;
        });

        if (plugin.priority) {
          hasPriority = 1;
        }
      }

      if (!harness || harnessVars) {
        for (p in cleanVars) {
          if (_plugins[p] && (plugin = _checkPlugin(p, cleanVars, tween, index, target, fullTargets))) {
            if (plugin.priority) {
              hasPriority = 1;
            }
          } else {
            ptLookup[p] = pt = _addPropTween.call(tween, target, p, "get", cleanVars[p], index, fullTargets, 0, vars.stringFilter);
          }
        }
      }

      if (tween._op && tween._op[i]) {
        tween.kill(target, tween._op[i]);
      }

      if (autoOverwrite) {
        _overwritingTween = tween;

        _globalTimeline.killTweensOf(target, ptLookup, true);

        _overwritingTween = 0;
      }

      if (tween._pt && (_isNotFalse(lazy) && dur || lazy && !dur)) {
        _lazyLookup[gsData.id] = 1;
      }
    }

    if (hasPriority) {
      _sortPropTweensByPriority(tween);
    }

    if (tween._onInit) {
      tween._onInit(tween);
    }
  }

  tween._from = !tl && !!vars.runBackwards;
  tween._onUpdate = onUpdate;
  tween._initted = 1;
},
    _addAliasesToVars = function _addAliasesToVars(targets, vars) {
  var harness = targets[0] ? _getCache(targets[0]).harness : 0,
      propertyAliases = harness && harness.aliases,
      copy,
      p,
      i,
      aliases;

  if (!propertyAliases) {
    return vars;
  }

  copy = _merge({}, vars);

  for (p in propertyAliases) {
    if (p in copy) {
      aliases = propertyAliases[p].split(",");
      i = aliases.length;

      while (i--) {
        copy[aliases[i]] = copy[p];
      }
    }
  }

  return copy;
},
    _parseFuncOrString = function _parseFuncOrString(value, tween, i, target, targets) {
  return _isFunction(value) ? value.call(tween, i, target, targets) : _isString(value) && ~value.indexOf("random(") ? _replaceRandom(value) : value;
},
    _staggerTweenProps = _callbackNames + ",repeat,repeatDelay,yoyo,yoyoEase",
    _staggerPropsToSkip = (_staggerTweenProps + ",id,stagger,delay,duration").split(",");

var Tween = function (_Animation2) {
  _inheritsLoose(Tween, _Animation2);

  function Tween(targets, vars, time) {
    var _this4;

    if (typeof vars === "number") {
      time.duration = vars;
      vars = time;
      time = null;
    }

    _this4 = _Animation2.call(this, _inheritDefaults(vars), time) || this;
    var _this4$vars = _this4.vars,
        duration = _this4$vars.duration,
        delay = _this4$vars.delay,
        immediateRender = _this4$vars.immediateRender,
        stagger = _this4$vars.stagger,
        overwrite = _this4$vars.overwrite,
        keyframes = _this4$vars.keyframes,
        defaults = _this4$vars.defaults,
        parsedTargets = toArray(targets),
        tl,
        i,
        copy,
        l,
        p,
        curTarget,
        staggerFunc,
        staggerVarsToMerge;
    _this4._targets = parsedTargets.length ? _harness(parsedTargets) : _warn("GSAP target " + targets + " not found. https://greensock.com", !_config.nullTargetWarn) || [{}];
    _this4._ptLookup = [];
    _this4._overwrite = overwrite;

    if (keyframes || stagger || _isFuncOrString(duration) || _isFuncOrString(delay)) {
      vars = _this4.vars;
      tl = _this4.timeline = new Timeline({
        data: "nested",
        defaults: defaults || {}
      });
      tl.kill();
      tl.parent = _assertThisInitialized(_this4);

      if (keyframes) {
        _setDefaults(tl.vars.defaults, {
          ease: "none"
        });

        keyframes.forEach(function (frame) {
          return tl.to(parsedTargets, frame, ">");
        });
      } else {
        l = parsedTargets.length;
        staggerFunc = stagger ? distribute(stagger) : _emptyFunc;

        if (_isObject(stagger)) {
          for (p in stagger) {
            if (~_staggerTweenProps.indexOf(p)) {
              if (!staggerVarsToMerge) {
                staggerVarsToMerge = {};
              }

              staggerVarsToMerge[p] = stagger[p];
            }
          }
        }

        for (i = 0; i < l; i++) {
          copy = {};

          for (p in vars) {
            if (_staggerPropsToSkip.indexOf(p) < 0) {
              copy[p] = vars[p];
            }
          }

          copy.stagger = 0;

          if (staggerVarsToMerge) {
            _merge(copy, staggerVarsToMerge);
          }

          if (vars.yoyoEase && !vars.repeat) {
            copy.yoyoEase = vars.yoyoEase;
          }

          curTarget = parsedTargets[i];
          copy.duration = +_parseFuncOrString(duration, _assertThisInitialized(_this4), i, curTarget, parsedTargets);
          copy.delay = (+_parseFuncOrString(delay, _assertThisInitialized(_this4), i, curTarget, parsedTargets) || 0) - _this4._delay;

          if (!stagger && l === 1 && copy.delay) {
            _this4._delay = delay = copy.delay;
            _this4._start += delay;
            copy.delay = 0;
          }

          tl.to(curTarget, copy, staggerFunc(i, curTarget, parsedTargets));
        }

        duration = delay = 0;
      }

      duration || _this4.duration(duration = tl.duration());
    } else {
      _this4.timeline = 0;
    }

    if (overwrite === true) {
      _overwritingTween = _assertThisInitialized(_this4);

      _globalTimeline.killTweensOf(parsedTargets);

      _overwritingTween = 0;
    }

    if (immediateRender || !duration && !keyframes && _this4._start === _this4.parent._time && _isNotFalse(immediateRender) && _hasNoPausedAncestors(_assertThisInitialized(_this4)) && _this4.parent.data !== "nested") {
      _this4._tTime = -_tinyNum;

      _this4.render(Math.max(0, -delay));
    }

    return _this4;
  }

  var _proto3 = Tween.prototype;

  _proto3.render = function render(totalTime, suppressEvents, force) {
    var prevTime = this._time,
        tDur = this._tDur,
        dur = this._dur,
        tTime = totalTime > tDur - _tinyNum && totalTime >= 0 ? tDur : totalTime < _tinyNum ? 0 : totalTime,
        time,
        pt,
        iteration,
        cycleDuration,
        prevIteration,
        isYoyo,
        ratio,
        timeline,
        yoyoEase;

    if (!dur) {
      _renderZeroDurationTween(this, totalTime, suppressEvents, force);
    } else if (tTime !== this._tTime || force || this._startAt && this._zTime < 0 !== totalTime < 0) {
      time = tTime;
      timeline = this.timeline;

      if (this._repeat) {
        cycleDuration = dur + this._rDelay;
        time = _round(tTime % cycleDuration);

        if (time > dur) {
          time = dur;
        }

        iteration = ~~(tTime / cycleDuration);

        if (iteration && iteration === tTime / cycleDuration) {
          time = dur;
          iteration--;
        }

        isYoyo = this._yoyo && iteration & 1;

        if (isYoyo) {
          yoyoEase = this._yEase;
          time = dur - time;
        }

        prevIteration = ~~(this._tTime / cycleDuration);

        if (prevIteration && prevIteration === this._tTime / cycleDuration) {
          prevIteration--;
        }

        if (time === prevTime && !force) {
          return this;
        }

        if (iteration !== prevIteration) {
          if (this.vars.repeatRefresh && !this._lock) {
            this._lock = 1;
            this.render(cycleDuration * iteration, true).invalidate()._lock = 0;
          }
        }
      }

      if (!this._initted && _attemptInitTween(this, time, force, suppressEvents)) {
        return this;
      }

      this._tTime = tTime;
      this._time = time;

      if (!this._act && this._ts) {
        this._act = 1;
        this._lazy = 0;
      }

      this.ratio = ratio = (yoyoEase || this._ease)(time / dur);

      if (this._from) {
        this.ratio = ratio = 1 - ratio;
      }

      if (!prevTime && time && !suppressEvents) {
        _callback(this, "onStart");
      }

      pt = this._pt;

      while (pt) {
        pt.r(ratio, pt.d);
        pt = pt._next;
      }

      timeline && timeline.render(totalTime < 0 ? totalTime : !time && isYoyo ? -_tinyNum : timeline._dur * ratio, suppressEvents, force) || this._startAt && (this._zTime = totalTime);

      if (this._onUpdate && !suppressEvents) {
        if (totalTime < 0 && this._startAt) {
          this._startAt.render(totalTime, true, force);
        }

        _callback(this, "onUpdate");
      }

      if (this._repeat) if (iteration !== prevIteration && this.vars.onRepeat && !suppressEvents && this.parent) {
        _callback(this, "onRepeat");
      }

      if ((tTime === tDur || !tTime) && this._tTime === tTime) {
        if (totalTime < 0 && this._startAt && !this._onUpdate) {
          this._startAt.render(totalTime, true, force);
        }

        (totalTime || !dur) && (tTime || this._ts < 0) && _removeFromParent(this, 1);

        if (!suppressEvents && !(totalTime < 0 && !prevTime)) {
          _callback(this, tTime === tDur ? "onComplete" : "onReverseComplete", true);

          this._prom && tTime === tDur && this._prom();
        }
      }
    }

    return this;
  };

  _proto3.targets = function targets() {
    return this._targets;
  };

  _proto3.invalidate = function invalidate() {
    this._pt = this._op = this._startAt = this._onUpdate = this._act = this._lazy = 0;
    this._ptLookup = [];

    if (this.timeline) {
      this.timeline.invalidate();
    }

    return _Animation2.prototype.invalidate.call(this);
  };

  _proto3.kill = function kill(targets, vars) {
    if (vars === void 0) {
      vars = "all";
    }

    if (_overwritingTween === this) {
      return _overwritingTween;
    }

    if (!targets && (!vars || vars === "all")) {
      if (this.parent) {
        this._lazy = 0;
        return _interrupt(this);
      }
    }

    if (this.timeline) {
      this.timeline.killTweensOf(targets, vars);
      return this;
    }

    var parsedTargets = this._targets,
        killingTargets = targets ? toArray(targets) : parsedTargets,
        propTweenLookup = this._ptLookup,
        firstPT = this._pt,
        overwrittenProps,
        curLookup,
        curOverwriteProps,
        props,
        p,
        pt,
        i;

    if ((!vars || vars === "all") && _arraysMatch(parsedTargets, killingTargets)) {
      return _interrupt(this);
    }

    overwrittenProps = this._op = this._op || [];

    if (vars !== "all") {
      if (_isString(vars)) {
        p = {};

        _forEachName(vars, function (name) {
          return p[name] = 1;
        });

        vars = p;
      }

      vars = _addAliasesToVars(parsedTargets, vars);
    }

    i = parsedTargets.length;

    while (i--) {
      if (~killingTargets.indexOf(parsedTargets[i])) {
        curLookup = propTweenLookup[i];

        if (vars === "all") {
          overwrittenProps[i] = vars;
          props = curLookup;
          curOverwriteProps = {};
        } else {
          curOverwriteProps = overwrittenProps[i] = overwrittenProps[i] || {};
          props = vars;
        }

        for (p in props) {
          pt = curLookup && curLookup[p];

          if (pt) {
            if (!("kill" in pt.d) || pt.d.kill(p) === true) {
              _removeLinkedListItem(this, pt, "_pt");

              delete curLookup[p];
            }
          }

          if (curOverwriteProps !== "all") {
            curOverwriteProps[p] = 1;
          }
        }
      }
    }

    if (this._initted && !this._pt && firstPT) {
      _interrupt(this);
    }

    return this;
  };

  Tween.to = function to(targets, vars) {
    return new Tween(targets, vars, arguments[2]);
  };

  Tween.from = function from(targets, vars) {
    return new Tween(targets, _parseVars(arguments, 1));
  };

  Tween.delayedCall = function delayedCall(delay, callback, params, scope) {
    return new Tween(callback, 0, {
      immediateRender: false,
      lazy: false,
      overwrite: false,
      delay: delay,
      onComplete: callback,
      onReverseComplete: callback,
      onCompleteParams: params,
      onReverseCompleteParams: params,
      callbackScope: scope
    });
  };

  Tween.fromTo = function fromTo(targets, fromVars, toVars) {
    return new Tween(targets, _parseVars(arguments, 2));
  };

  Tween.set = function set(targets, vars) {
    vars.duration = 0;

    if (!vars.repeatDelay) {
      vars.repeat = 0;
    }

    return new Tween(targets, vars);
  };

  Tween.killTweensOf = function killTweensOf(targets, props, onlyActive) {
    return _globalTimeline.killTweensOf(targets, props, onlyActive);
  };

  return Tween;
}(Animation);

_setDefaults(Tween.prototype, {
  _targets: [],
  _initted: 0,
  _lazy: 0,
  _startAt: 0,
  _op: 0,
  _onInit: 0
});

_forEachName("staggerTo,staggerFrom,staggerFromTo", function (name) {
  Tween[name] = function () {
    var tl = new Timeline(),
        params = toArray(arguments);
    params.splice(name === "staggerFromTo" ? 5 : 4, 0, 0);
    return tl[name].apply(tl, params);
  };
});

var _setterPlain = function _setterPlain(target, property, value) {
  return target[property] = value;
},
    _setterFunc = function _setterFunc(target, property, value) {
  return target[property](value);
},
    _setterFuncWithParam = function _setterFuncWithParam(target, property, value, data) {
  return target[property](data.fp, value);
},
    _setterAttribute = function _setterAttribute(target, property, value) {
  return target.setAttribute(property, value);
},
    _getSetter = function _getSetter(target, property) {
  return _isFunction(target[property]) ? _setterFunc : _isUndefined(target[property]) && target.setAttribute ? _setterAttribute : _setterPlain;
},
    _renderPlain = function _renderPlain(ratio, data) {
  return data.set(data.t, data.p, ~~((data.s + data.c * ratio) * 10000) / 10000, data);
},
    _renderBoolean = function _renderBoolean(ratio, data) {
  return data.set(data.t, data.p, !!(data.s + data.c * ratio), data);
},
    _renderComplexString = function _renderComplexString(ratio, data) {
  var pt = data._pt,
      s = "";

  if (!ratio && data.b) {
    s = data.b;
  } else if (ratio === 1 && data.e) {
    s = data.e;
  } else {
    while (pt) {
      s = pt.p + (pt.m ? pt.m(pt.s + pt.c * ratio) : ~~((pt.s + pt.c * ratio) * 10000) / 10000) + s;
      pt = pt._next;
    }

    s += data.c;
  }

  data.set(data.t, data.p, s, data);
},
    _renderPropTweens = function _renderPropTweens(ratio, data) {
  var pt = data._pt;

  while (pt) {
    pt.r(ratio, pt.d);
    pt = pt._next;
  }
},
    _addPluginModifier = function _addPluginModifier(modifier, tween, target, property) {
  var pt = this._pt,
      next;

  while (pt) {
    next = pt._next;

    if (pt.p === property) {
      pt.modifier(modifier, tween, target);
    }

    pt = next;
  }
},
    _killPropTweensOf = function _killPropTweensOf(property) {
  var pt = this._pt,
      hasNonDependentRemaining,
      next;

  while (pt) {
    next = pt._next;

    if (pt.p === property && !pt.op || pt.op === property) {
      _removeLinkedListItem(this, pt, "_pt");
    } else if (!pt.dep) {
      hasNonDependentRemaining = 1;
    }

    pt = next;
  }

  return !hasNonDependentRemaining;
},
    _setterWithModifier = function _setterWithModifier(target, property, value, data) {
  data.mSet(target, property, data.m.call(data.tween, value, data.mt), data);
},
    _sortPropTweensByPriority = function _sortPropTweensByPriority(parent) {
  var pt = parent._pt,
      next,
      pt2,
      first,
      last;

  while (pt) {
    next = pt._next;
    pt2 = first;

    while (pt2 && pt2.pr > pt.pr) {
      pt2 = pt2._next;
    }

    if (pt._prev = pt2 ? pt2._prev : last) {
      pt._prev._next = pt;
    } else {
      first = pt;
    }

    if (pt._next = pt2) {
      pt2._prev = pt;
    } else {
      last = pt;
    }

    pt = next;
  }

  parent._pt = first;
};

var PropTween = function () {
  function PropTween(next, target, prop, start, change, renderer, data, setter, priority) {
    this.t = target;
    this.s = start;
    this.c = change;
    this.p = prop;
    this.r = renderer || _renderPlain;
    this.d = data || this;
    this.set = setter || _setterPlain;
    this.pr = priority || 0;
    this._next = next;

    if (next) {
      next._prev = this;
    }
  }

  var _proto4 = PropTween.prototype;

  _proto4.modifier = function modifier(func, tween, target) {
    this.mSet = this.mSet || this.set;
    this.set = _setterWithModifier;
    this.m = func;
    this.mt = target;
    this.tween = tween;
  };

  return PropTween;
}();

_forEachName(_callbackNames + ",parent,duration,ease,delay,overwrite,runBackwards,startAt,yoyo,immediateRender,repeat,repeatDelay,data,paused,reversed,lazy,callbackScope,stringFilter,id,yoyoEase,stagger,inherit,repeatRefresh,keyframes,autoRevert", function (name) {
  _reservedProps[name] = 1;
  if (name.substr(0, 2) === "on") _reservedProps[name + "Params"] = 1;
});

_globals.TweenMax = _globals.TweenLite = Tween;
_globals.TimelineLite = _globals.TimelineMax = Timeline;
_globalTimeline = new Timeline({
  sortChildren: false,
  defaults: _defaults,
  autoRemoveChildren: true,
  id: "root"
});
_config.stringFilter = _colorStringFilter;
var gsap = {
  registerPlugin: function registerPlugin() {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    args.forEach(function (config) {
      return _createPlugin(config);
    });
  },
  timeline: function timeline(vars) {
    return new Timeline(vars);
  },
  getTweensOf: function getTweensOf(targets, onlyActive) {
    return _globalTimeline.getTweensOf(targets, onlyActive);
  },
  getProperty: function getProperty(target, property, unit, uncache) {
    if (_isString(target)) {
      target = toArray(target)[0];
    }

    var getter = _getCache(target || {}).get,
        format = unit ? _passThrough : _numericIfPossible;

    if (unit === "native") {
      unit = "";
    }

    return !target ? target : !property ? function (property, unit, uncache) {
      return format((_plugins[property] && _plugins[property].get || getter)(target, property, unit, uncache));
    } : format((_plugins[property] && _plugins[property].get || getter)(target, property, unit, uncache));
  },
  quickSetter: function quickSetter(target, property, unit) {
    target = toArray(target);

    if (target.length > 1) {
      var setters = target.map(function (t) {
        return gsap.quickSetter(t, property, unit);
      }),
          l = setters.length;
      return function (value) {
        var i = l;

        while (i--) {
          setters[i](value);
        }
      };
    }

    target = target[0] || {};

    var Plugin = _plugins[property],
        cache = _getCache(target),
        setter = Plugin ? function (value) {
      var p = new Plugin();
      _quickTween._pt = 0;
      p.init(target, unit ? value + unit : value, _quickTween, 0, [target]);
      p.render(1, p);
      _quickTween._pt && _renderPropTweens(1, _quickTween);
    } : cache.set(target, property);

    return Plugin ? setter : function (value) {
      return setter(target, property, unit ? value + unit : value, cache, 1);
    };
  },
  isTweening: function isTweening(targets) {
    return _globalTimeline.getTweensOf(targets, true).length > 0;
  },
  defaults: function defaults(value) {
    if (value && value.ease) {
      value.ease = _parseEase(value.ease, _defaults.ease);
    }

    return _mergeDeep(_defaults, value || {});
  },
  config: function config(value) {
    return _mergeDeep(_config, value || {});
  },
  registerEffect: function registerEffect(_ref) {
    var name = _ref.name,
        effect = _ref.effect,
        plugins = _ref.plugins,
        defaults = _ref.defaults,
        extendTimeline = _ref.extendTimeline;
    (plugins || "").split(",").forEach(function (pluginName) {
      return pluginName && !_plugins[pluginName] && !_globals[pluginName] && _warn(name + " effect requires " + pluginName + " plugin.");
    });

    _effects[name] = function (targets, vars) {
      return effect(toArray(targets), _setDefaults(vars || {}, defaults));
    };

    if (extendTimeline) {
      Timeline.prototype[name] = function (targets, vars, position) {
        return this.add(_effects[name](targets, _isObject(vars) ? vars : (position = vars) && {}), position);
      };
    }
  },
  registerEase: function registerEase(name, ease) {
    _easeMap[name] = _parseEase(ease);
  },
  parseEase: function parseEase(ease, defaultEase) {
    return arguments.length ? _parseEase(ease, defaultEase) : _easeMap;
  },
  getById: function getById(id) {
    return _globalTimeline.getById(id);
  },
  exportRoot: function exportRoot(vars, includeDelayedCalls) {
    if (vars === void 0) {
      vars = {};
    }

    var tl = new Timeline(vars),
        child,
        next;
    tl.smoothChildTiming = _isNotFalse(vars.smoothChildTiming);

    _globalTimeline.remove(tl);

    tl._dp = 0;
    tl._time = tl._tTime = _globalTimeline._time;
    child = _globalTimeline._first;

    while (child) {
      next = child._next;

      if (includeDelayedCalls || !(!child._dur && child instanceof Tween && child.vars.onComplete === child._targets[0])) {
        _addToTimeline(tl, child, child._start - child._delay);
      }

      child = next;
    }

    _addToTimeline(_globalTimeline, tl, 0);

    return tl;
  },
  utils: {
    wrap: wrap,
    wrapYoyo: wrapYoyo,
    distribute: distribute,
    random: random,
    snap: snap,
    normalize: normalize,
    getUnit: getUnit,
    clamp: clamp,
    splitColor: splitColor,
    toArray: toArray,
    mapRange: mapRange,
    pipe: pipe,
    unitize: unitize,
    interpolate: interpolate
  },
  install: _install,
  effects: _effects,
  ticker: _ticker,
  updateRoot: Timeline.updateRoot,
  plugins: _plugins,
  globalTimeline: _globalTimeline,
  core: {
    PropTween: PropTween,
    globals: _addGlobal,
    Tween: Tween,
    Timeline: Timeline,
    Animation: Animation,
    getCache: _getCache
  }
};

_forEachName("to,from,fromTo,delayedCall,set,killTweensOf", function (name) {
  return gsap[name] = Tween[name];
});

_ticker.add(Timeline.updateRoot);

_quickTween = gsap.to({}, {
  duration: 0
});

var _addModifiers = function _addModifiers(tween, modifiers) {
  var targets = tween._targets,
      p,
      i,
      pt;

  for (p in modifiers) {
    i = targets.length;

    while (i--) {
      pt = tween._ptLookup[i][p];

      if (pt) {
        if (pt.d.modifier) {
          pt.d.modifier(modifiers[p], tween, targets[i], p);
        }
      }
    }
  }
},
    _buildModifierPlugin = function _buildModifierPlugin(name, modifier) {
  return {
    name: name,
    rawVars: 1,
    init: function init(target, vars, tween) {
      tween._onInit = function (tween) {
        var temp, p;

        if (_isString(vars)) {
          temp = {};

          _forEachName(vars, function (name) {
            return temp[name] = 1;
          });

          vars = temp;
        }

        if (modifier) {
          temp = {};

          for (p in vars) {
            temp[p] = modifier(vars[p]);
          }

          vars = temp;
        }

        _addModifiers(tween, vars);
      };
    }
  };
};

gsap.registerPlugin({
  name: "attr",
  init: function init(target, vars, tween, index, targets) {
    for (var p in vars) {
      this.add(target, "setAttribute", (target.getAttribute(p) || 0) + "", vars[p], index, targets, 0, 0, p);

      this._props.push(p);
    }
  }
}, {
  name: "endArray",
  init: function init(target, value) {
    var i = value.length;

    while (i--) {
      this.add(target, i, target[i], value[i]);
    }
  }
}, _buildModifierPlugin("roundProps", _roundModifier), _buildModifierPlugin("modifiers"), _buildModifierPlugin("snap", snap));
Tween.version = Timeline.version = gsap.version = "3.0.1";
_coreReady = 1;

if (_windowExists()) {
  _wake();
}

var _win$1,
    _doc$1,
    _docElement,
    _pluginInitted,
    _tempDiv,
    _tempDivStyler,
    _recentSetterPlugin,
    _windowExists$1 = function _windowExists() {
  return typeof window !== "undefined";
},
    _transformProps = {},
    _RAD2DEG = 180 / Math.PI,
    _DEG2RAD = Math.PI / 180,
    _atan2 = Math.atan2,
    _bigNum$1 = 1e8,
    _capsExp = /([A-Z])/g,
    _numWithUnitExp = /[-+=\.]*\d+[\.e-]*\d*[a-z%]*/g,
    _horizontalExp = /(?:left|right|width|margin|padding|x)/i,
    _complexExp = /[\s,\(]\S/,
    _propertyAliases = {
  autoAlpha: "opacity,visibility",
  scale: "scaleX,scaleY",
  alpha: "opacity"
},
    _renderCSSProp = function _renderCSSProp(ratio, data) {
  return data.set(data.t, data.p, ~~((data.s + data.c * ratio) * 10000) / 10000 + data.u, data);
},
    _renderPropWithEnd = function _renderPropWithEnd(ratio, data) {
  return data.set(data.t, data.p, ratio === 1 ? data.e : ~~((data.s + data.c * ratio) * 10000) / 10000 + data.u, data);
},
    _renderCSSPropWithBeginning = function _renderCSSPropWithBeginning(ratio, data) {
  return data.set(data.t, data.p, ratio ? ~~((data.s + data.c * ratio) * 10000) / 10000 + data.u : data.b, data);
},
    _renderRoundedCSSProp = function _renderRoundedCSSProp(ratio, data) {
  var value = data.s + data.c * ratio;
  data.set(data.t, data.p, ~~(value + (value < 0 ? -.5 : .5)) + data.u, data);
},
    _renderNonTweeningValue = function _renderNonTweeningValue(ratio, data) {
  return data.set(data.t, data.p, ratio ? data.e : data.b, data);
},
    _renderNonTweeningValueOnlyAtEnd = function _renderNonTweeningValueOnlyAtEnd(ratio, data) {
  return data.set(data.t, data.p, ratio !== 1 ? data.b : data.e, data);
},
    _setterCSSStyle = function _setterCSSStyle(target, property, value) {
  return target.style[property] = value;
},
    _setterCSSProp = function _setterCSSProp(target, property, value) {
  return target.style.setProperty(property, value);
},
    _setterTransform = function _setterTransform(target, property, value) {
  return target._gsap[property] = value;
},
    _setterScale = function _setterScale(target, property, value) {
  return target._gsap.scaleX = target._gsap.scaleY = value;
},
    _setterScaleWithRender = function _setterScaleWithRender(target, property, value, data, ratio) {
  var cache = target._gsap;
  cache.scaleX = cache.scaleY = value;
  cache.renderTransform(ratio, cache);
},
    _setterTransformWithRender = function _setterTransformWithRender(target, property, value, data, ratio) {
  var cache = target._gsap;
  cache[property] = value;
  cache.renderTransform(ratio, cache);
},
    _transformProp = "transform",
    _transformOriginProp = _transformProp + "Origin",
    _supports3D,
    _createElement = function _createElement(type, ns) {
  var e = _doc$1.createElementNS ? _doc$1.createElementNS((ns || "http://www.w3.org/1999/xhtml").replace(/^https/, "http"), type) : _doc$1.createElement(type);
  return e.style ? e : _doc$1.createElement(type);
},
    _getComputedProperty = function _getComputedProperty(target, property) {
  var cs = getComputedStyle(target);
  return cs[property] || cs.getPropertyValue(property.replace(_capsExp, "-$1").toLowerCase()) || cs.getPropertyValue(property);
},
    _checkPropPrefix = function _checkPropPrefix(property, element) {
  var e = element || _tempDiv,
      s = e.style,
      i = 5,
      a = "O,Moz,ms,Ms,Webkit".split(",");

  if (property in s) {
    return property;
  }

  property = property.charAt(0).toUpperCase() + property.substr(1);

  while (i-- && !(a[i] + property in s)) {}

  return i < 0 ? null : (i === 3 ? "ms" : i >= 0 ? a[i] : "") + property;
},
    _initCore = function _initCore() {
  if (_windowExists$1()) {
    _win$1 = window;
    _doc$1 = _win$1.document;
    _docElement = _doc$1.documentElement;
    _tempDiv = _createElement("div") || {
      style: {}
    };
    _tempDivStyler = _createElement("div");
    _transformProp = _checkPropPrefix(_transformProp);
    _transformOriginProp = _checkPropPrefix(_transformOriginProp);
    _tempDiv.style.cssText = "border-width:0;line-height:0;position:absolute;padding:0";
    _supports3D = !!_checkPropPrefix("perspective");
    _pluginInitted = 1;
  }
},
    _getBBoxHack = function _getBBoxHack(swapIfPossible) {
  var svg = _createElement("svg", this.ownerSVGElement && this.ownerSVGElement.getAttribute("xmlns") || "http://www.w3.org/2000/svg"),
      oldParent = this.parentNode,
      oldSibling = this.nextSibling,
      oldCSS = this.style.cssText,
      bbox;

  _docElement.appendChild(svg);

  svg.appendChild(this);
  this.style.display = "block";

  if (swapIfPossible) {
    try {
      bbox = this.getBBox();
      this._gsapBBox = this.getBBox;
      this.getBBox = _getBBoxHack;
    } catch (e) {}
  } else if (this._gsapBBox) {
    bbox = this._gsapBBox();
  }

  if (oldSibling) {
    oldParent.insertBefore(this, oldSibling);
  } else {
    oldParent.appendChild(this);
  }

  _docElement.removeChild(svg);

  this.style.cssText = oldCSS;
  return bbox;
},
    _getAttributeFallbacks = function _getAttributeFallbacks(target, attributesArray) {
  var i = attributesArray.length;

  while (i--) {
    if (target.hasAttribute(attributesArray[i])) {
      return target.getAttribute(attributesArray[i]);
    }
  }
},
    _getBBox = function _getBBox(target) {
  var bounds;

  try {
    bounds = target.getBBox();
  } catch (error) {
    bounds = _getBBoxHack.call(target, true);
  }

  return bounds && !bounds.width && !bounds.x && !bounds.y ? {
    x: +_getAttributeFallbacks(target, ["x", "cx", "x1"]),
    y: +_getAttributeFallbacks(target, ["y", "cy", "y1"]),
    width: 0,
    height: 0
  } : bounds;
},
    _isSVG = function _isSVG(e) {
  return !!(e.getCTM && (!e.parentNode || e.ownerSVGElement) && _getBBox(e));
},
    _removeProperty = function _removeProperty(target, property) {
  if (property) {
    var style = target.style;

    if (property in _transformProps) {
      property = _transformProp;
    }

    if (style.removeProperty) {
      if (property.substr(0, 2) === "ms" || property.substr(0, 6) === "webkit") {
        property = "-" + property;
      }

      style.removeProperty(property.replace(_capsExp, "-$1").toLowerCase());
    } else {
      style.removeAttribute(property);
    }
  }
},
    _addNonTweeningPT = function _addNonTweeningPT(plugin, target, property, beginning, end, onlySetAtEnd) {
  var pt = new PropTween(plugin._pt, target, property, 0, 1, onlySetAtEnd ? _renderNonTweeningValueOnlyAtEnd : _renderNonTweeningValue);
  plugin._pt = pt;
  pt.b = beginning;
  pt.e = end;

  plugin._props.push(property);

  return pt;
},
    _nonConvertibleUnits = {
  deg: 1,
  rad: 1,
  turn: 1
},
    _convertToUnit = function _convertToUnit(target, property, value, unit) {
  var curValue = parseFloat(value),
      curUnit = (value + "").substr((curValue + "").length) || "px",
      style = _tempDiv.style,
      horizontal = _horizontalExp.test(property),
      isRootSVG = target.tagName.toLowerCase() === "svg",
      measureProperty = (isRootSVG ? "client" : "offset") + (horizontal ? "Width" : "Height"),
      amount = 100,
      toPixels = unit === "px",
      px,
      parent,
      cache,
      isSVG;

  if (unit === curUnit || _nonConvertibleUnits[unit] || _nonConvertibleUnits[curUnit]) {
    return curValue;
  }

  isSVG = target.getCTM && _isSVG(target);

  if (unit === "%" && _transformProps[property]) {
    return _round(curValue / (isSVG ? target.getBBox()[horizontal ? "width" : "height"] : target[measureProperty]) * amount);
  }

  style[horizontal ? "width" : "height"] = amount + (toPixels ? curUnit : unit);
  parent = unit === "em" && target.appendChild && !isRootSVG ? target : target.parentNode;

  if (isSVG) {
    parent = (target.ownerSVGElement || {}).parentNode;
  }

  if (!parent || parent === _doc$1 || !parent.appendChild) {
    parent = _doc$1.body;
  }

  cache = parent._gsap;

  if (cache && unit === "%" && cache.width && horizontal && cache.time === _ticker.time) {
    px = cache.width * curValue / amount;
  } else {
    parent.appendChild(_tempDiv);
    px = _tempDiv[measureProperty];
    parent.removeChild(_tempDiv);

    if (horizontal && unit === "%") {
      cache = _getCache(parent);
      cache.time = _ticker.time;
      cache.width = px / curValue * amount;
    }
  }

  return _round(toPixels ? px * curValue / amount : amount / px * curValue);
},
    _get = function _get(target, property, unit, uncache) {
  var value;

  if (!_pluginInitted) {
    _initCore();
  }

  if (property in _propertyAliases) {
    property = _propertyAliases[property];

    if (~property.indexOf(",")) {
      property = property.split(",")[0];
    }
  }

  if (_transformProps[property]) {
    value = _parseTransform(target, uncache);
    value = property !== "transformOrigin" ? value[property] : _firstTwoOnly(_getComputedProperty(target, _transformOriginProp)) + value.zOrigin + "px";
  } else {
    value = target.style[property];

    if (!value || value === "auto" || uncache) {
      value = _getComputedProperty(target, property) || _getProperty(target, property);
    }
  }

  return unit ? _convertToUnit(target, property, value, unit) + unit : value;
},
    _tweenComplexCSSString = function _tweenComplexCSSString(target, prop, start, end) {
  var pt = new PropTween(this._pt, target.style, prop, 0, 1, _renderComplexString),
      index = 0,
      matchIndex = 0,
      a,
      result,
      startValues,
      startNum,
      color,
      startValue,
      endValue,
      endNum,
      chunk,
      endUnit,
      startUnit,
      relative,
      endValues;
  pt.b = start;
  pt.e = end;
  start += "";
  end += "";

  if (end === "auto") {
    target.style[prop] = end;
    end = _getComputedProperty(target, prop) || end;
    target.style[prop] = start;
  }

  a = [start, end];

  _colorStringFilter(a);

  start = a[0];
  end = a[1];
  startValues = start.match(_numWithUnitExp) || [];
  endValues = end.match(_numWithUnitExp) || [];

  if (endValues.length) {
    while (result = _numWithUnitExp.exec(end)) {
      endValue = result[0];
      chunk = end.substring(index, result.index);

      if (color) {
        color = (color + 1) % 5;
      } else if (chunk.substr(-5) === "rgba(") {
        color = 1;
      }

      if (endValue !== (startValue = startValues[matchIndex++] || "")) {
        startNum = parseFloat(startValue) || 0;
        startUnit = startValue.substr((startNum + "").length);
        relative = endValue.charAt(1) === "=" ? +(endValue.charAt(0) + "1") : 0;

        if (relative) {
          endValue = endValue.substr(2);
        }

        endNum = parseFloat(endValue);
        endUnit = endValue.substr((endNum + "").length);
        index = _numWithUnitExp.lastIndex - endUnit.length;

        if (!endUnit) {
          endUnit = endUnit || _config.units[prop] || startUnit;

          if (index === end.length) {
            end += endUnit;
            pt.e += endUnit;
          }
        }

        if (startUnit !== endUnit) {
          startNum = _convertToUnit(target, prop, startValue, endUnit);
        }

        pt._pt = {
          _next: pt._pt,
          p: chunk || matchIndex === 1 ? chunk : ",",
          s: startNum,
          c: relative ? relative * endNum : endNum - startNum,
          m: color && color < 4 ? Math.round : 0
        };
      }
    }

    pt.c = index < end.length ? end.substring(index, end.length) : "";
  } else {
    pt.r = prop === "display" ? _renderNonTweeningValueOnlyAtEnd : _renderNonTweeningValue;
  }

  if (_relExp.test(end)) {
    pt.e = 0;
  }

  this._pt = pt;
  return pt;
},
    _keywordToPercent = {
  top: "0%",
  bottom: "100%",
  left: "0%",
  right: "100%",
  center: "50%"
},
    _convertKeywordsToPercentages = function _convertKeywordsToPercentages(value) {
  var split = value.split(" "),
      x = split[0],
      y = split[1] || "50%";

  if (x === "top" || x === "bottom" || y === "left" || y === "right") {
    split = x;
    x = y;
    y = split;
  }

  split[0] = _keywordToPercent[x] || x;
  split[1] = _keywordToPercent[y] || y;
  return split.join(" ");
},
    _renderClearProps = function _renderClearProps(ratio, data) {
  if (data.tween && data.tween._time === data.tween._dur) {
    var target = data.t,
        style = target.style,
        props = data.u,
        prop,
        clearTransforms,
        i;

    if (props === "all" || props === true) {
      style.cssText = "";
      clearTransforms = 1;
    } else {
      props = props.split(",");
      i = props.length;

      while (--i > -1) {
        prop = props[i];

        if (_transformProps[prop]) {
          clearTransforms = 1;
          prop = prop === "transformOrigin" ? _transformOriginProp : _transformProp;
        }

        _removeProperty(target, prop);
      }
    }

    if (clearTransforms) {
      _removeProperty(target, _transformProp);

      clearTransforms = target._gsap;

      if (clearTransforms) {
        if (clearTransforms.svg) {
          target.removeAttribute("transform");
        }

        delete clearTransforms.x;
      }
    }
  }
},
    _specialProps = {
  clearProps: function clearProps(plugin, target, property, endValue, tween) {
    var pt = plugin._pt = new PropTween(plugin._pt, target, property, 0, 0, _renderClearProps);
    pt.u = endValue;
    pt.pr = -10;
    pt.tween = tween;

    plugin._props.push(property);

    return 1;
  }
},
    _identity2DMatrix = [1, 0, 0, 1, 0, 0],
    _rotationalProperties = {},
    _isNullTransform = function _isNullTransform(value) {
  return value === "matrix(1, 0, 0, 1, 0, 0)" || value === "none" || !value;
},
    _getComputedTransformMatrixAsArray = function _getComputedTransformMatrixAsArray(target) {
  var matrixString = _getComputedProperty(target, _transformProp);

  return _isNullTransform(matrixString) ? _identity2DMatrix : matrixString.substr(7).match(_numExp).map(_round);
},
    _getMatrix = function _getMatrix(target, force2D) {
  var cache = target._gsap,
      style = target.style,
      matrix = _getComputedTransformMatrixAsArray(target),
      parent,
      nextSibling,
      temp,
      addedToDOM;

  if (cache.svg && target.getAttribute("transform")) {
    temp = target.transform.baseVal.consolidate().matrix;
    matrix = [temp.a, temp.b, temp.c, temp.d, temp.e, temp.f];
    return matrix.join(",") === "1,0,0,1,0,0" ? _identity2DMatrix : matrix;
  } else if (matrix === _identity2DMatrix && !target.offsetParent && target !== _docElement && !cache.svg) {
    temp = style.display;
    style.display = "block";
    parent = target.parentNode;

    if (!parent || !target.offsetParent) {
      addedToDOM = 1;
      nextSibling = target.nextSibling;

      _docElement.appendChild(target);
    }

    matrix = _getComputedTransformMatrixAsArray(target);

    if (temp) {
      style.display = temp;
    } else {
      _removeProperty(target, "display");
    }

    if (addedToDOM) {
      if (nextSibling) {
        parent.insertBefore(target, nextSibling);
      } else if (parent) {
        parent.appendChild(target);
      } else {
        _docElement.removeChild(target);
      }
    }
  }

  return force2D && matrix.length > 6 ? [matrix[0], matrix[1], matrix[4], matrix[5], matrix[12], matrix[13]] : matrix;
},
    _applySVGOrigin = function _applySVGOrigin(target, origin, originIsAbsolute, smooth, matrixArray, pluginToAddPropTweensTo) {
  var cache = target._gsap,
      matrix = matrixArray || _getMatrix(target, true),
      xOriginOld = cache.xOrigin || 0,
      yOriginOld = cache.yOrigin || 0,
      xOffsetOld = cache.xOffset || 0,
      yOffsetOld = cache.yOffset || 0,
      a = matrix[0],
      b = matrix[1],
      c = matrix[2],
      d = matrix[3],
      tx = matrix[4],
      ty = matrix[5],
      originSplit = origin.split(" "),
      xOrigin = parseFloat(originSplit[0]) || 0,
      yOrigin = parseFloat(originSplit[1]) || 0,
      bounds,
      determinant,
      x,
      y;

  if (!originIsAbsolute) {
    bounds = _getBBox(target);
    xOrigin = bounds.x + (~originSplit[0].indexOf("%") ? xOrigin / 100 * bounds.width : xOrigin);
    yOrigin = bounds.y + (~(originSplit[1] || originSplit[0]).indexOf("%") ? yOrigin / 100 * bounds.height : yOrigin);
  } else if (matrix !== _identity2DMatrix && (determinant = a * d - b * c)) {
    x = xOrigin * (d / determinant) + yOrigin * (-c / determinant) + (c * ty - d * tx) / determinant;
    y = xOrigin * (-b / determinant) + yOrigin * (a / determinant) - (a * ty - b * tx) / determinant;
    xOrigin = x;
    yOrigin = y;
  }

  if (smooth || smooth !== false && cache.smooth) {
    tx = xOrigin - xOriginOld;
    ty = yOrigin - yOriginOld;
    cache.xOffset += tx * a + ty * c - tx;
    cache.yOffset += tx * b + ty * d - ty;
  } else {
    cache.xOffset = cache.yOffset = 0;
  }

  cache.xOrigin = xOrigin;
  cache.yOrigin = yOrigin;
  cache.smooth = !!smooth;
  cache.origin = origin;
  cache.originIsAbsolute = !!originIsAbsolute;

  if (pluginToAddPropTweensTo) {
    _addNonTweeningPT(pluginToAddPropTweensTo, cache, "xOrigin", xOriginOld, xOrigin);

    _addNonTweeningPT(pluginToAddPropTweensTo, cache, "yOrigin", yOriginOld, yOrigin);

    _addNonTweeningPT(pluginToAddPropTweensTo, cache, "xOffset", xOffsetOld, cache.xOffset);

    _addNonTweeningPT(pluginToAddPropTweensTo, cache, "yOffset", yOffsetOld, cache.yOffset);
  }
},
    _parseTransform = function _parseTransform(target, uncache) {
  var cache = target._gsap || new GSCache(target);

  if ("x" in cache && !uncache) {
    return cache;
  }

  var style = target.style,
      invertedScaleX = cache.scaleX < 0,
      xOrigin = cache.xOrigin || 0,
      yOrigin = cache.yOrigin || 0,
      px = "px",
      deg = "deg",
      origin = _getComputedProperty(target, _transformOriginProp) || "0",
      x,
      y,
      z,
      scaleX,
      scaleY,
      rotation,
      rotationX,
      rotationY,
      skewX,
      skewY,
      perspective,
      matrix,
      angle,
      cos,
      sin,
      a,
      b,
      c,
      d,
      a12,
      a22,
      t1,
      t2,
      t3,
      a13,
      a23,
      a33,
      a42,
      a43,
      a32;
  x = y = z = rotation = rotationX = rotationY = skewX = skewY = perspective = 0;
  scaleX = scaleY = 1;
  cache.svg = !!(target.getCTM && _isSVG(target));
  matrix = _getMatrix(target, cache.svg);

  if (cache.svg) {
    _applySVGOrigin(target, origin, cache.originIsAbsolute, cache.smooth !== false, matrix);
  }

  if (matrix !== _identity2DMatrix) {
    a = matrix[0];
    b = matrix[1];
    c = matrix[2];
    d = matrix[3];
    x = a12 = matrix[4];
    y = a22 = matrix[5];

    if (matrix.length === 6) {
      scaleX = Math.sqrt(a * a + b * b);
      scaleY = Math.sqrt(d * d + c * c);
      rotation = a || b ? _atan2(b, a) * _RAD2DEG : cache.rotation || 0;
      skewX = c || d ? _atan2(c, d) * _RAD2DEG + rotation : cache.skewX || 0;

      if (cache.svg) {
        x -= xOrigin - (xOrigin * a + yOrigin * c);
        y -= yOrigin - (xOrigin * b + yOrigin * d);
      }
    } else {
      a32 = matrix[6];
      a42 = matrix[7];
      a13 = matrix[8];
      a23 = matrix[9];
      a33 = matrix[10];
      a43 = matrix[11];
      x = matrix[12];
      y = matrix[13];
      z = matrix[14];
      angle = _atan2(a32, a33);
      rotationX = angle * _RAD2DEG;

      if (angle) {
        cos = Math.cos(-angle);
        sin = Math.sin(-angle);
        t1 = a12 * cos + a13 * sin;
        t2 = a22 * cos + a23 * sin;
        t3 = a32 * cos + a33 * sin;
        a13 = a12 * -sin + a13 * cos;
        a23 = a22 * -sin + a23 * cos;
        a33 = a32 * -sin + a33 * cos;
        a43 = a42 * -sin + a43 * cos;
        a12 = t1;
        a22 = t2;
        a32 = t3;
      }

      angle = _atan2(-c, a33);
      rotationY = angle * _RAD2DEG;

      if (angle) {
        cos = Math.cos(-angle);
        sin = Math.sin(-angle);
        t1 = a * cos - a13 * sin;
        t2 = b * cos - a23 * sin;
        t3 = c * cos - a33 * sin;
        a43 = d * sin + a43 * cos;
        a = t1;
        b = t2;
        c = t3;
      }

      angle = _atan2(b, a);
      rotation = angle * _RAD2DEG;

      if (angle) {
        cos = Math.cos(angle);
        sin = Math.sin(angle);
        t1 = a * cos + b * sin;
        t2 = a12 * cos + a22 * sin;
        b = b * cos - a * sin;
        a22 = a22 * cos - a12 * sin;
        a = t1;
        a12 = t2;
      }

      if (rotationX && Math.abs(rotationX) + Math.abs(rotation) > 359.9) {
        rotationX = rotation = 0;
        rotationY = 180 - rotationY;
      }

      scaleX = _round(Math.sqrt(a * a + b * b + c * c));
      scaleY = _round(Math.sqrt(a22 * a22 + a32 * a32));
      angle = _atan2(a12, a22);
      skewX = Math.abs(angle) > 0.0002 ? angle * _RAD2DEG : 0;
      perspective = a43 ? 1 / (a43 < 0 ? -a43 : a43) : 0;
    }

    if (cache.svg) {
      matrix = target.getAttribute("transform");
      cache.forceCSS = target.setAttribute("transform", "") || !_isNullTransform(_getComputedProperty(target, _transformProp));
      matrix && target.setAttribute("transform", matrix);
    }
  }

  if (Math.abs(skewX) > 90 && Math.abs(skewX) < 270) {
    if (invertedScaleX) {
      scaleX *= -1;
      skewX += rotation <= 0 ? 180 : -180;
      rotation += rotation <= 0 ? 180 : -180;
    } else {
      scaleY *= -1;
      skewX += skewX <= 0 ? 180 : -180;
    }
  }

  cache.x = ((cache.xPercent = x && Math.round(target.offsetWidth / 2) === Math.round(-x) ? -50 : 0) ? 0 : x) + px;
  cache.y = ((cache.yPercent = y && Math.round(target.offsetHeight / 2) === Math.round(-y) ? -50 : 0) ? 0 : y) + px;
  cache.z = z + px;
  cache.scaleX = _round(scaleX);
  cache.scaleY = _round(scaleY);
  cache.rotation = _round(rotation) + deg;
  cache.rotationX = _round(rotationX) + deg;
  cache.rotationY = _round(rotationY) + deg;
  cache.skewX = skewX + deg;
  cache.skewY = skewY + deg;
  cache.transformPerspective = perspective + px;

  if (cache.zOrigin = parseFloat(origin.split(" ")[2]) || 0) {
    style[_transformOriginProp] = _firstTwoOnly(origin);
  }

  cache.xOffset = cache.yOffset = 0;
  cache.force3D = _config.force3D;
  cache.renderTransform = cache.svg ? _renderSVGTransforms : _supports3D ? _renderCSSTransforms : _renderNon3DTransforms;
  return cache;
},
    _firstTwoOnly = function _firstTwoOnly(value) {
  return (value = value.split(" "))[0] + " " + value[1];
},
    _addPxTranslate = function _addPxTranslate(target, start, value) {
  var unit = getUnit(start);
  return _round(parseFloat(start) + parseFloat(_convertToUnit(target, "x", value + "px", unit))) + unit;
},
    _renderNon3DTransforms = function _renderNon3DTransforms(ratio, cache) {
  cache.z = "0px";
  cache.rotationY = cache.rotationX = "0deg";
  cache.force3D = 0;

  _renderCSSTransforms(ratio, cache);
},
    _zeroDeg = "0deg",
    _zeroPx = "0px",
    _endParenthesis = ") ",
    _renderCSSTransforms = function _renderCSSTransforms(ratio, cache) {
  var _ref = cache || this,
      xPercent = _ref.xPercent,
      yPercent = _ref.yPercent,
      x = _ref.x,
      y = _ref.y,
      z = _ref.z,
      rotation = _ref.rotation,
      rotationY = _ref.rotationY,
      rotationX = _ref.rotationX,
      skewX = _ref.skewX,
      skewY = _ref.skewY,
      scaleX = _ref.scaleX,
      scaleY = _ref.scaleY,
      transformPerspective = _ref.transformPerspective,
      force3D = _ref.force3D,
      target = _ref.target,
      zOrigin = _ref.zOrigin,
      transforms = "",
      use3D = force3D === "auto" && ratio && ratio !== 1 || force3D === true;

  if (zOrigin && (rotationX !== _zeroDeg || rotationY !== _zeroDeg)) {
    var angle = parseFloat(rotationY) * _DEG2RAD,
        a13 = Math.sin(angle),
        a33 = Math.cos(angle),
        cos;

    angle = parseFloat(rotationX) * _DEG2RAD;
    cos = Math.cos(angle);
    x = _addPxTranslate(target, x, a13 * cos * -zOrigin);
    y = _addPxTranslate(target, y, -Math.sin(angle) * -zOrigin);
    z = _addPxTranslate(target, z, a33 * cos * -zOrigin + zOrigin);
  }

  if (xPercent || yPercent) {
    transforms = "translate(" + xPercent + "%, " + yPercent + "%) ";
  }

  if (use3D || x !== _zeroPx || y !== _zeroPx || z !== _zeroPx) {
    transforms += z !== _zeroPx || use3D ? "translate3d(" + x + ", " + y + ", " + z + ") " : "translate(" + x + ", " + y + _endParenthesis;
  }

  if (transformPerspective !== _zeroPx) {
    transforms += "perspective(" + transformPerspective + _endParenthesis;
  }

  if (rotation !== _zeroDeg) {
    transforms += "rotate(" + rotation + _endParenthesis;
  }

  if (rotationY !== _zeroDeg) {
    transforms += "rotateY(" + rotationY + _endParenthesis;
  }

  if (rotationX !== _zeroDeg) {
    transforms += "rotateX(" + rotationX + _endParenthesis;
  }

  if (skewX !== _zeroDeg || skewY !== _zeroDeg) {
    transforms += "skew(" + skewX + ", " + skewY + _endParenthesis;
  }

  if (scaleX !== 1 || scaleY !== 1) {
    transforms += "scale(" + scaleX + ", " + scaleY + _endParenthesis;
  }

  target.style[_transformProp] = transforms || "translate(0, 0)";
},
    _renderSVGTransforms = function _renderSVGTransforms(ratio, cache) {
  var _ref2 = cache || this,
      xPercent = _ref2.xPercent,
      yPercent = _ref2.yPercent,
      x = _ref2.x,
      y = _ref2.y,
      rotation = _ref2.rotation,
      skewX = _ref2.skewX,
      skewY = _ref2.skewY,
      scaleX = _ref2.scaleX,
      scaleY = _ref2.scaleY,
      target = _ref2.target,
      xOrigin = _ref2.xOrigin,
      yOrigin = _ref2.yOrigin,
      xOffset = _ref2.xOffset,
      yOffset = _ref2.yOffset,
      forceCSS = _ref2.forceCSS,
      tx = parseFloat(x),
      ty = parseFloat(y),
      a11,
      a21,
      a12,
      a22,
      temp;

  rotation = parseFloat(rotation);
  skewX = parseFloat(skewX);
  skewY = parseFloat(skewY);

  if (skewY) {
    skewY = parseFloat(skewY);
    skewX += skewY;
    rotation += skewY;
  }

  if (rotation || skewX) {
    rotation *= _DEG2RAD;
    skewX *= _DEG2RAD;
    a11 = Math.cos(rotation) * scaleX;
    a21 = Math.sin(rotation) * scaleX;
    a12 = Math.sin(rotation - skewX) * -scaleY;
    a22 = Math.cos(rotation - skewX) * scaleY;

    if (skewX) {
      skewY *= _DEG2RAD;
      temp = Math.tan(skewX - skewY);
      temp = Math.sqrt(1 + temp * temp);
      a12 *= temp;
      a22 *= temp;

      if (skewY) {
        temp = Math.tan(skewY);
        temp = Math.sqrt(1 + temp * temp);
        a11 *= temp;
        a21 *= temp;
      }
    }

    a11 = _round(a11);
    a21 = _round(a21);
    a12 = _round(a12);
    a22 = _round(a22);
  } else {
    a11 = scaleX;
    a22 = scaleY;
    a21 = a12 = 0;
  }

  if (tx && !~(x + "").indexOf("px") || ty && !~(y + "").indexOf("px")) {
    tx = _convertToUnit(target, "x", x, "px");
    ty = _convertToUnit(target, "y", y, "px");
  }

  if (xOrigin || yOrigin || xOffset || yOffset) {
    tx = _round(tx + xOrigin - (xOrigin * a11 + yOrigin * a12) + xOffset);
    ty = _round(ty + yOrigin - (xOrigin * a21 + yOrigin * a22) + yOffset);
  }

  if (xPercent || yPercent) {
    temp = target.getBBox();
    tx = _round(tx + xPercent / 100 * temp.width);
    ty = _round(ty + yPercent / 100 * temp.height);
  }

  temp = "matrix(" + a11 + "," + a21 + "," + a12 + "," + a22 + "," + tx + "," + ty + ")";
  target.setAttribute("transform", temp);

  if (forceCSS) {
    target.style[_transformProp] = temp;
  }
},
    _addRotationalPropTween = function _addRotationalPropTween(plugin, target, property, startNum, endValue, relative) {
  var cap = 360,
      isString = _isString(endValue),
      endNum = parseFloat(endValue) * (isString && ~endValue.indexOf("rad") ? _RAD2DEG : 1),
      change = relative ? endNum * relative : endNum - startNum,
      finalValue = startNum + change + "deg",
      direction,
      pt;

  if (isString) {
    direction = endValue.split("_")[1];

    if (direction === "short") {
      change %= cap;

      if (change !== change % (cap / 2)) {
        change += change < 0 ? cap : -cap;
      }
    }

    if (direction === "cw" && change < 0) {
      change = (change + cap * _bigNum$1) % cap - ~~(change / cap) * cap;
    } else if (direction === "ccw" && change > 0) {
      change = (change - cap * _bigNum$1) % cap - ~~(change / cap) * cap;
    }
  }

  plugin._pt = pt = new PropTween(plugin._pt, target, property, startNum, change, _renderPropWithEnd);
  pt.e = finalValue;
  pt.u = "deg";

  plugin._props.push(property);

  return pt;
},
    _addRawTransformPTs = function _addRawTransformPTs(plugin, transforms, target) {
  var style = _tempDivStyler.style,
      startCache = target._gsap,
      endCache,
      p,
      startValue,
      endValue,
      startNum,
      endNum,
      startUnit,
      endUnit;
  style.cssText = getComputedStyle(target).cssText + ";position:absolute;display:block;";
  style[_transformProp] = transforms;

  _doc$1.body.appendChild(_tempDivStyler);

  endCache = _parseTransform(_tempDivStyler, 1);

  for (p in _transformProps) {
    startValue = startCache[p];
    endValue = endCache[p];

    if (startValue !== endValue && p !== "perspective") {
      startUnit = getUnit(startValue);
      endUnit = getUnit(endValue);
      startNum = startUnit !== endUnit ? _convertToUnit(target, p, startValue, endUnit) : parseFloat(startValue);
      endNum = parseFloat(endValue);
      plugin._pt = new PropTween(plugin._pt, startCache, p, startNum, endNum - startNum, _renderCSSProp);
      plugin._pt.u = endUnit;

      plugin._props.push(p);
    }
  }

  _doc$1.body.removeChild(_tempDivStyler);
};

var CSSPlugin = {
  name: "css",
  register: _initCore,
  targetTest: function targetTest(target) {
    return target.style && target.nodeType;
  },
  init: function init(target, vars, tween, index, targets) {
    var props = this._props,
        style = target.style,
        startValue,
        endValue,
        endNum,
        startNum,
        type,
        specialProp,
        p,
        startUnit,
        endUnit,
        relative,
        isTransformRelated,
        transformPropTween,
        cache,
        smooth,
        hasPriority;

    if (!_pluginInitted) {
      _initCore();
    }

    for (p in vars) {
      if (p === "autoRound") {
        continue;
      }

      endValue = vars[p];

      if (_plugins[p] && _checkPlugin(p, vars, tween, index, target, targets)) {
        continue;
      }

      type = typeof endValue;
      specialProp = _specialProps[p];

      if (type === "function") {
        endValue = endValue.call(tween, index, target, targets);
        type = typeof endValue;
      }

      if (type === "string" && ~endValue.indexOf("random(")) {
        endValue = _replaceRandom(endValue);
      }

      if (specialProp) {
        if (specialProp(this, target, p, endValue, tween)) {
          hasPriority = 1;
        }
      } else if (p.substr(0, 2) === "--") {
        this.add(style, "setProperty", getComputedStyle(target).getPropertyValue(p) + "", endValue + "", index, targets, 0, 0, p);
      } else {
        startValue = _get(target, p);
        startNum = parseFloat(startValue);
        relative = type === "string" && endValue.charAt(1) === "=" ? +(endValue.charAt(0) + "1") : 0;

        if (relative) {
          endValue = endValue.substr(2);
        }

        endNum = parseFloat(endValue);

        if (p in _propertyAliases) {
          if (p === "autoAlpha") {
            if (startNum === 1 && _get(target, "visibility") === "hidden" && endNum) {
              startNum = 0;
            }

            _addNonTweeningPT(this, style, "visibility", startNum ? "inherit" : "hidden", endNum ? "inherit" : "hidden", !endNum);
          }

          if (p !== "scale") {
            p = _propertyAliases[p];

            if (~p.indexOf(",")) {
              p = p.split(",")[0];
            }
          }
        }

        isTransformRelated = p in _transformProps;

        if (isTransformRelated) {
          if (!transformPropTween) {
            cache = target._gsap;
            smooth = vars.smoothOrigin !== false && cache.smooth;
            transformPropTween = this._pt = new PropTween(this._pt, style, _transformProp, 0, 1, cache.renderTransform, cache);
            transformPropTween.dep = 1;
          }

          if (p === "scale") {
            this._pt = new PropTween(this._pt, target, "scale", startNum, relative ? relative * endNum : endNum - startNum, 0, 0, _setterScale);
            props.push("scale");
            continue;
          } else if (p === "transformOrigin") {
            endValue = _convertKeywordsToPercentages(endValue);

            if (cache.svg) {
              _applySVGOrigin(target, endValue, 0, smooth, 0, this);
            } else {
              endUnit = parseFloat(endValue.split(" ")[2]);

              if (endUnit !== cache.zOrigin) {
                _addNonTweeningPT(this, cache, "zOrigin", cache.zOrigin, endUnit);
              }

              _addNonTweeningPT(this, style, p, _firstTwoOnly(startValue), _firstTwoOnly(endValue));
            }

            continue;
          } else if (p === "svgOrigin") {
            _applySVGOrigin(target, endValue, 1, smooth, 0, this);

            continue;
          } else if (p in _rotationalProperties) {
            _addRotationalPropTween(this, cache, p, startNum, endValue, relative);

            continue;
          } else if (p === "smoothOrigin") {
            _addNonTweeningPT(this, cache, "smooth", cache.smooth, endValue);

            continue;
          } else if (p === "force3D") {
            cache[p] = endValue;
            continue;
          } else if (p === "transform") {
            _addRawTransformPTs(this, endValue, target);

            continue;
          }
        }

        if (isTransformRelated || (endNum || endNum === 0) && (startNum || startNum === 0) && !_complexExp.test(endValue) && p in style) {
          startUnit = (startValue + "").substr((startNum + "").length);
          endUnit = (endValue + "").substr((endNum + "").length) || (p in _config.units ? _config.units[p] : startUnit);

          if (startUnit !== endUnit) {
            startNum = _convertToUnit(target, p, startValue, endUnit);
          }

          this._pt = new PropTween(this._pt, isTransformRelated ? cache : style, p, startNum, relative ? relative * endNum : endNum - startNum, endUnit === "px" && vars.autoRound !== false && !isTransformRelated ? _renderRoundedCSSProp : _renderCSSProp);
          this._pt.u = endUnit || 0;

          if (startUnit !== endUnit) {
            this._pt.b = startValue;
            this._pt.r = _renderCSSPropWithBeginning;
          }
        } else if (!(p in style)) {
          if (p in target) {
            this.add(target, p, target[p], endValue, index, targets);
          } else {
            _missingPlugin("Invalid " + p + " tween " + endValue + ". Missing plugin? gsap.registerPlugin()");

            continue;
          }
        } else {
          _tweenComplexCSSString.call(this, target, p, startValue, endValue);
        }

        props.push(p);
      }
    }

    if (hasPriority) {
      _sortPropTweensByPriority(this);
    }
  },
  get: _get,
  aliases: _propertyAliases,
  getSetter: function getSetter(target, property, plugin) {
    return property in _transformProps && property !== _transformOriginProp && (target._gsap.x || _get(target, "x")) ? plugin && _recentSetterPlugin === plugin ? property === "scale" ? _setterScale : _setterTransform : (_recentSetterPlugin = plugin || {}) && (property === "scale" ? _setterScaleWithRender : _setterTransformWithRender) : target.style && !_isUndefined(target.style[property]) ? _setterCSSStyle : ~property.indexOf("-") ? _setterCSSProp : _getSetter(target, property);
  }
};
gsap.utils.checkPrefix = _checkPropPrefix;

(function (positionAndScale, rotation, others, aliases) {
  var all = _forEachName(positionAndScale + "," + rotation + "," + others, function (name) {
    _transformProps[name] = 1;
  });

  _forEachName(rotation, function (name) {
    _config.units[name] = "deg";
    _rotationalProperties[name] = 1;
  });

  _propertyAliases[all[13]] = positionAndScale + "," + rotation;

  _forEachName(aliases, function (name) {
    var split = name.split(":");
    _propertyAliases[split[1]] = all[split[0]];
  });
})("x,y,z,scale,scaleX,scaleY,xPercent,yPercent", "rotation,rotationX,rotationY,skewX,skewY", "transform,transformOrigin,svgOrigin,force3D,smoothOrigin,transformPerspective", "0:translateX,1:translateY,2:translateZ,8:rotate,8:rotationZ,9:rotateX,10:rotateY");

_forEachName("x,y,z,top,right,bottom,left,width,height,fontSize,padding,margin,perspective", function (name) {
  _config.units[name] = "px";
});

gsap.registerPlugin(CSSPlugin);

var gsapWithCSS = gsap.registerPlugin(CSSPlugin) || gsap;

class Quad extends Transform {
  constructor(x, y, width, height) {
    super(x, y);

    _defineProperty(this, "topLeft", void 0);

    _defineProperty(this, "topRight", void 0);

    _defineProperty(this, "bottomLeft", void 0);

    _defineProperty(this, "bottomRight", void 0);

    _defineProperty(this, "_size", void 0);

    this._size = new Vec2(width, height);
    this.topLeft = new Vec2();
    this.topRight = new Vec2();
    this.bottomLeft = new Vec2();
    this.bottomRight = new Vec2();
    this.updateVertices();
  }

  updateVertices() {
    if (!this.dirty) {
      return false;
    }

    this.update();
    var w = this._size.x;
    var h = this._size.y;
    var x0 = -(this._origin.x * w);
    var x1 = x0 + w;
    var y0 = -(this._origin.y * h);
    var y1 = y0 + h;
    var {
      a,
      b,
      c,
      d,
      tx,
      ty
    } = this.local;
    var x0a = x0 * a;
    var x0b = x0 * b;
    var y0c = y0 * c;
    var y0d = y0 * d;
    var x1a = x1 * a;
    var x1b = x1 * b;
    var y1c = y1 * c;
    var y1d = y1 * d;
    this.topLeft.set(x0a + y0c + tx, x0b + y0d + ty);
    this.topRight.set(x1a + y0c + tx, x1b + y0d + ty);
    this.bottomLeft.set(x0a + y1c + tx, x0b + y1d + ty);
    this.bottomRight.set(x1a + y1c + tx, x1b + y1d + ty);
    return true;
  }

}

var vs = "#version 300 es\nprecision highp float;\n\nlayout(location=0) in vec2 position;\nlayout(location=1) in vec2 uv;\n\nuniform SceneUniforms {\n    mat4 uProjectionMatrix;\n};\n\nout vec2 outUV;\n\nvoid main()\n{\n    outUV = uv;\n\n    gl_Position = uProjectionMatrix * vec4(position, 0.0, 1.0);\n}\n";
var fs = "#version 300 es\nprecision highp float;\n\nlayout(std140, column_major) uniform;\n\nuniform SceneUniforms {\n    mat4 uProjectionMatrix;\n};\n\nuniform sampler2D texture0;\n\nin vec2 outUV;\n\nout vec4 fragColor;\n\nvoid main() {\n    fragColor = texture(texture0, outUV);\n}\n";
var app = new WebGL2Renderer(document.getElementById('game'));
app.setClearColor(0, 0, 0, 1);
var program = CreateProgram(app, vs, fs);
var projectionMatrix = Ortho(0, app.width, app.height, 0, -1000, 1000);
var sub = CreateUniformBuffer(app, [app.gl.FLOAT_MAT4]);
sub.set(0, projectionMatrix.getArray()).update();
var UVTL = new Vec2(0, 0);
var UVTR = new Vec2(1, 0);
var UVBL = new Vec2(0, 1);
var UVBR = new Vec2(1, 1);
var quads = [];
var max = 50;

for (var i = 0; i < max; i++) {
  var x = Math.floor(Math.random() * app.width);
  var y = Math.floor(Math.random() * app.height);
  var s = 0.1 + Math.random() * 0.2;
  var quad = new Quad(x, y, 512, 512);
  quad.setOrigin(0.5);
  quad.setScale(s);
  quads.push(quad);
}

var size = 4;
var dataTA = new Float32Array(size * (max * 16));
var offset = 0;
var ibo = [];
var iboIndex = 0;
quads.forEach(quad => {
  dataTA[offset + 0] = quad.topLeft.x;
  dataTA[offset + 1] = quad.topLeft.y;
  dataTA[offset + 2] = UVTL.x;
  dataTA[offset + 3] = UVTL.y;
  dataTA[offset + 4] = quad.bottomLeft.x;
  dataTA[offset + 5] = quad.bottomLeft.y;
  dataTA[offset + 6] = UVBL.x;
  dataTA[offset + 7] = UVBL.y;
  dataTA[offset + 8] = quad.bottomRight.x;
  dataTA[offset + 9] = quad.bottomRight.y;
  dataTA[offset + 10] = UVBR.x;
  dataTA[offset + 11] = UVBR.y;
  dataTA[offset + 12] = quad.topRight.x;
  dataTA[offset + 13] = quad.topRight.y;
  dataTA[offset + 14] = UVTR.x;
  dataTA[offset + 15] = UVTR.y;
  ibo.push(iboIndex + 0, iboIndex + 1, iboIndex + 2, iboIndex + 2, iboIndex + 3, iboIndex + 0);
  iboIndex += 4;
  offset += 16;
});
console.log(max, 'sprites', dataTA.byteLength, 'bytes', dataTA.byteLength / 1e+6, 'MB');
var buffer = CreateInterleavedBuffer(app, size * 4, dataTA);
var indices = CreateIndexBuffer(app, app.gl.UNSIGNED_SHORT, 3, new Uint16Array(ibo));
var batch = CreateVertexArray(app);
batch.vertexAttributeBuffer(0, buffer, {
  type: app.gl.FLOAT,
  size: 2,
  offset: 0,
  stride: size * 4
});
batch.vertexAttributeBuffer(1, buffer, {
  type: app.gl.FLOAT,
  size: 2,
  offset: size * 2,
  stride: size * 4
});
batch.indexBuffer(indices);
window.bob = quads[0];
ImageFile('sprites', '../assets/512x512.png').load().then(file => {
  var t = CreateTexture2D(app, file.data);
  var drawCall = CreateDrawCall(app, program, batch);
  drawCall.uniformBlock('SceneUniforms', sub);
  drawCall.texture('texture0', t);
  quads.forEach(quad => {
    var duration = 1 + Math.random() * 4;
    var rotation = 0;
    var skewX = -4 + Math.random() * 8;
    var skewY = -4 + Math.random() * 8;
    gsapWithCSS.to(quad, {
      duration,
      rotation,
      skewX,
      skewY,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });
  });

  function render() {
    var offset = 0;
    var dirty = false;
    quads.forEach(quad => {
      if (quad.updateVertices()) {
        dataTA[offset + 0] = quad.topLeft.x;
        dataTA[offset + 1] = quad.topLeft.y;
        dataTA[offset + 4] = quad.bottomLeft.x;
        dataTA[offset + 5] = quad.bottomLeft.y;
        dataTA[offset + 8] = quad.bottomRight.x;
        dataTA[offset + 9] = quad.bottomRight.y;
        dataTA[offset + 12] = quad.topRight.x;
        dataTA[offset + 13] = quad.topRight.y;
        dirty = true;
      }

      offset += 16;
    });

    if (dirty) {
      buffer.data(dataTA);
    }

    app.clear();
    drawCall.draw();
    requestAnimationFrame(render);
  }

  render();
});
//# sourceMappingURL=test034.js.map
