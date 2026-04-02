# UM API Blueprint

## Objective

This document defines the target architecture for a new `um-api` repository that will become the single source of truth for:

- authentication and session validation
- ride lifecycle orchestration
- pricing and billing calculation
- commissions and post-completion processing
- authorization, role scoping, and capability exposure for clients

The goal is to remove critical business rules from the current Nuxt server layer, support both the driver app and backoffice, and eliminate UI duplication caused by role-specific views with nearly identical behavior.

## Why Change

The current `um-desktop` structure mixes UI, API handlers, data persistence, and pricing rules in the same codebase. That creates four structural problems:

1. Critical rules such as final ride value are not centralized.
2. Different flows can calculate values differently.
3. Role restrictions are spread across pages, middleware, and rendering conditions.
4. Backoffice and mobile share the same backend needs, but the backend is coupled to the backoffice application.

At the current MVP stage, with low production volume and one developer, a controlled refactor is viable and lower risk than carrying the current architecture forward.

## Repository Topology

Recommended topology: 3 repositories.

1. `um-desktop`
   Backoffice UI only.
2. `um-driver-app`
   Driver mobile app only.
3. `um-api`
   API, worker jobs, auth, pricing engine, and shared business domain.

This keeps deployment and code ownership simple while establishing a clean boundary: clients render and collect input, `um-api` decides business outcomes.

## Hosting Recommendation

Recommended near-term topology:

1. `um-desktop` on Vercel.
2. `um-api` on Render or Railway.
3. MongoDB on Atlas.
4. Redis on Upstash or provider-managed Redis.

Rationale:

- Vercel is already in use for the backoffice UI.
- Render and Railway are easier for a solo frontend-oriented developer than cloud-first infrastructure.
- Redis enables job offloading, idempotency control, and lightweight caching.
- Mongo Atlas and Prisma remain valid for the next growth phase if the domain model becomes explicit and auditable.

## Technology Stack for `um-api`

Recommended stack:

- Node.js
- TypeScript
- Fastify
- Prisma
- MongoDB Atlas
- Zod
- JWT access tokens + refresh tokens
- BullMQ for jobs
- Redis
- Pino for structured logging

Why Fastify instead of embedding everything into another Nuxt server:

- lower overhead
- clear separation between API and UI
- better performance profile for high-volume JSON endpoints
- easy to keep explicit and understandable

Why not overcomplicate the first version:

- no microservices initially
- one deployable API service
- one worker process
- shared domain package inside the same repository

## High-Level Architecture

```text
um-desktop  ----->
                  \
                   >  um-api  -----> MongoDB Atlas
                  /
um-driver-app --->

um-api worker ----> Redis jobs ----> notifications / recalculation / commissions
```

Core rule:

- neither `um-desktop` nor `um-driver-app` calculate final ride price
- both clients send inputs and consume server-calculated results

## Proposed `um-api` Structure

```text
um-api/
  src/
    app/
      server.ts
      app.ts
    config/
      env.ts
    modules/
      auth/
        auth.controller.ts
        auth.service.ts
        auth.schemas.ts
      accounts/
      rides/
        rides.controller.ts
        rides.service.ts
        rides.repository.ts
        rides.schemas.ts
      pricing/
        pricing.service.ts
        pricing.schemas.ts
        pricing.types.ts
        pricing.constants.ts
      authorization/
        permissions.ts
        policies.ts
        scope-resolver.ts
      commissions/
      notifications/
      products/
      contracts/
      branches/
    domain/
      rides/
        ride-status-machine.ts
      billing/
        calculate-ride-billing.ts
        build-planned-metrics.ts
        build-realized-metrics.ts
        build-billable-metrics.ts
        billing.types.ts
      auth/
        capability-map.ts
    jobs/
      queues.ts
      workers/
        finalize-ride.worker.ts
        notification.worker.ts
        commission.worker.ts
    lib/
      prisma.ts
      redis.ts
      logger.ts
      errors.ts
      money.ts
      time.ts
      distance.ts
    plugins/
      auth.ts
      permissions.ts
      error-handler.ts
  prisma/
    schema.prisma
```

