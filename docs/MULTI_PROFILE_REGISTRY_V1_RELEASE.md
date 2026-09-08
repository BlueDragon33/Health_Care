# Multi-profile Registry V1 release notes

## Scope

- One device can keep multiple child profiles.
- Each profile has its own local state key.
- Existing single-profile data migrates non-destructively into the first profile.
- Legacy 9–18 and 9–10 storage remain preserved for rollback/import compatibility.
- Timeline, reminders, growth, daily records, backup/restore and Attention Queue operate on the active profile state.

## Isolation boundary

V1 isolates data at the `HealthLocalState`/storage-key level. Record-level `profileId` embedding is intentionally deferred to a later schema migration and must not be claimed as already implemented.

## Safety gates

- switching profile saves current profile before loading the next profile;
- deleting a profile requires explicit confirmation and cannot delete the last profile;
- backup/restore defaults to the active profile only;
- the framework no longer reads/writes the global single-profile state after registry migration;
- Site Quản trị still receives no personal health records.
