from pathlib import Path

p = Path("app/device-auth.server.ts")
text = p.read_text()
old = '''  return {
    application: "child-health" as const,
    contractVersion: 3,
    service: policy.accessEnabled ? "online" as const : "paused" as const,
'''
new = '''  return {
    application: "child-health" as const,
    canonicalApplication: "suc-khoe-y-te" as const,
    applicationAliases: ["child-health", "suc-khoe-tre"] as const,
    controlProtocol: "health-control-plane" as const,
    contractVersion: 3,
    capabilities: [
      "device-enrollment-v2",
      "device-classification-v2",
      "device-review-v1",
      "device-access-v1",
      "session-control-v1",
      "policy-control-v1",
      "feature-permissions-v1",
      "content-review-v1",
    ] as const,
    boundary: {
      healthDataInControlPlane: false,
      deviceIdentity: "installation+p256" as const,
    },
    service: policy.accessEnabled ? "online" as const : "paused" as const,
'''
if old not in text:
    raise SystemExit("target status block not found")
p.write_text(text.replace(old, new, 1))
