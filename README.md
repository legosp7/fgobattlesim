# fgobattlesim

A tutorial-style **Spring Boot backend + Vite/React/TypeScript frontend** app for exploring Fate/Grand Order data from the Atlas Academy API.

---

## Why this architecture is useful (teaching view)

When you learn full-stack development, it helps to keep clear boundaries:

- **Spring Boot backend**
  - owns external API calls
  - converts raw API responses into backend-friendly DTOs
  - exposes stable `/api/*` endpoints for the UI
  - centralizes failure handling
- **React frontend (Vite + TypeScript + React Router)**
  - owns page rendering and user interaction
  - fetches backend JSON endpoints
  - manages route-driven screens (`/servants`, `/servants/:id`, `/party`)

This makes the project easy to reason about and easy to grow.

---

## Stack

### Backend
- Java 17
- Spring Boot 3 (MVC)
- Maven

### Frontend
- Vite
- React 18
- TypeScript
- React Router v6

---

## Endpoints provided by Spring Boot

- `GET /api/servants`
- `GET /api/servants/{id}`
- `GET /api/noble-phantasms/{id}`
- `GET /api/craft-essences`
- `GET /api/craft-essences/{id}`

The frontend only talks to these backend endpoints (not directly to Atlas Academy).

---

## Frontend routes (React Router)

- `/servants` → servant list
- `/servants/:id` → individual servant detail page
- `/party` → party builder

Spring forwards browser refreshes on these routes to `index.html` so the SPA can boot correctly.

---

## Project layout

```text
backend
  src/main/java/com/example/fgobattlesim
    client/
    config/
    controller/
    dto/
    exception/
    service/

frontend
  frontend/
    src/
      api/
      components/
      lib/
      pages/
      routes/
      types/
```

---

## How to run locally (recommended dev workflow)

### 1) Start Spring Boot backend

```bash
mvn spring-boot:run
```

Backend runs on `http://localhost:8080`.

### 2) Start Vite frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

In `vite.config.ts`, `/api` is proxied to `http://localhost:8080`, so frontend fetches work during development without CORS setup.

---

## Production-style build flow

From `frontend/`:

```bash
npm run build
```

This compiles the TypeScript React app and writes bundled assets into:

```text
src/main/resources/static
```

Then Spring Boot can serve the built SPA directly.

---

## Tutorial walkthrough of key frontend files

### `frontend/src/types/fgo.ts`
Defines TypeScript DTO shapes that mirror backend JSON responses.

**Why this matters:** better autocomplete + compile-time safety for API usage.

### `frontend/src/api/fgoApi.ts`
Central fetch wrapper (`getJson`) and endpoint helpers.

**Why this matters:** pages stay focused on UI logic, not repeated fetch boilerplate.

### `frontend/src/routes/AppRouter.tsx`
Single route table for the app.

**Why this matters:** one place to reason about navigation behavior.

### `frontend/src/pages/ServantsPage.tsx`
Uses a guided selector flow:
- choose class in FGO class order (Saber → Archer → Lancer → ...)
- choose servant from that class
- inspect skill values by selected skill + selected skill level
- inspect NP values by selected NP upgrade/version + selected NP level
- show NP card type mapping (1/Arts, 2/Buster, 3/Quick)

### `frontend/src/pages/ServantDetailPage.tsx`
Loads route param `:id`, fetches servant detail + NP detail, and renders level-adjusted stat examples.

### `frontend/src/pages/PartyPage.tsx`
Per-slot builder with:
- class-first servant selection
- servant level + NP level controls
- individual skill level dropdowns
- computed servant stats at chosen level
- craft essence detail/effects and combined totals

---

## Tutorial walkthrough of backend layering

### `client/FgoApiClient`
Low-level Atlas Academy HTTP integration.

### `service/FgoApiService`
Business-facing operations built on top of the client.

### `controller/ApiController`
HTTP JSON endpoints consumed by the frontend.

### `controller/SpaController`
Forwards SPA browser routes to `index.html`.

---

## Testing

```bash
mvn test
```

Includes:
- service-level unit test (`FgoApiServiceTest`)
- MVC slice tests (`ServantControllerTest`)
