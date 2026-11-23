#!/usr/bin/env node
/**
 * Run ONLY inside a network-isolated container after dependencies have been installed.
 * This proves a narrow local cold-start smoke, not full offline feature acceptance.
 */
import {spawn} from "node:child_process";
import {setTimeout as sleep} from "node:timers/promises";

if(process.env.HEALTH_OFFLINE_NETWORK_DENIED!=="1"){
 console.error("BLOCKED: run only from the documented Docker --network none CI job");
 process.exit(2);
}
const revision=String(process.env.SOURCE_REVISION||"");
if(!/^[0-9a-f]{40}$/.test(revision)){
 console.error("BLOCKED: exact GitHub source HEAD must be supplied to isolated Health test");
 process.exit(2);
}
const origin="http://127.0.0.1:4173";
const app=spawn("npm",["run","dev","--","--host","127.0.0.1","--port","4173"],{
 cwd:process.cwd(),env:{...process.env,LOCAL_CONTROL_PLANE:"1",LOCAL_CONTROL_ALLOW_LAN:"false"},
 detached:true,
 stdio:["ignore","pipe","pipe"]
});
let logs="";
for(const stream of [app.stdout,app.stderr])stream.on("data",chunk=>{logs=(logs+String(chunk)).slice(-12000)});
let finished=false;app.once("exit",()=>finished=true);
let healthOk=false;
try{
 const deadline=Date.now()+145000;
 while(Date.now()<deadline){
  if(finished)throw new Error("Local health server exited before readiness");
  try{
   const home=await fetch(origin+"/suc-khoe-tre",{redirect:"manual",signal:AbortSignal.timeout(2000)});
   if(home.status===200){
    const html=await home.text();
    if(!/<html|<!doctype html/i.test(html)||html.length<150)throw new Error("Health route returned an invalid app shell");
    healthOk=true;break;
   }
  }catch(e){/* bounded retry, keep last logs below */}
  await sleep(1400);
 }
 if(!healthOk)throw new Error("Health /suc-khoe-tre could not start while external network was physically denied");
 const response=await fetch(origin+"/",{redirect:"manual",signal:AbortSignal.timeout(5000)});
 if(![200,301,302,303,307,308].includes(response.status))
  throw new Error("Offline root navigation failed: "+response.status);
 const contract=await fetch(origin+"/api/control/contract",{redirect:"manual",signal:AbortSignal.timeout(5000)});
 if(contract.status!==200)throw new Error("Offline local public contract unavailable: HTTP "+contract.status);
 const payload=await contract.json();
 if(payload.application!=="health-care"&&payload.canonicalApplication!=="health-care")
  throw new Error("Offline health contract identity unverified");
 // Verify local install shell, SW and real HTTP security boundary with the network
 // physically denied. This never creates or reads patient records.
 const manifestResponse=await fetch(origin+"/manifest.webmanifest",{redirect:"manual",signal:AbortSignal.timeout(5000)});
 if(manifestResponse.status!==200)throw new Error("Offline health PWA manifest missing: HTTP "+manifestResponse.status);
 const manifest=await manifestResponse.json();
 if(manifest.start_url!=="/suc-khoe-tre"||manifest.scope!=="/"||manifest.display!=="standalone")
  throw new Error("Offline health PWA start route/scope invalid");
 const swResponse=await fetch(origin+"/sw.js",{redirect:"manual",signal:AbortSignal.timeout(5000)});
 if(swResponse.status!==200)throw new Error("Offline health Service Worker missing: HTTP "+swResponse.status);
 const sw=await swResponse.text();
 if(sw.length<100||!/addEventListener|self|caches/i.test(sw))
  throw new Error("Offline health Service Worker is not a script");
 const unauthorized=await fetch(origin+"/api/control/status",{redirect:"manual",signal:AbortSignal.timeout(5000)});
 const forbidden=await unauthorized.json();
 // Without a configured control secret the trusted boundary intentionally
 // fails closed with a typed 503, not an invented 401 or a mock authorization.
 const explicitMissingSecret=unauthorized.status===503 && forbidden.code==="HEALTH_CONTROL_SECRET_UNCONFIGURED";
 const explicitAccessDenied=[401,403].includes(unauthorized.status) &&
   ["CONTROL_SERVICE_FORBIDDEN","CONTROL_TICKET_FORBIDDEN","CONTROL_ORIGIN_FORBIDDEN"].includes(forbidden.code);
 if(!explicitMissingSecret && !explicitAccessDenied)
  throw new Error("Offline protected control did not fail closed with an accepted specific reason: HTTP "+
    unauthorized.status+" code "+String(forbidden.code||"missing"));
 const repeat=await fetch(origin+"/suc-khoe-tre",{redirect:"manual",signal:AbortSignal.timeout(5000)});
 if(repeat.status!==200||(await repeat.text()).length<150)
  throw new Error("Offline health core route failed second real navigation");
 console.log(JSON.stringify({
  result:"NETWORK_DENIED_COLD_START_SHELL_AND_AUTH_BOUNDARY_PASS",
  isolation:"docker --network none",
  routes:["/suc-khoe-tre","/","/api/control/contract","/manifest.webmanifest","/sw.js","/suc-khoe-tre (repeat)"],
  protectedControlStatus:unauthorized.status,protectedControlCode:forbidden.code,
  authenticatedControlOperation:explicitMissingSecret?"BLOCKED_UNCONFIGURED":"UNVERIFIED",
  sourceRevision:process.env.SOURCE_REVISION,
  offlinePersistedRecordRoundtrip:"UNVERIFIED",offlineVaultRestore:"UNVERIFIED",
  clinicalUX:"UNVERIFIED",productionAuthorization:false
 }));
} catch(e){
 console.error("HEALTH_NETWORK_DENIED_SMOKE_FAIL: "+(e instanceof Error?e.message:String(e)));
 console.error("Server diagnostics (trimmed):\n"+logs.slice(-8500));
 process.exitCode=1;
}finally{
 try{if(app.pid)process.kill(-app.pid,"SIGTERM")}catch{app.kill("SIGTERM")}
 app.stdout.destroy();
 app.stderr.destroy();
 await Promise.race([new Promise(resolve=>app.once("exit",resolve)),sleep(4000)]);
}
