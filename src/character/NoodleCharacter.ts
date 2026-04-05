/**
 * NoodleCharacter - Wobbly noodle player character
 *
 * Manages:
 * - Physics body (Cannon compound body)
 * - Three.js mesh (procedural noodle)
 * - Bone system (spring-based jiggle animation)
 * - Movement control
 * - Collision handling
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { BoneSystem } from './BoneSystem';
import type { GameState } from '@/core/GameState';

export class NoodleCharacter {
  private id: string;
  private mesh: THREE.Mesh;
  private body: CANNON.Body;
  private gameState: GameState;
  private boneSystem: BoneSystem;

  // Movement state
  private moveDirection = 0; // -1, 0, 1 for left, center, right
  private moveForce = 25; // Impulse strength

  // Colors for variety
  private colors = [0xff6b6b, 0xff8e72, 0xffa726, 0xffb74d, 0xffd54f];
  private selectedColor: number;

  constructor(gameState: GameState, id: string = 'noodle-1') {
    this.id = id;
    this.gameState = gameState;
    this.selectedColor = this.colors[Math.floor(Math.random() * this.colors.length)];

    const world = gameState.getPhysicsWorld();

    // Create physics body (capsule-like: spheres connected in a line)
    this.body = new CANNON.Body({ mass: 1.0 });
    this.body.linearDamping = 0.3;
    this.body.angularDamping = 0.5;

    // Compound body: head + body segments
    const sphereShape = new CANNON.Sphere(0.25);

    // Head
    this.body.addShape(sphereShape, new CANNON.Vec3(0, 1.0, 0));

    // Body segments (stacked vertically, creates "noodle" shape)
    for (let i = 0; i < 3; i++) {
      this.body.addShape(sphereShape, new CANNON.Vec3(0, 0.7 - i * 0.3, 0));
    }

    // Tail (smaller)
    const tailShape = new CANNON.Sphere(0.15);
    this.body.addShape(tailShape, new CANNON.Vec3(0, 0.1, 0));

    this.body.position.set(0, 5, 0);
    world.addBody(this.body);

    // Create Three.js mesh (simple cylinder for MVP)
    this.mesh = this.createNoodleMesh();

    // Create bone system for jiggle animation
    this.boneSystem = new BoneSystem(this.mesh, this.body, 5);

    console.log(`🍝 NoodleCharacter created: ${id}`);
  }

  /**
   * Create procedural noodle mesh
   */
  private createNoodleMesh(): THREE.Mesh {
    const geometry = new THREE.CapsuleGeometry(0.3, 1.5, 8, 16);
    const material = new THREE.MeshStandardMaterial({
      color: this.selectedColor,
      roughness: 0.7,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Get Three.js mesh
   */
  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  /**
   * Get physics body
   */
  getBody(): CANNON.Body {
    return this.body;
  }

  /**
   * Set movement input (-1, 0, 1)
   */
  setMoveDirection(direction: number): void {
    this.moveDirection = Math.max(-1, Math.min(1, direction));
  }

  /**
   * Apply movement forces and update mesh transform
   */
  update(deltaTime: number = 0.016): void {
    // Apply horizontal movement force
    if (this.moveDirection !== 0) {
      const force = new CANNON.Vec3(
        this.moveDirection * this.moveForce,
        0,
        0
      );
      this.body.applyForce(force, this.body.position);
    }

    // Constrain lateral movement (keep on track)
    // Max X position = ±5 units from center
    if (Math.abs(this.body.position.x) > 5) {
      this.body.position.x = Math.sign(this.body.position.x) * 5;
      this.body.velocity.x *= 0.5; // Dampen velocity on constraint
    }

    // Update bone system with character velocity for jiggle animation
    this.boneSystem.update(this.body.velocity, deltaTime);

    // Sync mesh to physics body
    this.mesh.position.copy(this.body.position as any);
    this.mesh.quaternion.copy(this.body.quaternion as any);
  }

  /**
   * Check if character is alive (above track, not falling)
   */
  isAlive(): boolean {
    return this.body.position.y > -20; // Death threshold
  }

  /**
   * Get position
   */
  getPosition(): THREE.Vector3 {
    return new THREE.Vector3(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
  }

  /**
   * Apply impact force (collision with obstacle)
   */
  applyImpact(direction: THREE.Vector3, magnitude: number): void {
    const impulse = new CANNON.Vec3(
      direction.x * magnitude,
      direction.y * magnitude,
      direction.z * magnitude
    );
    this.body.applyImpulse(impulse, this.body.position);
  }

  /**
   * Get bone system
   */
  getBoneSystem(): BoneSystem {
    return this.boneSystem;
  }

  /**
   * Reset to start position
   */
  reset(): void {
    this.body.position.set(0, 5, 0);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
  }
}
