import Phaser from 'phaser';

export class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.left = false;
    this.right = false;
    this.jumpPressed = false;
    this.attackPressed = false;
    this.crouch = false;
    
    this.buttonSize = 100; // Bigger buttons for mobile
    this.buttonPressed = { left: false, right: false, jump: false, attack: false, crouch: false };
    
    this.createControls();
  }

  createControls() {
    const cam = this.scene.cameras.main;
    const width = cam.width;
    const height = cam.height;
    const buttonSize = this.buttonSize;
    const padding = 24;
    const gap = 12;
    
    // Left side - movement (bottom-left)
    this.leftZone = this.scene.add.zone(padding + buttonSize/2, height - padding - buttonSize/2, buttonSize, buttonSize)
      .setDepth(200)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: false });
    
    this.rightZone = this.scene.add.zone(padding + buttonSize * 1.5 + gap, height - padding - buttonSize/2, buttonSize, buttonSize)
      .setDepth(200)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: false });
    
    // Right side - action buttons (bottom-right)
    this.jumpZone = this.scene.add.zone(width - padding - buttonSize/2, height - padding - buttonSize * 1.5 - gap, buttonSize, buttonSize)
      .setDepth(200)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: false });
    
    this.attackZone = this.scene.add.zone(width - padding - buttonSize/2, height - padding - buttonSize/2, buttonSize, buttonSize)
      .setDepth(200)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: false });
    
    // Crouch zone (smaller, above attack)
    this.crouchZone = this.scene.add.zone(width - padding - buttonSize * 0.6, height - padding - buttonSize * 2.8, buttonSize * 0.7, buttonSize * 0.7)
      .setDepth(200)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: false });
    
    // Visual feedback for buttons - backgrounds only
    this.createButtonGraphics();
    
    // Create text labels
    this.createButtonLabels();
    
    // Set up event listeners
    this.setupTouchEvents();
    
    // Handle resize
    this.scene.scale.on('resize', (gameSize) => {
      this.updatePositions(gameSize);
    });
    
    // Show control hint on first load
    this.showControlHint();
  }

  createButtonLabels() {
    const cam = this.scene.cameras.main;
    const width = cam.width;
    const height = cam.height;
    const buttonSize = this.buttonSize;
    const padding = 24;
    const gap = 12;
    
    const labelStyle = {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    };
    
    const arrowStyle = {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    };
    
    // Left arrow
    this.leftLabel = this.scene.add.text(
      padding + this.buttonSize/2, 
      height - padding - this.buttonSize/2, 
      '◀', arrowStyle
    ).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    
    // Right arrow
    this.rightLabel = this.scene.add.text(
      padding + this.buttonSize * 1.5 + gap, 
      height - padding - this.buttonSize/2, 
      '▶', arrowStyle
    ).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    
    // Jump label
    this.jumpLabel = this.scene.add.text(
      width - padding - this.buttonSize/2, 
      height - padding - this.buttonSize * 1.5 - 12, 
      '↑ JUMP', { 
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center'
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    
    // Attack label
    this.attackLabel = this.scene.add.text(
      width - padding - this.buttonSize/2, 
      height - padding - this.buttonSize/2, 
      '⚔ ATK', { 
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ff4040',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center'
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    
    // Crouch label
    this.crouchLabel = this.scene.add.text(
      width - padding - this.buttonSize * 0.6, 
      height - padding - this.buttonSize * 2.8, 
      '▼', { 
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center'
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(201);
  }

  createButtonGraphics() {
    const cam = this.scene.cameras.main;
    const width = cam.width;
    const height = cam.height;
    const buttonSize = this.buttonSize;
    const padding = 24;
    const gap = 12;
    
    // Create graphics for visual feedback - backgrounds only
    this.buttonGraphics = this.scene.add.graphics().setDepth(199).setScrollFactor(0);
    this.updateButtonGraphics();
  }

  updateButtonGraphics() {
    const g = this.buttonGraphics;
    g.clear();
    
    const cam = this.scene.cameras.main;
    const width = cam.width;
    const height = cam.height;
    const buttonSize = this.buttonSize;
    const padding = 24;
    const gap = 12;
    
    const pressedAlpha = 0.7;
    const normalAlpha = 0.5;
    
    // Draw button backgrounds with press feedback
    const drawButton = (x, y, size, isPressed) => {
      const alpha = isPressed ? pressedAlpha : normalAlpha;
      // Background
      g.fillStyle(0x000000, alpha * 0.6);
      g.lineStyle(3, 0xffffff, alpha);
      g.fillRoundedRect(x - size/2, y - size/2, size, size, 12);
      g.strokeRoundedRect(x - size/2, y - size/2, size, size, 12);
    };
    
    // Left button
    drawButton(
      padding + buttonSize/2, 
      height - padding - buttonSize/2,
      buttonSize,
      this.buttonPressed.left
    );
    
    // Right button
    drawButton(
      padding + buttonSize * 1.5 + gap, 
      height - padding - buttonSize/2,
      buttonSize,
      this.buttonPressed.right
    );
    
    // Jump button
    drawButton(
      width - padding - buttonSize/2, 
      height - padding - buttonSize * 1.5 - gap,
      buttonSize,
      this.buttonPressed.jump
    );
    
    // Attack button
    drawButton(
      width - padding - buttonSize/2, 
      height - padding - buttonSize/2,
      buttonSize,
      this.buttonPressed.attack
    );
    
    // Crouch button (smaller)
    const crouchSize = buttonSize * 0.7;
    drawButton(
      width - padding - buttonSize * 0.6,
      height - padding - buttonSize * 2.8,
      crouchSize,
      this.buttonPressed.crouch
    );
  }

  setupTouchEvents() {
    // Left
    this.leftZone.on('pointerdown', () => { this.left = true; this.buttonPressed.left = true; this.updateButtonGraphics(); });
    this.leftZone.on('pointerup', () => { this.left = false; this.buttonPressed.left = false; this.updateButtonGraphics(); });
    this.leftZone.on('pointerout', () => { this.left = false; this.buttonPressed.left = false; this.updateButtonGraphics(); });
    
    // Right
    this.rightZone.on('pointerdown', () => { this.right = true; this.buttonPressed.right = true; this.updateButtonGraphics(); });
    this.rightZone.on('pointerup', () => { this.right = false; this.buttonPressed.right = false; this.updateButtonGraphics(); });
    this.rightZone.on('pointerout', () => { this.right = false; this.buttonPressed.right = false; this.updateButtonGraphics(); });
    
    // Jump
    this.jumpZone.on('pointerdown', () => { this.jumpPressed = true; this.buttonPressed.jump = true; this.updateButtonGraphics(); });
    this.jumpZone.on('pointerup', () => { this.jumpPressed = false; this.buttonPressed.jump = false; this.updateButtonGraphics(); });
    this.jumpZone.on('pointerout', () => { this.jumpPressed = false; this.buttonPressed.jump = false; this.updateButtonGraphics(); });
    
    // Attack
    this.attackZone.on('pointerdown', () => { this.attackPressed = true; this.buttonPressed.attack = true; this.updateButtonGraphics(); });
    this.attackZone.on('pointerup', () => { this.attackPressed = false; this.buttonPressed.attack = false; this.updateButtonGraphics(); });
    this.attackZone.on('pointerout', () => { this.attackPressed = false; this.buttonPressed.attack = false; this.updateButtonGraphics(); });
    
    // Crouch
    this.crouchZone.on('pointerdown', () => { this.crouch = true; this.buttonPressed.crouch = true; this.updateButtonGraphics(); });
    this.crouchZone.on('pointerup', () => { this.crouch = false; this.buttonPressed.crouch = false; this.updateButtonGraphics(); });
    this.crouchZone.on('pointerout', () => { this.crouch = false; this.buttonPressed.crouch = false; this.updateButtonGraphics(); });
    
    // Prevent context menu on long press
    this.scene.input.on('contextmenu', (e) => e.preventDefault());
  }

  updatePositions(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;
    const buttonSize = this.buttonSize;
    const padding = 24;
    const gap = 12;
    
    this.leftZone.setPosition(padding + buttonSize/2, height - padding - buttonSize/2);
    this.rightZone.setPosition(padding + buttonSize * 1.5 + gap, height - padding - buttonSize/2);
    this.jumpZone.setPosition(width - padding - buttonSize/2, height - padding - buttonSize * 1.5 - gap);
    this.attackZone.setPosition(width - padding - buttonSize/2, height - padding - buttonSize/2);
    this.crouchZone.setPosition(width - padding - buttonSize * 0.6, height - padding - buttonSize * 2.8);
    
    // Update label positions
    this.leftLabel.setPosition(padding + buttonSize/2, height - padding - buttonSize/2);
    this.rightLabel.setPosition(padding + buttonSize * 1.5 + gap, height - padding - buttonSize/2);
    this.jumpLabel.setPosition(width - padding - buttonSize/2, height - padding - buttonSize * 1.5 - gap);
    this.attackLabel.setPosition(width - padding - buttonSize/2, height - padding - buttonSize/2);
    this.crouchLabel.setPosition(width - padding - buttonSize * 0.6, height - padding - buttonSize * 2.8);
    
    this.updateButtonGraphics();
  }

  showControlHint() {
    const cam = this.scene.cameras.main;
    const hint = this.scene.add.text(cam.width / 2, cam.height / 2 - 80, 
      '◀ ▶ Move    ↑ Jump    ⚔ Attack', {
      font: 'bold 18px monospace',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setAlpha(0);
    
    this.scene.tweens.add({
      targets: hint,
      alpha: 1,
      duration: 500,
      hold: 3000,
      onComplete: () => {
        this.scene.tweens.add({
          targets: hint,
          alpha: 0,
          duration: 800,
          onComplete: () => hint.destroy()
        });
      }
    });
  }

  destroy() {
    this.leftZone.destroy();
    this.rightZone.destroy();
    this.jumpZone.destroy();
    this.attackZone.destroy();
    this.crouchZone.destroy();
    this.buttonGraphics.destroy();
    this.leftLabel.destroy();
    this.rightLabel.destroy();
    this.jumpLabel.destroy();
    this.attackLabel.destroy();
    this.crouchLabel.destroy();
  }
}