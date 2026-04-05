# GitHub Research: Three.js + Cannon.js Game Architecture

## Research Overview

Comprehensive analysis of 3 production-ready Three.js + Cannon.js game projects to extract battle-tested patterns for Noodle Racers implementation.

**Key Finding:** SlashSaber (honzaap/SlashSaber) is the closest match to Noodle Racers and should be your primary reference.

---

## Documentation Files

### 1. **RESEARCH_SUMMARY.txt** (Start Here)
Quick reference guide with key findings.
- Repository overview (stars, quality, best use)
- Architectural decisions explained
- Performance optimizations
- Next steps for implementation
- **Read first for high-level overview** (5-10 min read)

### 2. **ARCHITECTURE_RESEARCH.md** (Complete Reference)
Comprehensive technical analysis with code examples.
- Game loop patterns (fixed vs variable timestep)
- Physics integration approaches
- Character controller architecture
- Obstacle spawning system design
- Score/state management
- Memory management strategies
- Architectural comparison matrix
- Physics tuning parameters
- Testing recommendations
- **Reference for implementation details** (30 min read)

### 3. **IMPLEMENTATION_PATTERNS.md** (Copy-Paste Code)
Production-ready code patterns you can use directly.
- GameState singleton with event system
- ObstacleManager with fixed pool
- PhysicsSync helper functions
- Collider abstraction classes (Box, Sphere, Capsule)
- Renderer setup
- Input handler
- Integration example
- Performance checklist
- **Copy code directly into your project** (15 min read)

---

## Top 3 Repositories Analyzed

### 1. Sketchbook (swift502/Sketchbook)
**Stars:** 1,712 | **Forks:** 480 | **Last Updated:** Oct 2024
- **Type:** 3D physics playground with vehicles, characters
- **Best For:** Learning advanced physics integration
- **Link:** https://github.com/swift502/Sketchbook

Key Features:
- Variable timestep with time-scale support
- Spring-based character movement
- Ray-cast ground detection
- Extensive collider system

### 2. Video2Game (video2game/video2game)
**Stars:** 330 | **Forks:** 23 | **Last Updated:** Apr 2024
- **Type:** NeRF-based 3D environment
- **Best For:** Advanced physics and mesh integration
- **Link:** https://github.com/video2game/video2game

Key Features:
- Extended collider system
- Mesh simplification
- Character mesh physics
- Complex state management

### 3. SlashSaber (honzaap/SlashSaber) ⭐ **PRIMARY REFERENCE**
**Stars:** 66 | **Forks:** 11 | **Last Updated:** Sep 2023
- **Type:** Endless slashing game (identical pattern to Noodle Racers)
- **Best For:** Direct implementation reference
- **Link:** https://github.com/honzaap/SlashSaber

Key Features:
- Fixed timestep (60fps) physics
- Singleton GameState with events
- Fixed object pool (17 obstacles max)
- Distance-based spawning
- Placement rotation system
- Progressive difficulty
- Clean, focused code

---

## Critical Decisions Made

### Game Loop: Fixed Timestep ✓
```typescript
private readonly fixedTimeStep = 1.0 / 60.0;

update(delta: number) {
    this.world.step(this.fixedTimeStep, delta, 3);
    
    for(const handler of this.logicHandlers) {
        handler(delta);
    }
}
```
**Why:** Deterministic physics, prevents jitter, perfect for racing games.

### Physics Library: Cannon-es ✓
```typescript
import * as CANNON from "cannon-es";
```
**Why:** Modern ES modules, smaller bundle, better tree-shaking.

### State Management: Singleton + Events ✓
**GameState singleton contains:**
- Physics world (CANNON.World)
- Scene (THREE.Scene)
- Game metrics (speed, score, distance)
- Logic handlers registry
- Event system for decoupled communication

**Why:** Single source of truth, systems don't reference each other.

### Obstacle Spawning: Fixed Pool + Streaming ✓
**Pool Strategy:**
- Fixed count: 15 obstacles max
- Spawn when count < max
- Distance-based spacing (2.5-3.0 units)
- Automatic despawn

**Placement Rotation:**
- LEFT, CENTER, RIGHT placements
- Prevent repetition via cooldown tracking
- Select least-recently-used placement

**Why:** No garbage collection pauses, consistent performance.

---

## Implementation Readiness

### Ready to Copy:
- GameState singleton (IMPLEMENTATION_PATTERNS.md)
- ObstacleManager (IMPLEMENTATION_PATTERNS.md)
- Collider classes (IMPLEMENTATION_PATTERNS.md)
- Renderer setup (IMPLEMENTATION_PATTERNS.md)
- Input handler (IMPLEMENTATION_PATTERNS.md)

