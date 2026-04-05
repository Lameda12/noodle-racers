/**
 * GameManager - Central game loop and state orchestration
 *
 * Coordinates all subsystems:
 * - Input handling
 * - Physics updates
 * - Game state
 * - Difficulty progression
 */

import type { GameState, GameConfig } from '@/types';

export class GameManager {
  private gameState: GameState = {
    isRunning: false,
    isPaused: false,
    distance: 0,
    score: 0,
    speed: 0,
    difficulty: 1,
    lives: 3,
  };

  private config: GameConfig = {
    targetFPS: 60,
    gravityStrength: 9.81,
    initialSpeed: 10,
    maxSpeed: 50,
    difficultyMultiplier: 1.0,
  };

  private lastFrameTime: number = 0;
  private frameCount: number = 0;

  constructor() {
    console.log('🎮 GameManager initialized');
  }

  /**
   * Initialize game systems
   */
  async init(): Promise<void> {
    console.log('Initializing Noodle Racers...');

    // TODO: Initialize subsystems in order:
    // 1. SceneManager (Three.js)
    // 2. CannonManager (Physics)
    // 3. TrackGenerator
    // 4. NoodleCharacter
    // 5. UIManager

    this.gameState.isRunning = false;
  }

  /**
   * Start the game
   */
  start(): void {
    this.gameState.isRunning = true;
    this.gameState.isPaused = false;
    this.gameState.distance = 0;
    this.gameState.score = 0;
    this.gameState.speed = this.config.initialSpeed;
    console.log('🎮 Game started');
  }

  /**
   * Pause the game
   */
  pause(): void {
    this.gameState.isPaused = true;
    console.log('⏸️  Game paused');
  }

  /**
   * Resume the game
   */
  resume(): void {
    this.gameState.isPaused = false;
    console.log('▶️  Game resumed');
  }

  /**
   * Main game loop update
   */
  update(deltaTime: number): void {
    if (!this.gameState.isRunning || this.gameState.isPaused) return;

    // TODO: Update all systems
    // - Input system
    // - Physics world
    // - Character state
    // - Track generation
    // - Collision detection
    // - Difficulty scaling

    this.frameCount++;
  }

  /**
   * Render the scene
   */
  render(): void {
    // TODO: Three.js renderer.render()
  }

  /**
   * Game over
   */
  gameOver(): void {
    this.gameState.isRunning = false;
    console.log(`💀 Game Over! Final Score: ${this.gameState.score}`);
  }

  /**
   * Get current game state
   */
  getState(): GameState {
    return { ...this.gameState };
  }

  /**
   * Get game config
   */
  getConfig(): GameConfig {
    return { ...this.config };
  }
}
