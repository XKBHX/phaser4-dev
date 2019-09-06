import { Game } from 'phaser/src/Game';
import { Android } from 'phaser/src/device/os/Android';
import { iOS as getiOS } from 'phaser/src/device/os/iOS';

let game = new Game();

let { iOS, iOSVersion, iPad, iPhone } = getiOS();

game.text(10, 20, 'Phaser 4 Test 004');

game.text(10, 60, 'Android: ' + Android());
game.text(10, 160, 'iOS: ' + iOS);
game.text(10, 180, 'iOSVerion: ' + iOSVersion);
game.text(10, 200, 'iPad: ' + iPad);
game.text(10, 220, 'iPhone: ' + iPhone);
