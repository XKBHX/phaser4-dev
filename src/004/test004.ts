import { Game } from 'phaser/src/Game';
import { isAndroid } from 'phaser/src/device/os/isAndroid';
import { isiOS } from 'phaser/src/device/os/isiOS';

new Game((game) => {

    let { iOS, iOSVersion, iPad, iPhone } = isiOS();

    game.text(10, 20, 'Phaser 4 Test 004');

    game.text(10, 60, 'Android: ' + isAndroid());
    game.text(10, 160, 'iOS: ' + iOS);
    game.text(10, 180, 'iOSVerion: ' + iOSVersion);
    game.text(10, 200, 'iPad: ' + iPad);
    game.text(10, 220, 'iPhone: ' + iPhone);

});
