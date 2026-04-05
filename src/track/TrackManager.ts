/**
 * TrackManager - Simple track system for MVP
 *
 * For MVP: static infinite plane
 * Obstacles move toward player instead of track spawning
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { GameState } from '@/core/GameState';

export class TrackManager {
  private trackMesh: THREE.Mesh;
  private trackBody: CANNON.Body;
  private gameState: GameState;

  constructor(gameState: GameState, scene: THREE.Scene) {
    this.gameState = gameState;
    const world = gameState.getPhysicsWorld();

    // Create static track (large plane)
    const trackGeometry = new THREE.PlaneGeometry(20, 1000);
    const trackMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a6a,
      roughness: 0.9,
      metalness: 0.1,
    });
    this.trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
    this.trackMesh.rotation.x = -Math.PI / 2; // Horizontal
    this.trackMesh.position.z = -500;
    this.trackMesh.receiveShadow = true;
    scene.add(this.trackMesh);

    // Create physics body for track
    const trackShape = new CANNON.Plane();
    this.trackBody = new CANNON.Body({ mass: 0, shape: trackShape });
    this.trackBody.quaternion.set(
      Math.sin(-Math.PI / 4),
      0,
      0,
      Math.cos(-Math.PI / 4)
    );
    this.trackBody.position.set(0, 0, -500);
    world.addBody(this.trackBody);

    console.log('🛣️  Track initialized');
  }

  /**
   * Get track mesh
   */
  getMesh(): THREE.Mesh {
    return this.trackMesh;
  }

  /**
   * Get track body
   */
  getBody(): CANNON.Body {
    return this.trackBody;
  }
}
