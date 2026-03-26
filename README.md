# fgobattlesim

A Spring Boot back end with a **React front end** for exploring Fate/Grand Order data from the **Atlas Academy API**.

## Why this project is structured this way

If you are learning both **Spring Boot** and **React**, this repo now gives you a very common real-world split:

- **Spring Boot handles server-side concerns**:
  - calling the external Atlas Academy API
  - mapping JSON into Java records (DTOs)
  - exposing clean REST endpoints for the browser
  - centralizing error handling
- **React handles browser-side concerns**:
  - rendering tabs and dropdowns
  - tracking UI state such as selected servant, level, and party slots
  - combining API responses into an interactive UI

I chose this split because it teaches a strong beginner mental model:

1. **Backend = data + business access layer**
2. **Frontend = interaction + presentation layer**
3. The two sides communicate with **JSON over HTTP**

That architecture scales better than mixing all rendering logic inside server templates once the UI becomes interactive.

## What this implementation includes

- Spring Boot MVC/API application.
- React single-page front end served from Spring Boot static resources.
- Atlas Academy API integration (`https://api.atlasacademy.io`).
- A **Servants** tab for:
  - selecting a servant
  - selecting servant level from 1-120
  - viewing HP/ATK at the selected level
  - viewing skill level tables
  - viewing Noble Phantasm summaries fetched from Atlas Academy's NP endpoint
- A **Party** tab for:
  - selecting a class for each party slot
  - selecting a servant from that class
  - selecting servant level, NP level, NP upgrades (0-2), and Fou/Golden Fou toggles
  - viewing servant ATK/HP with those modifiers plus NP card type and NP damage modifier (NP card/details are fetched from NP API)
  - selecting a craft essence from a fetched list
  - viewing craft essence stats/effects after selection
  - adding another servant slot to the party
- REST API endpoints that power the React front end:
  - `GET /api/servants`
  - `GET /api/servants/{id}`
  - `GET /api/noble-phantasms/{id}`
  - `GET /api/craft-essences`
  - `GET /api/craft-essences/{id}`
- Basic external API error handling.

## Tutorial walkthrough of the codebase

### 1) Spring Boot entrypoint

`FgoBattleSimApplication` is the class with `main(...)`. It tells Spring Boot where your application starts and triggers component scanning so your controllers, services, and config classes are discovered automatically.

### 2) Configuration

`HttpClientConfig` creates a reusable `RestClient` bean. I chose a bean here because it keeps HTTP configuration in **one place**, instead of scattering API setup across multiple classes.

### 3) DTOs

The files under `dto/` are simple records that describe the shape of the JSON returned by Atlas Academy.

I used **records** because they are ideal for read-only API data:

- less boilerplate than traditional Java classes
- automatically give you constructor/accessors
- easier for beginners to read

### 4) Client layer

`FgoApiClient` is the **lowest-level Atlas Academy integration layer**.

Its job is only to:

- build the request URL
- call the API
- deserialize JSON into DTOs
- wrap HTTP/client failures in `ExternalApiException`

I kept this logic separate so the rest of the app does not need to know HTTP details.

### 5) Service layer

`FgoApiService` sits on top of the client.

Its job is to apply app-specific rules such as:

- filtering invalid servant/craft essence rows
- sorting data for display

This separation matters because it keeps controllers thinner and easier to test.

### 6) API controller layer

`ApiController` exposes JSON endpoints for the browser.

Why not let React call Atlas Academy directly?

Because if Spring Boot stays between the browser and Atlas Academy, you can later add:

- caching
- rate limiting
- logging
- retries
- authentication
- your own custom data shaping

without rewriting the front end.

### 7) SPA routing controller

`SpaController` forwards browser routes like `/` and `/party` to the React entry page (`index.html`).

This is a common SPA pattern: Spring serves the app shell, then React decides what to render in the browser.

### 8) React front end

The front end lives in:

- `src/main/resources/static/index.html`
- `src/main/resources/static/app.css`
- `src/main/resources/static/js/constants.js`
- `src/main/resources/static/js/api.js`
- `src/main/resources/static/js/utils.js`
- `src/main/resources/static/js/components/ServantsTab.jsx`
- `src/main/resources/static/js/components/PartyTab.jsx`
- `src/main/resources/static/js/App.jsx`
- `src/main/resources/static/js/main.jsx`

I intentionally kept it simple:

- no Vite/Webpack setup yet
- React + React Router are loaded from a CDN
- Babel in the browser transpiles JSX
- routing uses `react-router-dom` (`/servants` and `/party`)

That is **not** how I would build a production React app, but it is a good teaching step because it removes extra tooling complexity while you focus on Spring + React concepts.

### 9) Tests

The tests show two different testing styles:

- `FgoApiServiceTest`: unit test for backend service behavior
- `ServantControllerTest`: web MVC test for HTTP/API behavior

This is useful for learning because it shows that not every test needs the whole app running.

## Tech stack

- Java 17
- Spring Boot 3
- React 18 (CDN-served)
- Maven

## Run locally

```bash
mvn spring-boot:run
```

Then open:

- `http://localhost:8080/`

## Test

```bash
mvn test
```

## Main project structure

```text
src/main/java/com/example/fgobattlesim
  client/FgoApiClient.java
  config/HttpClientConfig.java
  controller/ApiController.java
  controller/SpaController.java
  controller/GlobalExceptionHandler.java
  dto/ServantSummaryDto.java
  dto/CraftEssenceSummaryDto.java
  dto/ServantDetailDto.java
  dto/ServantSkillDto.java
  dto/ServantFunctionDto.java
  dto/NoblePhantasmDto.java
  service/FgoApiService.java
  exception/ExternalApiException.java

src/main/resources/static
  index.html
  app.css
  app.jsx
```
