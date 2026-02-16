# Modular Monolith Layout

This project now uses domain modules under `src/modules`.

## Current modules

- `auth`: routing rules and authentication navigation policies.
- `dashboard`: workspace access/session rules.
- `deals`: deal repository and domain service for dashboard-facing deal insights.
- `onboarding`: onboarding route and redirect target helpers.
- `profiles`: profile data access and role normalization.

## Conventions

- Route handlers and pages in `src/app` should stay thin and call module APIs.
- Shared infrastructure (Supabase clients, framework setup) remains in `src/lib`.
- Cross-module access should happen through each module's `index.ts` public API.
- SQL migrations for Supabase-backed modules live in `supabase/migrations`.

## Next modules to extract

- `analytics`
