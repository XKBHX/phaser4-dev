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

function enableBlend(a){a.enable(a.BLEND);}function setBlendFunc(a,b,c,d){a.blendFunc(b,c),d&&a.blendEquation(d);}function setBlendModeNormal(a){setBlendFunc(a,a.ONE,a.ONE_MINUS_SRC_ALPHA,a.FUNC_ADD);}

class DrawCall{constructor(a,b,c){var d=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;this.gl=a,this.appState=b,this.currentProgram=c,this.drawPrimitive=a.TRIANGLES,this.currentVertexArray=d,this.appState=b,this.uniformIndices={},this.uniformNames=Array(b.maxUniforms),this.uniformValues=Array(b.maxUniforms),this.uniformCount=0,this.uniformBuffers=Array(b.maxUniformBuffers),this.uniformBlockNames=Array(b.maxUniformBuffers),this.uniformBlockCount=0,this.textures=Array(b.maxTextureUnits),this.textureCount=0,this.offsets=new Int32Array(1),this.numElements=new Int32Array(1),this.numInstances=new Int32Array(1),d&&(this.numElements[0]=d.numElements,this.numInstances[0]=d.numInstances),this.numDraws=1;}setPrimitive(a){return this.drawPrimitive=a,this}uniform(a,b){var c=this.uniformIndices[a];return void 0===c&&(c=this.uniformCount++,this.uniformIndices[a]=c,this.uniformNames[c]=a),this.uniformValues[c]=b,this}uniformBlock(a,b){var c=this.currentProgram.uniformBlocks[a];return this.uniformBuffers[c]=b,this}texture(a,b){var c=this.currentProgram.samplers[a];return this.textures[c]=b,this}drawRanges(){this.numDraws=arguments.length,this.offsets.length<this.numDraws&&(this.offsets=new Int32Array(this.numDraws)),this.numElements.length<this.numDraws&&(this.numElements=new Int32Array(this.numDraws)),this.numInstances.length<this.numDraws&&(this.numInstances=new Int32Array(this.numDraws));for(var a,b=0;b<this.numDraws;++b)a=0>b||arguments.length<=b?void 0:arguments[b],this.offsets[b]=a[0],this.numElements[b]=a[1],this.numInstances[b]=a[2]||1;return this}draw(){var{gl:a,appState:b,currentProgram:c,uniformNames:d,uniformValues:e,uniformBuffers:f}=this,{textures:g,drawPrimitive:h,numElements:j,numInstances:k,currentVertexArray:l,offsets:m,numDraws:n}=this,{uniformBlockCount:o,samplerCount:p}=c,q=!1;this.currentProgram.bind(),l&&(l.bind(),q=l.indexed);for(var r=0;r<this.uniformCount;r++)this.currentProgram.uniform(d[r],e[r]);for(var s=0;s<o;s++)f[s].bind(s);for(var t=0;t<p;t++)g[t].bind(t);if(b.multiDrawInstanced){var u=b.extensions.multiDrawInstanced;q?u.multiDrawElementsInstancedWEBGL(h,j,0,l.indexType,m,0,k,0,n):u.multiDrawArraysInstancedWEBGL(h,m,0,j,0,k,0,n);}else if(q)for(var v=0;v<n;v++)a.drawElementsInstanced(h,j[v],l.indexType,m[v],k[v]);else for(var i=0;i<n;i++)a.drawArraysInstanced(h,m[i],j[i],k[i]);return this}}

function CreateDrawCall(a,b,c){return new DrawCall(a.gl,a.state,b,c)}

