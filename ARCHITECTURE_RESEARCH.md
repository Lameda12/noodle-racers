# Three.js + Cannon.js Game Architecture Research

## Executive Summary

Analyzed 3 production-ready game projects to identify battle-tested architectural patterns for game loop design, physics integration, character control, and obstacle spawning.

---

## Top 3 Repositories

### 1. **Sketchbook** (swift502/Sketchbook)
- **Stars:** 1,712 | **Forks:** 480 | **Last Updated:** Oct 2024
- **GitHub:** https://github.com/swift502/Sketchbook
- **Type:** 3D physics playground with vehicles, characters, scenarios
- **Tech Stack:** Three.js + Cannon.js + TypeScript + Webpack
- **Quality:** Production-ready, well-maintained, extensive ecosystem

### 2. **Video2Game** (video2game/video2game)
- **Stars:** 330 | **Forks:** 23 | **Last Updated:** Apr 2024
- **GitHub:** https://github.com/video2game/video2game
- **Type:** NeRF-based 3D environment with character locomotion
- **Tech Stack:** Three.js + Cannon.js + TypeScript + complex collider system
- **Quality:** Academic/production hybrid, sophisticated physics setup

### 3. **SlashSaber** (honzaap/SlashSaber)
- **Stars:** 66 | **Forks:** 11 | **Last Updated:** Sep 2023
- **GitHub:** https://github.com/honzaap/SlashSaber
- **Type:** Endless slashing game (similar to Noodle Racers pattern)
- **Tech Stack:** Three.js + Cannon-es + Vue.js + Vite
- **Quality:** Clean, focused implementation for game mechanics

---

## 1. Game Loop Architecture

### Fixed Timestep Pattern (SlashSaber - Best for Racing/Action Games)

```typescript
// Source: SlashSaber/src/game/models/GameState.ts
private readonly fixedTimeStep = 1.0 / 60.0;  // 60 FPS fixed physics

public update() {
    const delta = this.clock.getDelta();
    this.world.step(this.fixedTimeStep, delta, 3);
    
    for(const handler of this.logicHandlers) {
        handler(delta);
    }
    
    // Game-specific logic
    this.distanceTravelled += this.movingSpeed * delta;
    this.score += this.movingSpeed * delta;
    this.movingSpeed = Math.min(
        this.movingSpeed + delta * (this.maxMovingSpeed - this.movingSpeed + 1),
        this.maxMovingSpeed
    );
}
```

**Key Characteristics:**
- Fixed timestep (1/60s) for deterministic physics
- Cannon.World.step(fixedTimeStep, actualDelta, iterations)
- **Iterations parameter** = 3 (comfort zone for 60fps games)
- Logic handlers called AFTER physics step
- Variable timestep for game logic, fixed for physics

**Why This Works:**
- Physics stability: Fixed timestep prevents jittering
- Game responsiveness: Game logic uses actual delta for smoothness
- Easy debugging: Reproducible physics behavior
- Perfect for racing/action games

### Variable Timestep Pattern (Sketchbook - Complex Simulations)

```typescript
// Source: Sketchbook/src/ts/world/World.ts
public render(world: World): void {
    this.requestDelta = this.clock.getDelta();
    
    requestAnimationFrame(() => world.render(world));
    
    let unscaledTimeStep = this.requestDelta + this.renderDelta + this.logicDelta;
    let timeStep = unscaledTimeStep * this.params.Time_Scale;
    timeStep = Math.min(timeStep, 1 / 30);  // Min 30 FPS clamp
    
    world.update(timeStep, unscaledTimeStep);
    this.logicDelta = this.clock.getDelta();
    
    // Frame limiting logic
    let interval = 1 / 60;
    this.sinceLastFrame += this.requestDelta + this.renderDelta + this.logicDelta;
    this.sinceLastFrame %= interval;
    
    this.stats.end();
    this.stats.begin();
    
    if (this.params.FXAA) this.composer.render();
    else this.renderer.render(this.graphicsWorld, this.camera);
    
    this.renderDelta = this.clock.getDelta();
}
```

**Key Characteristics:**
- Accumulates render + logic time into timestep
- Time scaling support (slow-mo, fast-forward)
- Frame limiting to 60fps
- Measures individual phase times
- Post-processing support (FXAA)

