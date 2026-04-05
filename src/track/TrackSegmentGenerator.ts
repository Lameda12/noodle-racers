/**
 * TrackSegmentGenerator - Procedural track generation
 *
 * Generates infinite track segments with:
 * - Smooth curves (no sharp turns)
 * - Progressive slopes (gets steeper with distance)
 * - Obstacle placement
 * - Power-up spawning
 * - Seeded randomness for reproducibility
 */

import * as THREE from 'three';

export interface TrackSegment {
  id: string;
  distance: number; // Distance from start
  length: number; // Segment length
  width: number; // Track width
  curve: number; // -0.5 to 0.5 (curvature)
  slope: number; // -0.3 to 0 (downward slope)
  obstacleCount: number; // Number of obstacles to spawn
  powerUpProbability: number; // Chance of power-up (0-1)
}

export class TrackSegmentGenerator {
  private segmentIndex = 0;
  private segmentLength = 20; // Units per segment
  private width = 10; // Track width in units
  private seed: number;
  private currentSeed: number;

  constructor(seed?: number) {
    this.seed = seed || Math.random() * 100000;
    this.currentSeed = this.seed;
  }

  /**
   * Seeded random number generator (deterministic)
   */
  private random(): number {
    const x = Math.sin(this.currentSeed++) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Generate a track segment at a given distance
   */
  generateSegment(distance: number): TrackSegment {
    const seed = this.seed + Math.floor(distance / this.segmentLength);
    this.currentSeed = seed;

    // Calculate difficulty level (0-1, based on distance)
    const difficulty = Math.min(1.0, distance / 10000);

    // Generate curve (smooth, no sharp turns)
    // Use sine wave for smooth transitions
    const curveBase = Math.sin((distance / 500) * Math.PI * 2) * 0.3;
    const curveRandom = (this.random() - 0.5) * 0.2;
    const curve = curveBase + curveRandom * (0.5 - difficulty * 0.3);

    // Generate slope (gets steeper with difficulty)
    const minSlope = -0.05;
    const maxSlope = -0.25;
    const slope = minSlope + (maxSlope - minSlope) * difficulty;
    const slopeVariation = (this.random() - 0.5) * 0.05;

    // Obstacle density increases with difficulty
    const baseObstacleCount = 0.5 + difficulty * 1.5;
    const obstacleCount = Math.floor(baseObstacleCount + this.random() * 2);

    // Power-up probability
    const powerUpProbability = 0.05 + difficulty * 0.05; // 5% to 10%

    return {
      id: `segment-${this.segmentIndex++}`,
      distance,
      length: this.segmentLength,
      width: this.width,
      curve: Math.max(-0.5, Math.min(0.5, curve)),
      slope: slope + slopeVariation,
      obstacleCount,
      powerUpProbability: Math.min(1, powerUpProbability),
    };
  }

  /**
   * Generate Three.js mesh for a track segment
   */
  generateMeshForSegment(segment: TrackSegment): THREE.Mesh {
    // Create curved plane geometry
    const geometry = this.createSegmentGeometry(segment);

    // Color based on difficulty
    const difficulty = Math.min(1.0, segment.distance / 10000);
    const color = new THREE.Color();
    color.setHSL(0.55 - difficulty * 0.1, 0.6, 0.5); // Purple to blue

    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.8,
      metalness: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.position.z = -segment.distance - segment.length / 2;

    return mesh;
  }

  /**
   * Create curved segment geometry
   */
  private createSegmentGeometry(segment: TrackSegment): THREE.BufferGeometry {
    const width = segment.width;
    const length = segment.length;
    const widthSegments = 4;
    const lengthSegments = 8;

    const geometry = new THREE.PlaneGeometry(
      width,
      length,
      widthSegments,
      lengthSegments
    );

    // Apply curve and slope to vertices
    const positionAttribute = geometry.getAttribute('position');
    const positions = positionAttribute.array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]; // -width/2 to width/2
      const y = positions[i + 1]; // -length/2 to length/2
      const z = positions[i + 2];

      // Apply curve (bend left/right)
      const curvedX = x + segment.curve * (y * y) * 0.1;

      // Apply slope (tilt downward)
      const slopedY = y + segment.slope * y * 0.5;

      positions[i] = curvedX;
      positions[i + 1] = slopedY;
      positions[i + 2] = z;
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();

    return geometry;
  }

  /**
   * Get segment length
   */
  getSegmentLength(): number {
    return this.segmentLength;
  }

  /**
   * Reset generator to initial seed
   */
  reset(): void {
    this.currentSeed = this.seed;
    this.segmentIndex = 0;
  }
}
