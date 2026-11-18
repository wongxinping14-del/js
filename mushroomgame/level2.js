
class level2 extends Phaser.Scene {
  constructor() {
    super({
      key: "level2",
    });

    this.carrotCounter = 0;
    this.onionCounter = 0;
    this.totalCollected = 0;
    this.isTransitioning = false;
    this.collectibles = [];
    this.health = 3;
    this.isHurt = false;
  }

  preload() {
    // Load tilemap (l2.tmj is the current Tiled map for level 2)
    this.load.tilemapTiledJSON("level2", "assets/l2.tmj?v=6");

    // Load images
    this.load.image("defimonImg", "assets/defimon1.png");
    this.load.image("plant2Img", "assets/plant2.png");
    this.load.image("Exterior_TilesetImg", "assets/Exterior_Tileset.png");
    this.load.image("Crops_TilesetImg", "assets/Crops_Tileset.png");


    // Dog spritesheet for Tiled objects named dog1, dog2, ...
    this.load.spritesheet(
      "dog",
      "assets/Australian_Shepherd_64x64_FREE.png",
      {
        frameWidth: 64,
        frameHeight: 64,
      }
    );

    // Load carrots
    this.load.spritesheet("carrot", "assets/carrot.png", {
      frameWidth: 48,
      frameHeight: 48,
    });

    // Load onions
    this.load.spritesheet("onion", "assets/onion.png", {
      frameWidth: 48,
      frameHeight: 48,
    });
  }

