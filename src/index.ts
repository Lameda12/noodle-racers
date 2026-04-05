/**
 * Noodle Racers - Main Entry Point
 * A hilariously fun 3D physics-based endless runner
 */

import { getGameState } from '@/core/GameState';
import { Renderer } from '@/rendering/Renderer';
import { ParticleSystem } from '@/rendering/ParticleSystem';
import { NoodleCharacter } from '@/character/NoodleCharacter';
import { TrackManager } from '@/track/TrackManager';
import { TrackSegmentGenerator } from '@/track/TrackSegmentGenerator';
import { DifficultyScaler } from '@/track/DifficultyScaler';
import { ObstacleManager } from '@/hazards/ObstacleManager';
import { PowerUpManager } from '@/hazards/PowerUpManager';
import { InputHandler } from '@/input/InputHandler';
import { SoundManager } from '@/audio/SoundManager';
import { Leaderboard } from '@/ui/Leaderboard';
import { HUD } from '@/ui/HUD';

// Initialize core systems
const gameState = getGameState();
const renderer = new Renderer();
const scene = renderer.getScene();
const soundManager = new SoundManager();
const particleSystem = new ParticleSystem(scene);
const leaderboard = new Leaderboard();

// Create player character
const noodleCharacter = new NoodleCharacter(gameState);
scene.add(noodleCharacter.getMesh());

// Create track
const trackManager = new TrackManager(gameState, scene);

// Create obstacles
const obstacleManager = new ObstacleManager(gameState, scene, noodleCharacter);

// Create power-ups
const powerUpManager = new PowerUpManager(gameState, scene, noodleCharacter);

// Setup difficulty scaling
const difficultyScaler = new DifficultyScaler(gameState);

// Setup track generator (for procedural generation in Phase 4)
const trackGenerator = new TrackSegmentGenerator();

// Setup input
const inputHandler = new InputHandler(noodleCharacter);

// Setup UI
const hud = new HUD(gameState);
hud.setSoundManager(soundManager);
hud.setLeaderboard(leaderboard);

console.log('🍝 Noodle Racers initialized - Ready to play!');

/**
 * Main game loop
 */
let lastFrameTime = 0;

function gameLoop(currentTime: number): void {
  const deltaTime = lastFrameTime ? (currentTime - lastFrameTime) / 1000 : 0.016;
  lastFrameTime = currentTime;

  if (gameState.getState().isRunning) {
    // Update game state (physics, scoring, difficulty)
    gameState.update(Math.min(deltaTime, 0.033)); // Cap at 33ms to prevent spiral

    // Update character (with bone deformation)
    noodleCharacter.update(Math.min(deltaTime, 0.033));

    // Update camera
    renderer.updateCamera(noodleCharacter.getPosition());

    // Check collision with obstacles
    const collision = obstacleManager.checkCollision();
    if (collision) {
      console.log('💥 Collision detected!');

      // Particle effects
      const collisionPos = noodleCharacter.getPosition();
      particleSystem.emitCollision(collisionPos, 15);

      // Sound effect
      soundManager.playCollisionSFX();

      const direction = noodleCharacter
        .getPosition()
        .sub(new (require('three').Vector3)(collision.body.position.x, collision.body.position.y, collision.body.position.z));
      noodleCharacter.applyImpact(direction, 5);
      gameState.stop();
    }

    // Check if noodle fell off track
    if (!noodleCharacter.isAlive()) {
      console.log('💀 Noodle fell!');
      gameState.stop();
    }
  }

  // Update particles
  particleSystem.update(Math.min(deltaTime, 0.033));

  // Render
  renderer.render();

  requestAnimationFrame(gameLoop);
}

// Start game loop
requestAnimationFrame(gameLoop);

// Handle hot reload
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('🔄 Hot reload triggered');
  });
}

export {};
