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
    this.attackDuration = 450;
    
    // Animation state
    this.currentAnim = 'idle';
    this.animFrame = 0;
    
    // Visual setup - scale down from atlas size (428x256) to game size (~32x48)
    this.setDepth(10);
    this.setScale(0.18);
    
    // Add to scene and physics world (creates body)
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Physics body setup (now body exists) - adjusted for scale
    this.body.setSize(16, 36);
    this.body.setOffset(8, 12);
    this.body.setCollideWorldBounds(true);
    this.body.setGravityY(500);
    
    // Attack hitbox (separate object for collision detection)
    this.attackHitbox = scene.add.rectangle(0, 0, 32, 24, 0xff0000, 0)
      .setDepth(9);
    scene.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.enable = false;
    this.attackHitbox.body.setAllowGravity(false);
    
    // Invulnerability flash timer
    this.flashTimer = 0;
    this.visibleState = true;
  }

  update(touchControls, cursors) {
    if (!this.active) return;
    
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
        this.attackHitbox.body.enable = false;
      }
    }
    
    // Read input
    const left = (cursors.left?.isDown || touchControls?.left) && !this.attacking;
    const right = (cursors.right?.isDown || touchControls?.right) && !this.attacking;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(cursors.up) || Phaser.Input.Keyboard.JustDown(cursors.space) || touchControls?.jumpPressed;
    const crouch = cursors.down?.isDown || touchControls?.crouch;
    const attackPressed = Phaser.Input.Keyboard.JustDown(this.scene.keyAttack) || touchControls?.attackPressed;
    
    // Reset touch pressed flags
    if (touchControls) {
      touchControls.jumpPressed = false;
      touchControls.attackPressed = false;
    }
    
    // Crouching
    this.crouching = crouch && this.onGround && !this.attacking;
    
    // Movement
    if (!this.attacking && !this.crouching) {
      if (left) {
        this.setVelocityX(-this.moveSpeed);
        this.facingRight = false;
        this.setFlipX(true);
        this.play('player-walk', true);
      } else if (right) {
        this.setVelocityX(this.moveSpeed);
        this.facingRight = true;
        this.setFlipX(false);
        this.play('player-walk', true);
      } else {
        this.setVelocityX(0);
        if (this.onGround) this.play('player-idle', true);
      }
    } else if (this.crouching) {
      this.setVelocityX(0);
      this.play('player-crouch', true);
    }
    
    // Jump
    if (jumpPressed && this.onGround && !this.crouching && !this.attacking) {
      this.setVelocityY(this.jumpPower);
      this.onGround = false;
      this.play('player-jump', true);
    }
    
    // Attack
    if (attackPressed && !this.attacking && this.attackCooldown <= 0 && this.onGround) {
      this.performAttack(crouch);
    }
    
    // Update attack hitbox position
    this.updateAttackHitbox();
    
    // Check if on ground
    this.onGround = this.body.blocked.down || this.body.touching.down;
  }

  performAttack(crouch) {
    this.attacking = true;
    this.attackCooldown = this.attackDuration;
    this.attackHitbox.body.enable = true;
    
    let animKey;
    if (crouch) {
      animKey = 'player-crouchAttack';
    } else {
      animKey = 'player-attack';
    }
    
    this.play(animKey, true);
    
    // Reset attacking state when animation completes
    this.once('animationcomplete-' + animKey, () => {
      this.attacking = false;
      this.attackHitbox.body.enable = false;
    });
    
    // Fallback: ensure attacking resets after cooldown even if animation doesn't complete
    // Add 50ms buffer to ensure animation has time to complete
    this.scene.time.delayedCall(this.attackDuration + 50, () => {
      if (this.attacking) {
        this.attacking = false;
        this.attackHitbox.body.enable = false;
      }
    });
    
    // Play attack sound (using generated spark as placeholder)
    this.scene.sound.play('spark', { volume: 0.1 });
  }

  updateAttackHitbox() {
    const offsetX = this.facingRight ? 20 : -32;
    const offsetY = this.crouching ? 8 : -4;
    
    this.attackHitbox.setPosition(this.x + offsetX, this.y + offsetY);
    this.attackHitbox.setSize(this.facingRight ? 32 : 32, this.crouching ? 16 : 24);
  }

  takeDamage(amount) {
    if (this.invulnerable || this.health <= 0) return;
    
    this.health -= amount;
    this.invulnerable = true;
    this.flashTimer = 0;
    this.visibleState = true;
    
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
    this.attackHitbox.body.enable = false;
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