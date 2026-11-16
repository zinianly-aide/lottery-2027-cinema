const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const text=fs.readFileSync(require('node:path').join(__dirname,'../ram-photos.js'),'utf8').replace(/export /g,'');
const draws=[];let pending=null;
const context={clearRect(){},fillRect(){},fillText(){},drawImage(...args){draws.push(args)}};
const sandbox={document:{createElement:()=>({getContext:()=>context})},createImageBitmap:async()=>({width:256,height:384,close(){}})};
vm.createContext(sandbox);vm.runInContext(text+';this.api={selectPhotoAnchors,createRamPhotos};',sandbox);
const data=new Uint8Array(640*360*4).fill(255);
for(const limit of [180,380,560]){const a=sandbox.api.selectPhotoAnchors(data,640,360,limit);assert(a.length<=limit&&a.length>0);assert.equal(a.filter(p=>p.side<0).length,a.filter(p=>p.side>0).length);for(const p of a){assert(Math.abs(p.x)>6,'face must be clear');assert(Number.isFinite(p.z));}}
assert.equal(sandbox.api.selectPhotoAnchors(new Uint8Array(data.length),640,360).length,0);
class Geo{setAttribute(){return this}dispose(){}}
class Material{constructor(opts){Object.assign(this,opts)}dispose(){}}
class Dummy{constructor(){this.position={set(){}};this.rotation={};this.scale={set(){}};this.matrix={}}updateMatrix(){}}
class Mesh{constructor(g,m,n){this.geometry=g;this.material=m;this.count=n;this.instanceMatrix={}}setMatrixAt(){}}
const THREE={CanvasTexture:class{dispose(){}},PlaneGeometry:Geo,InstancedBufferAttribute:class{},ShaderMaterial:Material,InstancedMesh:Mesh,Object3D:Dummy};
const group={children:[],add(c){this.children.push(c)},remove(c){this.children=this.children.filter(x=>x!==c)}};
(async()=>{const u={gather:{value:1},time:{value:0},photoMix:{value:.7}};const p=sandbox.api.createRamPhotos(THREE,group,u,{});p.build(data,640,360);assert(p.count>0);p.setRatio(0);assert.equal(p.count,0);p.setRatio(1);assert(p.count<=380);let r=await p.importFiles([{type:'image/jpeg'}]);assert.equal(r.loaded,1);const crop=draws.find(a=>a[0]?.width===256);assert.equal(crop[3],256);assert.equal(crop[4],256);assert.equal(crop[2],64,'portrait must be center-cropped, not stretched');sandbox.createImageBitmap=async()=>{throw Error('bad')};r=await p.importFiles([{type:'image/png'}]);assert.equal(r.failed,1);sandbox.createImageBitmap=()=>new Promise(resolve=>pending=resolve);const promise=p.importFiles([{type:'image/png'}]);p.reset();pending({width:256,height:256,close(){}});r=await promise;assert.equal(r.cancelled,true);p.dispose();assert.equal(group.children.length,0);console.log('PASS: balanced anchors, face exclusion, coverage, portrait crop, failed import, reset cancellation, disposal');})().catch(e=>{console.error(e);process.exitCode=1});
