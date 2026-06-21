# Agent Instructions

## Project Summary

Hiro Gradients is a Vite and React gradient design app with a small Node HTTP
API. Reusable server/API behavior belongs under `src/api`, while React entry
paths should stay browser-safe.

## Commands

- Install dependencies: `npm ci`
- Run tests: `npm run test`
- Run API tests directly: `npm run test:api`
- Run lint: `npm run lint`
- Build: `npm run build`

## Boundaries

- Do not edit `dist/`, `node_modules/`, or `scratch/`.
- Keep server-only code out of React entry paths.
- Keep browser-only export logic in `src/exportBackground.js` and components.
- Use `src/api` for reusable API logic.
- Add endpoint tests in `test/api.test.js` when changing HTTP behavior.
- Do not reproduce secrets if any are found.
