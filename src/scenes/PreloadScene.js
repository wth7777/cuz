import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Show loading progress
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(80, 100, 160, 24);
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      font: '16px monospace',
      fill: '#e0e0e0'
    }).setOrigin(0.5);
    
    const percentText = this.add.text(width / 2, height / 2 + 50, '0%', {
      font: '16px monospace',
      fill: '#c0392b'
    }).setOrigin(0.5);
    
    const assetText = this.add.text(width / 2, height / 2 + 80, '', {
      font: '12px monospace',
      fill: '#888'
    }).setOrigin(0.5);
    
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xc0392b, 1);
      progressBar.fillRect(84, 104, 152 * value, 16);
      percentText.setText(`${Math.round(value * 100)}%`);
    });
    
    this.load.on('fileprogress', (file) => {
      assetText.setText(`Loading: ${file.key}`);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
    });

    // Load assets
    this.load.image('parallax-bg', 'assets/parallax-bg.jpg');
    
    // Generate procedural assets (except background)
    this.generateAssets();
  }

  generateAssets() {
    // ========== BACKGROUNDS ==========
    this.generateDirtTileset();
    
    // ========== PLAYER SPRITES ==========
    this.generatePlayerSprites();
    
    // ========== ENEMY SPRITES ==========
    this.generateZombieSprites();
    this.generateGhoulSprites();
    this.generateGraveGuardianSprites();
    
    // ========== EFFECTS ==========
    this.generateBloodParticles();
    this.generateHitFlash();
    this.generateAttackEffects();
    
    // ========== UI ==========
    this.generateUIElements();
  }

  // ----- BACKGROUNDS -----
  generateGraveyardBackground() {
    const w = 320, h = 224;
    
    // Use canvas texture for gradients
    const texture = this.textures.createCanvas('graveyard-bg', w, h);
    const ctx = texture.getContext();
    
    // Sky gradient (dark purple/blue night)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    skyGradient.addColorStop(0, '#0d0d1a');
    skyGradient.addColorStop(0.5, '#1a1028');
    skyGradient.addColorStop(1, '#2d1838');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, w, h * 0.6);
    
    // Ground - dark brown dirt
    const groundGradient = ctx.createLinearGradient(0, h * 0.6, 0, h);
    groundGradient.addColorStop(0, '#3d2818');
    groundGradient.addColorStop(0.5, '#2a1a10');
    groundGradient.addColorStop(1, '#1a1008');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);
    
    // Far background elements - distant trees/hills
    ctx.fillStyle = '#1a1020';
    for (let i = 0; i < 8; i++) {
      const x = i * 40 + Phaser.Math.Between(-10, 10);
      const y = h * 0.55 + Phaser.Math.Between(-5, 5);
      const w2 = Phaser.Math.Between(30, 50);
      const h2 = Phaser.Math.Between(40, 70);
      ctx.beginPath();
      ctx.roundRect(x, y, w2, h2, 5);
      ctx.fill();
    }
    
    // Tombstones in far background
    ctx.fillStyle = '#251828';
    for (let i = 0; i < 12; i++) {
      const x = i * 28 + 10;
      const y = h * 0.58;
      const tw = 12;
      const th = Phaser.Math.Between(20, 35);
      ctx.fillRect(x, y - th, tw, th);
      // Cross on top
      ctx.fillRect(x + 4, y - th - 4, 4, 8);
      ctx.fillRect(x + 1, y - th - 1, 10, 4);
    }
    
    // Moon
    ctx.fillStyle = '#3a3048';
    ctx.beginPath();
    ctx.arc(280, 40, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a4058';
    ctx.beginPath();
    ctx.arc(285, 35, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(275, 45, 5, 0, Math.PI * 2);
    ctx.fill();
    
    texture.refresh();
  }

  generateDirtTileset() {
    // Create a tileable dirt texture for platforms
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const tileSize = 16;
    
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const bx = x * tileSize;
        const by = y * tileSize;
        
        // Base dirt color
        const baseColor = Phaser.Display.Color.HSVColorWheel()[Phaser.Math.Between(15, 25)].color;
        const r = (baseColor >> 16) & 0xff;
        const g2 = (baseColor >> 8) & 0xff;
        const b = baseColor & 0xff;
        g.fillStyle(Phaser.Display.Color.GetColor(r * 0.6, g2 * 0.6, b * 0.6));
        g.fillRect(bx, by, tileSize, tileSize);
        
        // Add noise/dirt details
        g.fillStyle(Phaser.Display.Color.GetColor(r * 0.4, g2 * 0.4, b * 0.4));
        for (let i = 0; i < 8; i++) {
          g.fillRect(
            bx + Phaser.Math.Between(0, tileSize - 1),
            by + Phaser.Math.Between(0, tileSize - 1),
            1, 1
          );
        }
        
        // Add some darker spots
        g.fillStyle(0x151008);
        for (let i = 0; i < 3; i++) {
          g.fillRect(
            bx + Phaser.Math.Between(0, tileSize - 2),
            by + Phaser.Math.Between(0, tileSize - 2),
            2, 2
          );
        }
      }
    }
    
    g.generateTexture('dirt-tiles', 64, 64);
    g.destroy();
  }

  // ----- PLAYER SPRITES -----
  generatePlayerSprites() {
    // Player: Don Ramiro (Maldita Castilla protagonist)
    // We'll create a sprite sheet with all animations
    const animFrames = {
      idle: 4,
      walk: 6,
      attack: 4,
      attackUp: 4,
      attackDown: 4,
      crouch: 2,
      crouchAttack: 3,
      jump: 2,
      hurt: 2,
      die: 5
    };
    
    // Create a texture atlas for player
    const totalFrames = Object.values(animFrames).reduce((a, b) => a + b, 0);
    const frameW = 32, frameH = 48;
    const cols = 10;
    const rows = Math.ceil(totalFrames / cols);
    const atlasW = cols * frameW;
    const atlasH = rows * frameH;
    
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    
    let frameIndex = 0;
    const frameData = {};
    
    for (const [anim, count] of Object.entries(animFrames)) {
      frameData[anim] = [];
      for (let i = 0; i < count; i++) {
        const col = frameIndex % cols;
        const row = Math.floor(frameIndex / cols);
        const x = col * frameW;
        const y = row * frameH;
        
        this.drawPlayerFrame(g, x, y, frameW, frameH, anim, i, count);
        frameData[anim].push({ x, y, w: frameW, h: frameH });
        frameIndex++;
      }
    }
    
    g.generateTexture('player-atlas', atlasW, atlasH);
    g.destroy();
    
    // Add frames to the texture for animations
    const tex = this.textures.get('player-atlas');
    for (const [anim, frames] of Object.entries(frameData)) {
      for (let i = 0; i < frames.length; i++) {
        const f = frames[i];
        tex.add(`${anim}_${i}`, 0, f.x, f.y, f.w, f.h);
      }
    }
    
    // Store frame data for animation creation
    this.playerFrameData = frameData;
    this.playerFrameSize = { w: frameW, h: frameH };
  }

  drawPlayerFrame(g, x, y, w, h, anim, frame, total) {
    const cx = x + w / 2;
    const cy = y + h * 0.7;
    const progress = frame / Math.max(1, total - 1);
    
    // Color palette - Don Ramiro: silver armor, red cape
    const armor = 0xc0c0d0;
    const armorDark = 0x808090;
    const cape = 0x8b0000;
    const capeDark = 0x5a0000;
    const skin = 0xe8c8a8;
    const gold = 0xd4a828;
    const black = 0x101010;
    
    // Clear frame
    g.fillStyle(0x00000000);
    g.fillRect(x, y, w, h);
    
    // Bobbing offset for walk
    const bob = (anim === 'walk') ? Math.sin(progress * Math.PI * 2) * 1.5 : 0;
    
    // Legs
    const legOffset = (anim === 'walk') ? Math.sin(progress * Math.PI * 2) * 3 : 0;
    const legOffset2 = (anim === 'walk') ? -Math.sin(progress * Math.PI * 2) * 3 : 0;
    
    if (anim === 'crouch' || anim === 'crouchAttack') {
      // Crouching legs
      g.fillStyle(armorDark);
      g.fillRect(cx - 8, cy + 8 + bob, 6, 8);
      g.fillRect(cx + 2, cy + 8 + bob, 6, 8);
    } else if (anim === 'jump') {
      g.fillStyle(armorDark);
      g.fillRect(cx - 8, cy + 10 + bob, 6, 10);
      g.fillRect(cx + 2, cy + 10 + bob, 6, 10);
    } else {
      g.fillStyle(armorDark);
      g.fillRect(cx - 8, cy + 12 + bob + legOffset, 6, 12);
      g.fillRect(cx + 2, cy + 12 + bob + legOffset2, 6, 12);
    }
    
    // Boots
    g.fillStyle(black);
    if (anim !== 'crouch' && anim !== 'crouchAttack' && anim !== 'jump') {
      g.fillRect(cx - 8, cy + 22 + bob + legOffset, 6, 4);
      g.fillRect(cx + 2, cy + 22 + bob + legOffset2, 6, 4);
    }
    
    // Body / Torso
    g.fillStyle(armor);
    const torsoY = cy - 6 + bob;
    g.fillRect(cx - 7, torsoY, 14, 16);
    
    // Armor details
    g.fillStyle(armorDark);
    g.fillRect(cx - 7, torsoY, 14, 2); // collar
    g.fillRect(cx - 7, torsoY + 14, 14, 2); // belt
    
    // Gold trim
    g.fillStyle(gold);
    g.fillRect(cx - 7, torsoY + 1, 14, 1);
    g.fillRect(cx - 7, torsoY + 13, 14, 1);
    
    // Cape (behind body)
    g.fillStyle(cape);
    const capeWidth = 10;
    g.fillRect(cx - capeWidth / 2, torsoY - 2, capeWidth, 20);
    g.fillStyle(capeDark);
    g.fillRect(cx - capeWidth / 2 + 2, torsoY, 6, 18);
    
    // Arms
    let armR_x = cx + 7, armL_x = cx - 11;
    let armY = torsoY + 2;
    let armAngle = 0;
    
    if (anim === 'attack' || anim === 'attackUp' || anim === 'attackDown' || anim === 'crouchAttack') {
      // Attack animation - sword arm extended
      const attackProgress = Math.sin(progress * Math.PI);
      if (anim === 'attackUp') {
        armAngle = -Math.PI / 2 * attackProgress;
        armR_x = cx + 7 + Math.cos(armAngle) * 10;
        armY = torsoY + 2 + Math.sin(armAngle) * 10;
      } else if (anim === 'attackDown') {
        armAngle = Math.PI / 2 * attackProgress;
        armR_x = cx + 7 + Math.cos(armAngle) * 10;
        armY = torsoY + 2 + Math.sin(armAngle) * 10;
      } else {
        armAngle = -Math.PI / 4 * attackProgress;
        armR_x = cx + 7 + Math.cos(armAngle) * 14;
        armY = torsoY + 2 + Math.sin(armAngle) * 8;
      }
    } else if (anim === 'walk') {
      const swing = Math.sin(progress * Math.PI * 2) * 0.5;
      armR_x = cx + 7 + swing * 4;
      armL_x = cx - 11 - swing * 4;
    }
    
    // Right arm (sword arm)
    g.fillStyle(armor);
    g.fillRect(armR_x, armY, 6, 10);
    g.fillStyle(skin);
    g.fillRect(armR_x + 1, armY + 10, 4, 6); // hand
    
    // Left arm
    g.fillStyle(armor);
    g.fillRect(armL_x, torsoY + 2, 6, 10);
    g.fillStyle(skin);
    g.fillRect(armL_x + 1, torsoY + 12, 4, 6);
    
    // Sword (in right hand)
    if (anim === 'attack' || anim === 'attackUp' || anim === 'attackDown' || anim === 'crouchAttack' || anim === 'idle') {
      g.fillStyle(0x606070);
      const swordX = armR_x + 3;
      const swordY = armY + 8;
      if (anim === 'attackUp') {
        g.fillRect(swordX - 1, swordY - 20, 2, 22);
      } else if (anim === 'attackDown') {
        g.fillRect(swordX - 1, swordY, 2, 22);
      } else {
        g.fillRect(swordX - 1, swordY - 18, 2, 22);
      }
      // Hilt
      g.fillStyle(gold);
      g.fillRect(swordX - 2, swordY + 2, 4, 3);
    }
    
    // Head
    g.fillStyle(skin);
    const headY = torsoY - 8 + bob;
    g.fillRect(cx - 5, headY, 10, 10);
    
    // Helmet
    g.fillStyle(armor);
    g.fillRect(cx - 6, headY - 2, 12, 6);
    g.fillStyle(gold);
    g.fillRect(cx - 4, headY - 1, 8, 2); // visor
    
    // Face details
    g.fillStyle(black);
    g.fillRect(cx - 3, headY + 1, 1, 1); // eye
    g.fillRect(cx + 2, headY + 1, 1, 1);
    
    // Plume on helmet
    if (frame % 2 === 0) {
      g.fillStyle(cape);
      g.fillRect(cx + 4, headY - 6, 2, 8);
    }
  }

  // ----- ENEMY SPRITES -----
  generateZombieSprites() {
    // Zombie: shambling undead
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const frameW = 32, frameH = 48;
    const frames = 6; // walk cycle
    
    for (let i = 0; i < frames; i++) {
      const x = i * frameW;
      const y = 0;
      const progress = i / (frames - 1);
      const bob = Math.sin(progress * Math.PI * 2) * 1.5;
      const legSwing = Math.sin(progress * Math.PI * 2) * 3;
      
      // Clear
      g.fillStyle(0x00000000);
      g.fillRect(x, y, frameW, frameH);
      
      // Colors
      const flesh = 0x688848;
      const fleshDark = 0x486030;
      const rot = 0x384020;
      const blood = 0x601010;
      const cloth = 0x383028;
      
      const cx = x + frameW / 2;
      const cy = y + frameH * 0.7;
      
      // Legs
      g.fillStyle(fleshDark);
      g.fillRect(cx - 7, cy + 12 + bob + legSwing, 5, 14);
      g.fillRect(cx + 2, cy + 12 + bob - legSwing, 5, 14);
      
      // Feet (bare, dirty)
      g.fillStyle(rot);
      g.fillRect(cx - 7, cy + 24 + bob + legSwing, 5, 4);
      g.fillRect(cx + 2, cy + 24 + bob - legSwing, 5, 4);
      
      // Body - tattered clothes
      g.fillStyle(cloth);
      g.fillRect(cx - 8, cy - 6 + bob, 16, 18);
      
      // Tears/holes in clothes
      g.fillStyle(rot);
      g.fillRect(cx - 6, cy + 2 + bob, 3, 4);
      g.fillRect(cx + 3, cy + 6 + bob, 2, 3);
      
      // Exposed flesh
      g.fillStyle(flesh);
      g.fillRect(cx - 5, cy + 3 + bob, 2, 3);
      
      // Arms
      const armSwing = Math.sin(progress * Math.PI * 2) * 2;
      g.fillStyle(flesh);
      g.fillRect(cx - 12, cy + armSwing, 6, 14);
      g.fillRect(cx + 6, cy - armSwing, 6, 14);
      
      // Hands
      g.fillStyle(fleshDark);
      g.fillRect(cx - 12, cy + 14 + armSwing, 6, 6);
      g.fillRect(cx + 6, cy + 14 - armSwing, 6, 6);
      
      // Head
      g.fillStyle(flesh);
      g.fillRect(cx - 6, cy - 14 + bob, 12, 14);
      
      // Face - sunken eyes, open mouth
      g.fillStyle(0x101010);
      g.fillRect(cx - 4, cy - 11 + bob, 2, 2);
      g.fillRect(cx + 2, cy - 11 + bob, 2, 2);
      g.fillRect(cx - 2, cy - 5 + bob, 4, 2); // mouth
      
      // Hair patches
      g.fillStyle(0x201810);
      g.fillRect(cx - 5, cy - 16 + bob, 10, 3);
      
      // Blood splatter
      g.fillStyle(blood);
      g.fillRect(cx + 4, cy - 2 + bob, 2, 2);
      g.fillRect(cx - 8, cy + 5 + bob, 1, 3);
    }
    
    g.generateTexture('zombie-atlas', frameW * frames, frameH);
    g.destroy();
    
    // Add frames to texture
    const ztex = this.textures.get('zombie-atlas');
    for (let i = 0; i < frames; i++) {
      ztex.add(`walk_${i}`, 0, i * frameW, 0, frameW, frameH);
    }
    
    this.zombieFrames = frames;
    this.zombieFrameSize = { w: frameW, h: frameH };
  }

  generateGhoulSprites() {
    // Ghoul: faster, hunched, clawed
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const frameW = 32, frameH = 44;
    const frames = 6;
    
    for (let i = 0; i < frames; i++) {
      const x = i * frameW;
      const y = 0;
      const progress = i / (frames - 1);
      const bob = Math.sin(progress * Math.PI * 2) * 1;
      const legSwing = Math.sin(progress * Math.PI * 2) * 4;
      
      g.fillStyle(0x00000000);
      g.fillRect(x, y, frameW, frameH);
      
      const cx = x + frameW / 2;
      const cy = y + frameH * 0.75;
      
      // Colors - pale, sickly
      const flesh = 0x787858;
      const fleshDark = 0x585838;
      const claw = 0xd0d0c0;
      const blood = 0x800000;
      
      // Legs - hunched, longer
      g.fillStyle(fleshDark);
      g.fillRect(cx - 6, cy + 8 + bob + legSwing, 4, 16);
      g.fillRect(cx + 2, cy + 8 + bob - legSwing, 4, 16);
      
      // Clawed feet
      g.fillStyle(claw);
      g.fillRect(cx - 7, cy + 22 + bob + legSwing, 6, 4);
      g.fillRect(cx + 1, cy + 22 + bob - legSwing, 6, 4);
      // Claw tips
      g.fillStyle(0xffffee);
      for (let c = 0; c < 3; c++) {
        g.fillRect(cx - 6 + c * 2, cy + 22 + bob + legSwing, 1, 3);
        g.fillRect(cx + 2 + c * 2, cy + 22 + bob - legSwing, 1, 3);
      }
      
      // Body - hunched forward
      g.fillStyle(flesh);
      g.fillRect(cx - 8, cy - 8 + bob, 16, 20);
      
      // Ribs visible
      g.fillStyle(fleshDark);
      for (let r = 0; r < 3; r++) {
        g.fillRect(cx - 5, cy - 4 + r * 4 + bob, 2, 1);
        g.fillRect(cx + 3, cy - 4 + r * 4 + bob, 2, 1);
      }
      
      // Arms - longer, claws
      g.fillStyle(flesh);
      g.fillRect(cx - 14, cy + 2 + legSwing, 8, 16);
      g.fillRect(cx + 6, cy + 2 - legSwing, 8, 16);
      
      // Claws
      g.fillStyle(claw);
      g.fillRect(cx - 14, cy + 16 + legSwing, 8, 6);
      g.fillRect(cx + 6, cy + 16 - legSwing, 8, 6);
      for (let c = 0; c < 4; c++) {
        g.fillStyle(0xffffee);
        g.fillRect(cx - 13 + c * 2, cy + 16 + legSwing, 1, 8);
        g.fillRect(cx + 7 + c * 2, cy + 16 - legSwing, 1, 8);
      }
      
      // Head - elongated jaw
      g.fillStyle(flesh);
      g.fillRect(cx - 5, cy - 16 + bob, 10, 16);
      
      // Face
      g.fillStyle(0x000000);
      g.fillRect(cx - 3, cy - 13 + bob, 2, 2); // sunken eye
      g.fillRect(cx + 1, cy - 13 + bob, 2, 2);
      // Jaw
      g.fillStyle(fleshDark);
      g.fillRect(cx - 4, cy - 4 + bob, 8, 4);
      // Teeth
      g.fillStyle(0xffffee);
      for (let t = 0; t < 4; t++) {
        g.fillRect(cx - 3 + t * 2, cy - 3 + bob, 1, 3);
      }
      
      // Blood around mouth
      g.fillStyle(blood);
      g.fillRect(cx - 2, cy - 1 + bob, 4, 2);
    }
    
    g.generateTexture('ghoul-atlas', frameW * frames, frameH);
    g.destroy();
    
    // Add frames to texture
    const gtex = this.textures.get('ghoul-atlas');
    for (let i = 0; i < frames; i++) {
      gtex.add(`walk_${i}`, 0, i * frameW, 0, frameW, frameH);
    }
    
    this.ghoulFrames = frames;
    this.ghoulFrameSize = { w: frameW, h: frameH };
  }

  generateGraveGuardianSprites() {
    // Graveyard Guardian - mini boss, large armored skeleton
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const frameW = 64, frameH = 80;
    const frames = 8;
    
    for (let i = 0; i < frames; i++) {
      const x = i * frameW;
      const y = 0;
      const progress = i / (frames - 1);
      const bob = Math.sin(progress * Math.PI * 2) * 2;
      
      g.fillStyle(0x00000000);
      g.fillRect(x, y, frameW, frameH);
      
      const cx = x + frameW / 2;
      const cy = y + frameH * 0.65;
      
      // Colors - ancient armor, glowing eyes
      const bone = 0xe8e8d8;
      const boneDark = 0xc8c8b8;
      const armor = 0x505060;
      const armorDark = 0x303040;
      const gold = 0xd4a828;
      const glow = 0x00ffff;
      const dark = 0x101010;
      
      // Legs - heavy armored
      g.fillStyle(armor);
      g.fillRect(cx - 14, cy + 20 + bob, 12, 24);
      g.fillRect(cx + 2, cy + 20 + bob, 12, 24);
      g.fillStyle(armorDark);
      g.fillRect(cx - 12, cy + 22 + bob, 8, 2);
      g.fillRect(cx + 4, cy + 22 + bob, 8, 2);
      
      // Greaves
      g.fillStyle(gold);
      g.fillRect(cx - 14, cy + 40 + bob, 12, 4);
      g.fillRect(cx + 2, cy + 40 + bob, 12, 4);
      
      // Feet - sabatons
      g.fillStyle(armorDark);
      g.fillRect(cx - 16, cy + 44 + bob, 16, 10);
      g.fillRect(cx, cy + 44 + bob, 16, 10);
      g.fillStyle(gold);
      g.fillRect(cx - 14, cy + 46 + bob, 12, 2);
      g.fillRect(cx + 2, cy + 46 + bob, 12, 2);
      
      // Body - cuirass
      g.fillStyle(armor);
      g.fillRect(cx - 18, cy - 10 + bob, 36, 32);
      g.fillStyle(armorDark);
      g.fillRect(cx - 16, cy - 8 + bob, 32, 28);
      
      // Gold trim
      g.fillStyle(gold);
      g.fillRect(cx - 18, cy - 10 + bob, 36, 2);
      g.fillRect(cx - 18, cy + 20 + bob, 36, 2);
      g.fillRect(cx - 18, cy - 8 + bob, 2, 28);
      g.fillRect(cx + 16, cy - 8 + bob, 2, 28);
      
      // Ribs visible through armor gaps
      g.fillStyle(bone);
      for (let r = 0; r < 4; r++) {
        g.fillRect(cx - 4, cy - 4 + r * 6 + bob, 2, 3);
        g.fillRect(cx + 2, cy - 4 + r * 6 + bob, 2, 3);
      }
      
      // Arms - large pauldrons
      g.fillStyle(armor);
      g.fillRect(cx - 30, cy - 8 + bob, 14, 16);
      g.fillRect(cx + 16, cy - 8 + bob, 14, 16);
      g.fillStyle(armorDark);
      g.fillRect(cx - 28, cy - 6 + bob, 10, 12);
      g.fillRect(cx + 18, cy - 6 + bob, 10, 12);
      
      // Gauntlets
      g.fillStyle(armor);
      g.fillRect(cx - 32, cy + 8 + bob, 18, 14);
      g.fillRect(cx + 14, cy + 8 + bob, 18, 14);
      g.fillStyle(gold);
      g.fillRect(cx - 32, cy + 10 + bob, 18, 2);
      g.fillRect(cx + 14, cy + 10 + bob, 18, 2);
      
      // Right hand - holding large sword
      g.fillStyle(bone);
      g.fillRect(cx + 26, cy + 10 + bob, 6, 20);
      
      // Sword
      g.fillStyle(0x404050);
      g.fillRect(cx + 28, cy - 40 + bob, 2, 52);
      g.fillStyle(gold);
      g.fillRect(cx + 26, cy + 10 + bob, 6, 4);
      // Blade glow
      g.fillStyle(glow);
      g.fillRect(cx + 28, cy - 38 + bob, 2, 2);
      
      // Left hand - shield
      g.fillStyle(armor);
      g.fillRect(cx - 36, cy - 2 + bob, 12, 28);
      g.fillStyle(gold);
      g.fillRect(cx - 36, cy - 2 + bob, 12, 2);
      g.fillRect(cx - 36, cy + 24 + bob, 12, 2);
      // Shield boss
      g.fillStyle(glow);
      g.fillCircle(cx - 30, cy + 10 + bob, 4);
      
      // Head - skull in helmet
      g.fillStyle(armor);
      g.fillRect(cx - 12, cy - 32 + bob, 24, 24);
      // Face opening
      g.fillStyle(dark);
      g.fillRect(cx - 8, cy - 28 + bob, 16, 16);
      
      // Glowing eyes
      g.fillStyle(glow);
      g.fillRect(cx - 6, cy - 22 + bob, 4, 4);
      g.fillRect(cx + 2, cy - 22 + bob, 4, 4);
      // Pupils
      g.fillStyle(dark);
      g.fillRect(cx - 5, cy - 21 + bob, 2, 2);
      g.fillRect(cx + 3, cy - 21 + bob, 2, 2);
      
      // Helmet crest
      g.fillStyle(gold);
      g.fillRect(cx - 2, cy - 32 + bob, 4, 6);
      
      // Tattered cape
      g.fillStyle(0x400000);
      g.fillRect(cx - 20, cy - 30 + bob, 40, 30);
    }
    
    g.generateTexture('guardian-atlas', frameW * frames, frameH);
    g.destroy();
    
    // Add frames to texture
    const guatex = this.textures.get('guardian-atlas');
    for (let i = 0; i < frames; i++) {
      guatex.add(`idle_${i}`, 0, i * frameW, 0, frameW, frameH);
    }
    
    this.guardianFrames = frames;
    this.guardianFrameSize = { w: frameW, h: frameH };
  }

  // ----- EFFECTS -----
  generateBloodParticles() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x800000);
    g.fillCircle(4, 4, 4);
    g.generateTexture('blood-particle', 8, 8);
    g.destroy();
    
    // Blood splatter
    const g2 = this.make.graphics({ x: 0, y: 0, add: false });
    g2.fillStyle(0x600000);
    for (let i = 0; i < 5; i++) {
      g2.fillRect(
        Phaser.Math.Between(0, 15),
        Phaser.Math.Between(0, 15),
        Phaser.Math.Between(2, 6),
        Phaser.Math.Between(2, 6)
      );
    }
    g2.generateTexture('blood-splatter', 16, 16);
    g2.destroy();
  }

  generateHitFlash() {
    // White flash for hit effect
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 32, 48);
    g.generateTexture('hit-flash', 32, 48);
    g.destroy();
  }

  generateAttackEffects() {
    // Sword slash effect
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffee);
    g.fillRect(0, 0, 48, 16);
    g.fillStyle(0xffdd88);
    g.fillRect(2, 2, 44, 12);
    g.generateTexture('slash-effect', 48, 16);
    g.destroy();
    
    // Spark particles
    const g2 = this.make.graphics({ x: 0, y: 0, add: false });
    g2.fillStyle(0xffdd00);
    g2.fillCircle(3, 3, 3);
    g2.generateTexture('spark', 6, 6);
    g2.destroy();
    
    // Screen shake indicator
    const g3 = this.make.graphics({ x: 0, y: 0, add: false });
    g3.lineStyle(2, '#ff0000');
    g3.strokeRect(0, 0, 320, 224);
    g3.generateTexture('screen-flash', 320, 224);
    g3.destroy();
  }

  // ----- UI -----
  generateUIElements() {
    // Health bar background
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x1a0a0a);
    g.fillRect(0, 0, 100, 12);
    g.lineStyle(2, '#800000');
    g.strokeRect(0, 0, 100, 12);
    g.generateTexture('health-bar-bg', 100, 12);
    g.destroy();
    
    // Health bar fill - use canvas for gradient
    const texture = this.textures.createCanvas('health-bar-fill', 100, 12);
    const ctx = texture.getContext();
    const grad = ctx.createLinearGradient(0, 0, 100, 0);
    grad.addColorStop(0, '#c00000');
    grad.addColorStop(1, '#ff4040');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 100, 12);
    texture.refresh();
    
    // Lives icon
    const g3 = this.make.graphics({ x: 0, y: 0, add: false });
    g3.fillStyle(0xc00000);
    g3.fillCircle(8, 8, 7);
    g3.fillStyle(0xff4040);
    g3.fillCircle(8, 7, 5);
    g3.generateTexture('life-icon', 16, 16);
    g3.destroy();
    
    // Score font texture
    const g4 = this.make.graphics({ x: 0, y: 0, add: false });
    g4.fillStyle(0xffdd00);
    g4.generateTexture('gold-pixel', 1, 1);
    g4.destroy();
  }

  create() {
    // Create animations from generated frame data
    this.createAnimations();
    this.scene.start('GraveyardScene');
  }

  createAnimations() {
    // Player animations - use frame names
    const { playerFrameData } = this;
    
    for (const [anim, frames] of Object.entries(playerFrameData)) {
      this.anims.create({
        key: `player-${anim}`,
        frames: frames.map((_, i) => ({ key: 'player-atlas', frame: `${anim}_${i}` })),
        frameRate: anim === 'attack' || anim === 'attackUp' || anim === 'attackDown' ? 12 : 8,
        repeat: anim === 'idle' || anim === 'walk' ? -1 : 0
      });
    }
    
    // Zombie - frames named walk_0, walk_1, etc.
    this.anims.create({
      key: 'zombie-walk',
      frames: Array.from({ length: this.zombieFrames }, (_, i) => ({ key: 'zombie-atlas', frame: `walk_${i}` })),
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: 'zombie-attack',
      frames: [{ key: 'zombie-atlas', frame: 'walk_0' }, { key: 'zombie-atlas', frame: 'walk_1' }, { key: 'zombie-atlas', frame: 'walk_2' }],
      frameRate: 6,
      repeat: 0
    });
    this.anims.create({
      key: 'zombie-die',
      frames: Array.from({ length: this.zombieFrames - 3 }, (_, i) => ({ key: 'zombie-atlas', frame: `walk_${i + 3}` })),
      frameRate: 6,
      repeat: 0
    });
    
    // Ghoul - frames named walk_0, walk_1, etc.
    this.anims.create({
      key: 'ghoul-walk',
      frames: Array.from({ length: this.ghoulFrames }, (_, i) => ({ key: 'ghoul-atlas', frame: `walk_${i}` })),
      frameRate: 12,
      repeat: -1
    });
    this.anims.create({
      key: 'ghoul-attack',
      frames: [{ key: 'ghoul-atlas', frame: 'walk_0' }, { key: 'ghoul-atlas', frame: 'walk_1' }, { key: 'ghoul-atlas', frame: 'walk_2' }],
      frameRate: 10,
      repeat: 0
    });
    this.anims.create({
      key: 'ghoul-die',
      frames: Array.from({ length: this.ghoulFrames - 3 }, (_, i) => ({ key: 'ghoul-atlas', frame: `walk_${i + 3}` })),
      frameRate: 8,
      repeat: 0
    });
    
    // Guardian - frames named idle_0, idle_1, etc.
    this.anims.create({
      key: 'guardian-idle',
      frames: [{ key: 'guardian-atlas', frame: 'idle_0' }, { key: 'guardian-atlas', frame: 'idle_1' }],
      frameRate: 4,
      repeat: -1
    });
    this.anims.create({
      key: 'guardian-walk',
      frames: [{ key: 'guardian-atlas', frame: 'idle_2' }, { key: 'guardian-atlas', frame: 'idle_3' }, { key: 'guardian-atlas', frame: 'idle_4' }],
      frameRate: 6,
      repeat: -1
    });
    this.anims.create({
      key: 'guardian-attack',
      frames: [{ key: 'guardian-atlas', frame: 'idle_5' }, { key: 'guardian-atlas', frame: 'idle_6' }],
      frameRate: 8,
      repeat: 0
    });
    this.anims.create({
      key: 'guardian-die',
      frames: [{ key: 'guardian-atlas', frame: 'idle_7' }],
      frameRate: 1,
      repeat: 0
    });
  }
}