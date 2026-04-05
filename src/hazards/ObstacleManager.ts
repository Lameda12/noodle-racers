/**
 * ObstacleManager - Obstacle spawning and management
 *
 * MVP: Simple box obstacles that move toward player
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { GameState } from '@/core/GameState';
import type { NoodleCharacter } from '@/character/NoodleCharacter';

export interface Obstacle {
  mesh: THREE.Mesh;
  body: CANNON.Body;
  id: string;
  active: boolean;
}

export class ObstacleManager {
  private obstacles: Obstacle[] = [];
  private gameState: GameState;
  private scene: THREE.Scene;
  private noodleCharacter: NoodleCharacter;

  private lastSpawnDistance = 0;
  private spawnInterval = 15; // Spawn every 15 units
  private maxObstacles = 15; // Object pool size
  private obstaclePool: Obstacle[] = [];

  constructor(gameState: GameState, scene: THREE.Scene, noodleCharacter: NoodleCharacter) {
    this.gameState = gameState;
    this.scene = scene;
    this.noodleCharacter = noodleCharacter;

    // Pre-allocate obstacle pool
    this.setupObjectPool();

    // Listen to game state for collisions
    gameState.on('gameUpdate', () => this.update());

    console.log('💥 ObstacleManager initialized');
  }

  /**
   * Setup object pool to avoid GC pauses
   */
  private setupObjectPool(): void {
    const world = this.gameState.getPhysicsWorld();

    for (let i = 0; i < this.maxObstacles; i++) {
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshStandardMaterial({
        color: 0xff3333,
        roughness: 0.8,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.visible = false;

      const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
      const body = new CANNON.Body({
        mass: 0, // Static for MVP
        shape: shape,
      });

      world.addBody(body);
      this.scene.add(mesh);

      const obstacle: Obstacle = {
        mesh,
        body,
        id: `obstacle-${i}`,
        active: false,
      };

      this.obstaclePool.push(obstacle);
    }
  }

  /**
   * Spawn an obstacle at a given position
   */
  private spawnObstacle(distance: number): void {
    const pooledObstacle = this.obstaclePool.find((o) => !o.active);
    if (!pooledObstacle) return; // Pool exhausted

    // Random lane: left (-3), center (0), right (3)
    const lanes = [-3, 0, 3];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];

    // Position ahead of player
    pooledObstacle.body.position.set(lane, 2, distance + 50);
    pooledObstacle.mesh.position.copy(pooledObstacle.body.position as any);
    pooledObstacle.mesh.visible = true;
    pooledObstacle.active = true;

    this.obstacles.push(pooledObstacle);
  }

  /**
   * Update obstacles (move toward player, despawn if passed)
   */
  private update(): void {
    const state = this.gameState.getState();
    const playerPos = this.noodleCharacter.getPosition();

    // Spawn new obstacles based on distance
    if (state.distance - this.lastSpawnDistance > this.spawnInterval) {
      this.spawnObstacle(state.distance);
      this.lastSpawnDistance = state.distance;
    }

    // Update active obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];

      // Move obstacle toward player (simulate infinite track)
      obstacle.body.position.z -= state.speed * 0.016; // Approx 60fps delta
      obstacle.mesh.position.copy(obstacle.body.position as any);

      // Check if passed player (despawn)
      if (obstacle.body.position.z < playerPos.z - 30) {
        obstacle.active = false;
        obstacle.mesh.visible = false;
        this.obstacles.splice(i, 1);
      }
    }
  }

  /**
   * Check collision with noodle
   */
  checkCollision(): Obstacle | null {
    const noodleBody = this.noodleCharacter.getBody();
    const noodlePos = this.noodleCharacter.getPosition();

    for (const obstacle of this.obstacles) {
      // Simple distance check (bounding sphere)
      const dx = obstacle.body.position.x - noodleBody.position.x;
      const dy = obstacle.body.position.y - noodleBody.position.y;
      const dz = obstacle.body.position.z - noodleBody.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < 1.5) {
        return obstacle;
      }
    }

    return null;
  }

  /**
   * Get all active obstacles
   */
  getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  /**
   * Clear all obstacles
   */
  clear(): void {
    this.obstacles.forEach((o) => {
      o.active = false;
      o.mesh.visible = false;
    });
    this.obstacles = [];
    this.lastSpawnDistance = 0;
  }
}
