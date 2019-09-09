function isChrome(){var a=/Chrome\/(\d+)/.test(navigator.userAgent),b=a?parseInt(RegExp.$1,10):0;return {chrome:a,chromeVersion:b}}

var r=isChrome();console.log("Test 5:",r.chrome,r.chromeVersion);
