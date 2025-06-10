# poe-cards-server-lambda

This project implements an AWS Lambda used by [poe.cards](https://poe.cards). The codebase follows a clean architecture approach and is written in TypeScript.

## Development

Install dependencies and run the tests:

```bash
npm install
npm test
```

A simple asynchronous queue (`SimpleAsyncQueue`) is used by the HTTP client to ensure requests are processed sequentially. The queue implementation can be found at `src/infra/async-queue/simple-async-queue.ts`.