class Texture{constructor(a,b,c,d){var e=4<arguments.length&&arguments[4]!==void 0?arguments[4]:0,f=5<arguments.length&&arguments[5]!==void 0?arguments[5]:0,g=6<arguments.length&&arguments[6]!==void 0?arguments[6]:0,h=!!(7<arguments.length&&arguments[7]!==void 0)&&arguments[7],i=8<arguments.length&&arguments[8]!==void 0?arguments[8]:{};this.gl=a,this.appState=b,this.binding=c,this.texture=null,d&&d.width&&(e=d.width),d&&d.height&&(f=d.height),this.width=e,this.height=f,this.depth=g,this.is3D=h,this.compressed=!!i.compressed,this.compressed?(this.internalFormat=i.internalFormat,this.format=this.internalFormat,this.type=a.UNSIGNED_BYTE):i.internalFormat?(this.internalFormat=i.internalFormat,this.format=i.format,this.type=i.type):(this.internalFormat=a.RGBA8,this.format=a.RGBA,this.type=a.UNSIGNED_BYTE),this.currentUnit=-1;var{minFilter:j=d?a.LINEAR_MIPMAP_NEAREST:a.NEAREST,magFilter:k=d?a.LINEAR:a.NEAREST,wrapS:l=a.REPEAT,wrapT:m=a.REPEAT,wrapR:n=a.REPEAT,compareMode:o=a.NONE,compareFunc:p=a.LEQUAL,minLOD:q=null,maxLOD:r=null,baseLevel:s=null,maxLevel:t=null,maxAnisotropy:u=1,flipY:v=!1,premultiplyAlpha:w=!0}=i;this.minFilter=j,this.magFilter=k,this.wrapS=l,this.wrapT=m,this.wrapR=n,this.compareMode=o,this.compareFunc=p,this.minLOD=q,this.maxLOD=r,this.baseLevel=s,this.maxLevel=t,this.maxAnisotropy=Math.min(u,b.maxTextureAnisotropy),this.flipY=v,this.premultiplyAlpha=w,this.mipmaps=j===a.LINEAR_MIPMAP_NEAREST||j===a.LINEAR_MIPMAP_LINEAR,this.restore(d);}restore(a){return this.texture=null,this.resize(this.width,this.height,this.depth),a&&this.data(a),this}resize(a,b){var c=2<arguments.length&&void 0!==arguments[2]?arguments[2]:0,{gl:d,binding:e,appState:f}=this,g=this.texture;if(g&&a===this.width&&b===this.height&&c===this.depth)return this;g&&d.deleteTexture(g),-1!==this.currentUnit&&(this.appState.textures[this.currentUnit]=null),g=d.createTexture(),this.texture=g,this.bind(Math.max(this.currentUnit,0)),this.width=a,this.height=b,this.depth=c;var{minFilter:h,magFilter:i,wrapS:j,wrapT:k,wrapR:l,compareFunc:m,compareMode:n,flipY:o,premultiplyAlpha:p}=this;d.texParameteri(e,d.TEXTURE_MIN_FILTER,h),d.texParameteri(e,d.TEXTURE_MAG_FILTER,i),d.texParameteri(e,d.TEXTURE_WRAP_S,j),d.texParameteri(e,d.TEXTURE_WRAP_T,k),d.texParameteri(e,d.TEXTURE_WRAP_R,l),d.texParameteri(e,d.TEXTURE_COMPARE_FUNC,m),d.texParameteri(e,d.TEXTURE_COMPARE_MODE,n),d.pixelStorei(d.UNPACK_FLIP_Y_WEBGL,o),d.pixelStorei(d.UNPACK_PREMULTIPLY_ALPHA_WEBGL,p);var{minLOD:q,maxLOD:r,baseLevel:s,maxLevel:t,maxAnisotropy:u,is3D:v,mipmaps:w,internalFormat:x}=this;null!==q&&d.texParameterf(e,d.TEXTURE_MIN_LOD,q),null!==r&&d.texParameterf(e,d.TEXTURE_MAX_LOD,r),null!==s&&d.texParameteri(e,d.TEXTURE_BASE_LEVEL,s),null!==t&&d.texParameteri(e,d.TEXTURE_MAX_LEVEL,t),1<u&&d.texParameteri(e,f.textureAnisotropy.TEXTURE_MAX_ANISOTROPY_EXT,u);var y=1;return v?(w&&(y=Math.floor(Math.log2(Math.max(Math.max(a,b),c)))+1),d.texStorage3D(e,y,x,a,b,c)):(w&&(y=Math.floor(Math.log2(Math.max(a,b)))+1),d.texStorage2D(e,y,x,a,b)),this}data(a){var b,{gl:c,binding:d,format:e,type:f,is3D:g,mipmaps:h,currentUnit:j,compressed:k}=this,{width:l,height:m,depth:n}=this,o=Array.isArray(a)?a:[a],p=h?o.length:1,q=h&&1===o.length;if(this.bind(Math.max(j,0)),k){if(g)for(b=0;b<p;b++)c.compressedTexSubImage3D(d,b,0,0,0,l,m,n,e,o[b]),l=Math.max(l>>1,1),m=Math.max(m>>1,1),n=Math.max(n>>1,1);else for(b=0;b<p;b++)c.compressedTexSubImage2D(d,b,0,0,l,m,e,o[b]),l=Math.max(l>>1,1),m=Math.max(m>>1,1);}else if(g)for(b=0;b<p;b++)c.texSubImage3D(d,b,0,0,0,l,m,n,e,f,o[b]),l=Math.max(l>>1,1),m=Math.max(m>>1,1),n=Math.max(n>>1,1);else for(b=0;b<p;b++)c.texSubImage2D(d,b,0,0,l,m,e,f,o[b]),l=Math.max(l>>1,1),m=Math.max(m>>1,1);return q&&c.generateMipmap(d),this}delete(){var{gl:a,appState:b}=this;return this.texture&&(a.deleteTexture(this.texture),this.texture=null,-1!==this.currentUnit&&b.textures[this.currentUnit]===this&&(b.textures[this.currentUnit]=null,this.currentUnit=-1)),this}bind(a){var{gl:b,appState:c}=this,d=c.textures[a];return d!==this&&(d&&(d.currentUnit=-1),-1!==this.currentUnit&&(c.textures[this.currentUnit]=null),b.activeTexture(b.TEXTURE0+a),b.bindTexture(this.binding,this.texture),c.textures[a]=this,this.currentUnit=a),this}}

var TYPE_SIZE={5120:1,5121:1,5122:2,5123:2,5124:4,5125:4,5126:4};function GetTypeSize(a){return TYPE_SIZE[a]}

class VertexBuffer{constructor(a,b,c,d,e){var f=5<arguments.length&&arguments[5]!==void 0?arguments[5]:a.STATIC_DRAW,g=!!(6<arguments.length&&arguments[6]!==void 0)&&arguments[6];this.gl=a,this.appState=b,this.buffer=null;var h=1;c===a.FLOAT_MAT4||c===a.FLOAT_MAT4x2||c===a.FLOAT_MAT4x3?h=4:c===a.FLOAT_MAT3||c===a.FLOAT_MAT3x2||c===a.FLOAT_MAT3x4?h=3:(c===a.FLOAT_MAT2||c===a.FLOAT_MAT2x3||c===a.FLOAT_MAT2x4)&&(h=2),c===a.FLOAT_MAT4||c===a.FLOAT_MAT3x4||c===a.FLOAT_MAT2x4?(d=4,c=a.FLOAT):c===a.FLOAT_MAT3||c===a.FLOAT_MAT4x3||c===a.FLOAT_MAT2x3?(d=3,c=a.FLOAT):(c===a.FLOAT_MAT2||c===a.FLOAT_MAT3x2||c===a.FLOAT_MAT4x2)&&(d=2,c=a.FLOAT);var i,j;"number"==typeof e?(i=e,c&&(e*=GetTypeSize(c)),j=e):(j=e.byteLength,i=e.length),this.type=c,this.itemSize=d,this.numItems=c?i/(d*h):j/d,this.numColumns=h,this.byteLength=j,this.usage=f,this.indexArray=!!g,this.integer=c===a.BYTE||c===a.UNSIGNED_BYTE||c===a.SHORT||c===a.UNSIGNED_SHORT||c===a.INT||c===a.UNSIGNED_INT,this.binding=this.indexArray?a.ELEMENT_ARRAY_BUFFER:a.ARRAY_BUFFER,this.restore(e);}restore(a){var{gl:b,appState:c,binding:d,byteLength:e,usage:f}=this;return c.vertexArray&&(b.bindVertexArray(null),c.vertexArray=null),this.buffer=b.createBuffer(),b.bindBuffer(d,this.buffer),void 0===a?b.bufferData(d,e,f):b.bufferData(d,a,f),b.bindBuffer(d,null),this}data(a){var b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:0,{gl:c,appState:d,binding:e,buffer:f}=this;return d.vertexArray&&(c.bindVertexArray(null),d.vertexArray=null),c.bindBuffer(e,f),c.bufferSubData(e,b,a),c.bindBuffer(e,null),this}delete(){return this.buffer&&(this.gl.deleteBuffer(this.buffer),this.buffer=null),this}}

