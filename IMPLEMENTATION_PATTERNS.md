# Quick Implementation Patterns for Noodle Racers

Based on production-ready analysis of SlashSaber, Sketchbook, and Video2Game.

---

## Pattern 1: Game State Singleton with Event System

```typescript
// src/game/GameState.ts
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export const GAME_EVENTS = {
    STARTED: 'game:started',
    PAUSED: 'game:paused',
    RESUMED: 'game:resumed',
    GAME_OVER: 'game:gameOver',
    SCORE_UPDATED: 'game:scoreUpdated',
    SPEED_CHANGED: 'game:speedChanged',
    OBSTACLE_HIT: 'game:obstacleHit',
    SETTINGS_CHANGED: 'game:settingsChanged'
} as const;

export class GameState {
    // Singleton
    private static instance: GameState;
    
    // Game state
    public speed: number = 0;
    public score: number = 0;
    public distance: number = 0;
    public lifes: number = 3;
    public isPaused: boolean = false;
    
    // Physics/Rendering
    private scene: THREE.Scene;
    private world: CANNON.World;
    private clock: THREE.Clock;
    
    // Execution pipeline
    private logicHandlers: Array<(delta: number) => void> = [];
    private eventListeners: Map<string, Set<Function>> = new Map();
    
    // Configuration
    private readonly fixedTimeStep = 1.0 / 60.0;
    private readonly maxSpeed = 10;
    private readonly maxLifes = 3;
    
    constructor() {
        this.scene = new THREE.Scene();
        this.world = new CANNON.World();
        this.clock = new THREE.Clock();
        
        // Physics setup
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.solver.iterations = 10;
        this.world.allowSleep = true;
    }
    
    public static getInstance(): GameState {
        if (!this.instance) {
            this.instance = new GameState();
        }
        return this.instance;
    }
    
    // ========== Game Flow ==========
    
    public start(): void {
        this.speed = 0;
        this.score = 0;
        this.distance = 0;
        this.lifes = this.maxLifes;
        this.isPaused = false;
        this.clock.start();
        
        this.emit(GAME_EVENTS.STARTED);
    }
    
    public pause(): void {
        this.isPaused = true;
        this.clock.running = false;
        this.emit(GAME_EVENTS.PAUSED);
    }
    
    public resume(): void {
        this.isPaused = false;
        this.clock.running = true;
        this.emit(GAME_EVENTS.RESUMED);
    }
    
    public reset(): void {
        this.speed = 0;
        this.score = 0;
        this.distance = 0;
        this.lifes = this.maxLifes;
    }
    
    public hitObstacle(): void {
        this.lifes--;
        this.emit(GAME_EVENTS.OBSTACLE_HIT);
        
        if (this.lifes <= 0) {
            this.emit(GAME_EVENTS.GAME_OVER);
        }
    }
    
    public addScore(points: number): void {
        this.score += points;
        this.emit(GAME_EVENTS.SCORE_UPDATED, { score: this.score });
    }
    
    // ========== Update Loop ==========
    
    public update(): void {
        if (this.isPaused) return;
        
        const delta = this.clock.getDelta();
        
        // Step physics with fixed timestep
        this.world.step(this.fixedTimeStep, delta, 3);
        
        // Run game logic handlers
        for (const handler of this.logicHandlers) {
            handler(delta);
        }
        
        // Update game metrics
        this.distance += this.speed * delta;
        
        // Smooth speed acceleration
        if (this.speed < this.maxSpeed) {
            const speedIncrease = delta * (this.maxSpeed - this.speed + 1);
            this.speed = Math.min(this.speed + speedIncrease, this.maxSpeed);
            this.emit(GAME_EVENTS.SPEED_CHANGED, { speed: this.speed });
        }
    }
    
    // ========== Handler Registration ==========
    
    public addLogicHandler(handler: (delta: number) => void): void {
        this.logicHandlers.push(handler);
    }
    
    public removeLogicHandler(handler: (delta: number) => void): void {
        const index = this.logicHandlers.indexOf(handler);
        if (index >= 0) {
            this.logicHandlers.splice(index, 1);
        }
    }
    
    // ========== Event System ==========
    
    public on(event: string, callback: Function): () => void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)!.add(callback);
        
        // Return unsubscribe function
        return () => {
            this.eventListeners.get(event)?.delete(callback);
        };
    }
    
    public once(event: string, callback: Function): void {
        const unsubscribe = this.on(event, (...args) => {
            callback(...args);
            unsubscribe();
        });
    }
    
    public off(event: string, callback: Function): void {
        this.eventListeners.get(event)?.delete(callback);
    }
    
    public emit(event: string, data?: any): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => callback(data));
        }
    }
    
    // ========== Scene/Physics Access ==========
    
    public getScene(): THREE.Scene {
        return this.scene;
    }
    
    public getPhysicsWorld(): CANNON.World {
        return this.world;
    }
    
    public addToScene(obj: THREE.Object3D): void {
        this.scene.add(obj);
    }
    
    public removeFromScene(obj: THREE.Object3D): void {
        this.scene.remove(obj);
    }
    
    public addToPhysics(body: CANNON.Body): void {
        this.world.addBody(body);
    }
    
    public removeFromPhysics(body: CANNON.Body): void {
        this.world.removeBody(body);
    }
}
```

