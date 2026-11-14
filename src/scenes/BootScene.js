import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Load minimal assets for loading screen
    this.load.image('loading-bg', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
  }

  create() {
    // Set up global game settings
    this.game.canvas.style.imageRendering = 'pixelated';
    this.game.canvas.style.imageRendering = 'crisp-edges';
    
    // Start preload scene
    this.scene.start('PreloadScene');
  }
}