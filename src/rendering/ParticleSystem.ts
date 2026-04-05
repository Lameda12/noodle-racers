/**
 * ParticleSystem - Visual particle effects
 *
 * Particle types:
 * - Collision burst (red sparks)
 * - Power-up sparkle (gold/colored)
 * - Milestone celebration (confetti)
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number; // 0-1 (1 = alive, 0 = dead)
  lifespan: number; // total lifespan in seconds
  color: THREE.Color;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  private maxParticles = 1000;

  constructor(scene: THREE.Scene) {
    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxParticles * 3);
    const colors = new Float32Array(this.maxParticles * 3);

    for (let i = 0; i < this.maxParticles; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create material
    this.material = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
    });

    // Create points mesh
    this.points = new THREE.Points(this.geometry, this.material);
    scene.add(this.points);

    console.log('✨ ParticleSystem initialized');
  }

  /**
   * Emit collision particles
   */
  emitCollision(position: THREE.Vector3, count: number = 10): void {
    for (let i = 0; i < count; i++) {
      const particle: Particle = {
        position: position.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 15,
          Math.random() * 10 + 5,
          (Math.random() - 0.5) * 15
        ),
        life: 1,
        lifespan: 0.5,
        color: new THREE.Color(0xff6b6b), // Red
      };

      this.particles.push(particle);
    }
  }

  /**
   * Emit power-up particles
   */
  emitPowerUp(position: THREE.Vector3, color: THREE.Color, count: number = 15): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 8 + Math.random() * 4;

      const particle: Particle = {
        position: position.clone(),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.random() * 8 + 2,
          Math.sin(angle) * speed
        ),
        life: 1,
        lifespan: 0.8,
        color: color.clone(),
      };

      this.particles.push(particle);
    }
  }

  /**
   * Emit milestone celebration (confetti)
   */
  emitMilestone(position: THREE.Vector3, count: number = 20): void {
    const colors = [0xff6b6b, 0xffd54f, 0x66bb6a, 0x42a5f5];

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];

      const particle: Particle = {
        position: position.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          Math.random() * 12 + 8,
          (Math.random() - 0.5) * 12
        ),
        life: 1,
        lifespan: 1.2,
        color: new THREE.Color(color),
      };

      this.particles.push(particle);
    }
  }

  /**
   * Update particles
   */
  update(deltaTime: number): void {
    const gravity = new THREE.Vector3(0, -9.81, 0);
    const positions = this.geometry.attributes.position.array as Float32Array;
    const colors = this.geometry.attributes.color.array as Float32Array;

    let activeCount = 0;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Update lifespan
      p.life -= deltaTime / p.lifespan;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        i--;
        continue;
      }

      // Apply gravity
      p.velocity.add(gravity.clone().multiplyScalar(deltaTime));

      // Update position
      p.position.add(p.velocity.clone().multiplyScalar(deltaTime));

      // Update geometry
      const idx = activeCount;
      positions[idx * 3] = p.position.x;
      positions[idx * 3 + 1] = p.position.y;
      positions[idx * 3 + 2] = p.position.z;

      // Update color with fade
      colors[idx * 3] = p.color.r * p.life;
      colors[idx * 3 + 1] = p.color.g * p.life;
      colors[idx * 3 + 2] = p.color.b * p.life;

      activeCount++;
    }

    // Update geometry
    this.geometry.setDrawRange(0, activeCount);
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  /**
   * Clear all particles
   */
  clear(): void {
    this.particles = [];
  }
}
