const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const {sampleRamHeadMask:mask}=await import(pathToFileURL(path.resolve(__dirname,'../ram-depth.js')).href);
 for(const [label,x,y] of [
  ['left horn tip',130,148],['left horn crown',198,35],
  ['right horn tip',507,150],['right horn crown',445,36],
  ['forehead',319,90],['nose',318,212],['chest taper',320,321]
 ])assert(mask(x,y)>.85,`${label} was clipped: ${mask(x,y)}`);
 for(const [label,x,y] of [
  ['left external ring',19,205],['right external ring',617,175],
  ['upper background',315,1],['far-left background',55,63]
 ])assert(mask(x,y)<.05,`${label} was retained: ${mask(x,y)}`);
 const src=require('node:fs').readFileSync(path.resolve(__dirname,'../ram-depth.js'),'utf8');
 assert(src.includes('orbit.visible=!v'),'spray mode must independently hide the orbit mesh');
 assert(src.includes('masks.push(sampleRamHeadMask(x,y))'),'mask must use correct reference-image coordinates');
 console.log('PASS full left/right horns, face, chest and excluded external rings');
})().catch(e=>{console.error(e);process.exitCode=1});
