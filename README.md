# fgobattlesim

A tutorial-style **Spring Boot backend + Vite/React/TypeScript frontend** app for exploring Fate/Grand Order data from Atlas Academy.

## Architecture (mentor explanation)

- **Spring Boot** is the integration layer that talks to Atlas APIs and exposes stable `/api/*` endpoints.
- **React + React Router** is the UI layer for interactive screens (`/servants`, `/party`, `/enemies`).
- Keeping these concerns separated makes the code easier to understand, debug, and grow as a learner.

## Core API endpoints

- `GET /api/servants` (NPC servants whose IDs begin with `99` are filtered out)
- `GET /api/servants/{id}`
- `GET /api/noble-phantasms/{id}`
- `GET /api/skills/{id}` (debug helper)
- `GET /api/craft-essences`
- `GET /api/craft-essences/{id}`
- `GET /api/mystic-codes`
- `GET /api/enemies`
- `GET /api/enemies/{id}`

## Frontend routes

- `/servants` – class-first servant selector + skill/NP inspector
- `/servants/:id` – direct link to a specific servant inspector
- `/party` – party slot builder with CE and mystic code selection
- `/enemies` – wave builder for encounter planning

## What the Party page now teaches

- Class dropdown first, then servant dropdown for that class.
- Servant level selector (Lv 1–120), NP level selector, Fou / Golden Fou toggles.
- NP upgrade checkboxes that are disabled if upgrades are unavailable.
- Exactly 3 active skill slots, with base/upgraded detection by shared `skill.num`.
- Expand/collapse skill details to see effect values and cooldown arrays.
- Append skill level selectors (3 append slots).
- Expand/collapse NP details to inspect level-sensitive values.
- Craft Essence selection with CE stats and effects.
- Mystic Code selector at the bottom of the party screen.

## What the Enemies page teaches

- Start with Wave 1, then add more waves dynamically.
- Each wave has a collapsible card with enemy selector + level selector.
- Enemy trait display is included (skills/NP intentionally omitted for simplicity).

## Run locally

```bash
mvn spring-boot:run
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

## Tests

```bash
mvn test
```

