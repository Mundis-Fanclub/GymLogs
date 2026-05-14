# GymLogs

GymLogs is a mobile-first strength tracker with a long-term "Warcraft Logs for Gym" direction: normal workout logging first, verified lift logs and leaderboards on top.

## Getting Started

Install dependencies:

```powershell
npm install
```

Create `.env.local` from `.env.example`, then start Convex in one terminal:

```powershell
npm run convex:dev
```

Keep this terminal running while you use the app. Dashboard, workout history, and analytics all subscribe to Convex queries and will stay in loading states if the Convex dev server is not running.

When Convex has written `NEXT_PUBLIC_CONVEX_URL`, seed the standard exercises and MVP leaderboard brackets:

```powershell
npm run convex:seed
```

Start the Next app:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## MVP Scope

- Workout tracking should stay fast and useful without leaderboards.
- The only leaderboard-eligible lifts are Bench Press, Squat, and Deadlift.
- The broader exercise library can still include normal training movements.
- Verified logs use submissions, status history, video metadata, bracket metadata, and leaderboard snapshots in Convex.

## Verification

```powershell
npm run lint
npm run build
```