---

## Pattern 2: Obstacle Manager with Fixed Pool

```typescript
// src/game/ObstacleManager.ts
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GameState, GAME_EVENTS } from './GameState';

export enum ObstaclePlacement {
    LEFT = 'LEFT',
    CENTER = 'CENTER',
    RIGHT = 'RIGHT'
}

export interface ObstacleTemplate {
    id: string;
    modelPath: string;
    placement: ObstaclePlacement;
    difficulty: number; // 1-5
}

export class Obstacle {
    public model: THREE.Object3D;
    public body: CANNON.Body | null = null;
    public placement: ObstaclePlacement;
    private despawnDistance: number = 3;
    
    constructor(model: THREE.Object3D, placement: ObstaclePlacement) {
        this.model = model.clone();
        this.placement = placement;
        
        // Position based on placement
        switch (placement) {
            case ObstaclePlacement.LEFT:
                this.model.position.x = -1.5;
                break;
            case ObstaclePlacement.RIGHT:
                this.model.position.x = 1.5;
                break;
            case ObstaclePlacement.CENTER:
                this.model.position.x = 0;
                break;
        }
    }
    
    public moveBy(distance: number): boolean {
        this.model.position.z += distance;
        
        // Return true if despawned
        if (this.model.position.z >= this.despawnDistance) {
            return true;
        }
        return false;
    }
    
    public getPosition(): THREE.Vector3 {
        return this.model.position.clone();
    }
    
    public cleanup(gameState: GameState): void {
        gameState.removeFromScene(this.model);
        if (this.body) {
            gameState.removeFromPhysics(this.body);
        }
    }
}

export class ObstacleManager {
    private static instance: ObstacleManager;
    
    private gameState: GameState;
    private obstacles: Obstacle[] = [];
    
    // Configuration
    private readonly maxObstacles = 15;
    private minSpawnDistance = 2.5;
    private maxSpawnDistance = 3.0;
    
    // Placement rotation
    private lastPlacement = ObstaclePlacement.LEFT;
    private placementCooldown: Map<ObstaclePlacement, number> = new Map([
        [ObstaclePlacement.LEFT, 0],
        [ObstaclePlacement.CENTER, 0],
        [ObstaclePlacement.RIGHT, 0]
    ]);
    
    // Templates
    private templates: ObstacleTemplate[] = [];
    private modelCache: Map<string, THREE.Object3D> = new Map();
    
    private constructor() {
        this.gameState = GameState.getInstance();
        this.gameState.addLogicHandler(this.update.bind(this));
        
        // Listen for game events
        this.gameState.on(GAME_EVENTS.GAME_OVER, () => this.reset());
    }
    
    public static getInstance(): ObstacleManager {
        if (!this.instance) {
            this.instance = new ObstacleManager();
        }
        return this.instance;
    }
    
    // ========== Lifecycle ==========
    
    public async loadTemplate(template: ObstacleTemplate): Promise<void> {
        this.templates.push(template);
        
        // Preload model
        const loader = new THREE.GLTFLoader();
        const gltf = await new Promise((resolve, reject) => {
            loader.load(template.modelPath, resolve, undefined, reject);
        });
        
        this.modelCache.set(template.id, gltf.scene);
    }
    
    private update = (delta: number): void => {
        // 1. Move existing obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            
            if (obstacle.moveBy(this.gameState.speed * delta)) {
                // Despawned
                obstacle.cleanup(this.gameState);
                this.obstacles.splice(i, 1);
            }
        }
        
        // 2. Spawn new obstacles to maintain pool
        while (this.obstacles.length < this.maxObstacles) {
            this.spawnObstacle();
        }
    }
    
    private spawnObstacle(): void {
        if (this.templates.length === 0) return;
        
        // Select template (could add rarity weighting)
        const template = this.templates[
            Math.floor(Math.random() * this.templates.length)
        ];
        
        // Select placement with rotation
        const placement = this.selectPlacement();
        
        // Calculate Z position
        const lastPosition = this.obstacles[this.obstacles.length - 1]
            ?.getPosition() ?? new THREE.Vector3(0, 0, -5);
        
        const distance = Math.random() * 
            (this.maxSpawnDistance - this.minSpawnDistance) + 
            this.minSpawnDistance;
        
        const spawnZ = lastPosition.z - distance;
        
        // Create obstacle
        const model = this.modelCache.get(template.id);
        if (!model) return;
        
        const obstacle = new Obstacle(model, placement);
        obstacle.model.position.z = spawnZ;
        
        // Add to scene
        this.gameState.addToScene(obstacle.model);
        
        // Optional: Create physics body
        // obstacle.body = this.createPhysicsBody(obstacle);
        // this.gameState.addToPhysics(obstacle.body);
        
        this.obstacles.push(obstacle);
    }
    
    private selectPlacement(): ObstaclePlacement {
        // Increment cooldown for all placements
        for (const [placement] of this.placementCooldown) {
            this.placementCooldown.set(
                placement,
                (this.placementCooldown.get(placement) ?? 0) + 1
            );
        }
        
        // Find placement with longest cooldown
        let bestPlacement = ObstaclePlacement.LEFT;
        let maxCooldown = -1;
        
        for (const [placement, cooldown] of this.placementCooldown) {
            if (cooldown > maxCooldown) {
                maxCooldown = cooldown;
                bestPlacement = placement;
            }
        }
        
        // Reset cooldown for selected placement
        this.placementCooldown.set(bestPlacement, 0);
        this.lastPlacement = bestPlacement;
        
        return bestPlacement;
    }
    
    public setDifficulty(difficulty: number): void {
        // difficulty: 0-1 (0 = easy, 1 = hard)
        
        // Adjust spawn distance
        const baseLow = 2.5;
        const baseHigh = 3.0;
        const hardLow = 1.8;
        const hardHigh = 2.3;
        
        this.minSpawnDistance = baseLow + (hardLow - baseLow) * difficulty;
        this.maxSpawnDistance = baseHigh + (hardHigh - baseHigh) * difficulty;
    }
    
    public reset(): void {
        for (const obstacle of this.obstacles) {
            obstacle.cleanup(this.gameState);
        }
        this.obstacles = [];
        
        // Reset cooldowns
        for (const placement of Object.values(ObstaclePlacement)) {
            this.placementCooldown.set(placement, 0);
        }
    }
    
    public getObstacles(): Obstacle[] {
        return [...this.obstacles];
    }
}
```

