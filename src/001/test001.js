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

class Game{constructor(){var a=0<arguments.length&&arguments[0]!==void 0?arguments[0]:800,b=1<arguments.length&&arguments[1]!==void 0?arguments[1]:600;_defineProperty(this,"canvas",void 0),_defineProperty(this,"context",void 0),this.canvas=document.createElement("canvas"),this.canvas.width=a,this.canvas.height=b,document.body.appendChild(this.canvas),this.context=this.canvas.getContext("2d"),this.context.fillStyle="#2d2d2d",this.context.fillRect(0,0,a,b);}drawImage(a){var b=1<arguments.length&&arguments[1]!==void 0?arguments[1]:0,c=2<arguments.length&&arguments[2]!==void 0?arguments[2]:0;this.context.drawImage(a,b,c);}draw(a){this.context.fillStyle="#ff0000",this.context.fillText(a,10,40),this.context.fillStyle="#0000ff",this.context.fillText(a,10,20),this.context.fillStyle="#ffff00",this.context.fillText(a,10,60);}}

var FileState;(function(a){a[a.PENDING=0]="PENDING",a[a.LOADING=1]="LOADING",a[a.LOADED=2]="LOADED",a[a.FAILED=3]="FAILED",a[a.PROCESSING=4]="PROCESSING",a[a.ERRORED=5]="ERRORED",a[a.COMPLETE=6]="COMPLETE",a[a.DESTROYED=7]="DESTROYED",a[a.POPULATED=8]="POPULATED",a[a.TIMED_OUT=9]="TIMED_OUT",a[a.ABORTED=10]="ABORTED";})(FileState||(FileState={}));

function XHRLoader(a){var b=new XMLHttpRequest;a.xhrLoader=b;var c=a.xhrSettings;b.open("GET",a.url,c.async,c.username,c.password),b.responseType=c.responseType,b.timeout=c.timeout,b.setRequestHeader("X-Requested-With",c.requestedWith),c.header&&c.headerValue&&b.setRequestHeader(c.header,c.headerValue),c.overrideMimeType&&b.overrideMimeType(c.overrideMimeType);var d=new Map([["loadstart",b=>a.onLoadStart(b)],["load",b=>a.onLoad(b)],["loadend",b=>a.onLoadEnd(b)],["progress",b=>a.onProgress(b)],["timeout",b=>a.onTimeout(b)],["abort",b=>a.onAbort(b)],["error",b=>a.onError(b)]]);for(var[e,f]of d)b.addEventListener(e,f);a.resetXHR=()=>{for(var[a,c]of d)b.removeEventListener(a,c);},b.send();}

function XHRSettings(){var a=0<arguments.length&&arguments[0]!==void 0?arguments[0]:{responseType:"blob",async:!0,username:"",password:"",timeout:0};return {responseType:a.responseType,async:a.async,username:a.username,password:a.password,timeout:a.timeout,header:void 0,headerValue:void 0,requestedWith:"XMLHttpRequest",overrideMimeType:void 0}}

function File(a,b,c){return {key:a,url:b,type:c,xhrLoader:void 0,xhrSettings:XHRSettings(),data:null,state:FileState.PENDING,bytesLoaded:0,bytesTotal:0,percentComplete:0,load(){return console.log("File.load",this.key),this.state=FileState.PENDING,XHRLoader(this),new Promise((a,b)=>{this.loaderResolve=a,this.loaderReject=b;})},onLoadStart(a){console.log("onLoadStart"),this.state=FileState.LOADING;},onLoad(a){console.log("onLoad");var b=this.xhrLoader,c=b.responseURL&&0===b.responseURL.indexOf("file://")&&0===b.status,d=!(a.target&&200!==b.status)||c;4===b.readyState&&400<=b.status&&599>=b.status&&(d=!1),this.onProcess().then(()=>this.onComplete()).catch(()=>this.onError());},onLoadEnd(a){console.log("onLoadEnd"),this.resetXHR(),this.state=FileState.LOADED;},onTimeout(a){console.log("onTimeout"),this.state=FileState.TIMED_OUT;},onAbort(a){console.log("onAbort"),this.state=FileState.ABORTED;},onError(a){console.log("onError"),this.state=FileState.ERRORED,this.fileReject&&this.fileReject(this);},onProgress(a){console.log("onProgress"),a.lengthComputable&&(this.bytesLoaded=a.loaded,this.bytesTotal=a.total,this.percentComplete=Math.min(a.loaded/a.total,1),console.log(this.percentComplete,"%"));},onProcess(){return console.log("File.onProcess"),this.state=FileState.PROCESSING,new Promise(a=>{a();})},onComplete(){console.log("onComplete!"),this.state=FileState.COMPLETE,this.fileResolve?this.fileResolve(this):this.loaderResolve&&this.loaderResolve(this);},onDestroy(){this.state=FileState.DESTROYED;}}}

function ImageFile(a,b){b||(b=a+".png");var c=File(a,b,"image");return c.xhrSettings.responseType="blob",c.onProcess=()=>{console.log("ImageFile.onProcess"),c.state=FileState.PROCESSING;var a=new Image;return c.data=a,new Promise((b,d)=>{a.onload=()=>{console.log("ImageFile.onload"),a.onload=null,a.onerror=null,c.state=FileState.COMPLETE,b(c);},a.onerror=()=>{console.log("ImageFile.onerror"),a.onload=null,a.onerror=null,c.state=FileState.FAILED,d(c);},console.log("ImageFile.set src",c.url),a.src=c.url,a.complete&&a.width&&a.height&&(console.log("ImageFile.instant"),a.onload=null,a.onerror=null,c.state=FileState.COMPLETE,b(c));})},c}

var game=new Game;game.draw("Phaser 4 Test 001"),ImageFile("logo","../assets/logo.png").load().then(a=>{for(var d=0;10>d;d++){var b=700*Math.random(),c=500*Math.random();game.drawImage(a.data,b,c);}});
