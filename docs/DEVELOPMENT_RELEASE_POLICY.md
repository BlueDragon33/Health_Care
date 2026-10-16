# Shared Development / Release Policy

Universal Constitution: `blueprint-os:universal-century-grade@1.3.0` (source: BlueDragon33/Software-Blueprint-Hub).
Dependency budget: `docs/DEPENDENCY_BUDGET.json`; sensitive local data remains canonical and separately protected.

## Development mode — OFFLINE-FIRST / LOCAL-ONLY

- Merges/pushes to `main`, passing CI, and manual workflow dispatch are NOT online publication approval.
- Health core health records, encrypted Vault, reminders and saved progress must be tested locally with network denied; any absent offline evidence remains `UNVERIFIED`.
- The two remote Cloudflare publish jobs (`live-development-deploy.yml`, `deploy.yml`) are dormant with fail-closed job guards, preserving source for a separately reviewed future release.
- Install/build dependencies may use Internet before test; local app runtime must not require it for core functions.
- Application Management integration, hosted D1, AI, cloud backup, and remote auth are optional adapters and cannot become mandatory for core local use or leak sensitive records.
- Preserve the production D1 database and all existing live URLs; decommissioning requires separate owner authorization.
- Real offline tests require network-disconnected cold start, browsing vital routes, local save/reload and encrypted export/restore, plus an evidence-bound exact SHA.
- Approval / Managed OFF: standalone local; Approval / Managed ON: explicit separate management integration after the associated gates.

## Release Mode — factory exit only

Do not publish until a named Health release has offline acceptance evidence, B5 privacy/backup gates, applicable independent review, secure schema/data migration, exact artifact SHA and explicit future owner Production release authority. No automatic publish is enabled by this policy.

## Application Management access switch

When this app participates in Application Management:

- **Approval/Managed ON**: use device/access approval and central management.
- **Approval/Managed OFF**: enter directly in standalone local-first mode.
- Development defaults to OFF unless explicitly switched on by the user.

## Release Mode

Release Mode starts only when the owner explicitly requests a stable/production release.

At release time:

1. Freeze the release revision.
2. Switch access mode back to managed/secure where required.
3. Restore or manually run the heavy release gates.
4. Validate database/schema migrations and remote contracts that are part of the release.
5. Verify the exact release artifact.
6. Deploy using the protected Release/Production workflow.
7. Run post-deploy smoke/read-back checks.
8. Record the release revision/version.
9. Return to OFFLINE-FIRST / LOCAL-ONLY development unless a separate authorization explicitly changes it.

The Release workflow must remain available even while offline-first Development Mode is the default.