---

## Pattern 3: Physics Body Sync

```typescript
// src/game/PhysicsSync.ts
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Helper class to sync Cannon.Body state to Three.Mesh
 */
export class PhysicsSync {
    /**
     * Update Three.js position/rotation from Cannon.Body
     */
    public static syncBodyToMesh(
        body: CANNON.Body,
        mesh: THREE.Object3D
    ): void {
        // Position
        mesh.position.set(
            body.position.x,
            body.position.y,
            body.position.z
        );
        
        // Rotation
        mesh.quaternion.set(
            body.quaternion.x,
            body.quaternion.y,
            body.quaternion.z,
            body.quaternion.w
        );
    }
    
    /**
     * Update Cannon.Body position from Three.js
     */
    public static syncMeshToBody(
        mesh: THREE.Object3D,
        body: CANNON.Body
    ): void {
        body.position.set(
            mesh.position.x,
            mesh.position.y,
            mesh.position.z
        );
        
        body.quaternion.set(
            mesh.quaternion.x,
            mesh.quaternion.y,
            mesh.quaternion.z,
            mesh.quaternion.w
        );
    }
    
    /**
     * Batch sync for performance
     */
    public static syncBodies(
        bodies: Array<{ body: CANNON.Body; mesh: THREE.Object3D }>
    ): void {
        for (const { body, mesh } of bodies) {
            this.syncBodyToMesh(body, mesh);
        }
    }
}

// Usage:
// PhysicsSync.syncBodyToMesh(obstacle.body, obstacle.mesh);
```

---

## Pattern 4: Collider Abstraction