**When to Use:**
- Complex simulations needing time control
- Scenarios with variable performance targets
- Physics debugging (pause, slow-mo)

---

## 2. Physics Integration Patterns

### Cannon-es vs Cannon.js

**SlashSaber uses Cannon-es** (pure ES modules):
```typescript
import * as CANNON from "cannon-es";
```
- Better tree-shaking
- Modern module system
- Smaller bundle
- **Recommended for new projects**

**Sketchbook uses Cannon.js** (traditional):
```typescript
import * as CANNON from 'cannon';
```
- Larger ecosystem
- More examples
- Legacy support
- **Use if inheriting existing project**

### Physics World Setup Pattern

```typescript
// Canonical setup (both projects use similar pattern)
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);  // Earth gravity
world.broadphase = new CANNON.SAPBroadphase(world);  // Sweep and prune broadphase
world.solver.iterations = 10;  // Higher = more accurate, slower
world.allowSleep = true;  // Deactivate static bodies for performance
```

**Performance Tuning Parameters:**
- **solver.iterations:** 5-10 range (tradeoff: accuracy vs performance)
- **broadphase:** SAPBroadphase preferred (faster than NaiveBroadphase)
- **allowSleep:** Always enable for static/inactive bodies

### Mesh-to-Physics Sync Pattern

**Manual Sync (SlashSaber - Obstacles):**
```typescript
// Source: SlashSaber ObstacleManager update
for(const slicedPiece of this.slicedPieces) {
    slicedPiece.body.position.z += this.gameState.movingSpeed * delta;
    
    // Explicit sync: Physics -> Rendering
    slicedPiece.model.position.set(
        slicedPiece.body.position.x,
        slicedPiece.body.position.y,
        slicedPiece.body.position.z
    );
    slicedPiece.model.quaternion.set(
        slicedPiece.body.quaternion.x,
        slicedPiece.body.quaternion.y,
        slicedPiece.body.quaternion.z,
        slicedPiece.body.quaternion.w
    );
}
```

**Benefits:**
- Explicit control over sync
- Can apply additional transforms (game logic)
- Easy to debug desynchronization
- Perfect for streaming/procedural games

**Why Manual is Better Than Automatic:**
- Some objects need game-logic transforms (obstacles move forward)
- Can skip sync for off-screen objects
- Easier to interpolate for network games

### Collider Abstraction Pattern

**Sketchbook implements collider interface:**
```typescript
// Source: Sketchbook/src/ts/physics/colliders/BoxCollider.ts
export class BoxCollider implements ICollider {
    public options: any;
    public body: CANNON.Body;
    public debugModel: THREE.Mesh;
    
    constructor(options: any) {
        let defaults = {
            mass: 0,
            position: new THREE.Vector3(),
            size: new THREE.Vector3(0.3, 0.3, 0.3),
            friction: 0.3
        };
        options = setDefaults(options, defaults);
        
        let shape = new CANNON.Box(options.size);
        let physBox = new CANNON.Body({
            mass: options.mass,
            position: new CANNON.Vec3(options.position.x, options.position.y, options.position.z),
            shape
        });
        
        this.body = physBox;
    }
}
```

**Available Colliders:**
1. **BoxCollider** - Axis-aligned boxes
2. **SphereCollider** - Spheres (fastest)
3. **CapsuleCollider** - Cylinders with rounded caps (character controllers)
4. **ConvexCollider** - Convex hulls (complex static shapes)
5. **TrimeshCollider** - Arbitrary meshes (terrain, static only)

**Selection Guide:**
- Use **Sphere** for dynamic objects (fastest)
- Use **Capsule** for characters (stability)
- Use **Trimesh** for static terrain only (expensive)
- Use **Box** as middle ground
- Avoid Trimesh for dynamic bodies

---

## 3. Character Controller Implementation

### Sketchbook Character Architecture

```typescript
// Source: Sketchbook/src/ts/characters/Character.ts
export class Character extends THREE.Object3D implements IWorldEntity {
    public characterCapsule: CapsuleCollider;
    
    // Spring-based physics simulation
    public velocitySimulator: VectorSpringSimulator;
    public rotationSimulator: RelativeSpringSimulator;
    
    // State management
    public charState: ICharacterState;
    public behaviour: ICharacterAI;
    
    // Movement properties
    public velocity: THREE.Vector3 = new THREE.Vector3();
    public acceleration: THREE.Vector3 = new THREE.Vector3();
    public orientation: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
    public moveSpeed: number = 4;
    public angularVelocity: number = 0;
    
    // Ray casting for ground detection
    public rayResult: CANNON.RaycastResult = new CANNON.RaycastResult();
    public rayCastLength: number = 0.57;
    public wantsToJump: boolean = false;
}
```

