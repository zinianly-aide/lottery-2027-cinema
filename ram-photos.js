// One instanced draw call for photo cards; uploads remain in this browser session.
export function selectPhotoAnchors(data,width,height,limit=420){
 const out=[],gap=qualityGap(limit);
 for(let y=12;y<height-12;y+=gap)for(let x=12;x<width-12;x+=gap){
  const X=(x/width-.5)*85,Y=(.5-y/height)*47.8,ax=Math.abs(X);
  const horn=ax>10&&ax<28.5&&Y>-3&&Y<21;
  const shoulder=ax>6&&ax<17&&Y<-4&&Y>-17;
  const i=(y*width+x)*4,l=Math.max(data[i],data[i+1],data[i+2])/255;
  if(!(horn||shoulder)||l<.38)continue;
  out.push({x:X,y:Y,z:2+l*1.5+7*Math.exp(-((X/8)**2)-((Y-1)/15)**2),side:X<0?-1:1});
 }
 // Interleave both sides so a reduced ratio keeps the horns balanced.
 const left=out.filter(p=>p.side<0),right=out.filter(p=>p.side>0),balanced=[];
 const count=Math.min(limit,2*Math.min(left.length,right.length));
 for(let i=0;i<count/2;i++){balanced.push(left[Math.floor(i*left.length/(count/2))],right[Math.floor(i*right.length/(count/2))]);}
 return balanced;
}
function qualityGap(limit){return limit<=200?14:10}
export function createRamPhotos(THREE,parent,uniforms,{quality='medium'}={}){
 const atlas=document.createElement('canvas');atlas.width=atlas.height=2048;
 const ctx=atlas.getContext('2d');const texture=new THREE.CanvasTexture(atlas);
 texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;
 const photoUniforms={...uniforms,atlas:{value:texture},tileCount:{value:16}};
 let cards=null,anchors=[],ratio=.7,sequence=0,disposed=false;
 function demo(){ctx.clearRect(0,0,2048,2048);for(let i=0;i<16;i++){const x=(i%16)*128,y=0;ctx.fillStyle=i%2?'#35155e':'#10365b';ctx.fillRect(x,y,128,128);ctx.font='76px sans-serif';ctx.textAlign='center';ctx.fillText('🐑',x+64,y+83);ctx.fillStyle='#d6edff';ctx.font='13px sans-serif';ctx.fillText('2027 · DEMO',x+64,y+117);}photoUniforms.tileCount.value=16;texture.needsUpdate=true}
 demo();
 function build(data,w,h){anchors=selectPhotoAnchors(data,w,h,quality==='low'?180:quality==='high'?560:380);
  const geo=new THREE.PlaneGeometry(1,1),tiles=new Float32Array(anchors.length);for(let i=0;i<tiles.length;i++)tiles[i]=i;
  geo.setAttribute('tileIndex',new THREE.InstancedBufferAttribute(tiles,1));
  const mat=new THREE.ShaderMaterial({uniforms:photoUniforms,transparent:true,depthWrite:false,
   vertexShader:'attribute float tileIndex;varying vec2 vUv;varying float vTile;uniform float gather,time;void main(){vUv=uv;vTile=tileIndex;vec4 p=instanceMatrix*vec4(position,1.);float a=tileIndex*2.39996;p.xyz+=(1.-gather)*vec3(sin(a)*50.,cos(a)*35.,sin(a*1.7)*20.);p.z+=sin(time+tileIndex)*.12;gl_Position=projectionMatrix*modelViewMatrix*p;}',
   fragmentShader:'uniform sampler2D atlas;uniform float tileCount,gather,intensity;varying vec2 vUv;varying float vTile;void main(){float k=mod(vTile,tileCount);vec2 cell=vec2(mod(k,16.),15.-floor(k/16.));vec2 uv=(cell+mix(vec2(.025),vec2(.975),vUv))/16.;vec4 photo=texture2D(atlas,uv);float edge=min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y));vec3 neon=mix(vec3(.12,.8,1.),vec3(1.,.2,.9),step(.5,mod(vTile,2.)));vec3 rgb=mix(neon,photo.rgb,smoothstep(.018,.05,edge));gl_FragColor=vec4(rgb*min(intensity,1.4),gather);}'
  });
  cards=new THREE.InstancedMesh(geo,mat,anchors.length);cards.frustumCulled=false;cards.renderOrder=4;const dummy=new THREE.Object3D();
  anchors.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.z=p.side*.12*Math.sin(i*.7);dummy.scale.set(1.5,1.8,1);dummy.updateMatrix();cards.setMatrixAt(i,dummy.matrix)});cards.instanceMatrix.needsUpdate=true;parent.add(cards);setRatio(ratio);
 }
 function setRatio(v){ratio=Math.max(0,Math.min(1,Number(v)||0));uniforms.photoMix.value=ratio;if(cards)cards.count=Math.floor(anchors.length*ratio/2)*2}
 async function importFiles(files){
  const token=++sequence,list=Array.from(files).filter(f=>f.type.startsWith('image/')).slice(0,256);
  if(!list.length)return {loaded:0,failed:0};
  // Stage atlas atomically so cancellation cannot leave partially replaced tiles.
  const staging=document.createElement('canvas');staging.width=staging.height=2048;const c=staging.getContext('2d');let loaded=0,failed=0;
  for(const file of list){if(token!==sequence||disposed)return {cancelled:true};let bitmap;try{
   bitmap=await createImageBitmap(file,{resizeWidth:256,resizeQuality:'medium'});
   const side=Math.min(bitmap.width,bitmap.height),x=(loaded%16)*128,y=Math.floor(loaded/16)*128;
   c.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,x,y,128,128);loaded++;
  }catch{failed++}finally{bitmap?.close()}}
  if(token!==sequence||disposed)return {cancelled:true};if(loaded){ctx.clearRect(0,0,2048,2048);ctx.drawImage(staging,0,0);photoUniforms.tileCount.value=loaded;texture.needsUpdate=true}
  return {loaded,failed,limited:files.length>256};
 }
 return {build,setRatio,importFiles,reset(){sequence++;demo()},get count(){return cards?.count||0},dispose(){disposed=true;sequence++;cards?.geometry.dispose();cards?.material.dispose();texture.dispose();if(cards)parent.remove(cards)}};
}

