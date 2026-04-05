# 🍝 Noodle Racers

> A hilariously fun 3D physics-based endless runner where wobbly noodle characters race downhill in a chaotic battle for survival.

## 🎮 Play It Now

Coming soon! [Play in Browser](https://noodle-racers.vercel.app) • [Try on GitHub](https://github.com/Lameda12/noodle-racers)

## ✨ Features

- **🤪 Jiggling Physics** — Characters bounce, wobble, and wiggle realistically using Wiggle Bones animation
- **🏔️ Procedural Tracks** — Infinite downhill courses that get progressively harder
- **⚡ Real-time Physics** — Cannon.js engine creates unpredictable, hilarious moments
- **🎨 Colorful Chaos** — Procedurally generated noodle characters with unique personalities
- **📱 Browser-based** — Play instantly, no downloads or installations
- **🏆 Leaderboard** — Compete with friends (coming soon)

## 🎯 Game Mechanics

1. **Control** your wiggly noodle with arrow keys (← →)
2. **Avoid obstacles** and stay on the track
3. **Collect power-ups** for speed boosts and shields
4. **Race as far as you can** before a dramatic noodle demise
5. **Watch your noodle's hilarious jiggle physics** in slow-motion replays

```
Your noodle:    ~~~====~~~  (wiggles harder as you accelerate)
Obstacles:      ░░░ (boxes, barriers, spinning hazards)
Power-ups:      ⭐ (speed, shield, magnetism)
```

## 🛠️ Tech Stack

Built for speed and fun:

| Tech | Purpose |
|------|---------|
| **Three.js** | 3D rendering at 60 FPS |
| **Cannon-es** | Physics simulation (gravity, collisions, forces) |
| **Wiggle.js** | Soft-body bone animation for noodle jiggle |
| **Vite** | Lightning-fast dev server & bundler |
| **TypeScript** | Type-safe game logic |

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

## 📊 Development Phases

### Phase 1: MVP (Current)
- [x] Project scaffolding
- [ ] Basic endless runner gameplay
- [ ] Physics integration
- [ ] Simple obstacles
- [ ] Score tracking

### Phase 2: Animation
- [ ] Wiggle Bones integration
- [ ] Character jiggles realistically
- [ ] Movement-responsive animations
- [ ] Visual polish

### Phase 3: Advanced Track
- [ ] Procedural generation
- [ ] Difficulty scaling
- [ ] Multiple obstacle types
- [ ] Power-ups system

### Phase 4: Polish
- [ ] UI/menus
- [ ] Sound effects
- [ ] Mobile controls
- [ ] Performance optimization
- [ ] Leaderboard

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