function CreateIndexBuffer(a,b,c,d){var e=4<arguments.length&&arguments[4]!==void 0?arguments[4]:a.gl.STATIC_DRAW;return new VertexBuffer(a.gl,a.state,b,c,d,e,!0)}

function CreateInterleavedBuffer(a,b,c){var d=3<arguments.length&&arguments[3]!==void 0?arguments[3]:a.gl.STATIC_DRAW;return new VertexBuffer(a.gl,a.state,null,b,c,d)}

var UNIFORMS={SAMPLER:[35678,36298,36306,35682,36289,36303,36311,36292,35680,36300,36308,36293,35679,36299,36307],VEC:[35664,35667,36294,35665,35668,36295,35666,35669,36296],BOOL:[35670,35671,35672,35673],MAT:[35674,35675,35676,35685,35686,35687,35688,35689,35690]};

var SAMPLER_TYPE=["1i",1,Int32Array,!1],glConstMap={35678:SAMPLER_TYPE,36289:SAMPLER_TYPE,35682:SAMPLER_TYPE,36292:SAMPLER_TYPE,36298:SAMPLER_TYPE,36303:SAMPLER_TYPE,36306:SAMPLER_TYPE,36311:SAMPLER_TYPE,35680:SAMPLER_TYPE,36300:SAMPLER_TYPE,36308:SAMPLER_TYPE,36293:SAMPLER_TYPE,35679:SAMPLER_TYPE,36299:SAMPLER_TYPE,36307:SAMPLER_TYPE,5126:["1f",1,Float32Array,!1,1,5126,1],35664:["2f",2,Float32Array,!1,2,5126,2],35665:["3f",3,Float32Array,!1,4,5126,4],35666:["4f",4,Float32Array,!1,4,5126,4],5124:["1i",1,Int32Array,!1,1,5124,1],35667:["2i",2,Int32Array,!1,2,5124,2],35668:["3i",3,Int32Array,!1,4,5124,4],35669:["4i",4,Int32Array,!1,4,5124,4],5125:["1ui",1,Uint32Array,!1,1,5125,1],36294:["2ui",2,Uint32Array,!1,2,5125,2],36295:["3ui",3,Uint32Array,!1,4,5125,4],36296:["4ui",4,Uint32Array,!1,4,5125,4],35674:["2fv",4,Float32Array,!0,4,5126,8],35675:["3fv",9,Float32Array,!0,4,5126,12],35676:["4fv",16,Float32Array,!0,4,5126,16],35685:["2x3fv",6,Float32Array,!0,4,5126,8],35686:["2x4fv",8,Float32Array,!0,4,5126,8],35687:["3x2fv",6,Float32Array,!0,4,5126,12],35688:["3x4fv",12,Float32Array,!0,4,5126,12],35689:["4x2fv",8,Float32Array,!0,4,5126,16],35690:["4x3fv",12,Float32Array,!0,4,5126,16],35670:["1iv",1,Array,!1,1,5126,1],35671:["2iv",2,Array,!1,2,5126,2],35672:["3iv",3,Array,!1,4,5126,4],35673:["4iv",4,Array,!1,4,5126,4]};function GetUniformSize(a){var b=glConstMap[a];return b?{size:b[4],uboType:b[5],stride:b[6]}:null}function GetUniform(a,b){var c=glConstMap[b];if(c){var d="uniform";return c[3]&&(d=d.concat("Matrix")),{glFunc:a[d+c[0]],size:c[1],cacheClass:a=>new c[2](a)}}return null}

class MatrixUniform{constructor(a,b,c,d){this.gl=a,this.handle=b,this.count=d;var e=GetUniform(a,c.type);this.glFunc=e.glFunc.bind(a),this.cache=e.cacheClass(e.size*d);}set(a){for(var b=0;b<a.length;b++)if(this.cache[b]!==a[b])return this.glFunc(this.handle,!1,a),void this.cache.set(a)}}

class MultiBoolUniform{constructor(a,b,c,d){this.gl=a,this.handle=b,this.count=d;var e=GetUniform(a,c.type);this.glFunc=e.glFunc,this.cache=Array(e.size*d).fill(!1);}set(a){for(var b=0;b<a.length;b++)if(this.cache[b]!==a[b]){this.glFunc(this.handle,a);for(var c=b;c<a.length;c++)this.cache[c]=a[c];return}}}

class MultiNumericUniform{constructor(a,b,c,d){this.gl=a,this.handle=b,this.count=d;var e=GetUniform(a,c.type);this.glFunc=e.glFunc,this.cache=e.cacheClass(e.size*d);}set(a){for(var b=0;b<a.length;b++)if(this.cache[b]!==a[b])return this.glFunc(this.handle,a),void this.cache.set(a)}}

class Shader{constructor(a,b,c,d){this.gl=a,this.appState=b,this.type=c,this.source=d,this.restore();}restore(){var a=this.gl,b=a.createShader(this.type);return a.shaderSource(b,this.source),a.compileShader(b),this.shader=b,this}delete(){return this.shader&&(this.gl.deleteShader(this.shader),this.shader=null),this}checkCompilation(){var a=this.gl,b=this.shader;if(!a.getShaderParameter(b,a.COMPILE_STATUS))for(var c=this.source.split("\n"),d=0;d<c.length;++d);return this}}

class SingleComponentUniform{constructor(a,b,c){this.gl=a,this.handle=b;var d=GetUniform(a,c.type);this.glFunc=d.glFunc,this.cache=c.type!==a.BOOL&&0;}set(a){this.cache!==a&&(this.glFunc(this.handle,a),this.cache=a);}}

