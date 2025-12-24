# Starboard Development Guidelines

## Git Workflow

### Branching

- Format: `yourname/<type>/<issue-number>-<issue-name-kebab-cased>`
- Example: `johndoe/feat/ABC-1-add-login-page`
- Always rebase: `git rebase main` (NEVER `git merge`)
- Force push after rebase: `git push --force-with-lease`

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/). Format: `type(scope): description`

**Types:** fix, feat, docs, test, chore, style, refactor, perf, build, ci, revert

**Scope structure:** `[first-level]/[platforms]`

- First level: `ui` (visual changes), `api` (backend only), `config` (configs only), or blank
- Platforms: `docs`, `web`, `arch` (in that order, comma-separated if multiple)
- E2E tests: add `-e2e` suffix (e.g., `web-e2e`)

**Examples:**

```text
fix(ui/web): dashboard login button misaligned on mobile
feat(api/web,docs): create user data retrieval endpoints
chore(config/web): add default coverage directory to jest config
docs(installation): add pnpm install commands
perf(api/web): optimize database queries for user data
```

**Commit rules:**

- One logical change per commit
- Each commit must be deployable
- Use `git commit --amend` for fixes to previous commit (unless already on main)

## Architecture

### SDK Pattern

- Front-end MUST use SDK as single entry point
- Front-end MUST NOT talk to Indexer directly

### Testing

- Front-end: Wrap in SDK provider with Fake/Real implementation
- SDK: Use dependency injection with in-memory fake services
- Indexer: Define events in memory for unit tests

## Code Organization

### Working with Forked/Legacy Code

**Create isolated space for new features:**

- New root: `@starboard/` directory (mirror of inherited root)
- ALL new features MUST go in `@starboard/`, NEVER in legacy directories
- Clone App root file (e.g., App.tsx) into `@starboard/` and update imports
- Add path alias for new root

**Altering legacy code:**

- NEVER directly modify legacy files for compositions (views, large functions, components)
- Clone entire component tree into `@starboard/` including all middlemen
- For composites (utils, constants): Create continuation file in `@starboard/` and reference from there
- To replace legacy methods: Mark old util as deprecated, point to successor

**Fixing legacy bugs:**

- Widespread method: Fix in original repo, upgrade via migration
- Limited scope method: Create replacement in `@starboard/`, clone affected locations

**Benefits:** Frozen inherited root = easy migration to newer versions, no merge conflicts

### Module Design Principles

**Module types:**

- **Client modules** (pages/routes/views): Consumers that import, export only core composition
- **Provider modules**: Atomic, bounded, dumb reusable units

**Provider module traits:**

- **Atomic**: As small as possible for full encapsulated functionality
- **Bounded**: Own API via index.ts, respect module internals, never import from other modules' internals
- **Dumb**: No knowledge of external world, no global store access, all needs via props/context

**File organization standards:**

- utils/lib, common/shared, types/models, pages, views, components, store, hooks, contexts, api, styles

**Code splitting levels:**

1. **Single file**: General to detail, functions below component, styles in `$` namespace
2. **Nested files**: Extract to `Component.utils.ts`, `Component.styles.ts` (import via parent, not directly)
3. **Submodules**: Folder per component when children need own helpers

**Module navigation:**

- Maintain Single Level of Abstraction (SLAB)
- Code should read top-to-bottom like prose
- Enable directed graph traversal through imports

## Code Review

Use [Conventional Comments](https://conventionalcomments.org/) format:

- **Bolden** the label and decorations
- Wrap comments in code blocks for easy copying to GitHub
- Be brief and to the point
- Suggest HOW to change without providing pastable solutions

**Example:**

```text
**suggestion (non-blocking):** Consider extracting this logic into a separate function for better testability.
```
