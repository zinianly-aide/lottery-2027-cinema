const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const script=fs.readFileSync(path.join(root,'app.js'),'utf8');
const split=script.indexOf('// Playback controls are separate from the lottery operator panel');
assert(split>0,'control initialization is missing');
class FakeElement{
  constructor(dataset={}){this.dataset=dataset;this.value='1';this.textContent='';this.listeners={};this.active=false;this.open=false;this.classList={toggle:(name,active)=>{if(name==='active')this.active=active;}};}
  addEventListener(name,handler){this.listeners[name]=handler;}
  fire(name){assert(this.listeners[name],`missing handler ${name}`);this.listeners[name]({target:this});}
  setAttribute(name,value){this[name]=value;}
}
const names=['speed-range','speed-value','speed-pause','dock-label','speed-dock','effect-preset','effect-burst','effect-intensity'];
const nodes=Object.fromEntries(names.map(n=>[n,new FakeElement()]));
const chips=[.5,1,1.5,2].map(n=>new FakeElement({speed:String(n)}));
const doc={querySelector:s=>{const key=s.slice(1);assert(nodes[key],`unknown selector ${s}`);return nodes[key];},querySelectorAll:s=>{assert.equal(s,'[data-speed]');return chips;}};
let bursts=[],palettes=[],intensities=[],meshUpdates=0;
const effects={palette:'galaxy',burst:k=>bursts.push(k),setPalette(k){this.palette=k;palettes.push(k);},setIntensity:n=>intensities.push(n)};
const mesh={instanceColor:{needsUpdate:false},setColorAt(){meshUpdates++;}};
const context={document:doc,window:{},effects,mesh,N:850,random:(n,k)=>((n*31+k)%100)/100,THREE:{Color:class{setHSL(){return this}}},morph:()=>{},playbackRate:1,paused:false,mobile:false};
vm.runInNewContext(script.slice(split),context);
assert.equal(context.window.cinemaControls.speed,1);
assert.equal(nodes['speed-value'].textContent,'1.00×');
assert.equal(nodes['speed-dock'].open,true,'desktop panel must be visible');
nodes['speed-range'].value='2.35';nodes['speed-range'].fire('input');
assert.equal(context.window.cinemaControls.speed,2.35);
assert.equal(nodes['speed-value'].textContent,'2.35×');
nodes['speed-pause'].fire('click');assert.equal(context.window.cinemaControls.paused,true);
nodes['speed-pause'].fire('click');assert.equal(context.window.cinemaControls.paused,false);
chips[0].fire('click');assert.equal(context.window.cinemaControls.speed,.5);assert(chips[0].active);
nodes['effect-preset'].fire('click');assert.equal(effects.palette,'neon');assert.equal(meshUpdates,850);
nodes['effect-preset'].fire('click');assert.equal(effects.palette,'gold');
nodes['effect-burst'].fire('click');assert.equal(bursts.at(-1),'gold');
nodes['effect-intensity'].value='1.4';nodes['effect-intensity'].fire('input');assert.equal(intensities.at(-1),1.4);
context.window.cinemaControls.setSpeed(7);assert.equal(context.window.cinemaControls.speed,3);
context.window.cinemaControls.setSpeed(0);assert.equal(context.window.cinemaControls.speed,.25);
assert(script.includes('simClock+=dt*1000') && script.includes('effects.update(sec,dt)'),'virtual-time particle playback missing');
console.log('PASS: speed slider, presets, pause/resume, palettes, burst, intensity, clamp and virtual-time loop');