  create() {
    console.log("*** level2 scene");

    // Reset counters
    this.carrotCounter = 0;
    this.onionCounter = 0;
    this.totalCollected = 0;
    this.isTransitioning = false;
    this.health = 3;
    this.isHurt = false;

    // Create map
    let map = this.make.tilemap({
      key: "level2",
    });

    // Add tilesets (names must match the tileset names in Tiled)
    let defimonLayer = map.addTilesetImage(
      "defimon1",
      "defimonImg"
    );

    let plantLayer = map.addTilesetImage(
      "plant2",
      "plant2Img"
    );

    let exteriorLayer = map.addTilesetImage(
      "Exterior_Tileset",
      "Exterior_TilesetImg"
    );

    let plantLayer2 = map.addTilesetImage(
      "Crops_Tileset",
      "Crops_TilesetImg"
    );

    // Check tilesets
    if (!defimonLayer || !plantLayer || !plantLayer2) {
      console.error("Tileset not found! Check Tiled names.");
      return;
    }

    // Exterior_Tileset is declared in the map but optional,
    // so only include it when Phaser could resolve it.
    let tilesArray = [
      defimonLayer,
      plantLayer,
      exteriorLayer,
      plantLayer2
    ].filter(Boolean);

    // Create layers
    this.groundLayer = map.createLayer(
      "groundLayer",
      tilesArray,
      0,
      0
    );

    this.wallLayer = map.createLayer(
      "wallLayer",
      tilesArray,
      0,
      0
    );

    if (!this.groundLayer || !this.wallLayer) {
      console.error(
        "Could not create map layers! Check layer names in Tiled."
      );
      return;
    }

    // Player frames and walk animations are created in preloadScene.

    // Find objects in Tiled
    let start = map.findObject(
      "objectLayer",
      (obj) => obj.name === "start"
    );

    let carrot1 = map.findObject(
      "objectLayer",
      (obj) => obj.name === "carrot1"
    );

    let carrot2 = map.findObject(
      "objectLayer",
      (obj) => obj.name === "carrot2"
    );

    let carrot3 = map.findObject(
      "objectLayer",
      (obj) => obj.name === "carrot3"
    );

    let onion1 = map.findObject(
      "objectLayer",
      (obj) => obj.name === "onion1"
    );

    let onion2 = map.findObject(
      "objectLayer",
      (obj) => obj.name === "onion2"
    );

    const dogObjects = map.filterObjects(
      "objectLayer",
      (obj) =>
        typeof obj.name === "string" &&
        obj.name.startsWith("dog")
    );

    this.end = map.findObject(
      "objectLayer",
      (obj) => obj.name === "end"
    );

    // Check objects
    if (
      !start ||
      !carrot1 ||
      !carrot2 ||
      !carrot3 ||
      !onion1 ||
      !onion2 ||
      !this.end
    ) {
      console.error("Missing objects in Tiled objectLayer!");
      return;
    }

    // Create player (Fox_player image)
    this.player = this.physics.add.sprite(
      start.x,
      start.y,
      "foxPlayer",
      "down"
    );

    this.player.setCollideWorldBounds(true);

    // Collision box at the fox's feet (before scaling, so it scales too)
    this.player.body.setSize(72, 56);
    this.player.body.setOffset(34, 71);

    this.player.setScale(0.5);

    this.lastDirection = "down";

    // Remember the start position (used when a dog attacks)
    this.startPoint = { x: start.x, y: start.y };

    window.player = this.player;

    // Create carrots and onions
    this.enemy1 = this.physics.add.sprite(
      carrot1.x,
      carrot1.y,
      "carrot",
      0
    );

    this.enemy2 = this.physics.add.sprite(
      carrot2.x,
      carrot2.y,
      "carrot",
      0
    );

    this.enemy3 = this.physics.add.sprite(
      carrot3.x,
      carrot3.y,
      "carrot",
      0
    );

    this.enemy4 = this.physics.add.sprite(
      onion1.x,
      onion1.y,
      "onion",
      0
    );

    this.enemy5 = this.physics.add.sprite(
      onion2.x,
      onion2.y,
      "onion",
      0
    );

    // -----------------------------
    // CREATE DOGS (objects named dog1, dog2, ...)
    // -----------------------------

    this.textures
      .get("dog")
      .setFilter(Phaser.Textures.FilterMode.NEAREST);

    // Dog walk animations
    // row 6 = walk left, row 7 = walk right (6 frames each)
    if (!this.anims.exists("dog-walk-left")) {
      this.anims.create({
        key: "dog-walk-left",
        frames: this.anims.generateFrameNumbers("dog", {
          start: 36,
          end: 41,
        }),
        frameRate: 8,
        repeat: -1,
      });

      this.anims.create({
        key: "dog-walk-right",
        frames: this.anims.generateFrameNumbers("dog", {
          start: 42,
          end: 47,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    this.dogs = dogObjects.map((obj, i) => {
      const dog = this.physics.add.sprite(
        obj.x,
        obj.y,
        "dog",
        0
      );

      dog.setScale(1.5);
      dog.body.setSize(30, 18, true);
      dog.body.setAllowGravity(false);
      dog.setImmovable(true);
      dog.setDepth(4);

      // Patrol left and right around the Tiled spawn point
      dog.startX = obj.x;
      dog.patrolRange = 80 + (i % 3) * 40;
      dog.speed = 40 + (i % 3) * 10;
      dog.dir = i % 2 === 0 ? -1 : 1;

      dog.anims.play(
        dog.dir < 0 ? "dog-walk-left" : "dog-walk-right",
        true
      );

      return dog;
    });

    console.log("Dogs created: " + this.dogs.length);

    // Dogs attack the player on contact
    this.dogs.forEach((dog) => {
      this.physics.add.overlap(
        this.player,
        dog,
        this.hitByDog,
        null,
        this
      );
    });

    // Store all collectibles
    this.collectibles = [
      this.enemy1,
      this.enemy2,
      this.enemy3,
      this.enemy4,
      this.enemy5,
    ];

    // Add overlap for all collectibles
    this.collectibles.forEach((item) => {
      item.body.setAllowGravity(false);

      this.physics.add.overlap(
        this.player,
        item,
        this.collect,
        null,
        this
      );
    });

    // Create end point
    let endWidth = this.end.width || 64;
    let endHeight = this.end.height || 64;

    let endX = this.end.width
      ? this.end.x + endWidth / 2
      : this.end.x;

    let endY = this.end.height
      ? this.end.y + endHeight / 2
      : this.end.y;

    this.endPoint = this.add.zone(
      endX,
      endY,
      endWidth,
      endHeight
    );

    this.physics.add.existing(this.endPoint);

    this.endPoint.body.setAllowGravity(false);
    this.endPoint.body.moves = false;
    this.endPoint.body.enable = false;

    // Player overlaps with end point
    this.physics.add.overlap(
      this.player,
      this.endPoint,
      this.reachEnd,
      null,
      this
    );

    // Keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys();

    // Camera follows player
    this.cameras.main.startFollow(this.player);

    this.cameras.main.setBounds(
      0,
      0,
      map.widthInPixels,
      map.heightInPixels
    );

    // World bounds
    this.physics.world.setBounds(
      0,
      0,
      map.widthInPixels,
      map.heightInPixels
    );

    // Wall collision
    if (this.wallLayer) {
      this.wallLayer.setCollisionByExclusion(-1, true);

      this.physics.add.collider(
        this.player,
        this.wallLayer
      );
    }

    // -----------------------------
    // COUNTER DISPLAY (TOP LEFT)
    // -----------------------------

    // Carrot icon
    this.carrotIcon = this.add.image(
      30,
      35,
      "carrot",
      0
    );

    this.carrotIcon.setDisplaySize(50, 50);
    this.carrotIcon.setScrollFactor(0);
    this.carrotIcon.setDepth(100);

    // Carrot counter
    this.carrotText = this.add.text(
      55,
      25,
      "0/3",
      {
        fontSize: "20px",
        color: "#ffffff",
        padding: {
          x: 8,
          y: 10,
        },
      }
    );

    this.carrotText.setScrollFactor(0);
    this.carrotText.setDepth(100);

    // Onion icon
    this.onionIcon = this.add.image(
      30,
      80,
      "onion",
      0
    );

    this.onionIcon.setDisplaySize(50, 50);
    this.onionIcon.setScrollFactor(0);
    this.onionIcon.setDepth(100);

    // Onion counter
    this.onionText = this.add.text(
      55,
      70,
      "0/2",
      {
        fontSize: "20px",
        color: "#ffffff",
        padding: {
          x: 8,
          y: 10,
        },
      }
    );

    this.onionText.setScrollFactor(0);
    this.onionText.setDepth(100);

    // -----------------------------
    // HEALTH DISPLAY (TOP RIGHT)
    // -----------------------------

    this.healthText = this.add.text(
      680,
      25,
      "HP: 3",
      {
        fontSize: "20px",
        color: "#ff6666",
        padding: {
          x: 8,
          y: 10,
        },
      }
    );

    this.healthText.setScrollFactor(0);
    this.healthText.setDepth(100);
  }

  setPlayerFrame(moving = false) {
    const flipX = this.lastDirection === "right";

    if (moving) {
      let animKey = "fox-walk-left";

      if (this.lastDirection === "down") {
        animKey = "fox-walk-down";
      } else if (this.lastDirection === "up") {
        animKey = "fox-walk-up";
      }

      this.player.setFlipX(flipX);
      this.player.anims.play(animKey, true);
      return;
    }

    let frame = "left";

    if (this.lastDirection === "up") {
      frame = "up";
    } else if (this.lastDirection === "down") {
      frame = "down";
    }

    this.player.anims.stop();

    if (this.player.frame.name !== frame) {
      this.player.setFrame(frame);
    }

    this.player.setFlipX(flipX);
  }

  update() {
    // -----------------------------
    // DOGS PATROL LEFT AND RIGHT
    // -----------------------------
    if (this.dogs) {
      this.dogs.forEach((dog) => {
        if (this.isTransitioning) {
          dog.setVelocityX(0);
          return;
        }

        // Turn around at patrol limits
        if (dog.x <= dog.startX - dog.patrolRange) {
          dog.dir = 1;
        } else if (dog.x >= dog.startX + dog.patrolRange) {
          dog.dir = -1;
        }

        dog.setVelocityX(dog.dir * dog.speed);

        dog.anims.play(
          dog.dir < 0 ? "dog-walk-left" : "dog-walk-right",
          true
        );
      });
    }

    if (!this.player || !this.cursors) return;

    if (this.isTransitioning) {
      this.player.setVelocity(0, 0);
      return;
    }

    let speed = 160;

    let velocityX = 0;
    let velocityY = 0;

    // Left and right movement
    if (this.cursors.left.isDown) {
      velocityX = -speed;
      this.lastDirection = "left";
    } else if (this.cursors.right.isDown) {
      velocityX = speed;
      this.lastDirection = "right";
    }

    // Up and down movement
    if (this.cursors.up.isDown) {
      velocityY = -speed;
      this.lastDirection = "up";
    } else if (this.cursors.down.isDown) {
      velocityY = speed;
      this.lastDirection = "down";
    }

    // Normalize diagonal movement
    let velocity = new Phaser.Math.Vector2(
      velocityX,
      velocityY
    );

    if (velocity.length() > 0) {
      velocity.normalize().scale(speed);

      this.player.setVelocity(
        velocity.x,
        velocity.y
      );
    } else {
      this.player.setVelocity(0, 0);
    }

    this.setPlayerFrame(velocity.length() > 0);

    // Unlock end after collecting all 5 items
    if (
      this.totalCollected >= 5 &&
      this.endPoint &&
      !this.endPoint.body.enable
    ) {
      this.endPoint.body.enable = true;
      console.log("End point unlocked!");
    }
  }

  // -----------------------------
  // DOG HITS THE PLAYER
  // -----------------------------
  hitByDog(player, dog) {
    // Ignore while already hurt, or after game over / level complete
    if (this.isHurt || this.isTransitioning) {
      return;
    }

    this.isHurt = true;
    this.health--;

    // Attack sound effect
    this.sound.play("attack", { volume: 0.8 });

    console.log(
      "Dog attacked the player! HP: " + this.health + "/3"
    );

    this.healthText.setText("HP: " + this.health);

    // Screen shake
    this.cameras.main.shake(200, 0.01);

    // Flash the player red
    player.setTint(0xff0000);

    this.time.delayedCall(300, () => {
      if (this.player && this.player.active) {
        this.player.clearTint();
      }
    });

    // Send the player back to the start position
    player.body.reset(this.startPoint.x, this.startPoint.y);
    this.lastDirection = "down";
    this.setPlayerFrame();

    console.log(
      "Player sent back to start. Remaining HP: " +
      this.health + "/3"
    );

    // Short invulnerability so the dog can't drain all HP instantly
    this.time.delayedCall(1000, () => {
      this.isHurt = false;
    });

    // Game over after 3 hits
    if (this.health <= 0) {
      this.isTransitioning = true;

      player.setVelocity(0, 0);
      player.anims.stop();

      this.healthText.setText("GAME OVER!");

      console.log("Player was defeated by the dogs!");

      // Restart the level after a short pause
      this.time.delayedCall(1200, () => {
        this.scene.restart();
      });
    }
  }

  // -----------------------------
  // COLLECT CARROTS AND ONIONS
  // -----------------------------
  collect(player, item) {
    if (!item.active || this.isTransitioning) return;

    console.log("Player collected an item!");

    // Pickup sound effect
    this.sound.play("pickup", { volume: 0.7 });

    // Camera shake
    this.cameras.main.shake(200, 0.005);

    // Remove collected item
    item.disableBody(true, true);

    // Update total
    this.totalCollected++;

    // Count carrots
    if (item.texture.key === "carrot") {
      this.carrotCounter++;
    }

    // Count onions
    else if (item.texture.key === "onion") {
      this.onionCounter++;
    }

    console.log("Carrots: " + this.carrotCounter + "/3");
    console.log("Onions: " + this.onionCounter + "/2");
    console.log("Total collected: " + this.totalCollected + "/5");

    // Update counter text
    this.carrotText.setText(
      this.carrotCounter + "/3"
    );

    this.onionText.setText(
      this.onionCounter + "/2"
    );
  }

  // -----------------------------
  // REACH THE END
  // -----------------------------
  reachEnd(player, endPoint) {
    if (
      this.totalCollected >= 5 &&
      !this.isTransitioning
    ) {
      this.isTransitioning = true;

      // Win sound effect
    

      console.log("Level 2 Completed!");

      this.player.setVelocity(0, 0);
      this.player.anims.stop();

      this.scene.start("level3");
    }
  }
}

// End of level2 class
