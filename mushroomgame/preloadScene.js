class preloadScene extends Phaser.Scene {

    constructor ()
    {
        super({ key: 'preloadScene' });
    }


    preload ()
    {
        // Load background music
        this.load.audio('ma1bgm', 'assets/ma1bgm.mp3');

        // Load attack sound effect
        this.load.audio('attack', 'assets/attack.mp3');

        // Load pickup sound effect
        this.load.audio('pickup', 'assets/pickup.mp3');

        // Load win sound effect
        this.load.audio('win', 'assets/win.mp3');

        // Load start screen image
        this.load.image('startBg', 'assets/start.png');

        // Load player fox image
        this.load.image('foxPlayer', 'assets/Fox_player.png');
    }

    create () {

        console.log("preloadScene")

        // Crop player frames out of the Fox_player sprite sheet
        const foxPlayerTexture = this.textures.get('foxPlayer');

        foxPlayerTexture.add('down', 0, 58, 0, 140, 128);
        foxPlayerTexture.add('up', 0, 44, 128, 140, 128);
        foxPlayerTexture.add('left', 0, 51, 640, 140, 128);

        // Walk frames cropped from the sheet
        const walkDownX = [51, 217, 385, 550, 712, 871, 1033, 1202, 1368];
        const walkLeftX = [50, 219, 385, 548, 713, 881, 1042, 1206, 1363];
        const walkUpX = [42, 215, 377, 536, 698, 861];

        walkDownX.forEach((x, i) => {
            foxPlayerTexture.add('walk-down-' + i, 0, x, 512, 140, 128);
        });

        walkLeftX.forEach((x, i) => {
            foxPlayerTexture.add('walk-left-' + i, 0, x, 640, 140, 128);
        });

        walkUpX.forEach((x, i) => {
            foxPlayerTexture.add('walk-up-' + i, 0, x, 128, 140, 128);
        });

        if (!this.anims.exists('fox-walk-down')) {
            this.anims.create({
                key: 'fox-walk-down',
                frames: this.anims.generateFrameNames('foxPlayer', {
                    prefix: 'walk-down-',
                    start: 0,
                    end: 8,
                }),
                frameRate: 9,
                repeat: -1,
            });

            this.anims.create({
                key: 'fox-walk-up',
                frames: this.anims.generateFrameNames('foxPlayer', {
                    prefix: 'walk-up-',
                    start: 0,
                    end: 5,
                }),
                frameRate: 7,
                repeat: -1,
            });

            this.anims.create({
                key: 'fox-walk-left',
                frames: this.anims.generateFrameNames('foxPlayer', {
                    prefix: 'walk-left-',
                    start: 0,
                    end: 8,
                }),
                frameRate: 9,
                repeat: -1,
            });
        }

        // Start screen image, scaled to cover the game canvas
        const { width, height } = this.scale;

        const startBg = this.add.image(
            width / 2,
            height / 2,
            'startBg'
        );

        const coverScale = Math.max(
            width / startBg.width,
            height / startBg.height
        );

        startBg
            .setScale(coverScale)
            .setScrollFactor(0)
            .setDepth(-1);

        // Background music (loops across all levels)
        this.bgm = this.sound.get('ma1bgm') ||
                   this.sound.add('ma1bgm', { loop: true, volume: 0.5 });

        // Browsers block audio until the first user interaction,
        // so start the music on the first key press / click
        const startMusic = () => {
            if (this.bgm && !this.bgm.isPlaying) {
                this.bgm.play();
            }
        };

        this.input.keyboard.once('keydown', startMusic);
        this.input.once('pointerdown', startMusic);

        var spaceDown = this.input.keyboard.addKey('SPACE');

        //this.input.once('pointerdown', function(){
        
        // 48 = 0, 49 = 1, ...
        let key1 = this.input.keyboard.addKey(49);
        let key2 = this.input.keyboard.addKey(50);
        let key3 = this.input.keyboard.addKey(51);
        

        key1.on('down', function(){
            this.scene.start("level1");
            }, this );
            
        key2.on('down', function(){
            this.scene.start("level2");
            }, this );
         
        key3.on('down', function(){
            this.scene.start("level3");
            }, this );   

        spaceDown.on('down', function(){
            this.scene.start("level1");
            }, this );

    }

}
