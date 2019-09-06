import * as Phaser from 'phaser';

new Phaser.Game((game) => {

    let audio = Phaser.Device.Audio;

    game.text(10, 20, 'Phaser.Device.Audio');

    game.text(10, 60, 'Has Audio: ' + audio.audioData);
    game.text(10, 80, 'Has WebAudio: ' + audio.webAudio);
    game.text(10, 120, 'Can Play M4A: ' + audio.m4a);
    game.text(10, 140, 'Can Play MP3: ' + audio.mp3);
    game.text(10, 160, 'Can Play OGG: ' + audio.ogg);
    game.text(10, 180, 'Can Play Opus: ' + audio.opus);
    game.text(10, 200, 'Can Play WAV: ' + audio.wav);
    game.text(10, 220, 'Can Play WebM: ' + audio.webm);

});
