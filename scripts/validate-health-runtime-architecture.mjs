import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const exists = (relative) => fs.existsSync(path.join(root, relative));
const fail = (message) => { throw new Error(`Health runtime architecture failed: ${message}`); };

const catalog = read("app/suc-khoe-tre/health-domain-catalog.ts");
const maturity = read("app/suc-khoe-tre/health-domain-maturity.ts");
const map = read("app/suc-khoe-tre/health-framework-map.tsx");
const client = read("app/suc-khoe-tre/health-client.tsx");
const page = read("app/suc-khoe-tre/page.tsx");

const catalogIds = [...catalog.matchAll(/\n\s*id: "([^"]+)"/g)].map((match) => match[1]);
const maturityBody = maturity.match(/export const HEALTH_DOMAIN_IMPLEMENTATION = \{([\s\S]*?)\n\} as const satisfies/)?.[1] ?? "";
const maturityIds = [...maturityBody.matchAll(/\n\s*"([^"]+)": \{/g)].map((match) => match[1]);

if (catalogIds.length !== 22) fail(`catalog phải có 22 miền, hiện có ${catalogIds.length}`);
if (maturityIds.length !== catalogIds.length) fail(`maturity registry phải phủ đủ ${catalogIds.length} miền, hiện có ${maturityIds.length}`);

const missingMaturity = catalogIds.filter((id) => !maturityIds.includes(id));
const unknownMaturity = maturityIds.filter((id) => !catalogIds.includes(id));
if (missingMaturity.length) fail(`thiếu maturity: ${missingMaturity.join(", ")}`);
if (unknownMaturity.length) fail(`maturity không thuộc catalog: ${unknownMaturity.join(", ")}`);

for (const status of ["operational", "partial", "framework"]) {
  if (!new RegExp(`maturity: "${status}"`).test(maturity)) fail(`chưa sử dụng maturity ${status}`);
}

const evidenceMatches = [...maturity.matchAll(/evidence: \[([^\]]+)\]/g)];
if (evidenceMatches.length !== 22) fail(`mỗi miền phải có evidence, hiện có ${evidenceMatches.length}/22`);
for (const match of evidenceMatches) {
  const files = [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
  if (!files.length) fail("maturity entry không có evidence file");
  for (const file of files) {
    if (!exists(path.join("app/suc-khoe-tre", file))) fail(`evidence file không tồn tại: ${file}`);
  }
}

if (exists("app/suc-khoe-tre/legacy-health-client.tsx")) fail("legacy-health-client.tsx không được quay lại runtime canonical");
if (exists("app/suc-khoe-tre/health.css")) fail("legacy health.css không được quay lại runtime canonical");
if (!/HealthDeviceGate/.test(page)) fail("page canonical phải đi qua Device Gate");
if (!/HealthFramework/.test(client)) fail("HealthClient phải dùng HealthFramework modular hiện hành");
if (/legacy-health-client|health\.css/.test(client) || /legacy-health-client|health\.css/.test(page)) fail("canonical page/client không được tham chiếu legacy runtime");
if (!/HEALTH_DOMAIN_IMPLEMENTATION/.test(map) || !/healthDomainMaturitySummary/.test(map)) fail("Framework Map phải đọc maturity registry thật");
if (/baselineDomainIds/.test(map)) fail("Framework Map không được dùng danh sách baseline hard-code cũ");

console.log(`Health runtime architecture PASS: ${catalogIds.length} domains · canonical DeviceGate → HealthClient → HealthFramework · legacy monolith removed.`);
