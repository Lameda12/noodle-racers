/**
 * DifficultyScaler - Manages difficulty progression
 *
 * Adjusts game parameters based on distance traveled:
 * - Obstacle density
 * - Obstacle speed
 * - Track curvature
 * - Enemy behavior
 */

import type { GameState } from '@/core/GameState';

export interface DifficultySettings {
  speed: number; // Base movement speed
  obstacleSpawnRate: number; // 0-1 (how often obstacles spawn)
  curveIntensity: number; // 0-1 (how much track curves)
  slopeIntensity: number; // 0-1 (how steep slopes are)
  obstacleVariety: number; // Which obstacle types appear
}

export class DifficultyScaler {
  private gameState: GameState;
  private baseSpeed: number = 20;
  private maxSpeed: number = 50;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  /**
   * Get difficulty settings for current game state
   */
  getDifficultySettings(): DifficultySettings {
    const state = this.gameState.getState();
    const difficulty = state.difficulty; // 1.0 to 3.0

    // Speed increases with difficulty
    const speedFactor = 0.5 + (difficulty - 1) * 0.25; // 0.5 to 1.0
    const speed = this.baseSpeed + (this.maxSpeed - this.baseSpeed) * speedFactor;

    // Obstacle spawn rate increases
    const spawnRate = Math.min(1, 0.3 + (difficulty - 1) * 0.35); // 0.3 to 1.0

    // Curve intensity increases
    const curveIntensity = Math.min(1, (difficulty - 1) * 0.5); // 0 to 1.0

    // Slope intensity increases
    const slopeIntensity = Math.min(1, (difficulty - 1) * 0.33); // 0 to 1.0

    // More obstacle types appear at higher difficulties
    const obstacleVariety = Math.floor(1 + (difficulty - 1) * 2); // 1 to 3

    return {
      speed,
      obstacleSpawnRate: spawnRate,
      curveIntensity,
      slopeIntensity,
      obstacleVariety,
    };
  }

  /**
   * Get difficulty level (1.0 to 3.0)
   */
  getDifficultyLevel(): number {
    return this.gameState.getState().difficulty;
  }

  /**
   * Get distance multiplier for scoring
   */
  getDistanceMultiplier(): number {
    const difficulty = this.getDifficultyLevel();
    return 1.0 + (difficulty - 1) * 0.2; // 1.0 to 1.4x bonus
  }

  /**
   * Get obstacle health (higher difficulty = tougher obstacles)
   */
  getObstacleHealth(baseHealth: number = 1): number {
    const difficulty = this.getDifficultyLevel();
    return baseHealth + (difficulty - 1) * 0.5;
  }

  /**
   * Check if a new obstacle type should appear
   */
  shouldShowObstacleType(type: string): boolean {
    const difficulty = this.getDifficultyLevel();

    const typeUnlockLevels: { [key: string]: number } = {
      box: 1.0, // Always available
      spinning: 1.5, // Unlock at difficulty 1.5
      moving: 2.0, // Unlock at difficulty 2.0
      spiked: 2.5, // Unlock at difficulty 2.5
    };

    return difficulty >= (typeUnlockLevels[type] || 1.0);
  }

  /**
   * Get remaining distance to next difficulty tier
   */
  getDistanceToNextTier(): number {
    const state = this.gameState.getState();
    const nextTierDistance = Math.ceil((state.difficulty - 1) * 5000 + 5000);
    return Math.max(0, nextTierDistance - state.distance);
  }
}
