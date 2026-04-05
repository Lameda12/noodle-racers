/**
 * NoodleCharacter - Main character class
 *
 * Manages:
 * - Physics body (Cannon.js)
 * - Three.js mesh
 * - Bone system for wiggle animation
 * - Input handling for movement
 */

import type { NoodleCharacter as NoodleCharacterType } from '@/types';

export class NoodleCharacter implements NoodleCharacterType {
  id: string;
  position = { x: 0, y: 0, z: 0 };
  velocity = { x: 0, y: 0, z: 0 };
  rotation = { x: 0, y: 0, z: 0 };
  mass = 1.0;
  alive = true;

  // TODO: Physics body (Cannon.Body)
  // TODO: Three.js mesh (TubeGeometry)
  // TODO: Bone system (WiggleAnimator)
  // TODO: Animation state

  constructor(id: string = 'noodle-1') {
    this.id = id;
    console.log(`🍝 NoodleCharacter created: ${id}`);
  }

  // TODO: update()
  // TODO: applyForce()
  // TODO: applyImpulse()
  // TODO: setPosition()
  // TODO: animate()
  // TODO: onCollision()
}
