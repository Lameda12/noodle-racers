# 🍝 Noodle Racers

> A hilariously fun 3D physics-based endless runner where wobbly noodle characters race downhill in a chaotic battle for survival.

## 🎮 Play It Now

Coming soon! [Play in Browser](https://noodle-racers.vercel.app) • [Try on GitHub](https://github.com/Lameda12/noodle-racers)

## ✨ Features

- **🤪 Jiggling Physics** — Characters bounce, wobble, and wiggle realistically using spring-based bone deformation
- **🏔️ Procedural Tracks** — Infinite downhill courses with curves, slopes, and progressive difficulty
- **⚡ Real-time Physics** — Cannon.js engine with fixed-timestep physics (60 FPS stable)
- **🎨 Colorful Chaos** — Procedurally generated noodle characters with dynamic colors
- **💪 Multiple Obstacles** — Box obstacles, spinning obstacles, moving hazards, spiked dangers
- **✨ Power-ups** — Speed boost, shield, magnet to change your strategy
- **📈 Difficulty Scaling** — Game gets harder over time with unlockable obstacle types
- **📱 Browser-based** — Play instantly, no downloads. Keyboard + touch mobile support
- **🏆 Leaderboard** — Local high scores (localStorage)

## 🎯 Game Mechanics

### Controls
- **Arrow Keys** (or A/D) — Move left/right
- **Touch** (mobile) — Tap left/right side of screen

### Gameplay
1. **Move** your wobbly noodle left/right to dodge obstacles
2. **Collect** power-ups (⭐) to gain temporary advantages
3. **Survive** progressively harder difficulty tiers
4. **Race** as far as possible for high scores

### Difficulty Progression

| Distance | Difficulty | Features |
|----------|-----------|----------|
| 0m | 1.0 ⭐ | Gentle slopes, basic box obstacles |
| 2,500m | 1.5 ⭐⭐ | Spinning obstacles unlock |
| 5,000m | 2.0 ⭐⭐⭐ | Moving hazards spawn, steeper slopes |
| 7,500m | 2.5 ⭐⭐⭐⭐ | Spiked obstacles added, complex curves |
| 10,000m | 3.0 ⭐⭐⭐⭐⭐ | Max difficulty, all types |

### Power-ups
- 🔴 **Speed Boost** — +50% movement speed (5s)
- 🟢 **Shield** — Immunity to next collision (5s)
- 🔵 **Magnet** — Auto-collect nearby power-ups (5s)

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Three.js** | 3D rendering, camera, lighting |
| **Cannon-es** | Fixed-timestep physics (60 FPS), collision detection |
| **Custom Spring System** | Bone deformation for jiggly animation |
| **Vite** | Dev server with HMR, production bundling |
| **TypeScript** | 100% type-safe, strict mode |
| **Vitest** | Unit testing framework |
| **Playwright** | E2E testing (coming Phase 4) |

### Performance
- **60 FPS** fixed-timestep physics loop
- **Object pooling** for zero garbage collection pauses
- **Frustum culling** for off-screen obstacle skipping
- **Procedural generation** with seeded randomness
- **~570KB** gzipped bundle size

## 🚀 Quick Start

```bash
# Clone & install
git clone https://github.com/Lameda12/noodle-racers.git
cd noodle-racers
npm install

# Start dev server (auto-opens browser)
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

Your game runs at `http://localhost:5173` with hot module reloading.

## 📊 Development Progress

### ✅ Phase 1: MVP (Complete)
- [x] Project scaffolding (Vite + TypeScript)
- [x] Core game loop (60 FPS fixed-timestep)
- [x] Physics integration (Cannon.js)
- [x] Player character with movement
- [x] Basic box obstacles
- [x] Score tracking (distance-based)
- [x] Collision detection
- [x] Game over system

### ✅ Phase 2: Animation (Complete)
- [x] Spring-based bone deformation system
- [x] Velocity-responsive jiggle
- [x] Idle oscillation animation
- [x] Progressive bone influence
- [x] Mesh vertex deformation
- [x] Configuration tuning (stiffness/damping)

### ✅ Phase 3: Procedural Track & Difficulty (Complete)
- [x] Procedural track generation (curves, slopes)
- [x] Seeded random for reproducibility
- [x] Difficulty scaling system (1.0 → 3.0)
- [x] Power-up system (speed, shield, magnet)
- [x] Object pooling (obstacles, power-ups)
- [x] Dynamic obstacle density
- [x] Unlockable obstacle types per difficulty tier

### 🚀 Phase 4: Polish & Deployment (Next)
- [ ] Sound effects & background music
- [ ] Visual particle effects
- [ ] UI polish (menus, HUD)
- [ ] Mobile responsiveness
- [ ] Local leaderboard (localStorage)
- [ ] Performance optimization
- [ ] Deploy to Vercel

## 🧪 Testing

```bash
# Unit tests (game logic, physics, generation)
npm run test

# Test UI dashboard
npm run test:ui

# E2E tests (full gameplay)
npm run test:e2e
```

Target: **80%+ code coverage**

## 📁 Project Structure

```
src/
├── core/              # Game loop & state management
├── physics/           # Cannon.js integration
├── rendering/         # Three.js scene & camera
├── character/         # Noodle mesh, bones, animation
├── track/             # Procedural generation & difficulty
├── hazards/           # Obstacles & power-ups
├── ui/                # Menus, HUD, score
└── utils/             # Math, collision, helpers
```

## 🎨 Design Philosophy

**Funny First** — Every mechanic should make players laugh. Physics glitches are features, not bugs.

**Accessible** — No install required, works on any modern browser. Controls are intuitive.

**Optimized** — 60 FPS on mid-range hardware. Object pooling, culling, and efficient physics.

**Educational** — Learn 3D game dev from a complete, production-ready codebase.

## 🤝 Contributing

This is an active learning project. Contributions welcome!

- Found a bug? [Open an issue](https://github.com/Lameda12/noodle-racers/issues)
- Have ideas? [Start a discussion](https://github.com/Lameda12/noodle-racers/discussions)
- Want to code? [Send a PR](https://github.com/Lameda12/noodle-racers/pulls)

## 📄 License

MIT — Free for personal & commercial use.

## 🙏 Credits

Built with [Three.js](https://threejs.org/), [Cannon.js](https://schteppe.github.io/cannon.js/), and [Wiggle Bones](https://wiggle.three.tools/).

Inspired by: Subway Surfers, Dune: Spice Wars, and the eternal chaos of physics simulations.

---

**Made with ❤️ and way too much noodle pasta** 🍝

[Play Now](https://noodle-racers.vercel.app) • [Watch Demo](https://twitter.com/search?q=noodleracers) • [Join Discord](https://discord.gg/noodleracers)
