
class level1 extends Phaser.Scene {
  constructor() {
    super({
      key: "level1",
    });

    this.mushroomCounter = 0;
    this.mushrooms = [];
    this.isTransitioning = false;
    this.health = 3;
    this.isHurt = false;
  }

  preload() {
    // Load Tiled map (?v= bumps the URL so browsers don't reuse an old cached map)
    this.load.tilemapTiledJSON("level1", "assets/level1.tmj?v=3");

    // Load images
    this.load.image("forestImg", "assets/forest_tiles.png");
    this.load.image("defimonImg", "assets/defimon1.png");
    // Frog spritesheet (4 frames, 35x32 each)
    this.load.spritesheet("frog", "assets/frog-idle.png", {
      frameWidth: 35,
      frameHeight: 32,
    });



    // Load mushroom spritesheet
    this.load.spritesheet("mushroom", "assets/mushroom.png", {
      frameWidth: 48,
      frameHeight: 48,
    });
  }

  create() {
    console.log("*** level1 scene");

    // Reset counters
    this.mushroomCounter = 0;
    this.isTransitioning = false;
    this.health = 3;
    this.isHurt = false;

    // Create tilemap
    let map = this.make.tilemap({
      key: "level1",
    });

    // Add tilesets
    let wallTiles = map.addTilesetImage(
      "forest_tiles",
      "forestImg"
    );

    let groundTiles = map.addTilesetImage(
      "defimon1",
      "defimonImg"
    );

    if (!wallTiles || !groundTiles) {
      console.error("Tileset not found! Check Tiled names.");
      return;
    }

    let tilesArray = [wallTiles, groundTiles];

    // Create map layers
    this.groundLayer = map.createLayer(
      "groundLayer",
      tilesArray,
      0,
      0
    );

    if (map.getLayer("wallLayer")) {
      this.wallLayer = map.createLayer(
        "wallLayer",
        tilesArray,
        0,
        0
      );
    }

    if (map.getLayer("testLayer")) {
      this.testLayer = map.createLayer(
        "testLayer",
        tilesArray,
        0,
        0
      );
    }

    // Player frames and walk animations are created in preloadScene.

    // Frog idle animation (4 frames from frog-idle.png)
    if (!this.anims.exists("frog-idle")) {
      this.anims.create({
        key: "frog-idle",
        frames: this.anims.generateFrameNumbers("frog", {
          start: 0,
          end: 3,
        }),
        frameRate: 1,
        repeat: -1,
      });
    }

    // Find objects in Tiled
    let start = map.findObject(
      "objectLayer",
      (obj) => obj.name === "start"
    );

    let mushroom1 = map.findObject(
      "objectLayer",
      (obj) => obj.name === "mushroom1"
    );

    let mushroom2 = map.findObject(
      "objectLayer",
      (obj) => obj.name === "mushroom2"
    );

    let mushroom3 = map.findObject(
      "objectLayer",
      (obj) => obj.name === "mushroom3"
    );

    this.end = map.findObject(
      "objectLayer",
      (obj) => obj.name === "end"
    );

    this.sign = map.findObject(
      "objectLayer",
      (obj) => obj.name === "sign"
    );

    // Check Tiled objects
    if (
      !start ||
      !mushroom1 ||
      !mushroom2 ||
      !mushroom3 ||
      !this.end
    ) {
      console.error(
        "Missing objects! Check objectLayer names in Tiled."
      );
      return;
    }

    // Create player (FoX_player image)
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

    // Remember the start position (used when a frog attacks)
    this.startPoint = { x: start.x, y: start.y };

    window.player = this.player;

    // Create mushrooms
    this.mushrooms = [
      this.physics.add.sprite(
        mushroom1.x,
        mushroom1.y,
        "mushroom",
        0
      ),

      this.physics.add.sprite(
        mushroom2.x,
        mushroom2.y,
        "mushroom",
        0
      ),

      this.physics.add.sprite(
        mushroom3.x,
        mushroom3.y,
        "mushroom",
        0
      ),
    ];

    // Add overlap for each mushroom
    this.mushrooms.forEach((mushroom) => {
      mushroom.body.setAllowGravity(false);

      this.physics.add.overlap(
        this.player,
        mushroom,
        this.collect,
        null,
        this
      );
    });

    // Create frogs (Tiled objects named frog1, frog2, ...)
    const frogObjects = map.filterObjects(
      "objectLayer",
      (obj) =>
        typeof obj.name === "string" &&
        obj.name.startsWith("frog")
    );

    if (frogObjects.length > 0) {
      this.frogs = frogObjects.map((obj) =>
        this.createFrog(obj.x, obj.y, obj.properties || [])
      );
    } else {
      // No frog objects in Tiled yet — show one demo frog near the start
      this.frogs = [
        this.createFrog(start.x + 120, start.y + 40),
      ];
    }

    // Frogs attack the player on contact
    this.frogs.forEach((frog) => {
      this.physics.add.overlap(
        this.player,
        frog,
        this.hitByFrog,
        null,
        this
      );
    });

    // Create end point
    this.endPoint = this.physics.add.sprite(
      this.end.x,
      this.end.y,
      null
    );

    this.endPoint.setVisible(false);
    this.endPoint.body.setAllowGravity(false);
    this.endPoint.body.setSize(80, 80);
    this.endPoint.body.enable = false;

    // Player reaches end point
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

    // Physics world bounds
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

      // Frogs intentionally do NOT collide with the wall layer,
      // so they can cross walls while walking up and down.
    }

