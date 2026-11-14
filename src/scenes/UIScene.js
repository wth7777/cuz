import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  init() {
    this.score = 0;
    this.lives = 3;
    this.maxLives = 5;
  }

  create() {
    // HUD elements fixed to camera
    const cam = this.cameras.main;
    
    // Score
    this.scoreText = this.add.text(16, 16, 'SCORE: 000000', {
      font: '14px monospace',
      fill: '#ffdd00',
      stroke: '#000',
      strokeThickness: 3
    }).setScrollFactor(0).setDepth(100);
    
    // Lives
    this.livesContainer = this.add.container(cam.width - 80, 16).setScrollFactor(0).setDepth(100);
    
    this.livesLabel = this.add.text(0, 0, 'LIVES:', {
      font: '14px monospace',
      fill: '#ff6060',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0, 0.5);
    
    this.livesIcons = [];
    for (let i = 0; i < this.maxLives; i++) {
      const icon = this.add.image(70 + i * 18, 0, 'life-icon').setScale(0.8);
      if (i >= this.lives) icon.setAlpha(0.3);
      this.livesIcons.push(icon);
    }
    
    this.livesContainer.add([this.livesLabel, ...this.livesIcons]);
    
    // Listen for HUD updates from game scene
    this.events.on('hud-update', (data) => {
      this.updateHUD(data);
    });
    
    // Listen from game scene
    this.game.events.on('hud-update', (data) => {
      this.updateHUD(data);
    });
    
    // Mobile indicator (show touch controls hint)
    if (this.sys.game.device.input.touch) {
      this.add.text(cam.width / 2, cam.height - 30, '← →  ATTACK  JUMP', {
        font: '12px monospace',
        fill: '#888888',
        stroke: '#000',
        strokeThickness: 2
      }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    }
  }

  updateHUD(data) {
    if (data.score !== undefined) {
      this.score = data.score;
      this.scoreText.setText(`SCORE: ${this.score.toString().padStart(6, '0')}`);
    }
    if (data.lives !== undefined) {
      this.lives = data.lives;
      for (let i = 0; i < this.maxLives; i++) {
        this.livesIcons[i].setAlpha(i < this.lives ? 1 : 0.3);
      }
    }
    if (data.maxLives !== undefined) {
      this.maxLives = data.maxLives;
    }
  }
}