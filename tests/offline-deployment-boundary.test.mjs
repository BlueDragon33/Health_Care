import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=name=>readFileSync('.github/workflows/'+name,'utf8');

test('Health live mode cannot auto-publish when main changes',()=>{
  const file=workflow('live-development-deploy.yml');
  assert.doesNotMatch(file,/^\s+push:\s*$/m);
  assert.match(file,/jobs:\s*\n\s+deploy_live:\s*\n(?:\s*#.*\n)*\s+if:\s*\$\{\{ false \}\}/);
});

for(const [name,job] of [
  ['deploy.yml','deploy-preview'],
  ['deploy-production.yml','deploy-production']
]){
  test(name+' stays dormant in offline-first mode',()=>{
    const file=workflow(name);
    assert.match(file,new RegExp('jobs:\\s*\\n\\s+'+job+':\\s*\\n(?:\\s*#.*\\n)*\\s+if:\\s*\\$\\{\\{ false \\}\\}'));
  });
}

test('Bơi Ếch external release remains outside this Health workflow change',()=>{
  for(const name of ['live-development-deploy.yml','deploy.yml','deploy-production.yml']){
    const content=workflow(name);
    assert.doesNotMatch(content,/deploy-boi-ech|deploy-boi-ech-preview|boiech-ai\.workers\.dev.*wrangler/i);
  }
});
