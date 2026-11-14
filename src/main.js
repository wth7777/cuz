import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { GraveyardScene } from './scenes/GraveyardScene.js';
import { UIScene } from './scenes/UIScene.js';

// Game configuration matching Maldita Castilla aspect ratio
const GAME_WIDTH = 320;
const GAME_HEIGHT = 224;
const SCALE_FACTOR = 3;

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0a0a12',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    min: {
      width: GAME_WIDTH,
      height: GAME_HEIGHT
    },
    max: {
      width: GAME_WIDTH * 6,
      height: GAME_HEIGHT * 6
    }
  },
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true
  },
  scene: [BootScene, PreloadScene, GraveyardScene, UIScene]
};

const game = new Phaser.Game(config);

// Hide loading screen when game is ready
game.events.once('ready', () => {
  const loading = document.getElementById('loading');
  if (loading) loading.classList.add('hidden');
});

// Make game globally accessible for debugging
window.game = game;

export { game };