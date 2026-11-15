import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player-atlas');
    
    this.scene = scene;
    this.health = 4;
    this.maxHealth = 4;
    this.attackDamage = 1;
    this.invulnerable = false;
    this.invulnerableTime = 1200; // ms
    this.facingRight = true;
    
    // Movement
    this.moveSpeed = 100;
    this.jumpPower = -350;
    this.gravity = 500;
    this.onGround = false;
    this.crouching = false;
    this.attacking = false;
    this.attackCooldown = 0;
    this.attackDuration = 300;
    
    // Animation state
    this.currentAnim = 'idle';
    this.animFrame = 0;
    this.isJumping = false;
    
    // Invulnerability flash timer
    this.flashTimer = 0;
    this.visibleState = true;
    
    // Visual setup - scale down from atlas size (428x256) to game size (~32x48)
    this.setDepth(10);
    this.setScale(0.18);
    this.setOrigin(0.5, 1); // Origin at bottom-center (feet)
    
    // Add to scene and physics world (creates body)
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Physics body setup - feet at origin, body extends upward
    this.body.setSize(14, 34);
    this.body.setOffset(-7, -34);
    this.body.setCollideWorldBounds(true);
    this.body.setGravityY(500);
    
    // Attack key
    this.scene.keyAttack = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
  }
 
    update(touchControls, cursors) {
      if (!this.active) return;
 
      // Check if on ground (do this FIRST, before jump logic)
      let wasOnGround = this.onGround;
      this.onGround = this.body.blocked.down || this.body.touching.down;
 
      // Handle invulnerability flash
      if (this.invulnerable) {
        this.flashTimer += 16;
        if (this.flashTimer > 100) {
          this.visibleState = !this.visibleState;
          this.setAlpha(this.visibleState ? 1 : 0.3);
          this.flashTimer = 0;
        }
      } else {
        this.setAlpha(1);
      }
 
      // Handle attack cooldown
      if (this.attackCooldown > 0) {
        this.attackCooldown -= 16;
        if (this.attackCooldown <= 0) {
          this.attacking = false;
        }
      }
 
      // Read input - keyboard
      const keyLeft = cursors.left?.isDown;
      const keyRight = cursors.right?.isDown;
      const keyUp = cursors.up?.isDown;
      const keyDown = cursors.down?.isDown;
      const keyJump = Phaser.Input.Keyboard.JustDown(cursors.space);
      const keyAttack = Phaser.Input.Keyboard.JustDown(this.scene.keyAttack);
 
      // Read input - touch controls
      const touchLeft = touchControls?.left;
      const touchRight = touchControls?.right;
      const touchUp = touchControls?.up;
      const touchDown = touchControls?.down;
      const touchJump = touchControls?.jumpPressed;
      const touchAttack = touchControls?.attackPressed;
 
      // Reset touch pressed flags
      if (touchControls) {
        touchControls.jumpPressed = false;
        touchControls.attackPressed = false;
      }
 
      // Combined input
      const left = (keyLeft || touchLeft) && !this.attacking;
      const right = (keyRight || touchRight) && !this.attacking;
      const jumpJustPressed = Phaser.Input.Keyboard.JustDown(cursors.space) || touchJump;
      const jumpHeld = keyUp || touchUp;
      const crouch = (keyDown || touchDown) && this.onGround && !this.attacking;
      const attackPressed = keyAttack || touchAttack;
 
      // Crouching
      this.crouching = crouch;
 
      // Jump initiation
      if (jumpJustPressed && this.onGround && !this.crouching && !this.attacking) {
        this.setVelocityY(this.jumpPower);
        this.onGround = false;
        this.isJumping = true;
        this.play('player-jump', true);
      }
 
      // Movement (only if not attacking/crouching/hurt)
      if (!this.attacking && !this.crouching && !this.invulnerable) {
        if (left) {
          this.setVelocityX(-this.moveSpeed);
          this.facingRight = false;
          this.setFlipX(true);
          if (this.onGround) this.play('player-walk', true);
        } else if (right) {
          this.setVelocityX(this.moveSpeed);
          this.facingRight = true;
          this.setFlipX(false);
          if (this.onGround) this.play('player-walk', true);
        } else {
          this.setVelocityX(0);
          if (this.onGround) this.play('player-idle', true);
        }
      } else if (this.crouching) {
        this.setVelocityX(0);
        this.play('player-crouch', true);
      }
 
      // Jump animation - force play while in air
      if (this.isJumping) {
        if (this.onGround) {
          this.isJumping = false;
        } else if (this.anims.currentAnim?.key !== 'player-jump') {
          this.anims.play('player-jump', true);
        }
      }
 
      // Attack - throws projectile
      if (attackPressed && !this.attacking && this.attackCooldown <= 0 && this.onGround) {
        this.performAttack();
      }
    }

  performAttack() {
      this.attacking = true;
      this.attackCooldown = this.attackDuration;
    
      const animKey = 'player-attack';
      this.play(animKey, true);
    
      // Spawn projectile
      this.spawnProjectile();
    
      // Reset attacking state when animation completes
      this.once('animationcomplete-' + animKey, () => {
        this.attacking = false;
      });
    
      // Fallback: ensure attacking resets after cooldown even if animation doesn't complete
      this.scene.time.delayedCall(this.attackDuration + 50, () => {
        if (this.attacking) {
          this.attacking = false;
        }
      });
    }
  
    spawnProjectile() {
      const scene = this.scene;
      const x = this.x + (this.facingRight ? 20 : -20);
      const y = this.y - 8;
      const velocityX = this.facingRight ? 400 : -400;
      
      // Create circular blue magic projectile with white center using graphics
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x4488ff, 1);
      g.fillCircle(7, 7, 7);        // outer blue circle
      g.fillStyle(0x88bbff, 1);
      g.fillCircle(7, 7, 4);        // inner lighter blue
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(7, 7, 2);        // white center
      g.generateTexture('magic-projectile', 14, 14);
      g.destroy();
      
      const projectile = scene.add.sprite(x, y, 'magic-projectile')
        .setDepth(10)
        .setScale(1.0);
      
      scene.physics.add.existing(projectile);
      projectile.body.setAllowGravity(false);
      projectile.body.setVelocityX(velocityX);
      projectile.body.setCircle(7);
      
      // Damage enemies on contact
      scene.physics.add.overlap(projectile, scene.enemies, (proj, enemy) => {
        if (enemy.active && enemy.takeDamage) {
          enemy.takeDamage(this.attackDamage);
          proj.destroy();
        }
      });
      
      // Auto-destroy after distance/time
      scene.time.delayedCall(800, () => {
        if (projectile.active) projectile.destroy();
      });
      
      // Visual effect - pulse glow
      scene.tweens.add({
        targets: projectile,
        scale: { from: 1.0, to: 1.2 },
        duration: 150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      scene.tweens.add({
        targets: projectile,
        alpha: 0,
        duration: 600,
        delay: 200,
        ease: 'Power2',
        onComplete: () => { if (projectile.active) projectile.destroy(); }
      });
    }
  
    // Keep for compatibility
    updateAttackHitbox() {}

  takeDamage(amount) {
    if (this.invulnerable || this.health <= 0) return;
    
    this.health -= amount;
    this.invulnerable = true;
    this.flashTimer = 0;
    this.visibleState = true;
    
    // Play hurt animation
    this.play('player-hurt', true);
    
    // Knockback
    const knockbackDir = this.facingRight ? -1 : 1;
    this.setVelocityX(knockbackDir * 200);
    this.setVelocityY(-100);
    
    // Screen shake
    this.scene.cameras.main.shake(200, 0.01);
    
    // Hit flash effect
    const flash = this.scene.add.sprite(this.x, this.y, 'hit-flash')
      .setDepth(11)
      .setScale(1);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 100,
      onComplete: () => flash.destroy()
    });
    
    // Blood particles
    this.emitBlood();
    
    if (this.health <= 0) {
      this.die();
    } else {
      // Return to idle/walk after hurt animation
      this.once('animationcomplete-player-hurt', () => {
        if (this.active && this.health > 0) {
          if (this.onGround) {
            this.play('player-idle', true);
          }
        }
      });
      
      // Invulnerability timer
      this.scene.time.delayedCall(this.invulnerableTime, () => {
        this.invulnerable = false;
        this.setAlpha(1);
      });
    }
  }

  emitBlood() {
    for (let i = 0; i < 8; i++) {
      const particle = this.scene.add.image(this.x, this.y, 'blood-particle')
        .setDepth(12);
      this.scene.physics.add.existing(particle);
      particle.body.setVelocity(
        Phaser.Math.Between(-150, 150),
        Phaser.Math.Between(-200, 50)
      );
      particle.body.setGravityY(300);
      particle.setScale(Phaser.Math.FloatBetween(0.5, 1.5));
      
      this.scene.time.delayedCall(Phaser.Math.Between(300, 600), () => {
        if (particle.active) particle.destroy();
      });
    }
  }

  die() {
    this.active = false;
    this.setVelocity(0, 0);
    this.body.enable = false;
    this.play('player-die', true);
    this.setAlpha(1);
    this.invulnerable = false;
    
    this.scene.time.delayedCall(1500, () => {
      this.scene.gameOverSequence();
    });
  }

  heal(amount) {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }

  addScore(points) {
    this.scene.score += points;
    this.scene.events.emit('hud-update', { 
      score: this.scene.score, 
      lives: this.scene.lives, 
      maxLives: this.scene.maxLives 
    });
  }
}