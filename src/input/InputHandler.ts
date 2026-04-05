/**
 * InputHandler - Keyboard and touch input processing
 */

import type { NoodleCharacter } from '@/character/NoodleCharacter';

export class InputHandler {
  private keys: Map<string, boolean> = new Map();
  private noodleCharacter: NoodleCharacter;

  constructor(noodleCharacter: NoodleCharacter) {
    this.noodleCharacter = noodleCharacter;

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    // Touch support for mobile
    window.addEventListener('touchstart', (e) => this.onTouchStart(e));
    window.addEventListener('touchmove', (e) => this.onTouchMove(e));
    window.addEventListener('touchend', (e) => this.onTouchEnd(e));

    console.log('⌨️  InputHandler initialized');
  }

  /**
   * Handle key down
   */
  private onKeyDown(event: KeyboardEvent): void {
    this.keys.set(event.key, true);
    this.updateMovement();
  }

  /**
   * Handle key up
   */
  private onKeyUp(event: KeyboardEvent): void {
    this.keys.set(event.key, false);
    this.updateMovement();
  }

  /**
   * Update noodle movement based on pressed keys
   */
  private updateMovement(): void {
    const isLeft = this.keys.get('ArrowLeft') || this.keys.get('a');
    const isRight = this.keys.get('ArrowRight') || this.keys.get('d');

    if (isLeft && !isRight) {
      this.noodleCharacter.setMoveDirection(-1);
    } else if (isRight && !isLeft) {
      this.noodleCharacter.setMoveDirection(1);
    } else {
      this.noodleCharacter.setMoveDirection(0);
    }
  }

  /**
   * Handle touch start
   */
  private onTouchStart(event: TouchEvent): void {
    // Store initial touch position
  }

  /**
   * Handle touch move
   */
  private onTouchMove(event: TouchEvent): void {
    const touch = event.touches[0];
    const screenCenter = window.innerWidth / 2;

    if (touch.clientX < screenCenter) {
      this.noodleCharacter.setMoveDirection(-1);
    } else if (touch.clientX > screenCenter) {
      this.noodleCharacter.setMoveDirection(1);
    }
  }

  /**
   * Handle touch end
   */
  private onTouchEnd(event: TouchEvent): void {
    this.noodleCharacter.setMoveDirection(0);
  }
}
