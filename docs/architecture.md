# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Use the shared API client to render each capability, adding loading, empty, and accessible error states. Rerun frontend tests as each route is addressed.
- Logic tier decision: Implement and verify activities and teams first, then leaderboard and workout suggestions. Keep invalid input on deliberate 4xx responses; rerun API tests after each capability.
- Data tier decision: Add the schema invariants, then rerun the data tests. Preserve the currently passing seed behavior.
- Activity tracking approach: Accept userId, teamId, type, and positive minutes; validate that both IDs are well-formed and reference existing records before creating anything. Store the references as user and team, calculate points as one point per minute, and set occurredAt on the server. Return deliberate 4xx responses for invalid input or missing references.
- Team management approach: Require a non-empty name; retain the submitted name and mascot, and default members to an empty array. If member IDs are supplied, validate them and return member IDs in team responses to keep the API shape simple and consistent
- Leaderboard approach: Sum activity points by team, sort highest total first, and assign ranks starting at 1. Include teams with no activities at zero points; use team name as a stable tie-breaker so equal scores have predictable ordering.
- Workout suggestions approach: Find the user by email and use their recent activities to select a matching workout focus; fall back to their fitness goal when there’s no useful recent activity. Put the best match first and include a short reason. Return a 4xx for an unknown email, and avoid recommending a mismatched workout when there are no suitable suggestions.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
- API command: `npm run test:api --prefix octofit-tracker/backend`
- Frontend command: `npm test --prefix octofit-tracker/frontend`
- Backend build command: `npm run build --prefix octofit-tracker/backend`
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
