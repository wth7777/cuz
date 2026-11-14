import Phaser from 'phaser';

export class Ghoul extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'ghoul-atlas');
    
    this.scene = scene;
    this.health = 3;
    this.maxHealth = 3;
    this.damage = 1;
    this.moveSpeed = 80;
    this.attackRange = 28;
    this.detectionRange = 250;
    this.attackCooldown = 0;
    this.attackDuration = 600;
    this.dying = false;
    this.facingRight = true;
    this.scoreValue = 300;
    this.pounceCooldown = 0;
    
    this.setDepth(8);
    this.setScale(1);
    
    scene.physics.add.existing(this);
    this.initBody();
    
    this.play('ghoul-walk', true);
  }

  initBody() {
    this.body.setSize(24, 36);
    this.body.setOffset(4, 8);
    this.body.setCollideWorldBounds(true);
    this.body.setGravityY(500);
  }

  update(player) {
    if (!player || !player.active || this.dying || this.health <= 0) return;
    
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    
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
    if (this.pounceCooldown > 0) this.pounceCooldown -= 16;
    
    // Behavior: faster, can pounce
    if (distance < this.detectionRange) {
      if (distance <= this.attackRange && this.attackCooldown <= 0) {
        this.attack();
      } else if (distance > this.attackRange && distance < 150 && this.pounceCooldown <= 0 && Phaser.Math.Between(0, 60) === 0) {
        this.pounce(player);
      } else {
        // Chase
        this.setVelocityX(this.facingRight ? this.moveSpeed : -this.moveSpeed);
        this.play('ghoul-walk', true);
      }
    } else {
      this.setVelocityX(0);
    }
  }

  attack() {
    this.attacking = true;
    this.attackCooldown = this.attackDuration;
    this.setVelocityX(0);
    this.play('ghoul-attack', true);
    
    this.scene.time.delayedCall(150, () => {
      if (this.active && !this.dying) {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
        if (distance <= this.attackRange + 15) {
          this.scene.player.takeDamage(this.damage);
        }
      }
    });
    
    this.scene.time.delayedCall(this.attackDuration, () => {
      this.attacking = false;
    });
  }

  pounce(player) {
    this.pounceCooldown = 2000;
    this.attacking = true;
    
    // Jump towards player
    const dir = player.x > this.x ? 1 : -1;
    this.setVelocityX(dir * 300);
    this.setVelocityY(-300);
    this.facingRight = dir > 0;
    this.setFlipX(!this.facingRight);
    
    this.scene.time.delayedCall(500, () => {
      this.attacking = false;
    });
  }

  takeDamage(amount) {
    if (this.dying || this.health <= 0) return;
    
    this.health -= amount;
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => this.clearTint());
    
    const knockbackDir = this.facingRight ? -1 : 1;
    this.setVelocityX(knockbackDir * 200);
    this.setVelocityY(-100);
    
    this.emitBlood();
    
    if (this.health <= 0) {
      this.die();
    }
  }

  emitBlood() {
    for (let i = 0; i < 5; i++) {
      const particle = this.scene.add.image(this.x, this.y - 10, 'blood-particle').setDepth(12);
      this.scene.physics.add.existing(particle);
      particle.body.setVelocity(
        Phaser.Math.Between(-120, 120),
        Phaser.Math.Between(-180, 0)
      );
      particle.body.setGravityY(300);
      this.scene.time.delayedCall(300, () => particle.destroy());
    }
  }

  die() {
    this.dying = true;
    this.setVelocity(0, 0);
    this.body.enable = false;
    this.play('ghoul-die', true);
    
    this.scene.player.addScore(this.scoreValue);
    
    this.scene.time.delayedCall(600, () => {
      this.destroy();
    });
  }
}