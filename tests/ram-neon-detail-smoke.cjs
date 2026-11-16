const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const three=await import(pathToFileURL(path.resolve(__dirname,'../vendor/three.module.js')).href);
 const {createRamNeonDetail}=await import(pathToFileURL(path.resolve(__dirname,'../ram-neon-detail.js')).href);
 for(const [quality,count] of [['low',5200],['medium',14000],['high',23000]]){
  const parent=new three.Group();
  const detail=createRamNeonDetail(three,parent,{quality});
  assert.equal(parent.children.length,1);
  const group=parent.children[0],points=group.children.filter(v=>v.type==='Points');
  assert(points.some(v=>v.geometry.attributes.position.count===count),'volumetric face has correct density');
  assert(group.children.some(v=>v.type==='Mesh'),'horns and face have 3D curve geometry');
  detail.update(5.2);detail.dispose();assert.equal(parent.children.length,0);
  console.log('PASS neon face and horn geometry',quality,count);
 }
})().catch(e=>{console.error(e);process.exitCode=1});
