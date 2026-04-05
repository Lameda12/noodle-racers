/**
 * BoneSystem - Spring-based bone deformation for noodle character
 *
 * Implements:
 * - Virtual bone hierarchy (independent of mesh rigging)
 * - Spring physics for each bone (Hooke's law)
 * - Velocity-responsive deformation
 * - Idle jiggle animation
 * - Progressive bone influence (root affects more than tip)
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

interface Bone {
  rotation: THREE.Euler;
  velocity: THREE.Euler;
  acceleration: THREE.Euler;
  restRotation: THREE.Euler;
  mass: number; // Lighter bones at the tip
  index: number;
}

export class BoneSystem {
  private bones: Bone[] = [];
  private mesh: THREE.Mesh;
  private body: CANNON.Body;

  // Spring physics parameters
  private stiffness: number = 2.0; // How quickly bones return to rest (increased for faster convergence)
  private damping: number = 0.95; // How much oscillation is damped (increased for faster settling)
  private velocityInfluence: number = 0.02; // How much physics velocity affects bones

  // Idle jiggle
  private jiggleTime: number = 0;
  private jiggleAmount: number = 0.05;
  private jiggleFrequency: number = 2; // Hz

  // Mesh deformation
  private originalPositions: Float32Array;

  constructor(mesh: THREE.Mesh, body: CANNON.Body, boneCount: number = 5) {
    this.mesh = mesh;
    this.body = body;

    // Store original geometry positions for deformation
    const positionAttribute = mesh.geometry.getAttribute('position');
    this.originalPositions = new Float32Array(positionAttribute.array as ArrayBuffer);

    // Initialize bones
    for (let i = 0; i < boneCount; i++) {
      const bone: Bone = {
        rotation: new THREE.Euler(0, 0, 0),
        velocity: new THREE.Euler(0, 0, 0),
        acceleration: new THREE.Euler(0, 0, 0),
        restRotation: new THREE.Euler(0, 0, 0),
        mass: 1.0 - (i / boneCount) * 0.5, // Bones get lighter toward tip
        index: i,
      };
      this.bones.push(bone);
    }

    console.log(`🦴 BoneSystem created with ${boneCount} bones`);
  }

  /**
   * Main update - applies spring forces and velocity-based deformation
   */
  update(velocity: CANNON.Vec3, deltaTime: number): void {
    this.jiggleTime += deltaTime;

    // Update each bone
    for (let i = 0; i < this.bones.length; i++) {
      const bone = this.bones[i];

      // Spring force - pulls bone back to rest rotation
      const springForce = {
        x: (bone.restRotation.x - bone.rotation.x) * this.stiffness,
        y: (bone.restRotation.y - bone.rotation.y) * this.stiffness,
        z: (bone.restRotation.z - bone.rotation.z) * this.stiffness,
      };

      // Damping force - reduces oscillations
      const dampingForce = {
        x: -bone.velocity.x * this.damping,
        y: -bone.velocity.y * this.damping,
        z: -bone.velocity.z * this.damping,
      };

      // Velocity-based deformation
      const velocityForce = this.calculateVelocityForce(velocity, i, this.bones.length);

      // Idle jiggle (random oscillation when stationary)
      const jiggleForce = this.calculateJiggleForce(i);

      // Total acceleration
      bone.acceleration.x = (springForce.x + dampingForce.x + velocityForce.x + jiggleForce.x) / bone.mass;
      bone.acceleration.y = (springForce.y + dampingForce.y + velocityForce.y + jiggleForce.y) / bone.mass;
      bone.acceleration.z = (springForce.z + dampingForce.z + velocityForce.z + jiggleForce.z) / bone.mass;

      // Update velocity
      bone.velocity.x += bone.acceleration.x * deltaTime;
      bone.velocity.y += bone.acceleration.y * deltaTime;
      bone.velocity.z += bone.acceleration.z * deltaTime;

      // Update rotation
      bone.rotation.x += bone.velocity.x * deltaTime;
      bone.rotation.y += bone.velocity.y * deltaTime;
      bone.rotation.z += bone.velocity.z * deltaTime;

      // Clamp rotations to prevent excessive deformation
      const maxRotation = Math.PI / 4; // 45 degrees
      bone.rotation.x = Math.max(-maxRotation, Math.min(maxRotation, bone.rotation.x));
      bone.rotation.y = Math.max(-maxRotation, Math.min(maxRotation, bone.rotation.y));
      bone.rotation.z = Math.max(-maxRotation, Math.min(maxRotation, bone.rotation.z));
    }

    // Update mesh based on bone deformations
    this.updateMeshDeformation();
  }

  /**
   * Calculate force from physics velocity (character movement)
   */
  private calculateVelocityForce(
    velocity: CANNON.Vec3,
    boneIndex: number,
    totalBones: number
  ): { x: number; y: number; z: number } {
    // Root bones (index 0) are most affected
    const influence = 1.0 - (boneIndex / totalBones) * 0.5;

    // Convert velocity to forces
    return {
      x: velocity.y * this.velocityInfluence * influence * 0.5, // Vertical movement
      y: velocity.x * this.velocityInfluence * influence * 0.3, // Lateral movement
      z: velocity.z * this.velocityInfluence * influence, // Forward movement
    };
  }

  /**
   * Calculate idle jiggle (random oscillation when stationary)
   */
  private calculateJiggleForce(boneIndex: number): { x: number; y: number; z: number } {
    const time = this.jiggleTime + boneIndex * 0.5; // Stagger jiggle per bone
    const jiggleScale = Math.sin(time * this.jiggleFrequency * Math.PI * 2);

    return {
      x: Math.sin(time * 2) * this.jiggleAmount * jiggleScale,
      y: Math.cos(time * 1.5) * this.jiggleAmount * jiggleScale,
      z: Math.sin(time * 1.8) * this.jiggleAmount * jiggleScale * 0.5,
    };
  }

  /**
   * Update mesh geometry based on bone rotations
   *
   * For MVP: We'll apply scale along the mesh based on bone rotations
   * A full implementation would use skeletal animation with bone weights
   */
  updateMeshDeformation(): void {
    const positionAttribute = this.mesh.geometry.getAttribute('position');
    const positions = positionAttribute.array as Float32Array;

    // Apply deformation: scale mesh in direction of bone rotations
    for (let i = 0; i < positions.length; i += 3) {
      const x = this.originalPositions[i];
      const y = this.originalPositions[i + 1];
      const z = this.originalPositions[i + 2];

      // Calculate vertex's bone influence (vertices toward tip affected less)
      const meshProgress = Math.abs(y) / 0.75; // Normalized height along mesh
      const boneIndex = Math.floor(meshProgress * (this.bones.length - 1));
      const boneInfluence = Math.min(1.0, 1.0 - meshProgress * 0.3);

      if (boneIndex < this.bones.length) {
        const bone = this.bones[boneIndex];

        // Apply bone rotation as a scale/shear (simplified deformation)
        const deformX = x + Math.sin(bone.rotation.z) * 0.1 * boneInfluence;
        const deformY = y; // Keep height
        const deformZ = z + Math.sin(bone.rotation.x) * 0.1 * boneInfluence;

        positions[i] = deformX;
        positions[i + 1] = deformY;
        positions[i + 2] = deformZ;
      }
    }

    // Mark geometry as needing update
    positionAttribute.needsUpdate = true;
  }

  /**
   * Get bones array
   */
  getBones(): Bone[] {
    return this.bones;
  }

  /**
   * Get bone count
   */
  getBoneCount(): number {
    return this.bones.length;
  }

  /**
   * Manually set bone rotation (for testing)
   */
  setBoneRotation(index: number, rotation: THREE.Euler): void {
    if (index < this.bones.length) {
      this.bones[index].rotation.copy(rotation);
    }
  }

  /**
   * Get stiffness parameter
   */
  getStiffness(): number {
    return this.stiffness;
  }

  /**
   * Set stiffness parameter
   */
  setStiffness(value: number): void {
    this.stiffness = Math.max(0, value);
  }

  /**
   * Get damping parameter
   */
  getDamping(): number {
    return this.damping;
  }

  /**
   * Set damping parameter
   */
  setDamping(value: number): void {
    this.damping = Math.max(0, Math.min(2, value)); // Allow up to 2 for strong damping
  }

  /**
   * Reset all bones to rest position
   */
  reset(): void {
    this.bones.forEach((bone) => {
      bone.rotation.set(0, 0, 0);
      bone.velocity.set(0, 0, 0);
      bone.acceleration.set(0, 0, 0);
    });
    this.jiggleTime = 0;
  }
}
