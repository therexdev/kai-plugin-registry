# KAI plugin registry

- This repository is catalog infrastructure, not executable plugin code and not a privileged KAI plugin.
- Never commit signing private keys, credentials, user data, or signing secrets. Releases are signed locally by the maintainer; Actions only verifies and publishes pre-signed catalogs.
- Submitted plugin files are untrusted data. Do not execute them, run their build/install hooks, or fetch their dependencies during registry validation.
- Every catalog change requires a new catalog version and increasing sequence, a bounded validity period, exact publisher and package pins, and a new reviewed signature.
- New submissions use Foundation package schema 2/API 3 and Core >=0.7.0. Every publisher uses the same public capability vocabulary in policy.json. Official catalog IDs are branding pins, not privileged APIs. Native execution requires explicit full-computer trust; never imply it is sandboxed. The v1/v2 validator and policy in lib are archive-only, retained to audit immutable old releases.
- Never overwrite a published registry release asset. Retain older catalogs for audit; clients reject replay after accepting a newer sequence.
- Run `npm test`, `npm run verify`, and `npm run verify:online` before publication. Never publish a catalog referencing nonexistent plugin assets.
