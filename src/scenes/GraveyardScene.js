import Phaser from 'phaser';
import { Player } from '../objects/Player.js';
import { Zombie } from '../objects/Zombie.js';
import { Ghoul } from '../objects/Ghoul.js';
import { GraveGuardian } from '../objects/GraveGuardian.js';
import { TouchControls } from '../systems/TouchControls.js';

export class GraveyardScene extends Phaser.Scene {
  constructor() {
    super('GraveyardScene');
  }

  init() {
    // Game state
    this.player = null;
    this.enemies = [];
    this.boss = null;
    this.platforms = null;
    this.oneWayPlatforms = null;
    this.groundY = 176; // Ground top surface at y=176 (screen bottom 224 - ground height 48)
    this.levelWidth = 3200; // 10 screens wide
    this.cameraFollowPlayer = true;
    this.gameOver = false;
    this.levelComplete = false;
    
    // Score and lives
    this.score = 0;
    this.lives = 3;
    this.maxLives = 5;
    
    // Enemy spawn points
    this.spawnPoints = [
      { x: 400, type: 'zombie' },
      { x: 550, type: 'zombie' },
      { x: 700, type: 'ghoul' },
      { x: 900, type: 'zombie' },
      { x: 1100, type: 'zombie' },
      { x: 1250, type: 'ghoul' },
      { x: 1400, type: 'zombie' },
      { x: 1600, type: 'zombie' },
      { x: 1800, type: 'ghoul' },
      { x: 2000, type: 'zombie' },
      { x: 2200, type: 'zombie' },
      { x: 2400, type: 'ghoul' },
      { x: 2600, type: 'zombie' },
      { x: 2800, type: 'ghoul' },
    ];
    this.spawnedEnemies = new Set();
    
    // Boss area
    this.bossAreaStart = 2900;
    this.bossSpawned = false;
  }

  create() {
    // Create world bounds
    this.physics.world.setBounds(0, 0, this.levelWidth, 224);
    
    // Create background
    this.createBackground();
    
    // Create ground/platforms
    this.createPlatforms();
    
    // Create player
    this.player = new Player(this, 100, this.groundY - 50);
    
    // Set up camera
    this.cameras.main.setBounds(0, 0, this.levelWidth, 224);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(40, 20);
    
    // Set up collisions (platform collision with one-way callback is set up in createPlatforms)
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.enemies, this.oneWayPlatforms);
    
