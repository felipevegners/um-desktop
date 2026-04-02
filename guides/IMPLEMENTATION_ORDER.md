# Implementation Order

This guide defines the practical execution sequence for the `um-api` migration from the current `um-desktop` monolith. Read `UM_API_BLUEPRINT.md` for the full architectural rationale before starting.

## Context

- Solo developer, frontend-oriented background.
- Current stack: Vue/Nuxt, Vercel, MongoDB Atlas, Prisma.
- Two existing repos: `um-desktop` (backoffice UI + API) and `um-driver-app` (mobile).
- Target: extract all critical business logic into a new `um-api` repo.
- 65 test rides in the database, no active production clients yet.

## Guiding Principle

Do not start a phase until the previous one is validated. Each phase ends with a working, testable increment.

---

## Phase 1: Bootstrap `um-api`

**Goal:** runnable API skeleton connected to the existing database.

Steps:

1. Create the `um-api` repository.
2. Initialize Node.js + TypeScript + Fastify project.
3. Add Prisma pointed to the existing MongoDB Atlas connection string.
4. Copy the existing `schema.prisma` as starting point.
5. Set up environment config (`config/env.ts`) with Zod validation.
6. Set up Pino logger and a global error handler plugin.
7. Set up a health check endpoint `GET /health`.
8. Deploy the skeleton to Render or Railway.
9. Confirm the deployed URL is reachable.

---

## Phase 2: Authentication

**Goal:** both clients can log in and receive a validated session via `um-api`.

Steps:

1. Implement `POST /auth/login` with email + password, returning access token and refresh token.
2. Implement `POST /auth/refresh` for token rotation.
3. Implement `POST /auth/logout` to invalidate the refresh token.
4. Implement `GET /auth/me` returning user summary, role, and resolved `accessScope`.
5. Implement access scope resolution for all canonical roles:
   - `admin`: all contracts, all branches
   - `master-manager`: scoped to own contract
   - `branch-manager`: scoped to assigned branches
   - `branch-admin`: scoped to assigned branch (treat `platform-admin` as alias)
   - `platform-corp-user`: scoped to own userId and assigned branch/area
   - `platform-driver`: scoped to own driver identity
6. Add `permissions` array to `GET /auth/me` response.
7. Switch `um-desktop` login to call `um-api` instead of the Nuxt auth handler.
8. Switch `um-driver-app` login to call `um-api`.

---

## Phase 3: Platform Driver Identity Fix

**Goal:** `platform-driver` has a clean, explicit identity without the shared-id fragility.

Context: the current model creates an `Accounts` record and a `Drivers` record using the same id by convention. This is fragile.

Steps:

1. Add `accountId` field to the `Drivers` model in Prisma.
2. Backfill `accountId` on existing driver records using the current shared id pattern.
3. Implement a `DriverIdentityAggregate` that merges both records at the API layer.
4. Expose this aggregate through `GET /auth/me` when role is `platform-driver`.
5. Update `um-driver-app` to read driver profile data from `GET /auth/me` instead of separate calls.

---

## Phase 4: Ride Read Path

**Goal:** both clients read rides from `um-api` with server-enforced data scope.

Steps:

1. Implement `GET /rides` with filters for status, contract, branch, and driver.
2. Apply scope resolution to every query: the database filter must always reflect the authenticated scope.
3. Implement `GET /rides/:id` with full ride detail.
4. Return a `capabilities` object alongside data:
   - `canCreateRide`
   - `canEditRide`
   - `canCancelRide`
   - `canRecalculateRide`
   - `canAssignDriver`
   - `canReadFinancial`
5. Switch `um-desktop` ride list pages to read from `um-api`.
6. Switch `um-driver-app` ride list to read from `um-api`.

---

## Phase 5: Pricing Engine V2

**Goal:** deterministic, versioned billing calculation that is the only source of truth.

Steps:

1. Create `domain/billing/billing.types.ts` with:
   - `RideMetrics`
   - `RideVariance`
   - `RidePricingSnapshot`
   - `RideBillingBreakdown`
2. Implement `buildPlannedMetrics(ride)`.
3. Implement `buildRealizedMetrics(ride)`:
   - `realizedDurationSeconds = finishedAt - startedAt`
   - `stoppedDurationSeconds` as separate field, not added again
   - `realizedDistanceMeters` from GPS path or reconstructed route
