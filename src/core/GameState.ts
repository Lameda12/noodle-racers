/**
 * GameState - Central game loop and state orchestration
 *
 * Manages:
 * - Cannon.js physics world with fixed timestep
 * - Game state (score, distance, speed, difficulty)
 * - Event system for loose coupling between systems
 * - Game lifecycle (start, stop, pause, resume)
 *
 * Architecture Pattern: Singleton with Event Emitter
 * Based on SlashSaber (proven production pattern)
 */

import * as CANNON from 'cannon-es';
import type { GameState as GameStateType } from '@/types';

export interface GameStateConfig {
  initialSpeed: number;
  maxSpeed: number;
  speedAcceleration: number;
  gravityStrength: number;
  difficultyMultiplier: number;
}

export interface GameStateSnapshot extends GameStateType {
  difficulty: number;
  isPaused: boolean;
}

type EventCallback = (...args: any[]) => void;
type EventName = 'gameStart' | 'gameStop' | 'gameUpdate' | 'collision' | 'speedChange' | 'difficultyChange';

export class GameState {
  private state: GameStateSnapshot = {
    isRunning: false,
    isPaused: false,
    distance: 0,
    score: 0,
    speed: 0,
    difficulty: 1,
    lives: 3,
  };

  private config: GameStateConfig = {
    initialSpeed: 15,
    maxSpeed: 50,
    speedAcceleration: 15, // units/s²
    gravityStrength: 9.81,
    difficultyMultiplier: 1.0,
  };

  // Physics world - core of simulation
  private world: CANNON.World;

  // Event system for decoupled communication
  private eventListeners: Map<EventName, Set<EventCallback>> = new Map();

  // Frame timing
  private lastUpdateTime: number = 0;
  private frameCount: number = 0;

  // Fixed physics timestep (60 FPS)
  private readonly FIXED_TIMESTEP = 1.0 / 60.0;
  private readonly SOLVER_ITERATIONS = 3;

  constructor(config?: Partial<GameStateConfig>) {
    this.config = { ...this.config, ...config };

    // Initialize physics world
    this.world = new CANNON.World();
    this.world.gravity.set(0, -this.config.gravityStrength, 0);
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.solver.iterations = this.SOLVER_ITERATIONS;
    this.world.allowSleep = true;

    // Initialize material for default friction
    const defaultMaterial = new CANNON.Material('default');
    this.world.defaultContactMaterial = new CANNON.ContactMaterial(
      defaultMaterial,
      defaultMaterial,
      { friction: 0.3, restitution: 0.2 }
    );
  }

  /**
   * Start the game
   */
  start(): void {
    this.state = {
      isRunning: true,
      isPaused: false,
      distance: 0,
      score: 0,
      speed: this.config.initialSpeed,
      difficulty: 1,
      lives: 3,
    };

    this.lastUpdateTime = performance.now();
    this.frameCount = 0;

    this.emit('gameStart', this.state);
  }

  /**
   * Stop the game
   */
  stop(): void {
    this.state.isRunning = false;
    this.emit('gameStop', this.state);
  }

  /**
   * Pause the game (state persists)
   */
  pause(): void {
    this.state.isPaused = true;
  }

  /**
   * Resume the game
   */
  resume(): void {
    this.state.isPaused = false;
    this.lastUpdateTime = performance.now(); // Reset timer to avoid large delta
  }

  /**
   * Main game loop update
   * Called every frame from requestAnimationFrame
   */
  update(deltaTime: number): void {
    if (!this.state.isRunning || this.state.isPaused) return;

    // Step physics with fixed timestep
    this.world.step(this.FIXED_TIMESTEP, deltaTime, this.SOLVER_ITERATIONS);

    // Update game state based on progression
    this.updateGameLogic(deltaTime);

    // Increment frame counter
    this.frameCount++;

    // Emit update event for all listeners
    this.emit('gameUpdate', this.state);
  }

  /**
   * Game logic update (speed, distance, difficulty, score)
   */
  private updateGameLogic(deltaTime: number): void {
    const prevSpeed = this.state.speed;
    const prevDifficulty = this.state.difficulty;

    // Accelerate speed towards max (smooth acceleration curve)
    const speedDifference = this.config.maxSpeed - this.state.speed;
    this.state.speed = Math.min(
      this.state.speed + deltaTime * this.config.speedAcceleration,
      this.config.maxSpeed
    );

    // Update distance (unit per second × time)
    this.state.distance += this.state.speed * deltaTime;

    // Calculate score (proportional to distance traveled)
    // Harder difficulty = more points per distance
    this.state.score += this.state.distance * (this.state.difficulty / 100) * deltaTime;

    // Update difficulty based on distance (smooth progression)
    // 1.0 at start, 3.0 at 10,000 units
    const difficultyProgression = Math.min(1 + (this.state.distance / 10000) * 2, 3.0);
    this.state.difficulty = Number(difficultyProgression.toFixed(2));

    // Emit events if values changed
    if (prevSpeed !== this.state.speed) {
      this.emit('speedChange', this.state.speed);
    }

    if (prevDifficulty !== this.state.difficulty) {
      this.emit('difficultyChange', this.state.difficulty);
    }
  }

  /**
   * Get current game state snapshot
   */
  getState(): Readonly<GameStateSnapshot> {
    return Object.freeze({ ...this.state });
  }

  /**
   * Get physics world (for adding bodies, constraints, etc.)
   */
  getPhysicsWorld(): CANNON.World {
    return this.world;
  }

  /**
   * Get game configuration
   */
  getConfig(): Readonly<GameStateConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Get frame count since start
   */
  getFrameCount(): number {
    return this.frameCount;
  }

  /**
   * Event system - Subscribe to game events
   */
  on(eventName: EventName, callback: EventCallback): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    this.eventListeners.get(eventName)!.add(callback);
  }

  /**
   * Unsubscribe from event
   */
  off(eventName: EventName, callback: EventCallback): void {
    this.eventListeners.get(eventName)?.delete(callback);
  }

  /**
   * Emit event to all listeners
   */
  emit(eventName: EventName, ...args: any[]): void {
    this.eventListeners.get(eventName)?.forEach((callback) => {
      callback(...args);
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.state.isRunning = false;
    this.eventListeners.clear();
    // Physics world will be garbage collected
  }
}

// Singleton instance
let gameStateInstance: GameState | null = null;

/**
 * Get or create GameState singleton
 */
export function getGameState(config?: Partial<GameStateConfig>): GameState {
  if (!gameStateInstance) {
    gameStateInstance = new GameState(config);
  }
  return gameStateInstance;
}

/**
 * Reset singleton (useful for testing)
 */
export function resetGameState(): void {
  gameStateInstance?.destroy();
  gameStateInstance = null;
}
