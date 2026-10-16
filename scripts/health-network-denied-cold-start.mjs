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
 console.log(JSON.stringify({
  result:"NETWORK_DENIED_COLD_START_SMOKE_PASS",
  isolation:"docker --network none",routes:["/suc-khoe-tre","/","/api/control/contract"],
  offlinePersistedRecordRoundtrip:"UNVERIFIED",offlineVaultRestore:"UNVERIFIED",
  productionAuthorization:false
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