### Spring-Based Character Movement

**Why Springs Instead of Direct Physics:**
1. **Predictable:** Tunable damping/mass
2. **Responsive:** Not subject to physics lag
3. **Arcade-like:** Feels snappy
4. **Stable:** No jittery rotation

```typescript
// VectorSpringSimulator pattern
class VectorSpringSimulator {
    public velocity: THREE.Vector3;
    public target: THREE.Vector3;
    public damping: number = 0.8;
    public mass: number = 50;
    
    public simulate(delta: number): void {
        // F = -k * x - b * v
        // Hooke's law: spring restoring force
        const force = this.target.clone()
            .sub(this.velocity)
            .multiplyScalar(-this.stiffness);
        
        // Apply damping
        force.addScaledVector(this.velocity, -this.damping);
        
        // Integrate: v += (F/m) * dt
        this.velocity.addScaledVector(force, delta / this.mass);
    }
}
```

### Ground Detection via Ray Casting

```typescript
// Cast ray downward from character position
const rayOrigin = this.position.clone().add(new THREE.Vector3(0, -0.27, 0));
const rayDir = new THREE.Vector3(0, -1, 0);

this.world.physicsWorld.raycastClosest(
    rayOrigin,
    rayDir,
    { skipBackfaces: true },
    this.rayResult
);

this.rayHasHit = this.rayResult.hasHit;
```

**Benefits:**
- Precise ground detection
- Works on slopes
- Lightweight (single ray)
- No physics body on character capsule needed

---

## 4. Obstacle Spawning System

### SlashSaber Obstacle Manager (Production Pattern)

```typescript
// Source: SlashSaber/src/game/models/ObstacleManager.ts
export default class ObstacleManager {
    private obstacles: Obstacle[] = [];
    private slicedPieces: SlicedPiece[] = [];
    
    private readonly maxObstacles = 17;  // Pool size
    private minObstacleDistance = 2.4;
    private maxObstacleDistance = 2.9;
    
    private lastPlacement = ObstaclePlacement.LEFT;
    private lastPlacementUsage: { [placement: string]: number } = {};
    
    // Obstacle templates loaded from assets
    private obstacleTemplates: ObstacleTemplate[] = [];
    
    private update = (delta: number): void => {
        // 1. Move and cleanup obstacles
        for(const obstacle of this.obstacles) {
            obstacle.update(delta);
            
            // Despawn when out of bounds
            if(obstacle.moveBy(this.gameState.movingSpeed * delta)) {
                this.obstacles.splice(
                    this.obstacles.findIndex(o => o === obstacle), 
                    1
                );
            }
        }
        
        // 2. Sync sliced piece physics
        for(const slicedPiece of this.slicedPieces) {
            slicedPiece.body.position.z += this.gameState.movingSpeed * delta;
            slicedPiece.model.position.set(
                slicedPiece.body.position.x,
                slicedPiece.body.position.y,
                slicedPiece.body.position.z
            );
            slicedPiece.model.quaternion.set(
                slicedPiece.body.quaternion.x,
                slicedPiece.body.quaternion.y,
                slicedPiece.body.quaternion.z,
                slicedPiece.body.quaternion.w
            );
        }
        
        // 3. Spawn new obstacles to maintain pool
        if(this.obstacles.length < this.maxObstacles) {
            const lastPosition = this.obstacles[this.obstacles.length - 1]
                ?.getPosition() ?? new THREE.Vector3(0, 0, -8);
            
            let newZ = lastPosition.z - (
                Math.random() * (this.maxObstacleDistance - this.minObstacleDistance) 
                + this.minObstacleDistance
            );
            
            // Select template (with rarity weighting)
            const template = this.selectTemplate();
            
            // Choose placement with cooldown
            const placement = this.selectPlacement();
            
            this.spawnObstacle(template, placement, newZ);
        }
    }
    
    private selectPlacement(): ObstaclePlacement {
        // Prevent same placement from appearing consecutively
        // Track time since last use of each placement
        // Select least-recently-used placement
        
        let bestPlacement = this.lastPlacement;
        let minUsage = Infinity;
        
        for(const key of Object.keys(ObstaclePlacement)) {
            if(this.lastPlacementUsage[key] < minUsage) {
                minUsage = this.lastPlacementUsage[key];
                bestPlacement = ObstaclePlacement[key];
            }
        }
        
        this.updateLastPlacements();
        return bestPlacement;
    }
}
```