Design rule:

- `modules` expose HTTP and persistence concerns
- `domain` contains business logic with no HTTP knowledge
- `jobs` execute background side effects

## API Responsibilities

### Synchronous responsibilities

- login and token refresh
- session and capability retrieval
- ride creation
- ride detail retrieval
- ride start / stop / finish transitions
- deterministic billing calculation
- ride list filtering based on authenticated scope

### Asynchronous responsibilities

- push notifications
- commission generation
- non-blocking audit recomputations
- reconciliation or recalculation jobs

## Authorization Model

### Current problem

Today, authorization is partly route-based and partly UI-based. The current global middleware in `um-desktop` only handles a subset of path and role combinations. Page duplication in `pages/admin` and `pages/corporative` exists mainly because data scope and action scope are entangled with page structure.

### Target model

Use a hybrid RBAC + scope-based ABAC model.

1. RBAC decides what actions a role can perform.
2. Scope-based rules decide which records the user may see or mutate.

Example distinction:

- permission answers: can this user edit rides?
- scope answers: which rides may this user edit?

### Roles currently known

- `admin`
- `master-manager`
- `branch-manager`
- `platform-admin`
- `platform-corp-user`
- `platform-user`
- `platform-driver`

### Canonical role note

There is currently a naming mismatch between business language and code language.

- business language uses `branch-admin`
- current codebase uses `platform-admin`

For the new API, keep one canonical role id only. Recommended direction:

- use `branch-admin` as the business-facing canonical name
- support `platform-admin` only as a temporary legacy alias during migration

This avoids permanent ambiguity in permissions, audit logs, and onboarding flows.

### Macro role definitions

#### `admin`

Global backoffice operator with unrestricted access.

- full read access to all contracts, branches, users, rides, drivers, budgets, and financial data
- can create, update, delete, recalculate, and remove records
- can manage all operational and commercial data

#### `master-manager`

Operational manager for the contract level, representing the Urban Mobi and client relationship for that contract.

- scoped to one or more contracts
- can create and edit branches for the contract
- can create and manage users under the contract
- can assign and edit `branch-manager`
- can adjust contract and branch budgets
- can read and operate on rides across all branches of the contract

#### `branch-manager`

Operational manager for a specific branch.

- scoped only to assigned branches
- can manage users and cost centers inside the branch
- can create and edit branch-level ride data
- can manage branch budget, but not contract-wide budget
- has nearly the same operational permissions as `master-manager`, restricted to branch scope

#### `branch-admin`

Administrative branch operator focused on day-to-day service handling.

- scoped only to assigned branches
- can create, edit, and cancel rides inside the branch if business rules allow
- can create, edit, and remove corporate users from the branch
- cannot manage branch or contract budgets
- cannot access data outside the branch

In the current system this role appears to correspond to `platform-admin`. The migration should normalize both into one canonical role.

#### `platform-corp-user`

Corporate end user.

- must be attached to a branch and cost center
- can access only rides scheduled for or performed for that specific user
- cannot access branch-level or contract-level operational data
- data visibility should be scoped by `userId` first, and then optionally validated against branch and area membership

#### `platform-driver`

Driver account used by the mobile app and operational workflows.

- scoped to the driver identity and assigned rides only
- can access only their own ride queue, active ride state, and profile data required for operation
- must not depend on cross-document conventions that can drift silently

Important design correction:

The current model couples `Accounts` and `Drivers` by creating an account and then creating a driver document with the same id. That works as a migration shortcut, but it is fragile as a long-term identity model.

Recommended target:

- keep authentication identity in `Accounts`
- keep driver operational profile in `Drivers`
- relate them explicitly through `accountId`
- expose a single authenticated `platform-driver` profile through the API as one aggregate view

Example:

