/**
 * PowerUpManager - Power-up spawning and collection
 *
 * Power-ups:
 * - Speed Boost: Temporarily increase movement speed
 * - Shield: Immune to next obstacle
 * - Magnet: Automatically collect nearby power-ups
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { GameState } from '@/core/GameState';
import type { NoodleCharacter } from '@/character/NoodleCharacter';

export type PowerUpType = 'speed' | 'shield' | 'magnet';

export interface PowerUp {
  mesh: THREE.Mesh;
  body: CANNON.Body;
  id: string;
  type: PowerUpType;
  active: boolean;
  duration: number;
}

export class PowerUpManager {
  private powerUps: PowerUp[] = [];
  private gameState: GameState;
  private scene: THREE.Scene;
  private noodleCharacter: NoodleCharacter;
  private powerUpPool: PowerUp[] = [];

  private lastSpawnDistance = 0;
  private spawnInterval = 50; // Spawn every 50 units
  private maxPowerUps = 5;

  // Active power-up effects
  private activePowerUps: Map<PowerUpType, number> = new Map(); // type -> endTime

  constructor(gameState: GameState, scene: THREE.Scene, noodleCharacter: NoodleCharacter) {
    this.gameState = gameState;
    this.scene = scene;
    this.noodleCharacter = noodleCharacter;

    this.setupObjectPool();
    gameState.on('gameUpdate', () => this.update());

    console.log('⭐ PowerUpManager initialized');
  }

  /**
   * Setup object pool
   */
  private setupObjectPool(): void {
    const world = this.gameState.getPhysicsWorld();

    for (let i = 0; i < this.maxPowerUps; i++) {
      const geometry = new THREE.SphereGeometry(0.5, 16, 16);
      const material = new THREE.MeshStandardMaterial({
        color: 0xffd54f,
        emissive: 0xff9800,
        roughness: 0.4,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.visible = false;

      const shape = new CANNON.Sphere(0.5);
      const body = new CANNON.Body({ mass: 0, shape });

      world.addBody(body);
      this.scene.add(mesh);

      const powerUp: PowerUp = {
        mesh,
        body,
        id: `powerup-${i}`,
        type: 'speed',
        active: false,
        duration: 0,
      };

      this.powerUpPool.push(powerUp);
    }
  }

  /**
   * Spawn a power-up at a given distance
   */
  private spawnPowerUp(distance: number): void {
    const pooledPowerUp = this.powerUpPool.find((p) => !p.active);
    if (!pooledPowerUp) return;

    // Random lane
    const lanes = [-3, 0, 3];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];

    // Random type
    const types: PowerUpType[] = ['speed', 'shield', 'magnet'];
    const type = types[Math.floor(Math.random() * types.length)];

    pooledPowerUp.type = type;
    pooledPowerUp.body.position.set(lane, 2, distance + 50);
    pooledPowerUp.mesh.position.copy(pooledPowerUp.body.position as any);
    pooledPowerUp.mesh.visible = true;
    pooledPowerUp.active = true;

    // Color by type
    const colors: { [key in PowerUpType]: number } = {
      speed: 0xff6b6b, // Red
      shield: 0x66bb6a, // Green
      magnet: 0x42a5f5, // Blue
    };

    const material = pooledPowerUp.mesh.material as THREE.MeshStandardMaterial;
    material.color.setHex(colors[type]);
    material.emissive.setHex(colors[type]);

    this.powerUps.push(pooledPowerUp);
  }

  /**
   * Update power-ups
   */
  private update(): void {
    const state = this.gameState.getState();
    const playerPos = this.noodleCharacter.getPosition();

    // Spawn new power-ups
    if (state.distance - this.lastSpawnDistance > this.spawnInterval) {
      this.spawnPowerUp(state.distance);
      this.lastSpawnDistance = state.distance;
    }

    // Update active power-ups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];

      // Move power-up toward player
      powerUp.body.position.z -= state.speed * 0.016;
      powerUp.mesh.position.copy(powerUp.body.position as any);

      // Rotate for visual effect
      powerUp.mesh.rotation.y += 0.05;

      // Check collection
      const distance = playerPos.distanceTo(
        new THREE.Vector3(
          powerUp.body.position.x,
          powerUp.body.position.y,
          powerUp.body.position.z
        )
      );

      if (distance < 1.5) {
        this.collectPowerUp(powerUp);
      }

      // Despawn if passed
      if (powerUp.body.position.z < playerPos.z - 30) {
        powerUp.active = false;
        powerUp.mesh.visible = false;
        this.powerUps.splice(i, 1);
      }
    }

    // Update active power-up durations
    const now = Date.now();
    this.activePowerUps.forEach((endTime, type) => {
      if (now > endTime) {
        this.activePowerUps.delete(type);
        console.log(`⭐ ${type} power-up expired`);
      }
    });
  }

  /**
   * Collect a power-up
   */
  private collectPowerUp(powerUp: PowerUp): void {
    console.log(`✨ Collected ${powerUp.type} power-up!`);

    // Apply effect
    const duration = 5000; // 5 seconds
    const now = Date.now();

    switch (powerUp.type) {
      case 'speed':
        this.activePowerUps.set('speed', now + duration);
        break;
      case 'shield':
        this.activePowerUps.set('shield', now + duration);
        break;
      case 'magnet':
        this.activePowerUps.set('magnet', now + duration);
        break;
    }

    // Remove from scene
    powerUp.active = false;
    powerUp.mesh.visible = false;
    const index = this.powerUps.indexOf(powerUp);
    if (index > -1) {
      this.powerUps.splice(index, 1);
    }

    // Score bonus
    this.gameState.emit('powerUpCollected', { type: powerUp.type, score: 100 });
  }

  /**
   * Check if a power-up is active
   */
  isActive(type: PowerUpType): boolean {
    return this.activePowerUps.has(type);
  }

  /**
   * Get active power-ups
   */
  getActivePowerUps(): PowerUpType[] {
    return Array.from(this.activePowerUps.keys());
  }

  /**
   * Clear all power-ups
   */
  clear(): void {
    this.powerUps.forEach((p) => {
      p.active = false;
      p.mesh.visible = false;
    });
    this.powerUps = [];
    this.activePowerUps.clear();
    this.lastSpawnDistance = 0;
  }
}