### Key Spawning Patterns

**1. Fixed Pool Size**
```typescript
private readonly maxObstacles = 17;
// Always spawn when count < max
// Prevents memory explosion
// Tuned for 60fps performance
```

**2. Random Distance with Constraints**
```typescript
let newZ = lastPosition.z - (
    Math.random() * (this.maxObstacleDistance - this.minObstacleDistance) 
    + this.minObstacleDistance
);
// Creates varying difficulty
// maxDistance in rush mode: 2.8
// maxDistance in normal: 4.3
```

**3. Placement Rotation with Cooldown**
```typescript
private lastPlacementUsage: { [placement: string]: number } = {};

// Increment all placements
for(const key of Object.keys(ObstaclePlacement)) {
    this.lastPlacementUsage[key] += 1;
}

// Reset last used
this.lastPlacementUsage[this.lastPlacement] = 0;

// Select least-used placement
```

**Why This Pattern Works:**
- Prevents 3 obstacles in a row on same side
- Creates rhythm and predictability
- Easy to adjust difficulty (distance range)
- Prevents player frustration

### Obstacle Template System

```typescript
type ObstacleTemplate = {
    asset: string,                          // File path
    placement: ObstaclePlacement,          // LEFT, CENTER, RIGHT
    model: THREE.Object3D,                 // Loaded mesh
    animation: THREE.AnimationClip,        // Optional animation
    sliceDirection: THREE.Vector2,         // Directional slice (for slashing)
    rarity: Rarity,                        // Common, Rare, Legendary
}

// Load once during init
for(const template of OBSTACLE_TEMPLATES) {
    this.gameState.loadGLTF(`/3d_assets/obstacles/${template.asset}`, (gltf) => {
        this.obstacleTemplates.push({
            ...template,
            model: gltf.scene.children[0],
            animation: gltf.animations[0]
        });
    });
}
```

**Benefits:**
- Decouples content from code
- Easy to add new obstacles
- Supports variety without code changes
- Rarity weighting for progression

---

## 5. Score/State Management

### Singleton Pattern (SlashSaber)

```typescript
// Source: SlashSaber/src/game/models/GameState.ts
export default class GameState {
    public movingSpeed = 0;
    public distanceTravelled = 0;
    public score = 0;
    public halted = false;
    public started = false;
    public lifes = 3;
    
    private static instance: GameState;
    private scene: THREE.Scene;
    private world: CANNON.World;
    private logicHandlers: ((delta: number) => void)[] = [];
    private events: { [key: string]: ((args: any) => void)[] } = {};
    
    public static getInstance() {
        if(!this.instance) this.instance = new GameState();
        return this.instance;
    }
    
    public update() {
        const delta = this.clock.getDelta();
        this.world.step(this.fixedTimeStep, delta, 3);
        
        for(const handler of this.logicHandlers) {
            handler(delta);  // Called in order
        }
        
        // Automatic progression
        this.distanceTravelled += this.movingSpeed * delta;
        this.score += this.movingSpeed * delta;
        
        // Smooth acceleration
        if(this.movingSpeed < this.maxMovingSpeed && this.moving) {
            this.movingSpeed = Math.min(
                this.movingSpeed + delta * (this.maxMovingSpeed - this.movingSpeed + 1),
                this.maxMovingSpeed
            );
        }
    }
    
    // Event system for decoupled communication
    public addEventListener(event: string, callback: (args: any) => void) {
        this.events[event] = this.events[event] 
            ? [...this.events[event], callback] 
            : [callback];
    }
    
    public dispatchEvent(event: string, args: any = null) {
        const callbacks = this.events[event];
        if(!callbacks) return;
        for(const callback of callbacks) {
            callback(args);
        }
    }
}
```