```ts
type DriverIdentityAggregate = {
  accountId: string;
  driverId: string;
  role: 'platform-driver';
  email: string;
  name: string;
  phone?: string;
  status: string;
  enabled: boolean;
  driverProfile: {
    licenseCategory?: string;
    scheduleOpen?: boolean;
    outsideActuation?: boolean;
    selectedCar?: unknown;
  };
};
```

This keeps auth and operations separate in storage, but unified in the API contract.

### Recommended permission model

Create a flat permission dictionary and map roles to permissions.

Examples:

- `rides.read`
- `rides.read.financial`
- `rides.create`
- `rides.update`
- `rides.cancel`
- `rides.recalculate`
- `rides.assign-driver`
- `rides.view-audit`
- `accounts.read`
- `contracts.read`
- `branches.read`

Role mapping example:

```ts
export const rolePermissions = {
  admin: [
    'rides.read',
    'rides.read.financial',
    'rides.create',
    'rides.update',
    'rides.cancel',
    'rides.recalculate',
    'rides.assign-driver',
    'rides.view-audit',
  ],
  'master-manager': [
    'rides.read',
    'rides.read.financial',
    'rides.create',
    'rides.update',
    'rides.cancel',
    'accounts.read',
    'accounts.create',
    'accounts.update',
    'branches.read',
    'branches.create',
    'branches.update',
    'contracts.read',
    'budgets.read',
    'budgets.update',
  ],
  'branch-manager': [
    'rides.read',
    'rides.read.financial',
    'rides.create',
    'rides.update',
    'rides.cancel',
    'accounts.read',
    'accounts.create',
    'accounts.update',
    'branches.read',
    'areas.read',
    'areas.create',
    'areas.update',
    'budgets.read',
    'budgets.update',
  ],
  'branch-admin': [
    'rides.read',
    'rides.create',
    'rides.update',
    'rides.cancel',
    'accounts.read',
    'accounts.create',
    'accounts.update',
    'accounts.delete',
    'areas.read',
  ],
  'platform-corp-user': ['rides.read'],
  'platform-user': ['rides.read'],
  'platform-driver': ['rides.read'],
};
```

During migration, `platform-admin` can be mapped internally to the same permission set as `branch-admin`.

### Recommended data scope model

Every authenticated session should resolve into a normalized access scope.

Example:

```ts
type AccessScope = {
  role: string;
  contractIds: string[];
  branchIds: string[];
  areaIds?: string[];
  userId?: string;
  accountId?: string;
  driverId?: string;
  canReadFinancial: boolean;
};
```

Scope examples:

- `admin`: all contracts, all branches
- `master-manager`: all branches inside owned contract
- `branch-manager`: only assigned branches
- `branch-admin`: only assigned branch administration scope
- `platform-corp-user`: only own rides and only within assigned branch and area context
- `platform-driver`: only assigned rides

### Critical rule

The API must enforce record scope. The client must never be trusted to apply business filters.

## How to Remove Page Duplication in `um-desktop`

### Current issue

There are mirrored pages under `pages/admin` and `pages/corporative` with the same resource and nearly the same intent. The difference is usually one of the following:

- the dataset is filtered differently
- the available actions differ
- some financial columns are hidden

That does not justify duplicated pages.

### Target UI strategy

Use one resource page per domain screen and let API capabilities and scope drive the behavior.

Pattern:

1. One page component for rides list.
2. One composable that loads ride data and user capabilities.
3. One shared columns builder that receives capabilities.
4. One shared action builder that receives capabilities.

Example approach:

```ts
const { rides, capabilities } = await useRidesPage();

const columns = buildRideColumns({
  canReadFinancial: capabilities.canReadFinancial,
  canReadAudit: capabilities.canReadAudit,
});

const actions = buildRideActions({
  canEdit: capabilities.canEditRide,
  canPreview: capabilities.canPreviewRide,
  canRecalculate: capabilities.canRecalculateRide,
});
```

### Backend contract to support this

Each list or detail endpoint should return both data and capabilities.

Example:

```json
{
  "data": {
    "items": [],
    "total": 0
  },
  "capabilities": {
    "canCreateRide": true,
    "canReadFinancial": false,
    "canEditRide": true,
    "canRecalculateRide": false,
    "canAssignDriver": false
  }
}
```

