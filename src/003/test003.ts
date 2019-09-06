import * as Phaser from 'phaser';

let game = new Phaser.Game();
let os = Phaser.Device.GetOS();

game.text(10, 20, 'Phaser 4 Test 003');

game.text(10, 60, 'Android: ' + os.android);
game.text(10, 80, 'ChromeOS: ' + os.chromeOS);
game.text(10, 100, 'Cordova: ' + os.cordova);
game.text(10, 120, 'Crosswalk: ' + os.crosswalk);
game.text(10, 140, 'Ejecta: ' + os.ejecta);
game.text(10, 160, 'iOS: ' + os.iOS);
game.text(10, 180, 'iOSVerion: ' + os.iOSVersion);
game.text(10, 200, 'iPad: ' + os.iPad);
game.text(10, 220, 'iPhone: ' + os.iPhone);
game.text(10, 240, 'Kindle: ' + os.kindle);
game.text(10, 260, 'MacOS: ' + os.macOS);
game.text(10, 280, 'Node: ' + os.node);
game.text(10, 300, 'NodeWebkit: ' + os.nodeWebkit);
game.text(10, 320, 'WebApp: ' + os.webApp);
game.text(10, 340, 'Windows: ' + os.windows);
game.text(10, 360, 'Windows Phone: ' + os.windowsPhone);

game.text(400, 60, 'Desktop?: ' + os.desktop);