### Requires Customization:
- Player character controller (depends on game mechanics)
- Specific obstacle models/behaviors
- Scoring formula
- UI integration

### Estimated Implementation Time:
- MVP: 2-3 weeks
  - 1 week: Core game loop + basic obstacles
  - 1 week: Physics + collision detection
  - 1 week: UI, scoring, game states

---

## Key Patterns Extracted

### Physics Integration
- Manual sync: Physics body → Three.js mesh
- Allows game-specific transforms (obstacles move forward)
- Explicit control, easy to debug

### Character Control
- Spring-based movement (not direct physics)
- Ray-cast ground detection
- Predictable, responsive feel

### Object Management
- Pooling (avoid GC pauses)
- Explicit add/remove from scene AND physics
- Cleanup in proper order

### Difficulty Progression
- Natural scaling with speed
- Obstacle distance decreases in rush mode
- Score scales with speed

---

## Quick Start Checklist

- [ ] Read RESEARCH_SUMMARY.txt (5 min)
- [ ] Review SlashSaber repository structure (10 min)
- [ ] Copy GameState from IMPLEMENTATION_PATTERNS.md
- [ ] Copy ObstacleManager from IMPLEMENTATION_PATTERNS.md
- [ ] Copy Collider classes from IMPLEMENTATION_PATTERNS.md
- [ ] Set up physics world with recommended settings
- [ ] Create obstacle templates
- [ ] Implement main game loop
- [ ] Wire up input handler
- [ ] Test fixed timestep physics
- [ ] Implement scoring system
- [ ] Add game states (start, playing, paused, game-over)

---

## Performance Targets

Based on production implementations:

- **Physics FPS:** Fixed 60Hz
- **Render FPS:** 60fps target
- **Frame Budget:** 16ms (physics + logic + render)
- **Physics Iterations:** 10 (accuracy/speed tradeoff)
- **Obstacle Count:** Max 15-17 (fixed pool)
- **Pixel Ratio:** Cap at 1.5x device ratio
- **GC Pauses:** < 50ms (object pooling)

---

## Testing Strategy

### Unit Tests
- Physics world initialization
- Obstacle spawning logic
- Placement rotation algorithm
- Score calculations

### Integration Tests
- Game loop timing
- Physics step consistency
- Event dispatch and handling

### Performance Tests
- Frame timing
- Memory allocation
- Physics solver performance

---

## Troubleshooting Reference

### Physics Jittering
- Check fixed timestep implementation
- Verify Cannon.World.allowSleep = true
- Increase solver.iterations (up to 10)

### Objects Not Moving
- Verify add to scene AND physics
- Check manual sync is running
- Confirm body.mass != 0 (or mass = 0 for static)

### Memory Leaks
- Ensure remove from scene before physics
- Check object pooling is capped
- Use unsubscribe from events

### Low FPS
- Reduce obstacle count
- Simplify colliders (Sphere < Box < Trimesh)
- Check render pixel ratio cap
- Profile with DevTools

---

## Additional Resources

### Recommended Repositories
1. **SlashSaber** (Primary) - https://github.com/honzaap/SlashSaber
2. **Sketchbook** (Learning) - https://github.com/swift502/Sketchbook
3. **Video2Game** (Advanced) - https://github.com/video2game/video2game

### Official Documentation
- Three.js: https://threejs.org/docs/
- Cannon-es: https://www.npmjs.com/package/cannon-es
- Cannon.js: https://www.npmjs.com/package/cannon

### Related Skills to Develop
- WebGL fundamentals (Three.js rendering)
- Physics simulation (Cannon.js tuning)
- Game loop architecture
- State machine patterns
- Event-driven architecture

---

## Document Statistics

| Document | Lines | Focus |
|----------|-------|-------|
| RESEARCH_SUMMARY.txt | 331 | Quick reference, decisions |
| ARCHITECTURE_RESEARCH.md | 875 | Complete analysis, patterns |
| IMPLEMENTATION_PATTERNS.md | 818 | Copy-paste ready code |
| **Total** | **2,024** | **Comprehensive** |

---

## Next Steps

1. **Today:** Read RESEARCH_SUMMARY.txt
2. **Tomorrow:** Study SlashSaber repository structure
3. **This Week:** Copy GameState and ObstacleManager patterns
4. **Next Week:** Implement core game loop with physics
5. **Following Week:** Add obstacles, scoring, game states

---

**Created:** April 5, 2026  
**Last Updated:** April 5, 2026  
**Status:** Ready for Implementation
