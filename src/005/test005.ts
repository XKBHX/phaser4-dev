import * as Phaser from 'phaser';

new Phaser.Game((game) => {

    let browser = Phaser.Device.Browser;

    game.text(10, 20, 'Phaser 4 Test 5');

    game.text(10, 60, 'Chrome: ' + browser.chrome);
    game.text(200, 60, 'Version: ' + browser.chromeVersion);

    game.text(10, 80, 'Firefox: ' + browser.firefox);
    game.text(200, 80, 'Version: ' + browser.firefoxVersion);

    game.text(10, 100, 'MSIE: ' + browser.ie);
    game.text(200, 100, 'Version: ' + browser.ieVersion);

    game.text(10, 120, 'Trident: ' + browser.trident);
    game.text(200, 120, 'Version: ' + browser.tridentVersion);

    game.text(10, 140, 'Safari: ' + browser.safari);
    game.text(200, 140, 'Version: ' + browser.safariVersion);

    game.text(10, 160, 'Edge: ' + browser.edge);
    game.text(10, 180, 'Opera: ' + browser.opera);
    game.text(10, 200, 'Silk: ' + browser.silk);
    game.text(10, 220, 'Mobile Safari: ' + browser.mobileSafari);

});
