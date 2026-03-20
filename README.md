# fgobattlesim

A Spring Boot back end with a **React front end** for exploring Fate/Grand Order data from the **Atlas Academy API**.

## What this implementation includes

- Spring Boot MVC/API application.
- React single-page front end served from Spring Boot static resources.
- Atlas Academy API integration (`https://api.atlasacademy.io`).
- A **Servants** tab for:
  - selecting a servant
  - selecting servant level from 1-120
  - viewing HP/ATK at the selected level
  - viewing skill level tables
  - viewing Noble Phantasm summaries
- A **Party** tab for:
  - selecting a class for each party slot
  - selecting a servant from that class
  - selecting a craft essence from a fetched list
  - adding another servant slot to the party
- REST API endpoints that power the React front end:
  - `GET /api/servants`
  - `GET /api/servants/{id}`
  - `GET /api/craft-essences`
- Basic external API error handling.

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
