<!--
Sync Impact Report:
- Version change: none → 1.0.0
- Initial constitution creation for Starboard project
- New principles: Service-First Architecture, Local Development Priority, Blockchain Integration Standards, Quality Gates, Monorepo Organization
- New sections: Technology Standards, Development Workflow
- Templates requiring updates: ✅ plan-template.md updated ✅ tasks-template.md updated ✅ spec-template.md verified ✅ checklist-template.md verified ✅ agent-file-template.md verified
- Follow-up TODOs: none
-->

# Starboard Constitution

## Core Principles

### I. Service-First Architecture

Each major feature area must be implemented as an independent service with clear boundaries. Services must communicate through well-defined interfaces (GraphQL APIs, TypeScript contracts). No direct database access between services - all data exchange happens through APIs. Each service must be containerized and runnable in isolation.

### II. Local Development Priority (NON-NEGOTIABLE)

All development must be possible in a fully local environment. Docker Compose must provide complete stack (blockchain node, indexer, database, API, web frontend). Local setup must complete in under 2 minutes. No external dependencies required for core development workflow. Local environment must mirror production architecture.

### III. Blockchain Integration Standards

Fuel blockchain integration must use TypeScript SDK and follow connection patterns established in the codebase. All blockchain interactions must be typed using generated types. Indexer must be the source of truth for historical data - no direct chain queries in frontend. Real-time data requires WebSocket subscriptions to indexer API.

### IV. Quality Gates

TypeScript strict mode enforced across all projects. ESLint/Prettier configuration must be consistent across services. Unit tests required for all business logic. Integration tests required for API contracts and blockchain interactions. All changes must pass type checking, linting, and tests before merge.

### V. Monorepo Organization

Related packages grouped under logical workspace boundaries (web app, indexer, shared libraries). Shared TypeScript types must live in dedicated packages. Cross-service dependencies managed through workspace references. Build system must support incremental builds and selective service deployment.

## Technology Standards

**Frontend Stack**: React 18+ with TypeScript, styled-components for CSS-in-JS, React Router for routing. State management via Redux Toolkit with React Query for server state. Component development through Ladle (Storybook alternative).

**Backend Stack**: Node.js with TypeScript for indexer and API services. PostgreSQL for persistent data storage. GraphQL for API layer with type generation. Subsquid framework for blockchain indexing.

**Development Tools**: pnpm for package management, Nx for monorepo tooling, Docker for local development, Vite for frontend build system. Conventional commits enforced with commitizen and commitlint.

## Development Workflow

**Branch Strategy**: Feature branches from main with conventional commit messages. Pull requests require clean type checking and test passing. Local development environment must be functional before feature work begins.

**Code Review**: All changes require review and approval. Review must verify architectural compliance, type safety, and test coverage. Breaking changes require architectural review and migration documentation.

**Release Process**: Semantic versioning for all packages. Deployment through container images. Production deployments require successful staging validation and health check confirmation.

## Governance

This constitution governs all development practices and architectural decisions. Changes require documentation of impact analysis and stakeholder approval. All pull requests and reviews must verify compliance with these principles.

Complexity and architectural deviations must include clear justification and migration path documentation. When in doubt, choose the approach that maintains service boundaries and local development capabilities.

**Version**: 1.0.0 | **Ratified**: 2025-12-03 | **Last Amended**: 2025-12-03