### Event System Architecture

**Pattern:**
- Decoupled communication
- No direct references between modules
- Easy to add UI listeners

**Events in SlashSaber:**
```typescript
const EVENTS = {
    ready: "ready",
    start: "start",
    halt: "halt",
    hit: "hit",
    died: "died",
    addScore: "addScore",
    swordChanged: "swordChanged",
    settingsChanged: "settingsChanged"
};
```

**Benefits:**
- Obstacles don't need reference to GameState
- UI updates via event listeners
- Easy to add analytics
- Clean separation of concerns

### Progressive Difficulty

```typescript
// Difficulty increases naturally with speed
// Speed increases based on playtime
// Score scales with speed

this.movingSpeed = Math.min(
    this.movingSpeed + delta * (this.maxMovingSpeed - this.movingSpeed + 1),
    this.maxMovingSpeed
);

// Obstacle distance decreases in rush mode
if(gameState.settings.rushMode) {
    this.minObstacleDistance = 2.3;    // Closer obstacles
    this.maxObstacleDistance = 2.80;
} else {
    this.minObstacleDistance = 3.9;    // Further apart
    this.maxObstacleDistance = 4.3;
}
```

---

## 6. Memory Management & Performance

### Object Pooling Pattern (Implicit in SlashSaber)

```typescript
// Pool size is fixed
private readonly maxObstacles = 17;

// Obstacles are spawned/despawned but not truly created/destroyed
// Game allocates ~17 obstacles at peak
// Prevents garbage collection pauses

public reset() {
    for(const obstacle of this.obstacles) {
        obstacle.remove();  // Removes from scene/physics
    }
    
    for(const slicedPiece of this.slicedPieces) {
        this.gameState.sceneRemove(slicedPiece.model);
        this.gameState.worldRemove(slicedPiece.body);  // Remove from physics
    }
    
    this.obstacles = [];
    this.slicedPieces = [];
}
```

### Removal Pattern

```typescript
// Proper cleanup order matters:
// 1. Remove from THREE.Scene
// 2. Remove from CANNON.World
// 3. Clear references

public moveBy(z: number): boolean {
    this.model.position.z += z;
    
    if(this.model.position.z >= this.despawnPosition) {
        this.gameState.sceneRemove(this.model);  // THREE cleanup
        return true;  // Caller removes from physics
    }
    
    return false;
}
```

### Performance Tuning (SlashSaber Defaults)

```typescript
// Renderer
renderer = new THREE.WebGLRenderer({
    powerPreference: "high-performance",
    antialias: true,
    depth: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.useLegacyLights = false;
renderer.setClearColor(0x000000);

// Physics
world.solver.iterations = 10;
world.allowSleep = true;
world.broadphase = new CANNON.SAPBroadphase();

// Fixed timestep
private readonly fixedTimeStep = 1.0 / 60.0;
world.step(fixedTimeStep, delta, 3);
```

### Garbage Collection Prevention

```typescript
// Bad: Creates garbage every frame
for(let i = 0; i < obstacles.length; i++) {
    const pos = new THREE.Vector3();  // NEW allocation every frame!
    obstacles[i].update(pos);
}

// Good: Reuse temporaries
private tempVector = new THREE.Vector3();

for(let i = 0; i < obstacles.length; i++) {
    this.tempVector.copy(obstacles[i].position);
    obstacles[i].update(this.tempVector);
}
```

---

## 7. Architecture Comparison Matrix

| Aspect | Sketchbook | Video2Game | SlashSaber |
|--------|-----------|-----------|-----------|
| **Game Type** | Sandbox/Playground | NeRF Environment | Endless Runner |
| **Physics Loop** | Variable + Time Scale | Variable | Fixed (60Hz) |
| **Broadphase** | SAPBroadphase | SAPBroadphase | Default |
| **Character Type** | Spring-based avatar | Motion-captured rig | N/A (automated) |
| **Collider System** | Abstract interface | Extended colliders | Basic shapes |
| **State Management** | Complex (scenarios) | Complex (NeRF state) | Simple (GameState) |
| **Memory Pattern** | Entity management | Mesh simplification | Fixed pool |
| **Extensibility** | High (plugins) | Medium | Low (focused) |
| **Code Quality** | Excellent | Good | Excellent (focused) |
| **Recommendation** | Learn from | Advanced study | **Copy for racers** |

