
let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    backgroundColor: 'rgb(0, 0, 0)',
    scene: [ preloadScene,level1,level2,level3 ]

};

let game = new Phaser.Game(config);
var mushroomCounter = 0;
var carrotCounter = 0;
var onionCounter = 0;
var creamCounter = 0;
var BaconCounter = 0;