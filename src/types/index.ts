/**
 * Noodle Racers - TypeScript Types & Interfaces
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface GameState {
  isRunning: boolean;
  isPaused: boolean;
  distance: number;
  score: number;
  speed: number;
  difficulty: number;
  lives: number;
}

export interface NoodleCharacter {
  id: string;
  position: Vec3;
  velocity: Vec3;
  rotation: Vec3;
  mass: number;
  alive: boolean;
}

export interface Obstacle {
  id: string;
  type: 'box' | 'spike' | 'rotating' | 'moving';
  position: Vec3;
  size: Vec3;
  active: boolean;
}

export interface PowerUp {
  id: string;
  type: 'speed' | 'shield' | 'magnet';
  position: Vec3;
  active: boolean;
  duration: number;
}

export interface TrackSegment {
  id: string;
  length: number;
  width: number;
  curve: number;
  slope: number;
  obstacles: Obstacle[];
  powerUps: PowerUp[];
}

export interface GameConfig {
  targetFPS: number;
  gravityStrength: number;
  initialSpeed: number;
  maxSpeed: number;
  difficultyMultiplier: number;
}

export {};
