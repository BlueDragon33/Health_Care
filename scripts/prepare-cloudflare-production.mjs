import fs from "node:fs";
const TEMPLATE="wrangler.cloudflare.production.example.jsonc";
const TARGET="wrangler.cloudflare.production.jsonc";
const required=(name)=>{const v=String(process.env[name]??"").trim(); if(!v) throw new Error(`${name} chưa được cấu hình.`); return v;};
const uuid=(name)=>{const v=required(name).toLowerCase(); if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)) throw new Error(`${name} không đúng UUID D1.`); return v;};
const origin=(name)=>{const u=new URL(required(name)); if(u.protocol!=="https:"||u.username||u.password||u.pathname!=="/"||u.search||u.hash) throw new Error(`${name} phải là HTTPS origin thuần.`); if(u.hostname.endsWith(".chatgpt.site")) throw new Error(`${name} không được dùng ChatGPT Sites.`); return u.origin;};
const prod=uuid("HEALTH_PRODUCTION_D1_DATABASE_ID");
const preview=uuid("HEALTH_PREVIEW_D1_DATABASE_ID");
if(prod===preview) throw new Error("Health Production D1 must differ from Preview D1.");
const revision=String(process.env.GITHUB_SHA??process.env.HEALTH_BUILD_REVISION??"").trim();
if(!/^[A-Za-z0-9._-]{7,80}$/.test(revision)) throw new Error("HEALTH_BUILD_REVISION/GITHUB_SHA không hợp lệ.");
const rendered=fs.readFileSync(TEMPLATE,"utf8")
 .replace("__HEALTH_PRODUCTION_D1_DATABASE_ID__",prod)
 .replace("__APPLICATION_MANAGEMENT_PRODUCTION_ORIGIN__",origin("APPLICATION_MANAGEMENT_PRODUCTION_ORIGIN"))
 .replace("__HEALTH_BUILD_REVISION__",revision);
if(/__[A-Z0-9_]+__/.test(rendered)) throw new Error("Health production config còn placeholder.");
fs.writeFileSync(TARGET,rendered,{mode:0o600});
console.log(`Prepared ${TARGET} for revision ${revision}.`);
