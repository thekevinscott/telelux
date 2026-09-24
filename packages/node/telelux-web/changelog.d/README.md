# Changelog fragments

One file per PR, added in that PR — this folder *is* the changelog. No
rendered CHANGELOG is ever assembled from it, nothing commits back to `main`
at release, and fragments are never deleted, rewritten, or flushed: they
accumulate as the permanent record.

- **Filename:** `YYYY-MM-DD-<slug>.md` — the UTC *merge* date (not author
  date; authored timestamps interleave wrongly across long-lived branches)
  and a short lowercase slug. Plain `ls` sorts chronologically; newest =
  highest sort order.
- **Body:** a few sentences. Lead with the Keep a Changelog category
  (**Added** / **Changed** / **Deprecated** / **Removed** / **Fixed**);
  breaking changes carry a **BREAKING** marker and link to their
  [`../migrations.d/`](../migrations.d/) fragment.
- **Version attribution:** fragments carry dates, not versions. To answer
  "which release shipped X", map the fragment's date against tags:
  `git log --tags --simplify-by-decoration --format='%cI %d'`.

Enforced by the repository's changelog check: a PR that changes non-test
source under a package must add a fragment in that package's folder (here or
in `../migrations.d/`). Bypass with a `skip-changelog:` git trailer for
genuinely internal refactors.
