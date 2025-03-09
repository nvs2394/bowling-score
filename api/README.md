# Bowling Score API

## Description

This directory contains the NestJS-based backend API for the Bowling Game application. The API manages game creation, frame submissions, and score tracking, integrated with a MongoDB database.

## Prerequisites

- Node.js (v18.x recommended)
- npm (v9.x recommended)
- Docker (for containerized setup and E2E tests)
- MongoDB (optional, used in Docker or locally)

## API Documentation

Explore all available APIs by visiting the **Swagger API Documentation** at:

```
http://localhost:3000/api
```

## Installation & Setup

1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/bowling-score-api.git
   cd bowling-score-api
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the application:
   ```sh
   npm run start
   ```

## Running with Docker

To run the application using Docker and MongoDB:

```sh
docker-compose up --build
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Developer guide

```bash
# Lint check
$ npm run lint

# ESLint fix
$ npm run lint --fix
```
