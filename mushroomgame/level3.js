class level3 extends Phaser.Scene {
  constructor() {
    super({
      key: "level3",
    });

    this.BaconCounter = 0;
    this.creamCounter = 0;
    this.totalCollected = 0;
    this.isTransitioning = false;
    this.collectibles = [];
  }

  preload() {
    // Load tilemap
    this.load.tilemapTiledJSON("level3", "assets/level3.tmj?v=5");

    // Load tileset images
    this.load.image("defimonImg", "assets/defimon1.png");

    this.load.image("endpageImg", "assets/endpage.png");

    this.load.image("16_windmillImg", "assets/16_windmill.png");

    // Hay bale image for Tiled objects named food1, food2, ...
    this.load.image("hayBaleImg", "assets/hay-bale.png");


    this.load.spritesheet("demo_cow_1Img", "assets/demo_cow_1.png", {
      frameWidth: 32,
      frameHeight: 32,
    });


    // Load Bacon spritesheet
    this.load.spritesheet("Bacon", "assets/Bacon.png", {
      frameWidth: 48,
      frameHeight: 48,
    });

    // Load cream spritesheet
    this.load.spritesheet("cream", "assets/cream.png", {
      frameWidth: 48,
      frameHeight: 48,
    });
  }

  create() {
    console.log("*** level3 scene");

    // Reset counters
    this.BaconCounter = 0;
    this.creamCounter = 0;
    this.totalCollected = 0;
    this.isTransitioning = false;
    this.collectibles = [];

    // Player health
    this.health = 3;
    this.isHurt = false;

    // -----------------------------
    // CREATE TILEMAP
    // -----------------------------

    const map = this.make.tilemap({
      key: "level3",
    });

    // Tileset names must match the names in level3.tmj
    const defimonLayer = map.addTilesetImage(
      "defimon1",
      "defimonImg"
    );

    const windmillLayer = map.addTilesetImage(
      "16_windmill",
      "16_windmillImg"
    );

    if (!defimonLayer || !windmillLayer) {
      console.error("Tileset not found! Check tileset names in Tiled.");
      return;
    }

    const tilesArray = [defimonLayer, windmillLayer];

    // Create ground layer
    this.groundLayer = map.createLayer("groundLayer", tilesArray, 0, 0);

    // Create wall layer
    this.wallLayer = map.createLayer("wallLayer", tilesArray, 0, 0);

    // Create decoration layer (houses, trees, etc.)
    this.decoLayer = map.createLayer("decoLayer", tilesArray, 0, 0);

    if (!this.groundLayer || !this.wallLayer || !this.decoLayer) {
      console.error(
        "Could not create map layers! Check layer names in Tiled."
      );
      return;
    }

    this.decoLayer.setDepth(1);

    // -----------------------------
    // FIND TILED OBJECT LAYER
    // -----------------------------

    const objectLayer = map.getObjectLayer("objectLayer");

    if (!objectLayer) {
      console.error(
        "Cannot find objectLayer! Check the Object Layer name in Tiled.",
      );

      console.log(
        "Available map object layers:",
        map.objects?.map((layer) => layer.name),
      );

      return;
    }

    // Display all object names
    console.log(
      "Objects found in Tiled:",
      objectLayer.objects.map((obj) => obj.name),
    );

    // Find object by name
    const getObject = (name) => {
      const obj = objectLayer.objects.find((obj) => obj.name === name);

      if (!obj) {
        console.error("Missing Tiled object: " + name);
      }

      return obj;
    };

    // Find player starting point
    const start = getObject("start");

    // Find Bacon objects
    const Bacon1 = getObject("Bacon1");
    const Bacon2 = getObject("Bacon2");
    const Bacon3 = getObject("Bacon3");

    // Find cream objects
    const cream1 = getObject("cream1");
    const cream2 = getObject("cream2");
    const cream3 = getObject("cream3");

    // Check required objects
    if (
      !start ||
      !Bacon1 ||
      !Bacon2 ||
      !Bacon3 ||
      !cream1 ||
      !cream2 ||
      !cream3
    ) {
      console.error(
        "Missing objects in Tiled objectLayer! Check the object names above.",
      );
      return;
    }

    // -----------------------------
    // CREATE PLAYER
    // -----------------------------

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

    // Remember the start position (used when a cow attacks the player)
    this.startPoint = { x: start.x, y: start.y };

    window.player = this.player;

    // -----------------------------
    // CHARACTER ANIMATIONS
    // -----------------------------

    // Player frames and walk animations are created in preloadScene.

    // -----------------------------
    // COW ANIMATIONS (demo_cow_1 sheet: 8 cols x 6 rows, 32x32 frames)
    // row 3 = side walk, row 4 = front walk, row 5 = back walk
    // -----------------------------

    if (!this.anims.exists("cow-side")) {
      this.anims.create({
        key: "cow-side",
        frames: this.anims.generateFrameNumbers("demo_cow_1Img", {
          start: 24,
          end: 31,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.anims.exists("cow-front")) {
      this.anims.create({
        key: "cow-front",
        frames: this.anims.generateFrameNumbers("demo_cow_1Img", {
          start: 32,
          end: 39,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.anims.exists("cow-back")) {
      this.anims.create({
        key: "cow-back",
        frames: this.anims.generateFrameNumbers("demo_cow_1Img", {
          start: 40,
          end: 47,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // -----------------------------
    // PLAYER COLLISION
    // -----------------------------

    if (this.wallLayer) {
      this.wallLayer.setCollisionByExclusion(-1);

      this.physics.add.collider(this.player, this.wallLayer);
    }

    // -----------------------------
    // CREATE INGREDIENT FUNCTION
    // -----------------------------

    const createIngredient = (obj, texture) => {
      const item = this.physics.add.sprite(obj.x, obj.y, texture, 0);

      item.setImmovable(true);
      item.body.setAllowGravity(false);
      item.setDepth(5);

      // Smaller pickup (debug) box, centered inside the 48x48 frame
      item.body.setSize(26, 26, true);

      return item;
    };

    // -----------------------------
    // CREATE BACON
    // -----------------------------

    this.enemy1 = createIngredient(Bacon1, "Bacon");

    this.enemy2 = createIngredient(Bacon2, "Bacon");

    this.enemy3 = createIngredient(Bacon3, "Bacon");

    // -----------------------------
    // CREATE CREAM
    // -----------------------------

    this.enemy4 = createIngredient(cream1, "cream");

    this.enemy5 = createIngredient(cream2, "cream");

    this.enemy6 = createIngredient(cream3, "cream");

    // -----------------------------
    // CREATE HAY BALES (objects named food1, food2, ...)
    // -----------------------------

    const foodObjects = map.objects
      .reduce(
        (all, layer) => all.concat(layer.objects || []),
        []
      )
      .filter(
        (obj) =>
          typeof obj.name === "string" &&
          obj.name.startsWith("food")
      );

    this.textures
      .get("hayBaleImg")
      .setFilter(Phaser.Textures.FilterMode.NEAREST);

    this.food = foodObjects.map((obj) => {
      const hayBale = this.add.image(
        obj.x,
        obj.y,
        "hayBaleImg"
      );

      hayBale.setScale(2);
      hayBale.setDepth(2);

      return hayBale;
    });

    console.log("Hay bales created: " + this.food.length);

    // -----------------------------
    // CREATE COWS (objects named cow1, cow2, ...)
    // Each cow walks left and right (patrol) using cow-side animation
    // -----------------------------

    const cowObjects = objectLayer.objects.filter((obj) =>
      obj.name.startsWith("cow")
    );

    this.cows = cowObjects.map((obj, i) => {
      const cow = this.physics.add.sprite(obj.x, obj.y, "demo_cow_1Img", 0);

      cow.setScale(2);
      // Keep the physics (debug) box small even though the cow is drawn at 2x
      cow.body.setSize(40, 40, true);
      cow.setImmovable(true);
      cow.body.setAllowGravity(false);
      cow.setDepth(4);

      // Patrol settings: each cow walks back and forth around its start spot
      cow.startX = obj.x;
      cow.patrolRange = 80 + (i % 3) * 40; // 80 / 120 / 160 px
      cow.speed = 40 + (i % 3) * 10; // 40 / 50 / 60 px per second
      cow.dir = i % 2 === 0 ? -1 : 1; // alternate starting direction

      // Side-view walk animation (sprite faces left by default)
      cow.anims.play("cow-side");
      cow.flipX = cow.dir === 1;

      return cow;
    });

    console.log("Cows created: " + this.cows.length);

    // -----------------------------
    // COLLECTIBLES ARRAY
    // -----------------------------

    this.collectibles = [
      this.enemy1,
      this.enemy2,
      this.enemy3,
      this.enemy4,
      this.enemy5,
      this.enemy6,
    ];

    // Add overlap for all six ingredients
    this.collectibles.forEach((item) => {
      this.physics.add.overlap(this.player, item, this.collect, null, this);
    });

    // -----------------------------
    // COW ATTACKS THE PLAYER
    // -----------------------------

    if (this.cows) {
      this.cows.forEach((cow) => {
        this.physics.add.overlap(this.player, cow, this.hitByCow, null, this);
      });
    }

    // -----------------------------
    // KEYBOARD CONTROLS
    // -----------------------------

    this.cursors = this.input.keyboard.createCursorKeys();

    // -----------------------------
    // CAMERA
    // -----------------------------

    this.cameras.main.startFollow(this.player);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Set world bounds
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // -----------------------------
    // COUNTER TEXT
    // -----------------------------

    // Bacon icon
    this.BaconIcon = this.add.image(30, 35, "Bacon", 0);

    this.BaconIcon.setDisplaySize(50, 50);
    this.BaconIcon.setScrollFactor(0);
    this.BaconIcon.setDepth(100);

    // Bacon counter
    this.BaconText = this.add.text(55, 25, "0/3", {
      fontSize: "20px",
      color: "#ffffff",
      padding: {
        x: 8,
        y: 10,
      },
    });

    this.BaconText.setScrollFactor(0);
    this.BaconText.setDepth(100);

    // Cream icon
    this.creamIcon = this.add.image(30, 80, "cream", 0);

    this.creamIcon.setDisplaySize(50, 50);
    this.creamIcon.setScrollFactor(0);
    this.creamIcon.setDepth(100);

    // Cream counter
    this.creamText = this.add.text(55, 70, "0/3", {
      fontSize: "20px",
      color: "#ffffff",
      padding: {
        x: 8,
        y: 10,
      },
    });

    this.creamText.setScrollFactor(0);
    this.creamText.setDepth(100);

    // -----------------------------
    // HEALTH DISPLAY (TOP RIGHT)
    // -----------------------------

    this.healthText = this.add.text(680, 25, "HP: 3", {
      fontSize: "20px",
      color: "#ff6666",
      padding: {
        x: 8,
        y: 10,
      },
    });

    this.healthText.setScrollFactor(0);
    this.healthText.setDepth(100);
  }

  // =================================
  // COLLECT INGREDIENTS
  // =================================

  collect(player, item) {
    if (!item.active || this.isTransitioning) {
      return;
    }

    console.log("Player collected an item!");

    // Pickup sound effect
    this.sound.play("pickup", { volume: 0.7 });

    // Camera shake
    this.cameras.main.shake(200, 0.005);

    // Remove collected ingredient
    item.disableBody(true, true);

    // Update total
    this.totalCollected++;

    // Count Bacon
    if (item.texture.key === "Bacon") {
      this.BaconCounter++;
    }

    // Count Cream
    else if (item.texture.key === "cream") {
      this.creamCounter++;
    }

    // Update individual counters
    this.BaconText.setText(this.BaconCounter + "/3");
    this.creamText.setText(this.creamCounter + "/3");

    console.log("Bacon: " + this.BaconCounter + "/3");
    console.log("Cream: " + this.creamCounter + "/3");
    console.log("Total collected: " + this.totalCollected + "/6");

    // Complete game after collecting all 6 ingredients
    if (this.totalCollected >= 6) {
      this.isTransitioning = true;

      // Win sound effect
      this.sound.play("win", { volume: 0.8 });

      this.player.setVelocity(0, 0);
      this.player.anims.stop();

      this.BaconText.setText("SOUP READY!");
      this.creamText.setText("GAME COMPLETED!");

      console.log("Level 3 Completed!");

      // Show the end page image on top of the game, sized to the canvas
      const { width, height } = this.scale;
      const endPage = this.add
        .image(width / 2, height / 2, "endpageImg")
        .setDisplaySize(width, height)
        .setScrollFactor(0)
        .setDepth(200)
        .setAlpha(0);

      this.tweens.add({
        targets: endPage,
        alpha: 1,
        duration: 800,
      });
    }
  }

  // =================================
  // COW HITS THE PLAYER
  // =================================

  hitByCow(player, cow) {
    // Ignore while already hurt, or after game over / level complete
    if (this.isHurt || this.isTransitioning) {
      return;
    }

    this.isHurt = true;
    this.health--;

    // Attack sound effect
    this.sound.play("attack", { volume: 0.8 });

    console.log("Cow attacked the player! HP: " + this.health + "/3");

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
      "Player sent back to start. Remaining HP: " + this.health + "/3"
    );

    // Short invulnerability so one cow can't drain all HP instantly
    this.time.delayedCall(1000, () => {
      this.isHurt = false;
    });

    // Game over
    if (this.health <= 0) {
      this.isTransitioning = true;

      player.setVelocity(0, 0);
      player.anims.stop();

      this.healthText.setText("GAME OVER!");

      console.log("Player was defeated by the cows!");

      // Restart the level after a short pause
      this.time.delayedCall(1200, () => {
        this.scene.restart();
      });
    }
  }

  // =================================
  // PLAYER SPRITE DIRECTION
  // =================================

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

  // =================================
  // PLAYER MOVEMENT
  // =================================

  update() {
    // -----------------------------
    // COWS PATROL LEFT AND RIGHT
    // -----------------------------
    if (this.cows) {
      this.cows.forEach((cow) => {
        if (this.isTransitioning) {
          cow.setVelocityX(0);
          return;
        }

        // Turn around at patrol limits
        if (cow.x < cow.startX - cow.patrolRange) {
          cow.dir = 1; // walk right
        } else if (cow.x > cow.startX + cow.patrolRange) {
          cow.dir = -1; // walk left
        }

        cow.setVelocityX(cow.dir * cow.speed);

        // Sprite faces left by default, flip when walking right
        cow.flipX = cow.dir === 1;
      });
    }

    if (!this.player || !this.cursors || this.isTransitioning) {
      return;
    }

    const speed = 160;

    let velocityX = 0;
    let velocityY = 0;

    // Left and right
    if (this.cursors.left.isDown) {
      velocityX = -speed;
      this.lastDirection = "left";
    } else if (this.cursors.right.isDown) {
      velocityX = speed;
      this.lastDirection = "right";
    }

    // Up and down
    if (this.cursors.up.isDown) {
      velocityY = -speed;
      this.lastDirection = "up";
    } else if (this.cursors.down.isDown) {
      velocityY = speed;
      this.lastDirection = "down";
    }

    // Normalize diagonal movement
    const velocity = new Phaser.Math.Vector2(velocityX, velocityY);

    if (velocity.length() > 0) {
      velocity.normalize().scale(speed);

      this.player.setVelocity(velocity.x, velocity.y);
    } else {
      this.player.setVelocity(0, 0);
    }

    this.setPlayerFrame(velocity.length() > 0);
  }
}