This allows one page to render different controls without duplicating route trees.

### Migration guidance for current duplicated pages

Consolidate these pairs first:

- `pages/admin/rides/open/index.vue`
- `pages/corporative/rides/open/index.vue`

- `pages/admin/rides/completed/index.vue`
- `pages/corporative/rides/completed/index.vue`

- `pages/admin/rides/edit/[id].vue`
- `pages/corporative/rides/edit/[id].vue`

- `pages/admin/rides/new/index.vue`
- `pages/corporative/rides/new/index.vue`

Recommended extraction order:

1. shared table columns builder
2. shared page-level list component
3. shared edit form
4. shared ride creation flow

## Billing and Pricing Engine V2

### Core principle

The pricing engine must be deterministic, auditable, and versioned.

Rules:

1. same input produces same output
2. closed rides keep their pricing snapshot
3. recalculation must state which formula version was used
4. reporting must separate planned, realized, and billable values

### Three metrics layers

#### Planned metrics

What was sold or estimated before execution.

- planned distance in meters
- planned duration in seconds
- planned polyline
- origin, destination, and planned stops

#### Realized metrics

What actually happened operationally.

- actual path points
- started at
- finished at
- realized distance in meters
- realized duration in seconds
- stopped duration in seconds
- reconstructed route for audit when needed

#### Billable metrics

What enters the invoice.

- billable distance in meters
- billable duration in seconds
- extra distance in meters
- extra duration in seconds
- addons amount

### Product calculation rules

#### Usage products

Example: `EASY` with `type = free`

Formula:

`total = basePrice + realizedKm * kmPrice + realizedMinutes * minutePrice + addons`

Applied to current EASY payload:

- `basePrice = 0`
- `kmPrice = 6.00`
- `minutePrice = 1.00`

#### Contract products

Example: `GOLD` with `type = contract`

Formula:

`total = basePrice + max(0, realizedKm - includedKm) * kmPrice + max(0, realizedMinutes - includedMinutes) * minutePrice + addons`

Applied to current GOLD payload:

- `basePrice = 1100.00`
- `includedKm = 100`
- `includedMinutes = 600`
- `kmPrice = 8.50`
- `minutePrice = 1.85`

### Time handling rule

Use:

- `realizedDurationSeconds = finishedAt - startedAt`
- `stoppedDurationSeconds` as a separate reported metric

Do not blindly add stopped time again if the ride start-to-finish duration already covers the stop window.

### Distance source rule

Store both whenever possible:

1. observed distance from captured path
2. reconstructed distance from route service

Use a declared billing source:

- `observed`
- `reconstructed`
- `fallback`

That makes disputes and audit much easier.

## Recommended Ride Schema Evolution

Keep backward compatibility initially, but add explicit fields.

Suggested Prisma shape using embedded types:

```ts
type RideMetrics {
  distanceMeters   Int?
  durationSeconds  Int?
  polyline         String?
  source           String?
  calculatedAt     DateTime?
}

type RideVariance {
  distanceMeters   Int?
  durationSeconds  Int?
}

type RidePricingSnapshot {
  productId        String?
  productCode      String?
  productName      String?
  productType      String?
  basePrice        String?
  includedKms      Int?
  includedMinutes  Int?
  kmPrice          String?
  minutePrice      String?
  version          Int?
}

type RideBillingBreakdown {
  baseAmount              String?
  distanceAmount          String?
  durationAmount          String?
  extraDistanceMeters     Int?
  extraDistanceAmount     String?
  extraDurationSeconds    Int?
  extraDurationAmount     String?
  addonsAmount            String?
  finalAmount             String?
  version                 Int?
  calculatedAt            DateTime?
}
```

Add to `Rides`:

- `plannedMetrics`
- `realizedMetrics`
- `billableMetrics`
- `varianceMetrics`
- `pricingSnapshot`
- `billingBreakdown`
- `calculationVersion`

