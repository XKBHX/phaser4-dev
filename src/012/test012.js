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
    var gl = this.gl;
    var appState = this.appState;
    var uniformNames = this.uniformNames;
    var uniformValues = this.uniformValues;
    var uniformBuffers = this.uniformBuffers;
    var uniformBlockCount = this.currentProgram.uniformBlockCount;
    var textures = this.textures;
    var textureCount = this.currentProgram.samplerCount;
    var drawPrimitive = this.drawPrimitive;
    var numElements = this.numElements;
    var numInstances = this.numInstances;
    var currentVertexArray = this.currentVertexArray;
    var offsets = this.offsets;
    var numDraws = this.numDraws;
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

    for (var tIndex = 0; tIndex < textureCount; tIndex++) {
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

class Renderbuffer {
  constructor(gl, width, height, internalFormat) {
    var samples = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
    this.is3D = false;
    this.gl = gl;
    this.renderbuffer = null;
    this.width = width;
    this.height = height;
    this.internalFormat = internalFormat;
    this.samples = samples;
    this.restore();
  }

  restore() {
    this.renderbuffer = this.gl.createRenderbuffer();
    this.resize(this.width, this.height);
    return this;
  }

  resize(width, height) {
    var gl = this.gl;
    this.width = width;
    this.height = height;
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.samples, this.internalFormat, width, height);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    return this;
  }

  delete() {
    this.gl.deleteRenderbuffer(this.renderbuffer);
    this.renderbuffer = null;
    return this;
  }

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
      flipY = true,
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
    this.maxAnisotropy = Math.min(maxAnisotropy, appState.maxTextureUnits);
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
    var gl = this.gl;
    var binding = this.binding;
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
    gl.texParameteri(binding, gl.TEXTURE_MIN_FILTER, this.minFilter);
    gl.texParameteri(binding, gl.TEXTURE_MAG_FILTER, this.magFilter);
    gl.texParameteri(binding, gl.TEXTURE_WRAP_S, this.wrapS);
    gl.texParameteri(binding, gl.TEXTURE_WRAP_T, this.wrapT);
    gl.texParameteri(binding, gl.TEXTURE_WRAP_R, this.wrapR);
    gl.texParameteri(binding, gl.TEXTURE_COMPARE_FUNC, this.compareFunc);
    gl.texParameteri(binding, gl.TEXTURE_COMPARE_MODE, this.compareMode);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.flipY);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premultiplyAlpha);

    if (this.minLOD !== null) {
      gl.texParameterf(binding, gl.TEXTURE_MIN_LOD, this.minLOD);
    }

    if (this.maxLOD !== null) {
      gl.texParameterf(binding, gl.TEXTURE_MAX_LOD, this.maxLOD);
    }

    if (this.baseLevel !== null) {
      gl.texParameteri(binding, gl.TEXTURE_BASE_LEVEL, this.baseLevel);
    }

    if (this.maxLevel !== null) {
      gl.texParameteri(binding, gl.TEXTURE_MAX_LEVEL, this.maxLevel);
    }

    if (this.maxAnisotropy > 1) {
      gl.texParameteri(binding, gl[0x84FE], this.maxAnisotropy);
    }

    var levels = 1;

    if (this.is3D) {
      if (this.mipmaps) {
        levels = Math.floor(Math.log2(Math.max(Math.max(width, height), depth))) + 1;
      }

      gl.texStorage3D(binding, levels, this.internalFormat, width, height, depth);
    } else {
      if (this.mipmaps) {
        levels = Math.floor(Math.log2(Math.max(width, height))) + 1;
      }

      gl.texStorage2D(binding, levels, this.internalFormat, width, height);
    }

    return this;
  }

  data(data) {
    var gl = this.gl;
    var binding = this.binding;
    var source = Array.isArray(data) ? data : [data];
    var width = this.width;
    var height = this.height;
    var depth = this.depth;
    var format = this.format;
    var type = this.type;
    var is3D = this.is3D;
    var numLevels = this.mipmaps ? source.length : 1;
    var generateMipmaps = this.mipmaps && source.length === 1;
    var i;
    this.bind(Math.max(this.currentUnit, 0));

    if (this.compressed) {
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
    var gl = this.gl;
    var appState = this.appState;

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
    var gl = this.gl;
    var appState = this.appState;
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

class Framebuffer {
  constructor(gl, appState) {
    this.gl = gl;
    this.appState = appState;
    this.framebuffer = null;
    this.numColorTargets = 0;
    this.colorAttachments = [];
    this.colorAttachmentEnums = [];
    this.colorAttachmentTargets = [];
    this.depthAttachment = null;
    this.depthAttachmentTarget = null;
    this.width = 0;
    this.height = 0;
    this.restore();
  }

  restore() {
    var appState = this.appState;

    if (appState.drawFramebuffer === this) {
      appState.drawFramebuffer = null;
    }

    if (appState.readFramebuffer === this) {
      appState.readFramebuffer = null;
    }

    this.framebuffer = this.gl.createFramebuffer();
    return this;
  }

  colorTarget(index, attachment, target) {
    var gl = this.gl;

    if (target === undefined) {
      target = attachment.is3D ? 0 : gl.TEXTURE_2D;
    }

    var colorAttachmentEnums = this.colorAttachmentEnums;
    var colorAttachments = this.colorAttachments;
    var colorAttachmentTargets = this.colorAttachmentTargets;

    if (index >= this.numColorTargets) {
      var numColorTargets = index + 1;
      colorAttachmentEnums.length = numColorTargets;
      colorAttachments.length = numColorTargets;
      colorAttachmentTargets.length = numColorTargets;

      for (var i = this.numColorTargets; i < numColorTargets - 1; i++) {
        colorAttachmentEnums[i] = gl.NONE;
        colorAttachments[i] = null;
        colorAttachmentTargets[i] = 0;
      }

      this.numColorTargets = numColorTargets;
    }

    colorAttachmentEnums[index] = gl.COLOR_ATTACHMENT0 + index;
    colorAttachments[index] = attachment;
    colorAttachmentTargets[index] = target;
    var currentFramebuffer = this.bindAndCaptureState();

    if (attachment instanceof Renderbuffer) {
      gl.framebufferRenderbuffer(gl.DRAW_FRAMEBUFFER, colorAttachmentEnums[index], gl.RENDERBUFFER, attachment.renderbuffer);
    } else if (attachment.is3D) {
      gl.framebufferTextureLayer(gl.DRAW_FRAMEBUFFER, colorAttachmentEnums[index], attachment.texture, 0, target);
    } else {
      gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, colorAttachmentEnums[index], target, attachment.texture, 0);
    }

    gl.drawBuffers(this.colorAttachmentEnums);
    this.width = attachment.width;
    this.height = attachment.height;
    this.restoreState(currentFramebuffer);
    return this;
  }

  depthTarget(attachment, target) {
    var gl = this.gl;

    if (target === undefined) {
      target = attachment.is3D ? 0 : gl.TEXTURE_2D;
    }

    var currentFramebuffer = this.bindAndCaptureState();
    this.depthAttachment = attachment;
    this.depthAttachmentTarget = target;

    if (attachment instanceof Renderbuffer) {
      gl.framebufferRenderbuffer(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, attachment.renderbuffer);
    } else if (attachment.is3D) {
      gl.framebufferTextureLayer(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, attachment.texture, 0, target);
    } else {
      gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, target, attachment.texture, 0);
    }

    this.width = attachment.width;
    this.height = attachment.height;
    this.restoreState(currentFramebuffer);
    return this;
  }

  resize(width, height) {
    var gl = this.gl;

    if (!width) {
      width = gl.drawingBufferWidth;
    }

    if (!height) {
      height = gl.drawingBufferHeight;
    }

    var currentFramebuffer = this.bindAndCaptureState();
    var colorAttachmentEnums = this.colorAttachmentEnums;
    var colorAttachments = this.colorAttachments;
    var colorAttachmentTargets = this.colorAttachmentTargets;

    for (var i = 0; i < this.numColorTargets; i++) {
      var attachment = colorAttachments[i];

      if (!attachment) {
        continue;
      }

      attachment.resize(width, height);

      if (attachment instanceof Texture) {
        if (attachment.is3D) {
          gl.framebufferTextureLayer(gl.DRAW_FRAMEBUFFER, colorAttachmentEnums[i], attachment.texture, 0, colorAttachmentTargets[i]);
        } else {
          gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, colorAttachmentEnums[i], colorAttachmentTargets[i], attachment.texture, 0);
        }
      }
    }

    var depthAttachment = this.depthAttachment;

    if (depthAttachment) {
      depthAttachment.resize(width, height);

      if (depthAttachment instanceof Texture) {
        if (depthAttachment.is3D) {
          gl.framebufferTextureLayer(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, depthAttachment.texture, 0, this.depthAttachmentTarget);
        } else {
          gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, this.depthAttachmentTarget, depthAttachment.texture, 0);
        }
      }
    }

    this.width = width;
    this.height = height;
    this.restoreState(currentFramebuffer);
    return this;
  }

  delete() {
    var gl = this.gl;
    var appState = this.appState;

    if (this.framebuffer) {
      gl.deleteFramebuffer(this.framebuffer);
      this.framebuffer = null;

      if (appState.drawFramebuffer === this) {
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
        appState.drawFramebuffer = null;
      }

      if (appState.readFramebuffer === this) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
        appState.readFramebuffer = null;
      }
    }

    return this;
  }

  getStatus() {
    var gl = this.gl;
    var currentFramebuffer = this.bindAndCaptureState();
    var status = gl.checkFramebufferStatus(gl.DRAW_FRAMEBUFFER);
    this.restoreState(currentFramebuffer);
    return status;
  }

  bindForDraw() {
    var gl = this.gl;
    var appState = this.appState;

    if (appState.drawFramebuffer !== this) {
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.framebuffer);
      appState.drawFramebuffer = this;
    }

    return this;
  }

  bindForRead() {
    var gl = this.gl;
    var appState = this.appState;

    if (appState.readFramebuffer !== this) {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.framebuffer);
      appState.readFramebuffer = this;
    }

    return this;
  }

  bindAndCaptureState() {
    var gl = this.gl;
    var appState = this.appState;
    var currentFramebuffer = appState.drawFramebuffer;

    if (currentFramebuffer !== this) {
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.framebuffer);
    }

    return currentFramebuffer;
  }

  restoreState(framebuffer) {
    var gl = this.gl;

    if (framebuffer !== this) {
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer ? framebuffer.framebuffer : null);
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
    this.glFunc = uniformData.glFunc;
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

var UNIFORMS = {
  SAMPLER: [0x8B5E, 0x8DCA, 0x8DD2, 0x8B62, 0x8DC1, 0x8DCF, 0x8DD7, 0x8DC4, 0x8B60, 0x8DCC, 0x8DD4, 0x8DC5, 0x8B5F, 0x8DCB, 0x8DD3],
  VEC: [0x8B50, 0x8B53, 0x8DC6, 0x8B51, 0x8B54, 0x8DC7, 0x8B52, 0x8B55, 0x8DC8],
  BOOL: [0x8B56, 0x8B57, 0x8B58, 0x8B59],
  MAT: [0x8B5A, 0x8B5B, 0x8B5C, 0x8B65, 0x8B66, 0x8B67, 0x8B68, 0x8B69, 0x8B6A]
};

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
    var gl = this.gl;
    var appState = this.appState;

    if (appState.program === this) {
      gl.useProgram(null);
      appState.program = null;
    }

    this.linked = false;
    this.uniformBlockCount = 0;
    this.samplerCount = 0;

    if (this.vertexSource) {
      this.vertexShader = new Shader(gl, appState, gl.VERTEX_SHADER, this.vertexSource);
    }

    if (this.fragmentSource) {
      this.fragmentShader = new Shader(gl, appState, gl.FRAGMENT_SHADER, this.fragmentSource);
    }

    this.program = this.gl.createProgram();
    return this;
  }

  link() {
    var gl = this.gl;
    var program = this.program;
    gl.attachShader(program, this.vertexShader.shader);
    gl.attachShader(program, this.fragmentShader.shader);
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

    var gl = this.gl;
    var program = this.program;

    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
      this.linked = true;
      this.initVariables();
    } else {
      console.error(gl.getProgramInfoLog(program));
      this.vertexShader.checkCompilation();
      this.fragmentShader.checkCompilation();
    }

    if (this.vertexSource) {
      this.vertexShader.delete();
      this.vertexShader = null;
    }

    if (this.fragmentSource) {
      this.fragmentShader.delete();
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

class Query {
  constructor(gl, target) {
    this.gl = gl;
    this.query = null;
    this.target = target;
    this.active = false;
    this.result = null;
    this.restore();
  }

  restore() {
    this.query = this.gl.createQuery();
    this.active = false;
    this.result = null;
    return this;
  }

  begin() {
    if (!this.active) {
      this.gl.beginQuery(this.target, this.query);
      this.result = null;
    }

    return this;
  }

  end() {
    if (!this.active) {
      this.gl.endQuery(this.target);
      this.active = true;
    }

    return this;
  }

  ready() {
    var gl = this.gl;

    if (this.active && gl.getQueryParameter(this.query, gl.QUERY_RESULT_AVAILABLE)) {
      this.active = false;
      this.result = gl.getQueryParameter(this.query, gl.QUERY_RESULT);
      return true;
    }

    return false;
  }

  delete() {
    if (this.query) {
      this.gl.deleteQuery(this.query);
      this.query = null;
    }

    return this;
  }

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
    var gl = this.gl;
    var appState = this.appState;
    var binding = this.binding;

    if (appState.vertexArray) {
      gl.bindVertexArray(null);
      appState.vertexArray = null;
    }

    this.buffer = gl.createBuffer();
    gl.bindBuffer(binding, this.buffer);

    if (data === undefined) {
      gl.bufferData(binding, this.byteLength, this.usage);
    } else {
      gl.bufferData(binding, data, this.usage);
    }

    gl.bindBuffer(binding, null);
    return this;
  }

  data(data) {
    var gl = this.gl;
    var appState = this.appState;
    var binding = this.binding;

    if (appState.vertexArray) {
      gl.bindVertexArray(null);
      appState.vertexArray = null;
    }

    gl.bindBuffer(binding, this.buffer);
    gl.bufferSubData(binding, 0, data);
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
    this.clearBits = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT;
    this.contextLostExt = null;
    this.contextRestoredHandler = null;
    this.canvas.addEventListener('webglcontextlost', e => {
      e.preventDefault();
    });
    this.canvas.addEventListener('webglcontextrestored', () => {
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
      maxTextureAnisotropy: textureAnisotropy ? gl.getParameter(0x84FF) : 1,
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
    gl.getExtension('OES_texture_float_linear');
    gl.getExtension('EXT_color_buffer_float');
    gl.getExtension('EXT_texture_filter_anisotropic');
    var compressed = 'WEBGL_compressed_texture_';
    gl.getExtension(compressed + 's3tc');
    gl.getExtension(compressed + 's3tc_srgb');
    gl.getExtension(compressed + 'etc');
    gl.getExtension(compressed + 'astc');
    gl.getExtension(compressed + 'pvrtc');
    var timer = 'EXT_disjoint_timer_query';
    gl.getExtension(timer);
    gl.getExtension(timer + '_webgl2');
    this.contextLostExt = gl.getExtension('WEBGL_lose_context');
    gl.getExtension('KHR_parallel_shader_compile');
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

  getX(x) {
    return x / this.width * 2 - 1;
  }

  getY(y) {
    return y / this.height * -2 + 1;
  }

  getXY(x, y) {
    return {
      x: x / this.width * 2 - 1,
      y: y / this.height * -2 + 1
    };
  }

  getQuadPosition(x, y, width, height) {
    var TL = this.getXY(x, y);
    var TR = this.getXY(x + width, y);
    var BL = this.getXY(x, y + height);
    var BR = this.getXY(x + width, y + height);
    return new Float32Array([TL.x, TL.y, TR.x, TR.y, BL.x, BL.y, BL.x, BL.y, TR.x, TR.y, BR.x, BR.y]);
  }

  createProgram(vsSource, fsSource) {
    var program = new Program(this.gl, this.state, vsSource, fsSource);
    program.link().checkLinkage();
    return program;
  }

  createVertexArray() {
    return new VertexArray(this.gl, this.state);
  }

  createVertexBuffer(type, itemSize, data, usage) {
    return new VertexBuffer(this.gl, this.state, type, itemSize, data, usage);
  }

  createMatrixBuffer(type, data) {
    var usage = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.gl.STATIC_DRAW;
    return new VertexBuffer(this.gl, this.state, type, 0, data, usage);
  }

  createInterleavedBuffer(bytesPerVertex, data) {
    var usage = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.gl.STATIC_DRAW;
    return new VertexBuffer(this.gl, this.state, null, bytesPerVertex, data, usage);
  }

  createIndexBuffer(type, itemSize, data) {
    var usage = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : this.gl.STATIC_DRAW;
    return new VertexBuffer(this.gl, this.state, type, itemSize, data, usage, true);
  }

  createUniformBuffer(layout) {
    var usage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.gl.DYNAMIC_DRAW;
    return new UniformBuffer(this.gl, this.state, layout, usage);
  }

  createDrawCall(program, vertexArray) {
    return new DrawCall(this.gl, this.state, program, vertexArray);
  }

  createFramebuffer() {
    return new Framebuffer(this.gl, this.state);
  }

  createQuery(target) {
    return new Query(this.gl, target);
  }

  createRenderbuffer(width, height, internalFormat) {
    var samples = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    return new Renderbuffer(this.gl, width, height, internalFormat, samples);
  }

  createEmptyTexture2D(width, height) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    return new Texture(this.gl, this.state, this.gl.TEXTURE_2D, null, width, height, 0, false, options);
  }

  createTexture2D(image, width, height) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    if (!width && image && image.width) {
      width = image.width;
    }

    if (!height && image && image.height) {
      height = image.height;
    }

    return new Texture(this.gl, this.state, this.gl.TEXTURE_2D, image, width, height, 0, false, options);
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

var vs = "#version 300 es\n\nlayout(location=0) in vec4 position;\nlayout(location=1) in vec2 tUv;\n\nout vec2 uv;\n\nvoid main() {\n    uv = tUv;\n    gl_Position = position;\n}\n";
var fs = "#version 300 es\nprecision highp float;\n\nin vec2 uv;\nuniform sampler2D tex;\n\nout vec4 fragColor;\n\nvoid main() {\n    fragColor = texture(tex, uv);\n}\n";
var app = new WebGL2Renderer(document.getElementById('game'));
app.setClearColor(0.3, 0.3, 0, 1);
var program = app.createProgram(vs, fs);
var positions = app.createVertexBuffer(app.gl.FLOAT, 2, app.getQuadPosition(0, 0, 313, 512));
var uvs = app.createVertexBuffer(app.gl.FLOAT, 2, new Float32Array([0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0]));
var x = 0;
var triangleArray = app.createVertexArray().vertexAttributeBuffer(0, positions).vertexAttributeBuffer(1, uvs);
ImageFile('stone', '/100-phaser3-snippets/public/assets/patchouli.png').load().then(file => {
  var t = app.createTexture2D(file.data);
  var drawCall = app.createDrawCall(program, triangleArray).texture('tex', t);

  function render() {
    positions.data(app.getQuadPosition(x, 0, 313, 512));
    x++;

    if (x > 1024) {
      x = -313;
    }

    app.clear();
    drawCall.draw();
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
});