class Program{constructor(a,b,c,d){this.uniforms={},this.uniformBlocks={},this.uniformBlockCount=0,this.samplers={},this.samplerCount=0,this.linked=!1,this.gl=a,this.appState=b,"string"==typeof c?this.vertexSource=c:this.vertexShader=c,"string"==typeof d?this.fragmentSource=d:this.fragmentShader=d,this.initialize();}initialize(){var{gl:a,appState:b,vertexSource:c,fragmentSource:d}=this;return b.program===this&&(a.useProgram(null),b.program=null),this.linked=!1,this.uniformBlockCount=0,this.samplerCount=0,c&&(this.vertexShader=new Shader(a,b,a.VERTEX_SHADER,c)),d&&(this.fragmentShader=new Shader(a,b,a.FRAGMENT_SHADER,d)),this.program=this.gl.createProgram(),this}link(){var{gl:a,program:b,vertexShader:c,fragmentShader:d}=this;return a.attachShader(b,c.shader),a.attachShader(b,d.shader),a.linkProgram(b),this}checkCompletion(){return !this.gl.getExtension("KHR_parallel_shader_compile")||this.gl.getProgramParameter(this.program,37297)}checkLinkage(){if(this.linked)return this;var{gl:a,program:b,vertexShader:c,fragmentShader:d,vertexSource:e,fragmentSource:f}=this;return a.getProgramParameter(b,a.LINK_STATUS)?(this.linked=!0,this.initVariables()):(c.checkCompilation(),d.checkCompilation()),e&&(c.delete(),this.vertexShader=null),f&&(d.delete(),this.fragmentShader=null),this}initVariables(){this.bind();for(var a,b=this.gl,c=this.program,d=b.getProgramParameter(c,b.ACTIVE_UNIFORMS),e=0;e<d;e++){var f=b.getActiveUniform(c,e),g=b.getUniformLocation(c,f.name),h=f.type,j=f.size;-1===UNIFORMS.SAMPLER.indexOf(h)?-1===UNIFORMS.VEC.indexOf(h)?-1===UNIFORMS.MAT.indexOf(h)?-1===UNIFORMS.BOOL.indexOf(h)?h===b.INT||h===b.UNSIGNED_INT||h===b.FLOAT?1<j?this.uniforms[f.name]=new MultiNumericUniform(b,g,f,j):this.uniforms[f.name]=new SingleComponentUniform(b,g,f):void 0:1<j?this.uniforms[f.name]=new MultiBoolUniform(b,g,f,j):this.uniforms[f.name]=new SingleComponentUniform(b,g,f):this.uniforms[f.name]=new MatrixUniform(b,g,f,j):this.uniforms[f.name]=new MultiNumericUniform(b,g,f,j):(a=this.samplerCount++,this.samplers[f.name]=a,b.uniform1i(g,a));}for(var k=b.getProgramParameter(c,b.ACTIVE_UNIFORM_BLOCKS),l=0;l<k;l++){var m=b.getActiveUniformBlockName(c,l),n=b.getUniformBlockIndex(c,m),o=this.uniformBlockCount++;b.uniformBlockBinding(c,n,o),this.uniformBlocks[m]=o;}}uniform(a,b){return this.uniforms[a]&&this.uniforms[a].set(b),this}bind(){var a=this.appState;return a.program!==this&&(this.gl.useProgram(this.program),a.program=this),this}delete(){return this.program&&(this.gl.deleteProgram(this.program),this.program=null,this.appState.program===this&&(this.gl.useProgram(null),this.appState.program=null)),this}}

function CreateProgram(a,b,c){var d=new Program(a.gl,a.state,b,c);return d.link().checkLinkage(),d}

function CreateTexture2D(a,b,c,d){var e=4<arguments.length&&void 0!==arguments[4]?arguments[4]:{};return !c&&b&&b.width&&(c=b.width),!d&&b&&b.height&&(d=b.height),new Texture(a.gl,a.state,a.gl.TEXTURE_2D,b,c,d,0,!1,e)}

class UniformBuffer{constructor(a,b,c){var d=3<arguments.length&&arguments[3]!==void 0?arguments[3]:a.DYNAMIC_DRAW;this.gl=a,this.appState=b,this.buffer=null,this.dataViews={};var e=c.length,f=Array(e),g=Array(e),h=Array(e);this.size=0,this.usage=d,this.currentBase=-1;for(var k=0;k<e;k++){var{size:i,uboType:l,stride:m}=GetUniformSize(c[k]);2===i?this.size+=this.size%2:4===i&&(this.size+=(4-this.size%4)%4),f[k]=this.size,g[k]=m,h[k]=l,this.size+=m;}this.offsets=f,this.sizes=g,this.types=h,this.size+=(4-this.size%4)%4;var j=new Float32Array(this.size);this.dataViews[a.FLOAT]=j,this.dataViews[a.INT]=new Int32Array(j.buffer),this.dataViews[a.UNSIGNED_INT]=new Uint32Array(j.buffer),this.data=j,this.dirtyStart=this.size,this.dirtyEnd=0,this.restore();}restore(){var a=this.gl,b=this.appState,c=this.currentBase;return -1!==c&&b.uniformBuffers[c]===this&&(b.uniformBuffers[c]=null),this.buffer=a.createBuffer(),a.bindBuffer(a.UNIFORM_BUFFER,this.buffer),a.bufferData(a.UNIFORM_BUFFER,4*this.size,this.usage),a.bindBuffer(a.UNIFORM_BUFFER,null),this}set(a,b){var c=this.dataViews[this.types[a]],d=this.offsets[a],e=this.sizes[a];return 1===this.sizes[a]?c[d]=b:c.set(b,d),d<this.dirtyStart&&(this.dirtyStart=d),this.dirtyEnd<d+e&&(this.dirtyEnd=d+e),this}update(){var a=this.gl;if(this.dirtyStart>=this.dirtyEnd)return this;var b=this.data.subarray(this.dirtyStart,this.dirtyEnd),c=4*this.dirtyStart;return a.bindBuffer(a.UNIFORM_BUFFER,this.buffer),a.bufferSubData(a.UNIFORM_BUFFER,c,b),a.bindBuffer(a.UNIFORM_BUFFER,null),this.dirtyStart=this.size,this.dirtyEnd=0,this}delete(){var a=this.gl,b=this.appState,c=this.currentBase;return this.buffer&&(a.deleteBuffer(this.buffer),this.buffer=null,-1!==c&&b.uniformBuffers[c]===this&&(b.uniformBuffers[c]=null)),this}bind(a){var b=this.gl,c=this.appState,d=this.currentBase,e=c.uniformBuffers[a];return e!==this&&(e&&(e.currentBase=-1),-1!==d&&(c.uniformBuffers[d]=null),b.bindBufferBase(b.UNIFORM_BUFFER,a,this.buffer),c.uniformBuffers[a]=this,this.currentBase=a),this}}

