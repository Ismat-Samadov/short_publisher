# 🪓 Timberman — Chop the Tree!

A fast-paced browser arcade game inspired by the classic Timberman mobile game. Chop the tree left and right as fast as you can — but dodge the branches or it's game over!

---

## ✨ Features

- **Core gameplay** — Tap left/right to chop, dodge incoming branches, build your score
- **Timer mechanic** — Each chop adds time; let it run out and it's game over
- **3 Difficulty levels** — Easy 🌲 / Medium 🪓 / Hard 💀 with different branch density, timer speed, and time-per-chop
- **High score persistence** — Best score saved to `localStorage`
- **Sound effects** — Web Audio API synthesised sounds (chop thud, death crash, game start)
- **Sound toggle** — Mute / unmute at any time
- **Animated UI** — Tree shake, score pop, player chop animation, death animation, timer colour shift (green → amber → red)
- **Game Over screen** — Score, best score, "NEW BEST!" celebration, restart / menu buttons
- **Fully responsive** — Mobile-first; works on phones, tablets, and desktops
- **Touch controls** — On-screen "Chop Left" / "Chop Right" buttons for mobile
- **Keyboard controls** — `A` / `←` for left, `D` / `→` for right on desktop
- **Themed favicon** — Custom SVG axe + tree icon
- **Vercel ready** — Zero-config deployment

---

## 🎮 Controls

| Action | Keyboard | Mobile |
|---|---|---|
| Chop Left | `A` or `←` | Tap **Chop Left** button |
| Chop Right | `D` or `→` | Tap **Chop Right** button |

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Animations | CSS keyframes + Framer Motion |
| Sound | Web Audio API (no audio files) |
| State | React hooks (useState, useEffect, useCallback, useRef) |
| Persistence | localStorage |
| Deployment | Vercel |

---

## 📁 Project Structure

```
timberman/
├── app/
│   ├── layout.tsx          # Root layout + metadata
│   ├── page.tsx            # Entry point → renders <Game />
│   └── globals.css         # Global styles + CSS keyframe animations
├── components/
│   ├── Game.tsx            # Main orchestrator — wires all hooks + components
│   ├── TreeSection.tsx     # Tree trunk, branches, player character rendering
│   ├── HUD.tsx             # Score, best score, timer bar
│   ├── StartScreen.tsx     # Main menu with difficulty picker
│   ├── GameOver.tsx        # Animated game-over overlay
│   └── MobileControls.tsx  # Touch-friendly chop buttons
├── hooks/
│   ├── useGame.ts          # Core game loop, segment generation, chop logic
│   ├── useHighScore.ts     # localStorage high score management
│   ├── useKeyboard.ts      # Keyboard input binding
│   └── useSound.ts         # Web Audio API sound synthesis
├── lib/
│   ├── types.ts            # Shared TypeScript types
│   ├── constants.ts        # Difficulty config, game tuning values
│   └── utils.ts            # Segment generation, color helpers, formatters
└── public/
    └── favicon.svg         # Custom axe + tree SVG favicon
```

---

## 🚀 Run Locally

**Prerequisites:** Node.js 18+

```bash
# Clone / enter the project
cd timberman

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deploy to Vercel

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option B — GitHub + Vercel Dashboard

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repository
4. Vercel auto-detects Next.js — click **Deploy**

No environment variables are required.

---

## 🎮 Gameplay Tips

- **Chain chops** — never pause; the timer only goes up when you chop
- **Watch two ahead** — two upcoming segments are visible; plan before you commit
- **Hard mode** — branches are denser and timer drains faster; aim for 50+ chops
- **Sound cues** — the chop sound tells you you're alive; silence = branch hit

---

## 📄 License

MIT
