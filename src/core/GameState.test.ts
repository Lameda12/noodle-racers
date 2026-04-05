/**
 * GameState - Core game logic and state management
 * Tests written first (TDD), implementation follows
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from './GameState';

describe('GameState - Core Game Loop', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
  });

  describe('Initialization', () => {
    it('should initialize with default game state', () => {
      const state = gameState.getState();
      expect(state.isRunning).toBe(false);
      expect(state.speed).toBe(0);
      expect(state.distance).toBe(0);
      expect(state.score).toBe(0);
    });

    it('should create Cannon physics world', () => {
      const world = gameState.getPhysicsWorld();
      expect(world).toBeDefined();
      expect(world.gravity).toBeDefined();
    });

    it('should have gravity pointing down', () => {
      const world = gameState.getPhysicsWorld();
      expect(world.gravity.y).toBeLessThan(0);
    });
  });

  describe('Game Lifecycle', () => {
    it('should start game', () => {
      gameState.start();
      expect(gameState.getState().isRunning).toBe(true);
    });

    it('should stop game', () => {
      gameState.start();
      gameState.stop();
      expect(gameState.getState().isRunning).toBe(false);
    });

    it('should reset state on start', () => {
      gameState.start();
      gameState.update(0.016); // 60fps = 16.67ms
      gameState.stop();
      gameState.start();

      const state = gameState.getState();
      expect(state.distance).toBe(0);
      expect(state.score).toBe(0);
    });
  });

  describe('Game Loop & Physics Stepping', () => {
    it('should step physics at fixed timestep', () => {
      gameState.start();
      const world = gameState.getPhysicsWorld();

      // Record gravity before step
      const gravityBefore = world.gravity.y;

      // Update with delta time
      gameState.update(0.016); // ~60fps frame

      // Gravity should not change (fixed)
      expect(world.gravity.y).toBe(gravityBefore);
    });

    it('should update distance over time', () => {
      gameState.start();
      const deltaTime = 0.016; // 60fps frame

      gameState.update(deltaTime);
      const distance1 = gameState.getState().distance;

      gameState.update(deltaTime);
      const distance2 = gameState.getState().distance;

      expect(distance2).toBeGreaterThan(distance1);
    });

    it('should increase speed gradually', () => {
      gameState.start();
      const initialSpeed = gameState.getState().speed;

      gameState.update(0.016);
      gameState.update(0.016);
      gameState.update(0.016);

      const newSpeed = gameState.getState().speed;
      expect(newSpeed).toBeGreaterThan(initialSpeed);
    });

    it('should cap speed at maximum', () => {
      gameState.start();
      const maxSpeed = 50; // From config

      // Simulate long gameplay
      for (let i = 0; i < 10000; i++) {
        gameState.update(0.016);
      }

      expect(gameState.getState().speed).toBeLessThanOrEqual(maxSpeed);
    });

    it('should calculate score from speed × time', () => {
      gameState.start();

      const deltaTime = 0.016;
      gameState.update(deltaTime);

      const score1 = gameState.getState().score;
      expect(score1).toBeGreaterThan(0);

      gameState.update(deltaTime);
      const score2 = gameState.getState().score;

      // Score should increase each frame
      expect(score2).toBeGreaterThan(score1);
    });
  });

  describe('Event System', () => {
    it('should fire onGameStart event', () => {
      return new Promise<void>((resolve) => {
        gameState.on('gameStart', () => {
          expect(true).toBe(true);
          resolve();
        });

        gameState.start();
      });
    });

    it('should fire onGameStop event', () => {
      return new Promise<void>((resolve) => {
        gameState.on('gameStop', () => {
          expect(true).toBe(true);
          resolve();
        });

        gameState.start();
        gameState.stop();
      });
    });

    it('should fire onGameUpdate event with state', () => {
      return new Promise<void>((resolve) => {
        let updateCount = 0;

        gameState.on('gameUpdate', (state) => {
          updateCount++;
          expect(state).toBeDefined();
          expect(state.isRunning).toBe(true);

          if (updateCount >= 2) {
            resolve();
          }
        });

        gameState.start();
        gameState.update(0.016);
        gameState.update(0.016);
      });
    });

    it('should fire onCollision event', () => {
      return new Promise<void>((resolve) => {
        gameState.on('collision', (data) => {
          expect(data).toBeDefined();
          resolve();
        });

        // Simulate collision
        const world = gameState.getPhysicsWorld();
        world.defaultContactMaterial.friction = 0.3;

        // Emit test collision event
        gameState.emit('collision', { body1: 'test', body2: 'test' });
      });
    });
  });

  describe('Difficulty Progression', () => {
    it('should increase difficulty over distance', () => {
      gameState.start();

      // Simulate 100 frames at 16ms each
      for (let i = 0; i < 100; i++) {
        gameState.update(0.016);
      }

      const difficulty = gameState.getState().difficulty;
      expect(difficulty).toBeGreaterThan(1);
    });

    it('should not exceed max difficulty', () => {
      gameState.start();

      // Simulate very long gameplay
      for (let i = 0; i < 10000; i++) {
        gameState.update(0.016);
      }

      const difficulty = gameState.getState().difficulty;
      expect(difficulty).toBeLessThanOrEqual(3.0); // Max difficulty cap
    });
  });

  describe('Pausing', () => {
    it('should pause and resume game', () => {
      gameState.start();
      const scoreBefore = gameState.getState().score;

      gameState.pause();
      gameState.update(0.016);
      const scoreAfterPause = gameState.getState().score;

      expect(scoreBefore).toBe(scoreAfterPause); // Score doesn't change when paused

      gameState.resume();
      gameState.update(0.016);
      const scoreAfterResume = gameState.getState().score;

      expect(scoreAfterResume).toBeGreaterThan(scoreBefore);
    });
  });
});
