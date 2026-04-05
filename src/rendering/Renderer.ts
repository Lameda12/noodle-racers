/**
 * Renderer - Three.js scene setup and rendering
 *
 * Manages:
 * - THREE.Scene initialization
 * - WebGLRenderer setup
 * - Camera and lighting
 * - Render loop
 */

import * as THREE from 'three';

export class Renderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;

  constructor() {
    // Get or create canvas
    let canvas = document.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      document.getElementById('root')?.appendChild(canvas);
    }
    this.canvas = canvas;

    // Setup scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 100, 500);

    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 8, 15);
    this.camera.lookAt(0, 0, 0);

    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    // Setup lighting
    this.setupLighting();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    console.log('🎨 Renderer initialized');
  }

  /**
   * Setup scene lighting
   */
  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(50, 50, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    this.scene.add(sunLight);
  }

  /**
   * Add object to scene
   */
  addObject(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  /**
   * Remove object from scene
   */
  removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  /**
   * Update camera position (follow character)
   */
  updateCamera(characterPos: THREE.Vector3): void {
    // Third-person follow camera
    const cameraOffset = new THREE.Vector3(0, 5, 12);
    const targetPos = characterPos.clone().add(cameraOffset);

    this.camera.position.lerp(targetPos, 0.1); // Smooth follow
    this.camera.lookAt(characterPos.x, characterPos.y + 2, characterPos.z);
  }

  /**
   * Render the scene
   */
  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Get scene
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get camera
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Handle window resize
   */
  private onWindowResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  /**
   * Get renderer
   */
  getWebGLRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }
}
