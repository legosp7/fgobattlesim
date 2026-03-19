# fgobattlesim

A starter Spring Boot web app that consumes the **Atlas Academy Fate/Grand Order API**.

## What this implementation includes

- Spring Boot MVC app with Thymeleaf.
- Atlas Academy API integration (`https://api.atlasacademy.io`).
- Home page with a **servant dropdown selector** that updates automatically when you choose an option.
- Selecting a servant loads and displays servant details:
  - class and rarity
  - a **servant level selector from 1-120** that updates displayed HP and ATK
  - Noble Phantasms
  - **servant skill data with an auto-submitting skill dropdown and a level-by-level table**
  - numeric values and percentage-style buff fields parsed from Atlas Academy function values (`svals`, `svals2`, etc.)
- Basic external API error handling.
- Unit and MVC tests.

## Tech stack

- Java 17
- Spring Boot 3
- Spring Web + Thymeleaf
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
  controller/ServantController.java
  controller/GlobalExceptionHandler.java
  dto/ServantSummaryDto.java
  dto/ServantDetailDto.java
  dto/ServantSkillDto.java
  dto/ServantFunctionDto.java
  dto/NoblePhantasmDto.java
  service/FgoApiService.java
  exception/ExternalApiException.java

src/main/resources/templates
  index.html
  servant.html
  error.html
```
