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
