import Phaser from 'phaser';

export class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.left = false;
    this.right = false;
    this.jumpPressed = false;
    this.attackPressed = false;
    this.crouch = false;
    
    this.createControls();
  }

  createControls() {
    const cam = this.scene.cameras.main;
    const width = cam.width;
    const height = cam.height;
    const buttonSize = 70;
    const padding = 20;
    
    // Left side - movement
    this.leftZone = this.scene.add.zone(padding + buttonSize/2, height - padding - buttonSize/2, buttonSize, buttonSize)
      .setDepth(200)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: false });
    
    this.rightZone = this.scene.add.zone(padding + buttonSize * 1.5, height - padding - buttonSize/2, buttonSize, buttonSize)
      .setDepth(200)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: false });
    
    // Right side - action buttons
    this.jumpZone = this.scene.add.zone(width - padding - buttonSize/2, height - padding - buttonSize/2, buttonSize, buttonSize)
      .setDepth(200)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: false });
    
    this.attackZone = this.scene.add.zone(width - padding - buttonSize * 1.5, height - padding - buttonSize/2, buttonSize, buttonSize)
      .setDepth(200)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: false });
    
    // Crouch zone (bottom center area)
    this.crouchZone = this.scene.add.zone(width / 2, height - padding - buttonSize/2, buttonSize * 2, buttonSize)
      .setDepth(200)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: false });
    
    // Visual feedback for buttons
    this.createButtonGraphics();
    
    // Set up event listeners
    this.setupTouchEvents();
    
    // Handle resize
    this.scene.scale.on('resize', (gameSize) => {
      this.updatePositions(gameSize);
    });
  }

  createButtonGraphics() {
    const cam = this.scene.cameras.main;
    const width = cam.width;
    const height = cam.height;
    const buttonSize = 70;
    const padding = 20;
    
    // Create graphics for visual feedback
    this.buttonGraphics = this.scene.add.graphics().setDepth(199).setScrollFactor(0);
    this.updateButtonGraphics();
  }

  updateButtonGraphics() {
    const g = this.buttonGraphics;
    g.clear();
    
    const cam = this.scene.cameras.main;
    const width = cam.width;
    const height = cam.height;
    const buttonSize = 70;
    const padding = 20;
    
    // Draw button backgrounds
    g.fillStyle(0x000000, 0.4);
    g.lineStyle(2, 0x444444, 0.8);
    
    // Left button
    g.fillRect(padding, height - padding - buttonSize, buttonSize, buttonSize);
    g.strokeRect(padding, height - padding - buttonSize, buttonSize, buttonSize);
    // Left arrow
    g.fillStyle(0xffffff, 0.7);
    g.beginPath();
    g.moveTo(padding + buttonSize * 0.6, height - padding - buttonSize * 0.5);
    g.lineTo(padding + buttonSize * 0.3, height - padding - buttonSize * 0.2);
    g.lineTo(padding + buttonSize * 0.3, height - padding - buttonSize * 0.8);
    g.closePath();
    g.fillPath();
    
    // Right button
    g.fillStyle(0x000000, 0.4);
    g.fillRect(padding + buttonSize * 1.2, height - padding - buttonSize, buttonSize, buttonSize);
    g.strokeRect(padding + buttonSize * 1.2, height - padding - buttonSize, buttonSize, buttonSize);
    // Right arrow
    g.fillStyle(0xffffff, 0.7);
    g.beginPath();
    g.moveTo(padding + buttonSize * 1.6, height - padding - buttonSize * 0.5);
    g.lineTo(padding + buttonSize * 1.9, height - padding - buttonSize * 0.2);
    g.lineTo(padding + buttonSize * 1.9, height - padding - buttonSize * 0.8);
    g.closePath();
    g.fillPath();
    
    // Jump button
    g.fillStyle(0x000000, 0.4);
    g.fillRect(width - padding - buttonSize, height - padding - buttonSize, buttonSize, buttonSize);
    g.strokeRect(width - padding - buttonSize, height - padding - buttonSize, buttonSize, buttonSize);
    // Up arrow
    g.fillStyle(0xffffff, 0.7);
    g.beginPath();
    g.moveTo(width - padding - buttonSize * 0.5, height - padding - buttonSize * 0.3);
    g.lineTo(width - padding - buttonSize * 0.2, height - padding - buttonSize * 0.6);
    g.lineTo(width - padding - buttonSize * 0.8, height - padding - buttonSize * 0.6);
    g.closePath();
    g.fillPath();
    
    // Attack button
    g.fillStyle(0x000000, 0.4);
    g.fillRect(width - padding - buttonSize * 1.2, height - padding - buttonSize, buttonSize, buttonSize);
    g.strokeRect(width - padding - buttonSize * 1.2, height - padding - buttonSize, buttonSize, buttonSize);
    // X symbol
    g.fillStyle(0xff4040, 0.9);
    g.lineStyle(3, 0xff4040, 0.9);
    const ax = width - padding - buttonSize * 0.6;
    const ay = height - padding - buttonSize * 0.5;
    const as = buttonSize * 0.3;
    g.beginPath();
    g.moveTo(ax - as, ay - as);
    g.lineTo(ax + as, ay + as);
    g.moveTo(ax - as, ay + as);
    g.lineTo(ax + as, ay - as);
    g.strokePath();
    
    // Crouch indicator (down arrow in center)
    g.fillStyle(0x000000, 0.3);
    g.fillRect(width / 2 - buttonSize, height - padding - buttonSize, buttonSize * 2, buttonSize);
    g.strokeRect(width / 2 - buttonSize, height - padding - buttonSize, buttonSize * 2, buttonSize);
    g.fillStyle(0xffffff, 0.5);
    g.beginPath();
    g.moveTo(width / 2, height - padding - buttonSize * 0.3);
    g.lineTo(width / 2 - buttonSize * 0.3, height - padding - buttonSize * 0.7);
    g.lineTo(width / 2 + buttonSize * 0.3, height - padding - buttonSize * 0.7);
    g.closePath();
    g.fillPath();
  }

  setupTouchEvents() {
    // Left
    this.leftZone.on('pointerdown', () => { this.left = true; });
    this.leftZone.on('pointerup', () => { this.left = false; });
    this.leftZone.on('pointerout', () => { this.left = false; });
    
    // Right
    this.rightZone.on('pointerdown', () => { this.right = true; });
    this.rightZone.on('pointerup', () => { this.right = false; });
    this.rightZone.on('pointerout', () => { this.right = false; });
    
    // Jump
    this.jumpZone.on('pointerdown', () => { this.jumpPressed = true; });
    this.jumpZone.on('pointerup', () => { this.jumpPressed = false; });
    this.jumpZone.on('pointerout', () => { this.jumpPressed = false; });
    
    // Attack
    this.attackZone.on('pointerdown', () => { this.attackPressed = true; });
    this.attackZone.on('pointerup', () => { this.attackPressed = false; });
    this.attackZone.on('pointerout', () => { this.attackPressed = false; });
    
    // Crouch
    this.crouchZone.on('pointerdown', () => { this.crouch = true; });
    this.crouchZone.on('pointerup', () => { this.crouch = false; });
    this.crouchZone.on('pointerout', () => { this.crouch = false; });
    
    // Prevent context menu on long press
    this.scene.input.on('contextmenu', (e) => e.preventDefault());
  }

  updatePositions(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;
    const buttonSize = 70;
    const padding = 20;
    
    this.leftZone.setPosition(padding + buttonSize/2, height - padding - buttonSize/2);
    this.rightZone.setPosition(padding + buttonSize * 1.5, height - padding - buttonSize/2);
    this.jumpZone.setPosition(width - padding - buttonSize/2, height - padding - buttonSize/2);
    this.attackZone.setPosition(width - padding - buttonSize * 1.5, height - padding - buttonSize/2);
    this.crouchZone.setPosition(width / 2, height - padding - buttonSize/2);
    
    this.updateButtonGraphics();
  }

  destroy() {
    this.leftZone.destroy();
    this.rightZone.destroy();
    this.jumpZone.destroy();
    this.attackZone.destroy();
    this.crouchZone.destroy();
    this.buttonGraphics.destroy();
  }
}