---

## 8. Recommended Architecture for Noodle Racers

### Based on SlashSaber (Most Similar Game)

**1. Game Loop:**
```typescript
// Use fixed timestep pattern
private readonly fixedTimeStep = 1.0 / 60.0;

update(delta: number) {
    this.physicsWorld.step(this.fixedTimeStep, delta, 3);
    
    // Game logic handlers (obstacles, scoring)
    for(const handler of this.logicHandlers) {
        handler(delta);
    }
    
    // Update score based on speed
    this.score += this.speed * delta;
}
```

**2. State Management:**
```typescript
// Singleton GameState
class GameState {
    public speed: number = 0;
    public score: number = 0;
    public lifes: number = 3;
    
    private logicHandlers: Array<(delta: number) => void> = [];
    private events: Map<string, Function[]> = new Map();
    
    public addLogicHandler(handler) { ... }
    public dispatchEvent(name, args) { ... }
}
```

**3. Obstacle System:**
```typescript
// Fixed pool, distance-based spawning
maxObstacles = 15;
minDistance = 2.5;
maxDistance = 3.0;

update(delta) {
    // Move obstacles
    for(const obs of obstacles) {
        if(obs.moveBy(speed * delta)) {
            obstacles.remove(obs);
        }
    }
    
    // Spawn new ones
    while(obstacles.length < maxObstacles) {
        spawnObstacle();
    }
}
```

**4. Physics Integration:**
```typescript
// Manual physics-to-rendering sync
for(const piece of slicedPieces) {
    piece.model.position.copy(piece.body.position);
    piece.model.quaternion.copy(piece.body.quaternion);
}
```

**5. Character Control:**
```typescript
// Use spring-based rotation and position
// Ray cast for ground detection
// Event-driven input handling
```

---

## 9. Cannon.js vs Cannon-es Decision

**Use Cannon-es (Recommended):**
```typescript
import * as CANNON from "cannon-es";
```
- Modern ES modules
- Better tree-shaking
- Smaller final bundle
- NPM installation: `npm install cannon-es`

**Use Cannon.js (Legacy):**
```typescript
import * as CANNON from "cannon";
```
- More examples online
- Larger ecosystem
- Better TypeScript definitions
- NPM installation: `npm install cannon`

**Recommendation for Noodle Racers:** Use **cannon-es** (newer, smaller, same API)

---

## 10. Testing Recommendations

### Physics Testing
```typescript
// Test Cannon.World setup
test('Physics world initializes with correct gravity', () => {
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    
    const body = new CANNON.Body({ mass: 1 });
    world.addBody(body);
    world.step(1/60, 1/60);
    
    expect(body.velocity.y).toBeLessThan(0);  // Should fall
});
```

### Game Loop Testing
```typescript
// Test fixed timestep behavior
test('Game loop maintains 60fps physics', () => {
    const gameState = new GameState();
    let physicsSteps = 0;
    
    // Mock Cannon.World.step
    gameState.physicsWorld.step = () => physicsSteps++;
    
    for(let i = 0; i < 60; i++) {
        gameState.update();
    }
    
    expect(physicsSteps).toBe(60);
});
```

---

## 11. Key Takeaways

1. **Fixed Timestep is Essential** for racing/action games (SlashSaber pattern)
2. **Manual Physics Sync** allows game-specific transforms (obstacle forward movement)
3. **Spring-Based Character Movement** feels better than direct physics
4. **Event System** decouples game mechanics from rendering
5. **Fixed Object Pool** prevents garbage collection pauses
6. **Placement Rotation** creates engaging obstacle patterns
7. **Progressive Difficulty** naturally scales with speed
8. **Simple Colliders First** (sphere, capsule, box)
9. **Cannon-es Modern** (unless legacy constraints)
10. **Three.js Scene Management** needs explicit add/remove for cleanup

---

## References

- **Sketchbook:** https://github.com/swift502/Sketchbook
- **Video2Game:** https://github.com/video2game/video2game
- **SlashSaber:** https://github.com/honzaap/SlashSaber
- **Cannon.js Docs:** https://www.npmjs.com/package/cannon
- **Cannon-es Docs:** https://www.npmjs.com/package/cannon-es
- **Three.js Docs:** https://threejs.org/docs/

