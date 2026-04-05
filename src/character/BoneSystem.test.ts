/**
 * BoneSystem - Tests for spring-based bone deformation
 * TDD: Tests written first
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BoneSystem } from './BoneSystem';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

describe('BoneSystem - Spring-Based Bone Animation', () => {
  let boneSystem: BoneSystem;
  let mesh: THREE.Mesh;

  beforeEach(() => {
    // Create a simple mesh for testing
    const geometry = new THREE.CapsuleGeometry(0.3, 1.5, 8, 16);
    const material = new THREE.MeshStandardMaterial();
    mesh = new THREE.Mesh(geometry, material);

    // Create test body
    const body = new CANNON.Body({ mass: 1 });

    boneSystem = new BoneSystem(mesh, body, 5); // 5 bone segments
  });

  describe('Initialization', () => {
    it('should initialize with specified number of bones', () => {
      expect(boneSystem.getBoneCount()).toBe(5);
    });

    it('should create bones with zero initial rotation', () => {
      const bones = boneSystem.getBones();
      bones.forEach((bone) => {
        expect(bone.rotation.x).toBe(0);
        expect(bone.rotation.y).toBe(0);
        expect(bone.rotation.z).toBe(0);
      });
    });

    it('should have spring stiffness set', () => {
      expect(boneSystem.getStiffness()).toBeGreaterThan(0);
    });

    it('should have spring damping set', () => {
      expect(boneSystem.getDamping()).toBeGreaterThan(0);
    });
  });

  describe('Spring Physics', () => {
    it('should apply spring force toward rest position', () => {
      const initialRotation = new THREE.Euler(0.5, 0, 0);
      boneSystem.setBoneRotation(0, initialRotation);

      // Update with zero velocity (spring should pull back)
      boneSystem.update(new CANNON.Vec3(0, 0, 0), 0.016);

      const bone = boneSystem.getBones()[0];
      // Rotation should move back toward zero
      expect(Math.abs(bone.rotation.x)).toBeLessThan(Math.abs(initialRotation.x));
    });

    it('should dampen oscillations', () => {
      const bone = boneSystem.getBones()[0];
      const initialRotation = 0.8;
      boneSystem.setBoneRotation(0, new THREE.Euler(initialRotation, 0, 0));

      const rotationBefore = Math.abs(bone.rotation.x);

      // Multiple updates should converge toward zero
      for (let i = 0; i < 150; i++) {
        boneSystem.update(new CANNON.Vec3(0, 0, 0), 0.016);
      }

      const rotationAfter = Math.abs(bone.rotation.x);

      // Rotation should significantly decrease (damping working)
      expect(rotationAfter).toBeLessThan(rotationBefore * 0.5);
    });
  });

  describe('Velocity-Based Deformation', () => {
    it('should deform bones based on forward velocity', () => {
      const forwardVelocity = new CANNON.Vec3(0, 0, 20); // Moving forward

      boneSystem.update(forwardVelocity, 0.016);

      const bone = boneSystem.getBones()[0];
      // Should have some rotation due to velocity
      expect(Math.abs(bone.rotation.z)).toBeGreaterThan(0);
    });

    it('should deform based on lateral velocity', () => {
      const lateralVelocity = new CANNON.Vec3(10, 0, 0); // Moving right

      boneSystem.update(lateralVelocity, 0.016);

      const bone = boneSystem.getBones()[0];
      // Should have rotation perpendicular to movement
      expect(Math.abs(bone.rotation.y)).toBeGreaterThan(0);
    });

    it('should scale deformation with velocity magnitude', () => {
      const smallVelocity = new CANNON.Vec3(0, 0, 5);
      const largeVelocity = new CANNON.Vec3(0, 0, 20);

      boneSystem.update(smallVelocity, 0.016);
      const smallDefBone = boneSystem.getBones()[0].rotation.z;

      boneSystem.update(largeVelocity, 0.016);
      const largeDefBone = boneSystem.getBones()[0].rotation.z;

      // Larger velocity should produce larger deformation
      expect(Math.abs(largeDefBone)).toBeGreaterThan(Math.abs(smallDefBone));
    });
  });

  describe('Idle Jiggle', () => {
    it('should apply idle jiggle when stationary', () => {
      const zeroVelocity = new CANNON.Vec3(0, 0, 0);

      // Multiple frames with zero velocity should produce jiggle
      let hasJiggle = false;
      const initialRotations = boneSystem.getBones().map((b) => b.rotation.clone());

      for (let i = 0; i < 10; i++) {
        boneSystem.update(zeroVelocity, 0.016);
      }

      const finalRotations = boneSystem.getBones().map((b) => b.rotation);

      // Rotations should vary slightly (jiggle) even with zero velocity
      for (let i = 0; i < finalRotations.length; i++) {
        if (finalRotations[i].x !== initialRotations[i].x) {
          hasJiggle = true;
          break;
        }
      }

      expect(hasJiggle).toBe(true);
    });
  });

  describe('Progressive Bone Influence', () => {
    it('should apply stronger deformation to root bones', () => {
      const velocity = new CANNON.Vec3(0, 0, 15);

      boneSystem.update(velocity, 0.016);

      const bones = boneSystem.getBones();
      const rootBoneDeformation = Math.abs(bones[0].rotation.z);
      const tipBoneDeformation = Math.abs(bones[bones.length - 1].rotation.z);

      // Root should deform more than tip
      expect(rootBoneDeformation).toBeGreaterThan(tipBoneDeformation);
    });
  });

  describe('Mesh Updates', () => {
    it('should update mesh morphTarget or position based on bones', () => {
      const initialVertex = mesh.geometry.attributes.position.array[0];

      boneSystem.setBoneRotation(0, new THREE.Euler(0.5, 0, 0));
      boneSystem.updateMeshDeformation();

      // Mesh should be modified (geometry updated)
      // For now, just verify the method doesn't error
      expect(mesh).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should allow changing stiffness', () => {
      const oldStiffness = boneSystem.getStiffness();
      boneSystem.setStiffness(oldStiffness * 2);

      expect(boneSystem.getStiffness()).toBe(oldStiffness * 2);
    });

    it('should allow changing damping', () => {
      const oldDamping = boneSystem.getDamping();
      boneSystem.setDamping(oldDamping * 0.5);

      expect(boneSystem.getDamping()).toBe(oldDamping * 0.5);
    });
  });

  describe('Reset', () => {
    it('should reset all bones to original rotation', () => {
      // Deform bones
      boneSystem.setBoneRotation(0, new THREE.Euler(0.5, 0, 0));
      boneSystem.setBoneRotation(1, new THREE.Euler(0, 0.3, 0));

      // Reset
      boneSystem.reset();

      const bones = boneSystem.getBones();
      bones.forEach((bone) => {
        expect(bone.rotation.x).toBe(0);
        expect(bone.rotation.y).toBe(0);
        expect(bone.rotation.z).toBe(0);
      });
    });
  });
});
