import Phaser from 'phaser';

export class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;
    this.jumpPressed = false;
    this.attackPressed = false;
    
    this.setupDOMButtons();
  }
  
  setupDOMButtons() {
    // Get DOM buttons
    this.btnLeft = document.getElementById('btn-left');
    this.btnRight = document.getElementById('btn-right');
    this.btnUp = document.getElementById('btn-up');
    this.btnDown = document.getElementById('btn-down');
    this.btnJump = document.getElementById('btn-jump');
    this.btnAttack = document.getElementById('btn-attack');
    
    if (!this.btnLeft || !this.btnRight || !this.btnUp || !this.btnDown || !this.btnJump || !this.btnAttack) {
      console.warn('Touch control buttons not found in DOM');
      return;
    }
    
    // Prevent default touch behaviors on buttons
    const buttons = [this.btnLeft, this.btnRight, this.btnUp, this.btnDown, this.btnJump, this.btnAttack].filter(Boolean);
    
    buttons.forEach(btn => {
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, { passive: false });
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, { passive: false });
      btn.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, { passive: false });
      // Prevent context menu
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
    
    // Left button
    this.setupButton(this.btnLeft, 
      () => { this.left = true; },
      () => { this.left = false; }
    );
    
    // Right button
    this.setupButton(this.btnRight,
      () => { this.right = true; },
      () => { this.right = false; }
    );
    
    // Up button (jump)
    this.setupButton(this.btnUp,
      () => { this.up = true; },
      () => { this.up = false; }
    );
    
    // Down button (crouch)
    this.setupButton(this.btnDown,
      () => { this.down = true; },
      () => { this.down = false; }
    );
    
    // Jump button
    this.setupButton(this.btnJump,
      () => { this.jumpPressed = true; },
      () => { this.jumpPressed = false; }
    );
    
    // Attack button
    this.setupButton(this.btnAttack,
      () => { this.attackPressed = true; },
      () => { this.attackPressed = false; }
    );
    
    // Crouch button
    if (this.btnCrouch) {
      this.setupButton(this.btnCrouch,
        () => { this.crouch = true; },
        () => { this.crouch = false; }
      );
    }
  }
  
  setupButton(button, onDown, onUp) {
    if (!button) return;
    
    const cleanup = () => {
      onUp();
      button.classList.remove('pressed');
    };
    
    // Pointer events (touch + mouse)
    button.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      button.setPointerCapture(e.pointerId);
      onDown();
      button.classList.add('pressed');
    }, { passive: false });
    
    button.addEventListener('pointerup', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (button.hasPointerCapture(e.pointerId)) {
        button.releasePointerCapture(e.pointerId);
      }
      cleanup();
    });
    
    button.addEventListener('pointercancel', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (button.hasPointerCapture(e.pointerId)) {
        button.releasePointerCapture(e.pointerId);
      }
      cleanup();
    });
    
    button.addEventListener('pointerout', (e) => {
      if (button.hasPointerCapture(e.pointerId)) {
        e.preventDefault();
        e.stopPropagation();
        button.releasePointerCapture(e.pointerId);
        cleanup();
      }
    });
    
    // Touch events for iOS Safari
    button.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onDown();
      button.classList.add('pressed');
    }, { passive: false });
    
    button.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      cleanup();
    }, { passive: false });
    
    button.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      e.stopPropagation();
      cleanup();
    }, { passive: false });
    
    // Prevent context menu
    button.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  // Called when game scene changes - re-bind buttons if needed
  rebind() {
    this.setupDOMButtons();
  }
  
  destroy() {
    // Clean up event listeners
    const buttons = [this.btnLeft, this.btnRight, this.btnUp, this.btnDown, this.btnJump, this.btnAttack].filter(Boolean);
    buttons.forEach(btn => {
      if (btn) {
        btn.removeEventListener('pointerdown', null);
        btn.removeEventListener('pointerup', null);
        btn.removeEventListener('pointercancel', null);
        btn.removeEventListener('pointerout', null);
        btn.removeEventListener('touchstart', null);
        btn.removeEventListener('touchend', null);
        btn.removeEventListener('touchcancel', null);
        btn.removeEventListener('contextmenu', null);
        btn.classList.remove('pressed');
      }
    });
  }
}