4. Implement `buildBillableMetrics(realized, pricingSnapshot)`.
5. Implement `calculateRideBilling(billable, pricingSnapshot)` with two branches:
   - `free` (EASY): `base + km * kmPrice + min * minutePrice + addons`
   - `contract` (GOLD, BLINDADO): `base + max(0, km - includedKm) * kmPrice + max(0, min - includedMin) * minutePrice + addons`
6. Add new schema fields to `Rides` in Prisma:
   - `plannedMetrics`
   - `realizedMetrics`
   - `billableMetrics`
   - `varianceMetrics`
   - `pricingSnapshot`
   - `billingBreakdown`
   - `calculationVersion`
7. Continue writing `estimatedPrice`, `rideFinalPrice`, and `billing.ammountWithExtras` during this phase for backward compatibility.
8. Implement `POST /rides/:id/recalculate` using the engine.
9. Test both product types with current payloads:
   - EASY: `basePrice=0`, `kmPrice=6.00`, `minutePrice=1.00`
   - GOLD: `basePrice=1100.00`, `includedKms=100`, `includedHours=10`, `kmPrice=8.50`, `minutePrice=1.85`

---

## Phase 6: Ride Lifecycle Writes

**Goal:** create, start, stop, and finish rides through `um-api`.

Steps:

1. Implement `POST /rides` with idempotency key.
2. Implement `PATCH /rides/:id` for editing before start.
3. Implement `POST /rides/:id/start`.
4. Implement `POST /rides/:id/stop/start` and `POST /rides/:id/stop/finish`.
5. Implement `POST /rides/:id/finish`:
   - validate state machine
   - run pricing engine v2
   - write all billing fields
   - update status to completed
   - enqueue commission and notification jobs
   - return ride summary synchronously
6. Switch `um-driver-app` ride lifecycle calls to `um-api`.
7. Switch `um-desktop` ride edit and creation to `um-api`.
8. Retire `server/api/rides-calculate.post.ts` in `um-desktop`.

---

## Phase 7: Background Workers

**Goal:** post-completion side effects are decoupled from the synchronous path.

Steps:

1. Set up Redis connection via Upstash or provider-managed Redis.
2. Set up BullMQ queues for: `finalize-ride`, `commission`, `notification`.
3. Move commission creation to `commission.worker.ts`.
4. Move push notification dispatch to `notification.worker.ts`.
5. Add structured logs per job run.
6. Verify that `POST /rides/:id/finish` response time is not blocked by notifications or commissions.

---

## Phase 8: UI Consolidation in `um-desktop`

**Goal:** eliminate duplicated role-based pages by using capabilities from the API.

Steps:

1. Create shared `composables/useRidesPage.ts` that reads from `um-api` and returns `{ rides, capabilities }`.
2. Create shared `buildRideColumns(capabilities)` factory.
3. Create shared `buildRideActions(capabilities)` factory.
4. Consolidate each duplicated page pair into a single shared component:
   - rides open list
   - rides completed list
   - ride edit
   - ride creation
5. Update `middleware/roles.global.ts` to use token-based permission checks from `GET /auth/me` instead of hardcoded path checks.
6. Remove the now-empty `pages/corporative/rides` folder.

---

## Phase 9: Hardening and Cleanup

**Goal:** production-ready posture before onboarding real clients.

Steps:

1. Add rate limiting to `um-api` sensitive endpoints.
2. Add request logging per endpoint.
3. Add calculation audit log: every recalculation must record who triggered it, what changed, and which version was used.
4. Add billing breakdown display in `um-desktop` ride detail pages.
5. Remove legacy Nuxt server routes that have been migrated.
6. Validate all 65 historical test rides can be recalculated with the engine v2.
7. Document environment variables and deployment steps in the `um-api` README.

---

## Permanent Rules for All Phases

1. No client ever calculates final ride price.
2. No role-specific data filter runs in the client.
3. Every write operation passes through a permission check.
4. Every finalized ride stores `calculationVersion` and `pricingSnapshot`.
5. `platform-admin` is only an alias; use `branch-admin` going forward.