function CreateUniformBuffer(a,b){var c=2<arguments.length&&arguments[2]!==void 0?arguments[2]:a.gl.DYNAMIC_DRAW;return new UniformBuffer(a.gl,a.state,b,c)}

class VertexArray{constructor(a,b){this.gl=a,this.appState=b,this.vertexArray=null,this.indexType=null,this.indexed=!1,this.numElements=0,this.numInstances=1,this.offsets=0,this.numDraws=1;}restore(){var a=this.appState;return a.vertexArray===this&&(a.vertexArray=null),null!==this.vertexArray&&(this.vertexArray=this.gl.createVertexArray()),this}vertexAttributeBuffer(a,b,c){return this.attributeBuffer(a,b,c,!1),this}instanceAttributeBuffer(a,b,c){return this.attributeBuffer(a,b,c,!0),this}indexBuffer(a){var b=this.gl;return null===this.vertexArray&&(this.vertexArray=b.createVertexArray()),this.bind(),b.bindBuffer(b.ELEMENT_ARRAY_BUFFER,a.buffer),this.numElements=3*a.numItems,this.indexType=a.type,this.indexed=!0,this}delete(){return this.vertexArray&&(this.gl.deleteVertexArray(this.vertexArray),this.vertexArray=null,this.appState.vertexArray===this&&(this.gl.bindVertexArray(null),this.appState.vertexArray=null)),this}bind(){return this.appState.vertexArray!==this&&(this.gl.bindVertexArray(this.vertexArray),this.appState.vertexArray=this),this}attributeBuffer(a,b){var c=2<arguments.length&&void 0!==arguments[2]?arguments[2]:{},d=3<arguments.length?arguments[3]:void 0,e=this.gl;null===this.vertexArray&&(this.vertexArray=e.createVertexArray()),this.bind(),e.bindBuffer(e.ARRAY_BUFFER,b.buffer);var{type:f=b.type,size:g=b.itemSize,offset:h=0,normalized:j=!1,integer:k=b.integer&&!j}=c,{stride:l=0}=c,m=b.numColumns;0===l&&(l=m*g*GetTypeSize(f));for(var n=0;n<m;n++)k?e.vertexAttribIPointer(a+n,g,f,l,h+n*g*GetTypeSize(f)):e.vertexAttribPointer(a+n,g,f,j,l,h+n*g*GetTypeSize(f)),d&&e.vertexAttribDivisor(a+n,1),e.enableVertexAttribArray(a+n);return 1===this.numDraws&&(d?this.numInstances=b.numItems:this.numElements=this.numElements||b.numItems),e.bindBuffer(e.ARRAY_BUFFER,null),this}}

function CreateVertexArray(a){return new VertexArray(a.gl,a.state)}

class WebGL2Renderer{constructor(a,b){this.width=0,this.height=0,this.viewport={x:0,y:0,width:0,height:0},this.currentDrawCalls=0,this.contextLostExt=null,this.contextRestoredHandler=null;var c=a.getContext("webgl2",b);this.gl=c,this.canvas=a,this.setState(),this.initExtensions(),this.width=c.drawingBufferWidth,this.height=c.drawingBufferHeight,this.setViewport(0,0,this.width,this.height),enableBlend(c),setBlendModeNormal(c),this.setDepthTest(!1),this.clearBits=c.COLOR_BUFFER_BIT|c.DEPTH_BUFFER_BIT|c.STENCIL_BUFFER_BIT,this.contextLostExt=null,this.contextRestoredHandler=null,a.addEventListener("webglcontextlost",a=>{a.preventDefault();}),a.addEventListener("webglcontextrestored",()=>{this.initExtensions(),this.contextRestoredHandler&&this.contextRestoredHandler();});}setState(){var a=this.gl,b=a.getParameter(a.MAX_COMBINED_TEXTURE_IMAGE_UNITS),c=a.getParameter(a.MAX_UNIFORM_BUFFER_BINDINGS),d=a.getExtension("EXT_texture_filter_anisotropic");return this.state={program:null,vertexArray:null,transformFeedback:null,activeTexture:-1,textures:Array(b),uniformBuffers:Array(c),freeUniformBufferBases:[],drawFramebuffer:null,readFramebuffer:null,extensions:{debugShaders:a.getExtension("WEBGL_debug_shaders"),multiDrawInstanced:a.getExtension("WEBGL_multi_draw_instanced")},maxTextureUnits:b,maxUniformBuffers:c,maxUniforms:Math.min(a.getParameter(a.MAX_VERTEX_UNIFORM_VECTORS),a.getParameter(a.MAX_FRAGMENT_UNIFORM_VECTORS)),textureAnisotropy:d,maxTextureAnisotropy:d?a.getParameter(d.MAX_TEXTURE_MAX_ANISOTROPY_EXT):1,samples:a.getParameter(a.SAMPLES),parallelShaderCompile:!!a.getExtension("KHR_parallel_shader_compile"),multiDrawInstanced:!!a.getExtension("WEBGL_multi_draw_instanced")},this}loseContext(){return this.contextLostExt&&this.contextLostExt.loseContext(),this}restoreContext(){return this.contextLostExt&&this.contextLostExt.restoreContext(),this}onContextRestored(a){return this.contextRestoredHandler=a,this}initExtensions(){var a=this.gl,b="WEBGL_compressed_texture_",c="EXT_disjoint_timer_query";["OES_texture_float_linear","EXT_color_buffer_float","EXT_texture_filter_anisotropic",b+"s3tc",b+"s3tc_srgb",b+"etc",b+"astc",b+"pvrtc",c,c+"_webgl2","KHR_parallel_shader_compile"].forEach(b=>{a.getExtension(b);}),this.contextLostExt=a.getExtension("WEBGL_lose_context");}setViewport(a,b,c,d){var e=this.viewport;return (e.width!==c||e.height!==d||e.x!==a||e.y!==b)&&(e.x=a,e.y=b,e.width=c,e.height=d,this.gl.viewport(a,b,c,d)),this}setDefaultViewport(){return this.setViewport(0,0,this.width,this.height),this}resize(a,b){return this.canvas.width=a,this.canvas.height=b,this.width=this.gl.drawingBufferWidth,this.height=this.gl.drawingBufferHeight,this.setViewport(0,0,this.width,this.height),this}setDepthTest(){var a=!(0<arguments.length&&void 0!==arguments[0])||arguments[0],b=this.gl;return a?b.enable(b.DEPTH_TEST):b.disable(b.DEPTH_TEST),this}setColorMask(c,d,e,b){return this.gl.colorMask(c,d,e,b),this}setClearColor(c,d,e,b){return this.gl.clearColor(c,d,e,b),this}setClearMask(a){return this.clearBits=a,this}clear(){return this.gl.clear(this.clearBits),this}}

