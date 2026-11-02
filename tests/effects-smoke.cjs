const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../effects.js'),'utf8').replace('export function createParticleEffects','function createParticleEffects');
class Color{constructor(v){this.set(v);}set(v){if(typeof v==='string'){const k=parseInt(v.replace('#',''),16);v=k;}this.r=((v>>16)&255)/255;this.g=((v>>8)&255)/255;this.b=(v&255)/255;return this;}}
class Material{constructor(spec){Object.assign(this,spec);if('color'in spec)this.color=new Color(spec.color);}}
class Geometry{constructor(){this.attributes={};}setAttribute(key,attr){this.attributes[key]=attr;return this;}}
class Attribute{constructor(array,n){this.array=array;this.size=n;this.needsUpdate=false;}setUsage(){return this;}}
class Item{constructor(geometry,material){this.geometry=geometry;this.material=material;this.visible=true;this.scale={setScalar:n=>this.scaled=n};this.position={z:0,y:0};this.rotation={};this.children=[];}add(item){this.children.push(item);}}
const mock={Group:Item,Points:Item,LineSegments:Item,Mesh:Item,BufferGeometry:Geometry,BufferAttribute:Attribute,CanvasTexture:class{},RingGeometry:class{},PointsMaterial:Material,LineBasicMaterial:Material,MeshBasicMaterial:Material,Color,AdditiveBlending:2,DynamicDrawUsage:2,DoubleSide:2};
const canvas=()=>({width:0,height:0,getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})});
const context={document:{createElement:()=>canvas()},THREE:mock,console};
vm.runInNewContext(source+';this.createParticleEffects=createParticleEffects;',context);
for(const quality of ['low','medium','high']){
  const scene={items:[],add(item){this.items.push(item);}};
  const fx=context.createParticleEffects(mock,scene,{quality});
  assert.equal(scene.items.length,4,`should add cloud, comets, burst and shockwave for ${quality}`);
  fx.setPalette('neon');assert.equal(fx.palette,'neon');
  fx.setIntensity(1.3);fx.update(1,1/30);
  fx.burst('gold');fx.update(1.1,1/30);
  assert.equal(scene.items[2].visible,true);
  assert(scene.items[2].geometry.attributes.position.needsUpdate);
  for(let i=0;i<90;i++)fx.update(1.2+i/30,1/30);
  assert.equal(scene.items[2].visible,false,`burst should be reclaimed in ${quality}`);
  console.log('PASS: '+quality+' rendering buffers, palettes, comet updates, burst lifecycle');
}
