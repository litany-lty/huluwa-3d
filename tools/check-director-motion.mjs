import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const url = new URL('../src/director/PerformanceMath.js',import.meta.url);
const { groundedFoot } = await import('data:text/javascript;base64,' + Buffer.from(await readFile(url)).toString('base64'));

const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6, [a,b]);
for(const d of [0,0.1,0.2]) {
  const foot=groundedFoot(d, 4, 1, 0.1, 0);
  close(d+foot.offset,0); close(foot.lift,0);
}
assert.ok(groundedFoot(.75,4,1,.1,0).lift>.05);
for (const stop of [0,0.35,4,4.37]) {
  for (const side of [0,1]){
    close(groundedFoot(stop,stop,1,.1,side).offset,0);
    close(groundedFoot(stop,stop,1,.1,side).lift,0);
  }
}
const visits=[.14,2.78,.9,2.78,.14];
assert.deepEqual(groundedFoot(visits[1],4,1,.1,1),groundedFoot(visits[3],4,1,.1,1));
for(const side of [0,1]) for(let k=1;k<=400;k++){
 const x=k/100;const l=groundedFoot(x-1e-8,4,1,.1,side),r=groundedFoot(x+1e-8,4,1,.1,side);
 assert.ok(Math.abs(l.offset-r.offset)<1e-5 && Math.abs(l.lift-r.lift)<1e-5, [x,side,l,r]);
}
console.log('Ground contact, swing, stop, frame seek and continuity verified.');
