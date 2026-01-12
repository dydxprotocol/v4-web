# Domain-Driven Design Guide: fuel-ts-sdk Architecture

**Purpose**: Onboarding guide for developers working with the fuel-ts-sdk module
**Architecture**: Hexagonal Architecture + CQRS + Domain-Driven Design
**Last Updated**: 2026-01-08

---

## Table of Contents

1. [Introduction](#introduction)
2. [Core Concepts](#core-concepts)
3. [Architecture Overview](#architecture-overview)
4. [Tactical DDD Patterns](#tactical-ddd-patterns)
5. [Layer Responsibilities](#layer-responsibilities)
6. [Module Organization](#module-organization)
7. [Adding New Features](#adding-new-features)
8. [What to Expose (and What Not To)](#what-to-expose-and-what-not-to)
9. [Testing Strategy](#testing-strategy)
10. [Common Pitfalls](#common-pitfalls)
11. [Recommended Reading](#recommended-reading)

---

## Introduction

The fuel-ts-sdk implements **Domain-Driven Design (DDD)** with **Hexagonal Architecture** and **CQRS** patterns. This guide will help you understand how to work within this architecture and maintain its integrity as you add features.

### Why DDD?

DDD helps us:

- **Model complex business logic** clearly and maintainably
- **Isolate domain logic** from infrastructure concerns (databases, APIs, frameworks)
- **Create a shared language** between developers and domain experts
- **Maintain boundaries** between different areas of the system

### Architecture Philosophy

> **"Sophisticated design is often less sophisticated than you think."** - Eric Evans

We follow these principles:

1. **Simplicity over ceremony**: No event buses or command buses (we don't need them)
2. **Pure domain core**: Business logic has zero infrastructure dependencies
3. **Explicit dependencies**: All dependencies injected, no hidden coupling
4. **Type safety**: Prevent errors at compile-time, not runtime

---

## Core Concepts

### Bounded Context vs Aggregate vs Module

Understanding these concepts is critical. They operate at different scales:

```
Bounded Context (Strategic DDD - Largest)
    ↓
└── Sub-domains (Business Areas)
        ↓
    └── Aggregates (Transactional Boundaries)
            ↓
        └── Entities + Value Objects (Tactical DDD - Smallest)
```

#### Bounded Context

**Definition**: A linguistic boundary where a particular domain model applies.

**In Our Codebase**: We have one bounded context:

- **Trading Context** ([fuel-ts-sdk/src/trading/](fuel-ts-sdk/src/trading/))

**Characteristics**:

- Has its own ubiquitous language (terms like "Position", "Collateral", "Margin")
- Can communicate with other contexts (like Indexer) via adapters
- Contains related aggregates that change together

**When to create a new Bounded Context**:

- ❌ Not for every new feature
- ❌ Not for technical reasons (different database, different API)
- ✅ Only when the domain language fundamentally changes
- ✅ Example: If we add "Governance" (voting, proposals), that might be a new context

#### Aggregate

**Definition**: A cluster of domain objects (entities + value objects) treated as a single unit for data changes. One entity is the **aggregate root**.

**In Our Codebase**:

- **Position Aggregate**: Root entity is `Position`, contains position-specific value objects
- **MarketConfig Aggregate**: Root entity is `MarketConfig`, contains margin rules

**Characteristics**:

- Enforces business invariants (rules that must always be true)
- Has a transactional boundary (all changes are atomic)
- External objects reference aggregates only by ID, not by object reference
- Keep aggregates small (single entity + value objects is ideal)

**Example - Position Aggregate**:

```typescript
// Aggregate Root
export type Position = {
  revisionId: PositionRevisionId; // Identity
  positionKey: PositionKey; // Composite identity
  collateralAmount: CollateralAmount; // Value Object
  size: PositionSize; // Value Object
  // ... other value objects
};

// Invariant enforcement (in domain calculations)
export function calculatePositionLeverage(position: Position): RatioOutput {
  if (position.collateralAmount.value <= 0n) {
    return zero(RatioOutput); // Invariant: zero collateral = zero leverage
  }
  // Business rule enforced
  return DecimalCalculator.value(position.size)
    .divideBy(position.collateralAmount)
    .calculate(RatioOutput);
}
```

**When to create a new Aggregate**:

- ✅ When you have a new entity with its own lifecycle
- ✅ When you need to enforce invariants on a cluster of objects
- ❌ Not for every entity (entities can belong to existing aggregates)

#### Module (Technical Organization)

**Definition**: A code organization unit (folder structure). Not a DDD concept, but important for maintainability.

**In Our Codebase**:

```
trading/                          # Bounded Context
├── src/
│   ├── positions/               # Module for Positions aggregate
│   │   ├── domain/              # Position aggregate lives here
│   │   ├── application/         # Position commands/queries
│   │   └── infrastructure/      # Position repositories/Redux
│   ├── markets/                 # Module for Markets aggregate
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── domain/                  # Cross-aggregate pure logic (optional)
│   └── application/             # Cross-aggregate operations
│       ├── commands/
│       ├── queries/
│       └── workflows/
```

**Module Guidelines**:

- Each module should map to a sub-domain or aggregate
- Modules expose public API via `index.ts`
- Modules never import from other modules' internal files
- Keep modules cohesive (high cohesion within, low coupling between)

---

## Two Architectural Levels: Aggregate vs Bounded Context

**Critical distinction**: The architecture has **two separate levels** with similar but distinct structures.

### Level 1: Aggregate Structure (e.g., `positions/`, `markets/`)

**Purpose**: Organize a single aggregate root and its operations.

```
positions/                        # AGGREGATE MODULE
├── domain/
│   ├── positions.entity.ts      # Position entity
│   ├── positions.calculations.ts # Pure functions on Position
│   ├── positions.decimals.ts    # Position value objects
│   └── positions.port.ts        # PositionRepository interface
├── application/
│   ├── commands/                # Atomic operations on Position
│   │   └── fetch-positions.ts
│   └── queries/                 # Atomic queries for Position
│       └── get-positions.ts
└── infrastructure/
    ├── repositories/            # Position data access
    └── redux/                   # Position state management
```

**Key characteristics**:

- ✅ Works with **single aggregate** (Position)
- ✅ Domain layer has **entity + pure calculations**
- ✅ Application layer has **atomic commands/queries**
- ❌ No workflows (those live at BC level)
- ❌ No cross-aggregate logic

### Level 2: Bounded Context Structure (e.g., `trading/`)

**Purpose**: Organize cross-aggregate operations for the entire bounded context.

```
trading/                          # BOUNDED CONTEXT
├── src/
│   ├── positions/               # Position aggregate (Level 1)
│   ├── markets/                 # Markets aggregate (Level 1)
│   │
│   ├── domain/                  # Cross-aggregate PURE logic (optional)
│   │   └── risk-calculator.ts  # Pure functions using Position + MarketConfig
│   │
│   └── application/             # Cross-aggregate operations
│       ├── commands/            # Atomic cross-aggregate commands
│       ├── queries/             # Atomic cross-aggregate queries
│       └── workflows/           # Composite operations
└── di.ts                        # Dependency injection root
```

**Key characteristics**:

- ✅ Coordinates **multiple aggregates** (Position + MarketConfig)
- ✅ Domain layer (if exists) has **pure cross-aggregate calculations**
- ✅ Application layer has **cross-aggregate commands/queries + workflows**
- ✅ Workflows compose atomic operations

### The Key Differences

| Aspect                | Aggregate Level        | Bounded Context Level                     |
| --------------------- | ---------------------- | ----------------------------------------- |
| **Scope**             | Single aggregate       | Multiple aggregates                       |
| **Domain layer**      | Entity + calculations  | Pure cross-aggregate functions (optional) |
| **Application layer** | Atomic operations only | Atomics + workflows                       |
| **Entities**          | Lives here             | Never here (always in aggregates)         |
| **Workflows**         | Never here             | Lives here                                |

### When to Put Logic Where

**Single-aggregate calculation** → `positions/domain/positions.calculations.ts`:

```typescript
export function calculatePositionLeverage(position: Position): RatioOutput {
  // Only uses Position
}
```

**Cross-aggregate calculation** → `trading/src/domain/risk-calculator.ts`:

```typescript
export function calculateLiquidationPrice(position: Position, config: MarketConfig): OraclePrice {
  // Uses Position AND MarketConfig
}
```

**Single-aggregate command** → `positions/application/commands/`:

```typescript
export const createFetchPositions = (store) => async (address: Address) => {
  // Only fetches positions
};
```

**Cross-aggregate workflow** → `trading/src/application/workflows/`:

```typescript
export const createFetchPositionBundle = (store) => async (positionId) => {
  await fetchPosition(positionId); // Position aggregate
  const position = getPosition(positionId);
  await fetchMarketConfig(position.marketId); // Market aggregate
  return { position, config: getMarketConfig(position.marketId) };
};
```

**Rule of thumb**: If it touches one aggregate → aggregate level. If it coordinates multiple → BC level.

---

## Architecture Overview

### The Three Layers (Hexagonal Architecture)

```
┌─────────────────────────────────────────────────────┐
│                   Application                       │
│            (Commands, Queries, DI)                  │
│                        ↑                            │
│         ┌──────────────┼──────────────┐            │
│         │              │               │            │
│    ┌────▼────┐    ┌───▼────┐    ┌────▼─────┐      │
│    │ Domain  │    │ Domain │    │ Domain   │      │
│    │ Service │    │ Model  │    │ Service  │      │
│    └─────────┘    └────────┘    └──────────┘      │
│                   (Core Logic)                      │
│                        ↑                            │
└────────────────────────┼────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │                               │
    ┌────▼─────┐                   ┌────▼─────┐
    │ GraphQL  │                   │  Redux   │
    │ Adapter  │                   │ Adapter  │
    └──────────┘                   └──────────┘
    (Infrastructure)                (Infrastructure)
```

#### Layer 1: Domain (Core)

**Location**: `*/domain/`

**Contains**:

- Entities
- Value Objects
- Domain Services
- Port Interfaces (repository contracts)
- Pure business logic calculations

**Rules**:

- ✅ Can import from shared kernel only
- ❌ Cannot import from application layer
- ❌ Cannot import from infrastructure layer
- ❌ No framework dependencies (Redux, GraphQL, etc.)

**Example**:

```typescript
// domain/positions.calculations.ts
export function calculatePositionLeverage(position: Position): RatioOutput {
  if (position.collateralAmount.value <= 0n) {
    return zero(RatioOutput);
  }
  return DecimalCalculator.value(position.size)
    .divideBy(position.collateralAmount)
    .calculate(RatioOutput);
}
// ✅ Pure function, no dependencies
// ✅ Uses domain types only
// ✅ Testable without mocks
```

#### Layer 2: Application (Use Cases)

**Location**: `*/application/`

**Contains**:

- Commands (write operations)
- Queries (read operations)
- Application services
- Use case orchestration

**Rules**:

- ✅ Can import from domain layer
- ✅ Can depend on port interfaces (not implementations)
- ❌ Cannot import infrastructure implementations directly
- Dependencies injected via factories

**Example**:

```typescript
// application/queries/get-positions-by-address.ts
export const createGetAccountPositions =
  (
    storeService: StoreService // Dependency injected
  ) =>
  (
    address: Address
  ): Position[] => // Domain types
    selectLatestPositionsByAccount(
      // Pure query
      storeService.getState(),
      address
    );

// ✅ Depends on abstraction (StoreService)
// ✅ Returns domain types
// ✅ No infrastructure details
```

#### Layer 3: Infrastructure (Technical Details)

**Location**: `*/infrastructure/`

**Contains**:

- Repository implementations (adapters)
- Redux state management
- GraphQL queries
- Mappers (DTO → Domain)

**Rules**:

- ✅ Can import from domain and application
- ✅ Implements port interfaces from domain
- ✅ All framework code lives here
- ❌ Should not contain business logic

**Example**:

```typescript
// infrastructure/repositories/graphql-positions-repository/di.ts
export const createGraphQLPositionRepository = (client: GraphQLClient): PositionRepository => ({
  // Implements domain port
  getPositionsByStableId: getPositionsByStableId(client),
  getPositionsByAccount: getPositionsByAccount(client),
});

// ✅ Implements domain interface
// ✅ GraphQL details hidden in infrastructure
// ✅ Can be swapped for different implementation
```

---

## Tactical DDD Patterns

### 1. Entities

**Definition**: Objects with identity that persists over time, even if attributes change.

**Characteristics**:

- Has a unique identifier
- Can be mutated (though we use immutable updates)
- Identity is stable across lifecycle

**When to use**:

- ✅ Object has lifecycle (created, modified, deleted)
- ✅ Identity matters more than attributes
- ✅ Need to track object over time

**Example**:

```typescript
// domain/positions.entity.ts
export type Position = {
  // Identity (what makes it unique)
  revisionId: PositionRevisionId; // Snapshot identity
  positionKey: {
    id: PositionStableId; // Permanent identity
    account: Address;
    indexAssetId: AssetId;
    isLong: boolean;
  };

  // Attributes (can change)
  collateralAmount: CollateralAmount;
  size: PositionSize;
  status: PositionStatus;
  // ...
};

// Two positions are the same if they have same ID
// Even if collateral/size changes, it's still the same position
```

**Identity Patterns**:

```typescript
// Stable ID - never changes
export const positionStableId = (id: string): PositionStableId => PositionStableIdSchema.parse(id);

// Revision ID - tracks versions
export const positionRevisionId = (id: string): PositionRevisionId =>
  PositionRevisionIdSchema.parse(id);
```

---

### 2. Value Objects

**Definition**: Objects defined by their attributes, not identity. Immutable and replaceable.

**Characteristics**:

- No unique identifier
- Immutable (cannot be changed after creation)
- Equality by value (two objects with same values are equal)
- Side-effect-free methods

**When to use**:

- ✅ Measuring, quantifying, or describing something
- ✅ Immutability desired
- ✅ No lifecycle
- ✅ Prevents primitive obsession (passing raw numbers/strings)

**Example**:

```typescript
// shared/models/decimalValue.ts
export abstract class DecimalValue {
  private constructor(
    readonly value: bigint, // Immutable
    readonly decimals: bigint
  ) {}

  // Side-effect-free method
  equals(other: this): boolean {
    return this.value === other.value;
  }

  // Cannot mutate, only create new instance
  static create(value: bigint): this {
    /* ... */
  }
}

// Domain-specific value objects
export class UsdValue extends DecimalValue {
  static decimals = 9n as const;
}

export class CollateralAmount extends DecimalValue {
  static decimals = 9n as const;
}

// Usage
const collateral = CollateralAmount.create(100_000_000_000n);
const usd = UsdValue.create(100_000_000_000n);

// ✅ Type system prevents mixing different value types
// collateral.equals(usd); // ❌ Compile error!
```

**Branded Types** (Lightweight Value Objects):

```typescript
// shared/types.ts
export const AddressSchema = z.string().brand<'Address'>();
export type Address = z.infer<typeof AddressSchema>;

export const AssetIdSchema = z.string().brand<'AssetId'>();
export type AssetId = z.infer<typeof AssetIdSchema>;

// Usage
const address = address('0x1234...'); // Branded as Address
const assetId = assetId('0xabcd...'); // Branded as AssetId

// ✅ Cannot mix up types
function getPositions(addr: Address) {
  /* ... */
}
getPositions(assetId); // ❌ Compile error! AssetId is not Address
```

**Value Object Guidelines**:

- Make them immutable (`readonly` fields)
- Use branded types for simple values (strings, numbers)
- Use classes for complex values (decimals, money, coordinates)
- Validate in constructor/factory
- Implement `equals()` for value comparison

---

### 3. Aggregates & Aggregate Roots

**Definition**: Cluster of entities and value objects treated as a single unit for data changes.

**Characteristics**:

- One entity is the **aggregate root** (entry point)
- External objects hold references to root only, not internal entities
- Root enforces invariants
- Transaction boundary (all-or-nothing changes)

**Current Aggregates**:

#### Position Aggregate

```typescript
// Aggregate Root: Position
export type Position = {
  revisionId: PositionRevisionId;
  positionKey: PositionKey; // Identity
  collateralAmount: CollateralAmount; // Value Object
  size: PositionSize; // Value Object
  // ... other value objects
};

// Invariants enforced through domain logic
export function calculatePositionLeverage(position: Position): RatioOutput {
  // Business rule: zero collateral = zero leverage
  if (position.collateralAmount.value <= 0n) {
    return zero(RatioOutput);
  }
  return DecimalCalculator.value(position.size)
    .divideBy(position.collateralAmount)
    .calculate(RatioOutput);
}
```

#### MarketConfig Aggregate

```typescript
// Aggregate Root: MarketConfig
export type MarketConfig = {
  id: MarketConfigId; // Identity
  indexAssetId: AssetId;
  initialMarginFraction: InitialMarginFraction; // Value Object
  maintenanceMarginFraction: MaintenanceMarginFraction;
  // Invariant: initialMargin > maintenanceMargin enforced at creation
};
```

**Aggregate Design Rules**:

1. **Keep aggregates small**: Single entity + value objects is ideal

   ```typescript
   // ✅ Good: Small aggregate
   type Position = {
     id: PositionId,
     size: PositionSize,
     collateral: CollateralAmount,
   };

   // ❌ Bad: Bloated aggregate
   type Position = {
     id: PositionId,
     market: Market,           // Don't embed entire aggregate
     owner: User,              // Don't embed entire aggregate
     trades: Trade[],          // Don't embed collection
   };

   // ✅ Good: Reference by ID
   type Position = {
     id: PositionId,
     marketId: MarketId,       // Reference by ID
     ownerId: UserId,          // Reference by ID
   };
   ```

2. **Reference other aggregates by ID only**:

   ```typescript
   // ✅ Good
   export type Position = {
     indexAssetId: AssetId,    // Reference to MarketConfig aggregate by ID
   };

   // ❌ Bad
   export type Position = {
     marketConfig: MarketConfig,  // Don't hold entire aggregate
   };
   ```

3. **One repository per aggregate root**:

   ```typescript
   // ✅ Good: Repository for Position aggregate
   export interface PositionRepository {
     getPositionsByStableId(id: PositionStableId): Promise<Position[]>;
     getPositionsByAccount(account: Address): Promise<Position[]>;
   }

   // ❌ Bad: Repository for internal entity
   export interface CollateralRepository {
     // Don't do this!
     getCollateral(id: CollateralId): Promise<CollateralAmount>;
   }
   ```

4. **Enforce invariants at aggregate boundary**:
   ```typescript
   // Domain validation ensures invariants
   export const MarketConfigSchema = z
     .object({
       initialMarginFraction: InitialMarginFractionSchema,
       maintenanceMarginFraction: MaintenanceMarginFractionSchema,
     })
     .refine((data) => data.initialMarginFraction > data.maintenanceMarginFraction, {
       message: 'Initial margin must exceed maintenance margin',
     });
   ```

---

### 4. Domain Services

**Definition**: Pure functions that work with multiple aggregates. Same as `positions.calculations.ts` but cross-aggregate.

**When to use**:

- ✅ Logic involves **objects from multiple aggregates**
- ✅ Operation doesn't conceptually belong to any single entity
- ✅ Pure calculation (no state reading, no infrastructure)

**When NOT to use**:

- ❌ Logic naturally belongs to an entity (put it in aggregate's domain/calculations)
- ❌ Needs to read state or call repositories (that's application service)
- ❌ Takes IDs as parameters (that's application service)

**Example - Cross-Aggregate Pure Logic**:

```typescript
// trading/src/domain/risk-calculator.ts
export function calculateLiquidationPrice(
  position: Position, // Object from Position aggregate
  config: MarketConfig // Object from MarketConfig aggregate
): OraclePrice {
  // Pure calculation using both aggregates
  const maintenanceMargin = DecimalCalculator.value(position.notional)
    .multiplyBy(config.maintenanceMarginFraction)
    .calculate(UsdValue);

  const marginRatio = DecimalCalculator.value(maintenanceMargin)
    .divideBy(position.collateralAmount)
    .calculate(RatioOutput);

  return DecimalCalculator.value(position.entryPrice)
    .multiplyBy(RatioOutput.create(1n - marginRatio.value))
    .calculate(OraclePrice);
}

// ✅ Pure function (no side effects)
// ✅ Takes objects as parameters (not IDs)
// ✅ No state reading, no repositories
// ✅ Easily unit testable
```

**Domain Service Guidelines**:

- Make them pure functions (no side effects)
- Take **objects** as parameters, never IDs
- No state reading, no repository calls
- Keep in `trading/src/domain/` (cross-aggregate) or skip this folder if you don't have any
- Same pattern as `positions.calculations.ts`, just cross-aggregate

**NOT a Domain Service** (this is an application service):

```typescript
// ❌ This belongs in application layer, NOT domain
export const createCalculateRisk = (deps) => (positionId: PositionId) => {
  const position = deps.getPosition(positionId); // ❌ Reads state
  const config = deps.getMarketConfig(position.marketId);
  return calculateRisk(position, config);
};
```

---

### 5. Repositories

**Definition**: Provides illusion of in-memory collection of aggregates. Abstracts data access.

**Pattern**: Port (interface) in domain, Adapter (implementation) in infrastructure

**Port (Domain Layer)**:

```typescript
// domain/positions.port.ts
export interface PositionRepository {
  // Collection-like interface
  getPositionsByStableId(stableId: PositionStableId, latestOnly?: boolean): Promise<Position[]>;
  getPositionsByAccount(account: Address, latestOnly?: boolean): Promise<Position[]>;
}

// ✅ Returns domain types (Position)
// ✅ Uses domain concepts (PositionStableId, Address)
// ✅ No infrastructure details (no GraphQL, SQL, etc.)
```

**Adapter (Infrastructure Layer)**:

```typescript
// infrastructure/repositories/graphql-positions-repository/di.ts
export const createGraphQLPositionRepository = (client: GraphQLClient): PositionRepository => ({
  getPositionsByStableId: getPositionsByStableId(client),
  getPositionsByAccount: getPositionsByAccount(client),
});

// ✅ Implements domain port interface
// ✅ GraphQL details hidden here
// ✅ Can be swapped for different data source
```

**Mapper (Anti-Corruption Layer)**:

```typescript
// infrastructure/repositories/graphql-positions-repository/mappers.ts
export function toDomainPosition(gql: GraphQLPosition): Position {
  return PositionSchema.parse({
    // Validates during translation
    revisionId: positionRevisionId(gql.id),
    positionKey: {
      id: positionStableId(gql.positionKey.id),
      account: address(gql.positionKey.account),
      indexAssetId: assetId(gql.positionKey.indexAssetId),
      isLong: gql.positionKey.isLong,
    },
    collateralAmount: BigInt(gql.collateralAmount),
    // ... translate all fields
  });
}

// ✅ Shields domain from GraphQL types
// ✅ Validates during translation (Zod schema)
// ✅ Converts infrastructure types → domain types
```

**Repository Guidelines**:

1. **One repository per aggregate root**
2. **Interface in domain layer** (port)
3. **Implementation in infrastructure layer** (adapter)
4. **Always use mappers** to translate external types to domain types
5. **Collection semantics**: Name methods like collections (`getAll`, `findBy`, `save`)

---

### 6. Application Services (Commands & Queries)

**Definition**: Orchestrate use cases. Thin layer coordinating domain objects and infrastructure.

**CQRS Pattern**: Separate commands (writes) from queries (reads)

#### Commands (Write Operations)

**Characteristics**:

- Change state
- Return `void` or `Promise<void>` (don't return data)
- May trigger side effects

**Example**:

```typescript
// application/commands/fetch-positions-by-account.ts
export const createFetchPositionsByAccount =
  (
    store: StoreService // Dependency injected
  ) =>
  async (address: Address) => {
    // Domain type
    // Orchestrates infrastructure to update state
    await store.dispatch(positionsApi.endpoints.getPositionsByAddress.initiate(address)).unwrap();
  };

// ✅ Changes state (fetches and stores positions)
// ✅ Returns Promise<void> (no data returned)
// ✅ Thin orchestration (no business logic)
```

#### Queries (Read Operations)

**Characteristics**:

- Read-only (no state changes)
- Return data
- Pure functions (no side effects)

**Example**:

```typescript
// application/queries/get-positions-by-address.ts
export const createGetAccountPositions =
  (
    storeService: StoreService // Dependency injected
  ) =>
  (
    address: Address
  ): Position[] => // Returns domain types
    selectLatestPositionsByAccount(
      // Pure read
      storeService.getState(),
      address
    );

// ✅ Read-only (no state changes)
// ✅ Returns data (Position[])
// ✅ Pure function (deterministic)
```

#### Workflows (Composite Operations)

**Definition**: Application services that **compose** commands and queries. Optional convenience layer.

**Characteristics**:

- Orchestrate multiple atomic operations
- Can return data (not pure commands)
- Encode business procedures
- Only exist at **bounded context level** (not aggregate level)

**Example**:

```typescript
// trading/src/application/workflows/fetch-position-bundle.ts
export const createFetchPositionBundle =
  (deps: {
    fetchPosition: Command;
    fetchMarketConfig: Command;
    getPosition: Query;
    getMarketConfig: Query;
  }) =>
  async (positionId: PositionId) => {
    // Orchestrates atomic operations
    await deps.fetchPosition(positionId); // Command from positions/application
    const position = deps.getPosition(positionId); // Query from positions/application

    await deps.fetchMarketConfig(position.marketId); // Command from markets/application
    const config = deps.getMarketConfig(position.marketId); // Query from markets/application

    return { position, config }; // ✅ Workflows can return data
  };

// ✅ Composes atomic operations
// ✅ Doesn't directly touch infrastructure (calls commands/queries that do)
// ✅ Encodes business procedure: "get position with its market config"
```

**When to create workflows**:

- ✅ Operation encodes a **business procedure** (domain experts would recognize it)
- ✅ Composition has business meaning (not just batching for convenience)

**When NOT to create workflows**:

- ❌ Just batching operations with no business logic
- ❌ Pure convenience with no domain meaning

**Workflows vs Commands/Queries**:

```typescript
// Atomic command (positions/application/commands/)
export const fetchPositions = (store) => async (address) => {
  await store.dispatch(positionsApi.endpoints.fetch.initiate(address));
};

// Atomic query (positions/application/queries/)
export const getPositions = (store) => (address) => {
  return selectPositions(store.getState(), address);
};

// Workflow (trading/src/application/workflows/)
export const fetchAndCalculateRisk = (deps) => async (address) => {
  await deps.fetchPositions(address); // Uses atomic command
  await deps.fetchMarketConfigs(); // Uses atomic command

  const positions = deps.getPositions(address); // Uses atomic query
  const configs = deps.getMarketConfigs(); // Uses atomic query

  // Delegates to domain service for calculation
  return calculatePortfolioRisk(positions, configs);
};
```

**Application Service Guidelines**:

- Keep them thin (orchestration only, no business logic)
- Business logic belongs in domain layer
- Use factory pattern for dependency injection
- Commands don't return data, queries don't change state (but workflows can return)
- Always use domain types in signatures (not infrastructure types)
- Workflows only at BC level (`trading/src/application/workflows/`)

---

## Layer Responsibilities

### What Goes Where?

```
┌──────────────────────────────────────────────────────────────┐
│ Domain Layer (Pure Business Logic)                          │
├──────────────────────────────────────────────────────────────┤
│ ✅ Entities                                                  │
│ ✅ Value Objects                                             │
│ ✅ Domain calculations (pure functions)                      │
│ ✅ Business rules                                            │
│ ✅ Port interfaces (repository contracts)                    │
│ ✅ Domain services (cross-aggregate logic)                   │
│                                                               │
│ ❌ No Redux                                                  │
│ ❌ No GraphQL                                                │
│ ❌ No HTTP/network calls                                     │
│ ❌ No framework dependencies                                 │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Application Layer (Use Cases)                               │
├──────────────────────────────────────────────────────────────┤
│ ✅ Commands (write operations)                               │
│ ✅ Queries (read operations)                                 │
│ ✅ Use case orchestration                                    │
│ ✅ Application services                                      │
│ ✅ Dependency injection factories                            │
│                                                               │
│ ❌ No business logic (that goes in domain)                   │
│ ❌ No infrastructure details (GraphQL, Redux internals)      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Infrastructure Layer (Technical Details)                    │
├──────────────────────────────────────────────────────────────┤
│ ✅ Repository implementations                                │
│ ✅ GraphQL queries                                           │
│ ✅ Redux slices, thunks, selectors                           │
│ ✅ Mappers (DTO → Domain)                                    │
│ ✅ Framework code                                            │
│                                                               │
│ ❌ No business logic                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Module Organization

### Module Structure Template

```
my-new-feature/
├── domain/
│   ├── my-feature.entity.ts       # Entities (identity + lifecycle)
│   ├── my-feature.decimals.ts     # Value objects (if needed)
│   ├── my-feature.schemas.ts      # Zod schemas for validation
│   ├── my-feature.calculations.ts # Pure business logic
│   ├── my-feature.port.ts         # Repository interface
│   └── index.ts                   # Public domain API
├── application/
│   ├── commands/
│   │   ├── my-command.ts
│   │   └── di.ts                  # Command factory
│   ├── queries/
│   │   ├── my-query.ts
│   │   └── di.ts                  # Query factory
│   └── index.ts                   # Public application API
├── infrastructure/
│   ├── repositories/
│   │   └── graphql-my-feature-repository/
│   │       ├── di.ts              # Adapter factory
│   │       ├── queries.gql.ts     # GraphQL queries
│   │       ├── get-*.ts           # Implementation methods
│   │       └── mappers.ts         # DTO → Domain
│   ├── redux/
│   │   └── my-feature/
│   │       ├── slice.ts           # State + reducers
│   │       ├── api.ts             # RTK Query endpoints
│   │       ├── thunks.ts          # Async operations
│   │       ├── selectors.ts       # State queries
│   │       └── index.ts           # Redux exports
│   └── index.ts                   # Infrastructure exports
└── index.ts                       # Module public API
```

### Module Exports Pattern

**Root `index.ts`** (module public API):

```typescript
// index.ts
export * from './application'; // Commands & Queries
export * from './domain'; // Entities, Value Objects, Ports
export * as myFeatureAdapters from './infrastructure'; // Namespaced!

export {
  myFeatureMiddleware,
  myFeatureReducer,
  type MyFeatureThunkExtra,
} from './infrastructure/redux';
```

**Why namespace infrastructure?**

- ✅ Prevents accidental coupling to implementation details
- ✅ Makes it obvious when infrastructure is imported
- ✅ Easier to swap implementations

**Usage**:

```typescript
// ✅ Good: Use public API
import { MyEntity, createMyFeatureCommands } from '../my-feature';
// ❌ Bad: Import internals directly
import { myFeatureSlice } from '../my-feature/infrastructure/redux/my-feature/slice';
```

---

## Adding New Features

### Step-by-Step Guide

#### 1. Understand the Domain First

Before writing code:

1. **Talk to domain experts** (or understand business requirements)
2. **Identify the entities**: What has identity and lifecycle?
3. **Identify value objects**: What are measurements/quantities?
4. **Identify aggregates**: What must change together?
5. **Identify invariants**: What rules must always be true?

**Example**: Adding "Trade History" feature

**Analysis**:

- **Entity**: `Trade` (has identity, lifecycle: created, settled)
- **Value Objects**: `TradePrice`, `TradeVolume`, `TradeFee`
- **Aggregate**: `Trade` (aggregate root), may reference `Position` by ID
- **Invariants**: Trade volume > 0, Trade price > 0

#### 2. Start with Domain Layer

**Step 2.1: Define Value Objects**

```typescript
// domain/trades.decimals.ts
import { DecimalValue } from '@/shared/models/decimalValue';

export class TradePrice extends DecimalValue {
  declare __brand: typeof TradePrice;
  static decimals = 9n as const;
}

export class TradeVolume extends DecimalValue {
  declare __brand: typeof TradeVolume;
  static decimals = 9n as const;
}

export class TradeFee extends DecimalValue {
  declare __brand: typeof TradeFee;
  static decimals = 9n as const;
}
```

**Step 2.2: Define Branded Types**

```typescript
// domain/trades.types.ts
import { z } from 'zod';

export const TradeIdSchema = z.string().brand<'TradeId'>();
export type TradeId = z.infer<typeof TradeIdSchema>;

export const tradeId = (id: string): TradeId => TradeIdSchema.parse(id);
```

**Step 2.3: Define Entity**

```typescript
// domain/trades.entity.ts
import { z } from 'zod';
import { Address, AssetId, Timestamp } from '@/shared/types';
import { TradeFeeSchema, TradePriceSchema, TradeVolumeSchema } from './trades.decimals';
import { TradeIdSchema } from './trades.types';

export enum TradeSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export const TradeSchema = z.object({
  id: TradeIdSchema,
  positionId: PositionStableIdSchema, // Reference to Position aggregate
  account: AddressSchema,
  assetId: AssetIdSchema,
  side: z.nativeEnum(TradeSide),
  price: TradePriceSchema,
  volume: TradeVolumeSchema,
  fee: TradeFeeSchema,
  timestamp: TimestampSchema,
});

export type Trade = z.infer<typeof TradeSchema>;
```

**Step 2.4: Define Domain Logic**

```typescript
// domain/trades.calculations.ts
import { UsdValue } from '@/shared/models/decimals';
import { DecimalCalculator } from '@/shared/utils/decimalCalculator';
import { Trade } from './trades.entity';

export function calculateTradeNotional(trade: Trade): UsdValue {
  return DecimalCalculator.value(trade.price).multiplyBy(trade.volume).calculate(UsdValue);
}

export function calculateNetValue(trade: Trade): UsdValue {
  const notional = calculateTradeNotional(trade);
  return DecimalCalculator.value(notional).subtract(trade.fee).calculate(UsdValue);
}

// ✅ Pure functions
// ✅ No infrastructure dependencies
// ✅ Easily testable
```

**Step 2.5: Define Repository Port**

```typescript
// domain/trades.port.ts
import { Address, PositionStableId } from '@/shared/types';
import { Trade } from './trades.entity';
import { TradeId } from './trades.types';

export interface TradeRepository {
  getTradeById(id: TradeId): Promise<Trade | null>;
  getTradesByAccount(account: Address): Promise<Trade[]>;
  getTradesByPosition(positionId: PositionStableId): Promise<Trade[]>;
}

// ✅ Domain interface
// ✅ Uses domain types only
// ✅ No implementation details
```

**Step 2.6: Export Domain API**

```typescript
// domain/index.ts
export * from './trades.entity';
export * from './trades.types';
export * from './trades.decimals';
export * from './trades.calculations';
export * from './trades.port';
export * from './trades.schemas';
```

#### 3. Implement Infrastructure Layer

**Step 3.1: Create GraphQL Repository**

```typescript
// infrastructure/repositories/graphql-trades-repository/queries.gql.ts
export const GET_TRADES_BY_ACCOUNT = gql`
  query GetTradesByAccount($account: String!) {
    trades(where: { account: $account }) {
      id
      positionId
      account
      assetId
      side
      price
      volume
      fee
      timestamp
    }
  }
`;
```

**Step 3.2: Create Mapper**

```typescript
// infrastructure/repositories/graphql-trades-repository/mappers.ts
import { address, assetId, positionStableId, timestamp } from '@/shared/types';
import { Trade, TradeSchema } from '../../../domain/trades.entity';
import { tradeId } from '../../../domain/trades.types';

type GraphQLTrade = {
  id: string;
  positionId: string;
  account: string;
  assetId: string;
  side: string;
  price: string;
  volume: string;
  fee: string;
  timestamp: number;
};

export function toDomainTrade(gql: GraphQLTrade): Trade {
  return TradeSchema.parse({
    id: tradeId(gql.id),
    positionId: positionStableId(gql.positionId),
    account: address(gql.account),
    assetId: assetId(gql.assetId),
    side: gql.side,
    price: BigInt(gql.price),
    volume: BigInt(gql.volume),
    fee: BigInt(gql.fee),
    timestamp: timestamp(gql.timestamp),
  });
}

// ✅ Validates with Zod schema
// ✅ Converts infrastructure types → domain types
// ✅ Anti-corruption layer
```

**Step 3.3: Implement Repository Methods**

```typescript
// infrastructure/repositories/graphql-trades-repository/get-trades-by-account.ts
import { GraphQLClient } from 'graphql-request';
import { Address } from '@/shared/types';
import { Trade } from '../../../domain/trades.entity';
import { toDomainTrade } from './mappers';
import { GET_TRADES_BY_ACCOUNT } from './queries.gql';

export const getTradesByAccount =
  (client: GraphQLClient) =>
  async (account: Address): Promise<Trade[]> => {
    const response = await client.request(GET_TRADES_BY_ACCOUNT, { account });
    return response.trades.map(toDomainTrade);
  };
```

**Step 3.4: Create Repository Factory**

```typescript
// infrastructure/repositories/graphql-trades-repository/di.ts
import { GraphQLClient } from 'graphql-request';
import { TradeRepository } from '../../../domain/trades.port';
import { getTradeById } from './get-trade-by-id';
import { getTradesByAccount } from './get-trades-by-account';
import { getTradesByPosition } from './get-trades-by-position';

export const createGraphQLTradeRepository = (client: GraphQLClient): TradeRepository => ({
  getTradeById: getTradeById(client),
  getTradesByAccount: getTradesByAccount(client),
  getTradesByPosition: getTradesByPosition(client),
});

// ✅ Implements domain port interface
// ✅ Factory pattern for DI
// ✅ Can be swapped for different implementation
```

**Step 3.5: Create Redux State Management**

```typescript
// infrastructure/redux/trades/trades.slice.ts
import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { Trade } from '../../../domain/trades.entity';
import { TradeId } from '../../../domain/trades.types';

const tradesAdapter = createEntityAdapter<Trade>({
  selectId: (trade) => trade.id,
});

export const tradesSlice = createSlice({
  name: 'trades',
  initialState: tradesAdapter.getInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder.addMatcher(tradesApi.endpoints.getTradesByAccount.matchFulfilled, (state, action) => {
      if (action.payload) tradesAdapter.upsertMany(state, action.payload);
    });
  },
});

export const tradesReducer = tradesSlice.reducer;
```

**Step 3.6: Create RTK Query API**

```typescript
// infrastructure/redux/trades/trades.api.ts
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { Address } from '@/shared/types';
import { Trade } from '../../../domain/trades.entity';
import { TradeRepository } from '../../../domain/trades.port';

export type TradesThunkExtra = {
  tradeRepository: TradeRepository;
};

export const tradesApi = createApi({
  reducerPath: 'tradesApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['trades-by-account', 'trades-by-position'],
  endpoints: (builder) => ({
    getTradesByAccount: builder.query<Trade[], Address>({
      async queryFn(account: Address, api) {
        const { tradeRepository } = api.extra as TradesThunkExtra;
        const result = await tradeRepository.getTradesByAccount(account);
        return { data: result ?? [] };
      },
      providesTags: (_result, _error, arg) => [{ type: 'trades-by-account', id: arg }],
    }),
  }),
});

export const { useGetTradesByAccountQuery } = tradesApi;
```

**Step 3.7: Create Selectors**

```typescript
// infrastructure/redux/trades/trades.selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { createEntityAdapter } from '@reduxjs/toolkit';
import { Address, PositionStableId } from '@/shared/types';
import { Trade } from '../../../domain/trades.entity';
import { RootState } from '../../store';

const tradesAdapter = createEntityAdapter<Trade>({
  selectId: (trade) => trade.id,
});

const tradesSelectors = tradesAdapter.getSelectors((state: RootState) => state.trades);

export const selectTradesByAccount = createSelector(
  [tradesSelectors.selectAll, (_state, account: Address) => account],
  (trades, account) => trades.filter((trade) => trade.account === account)
);

export const selectTradesByPosition = createSelector(
  [tradesSelectors.selectAll, (_state, positionId: PositionStableId) => positionId],
  (trades, positionId) => trades.filter((trade) => trade.positionId === positionId)
);
```

#### 4. Implement Application Layer

**Step 4.1: Create Commands**

```typescript
// application/commands/fetch-trades-by-account.ts
import { StoreService } from '@/shared/lib/store';
import { Address } from '@/shared/types';
import { tradesApi } from '../../infrastructure/redux/trades/trades.api';

export const createFetchTradesByAccount = (store: StoreService) => async (address: Address) => {
  await store.dispatch(tradesApi.endpoints.getTradesByAccount.initiate(address)).unwrap();
};

// ✅ Thin orchestration
// ✅ Returns Promise<void> (command pattern)
// ✅ Updates read model
```

**Step 4.2: Create Command Factory**

```typescript
// application/commands/di.ts
import { StoreService } from '@/shared/lib/store';
import { createFetchTradesByAccount } from './fetch-trades-by-account';

export const createTradeCommands = (store: StoreService) => ({
  fetchTradesByAccount: createFetchTradesByAccount(store),
});
```

**Step 4.3: Create Queries**

```typescript
// application/queries/get-trades-by-account.ts
import { StoreService } from '@/shared/lib/store';
import { Address } from '@/shared/types';
import { Trade } from '../../domain/trades.entity';
import { selectTradesByAccount } from '../../infrastructure/redux/trades/trades.selectors';

export const createGetTradesByAccount =
  (storeService: StoreService) =>
  (address: Address): Trade[] =>
    selectTradesByAccount(storeService.getState(), address);

// ✅ Pure query
// ✅ Returns domain types
// ✅ No side effects
```

**Step 4.4: Create Query Factory**

```typescript
// application/queries/di.ts
import { StoreService } from '@/shared/lib/store';
import { calculateNetValue, calculateTradeNotional } from '../../domain/trades.calculations';
import { createGetTradesByAccount } from './get-trades-by-account';

export const createTradeQueries = (storeService: StoreService) => ({
  getTradesByAccount: createGetTradesByAccount(storeService),
  calculateTradeNotional, // Pure domain function
  calculateNetValue, // Pure domain function
});
```

#### 5. Wire Up Dependency Injection

**Step 5.1: Update Trading Module DI**

```typescript
// trading/di.ts
import * as Trades from './src/trades';

export const createTradingModule = (graphqlClient: GraphQLClient) => {
  return {
    getThunkExtras: (): TradingThunkExtras => ({
      // ... existing repositories
      tradeRepository: Trades.tradesAdapters.createGraphQLTradeRepository(graphqlClient),
    }),
    createCommandsAndQueries: (storeService: StoreService) => {
      // ... existing commands/queries
      const tradeCommands = Trades.createTradeCommands(storeService);
      const tradeQueries = Trades.createTradeQueries(storeService);

      return {
        // ... existing
        ...tradeCommands,
        ...tradeQueries,
      };
    },
  };
};
```

**Step 5.2: Add to Redux Store**

```typescript
// shared/lib/store/createStore.ts
import { tradesApi, tradesReducer } from '@/trading/src/trades/infrastructure/redux';

export const createStore = (thunkExtras: TradingThunkExtras) => {
  return configureStore({
    reducer: {
      // ... existing reducers
      trades: tradesReducer,
      [tradesApi.reducerPath]: tradesApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: { extraArgument: thunkExtras } })
        // ... existing middleware
        .concat(tradesApi.middleware),
  });
};
```

#### 6. Export Module Public API

```typescript
// trades/index.ts
export * from './application';
export * from './domain';
export * as tradesAdapters from './infrastructure';

export { tradesReducer, tradesApi, type TradesThunkExtra } from './infrastructure/redux';
```

#### 7. Use in Client Code

```typescript
// Client usage
import { createStarboardClient } from 'fuel-ts-sdk';
// Domain types importable
import { MarketConfig, Position, calculatePositionLeverage } from 'fuel-ts-sdk/trading';

const client = createStarboardClient({ indexerUrl: '...' });

// Atomic operations (aggregate-level AND cross-aggregate)
await client.trading.api.fetchPositions(address('0x1234...'));
const positions = client.trading.api.getPositions(address('0x1234...'));
await client.trading.api.fetchMarketConfig(assetId('0xabcd...'));
const config = client.trading.api.getMarketConfig(assetId('0xabcd...'));

// Workflows (composite operations) - only ones with nesting
const bundle = await client.trading.workflows.fetchPositionBundle(positionId('pos1'));
const risk = client.trading.workflows.calculatePositionRisk(positionId('pos1'));
```

---

## What to Expose (and What Not To)

### Module Boundary Rules

#### ✅ Always Expose (Public API)

1. **Domain Types**:

   ```typescript
   export * from './domain/trades.entity';
   export * from './domain/trades.types';
   export * from './domain/trades.decimals';
   ```

2. **Domain Calculations** (pure functions):

   ```typescript
   export { calculateTradeNotional, calculateNetValue } from './domain/trades.calculations';
   ```

3. **Application Services** (commands & queries):

   ```typescript
   export { createTradeCommands, createTradeQueries } from './application';
   ```

4. **Port Interfaces** (for testing/mocking):
   ```typescript
   export type { TradeRepository } from './domain/trades.port';
   ```

#### ⚠️ Expose with Namespace (Infrastructure)

**Why namespace?** Prevents accidental coupling to implementation details.

```typescript
// Usage requires explicit namespace
import { tradesAdapters } from 'fuel-ts-sdk';

// ✅ Good: Namespace infrastructure
export * as tradesAdapters from './infrastructure';

const repo = tradesAdapters.createGraphQLTradeRepository(client);
```

**What to namespace**:

- Repository adapter factories
- Redux internals (except reducer/middleware for store setup)
- Mappers

#### ❌ Never Expose (Internal Details)

1. **GraphQL Queries**:

   ```typescript
   // ❌ Don't export
   export { GET_TRADES_BY_ACCOUNT } from './infrastructure/repositories/graphql-trades-repository/queries.gql';
   ```

2. **Mappers**:

   ```typescript
   // ❌ Don't export (internal to repository)
   export { toDomainTrade } from './infrastructure/repositories/graphql-trades-repository/mappers';
   ```

3. **Redux Action Types**:

   ```typescript
   // ❌ Don't export (internal to Redux)
   export { tradesSlice } from './infrastructure/redux/trades/trades.slice';
   ```

4. **Implementation Methods**:

   ```typescript
   // ❌ Don't export (internal to repository)
   export { getTradesByAccount } from './infrastructure/repositories/graphql-trades-repository/get-trades-by-account';
   ```

5. **Selectors** (use queries instead):

   ```typescript
   // ❌ Don't export selectors directly
   export { selectTradesByAccount } from './infrastructure/redux/trades/trades.selectors';

   // ✅ Export query that uses selector
   export { createGetTradesByAccount } from './application/queries';
   ```

### Export Template

```typescript
// module/index.ts

// ✅ Domain (public)
export * from './domain';

// ✅ Application (public)
export * from './application';

// ⚠️ Infrastructure (namespaced)
export * as myFeatureAdapters from './infrastructure';

// ✅ Redux setup (needed for store configuration)
export { myFeatureReducer, myFeatureApi, type MyFeatureThunkExtra } from './infrastructure/redux';

// ❌ Don't export:
// - GraphQL queries
// - Mappers
// - Selectors
// - Redux slices
// - Implementation details
```

---

## Infrastructure Patterns: RTK Query vs Thunks

**Critical decision**: When to use RTK Query vs plain thunks for state management.

### RTK Query (createApi)

**Use when you need advanced caching**:

- ✅ Automatic cache invalidation with tags
- ✅ Deduplicate concurrent requests
- ✅ Automatic refetching on window focus/reconnect
- ✅ Optimistic updates
- ✅ Polling/subscriptions

**Example** (positions with caching):

```typescript
// infrastructure/redux/positions/positions.api.ts
export const positionsApi = createApi({
  reducerPath: 'positionsApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['positions-by-address', 'positions-by-stable-id'],
  endpoints: (builder) => ({
    getPositionsByAddress: builder.query<Position[], Address>({
      async queryFn(address, api) {
        const { positionRepository } = api.extra as PositionsThunkExtra;
        const result = await positionRepository.getPositionsByAccount(address);
        return { data: result ?? [] };
      },
      providesTags: (_result, _error, arg) => [{ type: 'positions-by-address', id: arg }],
    }),
  }),
});

// Automatic cache invalidation when address changes
// Deduplicates if called multiple times with same address
```

**Complexity cost**:

- ⚠️ More boilerplate (reducerPath, baseQuery, tagTypes)
- ⚠️ Cache management adds cognitive load
- ⚠️ Harder to debug cache invalidation bugs

### Plain Thunks (createAsyncThunk)

**Use when you DON'T need caching**:

- ✅ Simple data fetching
- ✅ Write operations (commands)
- ✅ One-time loads
- ✅ Clear control flow

**Example** (market configs without caching):

```typescript
// infrastructure/redux/market-configs/market-configs.thunks.ts
export const fetchMarketConfig = createAsyncThunk<
  MarketConfig,
  AssetId,
  { rejectValue: string; extra: MarketsConfigThunkExtra }
>('markets/fetchMarketConfig', async (assetId, { rejectWithValue, extra }) => {
  try {
    const config = await extra.marketConfigRepository.getMarketConfig(assetId);
    return config;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});

// Slice handles the result
extraReducers: (builder) => {
  builder.addCase(fetchMarketConfig.fulfilled, (state, action) => {
    marketConfigsAdapter.upsertOne(state, action.payload);
  });
};
```

**Simplicity benefits**:

- ✅ Straightforward async flow
- ✅ Less boilerplate
- ✅ Easier to understand

### Decision Matrix

| Scenario                                       | Use RTK Query | Use Thunks |
| ---------------------------------------------- | ------------- | ---------- |
| **User data that changes frequently**          | ✅            | ❌         |
| **Need to invalidate cache across components** | ✅            | ❌         |
| **Concurrent requests to same endpoint**       | ✅            | ❌         |
| **Config data (rarely changes)**               | ❌            | ✅         |
| **Write operations (commands)**                | ❌            | ✅         |
| **One-time data load**                         | ❌            | ✅         |
| **Simple fetch-and-store**                     | ❌            | ✅         |

### Our Codebase Usage

**RTK Query** (positions):

- Positions change frequently (trades, liquidations)
- Multiple components need same position data
- Need to invalidate when user trades
- Cache deduplication saves GraphQL calls

**Thunks** (markets):

- Market configs change rarely
- Usually fetched once per session
- No cache invalidation needed
- Simpler code, easier to maintain

### Guidelines

1. **Start with thunks** (simpler)
2. **Only add RTK Query** when you measure cache-related problems:
   - Duplicate network requests
   - Stale data across components
   - Need for invalidation patterns
3. **Don't mix**: One aggregate = one pattern (all RTK Query OR all thunks)
4. **Commands always use thunks** (writes don't need caching)

### Anti-Pattern: RTK Query for Everything

```typescript
// ❌ Bad: Using RTK Query for simple one-time load
export const configApi = createApi({
  reducerPath: 'configApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['config'], // Unnecessary complexity
  endpoints: (builder) => ({
    getConfig: builder.query({
      async queryFn(_, api) {
        // This config is loaded once and never changes
        // Thunk would be simpler
      },
      providesTags: ['config'],
    }),
  }),
});
```

**Better**:

```typescript
// ✅ Good: Use thunk for simple load
export const fetchConfig = createAsyncThunk('config/fetch', async (_, { extra }) => {
  return await extra.configRepository.get();
});
```

### When in Doubt

**Ask**: "Does this data need cache invalidation or deduplication?"

- **Yes** → RTK Query
- **No** → Thunks

**Don't use RTK Query just because it's "modern"**. Simpler code is better code.

---

## Testing Strategy

### Unit Testing Domain Logic

**Domain logic is the easiest to test** - pure functions, no mocks needed.

```typescript
// domain/trades.calculations.test.ts
import { describe, expect, it } from 'vitest';
import { calculateTradeNotional } from './trades.calculations';
import { TradePrice, TradeVolume } from './trades.decimals';
import { Trade } from './trades.entity';

describe('calculateTradeNotional', () => {
  it('calculates notional value correctly', () => {
    const trade: Trade = {
      // ... create test trade
      price: TradePrice.create(100_000_000_000n), // $100
      volume: TradeVolume.create(5_000_000_000n), // 5 units
    };

    const notional = calculateTradeNotional(trade);

    expect(notional.value).toBe(500_000_000_000n); // $500
  });

  it('handles zero volume', () => {
    const trade: Trade = {
      // ...
      price: TradePrice.create(100_000_000_000n),
      volume: TradeVolume.create(0n),
    };

    const notional = calculateTradeNotional(trade);

    expect(notional.value).toBe(0n);
  });
});

// ✅ No mocking needed
// ✅ Fast tests
// ✅ Pure functions
```

### Testing Application Services

**Application services need dependency injection** - mock the dependencies.

```typescript
// application/queries/get-trades-by-account.test.ts
import { describe, expect, it, vi } from 'vitest';
import { StoreService } from '@/shared/lib/store';
import { address } from '@/shared/types';
import { createGetTradesByAccount } from './get-trades-by-account';

describe('createGetTradesByAccount', () => {
  it('retrieves trades for account', () => {
    // Mock store service
    const mockStoreService: StoreService = {
      getState: vi.fn().mockReturnValue({
        trades: {
          ids: ['trade1', 'trade2'],
          entities: {
            trade1: { id: 'trade1', account: '0x1234' /* ... */ },
            trade2: { id: 'trade2', account: '0x1234' /* ... */ },
          },
        },
      }),
      dispatch: vi.fn(),
    };

    const getTradesByAccount = createGetTradesByAccount(mockStoreService);
    const trades = getTradesByAccount(address('0x1234'));

    expect(trades).toHaveLength(2);
    expect(trades[0].account).toBe('0x1234');
  });
});

// ✅ Mock dependencies
// ✅ Test orchestration logic
```

### Testing Repository Adapters

**Test mappers** - ensure DTOs correctly translate to domain types.

```typescript
// infrastructure/repositories/graphql-trades-repository/mappers.test.ts
import { describe, expect, it } from 'vitest';
import { toDomainTrade } from './mappers';

describe('toDomainTrade', () => {
  it('maps GraphQL trade to domain trade', () => {
    const gqlTrade = {
      id: 'trade1',
      positionId: 'pos1',
      account: '0x1234',
      assetId: '0xabcd',
      side: 'BUY',
      price: '100000000000',
      volume: '5000000000',
      fee: '1000000000',
      timestamp: 1234567890,
    };

    const domainTrade = toDomainTrade(gqlTrade);

    expect(domainTrade.id).toBe('trade1');
    expect(domainTrade.price.value).toBe(100_000_000_000n);
    expect(domainTrade.volume.value).toBe(5_000_000_000n);
  });

  it('throws on invalid data', () => {
    const invalidTrade = {
      // ... missing required fields
    };

    expect(() => toDomainTrade(invalidTrade)).toThrow();
  });
});

// ✅ Test data translation
// ✅ Test validation
// ✅ Ensure anti-corruption layer works
```

### Integration Testing

**Test the full stack** - DI → Repository → Application Service

```typescript
// integration/trades.integration.test.ts
import { GraphQLClient } from 'graphql-request';
import { describe, expect, it } from 'vitest';
import { createStore, createStoreService } from '@/shared/lib/store';
import { createTradingModule } from '@/trading/di';

describe('Trades Integration', () => {
  it('fetches and retrieves trades end-to-end', async () => {
    // Setup
    const graphqlClient = new GraphQLClient('http://test-indexer');
    const tradingModule = createTradingModule(graphqlClient);
    const store = createStore(tradingModule.getThunkExtras());
    const storeService = createStoreService(store);
    const api = tradingModule.createCommandsAndQueries(storeService);

    // Execute command
    await api.fetchTradesByAccount(address('0x1234'));

    // Execute query
    const trades = api.getTradesByAccount(address('0x1234'));

    // Assert
    expect(trades.length).toBeGreaterThan(0);
  });
});

// ✅ Test full integration
// ✅ Ensure DI wiring works
// ✅ End-to-end validation
```

---

## Common Pitfalls

### 1. ❌ Business Logic in Infrastructure

```typescript
// ❌ BAD: Business logic in repository
export const getTradesByAccount =
  (client: GraphQLClient) =>
  async (account: Address): Promise<Trade[]> => {
    const response = await client.request(GET_TRADES_BY_ACCOUNT, { account });

    // ❌ Business logic doesn't belong here!
    return response.trades
      .map(toDomainTrade)
      .filter((trade) => trade.volume.value > 0n) // ❌ Filtering logic
      .sort((a, b) => b.timestamp - a.timestamp); // ❌ Sorting logic
  };
```

```typescript
// ✅ GOOD: Repository just retrieves, domain layer filters
export const getTradesByAccount =
  (client: GraphQLClient) =>
  async (account: Address): Promise<Trade[]> => {
    const response = await client.request(GET_TRADES_BY_ACCOUNT, { account });
    return response.trades.map(toDomainTrade); // ✅ Just translate
  };

// ✅ Business logic in domain or application layer
export function filterNonZeroTrades(trades: Trade[]): Trade[] {
  return trades.filter((trade) => trade.volume.value > 0n);
}

export function sortTradesByTime(trades: Trade[]): Trade[] {
  return [...trades].sort((a, b) => b.timestamp - a.timestamp);
}
```

### 2. ❌ Infrastructure Types Leaking into Domain

```typescript
// ❌ BAD: GraphQL types in domain
import { GraphQLTrade } from '@/generated/graphql';

export function calculateTradeNotional(trade: GraphQLTrade): UsdValue {
  // ❌ Domain logic depends on infrastructure type
}
```

```typescript
// ✅ GOOD: Domain types only
export function calculateTradeNotional(trade: Trade): UsdValue {
  // ✅ Uses domain type
  return DecimalCalculator.value(trade.price).multiplyBy(trade.volume).calculate(UsdValue);
}
```

### 3. ❌ Anemic Domain Model

```typescript
// ❌ BAD: Entities with no behavior (just data containers)
export type Position = {
  id: PositionId;
  size: bigint;
  collateral: bigint;
};

// Logic scattered in services
export class PositionService {
  calculateLeverage(position: Position) {
    /* ... */
  }
  calculateHealth(position: Position) {
    /* ... */
  }
  isLiquidatable(position: Position) {
    /* ... */
  }
}
```

```typescript
// ✅ GOOD: Rich domain model with behavior
export type Position = {
  id: PositionId;
  size: PositionSize; // Value Object
  collateral: CollateralAmount;
};

// Behavior as pure functions in domain layer
export function calculatePositionLeverage(position: Position): RatioOutput {
  // Business logic close to data
}

export function calculatePositionHealth(position: Position): HealthRatio {
  // Domain logic
}

export function isPositionLiquidatable(position: Position): boolean {
  // Business rule
}
```

### 4. ❌ Bloated Aggregates

```typescript
// ❌ BAD: Aggregate includes everything
export type Position = {
  id: PositionId;
  market: Market; // ❌ Entire aggregate embedded
  owner: User; // ❌ Entire aggregate embedded
  trades: Trade[]; // ❌ Collection embedded
  liquidations: Liquidation[]; // ❌ Collection embedded
};
```

```typescript
// ✅ GOOD: Small aggregate, references by ID
export type Position = {
  id: PositionId;
  marketId: MarketId; // ✅ Reference by ID
  ownerId: UserId; // ✅ Reference by ID
  // Don't embed collections
};

// Separate query to get related trades
export const getTradesByPosition = (positionId: PositionId): Trade[] => {
  // Query trades separately
};
```

### 5. ❌ Primitive Obsession

```typescript
// ❌ BAD: Raw primitives everywhere
function calculateLeverage(size: bigint, collateral: bigint): bigint {
  // ❌ Easy to mix up parameters
  return (size * 100n) / collateral;
}

// ❌ Easy to accidentally swap parameters
calculateLeverage(collateral, size); // Oops! Wrong order
```

```typescript
// ✅ GOOD: Branded types and value objects
function calculatePositionLeverage(position: Position): RatioOutput {
  // ✅ Type system prevents mixing up values
  return DecimalCalculator.value(position.size)
    .divideBy(position.collateralAmount)
    .calculate(RatioOutput);
}

// ✅ Cannot mix up - compile error
const size: PositionSize = /* ... */;
const collateral: CollateralAmount = /* ... */;
// size.equals(collateral);  // ❌ Compile error - different types!
```

### 6. ❌ Bypassing Module Boundaries

```typescript
// ❌ BAD: Importing internal files directly
import { selectTradesByAccount } from '../trades/infrastructure/redux/trades/trades.selectors';
import { tradesSlice } from '../trades/infrastructure/redux/trades/trades.slice';
import { GET_TRADES } from '../trades/infrastructure/repositories/graphql-trades-repository/queries.gql';
```

```typescript
// ✅ GOOD: Use public API only
import { Trade, createTradeQueries } from '../trades';

const tradeQueries = createTradeQueries(storeService);
const trades = tradeQueries.getTradesByAccount(address);
```

### 7. ❌ Missing Validation at Boundaries

```typescript
// ❌ BAD: No validation when mapping external data
export function toDomainTrade(gql: GraphQLTrade): Trade {
  return {
    id: gql.id, // ❌ No validation
    price: gql.price, // ❌ Could be negative
    volume: gql.volume, // ❌ Could be zero/negative
  };
}
```

```typescript
// ✅ GOOD: Validate at boundary
export function toDomainTrade(gql: GraphQLTrade): Trade {
  return TradeSchema.parse({
    // ✅ Zod validates
    id: tradeId(gql.id), // ✅ Branded type validates
    price: BigInt(gql.price), // ✅ Convert to proper type
    volume: BigInt(gql.volume),
  });
  // Throws if validation fails - prevents corrupt data entering domain
}
```

---

## Recommended Reading

### Essential DDD Books

#### 1. **Domain-Driven Design: Tackling Complexity in the Heart of Software** (Blue Book)

**Author**: Eric Evans
**Why read**: The original DDD book. Defines all core patterns.
**Focus chapters**:

- Chapter 5: A Model Expressed in Software (Entities, Value Objects, Services)
- Chapter 6: The Life Cycle of a Domain Object (Aggregates, Repositories)
- Chapter 14: Maintaining Model Integrity (Bounded Contexts)

**Key takeaway**: "The heart of software is its ability to solve domain-related problems for its user."

#### 2. **Implementing Domain-Driven Design** (Red Book)

**Author**: Vaughn Vernon
**Why read**: Practical implementation guide. More concrete than Evans.
**Focus chapters**:

- Chapter 4: Architecture (Hexagonal/Ports & Adapters)
- Chapter 5: Entities
- Chapter 6: Value Objects
- Chapter 7: Services
- Chapter 10: Aggregates

**Key takeaway**: "Design small aggregates" and "Model true invariants in consistency boundaries."

#### 3. **Domain-Driven Design Distilled**

**Author**: Vaughn Vernon
**Why read**: Short overview (~150 pages). Great for team members who won't read full books.
**What it covers**: Strategic DDD (Bounded Contexts) and Tactical DDD (patterns) in digestible format.

**Key takeaway**: Fast introduction to DDD concepts in a few hours of reading.

### Architecture Books

#### 4. **Clean Architecture**

**Author**: Robert C. Martin (Uncle Bob)
**Why read**: Explains dependency inversion and layered architecture principles.
**Focus chapters**:

- Chapter 22: The Clean Architecture
- Chapter 23: Presenters and Humble Objects
- Chapter 26: The Main Component (Composition Root)

**Key takeaway**: "Source code dependencies must point only inward, toward higher-level policies."

#### 5. **Patterns of Enterprise Application Architecture**

**Author**: Martin Fowler
**Why read**: Catalog of enterprise patterns (Repository, Unit of Work, Data Mapper).
**Focus chapters**:

- Repository pattern
- Data Mapper pattern
- Unit of Work pattern

**Key takeaway**: Understanding infrastructure patterns that support DDD.

### Advanced Topics

#### 6. **CQRS Documents** (Free Online)

**Author**: Greg Young
**Where**: https://cqrs.files.wordpress.com/2010/11/cqrs_documents.pdf
**Why read**: Understand CQRS and Event Sourcing from the creator.

**Key takeaway**: "CQRS is simply the creation of two objects where there was previously only one."

#### 7. **Hexagonal Architecture** (Original Paper)

**Author**: Alistair Cockburn
**Where**: https://alistair.cockburn.us/hexagonal-architecture/
**Why read**: Understand Ports & Adapters pattern philosophy.

**Key takeaway**: "Create your application to work without either a UI or a database."

### Online Resources

#### 8. **Domain-Driven Design Reference**

**Author**: Eric Evans (Free PDF)
**Where**: https://www.domainlanguage.com/ddd/reference/
**Why read**: Quick reference for DDD patterns. Keep it handy.

#### 9. **Awesome DDD** (GitHub)

**Where**: https://github.com/heynickc/awesome-ddd
**Why read**: Curated list of DDD resources, articles, talks.

### Video Content

#### 10. **Domain-Driven Design: The Good Parts**

**Speaker**: Jimmy Bogard
**Where**: YouTube
**Why watch**: Practical advice on what DDD patterns to use (and which to skip).

#### 11. **CQRS and Event Sourcing**

**Speaker**: Greg Young
**Where**: YouTube (multiple talks)
**Why watch**: Understand CQRS from the source.

---

## Reading Path for New Team Members

### Week 1: Core Concepts

1. Read **DDD Distilled** (2-3 hours)
2. Read this guide completely
3. Explore codebase: [fuel-ts-sdk/src/trading/src/positions/](../../fuel-ts-sdk/src/trading/src/positions/)

### Week 2: Tactical Patterns

1. Read **Implementing DDD** Chapters 5-7 (Entities, Value Objects, Services)
2. Study: [positions.entity.ts](../../fuel-ts-sdk/src/trading/src/positions/domain/positions.entity.ts)
3. Study: [decimalValue.ts](../../fuel-ts-sdk/src/shared/models/decimalValue.ts)

### Week 3: Architecture

1. Read **Clean Architecture** Chapter 22
2. Read **Hexagonal Architecture** paper
3. Study: [client.ts](../../fuel-ts-sdk/src/client.ts) (Composition Root)
4. Study: [di.ts](../../fuel-ts-sdk/src/trading/di.ts) (Dependency Injection)

### Week 4: Implementation Practice

1. Read **Implementing DDD** Chapter 10 (Aggregates)
2. Implement a small feature following [Adding New Features](#adding-new-features)
3. Code review with experienced team member

### Ongoing: Deep Dive

1. Read **Blue Book** (Evans) - foundational knowledge
2. Read **CQRS Documents** (Greg Young) - advanced patterns
3. Watch Jimmy Bogard talks - practical wisdom

---

## SDK API Structure Summary

### Final SDK Tree Design

```typescript
// import from 'fuel-ts-sdk/trading' - Domain types
import {
  MarketConfig,
  Position,
  PositionStatus,
  calculatePositionLeverage, // Pure domain function
} from 'fuel-ts-sdk/trading';

// sdk.trading.api.* - ALL atomic operations (flat)
sdk.trading.api.fetchPositions(address); // Aggregate-level atomic
sdk.trading.api.getPositions(address); // Aggregate-level atomic
sdk.trading.api.fetchMarketConfig(assetId); // Aggregate-level atomic
sdk.trading.api.getMarketConfig(assetId); // Aggregate-level atomic
sdk.trading.api.fetchPositionBundle(positionId); // Cross-aggregate atomic
sdk.trading.api.getPositionRisk(positionId); // Cross-aggregate atomic

// sdk.trading.workflows.* - Composite operations (only workflows get nesting)
sdk.trading.workflows.openPositionSafely(params);
sdk.trading.workflows.liquidatePosition(positionId);
sdk.trading.workflows.fetchCompletePortfolio(address);
```

### Mapping to Codebase

```
trading/src/
├── positions/application/        → sdk.trading.api.fetchPositions, getPositions
├── markets/application/          → sdk.trading.api.fetchMarketConfig, getMarketConfig
├── application/
│   ├── commands/                 → sdk.trading.api.* (cross-aggregate atomics)
│   ├── queries/                  → sdk.trading.api.* (cross-aggregate atomics)
│   └── workflows/                → sdk.trading.workflows.*
└── domain/                       → import from 'fuel-ts-sdk/trading'
```

### Key Principles

1. **`.api` namespace = ALL atomics** (both aggregate-level and cross-aggregate)
2. **`.workflows` namespace = composites only** (workflows get special treatment)
3. **Direct import = domain types** (entities, value objects, pure functions)
4. **Atomic vs composite separation** (not single-aggregate vs cross-aggregate)

---

## Summary Checklist

When adding a new feature, ask yourself:

### Domain Layer

- [ ] Have I identified entities vs value objects correctly?
- [ ] Are my value objects immutable?
- [ ] Do I use branded types to prevent primitive obsession?
- [ ] Is business logic in domain layer (not infrastructure)?
- [ ] Are my domain functions pure (no side effects)?
- [ ] Have I defined port interfaces (not implementations)?
- [ ] Does domain layer have zero infrastructure dependencies?

### Application Layer

- [ ] Are commands separated from queries?
- [ ] Do commands return `void` or `Promise<void>`?
- [ ] Are queries side-effect-free?
- [ ] Is this layer thin (orchestration only, no business logic)?
- [ ] Do I use factory pattern for dependency injection?

### Infrastructure Layer

- [ ] Do my repository adapters implement domain ports?
- [ ] Do I have mappers translating external types to domain types?
- [ ] Do mappers validate with Zod schemas?
- [ ] Are GraphQL queries isolated in infrastructure?
- [ ] Does Redux state use entity adapters?
- [ ] Do selectors read from normalized state?

### Module Boundaries

- [ ] Do I export domain types and logic?
- [ ] Do I namespace infrastructure exports?
- [ ] Do I avoid exporting internal implementation details?
- [ ] Can other modules use my feature without importing internals?

### Testing

- [ ] Can I unit test domain logic without mocks?
- [ ] Can I mock dependencies for application services?
- [ ] Do I test mappers to ensure correct translation?
- [ ] Have I written integration tests for full flow?

---

## Getting Help

### Code Examples

- **Position Aggregate**: [positions.entity.ts](../../fuel-ts-sdk/src/trading/src/positions/domain/positions.entity.ts)
- **Value Objects**: [decimalValue.ts](../../fuel-ts-sdk/src/shared/models/decimalValue.ts)
- **Repository Pattern**: [positions.port.ts](../../fuel-ts-sdk/src/trading/src/positions/domain/positions.port.ts)
- **Dependency Injection**: [di.ts](../../fuel-ts-sdk/src/trading/di.ts)
- **Cross-Aggregate Queries**: [trading/application/queries](../../fuel-ts-sdk/src/trading/src/application/queries/)

### Questions to Ask

1. "Is this business logic or infrastructure orchestration?"
2. "Does this entity have identity, or is it just a measurement?"
3. "Should this be in domain layer, application layer, or infrastructure?"
4. "Am I referencing another aggregate by ID, or embedding it?"
5. "Can I test this without mocking infrastructure?"

---

## Conclusion

This architecture prioritizes:

1. **Pure domain core**: Business logic isolated from frameworks
2. **Clear boundaries**: Layers, modules, and aggregates well-defined
3. **Type safety**: Branded types and value objects prevent errors
4. **Testability**: Pure functions and DI make testing easy
5. **Pragmatic complexity**: No event buses or unnecessary ceremony

Follow these guidelines and your code will integrate seamlessly with the existing architecture.

**Remember**: When in doubt, look at existing code (especially `positions/` module) as a reference implementation.

---

_This guide is a living document. Update it as the architecture evolves._
