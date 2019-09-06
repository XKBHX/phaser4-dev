import * as Phaser from 'phaser';

new Phaser.Game((game) => {

    let video = Phaser.Device.Video;

    game.text(10, 20, 'Phaser.Device.Video');

    game.text(10, 60, 'Can Play h264 Video: ' + video.h264Video);
    game.text(10, 80, 'Can Play hls Video: ' + video.hlsVideo);
    game.text(10, 100, 'Can Play mp3 Video: ' + video.mp4Video);
    game.text(10, 120, 'Can Play ogg Video: ' + video.oggVideo);
    game.text(10, 140, 'Can Play vp9 Video: ' + video.vp9Video);
    game.text(10, 160, 'Can Play webM Video: ' + video.webmVideo);

});