```typescript
// src/physics/Colliders.ts
import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export interface ColliderOptions {
    mass?: number;
    position?: THREE.Vector3;
    friction?: number;
    restitution?: number;
}

export class BoxCollider {
    public body: CANNON.Body;
    
    constructor(size: THREE.Vector3, options: ColliderOptions = {}) {
        const defaults = {
            mass: 0,
            position: new THREE.Vector3(),
            friction: 0.3,
            restitution: 0
        };
        
        const config = { ...defaults, ...options };
        
        const shape = new CANNON.Box(
            new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)
        );
        
        this.body = new CANNON.Body({
            mass: config.mass,
            shape,
            position: new CANNON.Vec3(
                config.position.x,
                config.position.y,
                config.position.z
            )
        });
        
        this.body.material = new CANNON.Material('box');
        this.body.material.friction = config.friction;
        this.body.material.restitution = config.restitution;
    }
}

export class SphereCollider {
    public body: CANNON.Body;
    
    constructor(radius: number, options: ColliderOptions = {}) {
        const defaults = {
            mass: 0,
            position: new THREE.Vector3(),
            friction: 0.3,
            restitution: 0.3
        };
        
        const config = { ...defaults, ...options };
        
        const shape = new CANNON.Sphere(radius);
        
        this.body = new CANNON.Body({
            mass: config.mass,
            shape,
            position: new CANNON.Vec3(
                config.position.x,
                config.position.y,
                config.position.z
            )
        });
        
        this.body.material = new CANNON.Material('sphere');
        this.body.material.friction = config.friction;
        this.body.material.restitution = config.restitution;
    }
}

export class CapsuleCollider {
    public body: CANNON.Body;
    
    constructor(
        radius: number,
        length: number,
        options: ColliderOptions = {}
    ) {
        const defaults = {
            mass: 1,
            position: new THREE.Vector3(),
            friction: 0.4,
            restitution: 0
        };
        
        const config = { ...defaults, ...options };
        
        // Capsule = Cylinder + Spheres at ends
        const shape = new CANNON.Cylinder(radius, radius, length, 8);
        
        this.body = new CANNON.Body({
            mass: config.mass,
            shape,
            position: new CANNON.Vec3(
                config.position.x,
                config.position.y,
                config.position.z
            )
        });
        
        this.body.material = new CANNON.Material('capsule');
        this.body.material.friction = config.friction;
        this.body.material.restitution = config.restitution;
    }
}

// Usage:
// const collider = new SphereCollider(0.5, { mass: 1 });
// gameState.addToPhysics(collider.body);
```

---

## Pattern 5: Renderer Setup

```typescript
// src/renderer/Renderer.ts
import * as THREE from 'three';

export class GameRenderer {
    public renderer: THREE.WebGLRenderer;
    public camera: THREE.PerspectiveCamera;
    
    constructor(canvas: HTMLCanvasElement) {
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            powerPreference: 'high-performance',
            antialias: true,
            depth: true
        });
        
        this.renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 1.5)
        );
        this.renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.setClearColor(0x000000);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 2, 5);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    public render(scene: THREE.Scene): void {
        this.renderer.render(scene, this.camera);
    }
    
    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
    }
}
```

---

## Pattern 6: Input Handler

```typescript
// src/input/InputHandler.ts
export class InputHandler {
    private keys: Map<string, boolean> = new Map();
    
    constructor() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    }
    
    private onKeyDown(event: KeyboardEvent): void {
        this.keys.set(event.key.toLowerCase(), true);
    }
    
    private onKeyUp(event: KeyboardEvent): void {
        this.keys.set(event.key.toLowerCase(), false);
    }
    
    private onMouseDown(event: MouseEvent): void {
        this.keys.set(`mouse${event.button}`, true);
    }
    
    private onMouseUp(event: MouseEvent): void {
        this.keys.set(`mouse${event.button}`, false);
    }
    
    public isPressed(key: string): boolean {
        return this.keys.get(key.toLowerCase()) ?? false;
    }
}

// Usage:
// const input = new InputHandler();
// if (input.isPressed('a')) { moveLeft(); }
```

---

## Integration Example

```typescript
// src/main.ts
import * as THREE from 'three';
import { GameState } from './game/GameState';
import { ObstacleManager } from './game/ObstacleManager';
import { GameRenderer } from './renderer/Renderer';
import { InputHandler } from './input/InputHandler';

async function main() {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    
    // Initialize systems
    const gameState = GameState.getInstance();
    const renderer = new GameRenderer(canvas);
    const obstacles = ObstacleManager.getInstance();
    const input = new InputHandler();
    
    // Load obstacles
    await obstacles.loadTemplate({
        id: 'obstacle-1',
        modelPath: '/models/obstacle1.gltf',
        placement: 'LEFT' as any,
        difficulty: 1
    });
    
    // Start game
    gameState.start();
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Update game state
        gameState.update();
        
        // Handle input
        if (input.isPressed('arrowleft')) {
            // Move player left
        }
        if (input.isPressed('arrowright')) {
            // Move player right
        }
        
        // Render
        renderer.render(gameState.getScene());
    }
    
    animate();
}

main().catch(console.error);
```

---

## Performance Checklist

- [ ] Use Cannon-es instead of Cannon.js
- [ ] Set `world.allowSleep = true`
- [ ] Use `SAPBroadphase` for broadphase
- [ ] Use simple colliders (Sphere, Box, Capsule)
- [ ] Avoid Trimesh for dynamic bodies
- [ ] Use fixed object pool for obstacles
- [ ] Sync physics-to-mesh only when needed
- [ ] Set pixel ratio cap (e.g., 1.5x max)
- [ ] Use fixed timestep for physics
- [ ] Batch remove obstacles (don't create garbage)
- [ ] Pre-load models and clone them
- [ ] Monitor draw calls with renderer stats