    // Player vs enemies (contact damage)
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerEnemyContact, null, this);
    
    // Player projectile vs enemies (handled in Player.spawnProjectile)
    // Player projectile vs boss (handled in Player.spawnProjectile)
    
    // Boss vs player
    this.physics.add.overlap(this.player, this.boss, this.onPlayerBossContact, null, this);
    
    // Set up touch controls (uses DOM buttons)
    this.touchControls = new TouchControls(this);
    
    // Set up keyboard input
    this.setupKeyboard();
    
    // UI Scene will handle HUD
    this.events.emit('hud-update', { score: this.score, lives: this.lives, maxLives: this.maxLives });
    
    // Spawn initial enemies
    this.spawnEnemiesInRange(0, 800);
  }

  createBackground() {
    // Far background (parallax) - using the parallax background image
    this.bgFar = this.add.tileSprite(0, 0, this.levelWidth, 224, 'parallax-bg')
      .setOrigin(0, 0)
      .setScrollFactor(0.1)
      .setDepth(0);

    // Shift the view downward to show lower portion of the image (graves, lower trees, ground)
    // Image is 1168x784, tileSprite shows 224px. Offset to show lower portion.
    this.bgFar.tilePositionY = 320;
    
    // Mid background - additional tombstones
    this.bgMid = this.add.group();
    for (let x = 200; x < this.levelWidth; x += 200) {
      const y = 140 + Phaser.Math.Between(-10, 10);
      const tombstone = this.add.rectangle(x, y, 16, Phaser.Math.Between(30, 50), 0x251828)
        .setOrigin(0.5, 1)
        .setScrollFactor(0.3)
        .setDepth(1);
      // Cross
      this.add.rectangle(x, y - 40, 6, 12, 0x352038)
        .setOrigin(0.5, 1)
        .setScrollFactor(0.3)
        .setDepth(1);
      this.add.rectangle(x - 6, y - 35, 18, 6, 0x352038)
        .setOrigin(0.5, 1)
        .setScrollFactor(0.3)
        .setDepth(1);
  }
    
    // Ground decoration
    this.groundDecals = this.add.group();
    for (let x = 0; x < this.levelWidth; x += 32) {
      if (Phaser.Math.Between(0, 3) === 0) {
        this.add.rectangle(x + 16, 170, Phaser.Math.Between(8, 24), Phaser.Math.Between(2, 6), 0x1a1008)
          .setOrigin(0.5, 0)
          .setScrollFactor(1)
          .setDepth(4);
    }
  }
  }

  createPlatforms() {
      this.platforms = this.physics.add.staticGroup();
      this.oneWayPlatforms = this.physics.add.staticGroup();
    
      // Main ground - ONE CONTINUOUS BODY to prevent player getting stuck on seams
      // Ground visual bottom aligns with screen bottom (224), ground is 48px tall
      const groundTopY = 176; // 224 - 48
      const ground = this.add.rectangle(this.levelWidth / 2, groundTopY, this.levelWidth, 48, 0x3d2818)
        .setOrigin(0.5, 0)
        .setDepth(5)
        .setVisible(false); // Invisible physics body
      this.platforms.add(ground);
      ground.body.setSize(this.levelWidth, 48);
      ground.body.setOffset(-this.levelWidth / 2, 0);
      ground.y = groundTopY;
    
      // Visual ground - tile the dirt texture seamlessly at correct position
      // Ground visual bottom at y=224, height 48px (scaled from 128 to 48 = 0.375)
      const groundScale = 48 / 128; // 0.375
      this.groundVisual = this.add.tileSprite(this.levelWidth / 2, groundTopY, this.levelWidth, 48, 'tiles', 'ground_dirt')
        .setOrigin(0.5, 0)
        .setDepth(5)
        .setScale(1, groundScale);
    
      // Normal solid ground collision (no one-way)
      this.physics.add.collider(this.player, ground);
    
      // Elevated platforms (one-way: jump through from below, solid from above)
      const platformData = [
        { x: 500, y: 100, w: 96, h: 16 },
        { x: 800, y: 80, w: 128, h: 16 },
        { x: 1200, y: 120, w: 64, h: 16 },
        { x: 1500, y: 90, w: 96, h: 16 },
        { x: 2000, y: 100, w: 128, h: 16 },
        { x: 2300, y: 80, w: 64, h: 16 },
        { x: 2700, y: 120, w: 96, h: 16 },
      ];
    
      // Create a process callback for one-way platforms
      const oneWayPlatformCallback = (player, platform) => {
        // Only collide if player is moving downward and feet are above platform top
        // Use body.bottom and platform.body.top for precise check
        return player.body.velocity.y >= 0 && player.body.bottom <= platform.body.top + 4;
      };
    
      // Set up collider with process callback for one-way behavior (only for elevated platforms)
      this.physics.add.collider(this.player, this.oneWayPlatforms, null, oneWayPlatformCallback, this);
    
      for (const p of platformData) {
        // Physics body - one-way platform (solid from top only)
        const plat = this.add.rectangle(p.x, p.y, p.w, p.h, 0x2a1a10)
          .setOrigin(0.5, 0)
          .setDepth(5)
          .setVisible(false);
        this.oneWayPlatforms.add(plat);
        plat.body.setSize(p.w, p.h);
        plat.body.setOffset(-p.w/2, 0);
        plat.y = p.y;
      
        // Visual platform using stone tiles
        const tileScale = 16 / 64; // 0.25
        const tileKeys = ['platform_stone_0_0', 'platform_stone_1_1', 'platform_stone_2_2', 'platform_stone_3_3', 'platform_stone_4_4'];
        const tileKey = tileKeys[Math.floor(Math.random() * tileKeys.length)];
      
        this.add.tileSprite(p.x, p.y, p.w, 16, 'tiles', tileKey)
          .setOrigin(0.5, 0)
          .setDepth(5)
          .setScale(1, tileScale);
      }
    
      // Boss area platform (also one-way)
      const bossPlat = this.add.rectangle(this.bossAreaStart + 100, 144, 400, 32, 0x1a0a10)
        .setOrigin(0.5, 0)
        .setDepth(5)
        .setVisible(false);
      this.oneWayPlatforms.add(bossPlat);
      bossPlat.body.setSize(400, 32);
      bossPlat.body.setOffset(-200, 0);
      bossPlat.y = 144;
    
      // Boss platform visual - use stone tiles
      const bossTileScale = 32 / 64; // 0.5
      this.add.tileSprite(this.bossAreaStart + 100, 144, 400, 32, 'tiles', 'platform_stone_2_2_center')
        .setOrigin(0.5, 0)
        .setDepth(5)
        .setScale(1, bossTileScale);
      this.add.sprite(this.bossAreaStart + 100 - 200 + 55, 144, 'tiles', 'platform_stone_2_2_left')
        .setOrigin(0.5, 0)
        .setDepth(6)
        .setScale(1, bossTileScale);
      this.add.sprite(this.bossAreaStart + 100 + 200 - 55, 144, 'tiles', 'platform_stone_2_2_right')
        .setOrigin(0.5, 0)
        .setDepth(6)
        .setScale(1, bossTileScale);
    }

  setupKeyboard() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyAttack = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyJump = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyCrouch = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.keyPause = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.keyPause.on('down', () => this.togglePause());
  }

  togglePause() {
    if (this.gameOver || this.levelComplete) return;
    this.scene.pause();
    this.scene.launch('PauseScene'); // We'll create this if needed
  }

  spawnEnemiesInRange(startX, endX) {
    for (const spawn of this.spawnPoints) {
      if (spawn.x >= startX && spawn.x < endX && !this.spawnedEnemies.has(spawn.x)) {
        this.spawnEnemy(spawn.x, spawn.type);
        this.spawnedEnemies.add(spawn.x);
    }
  }
  }

  spawnEnemy(x, type) {
    const y = this.groundY - (type === 'ghoul' ? 10 : 0);
    let enemy;
    
    if (type === 'zombie') {
      enemy = new Zombie(this, x, y);
    } else if (type === 'ghoul') {
      enemy = new Ghoul(this, x, y);
  }
    
    if (enemy) {
      this.physics.add.collider(enemy, this.platforms);
      this.enemies.push(enemy);
  }
  }

  checkBossSpawn() {
    if (!this.bossSpawned && this.player.x > this.bossAreaStart - 100) {
      this.spawnBoss();
  }
  }

  spawnBoss() {
    this.boss = new GraveGuardian(this, this.bossAreaStart + 200, this.groundY - 40);
    this.physics.add.collider(this.boss, this.platforms);
    this.bossSpawned = true;
    
    // Stop camera follow during boss fight
    this.cameras.main.stopFollow();
    this.cameras.main.pan(this.bossAreaStart, 0, 1000, 'Sine.easeInOut');
    
    // Boss music cue
    this.events.emit('boss-spawned');
  }

  onPlayerEnemyContact(player, enemy) {
    if (player.invulnerable || enemy.dying) return;
    
    // Only damage if enemy is attacking or player touches enemy
    if (enemy.attacking || Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y) < 30) {
      player.takeDamage(enemy.damage);
      this.events.emit('hud-update', { score: this.score, lives: this.lives, maxLives: this.maxLives });
    }
  }
  
  onPlayerBossContact(player, boss) {
    if (player.invulnerable || boss.dying) return;
    
    if (boss.attacking || Phaser.Math.Distance.Between(player.x, player.y, boss.x, boss.y) < 50) {
      player.takeDamage(boss.damage);
      this.events.emit('hud-update', { score: this.score, lives: this.lives, maxLives: this.maxLives });
    }
  }
  
  update(time, delta) {
    if (this.gameOver || this.levelComplete) return;
    
    // Update player
    if (this.player && this.player.active) {
      this.player.update(this.touchControls, this.cursors);
  }
    
    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.active || enemy.dying) {
        this.enemies.splice(i, 1);
        continue;
    }
      enemy.update(this.player);
  }
    
    // Update boss
    if (this.boss && this.boss.active) {
      this.boss.update(this.player);
  }
    
    // Check boss spawn
    this.checkBossSpawn();
    
    // Spawn more enemies as player progresses
    const spawnRange = this.player.x + 600;
    this.spawnEnemiesInRange(this.player.x - 200, spawnRange);
    
    // Check level complete
    if (this.boss && this.boss.dying && !this.levelComplete) {
      this.levelComplete = true;
      this.onLevelComplete();
  }
    
    // Parallax background
    if (this.bgFar) {
      this.bgFar.tilePositionX = this.cameras.main.scrollX * 0.1;
  }
  }

  onLevelComplete() {
    this.score += 5000; // Boss bonus
    this.events.emit('hud-update', { score: this.score, lives: this.lives, maxLives: this.maxLives });
    
    // Show victory
    this.time.delayedCall(2000, () => {
      this.showVictoryScreen();
    });
  }

  showVictoryScreen() {
    this.add.rectangle(160, 112, 320, 224, 0x000000, 0.8)
      .setScrollFactor(0)
      .setDepth(100);
    
    this.add.text(160, 80, 'LEVEL COMPLETE', {
      font: '24px monospace',
      fill: '#ffdd00',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    
    this.add.text(160, 130, `Score: ${this.score}`, {
      font: '18px monospace',
      fill: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    
    this.add.text(160, 170, 'Touch or Press X to Continue', {
      font: '14px monospace',
      fill: '#888888'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    
    this.input.once('pointerdown', () => this.restartLevel());
    this.keyAttack.once('down', () => this.restartLevel());
  }

  restartLevel() {
    this.scene.restart();
  }

  gameOverSequence() {
    this.gameOver = true;
    this.player.die();
    
    this.time.delayedCall(3000, () => {
      this.add.rectangle(160, 112, 320, 224, 0x000000, 0.9)
        .setScrollFactor(0)
        .setDepth(100);
      
      this.add.text(160, 80, 'GAME OVER', {
        font: '28px monospace',
        fill: '#c00000',
        stroke: '#000',
        strokeThickness: 4
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
      
      this.add.text(160, 130, `Final Score: ${this.score}`, {
        font: '18px monospace',
        fill: '#ffffff'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
      
      this.add.text(160, 170, 'Touch or Press X to Retry', {
        font: '14px monospace',
        fill: '#888888'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
      
      this.input.once('pointerdown', () => this.scene.restart());
      this.keyAttack.once('down', () => this.scene.restart());
    });
  }
}