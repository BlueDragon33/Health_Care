# Profile Privacy / Proxy Engine V1

## Purpose

Separate three layers that must never be treated as equivalent:

1. Admin device approval — may this installation open Health_Care?
2. Profile selection — which child profile is active?
3. Profile privacy — which viewer role may see a sensitive domain?

## Viewer roles

- `self`: person whose health profile is being tracked.
- `caregiver`: parent/caregiver.
- `trusted-helper`: helper who should only see explicitly shared content.

V1 viewer role is a session view mode, not cryptographic authentication. Secure Health Vault/PIN is required before strong local role locking is claimed.

## Visibility

- `shared`
- `caregiver-only`
- `youth-private`
- `emergency-card-only` (engine support reserved for explicit emergency context)
- `unconfigured`

All `highly-sensitive` domains default to `unconfigured`, so deeper features must not silently become visible before an explicit choice.

## Legal/age boundary

V1 does not hard-code a legal age such as 13, 15, 16 or 18 for privacy transfer. Jurisdiction-specific rules must be versioned and reviewed separately.

## Control-plane boundary

Privacy policy is local/profile-owned. It is not uploaded to Site Quản trị. Admin continues to manage installation/device/session/policy only.
