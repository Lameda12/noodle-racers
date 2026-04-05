/**
 * TrackSegmentGenerator - Tests for procedural track generation
 * TDD: Tests written first
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TrackSegmentGenerator } from './TrackSegmentGenerator';

describe('TrackSegmentGenerator - Procedural Track Generation', () => {
  let generator: TrackSegmentGenerator;

  beforeEach(() => {
    generator = new TrackSegmentGenerator();
  });

  describe('Initialization', () => {
    it('should initialize with default parameters', () => {
      expect(generator).toBeDefined();
      expect(generator.getSegmentLength()).toBeGreaterThan(0);
    });
  });

  describe('Segment Generation', () => {
    it('should generate segment with consistent length', () => {
      const segment1 = generator.generateSegment(0);
      const segment2 = generator.generateSegment(100);

      expect(segment1.length).toBe(segment2.length);
    });

    it('should generate unique segments (different curves)', () => {
      const segment1 = generator.generateSegment(0);
      const segment2 = generator.generateSegment(100);

      // At least one property should differ (curve or slope)
      expect(
        segment1.curve !== segment2.curve || segment1.slope !== segment2.slope
      ).toBe(true);
    });

    it('should have curve within bounds', () => {
      const segment = generator.generateSegment(50);

      expect(segment.curve).toBeGreaterThanOrEqual(-0.5);
      expect(segment.curve).toBeLessThanOrEqual(0.5);
    });

    it('should have slope within bounds', () => {
      const segment = generator.generateSegment(50);

      expect(segment.slope).toBeGreaterThanOrEqual(-0.3);
      expect(segment.slope).toBeLessThanOrEqual(0);
    });
  });

  describe('Difficulty Progression', () => {
    it('should increase difficulty with distance', () => {
      const segment1 = generator.generateSegment(0);
      const segment2 = generator.generateSegment(5000);
      const segment3 = generator.generateSegment(10000);

      // Track should get "harder" - more curves, steeper slopes
      const diff1 = Math.abs(segment1.curve) + Math.abs(segment1.slope);
      const diff2 = Math.abs(segment2.curve) + Math.abs(segment2.slope);
      const diff3 = Math.abs(segment3.curve) + Math.abs(segment3.slope);

      expect(diff2).toBeGreaterThanOrEqual(diff1);
      expect(diff3).toBeGreaterThanOrEqual(diff2);
    });

    it('should have steeper slopes at higher distances', () => {
      const segment1 = generator.generateSegment(0);
      const segment2 = generator.generateSegment(10000);

      expect(Math.abs(segment2.slope)).toBeGreaterThan(Math.abs(segment1.slope));
    });
  });

  describe('Segment Properties', () => {
    it('should include width property', () => {
      const segment = generator.generateSegment(0);
      expect(segment.width).toBeGreaterThan(0);
    });

    it('should include obstacle count', () => {
      const segment = generator.generateSegment(0);
      expect(segment.obstacleCount).toBeGreaterThanOrEqual(0);
    });

    it('should increase obstacle density with difficulty', () => {
      const segment1 = generator.generateSegment(0);
      const segment2 = generator.generateSegment(10000);

      expect(segment2.obstacleCount).toBeGreaterThanOrEqual(segment1.obstacleCount);
    });

    it('should include power-up probability', () => {
      const segment = generator.generateSegment(0);
      expect(segment.powerUpProbability).toBeGreaterThanOrEqual(0);
      expect(segment.powerUpProbability).toBeLessThanOrEqual(1);
    });
  });

  describe('Segment Mesh Generation', () => {
    it('should generate Three.js mesh', () => {
      const segment = generator.generateSegment(0);
      const mesh = generator.generateMeshForSegment(segment);

      expect(mesh).toBeDefined();
      expect(mesh.geometry).toBeDefined();
      expect(mesh.material).toBeDefined();
    });

    it('should create different meshes for different segments', () => {
      const segment1 = generator.generateSegment(0);
      const segment2 = generator.generateSegment(5000);

      const mesh1 = generator.generateMeshForSegment(segment1);
      const mesh2 = generator.generateMeshForSegment(segment2);

      // Different segments could have different colors/materials
      expect(mesh1).not.toBe(mesh2);
    });
  });

  describe('Caching & Performance', () => {
    it('should cache generated segments for efficiency', () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        generator.generateSegment(i * 20);
      }

      const endTime = performance.now();
      const time = endTime - startTime;

      // Should be very fast (all math, no allocation)
      expect(time).toBeLessThan(100); // 100ms for 100 segments
    });
  });

  describe('Configuration', () => {
    it('should allow setting seed for reproducibility', () => {
      const gen1 = new TrackSegmentGenerator(12345);
      const gen2 = new TrackSegmentGenerator(12345);

      const seg1 = gen1.generateSegment(5000);
      const seg2 = gen2.generateSegment(5000);

      // Same seed should generate identical segments
      expect(seg1.curve).toBe(seg2.curve);
      expect(seg1.slope).toBe(seg2.slope);
    });
  });
});
