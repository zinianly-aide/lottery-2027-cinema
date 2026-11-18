'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=file=>fs.readFileSync(path.resolve(__dirname,'..',file),'utf8');
const ram=require('../ram-shape.js');
const expected=['horn','ear','face','wool','eye','brow','muzzle','ribbon'];
assert.equal(ram.traces().length,13);
for(const n of [850,1350,2000]){
 const points=ram.createTargets(n);
 assert.equal(points.length,n);
 assert.deepEqual(ram.createTargets(n),points,'stable deterministic targets for projector & tests');
 const roles={};
 for(let i=0;i<n;i++){
  const p=points[i];roles[p.role]=(roles[p.role]||0)+1;
  for(const v of [p.x,p.y,p.z])assert(Number.isFinite(v),'all targets must be finite');
  assert(Math.abs(p.x)<80&&Math.abs(p.y)<45,'shape must fit cinematic stage');
  for(const preset of ['galaxy','neon','gold']){
   const c=ram.hexFor(p,i,preset);
   assert(Number.isInteger(c)&&c>0&&c<=0xffffff);
  }
 }
 for(const role of expected)assert(roles[role]>0,role+' points missing');
 assert(roles.horn>n*.34&&roles.horn<n*.43,'horns dominate visual');
 assert(roles.ribbon>n*.09&&roles.ribbon<n*.13,'ribbons remain subtle');
 const horns=points.filter(p=>p.role==='horn');
 const left=horns.filter(p=>p.x<0).length,right=horns.filter(p=>p.x>=0).length;
 assert(Math.abs(left-right)<n*.03,'front-facing horns must be symmetric');
 console.log('PASS: '+n+' neon ram particles, front-facing horn balance, silhouette roles and palette');
}
for(const f of ['app.js','fallback.js','index.html','ram-visual.js']){
 const text=source(f);assert(/ram/i.test(text),f+' must support ram');
}
const html=source('index.html');
assert(html.includes('id="ram"'));
assert(html.includes('id="cinema-fullscreen"'));
assert(html.includes('ram-shape.js?v=cinema5'));
const app=source('app.js');
assert(app.includes("qs.get('mode')"));
assert(app.includes('ramVisual.setVisible'));
assert(app.includes("14500,'ram'"));
const fallback=source('fallback.js');
assert(fallback.includes('drawFallback'));
assert(fallback.includes("['text','sphere','matrix','scatter','ram','ramdepth','ramref']"));
const css=source('controls.css');
assert(css.includes('.control #ram'));
assert(css.includes('body.ram-active'));
const svg=source('neon-ram-cinema.svg');
assert(svg.includes('viewBox="0 0 1600 610"'));
assert(svg.includes('linearGradient id="ribbon"'));
assert(!/(?:xlink:)?href=[\"']https?:\/\//.test(svg),'no external SVG dependencies');
console.log('PASS: cinema style consistency, WebGL + 2D fallback, fullscreen, preview parameter');