var BaseLoaderState;(function(a){a[a.IDLE=0]="IDLE",a[a.LOADING=1]="LOADING",a[a.PROCESSING=2]="PROCESSING",a[a.COMPLETE=3]="COMPLETE",a[a.SHUTDOWN=4]="SHUTDOWN",a[a.DESTROYED=5]="DESTROYED";})(BaseLoaderState||(BaseLoaderState={}));

var FileState;(function(a){a[a.PENDING=0]="PENDING",a[a.LOADING=1]="LOADING",a[a.LOADED=2]="LOADED",a[a.FAILED=3]="FAILED",a[a.PROCESSING=4]="PROCESSING",a[a.ERRORED=5]="ERRORED",a[a.COMPLETE=6]="COMPLETE",a[a.DESTROYED=7]="DESTROYED",a[a.POPULATED=8]="POPULATED",a[a.TIMED_OUT=9]="TIMED_OUT",a[a.ABORTED=10]="ABORTED";})(FileState||(FileState={}));

function XHRLoader(a){var b=new XMLHttpRequest;a.xhrLoader=b;var c=a.xhrSettings;b.open("GET",a.url,c.async,c.username,c.password),b.responseType=c.responseType,b.timeout=c.timeout,b.setRequestHeader("X-Requested-With",c.requestedWith),c.header&&c.headerValue&&b.setRequestHeader(c.header,c.headerValue),c.overrideMimeType&&b.overrideMimeType(c.overrideMimeType);var d=new Map([["loadstart",b=>a.onLoadStart(b)],["load",b=>a.onLoad(b)],["loadend",b=>a.onLoadEnd(b)],["progress",b=>a.onProgress(b)],["timeout",b=>a.onTimeout(b)],["abort",b=>a.onAbort(b)],["error",b=>a.onError(b)]]);for(var[e,f]of d)b.addEventListener(e,f);a.resetXHR=()=>{for(var[a,c]of d)b.removeEventListener(a,c);},b.send();}

function XHRSettings(){var a=0<arguments.length&&arguments[0]!==void 0?arguments[0]:{responseType:"blob",async:!0,username:"",password:"",timeout:0};return {responseType:a.responseType,async:a.async,username:a.username,password:a.password,timeout:a.timeout,header:void 0,headerValue:void 0,requestedWith:"XMLHttpRequest",overrideMimeType:void 0}}

function File(a,b,c){return {key:a,url:b,type:c,xhrLoader:void 0,xhrSettings:XHRSettings(),data:null,state:FileState.PENDING,bytesLoaded:0,bytesTotal:0,percentComplete:0,load(){return this.state=FileState.PENDING,XHRLoader(this),new Promise((a,b)=>{this.loaderResolve=a,this.loaderReject=b;})},onLoadStart(a){this.state=FileState.LOADING;},onLoad(a){var b=this.xhrLoader,c=b.responseURL&&0===b.responseURL.indexOf("file://")&&0===b.status,d=!(a.target&&200!==b.status)||c;4===b.readyState&&400<=b.status&&599>=b.status&&(d=!1),this.onProcess().then(()=>this.onComplete()).catch(()=>this.onError());},onLoadEnd(a){this.resetXHR(),this.state=FileState.LOADED;},onTimeout(a){this.state=FileState.TIMED_OUT;},onAbort(a){this.state=FileState.ABORTED;},onError(a){this.state=FileState.ERRORED,this.fileReject&&this.fileReject(this);},onProgress(a){a.lengthComputable&&(this.bytesLoaded=a.loaded,this.bytesTotal=a.total,this.percentComplete=Math.min(a.loaded/a.total,1),void 0);},onProcess(){return this.state=FileState.PROCESSING,new Promise(a=>{a();})},onComplete(){this.state=FileState.COMPLETE,this.fileResolve?this.fileResolve(this):this.loaderResolve&&this.loaderResolve(this);},onDestroy(){this.state=FileState.DESTROYED;}}}

function ImageFile(a,b){b||(b=a+".png");var c=File(a,b,"image");return c.xhrSettings.responseType="blob",c.onProcess=()=>{c.state=FileState.PROCESSING;var a=new Image;return c.data=a,new Promise((b,d)=>{a.onload=()=>{a.onload=null,a.onerror=null,c.state=FileState.COMPLETE,b(c);},a.onerror=()=>{a.onload=null,a.onerror=null,c.state=FileState.FAILED,d(c);},a.src=c.url,a.complete&&a.width&&a.height&&(a.onload=null,a.onerror=null,c.state=FileState.COMPLETE,b(c));})},c}

function ITRS(a,b,c,d,e,f){if(0===d)return a.set(1,0,0,1,b,c);var g=Math.sin(d),h=Math.cos(d);return a.set(h*e,g*e,-g*f,h*f,b,c)}

