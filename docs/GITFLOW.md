# Git workflow

## Model

Use GitHub Flow with a protected, continuously releasable `main`. There is no permanent `develop`
branch. Work happens on short-lived branches associated with one primary GitHub issue and enters
`main` through a pull request.

## Branches

- Feature or content: `issue/<number>-<short-slug>`
- Bug fix: `fix/<number>-<short-slug>`
- Release preparation: `release/<version>`
- Emergency production fix: `hotfix/<number>-<short-slug>`

Branch from the latest `origin/main`. Keep a branch focused on one outcome; split independent work
into separate issues and branches. Rebase or merge `origin/main` before final review when the branch
has drifted, but never rewrite shared history after review has started without notifying reviewers.

## Commits

Commits should be small enough to review and leave the branch buildable. Use an imperative summary,
optionally prefixed by `feat:`, `fix:`, `test:`, `docs:`, `chore:` or `perf:`. Generated bindings
belong in the same commit as their schema change. Do not mix unrelated formatting or asset churn
into a gameplay commit.

## Pull requests

Every pull request must:

- link its primary issue with `Closes #<number>` when it completes it;
- describe player-visible behavior and architecture impact;
- list the exact verification commands and results;
- include screenshots or recordings for visual work;
- report performance measurements for heavy work;
- contain no unresolved review comments;
- pass the required repository checks.

Use squash merge so one issue becomes one coherent commit on `main`. Delete the source branch after
merge. Direct pushes to `main` are reserved for repository bootstrap or a documented emergency when
branch protection is unavailable.

## Review policy

- At least one approval is required for normal changes once branch protection is enabled.
- Gameplay architecture, schema, rendering, performance budgets and release configuration require
  an architecture or performance review appropriate to the change.
- The author does not approve their own pull request.
- Review findings are resolved in code or explicitly documented before merge.

## Releases

1. Create `release/<version>` from a green `main` only for stabilization and metadata changes.
2. Run `./tools/harness release` and complete the release QA issue.
3. Merge the release pull request with no known P0 defects.
4. Tag the resulting `main` commit as `v<major>.<minor>.<patch>` and publish release notes.
5. Deploy exactly that tag. Do not rebuild a different commit for production.

Hotfixes branch from the production tag, contain the smallest safe correction and its regression
test, pass the release gate, and merge back to `main` before a new patch tag is created.

## Repository settings

The intended repository policy is squash-only merges, automatic source-branch deletion, pull-request
review before `main`, required harness/CI checks and resolved conversations. CI and protection are
tracked independently so protection is not enabled with nonexistent status checks.
