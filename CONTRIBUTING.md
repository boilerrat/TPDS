# Contributing

## Development Setup

```bash
git clone https://github.com/boilerrat/TPDS.git
cd TPDS
npm install
npm run lint
npm test
npm run build
npm run smoke   # verify ESM + CJS output
```

## Pull Requests

- Branch from `main`.
- All PRs must close a GitHub issue (`Closes #N` in body — enforced by CI).
- Run `npm run lint && npm test && npm run build` before opening a PR.
- Fill out every section of the PR template.

## Versioning Policy

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
The **npm package version** (`package.json`) and the **schema version** tracked
in `CHANGELOG.md` are kept in sync.

| Change type | npm package | Schema note |
|---|---|---|
| Breaking schema change (renamed/removed fields, stricter validation) | **major** bump | major entry in CHANGELOG |
| Additive schema change (new optional fields, new chunk types) | **minor** bump | minor entry in CHANGELOG |
| Bug fix, non-schema logic change, documentation, tooling | **patch** bump | patch entry in CHANGELOG |

### Bumping the version

```bash
# patch
npm version patch

# minor
npm version minor

# major
npm version major
```

`npm version` updates `package.json`, creates a commit, and tags it. Pushing
the tag triggers the publish workflow:

```bash
git push origin main --follow-tags
```

### Changelog

Update `CHANGELOG.md` before every release using the
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format:

1. Add entries under `## [Unreleased]` as you develop.
2. Before releasing, rename `[Unreleased]` to the new version with today's date.
3. Add a fresh empty `## [Unreleased]` section at the top.

## Publishing

Releases publish automatically when a `v*.*.*` tag is pushed (see
`.github/workflows/publish.yml`). The workflow requires an **`NPM_TOKEN`**
repository secret — see [README.md](README.md#publishing) for setup
instructions.

---

## Branch Naming

Branch names follow the pattern `issue-N-short-description`:

```
issue-11-schema-docs
issue-14-readme-expand
```

Always branch from `main`. One branch per issue.

---

## CI Checks Required Before Merge

The following checks are enforced by CI (`.github/workflows/ci.yml`) on every push and pull request to `main`. All must pass before a PR can merge:

1. **Type check** — `npm run lint` (runs `tsc --noEmit`)
2. **Tests** — `npm test` (runs all Vitest tests)
3. **Build** — `npm run build` (produces `dist/`)
4. **PR issue link** — enforced by `.github/workflows/pr-issue-check.yml`; the PR body must contain `Closes #N`, `Fixes #N`, or `Resolves #N`

Run all checks locally before opening a PR:

```bash
npm run lint && npm test && npm run build
```

---

## Code Review

Every PR to `main` requires **1 approving review** before it can be merged. Fill out every section of [`.github/pull_request_template.md`](.github/pull_request_template.md) — the `## Closes` section must contain a linked issue.

For bug and feature issue templates see [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/).

---

## Running a Single Test File

```bash
npx vitest run src/__tests__/<filename>.test.ts
```

Example:

```bash
npx vitest run src/__tests__/chunking.test.ts
```

All test files live in `src/__tests__/` and match `**/*.test.ts`.

---

## Fixture Conventions

Fixtures are JSON files in `src/fixtures/`. They are the canonical source of
test inputs for normalization, export, and chunking.

Rules for every fixture:

1. **Must pass `validateTable`** — the fixture must be a valid `DocumentTable`. If you need to test invalid input, construct it inline in the test file instead.
2. **Named for the edge case it covers** — the filename should describe what the fixture tests, e.g. `merged-cells-table.json`, `repeated-headers-table.json`.
3. **Referenced in a test** — every fixture must be imported and exercised in at least one test in `src/__tests__/`.

---

## Schema Change Rules

When adding or modifying fields in the schema:

1. **Update both `src/schema/zod.ts` and `src/types/`** — the Zod schema and the mirrored TypeScript types must stay in sync. When they diverge, Zod wins at runtime.
2. **Optional-only for minor and patch releases** — new fields added in a minor or patch release must be optional (`z.optional()` in Zod, `?` in TypeScript types). Adding a required field is a breaking change.
3. **Required fields require a major bump** — if a new field must be required, bump `standardVersion` and the npm package major version before merging.
4. **Update `standardVersion` in `package.json`** — the `standardVersion` constant should match the npm package version you are targeting for the release.
