import { Game, Loader } from 'phaser/types';

var game=new Game,loader=new Loader.LoaderPlugin;game.draw("Phaser 4 Test 002"),loader.image("logo","../assets/logo.png").then(a=>{for(var d=0;10>d;d++){var b=700*Math.random(),c=500*Math.random();game.drawImage(a.data,b,c);}}).catch(()=>{console.log("failed");}),loader.start();
