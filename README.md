# MikroTik Monitoring Frontend

React 19 + Vite frontend for a local MikroTik mini-ISP monitoring system backed by a Laravel API.

## Stack

- React 19
- Vite
- TypeScript
- React Router
- Tailwind CSS
- TanStack Query
- Axios
- Recharts
- Vitest + Testing Library

## Environment

Create a `.env` file in `Frontend/`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```

## App Routes

- `/login`
- `/`
- `/isps/:ispId`
- `/users`
- `/users/:userId`
- `/status`
- `/traffic`

## Project Structure

```text
src/
  app/               providers
  components/        shared UI building blocks
  features/
    auth/            login + session state
    dashboard/       overview page + summary queries
    isps/            ISP detail query/page
    traffic/         passive destination/app analytics page + hooks
    status/          status page
    users/           user reporting + detail pages
  lib/               axios, query client, formatting helpers
  routes/            router definition
  test/              shared test setup
  types/             API contracts
```

## Notes

- Authentication expects Laravel session endpoints at `/api/login`, `/api/logout`, and `/api/me`.
- Axios is configured with `withCredentials: true` for cookie-based auth.
- The frontend assumes normalized backend values and keeps business logic focused on presentation, filtering, and chart UX.
- `GROUP_A_TOTAL` should remain excluded by the backend from normal customer user rows.
- Traffic analytics is intentionally honest: cards and charts may show exact destinations, inferred service families, category-only labels, or `Unknown Encrypted` depending on backend confidence.