class Matrix2D{constructor(){var e=0<arguments.length&&arguments[0]!==void 0?arguments[0]:1,a=1<arguments.length&&arguments[1]!==void 0?arguments[1]:0,b=2<arguments.length&&arguments[2]!==void 0?arguments[2]:0,c=3<arguments.length&&arguments[3]!==void 0?arguments[3]:1,d=4<arguments.length&&arguments[4]!==void 0?arguments[4]:0,f=5<arguments.length&&arguments[5]!==void 0?arguments[5]:0;this.set(e,a,b,c,d,f);}set(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:1,a=1<arguments.length&&void 0!==arguments[1]?arguments[1]:0,b=2<arguments.length&&void 0!==arguments[2]?arguments[2]:0,c=3<arguments.length&&void 0!==arguments[3]?arguments[3]:1,d=4<arguments.length&&void 0!==arguments[4]?arguments[4]:0,f=5<arguments.length&&void 0!==arguments[5]?arguments[5]:0;return this.a=e,this.b=a,this.c=b,this.d=c,this.tx=d,this.ty=f,this}zero(){return this.set(0,0,0,0)}identity(){return this.set()}getArray(){return [this.a,this.b,this.c,this.d,this.tx,this.ty]}fromArray(a){return this.set(a[0],a[1],a[2],a[3],a[4],a[5])}getX(a,b){return a*this.a+b*this.c+this.tx}getY(a,b){return a*this.b+b*this.d+this.ty}[Symbol.iterator](){var a=this.getArray();return a[Symbol.iterator]()}}

class Matrix4{constructor(){var a=0<arguments.length&&arguments[0]!==void 0?arguments[0]:1,b=1<arguments.length&&arguments[1]!==void 0?arguments[1]:0,c=2<arguments.length&&arguments[2]!==void 0?arguments[2]:0,d=3<arguments.length&&arguments[3]!==void 0?arguments[3]:0,e=4<arguments.length&&arguments[4]!==void 0?arguments[4]:0,f=5<arguments.length&&arguments[5]!==void 0?arguments[5]:1,g=6<arguments.length&&arguments[6]!==void 0?arguments[6]:0,h=7<arguments.length&&arguments[7]!==void 0?arguments[7]:0,i=8<arguments.length&&arguments[8]!==void 0?arguments[8]:0,j=9<arguments.length&&arguments[9]!==void 0?arguments[9]:0,k=10<arguments.length&&arguments[10]!==void 0?arguments[10]:1,l=11<arguments.length&&arguments[11]!==void 0?arguments[11]:0,m=12<arguments.length&&arguments[12]!==void 0?arguments[12]:0,n=13<arguments.length&&arguments[13]!==void 0?arguments[13]:0,o=14<arguments.length&&arguments[14]!==void 0?arguments[14]:0,p=15<arguments.length&&arguments[15]!==void 0?arguments[15]:1;this.set(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p);}set(){var a=0<arguments.length&&void 0!==arguments[0]?arguments[0]:1,b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:0,c=2<arguments.length&&void 0!==arguments[2]?arguments[2]:0,d=3<arguments.length&&void 0!==arguments[3]?arguments[3]:0,e=4<arguments.length&&void 0!==arguments[4]?arguments[4]:0,f=5<arguments.length&&void 0!==arguments[5]?arguments[5]:1,g=6<arguments.length&&void 0!==arguments[6]?arguments[6]:0,h=7<arguments.length&&void 0!==arguments[7]?arguments[7]:0,i=8<arguments.length&&void 0!==arguments[8]?arguments[8]:0,j=9<arguments.length&&void 0!==arguments[9]?arguments[9]:0,k=10<arguments.length&&void 0!==arguments[10]?arguments[10]:1,l=11<arguments.length&&void 0!==arguments[11]?arguments[11]:0,m=12<arguments.length&&void 0!==arguments[12]?arguments[12]:0,n=13<arguments.length&&void 0!==arguments[13]?arguments[13]:0,o=14<arguments.length&&void 0!==arguments[14]?arguments[14]:0,p=15<arguments.length&&void 0!==arguments[15]?arguments[15]:1;return this.m00=a,this.m01=b,this.m02=c,this.m03=d,this.m10=e,this.m11=f,this.m12=g,this.m13=h,this.m20=i,this.m21=j,this.m22=k,this.m23=l,this.m30=m,this.m31=n,this.m32=o,this.m33=p,this}zero(){return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)}identity(){return this.set()}getArray(){return [this.m00,this.m01,this.m02,this.m03,this.m10,this.m11,this.m12,this.m13,this.m20,this.m21,this.m22,this.m23,this.m30,this.m31,this.m32,this.m33]}fromArray(a){return this.set(a[0],a[1],a[2],a[3],a[4],a[5],a[6],a[7],a[8],a[9],a[10],a[11],a[12],a[13],a[14],a[15])}[Symbol.iterator](){var a=this.getArray();return a[Symbol.iterator]()}}

function Ortho(a,b,c,d,e,f){var g=1/(a-b),h=1/(c-d),i=1/(e-f);return new Matrix4(-2*g,0,0,0,0,-2*h,0,0,0,0,2*i,0,(a+b)*g,(d+c)*h,(f+e)*i,1)}

class Vec2{constructor(){var a=0<arguments.length&&arguments[0]!==void 0?arguments[0]:0,b=1<arguments.length&&arguments[1]!==void 0?arguments[1]:0;this.set(a,b);}set(){var a=0<arguments.length&&void 0!==arguments[0]?arguments[0]:0,b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:0;return this.x=a,this.y=b,this}zero(){return this.set()}getArray(){return [this.x,this.y]}fromArray(a){return this.set(a[0],a[1])}[Symbol.iterator](){var a=this.getArray();return a[Symbol.iterator]()}}