### Temporary backward compatibility

Keep writing these during transition:

- `estimatedPrice`
- `rideFinalPrice`
- `billing.ammountWithExtras`

Then migrate readers gradually.

## API Endpoints

### Auth

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

`GET /auth/me` should return:

- user summary
- permissions
- access scope
- navigation capabilities

### Rides

- `GET /rides`
- `GET /rides/:id`
- `POST /rides`
- `PATCH /rides/:id`
- `POST /rides/:id/start`
- `POST /rides/:id/stop/start`
- `POST /rides/:id/stop/finish`
- `POST /rides/:id/finish`
- `POST /rides/:id/recalculate`

### Products and related data

- `GET /products`
- `GET /contracts`
- `GET /branches`

## Example Finish Flow

1. Driver app sends finish command.
2. API validates ride state and idempotency key.
3. API computes realized metrics.
4. API computes billable metrics.
5. API writes pricing snapshot and billing breakdown.
6. API updates ride status to completed.
7. API enqueues commission and notification jobs.
8. API responds immediately with final ride summary.

Only steps 1 to 6 are in the synchronous request path.

## Performance Rules

### Must stay synchronous

- authentication
- authorization checks
- state transition validation
- final price calculation
- ride status persistence

### Must move to background

- push notification dispatch
- commission record creation if non-blocking is acceptable
- analytics fan-out
- external audit integrations

### Recommended performance patterns

- pagination by default on all list endpoints
- indexed filters for status, contract, branch, driver, createdAt
- no large JSON response fields in list views unless explicitly requested
- explicit detail endpoints for heavy payloads such as ride paths

## Security Rules

1. Never rely on UI role checks for data protection.
2. Enforce permissions on every write operation.
3. Enforce scope filters at repository or query-builder level.
4. Use refresh-token rotation.
5. Log all billing recalculations.
6. Store `calculationVersion` on every finalized ride.

## Rollout Strategy

### Phase 1: foundation

- create `um-api`
- connect Prisma and Mongo Atlas
- implement auth and `/auth/me`
- implement permissions and scope resolution

### Phase 2: ride read path

- implement `GET /rides`
- implement `GET /rides/:id`
- return capabilities with responses
- switch `um-desktop` ride lists to read from `um-api`

### Phase 3: pricing engine v2

- implement planned, realized, and billable builders
- implement `POST /rides/:id/recalculate`
- add schema fields for pricing snapshot and billing breakdown

### Phase 4: lifecycle writes

- implement start, stop, finish transitions
- switch `um-driver-app` and `um-desktop` write flows to `um-api`

### Phase 5: background work

- move notifications and commissions to worker queue
- add structured logs and audit records

### Phase 6: UI consolidation

- collapse duplicated admin and corporative ride pages into shared views
- drive differences from capabilities instead of folder duplication

## First Refactor Targets in `um-desktop`

These are the highest-value UI refactors after `um-api` starts serving capabilities:

1. consolidate ride list pages
2. consolidate ride edit page
3. consolidate ride creation page
4. replace route-path middleware checks with capability-aware navigation guards

## Non-Negotiable Rules for Implementation

1. One pricing engine.
2. One authorization model.
3. One query-scope resolver.
4. No critical business calculations in clients.
5. No role-specific duplication when the difference is only data scope or action visibility.

## Suggested First Build Sequence

1. bootstrap `um-api`
2. implement `/auth/login`, `/auth/refresh`, `/auth/me`
3. implement permissions and scope resolution
4. implement `GET /rides`
5. implement `GET /rides/:id`
6. implement pricing engine v2
7. implement finish flow
8. migrate backoffice read path
9. migrate driver app write path
10. remove legacy Nuxt server calculation endpoints

## Success Criteria

The new architecture is successful when:

1. both clients use `um-api` as the only source of truth
2. final ride amount is reproducible from stored inputs and calculation version
3. one shared backoffice screen can serve multiple roles without code duplication
4. data access restrictions are enforced server-side
5. finishing a ride remains fast because non-critical work is queued