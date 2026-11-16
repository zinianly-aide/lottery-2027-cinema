const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const text=fs.readFileSync(require('node:path').join(__dirname,'../ram-photos.js'),'utf8').replace(/export /g,'');
const draws=[];let pending=null;
const context={clearRect(){},fillRect(){},fillText(){},drawImage(...args){draws.push(args)}};
const sandbox={setTimeout,document:{createElement:()=>({getContext:()=>context})},createImageBitmap:async()=>({width:256,height:384,close(){}})};
vm.createContext(sandbox);vm.runInContext(text+';this.api={selectPhotoAnchors,createRamPhotos};',sandbox);
const data=new Uint8Array(640*360*4).fill(255);
for(const limit of [960,1800,2000]){const a=sandbox.api.selectPhotoAnchors(data,640,360,limit);assert(a.length<=limit&&a.length>0);assert.equal(a.filter(p=>p.side<0).length,a.filter(p=>p.side>0).length);for(const p of a){assert(Math.abs(p.x)>5,'face must be clear');assert(Number.isFinite(p.z));assert(Math.abs(Math.hypot(p.nx,p.ny,p.nz)-1)<1e-6);assert(Math.abs(p.tx*p.nx+p.ty*p.ny)<1e-6,'surface tangent perpendicular to normal');}}
const surface=sandbox.api.selectPhotoAnchors(data,640,360,1800);assert(surface.some(p=>p.z<0)&&surface.some(p=>p.z>3),'front and back surface depth');assert(new Set(surface.map(p=>p.width.toFixed(2))).size>10,'variable photo scale');assert(surface.some(p=>p.weight===1)&&surface.some(p=>p.weight===.3),'hierarchical weights');
class Geo{setAttribute(){return this}dispose(){}}
class Material{constructor(opts){Object.assign(this,opts)}dispose(){}}
class Dummy{constructor(){this.position={set(){}};this.rotation={};this.quaternion={setFromRotationMatrix(){}};this.scale={set(){}};this.matrix={}}updateMatrix(){}}
class Mesh{constructor(g,m,n){this.geometry=g;this.material=m;this.count=n;this.instanceMatrix={}}setMatrixAt(){}}
class Vector3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}normalize(){const l=Math.hypot(this.x,this.y,this.z)||1;this.x/=l;this.y/=l;this.z/=l;return this}crossVectors(a,b){this.x=a.y*b.z-a.z*b.y;this.y=a.z*b.x-a.x*b.z;this.z=a.x*b.y-a.y*b.x;return this}}
const THREE={Vector3,DoubleSide:2,Matrix4:class{makeBasis(){}},CanvasTexture:class{dispose(){}},PlaneGeometry:Geo,InstancedBufferAttribute:class{},ShaderMaterial:Material,InstancedMesh:Mesh,Object3D:Dummy};
const group={children:[],add(c){this.children.push(c)},remove(c){this.children=this.children.filter(x=>x!==c)}};
(async()=>{const u={gather:{value:1},time:{value:0},photoMix:{value:.7}};const p=sandbox.api.createRamPhotos(THREE,group,u,{});p.build(data,640,360);assert(p.count>0);p.setRatio(0);assert.equal(p.count,0);p.setRatio(1);assert(p.count===1800);let r=await p.importFiles([{type:'image/jpeg'}]);assert.equal(r.loaded,1);const crop=draws.find(a=>a[0]?.width===256);assert.equal(crop[3],256);assert.equal(crop[4],256);assert.equal(crop[2],64,'portrait must be center-cropped, not stretched');let progress=0;r=await p.importFiles(Array.from({length:1500},()=>({type:'image/jpeg'})),()=>progress++);assert.equal(r.loaded,1500);assert.equal(p.loadedCount,1500);assert.equal(progress,60);sandbox.createImageBitmap=async()=>{throw Error('bad')};r=await p.importFiles([{type:'image/png'}]);assert.equal(r.failed,1);sandbox.createImageBitmap=()=>new Promise(resolve=>pending=resolve);const promise=p.importFiles([{type:'image/png'}]);p.reset();pending({width:256,height:256,close(){}});r=await promise;assert.equal(r.cancelled,true);p.dispose();assert.equal(group.children.length,0);
const images=[];sandbox.Image=class{set src(v){images.push(this)}};sandbox.URL=URL;sandbox.location={href:'https://example.test/lottery/'};
sandbox.createImageBitmap=async()=>({width:160,height:160,close(){}});
const q=sandbox.api.createRamPhotos(THREE,group,u,{});images.at(-1).onload();const demo=await q.demoReady;assert.equal(demo.count,12);assert.equal(demo.demo,true);assert.equal(q.loadedCount,0,'demo must not count as real uploads');
const restore=q.reset(),pendingImage=images.at(-1);await q.importFiles([{type:'image/jpeg'}]);pendingImage.onload();assert.equal((await restore).cancelled,true,'late demo must not overwrite real photos');assert.equal(q.loadedCount,1);
const failed=q.reset();images.at(-1).onerror();assert.equal((await failed).demo,false,'demo error resolves safely');q.dispose();
console.log('PASS: curved surface normals and depth, varied size/weights, 1500 photos, progress, crop, failure, cancellation, disposal');})().catch(e=>{console.error(e);process.exitCode=1});
