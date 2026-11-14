import Phaser from 'phaser';

export class GraveGuardian extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'guardian-atlas');
    
    this.scene = scene;
    this.health = 30;
    this.maxHealth = 30;
    this.damage = 2;
    this.moveSpeed = 60;
    this.attackRange = 60;
    this.detectionRange = 400;
    this.dying = false;
    this.invulnerable = false;
    this.facingRight = false; // Starts facing left (towards player)
    this.scoreValue = 5000;
    
    // Boss phases
    this.phase = 1; // 1: walk/attack, 2: shield, 3: enraged
    this.phaseThresholds = [20, 10]; // Health thresholds for phase changes
    
    // Attack patterns
    this.attackCooldown = 0;
    this.attackPattern = 0;
    this.patternTimer = 0;
    this.shieldActive = false;
    this.shieldTimer = 0;
    
    this.setDepth(12);
    this.setScale(1);
    
    this.setSize(48, 70);
    this.setOffset(8, 10);
    this.setCollideWorldBounds(true);
    this.setGravityY(500);
    this.setMaxVelocity(200, 500);
    
    this.play('guardian-idle', true);
    
    // Boss health bar
    this.createHealthBar();
    
    // Intro sequence
    this.intro = true;
    this.introTimer = 0;
    this.setFlipX(true); // Face left initially
  }

  createHealthBar() {
    const cam = this.scene.cameras.main;
    this.healthBarBg = this.scene.add.rectangle(cam.width / 2, 30, 280, 16, 0x1a0a0a)
      .setScrollFactor(0).setDepth(100).setOrigin(0.5, 0);
    this.healthBarFill = this.scene.add.rectangle(cam.width / 2 - 136, 30, 272, 10, 0xc00000)
      .setScrollFactor(0).setDepth(101).setOrigin(0, 0);
    this.healthBarLabel = this.scene.add.text(cam.width / 2, 12, 'GRAVE GUARDIAN', {
      font: '12px monospace',
      fill: '#ffdd00',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
  }

  update(player) {
    if (!player || !player.active || this.dying || this.health <= 0) return;
    
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const dx = player.x - this.x;
    
    // Update health bar
    this.updateHealthBar();
    
    // Intro sequence
    if (this.intro) {
      this.introTimer += 16;
      if (this.introTimer > 2000) {
        this.intro = false;
        this.play('guardian-walk', true);
      }
      return;
    }
    
    // Face player
    if (dx > 0) {
      this.facingRight = true;
      this.setFlipX(false);
    } else {
      this.facingRight = false;
      this.setFlipX(true);
    }
    
    // Cooldowns
    if (this.attackCooldown > 0) this.attackCooldown -= 16;
    if (this.patternTimer > 0) this.patternTimer -= 16;
    if (this.shieldTimer > 0) {
      this.shieldTimer -= 16;
      if (this.shieldTimer <= 0) {
        this.shieldActive = false;
        this.clearTint();
      }
    }
    
    // Check phase transitions
    this.checkPhaseTransition();
    
    // Behavior based on phase
    switch (this.phase) {
      case 1:
        this.phase1Behavior(player, distance, dx);
        break;
      case 2:
        this.phase2Behavior(player, distance, dx);
        break;
      case 3:
        this.phase3Behavior(player, distance, dx);
        break;
    }
    
    // Shield visual
    if (this.shieldActive) {
      this.setTint(0x00ffff);
    }
  }

  checkPhaseTransition() {
    if (this.phase === 1 && this.health <= this.phaseThresholds[0]) {
      this.enterPhase2();
    } else if (this.phase === 2 && this.health <= this.phaseThresholds[1]) {
      this.enterPhase3();
    }
  }

  enterPhase2() {
    this.phase = 2;
    this.shieldActive = true;
    this.shieldTimer = 5000;
    this.moveSpeed = 40;
    this.attackCooldown = 0;
    
    // Visual feedback
    this.scene.cameras.main.flash(500, 0, 255, 255);
    this.scene.cameras.main.shake(300, 0.02);
  }

  enterPhase3() {
    this.phase = 3;
    this.moveSpeed = 80;
    this.attackCooldown = 0;
    this.attackRange = 80;
    this.damage = 3;
    
    // Enraged visual
    this.setTint(0xff4000);
    
    this.scene.cameras.main.flash(500, 255, 0, 0);
    this.scene.cameras.main.shake(500, 0.03);
  }

  updateHealthBar() {
    if (this.healthBarFill) {
      const pct = this.health / this.maxHealth;
      this.healthBarFill.width = 272 * pct;
      this.healthBarFill.x = this.scene.cameras.main.width / 2 - 136;
      
      // Color change based on health
      if (pct > 0.6) this.healthBarFill.setFillStyle(0xc00000);
      else if (pct > 0.3) this.healthBarFill.setFillStyle(0xff8000);
      else this.healthBarFill.setFillStyle(0xff0000);
    }
  }

  phase1Behavior(player, distance, dx) {
    // Basic: walk towards player, attack when in range
    if (distance > this.attackRange) {
      this.setVelocityX(this.facingRight ? this.moveSpeed : -this.moveSpeed);
      if (this.anims.currentAnim?.key !== 'guardian-walk') {
        this.play('guardian-walk', true);
      }
    } else if (this.attackCooldown <= 0) {
      this.attack(player);
    } else {
      this.setVelocityX(0);
      if (this.anims.currentAnim?.key !== 'guardian-idle') {
        this.play('guardian-idle', true);
      }
    }
  }

  phase2Behavior(player, distance, dx) {
    // Shield phase: alternate between shield and attack
    if (this.shieldActive) {
      // Move slowly, block attacks
      if (distance > this.attackRange + 50) {
        this.setVelocityX(this.facingRight ? this.moveSpeed * 0.5 : -this.moveSpeed * 0.5);
      } else {
        this.setVelocityX(0);
      }
      
      if (this.attackCooldown <= 0 && distance <= this.attackRange + 100) {
        // Shield bash
        this.shieldBash(player);
      }
    } else {
      // Normal attack pattern
      this.phase1Behavior(player, distance, dx);
    }
  }

  phase3Behavior(player, distance, dx) {
    // Enraged: fast, aggressive, combo attacks
    if (distance > this.attackRange) {
      this.setVelocityX(this.facingRight ? this.moveSpeed : -this.moveSpeed);
      if (this.anims.currentAnim?.key !== 'guardian-walk') {
        this.play('guardian-walk', true);
      }
    } else if (this.attackCooldown <= 0) {
      // Combo attack
      this.comboAttack(player);
    } else {
      this.setVelocityX(0);
    }
  }

  attack(player) {
    this.attacking = true;
    this.attackCooldown = this.phase === 3 ? 800 : 1500;
    this.setVelocityX(0);
    this.play('guardian-attack', true);
    
    // Swing sword after windup
    this.scene.time.delayedCall(300, () => {
      if (this.active && !this.dying) {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        if (distance <= this.attackRange + 20) {
          player.takeDamage(this.damage);
          this.scene.cameras.main.shake(150, 0.015);
        }
        
        // Slash effect
        this.createSlashEffect();
      }
    });
    
    this.scene.time.delayedCall(this.phase === 3 ? 500 : 800, () => {
      this.attacking = false;
    });
  }

  shieldBash(player) {
    this.attacking = true;
    this.attackCooldown = 1200;
    this.shieldTimer = 3000; // End shield after bash
    this.shieldActive = false;
    
    // Charge forward
    const chargeSpeed = this.facingRight ? 400 : -400;
    this.setVelocityX(chargeSpeed);
    this.play('guardian-attack', true);
    
    this.scene.time.delayedCall(400, () => {
      if (this.active && !this.dying) {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        if (distance <= this.attackRange + 40) {
          player.takeDamage(this.damage + 1);
          this.scene.cameras.main.shake(200, 0.02);
        }
        this.createSlashEffect(0x00ffff);
      }
      this.attacking = false;
    });
  }

  comboAttack(player) {
    this.attacking = true;
    this.attackCooldown = 2000;
    
    // Three quick attacks
    const delays = [0, 300, 600];
    delays.forEach((delay, i) => {
      this.scene.time.delayedCall(delay, () => {
        if (this.active && !this.dying) {
          this.play('guardian-attack', true);
          
          this.scene.time.delayedCall(200, () => {
            if (this.active && !this.dying) {
              const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
              if (distance <= this.attackRange + 30) {
                player.takeDamage(this.damage);
                this.scene.cameras.main.shake(100, 0.01);
              }
              this.createSlashEffect(0xff4000);
            }
          });
        }
      });
    });
    
    this.scene.time.delayedCall(1000, () => {
      this.attacking = false;
    });
  }

  createSlashEffect(color = 0xffffee) {
    const slash = this.scene.add.rectangle(
      this.x + (this.facingRight ? 50 : -50),
      this.y - 10,
      60, 20, color, 0.8
    ).setDepth(13);
    
    this.scene.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: 2,
      scaleY: 0.5,
      duration: 150,
      onComplete: () => slash.destroy()
    });
    
    // Sparks
    for (let i = 0; i < 5; i++) {
      const spark = this.scene.add.image(
        this.x + (this.facingRight ? 50 : -50),
        this.y - 10,
        'spark'
      ).setDepth(14);
      this.scene.physics.add.existing(spark);
      spark.body.setVelocity(
        (this.facingRight ? 1 : -1) * Phaser.Math.Between(50, 150),
        Phaser.Math.Between(-100, 100)
      );
      spark.body.setGravityY(200);
      this.scene.time.delayedCall(300, () => spark.destroy());
    }
  }

  takeDamage(amount) {
    if (this.dying || this.health <= 0 || this.invulnerable || this.shieldActive) return;
    
    this.health -= amount;
    this.invulnerable = true;
    this.setTint(0xff0000);
    
    // Knockback (reduced for boss)
    const knockbackDir = this.facingRight ? -1 : 1;
    this.setVelocityX(knockbackDir * 100);
    this.setVelocityY(-50);
    
    // Blood
    this.emitBlood();
    
    this.scene.time.delayedCall(200, () => {
      this.clearTint();
      this.invulnerable = false;
    });
    
    if (this.health <= 0) {
      this.die();
    }
  }

  emitBlood() {
    for (let i = 0; i < 12; i++) {
      const particle = this.scene.add.image(this.x, this.y - 20, 'blood-particle').setDepth(15);
      this.scene.physics.add.existing(particle);
      particle.body.setVelocity(
        Phaser.Math.Between(-200, 200),
        Phaser.Math.Between(-250, 50)
      );
      particle.body.setGravityY(300);
      particle.setScale(Phaser.Math.FloatBetween(0.8, 2));
      this.scene.time.delayedCall(500, () => particle.destroy());
    }
  }

  die() {
    this.dying = true;
    this.setVelocity(0, 0);
    this.body.enable = false;
    this.play('guardian-die', true);
    
    // Remove health bar
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.healthBarFill) this.healthBarFill.destroy();
    if (this.healthBarLabel) this.healthBarLabel.destroy();
    
    // Death explosion
    this.scene.time.delayedCall(500, () => {
      this.createDeathExplosion();
    });
    
    // Score
    this.scene.player.addScore(this.scoreValue);
    
    this.scene.time.delayedCall(3000, () => {
      this.destroy();
    });
  }

  createDeathExplosion() {
    // Multiple explosions
    for (let i = 0; i < 8; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        const x = this.x + Phaser.Math.Between(-40, 40);
        const y = this.y + Phaser.Math.Between(-40, 40);
        
        const explosion = this.scene.add.circle(x, y, 5, 0xff4000, 1).setDepth(15);
        this.scene.tweens.add({
          targets: explosion,
          radius: 60,
          alpha: 0,
          duration: 400,
          onComplete: () => explosion.destroy()
        });
        
        this.scene.cameras.main.shake(200, 0.01);
      });
    }
    
    // Large blood splatter
    for (let i = 0; i < 20; i++) {
      const particle = this.scene.add.image(this.x, this.y - 30, 'blood-particle').setDepth(16);
      this.scene.physics.add.existing(particle);
      particle.body.setVelocity(
        Phaser.Math.Between(-300, 300),
        Phaser.Math.Between(-400, -50)
      );
      particle.body.setGravityY(500);
      particle.setScale(Phaser.Math.FloatBetween(1, 3));
      this.scene.time.delayedCall(800, () => particle.destroy());
    }
  }
}