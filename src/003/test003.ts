import * as Phaser from 'phaser';

let game = new Phaser.Game();
// let os = Phaser.Device.OS.

let bob = Phaser.Device.GetOS()

game.text(100, 100, 'Phaser 4 Test 003');