class Quad{constructor(a,b,c,d){_defineProperty(this,"transform",void 0),_defineProperty(this,"topLeft",void 0),_defineProperty(this,"topRight",void 0),_defineProperty(this,"bottomLeft",void 0),_defineProperty(this,"bottomRight",void 0),_defineProperty(this,"_position",void 0),_defineProperty(this,"_size",void 0),_defineProperty(this,"_scale",void 0),_defineProperty(this,"_origin",void 0),_defineProperty(this,"_rotation",void 0),_defineProperty(this,"dirty",void 0),this._position=new Vec2(a,b),this._size=new Vec2(c,d),this._scale=new Vec2(1,1),this._origin=new Vec2(.5,.5),this._rotation=0,this.transform=new Matrix2D,this.topLeft=new Vec2,this.topRight=new Vec2,this.bottomLeft=new Vec2,this.bottomRight=new Vec2,this.dirty=!0,this.update();}set x(a){this._position.x=a,this.dirty=!0;}get x(){return this._position.x}set y(a){this._position.y=a,this.dirty=!0;}get y(){return this._position.y}set rotation(a){this._rotation=a,this.dirty=!0;}get rotation(){return this._rotation}set scaleX(a){this._scale.x=a,this.dirty=!0;}get scaleX(){return this._scale.x}set scaleY(a){this._scale.y=a,this.dirty=!0;}get scaleY(){return this._scale.y}set originX(a){this._origin.x=a,this.dirty=!0;}get originX(){return this._origin.x}set originY(a){this._origin.y=a,this.dirty=!0;}get originY(){return this._origin.y}update(){if(!this.dirty)return !1;var e=this._size.x,f=this._size.y,g=-(this._origin.x*e),h=g+e,i=-(this._origin.y*f),j=i+f,k=this.transform;ITRS(k,this._position.x,this._position.y,this._rotation,this._scale.x,this._scale.y);var{a:l,b:a,c:b,d:c,tx:d,ty:m}=k,n=g*l,o=g*a,p=i*b,q=i*c,r=h*l,s=h*a,t=j*b,u=j*c;return this.topLeft.set(n+p+d,o+q+m),this.topRight.set(r+p+d,s+q+m),this.bottomLeft.set(n+t+d,o+u+m),this.bottomRight.set(r+t+d,s+u+m),this.dirty=!1,!0}}var fs="#version 300 es\nprecision highp float;\n\nlayout(std140, column_major) uniform;\n\nuniform SceneUniforms {\n    mat4 uProjectionMatrix;\n};\n\nuniform sampler2D texture0;\n\nin vec2 outUV;\n\nout vec4 fragColor;\n\nvoid main() {\n    fragColor = texture(texture0, outUV);\n}\n",app=new WebGL2Renderer(document.getElementById("game"));app.setClearColor(0,0,0,1);var program=CreateProgram(app,"#version 300 es\nprecision highp float;\n\nlayout(location=0) in vec2 position;\nlayout(location=1) in vec2 uv;\n\nuniform SceneUniforms {\n    mat4 uProjectionMatrix;\n};\n\nout vec2 outUV;\n\nvoid main()\n{\n    outUV = uv;\n\n    gl_Position = uProjectionMatrix * vec4(position, 0.0, 1.0);\n}\n",fs),projectionMatrix=Ortho(0,app.width,app.height,0,-1e3,1e3),sub=CreateUniformBuffer(app,[app.gl.FLOAT_MAT4]);sub.set(0,projectionMatrix.getArray()).update();for(var UVTL=new Vec2(0,0),UVTR=new Vec2(1,0),UVBL=new Vec2(0,1),UVBR=new Vec2(1,1),quads=[],max=1e3,i=0;i<max;i++){var x=Math.floor(Math.random()*app.width),y=Math.floor(Math.random()*app.height),quad=new Quad(x,y,64,64);quads.push(quad);}var dataTA=new Float32Array(4*(16*max)),offset=0,ibo=[],iboIndex=0;quads.forEach(a=>{dataTA[offset+0]=a.topLeft.x,dataTA[offset+1]=a.topLeft.y,dataTA[offset+2]=UVTL.x,dataTA[offset+3]=UVTL.y,dataTA[offset+4]=a.bottomLeft.x,dataTA[offset+5]=a.bottomLeft.y,dataTA[offset+6]=UVBL.x,dataTA[offset+7]=UVBL.y,dataTA[offset+8]=a.bottomRight.x,dataTA[offset+9]=a.bottomRight.y,dataTA[offset+10]=UVBR.x,dataTA[offset+11]=UVBR.y,dataTA[offset+12]=a.topRight.x,dataTA[offset+13]=a.topRight.y,dataTA[offset+14]=UVTR.x,dataTA[offset+15]=UVTR.y,ibo.push(iboIndex+0,iboIndex+1,iboIndex+2,iboIndex+2,iboIndex+3,iboIndex+0),iboIndex+=4,offset+=16;}),void 0;var buffer=CreateInterleavedBuffer(app,16,dataTA),indices=CreateIndexBuffer(app,app.gl.UNSIGNED_SHORT,3,new Uint16Array(ibo)),batch=CreateVertexArray(app);batch.vertexAttributeBuffer(0,buffer,{type:app.gl.FLOAT,size:2,offset:0,stride:16}),batch.vertexAttributeBuffer(1,buffer,{type:app.gl.FLOAT,size:2,offset:8,stride:16}),batch.indexBuffer(indices),ImageFile("sprites","../assets/box-item-boxed.png").load().then(a=>{function b(){var a=0,c=!1;quads.forEach(b=>{b.x+=1,b.x>app.width&&(b.x=-64),b.update()&&(dataTA[a+0]=b.topLeft.x,dataTA[a+1]=b.topLeft.y,dataTA[a+4]=b.bottomLeft.x,dataTA[a+5]=b.bottomLeft.y,dataTA[a+8]=b.bottomRight.x,dataTA[a+9]=b.bottomRight.y,dataTA[a+12]=b.topRight.x,dataTA[a+13]=b.topRight.y,c=!0),a+=16;}),c&&buffer.data(dataTA),app.clear(),d.draw(),requestAnimationFrame(b);}var c=CreateTexture2D(app,a.data),d=CreateDrawCall(app,program,batch);d.uniformBlock("SceneUniforms",sub),d.texture("texture0",c),b();});
//# sourceMappingURL=test033.js.map