    // -----------------------------
    // COUNTER DISPLAY (TOP LEFT)
    // -----------------------------

    // Mushroom icon
    this.mushroomIcon = this.add.image(
      30,
      45,
      "mushroom",
      0
    );

    this.mushroomIcon.setDisplaySize(50, 50);
    this.mushroomIcon.setScrollFactor(0);
    this.mushroomIcon.setDepth(100);

    // Mushroom counter
    this.counterText = this.add.text(
      55,
      25,
      "0/3",
      {
        fontSize: "20px",
        color: "#ffffff",
       // backgroundColor: "#000000",
        padding: {
          x: 10,
          y: 10,
        },
      }
    );

    this.counterText.setScrollFactor(0);
    this.counterText.setDepth(100);

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

    // -----------------------------
    // SIGN POPUP ("hello")
    // -----------------------------

    if (this.sign) {
      // Sign is a rectangle in Tiled, use its center
      this.signCenter = {
        x: this.sign.x + this.sign.width / 2,
        y: this.sign.y + this.sign.height / 2,
      };

      this.helloText = this.add
        .text(
          this.signCenter.x + 160,
          this.signCenter.y - 30,
          "Collect all the mushrooms to advance to the next level, and remember to avoid obstacles.",
          {
            fontSize: "16px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: { x: 10, y: 8 },
            wordWrap: { width: 260 },
            align: "center",
          }
        )
        .setOrigin(0.5)
        .setDepth(50)
        .setVisible(false);
    } else {
      console.error("Missing Tiled object: sign");
    }
  }

  // -----------------------------
  // CREATE A FROG
  // -----------------------------
  createFrog(x, y, properties = []) {
    const frog = this.physics.add.sprite(x, y, "frog", 0);

    frog.body.setAllowGravity(false);
    frog.body.setSize(26, 20);
    frog.setDepth(4);
    frog.setCollideWorldBounds(true);
    frog.anims.play("frog-idle");

    // Optional Tiled properties: patrolRange and walkSpeed
    const getNumberProperty = (name, fallback) => {
      const property = properties.find(
        (item) => item.name === name
      );

      if (!property) return fallback;

      const value = Number(property.value);
      return Number.isFinite(value) ? value : fallback;
    };

    // Walk only up and down around the spot placed in Tiled
    frog.startY = y;
    frog.patrolRange = getNumberProperty(
      "patrolRange",
      160
    );
    frog.walkSpeed = getNumberProperty(
      "walkSpeed",
      30
    );
    frog.walkDirectionY = Phaser.Math.RND.pick([-1, 1]);

    frog.setVelocityY(
      frog.walkDirectionY * frog.walkSpeed
    );

    return frog;
  }

  // -----------------------------
  // FROG WALKS UP AND DOWN
  // -----------------------------
  updateFrogs() {
    if (!this.frogs) return;

    this.frogs.forEach((frog) => {
      if (!frog.active || !frog.body) return;

      const top = frog.startY - frog.patrolRange;
      const bottom = frog.startY + frog.patrolRange;

      // Turn around at the patrol edge or the world bounds.
      // The frog does not collide with the wall layer.
      if (
        frog.walkDirectionY < 0 &&
        (frog.y <= top || frog.body.blocked.up)
      ) {
        frog.walkDirectionY = 1;
      } else if (
        frog.walkDirectionY > 0 &&
        (frog.y >= bottom || frog.body.blocked.down)
      ) {
        frog.walkDirectionY = -1;
      }

      frog.setVelocityY(
        frog.walkDirectionY * frog.walkSpeed
      );
      frog.anims.play("frog-idle", true);
    });
  }

  // -----------------------------
  // FROG HITS THE PLAYER
  // -----------------------------
  hitByFrog(player, frog) {
    // Ignore while already hurt, or after game over / level complete
    if (this.isHurt || this.isTransitioning) {
      return;
    }

    this.isHurt = true;
    this.health--;

    // Attack sound effect
    this.sound.play("attack", { volume: 0.8 });

    console.log(
      "Frog attacked the player! HP: " + this.health + "/3"
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

    // Short invulnerability so the frog can't drain all HP instantly
    this.time.delayedCall(1000, () => {
      this.isHurt = false;
    });

    // Game over after 3 hits
    if (this.health <= 0) {
      this.isTransitioning = true;

      player.setVelocity(0, 0);
      player.anims.stop();

      this.healthText.setText("GAME OVER!");

      console.log("Player was defeated by the frogs!");

      // Restart the level after a short pause
      this.time.delayedCall(1200, () => {
        this.scene.restart();
      });
    }
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
    if (!this.player || !this.cursors) return;

    // Stop movement after transition starts
    if (this.isTransitioning) {
      this.player.setVelocity(0, 0);
      return;
    }

    let speed = 160;

    let velocityX = 0;
    let velocityY = 0;

    // Move left and right
    if (this.cursors.left.isDown) {
      velocityX = -speed;
      this.lastDirection = "left";
    } else if (this.cursors.right.isDown) {
      velocityX = speed;
      this.lastDirection = "right";
    }

    // Move up and down
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

    // Show "hello" popup when player is near the sign
    if (this.helloText && this.signCenter) {
      let signDist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.signCenter.x,
        this.signCenter.y
      );

      this.helloText.setVisible(signDist < 70);
    }

    // Make frogs walk up and down
    this.updateFrogs();

    // Unlock end point after collecting all mushrooms
    if (
      this.mushroomCounter >= 3 &&
      this.endPoint &&
      !this.endPoint.body.enable
    ) {
      this.endPoint.body.enable = true;
      console.log("End point unlocked!");
    }
  }

  // -----------------------------
  // COLLECT MUSHROOMS
  // -----------------------------
  collect(player, item) {
    if (!item.active || this.isTransitioning) return;

    console.log("Player collected mushroom!");

    // Pickup sound effect
    this.sound.play("pickup", { volume: 0.7 });

    // Camera shake
    this.cameras.main.shake(200, 0.005);

    // Remove mushroom
    item.disableBody(true, true);

    // Update counter (only once)
    this.mushroomCounter++;

    console.log(
      "Mushroom Counter: " +
      this.mushroomCounter +
      "/3"
    );

    // Update counter text
    this.counterText.setText(
      this.mushroomCounter + "/3"
    );
  }

  // -----------------------------
  // REACH THE END
  // -----------------------------
  reachEnd(player, endPoint) {
    if (
      this.mushroomCounter >= 3 &&
      !this.isTransitioning
    ) {
      this.isTransitioning = true;



      console.log("Level 1 Completed!");

      this.player.setVelocity(0, 0);
      this.player.anims.stop();

      this.scene.start("level2");
    }
  }
}

// End of level1 class
