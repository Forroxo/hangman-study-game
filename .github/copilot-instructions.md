# Copilot Instructions - StudyHangman

## Project Overview
StudyHangman is an educational Hangman game (Next.js 13, React 18, Firebase, Tailwind CSS) combining spaced repetition algorithms with multiplayer gameplay. Core value: interactive learning through active recall.

## Architecture

### Core Services
- **Game Logic** (`src/lib/gameLogic.js`): Word validation, scoring, hint generation. Handles accented characters (À-Ü).
- **Progress Tracking** (`src/lib/progress.js`): SM-2 spaced repetition algorithm with `easinessFactor`, `interval`, and `nextReview` tracking. Persists to localStorage.
- **Multiplayer** (`src/lib/multiplayerService.js`): Firebase Realtime Database with per-player game state (not shared). Uses transactions for concurrent access safety.
- **Firebase Setup** (`src/lib/firebase.js`): Client-only initialization with Realtime Database.

### Data Structure
- **Modules**: JSON files in `src/data/modules/` (biology.json, custom-modules.json). Each term has: `id`, `word`, `hint`, `fullExplanation`, `category`.
- **Progress**: Stored per module as `module_{moduleId}_progress` in localStorage with term-level tracking.
- **Multiplayer Rooms**: Firebase path `rooms/{roomCode}` contains: shared `terms` array + `players` object with individual game states.

## Critical Patterns

### SSR/Hydration Mismatch Prevention (CRITICAL)
**Always use this pattern for dynamic routes:**
```javascript
const [moduleId, setModuleId] = useState(null);
useEffect(() => {
  if (!router.isReady) return;
  if (router.query.moduleId) {
    setModuleId(String(router.query.moduleId));
  }
}, [router.isReady, router.query.moduleId]);
```
- **Why**: SSR renders with empty `router.query` (mismatch with client). Use `useState` + `useEffect` to defer access until hydration completes.
- **See**: `src/pages/multiplayer/room/[roomCode].js` (fixed pattern), `COMECE_AQUI.md` (detailed explanation).

### State Management
- Client-side state: localStorage (progress), in-component React state (UI).
- Server-side state: Firebase only, **no static props for dynamic routes** (use `fallback: 'blocking'` in `getStaticPaths`).
- Multiplayer: Each player has isolated game state; no shared guessedLetters/errors across players.

### Performance
- Game status checks (`checkWin`, `checkLoss`) in separate `useEffect` (not in timer) to prevent infinite loops.
- Text normalization via `normalizeText()` before letter comparisons (handles accents, special chars).
- ISR revalidation: 60 seconds for module listings.

## Key Files & Patterns

| File | Purpose | Pattern |
|------|---------|---------|
| `src/pages/game/[moduleId].js` | Single-player entry | Uses `getStaticPaths` + `fallback: 'blocking'`; state in `useState` |
| `src/pages/multiplayer/room/[roomCode].js` | Multiplayer client | Syncs player data from Firebase via `useEffect` + `onValue` listener |
| `src/components/Game/HangmanGame.jsx` | Game logic UI | Tracks `guessedLetters`, `errors`, `gameStatus` locally; submits via `submitGuess()` |
| `src/lib/progress.js` | Spaced repetition | `calculateNextReview()`: perf >= 3 → increase interval; perf < 3 → reset to 1 day |
| `src/lib/textUtils.js` | String handling | `normalizeText()` removes accents; `compareWords()` case-insensitive |

## Common Tasks

### Adding a Module
1. Create JSON in `src/data/modules/{id}.json` with terms array.
2. Import in `src/pages/game/[moduleId].js` and add to `SAMPLE_MODULES`.
3. Progress auto-tracks with key `module_{id}_progress`.

### Handling Multiplayer Events
- Listen: `onValue(ref(database, 'rooms/${roomCode}'), callback)`
- Update: Use `submitGuess()` (handles transactions) or `update(ref(...), data)`.
- Clean up: `off(ref(...), callback)` in return of `useEffect`.

### Debugging SSR Issues
- Check browser console for hydration warnings (mismatch between server/client HTML).
- Verify `router.isReady` before accessing `router.query`.
- Use `fallback: 'blocking'` for dynamic routes (no pre-rendering).

## Conventions
- **Component naming**: PascalCase, file extension `.jsx`.
- **CSS**: Tailwind classes; global styles in `src/styles/globals.css`.
- **Error handling**: Custom error messages in components; avoid silent failures.
- **Formatting**: Support accented characters (À-Ü regex in game logic).

## External Dependencies
- **Firebase**: Client-side only; initialize once in `src/lib/firebase.js`.
- **Next.js 13**: App Router not used; Pages Router with ISR.
- **Tailwind 3.3**: No custom plugins; PostCSS configured.

## Build & Deploy
- Dev: `npm run dev` (port 0.0.0.0:3000)
- Build: `npm run build` → `next build` (pre-renders static routes)
- Start: `npm run start`
- Next.js config: SWC minify enabled, unoptimized images.
