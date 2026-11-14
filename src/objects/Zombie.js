import Phaser from 'phaser';

export class Zombie extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'zombie-atlas');
    
    this.scene = scene;
    this.health = 2;
    this.maxHealth = 2;
    this.damage = 1;
    this.moveSpeed = 40;
    this.attackRange = 24;
    this.detectionRange = 200;
    this.attackCooldown = 0;
    this.attackDuration = 800;
    this.dying = false;
    this.facingRight = true;
    this.scoreValue = 200;
    
    this.setDepth(8);
    this.setScale(1);
    
    scene.physics.add.existing(this);
    this.initBody();
    
    this.play('zombie-walk', true);
  }

  initBody() {
    this.body.setSize(24, 40);
    this.body.setOffset(4, 8);
    this.body.setCollideWorldBounds(true);
    this.body.setGravityY(500);
  }

  update(player) {
    if (!player || !player.active || this.dying || this.health <= 0) return;
    
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const dx = player.x - this.x;
    
    // Face player
    if (dx > 0) {
      this.facingRight = true;
      this.setFlipX(false);
    } else {
      this.facingRight = false;
      this.setFlipX(true);
    }
    
    // Attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= 16;
    }
    
    // Behavior: chase player when in range
    if (distance < this.detectionRange && distance > this.attackRange) {
      // Move towards player
      this.setVelocityX(this.facingRight ? this.moveSpeed : -this.moveSpeed);
      this.play('zombie-walk', true);
    } else if (distance <= this.attackRange && this.attackCooldown <= 0) {
      // Attack
      this.attack();
    } else {
      // Idle/wander
      this.setVelocityX(0);
      // Still play walk animation but at slower rate or stop
    }
  }

  attack() {
    this.attacking = true;
    this.attackCooldown = this.attackDuration;
    this.setVelocityX(0);
    this.play('zombie-attack', true);
    
    // Damage player if in range after animation
    this.scene.time.delayedCall(200, () => {
      if (this.active && !this.dying) {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
        if (distance <= this.attackRange + 10) {
          this.scene.player.takeDamage(this.damage);
        }
      }
    });
    
    this.scene.time.delayedCall(this.attackDuration, () => {
      this.attacking = false;
    });
  }

  takeDamage(amount) {
    if (this.dying || this.health <= 0) return;
    
    this.health -= amount;
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => this.clearTint());
    
    // Knockback
    const knockbackDir = this.facingRight ? -1 : 1;
    this.setVelocityX(knockbackDir * 150);
    this.setVelocityY(-100);
    
    // Blood
    this.emitBlood();
    
    if (this.health <= 0) {
      this.die();
    }
  }

  emitBlood() {
    for (let i = 0; i < 4; i++) {
      const particle = this.scene.add.image(this.x, this.y - 10, 'blood-particle').setDepth(12);
      this.scene.physics.add.existing(particle);
      particle.body.setVelocity(
        Phaser.Math.Between(-100, 100),
        Phaser.Math.Between(-150, 0)
      );
      particle.body.setGravityY(300);
      this.scene.time.delayedCall(300, () => particle.destroy());
    }
  }

  die() {
    this.dying = true;
    this.setVelocity(0, 0);
    this.body.enable = false;
    this.play('zombie-die', true);
    
    // Score
    this.scene.player.addScore(this.scoreValue);
    
    // Loot chance
    if (Phaser.Math.Between(1, 10) === 1) {
      this.scene.time.delayedCall(500, () => {
        this.dropLoot();
      });
    }
    
    this.scene.time.delayedCall(800, () => {
      this.destroy();
    });
  }

  dropLoot() {
    // Could add health/lives pickup here
  }
}