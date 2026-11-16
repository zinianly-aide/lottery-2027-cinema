// Parametric curled-horn surface; photo sizes follow depth and surface importance.
export function selectPhotoAnchors(_data,_width,_height,limit=1800){
 const out=[],bands=18,rows=Math.floor(limit/(bands*2)),rand=n=>{const v=Math.sin(n*71.93)*43758.54;return v-Math.floor(v)};
 function curve(t){const seg=t<.5?[[8,12],[13,26],[28,25],[26,7]]:[[26,7],[27,-7],[13,-6],[17,1]],u=t<.5?t*2:(t-.5)*2,q=1-u;
 return {x:q*q*q*seg[0][0]+3*q*q*u*seg[1][0]+3*q*u*u*seg[2][0]+u*u*u*seg[3][0],y:q*q*q*seg[0][1]+3*q*q*u*seg[1][1]+3*q*u*u*seg[2][1]+u*u*u*seg[3][1]}}
 for(let row=0;row<rows;row++){const t=(row+.5)/rows,c=curve(t),next=curve(Math.min(1,t+.001)),dx=next.x-c.x,dy=next.y-c.y,len=Math.hypot(dx,dy),radius=2.6*Math.pow(1-t,.55)+.22;
 for(let band=0;band<bands;band++){const phi=(band+.5+(row%2)*.16)/bands*Math.PI*2,r=radius*(.99+rand(row*bands+band)*.02),sn=Math.sin(phi),cs=Math.cos(phi);
 for(const side of [-1,1]){const index=row*bands*2+band*2+(side>0?1:0),nx=side*(-dy/len)*sn,ny=dx/len*sn,nz=cs;
 const front=(cs+1)/2,hero=front>.8&&rand(index+9)>.86,weight=hero?1:front>.55?.82:.35;
 const spacing=Math.min(len/.001/rows,radius*.9),scale=spacing*(hero?1.32:.82+rand(index+11)*.16)*(front>.5?1:.7);
 out.push({x:side*(c.x-dy/len*sn*r),y:c.y+dx/len*sn*r,z:cs*r+1,side,nx,ny,nz,tx:side*dx/len,ty:dy/len,weight,
 width:scale*.88,height:scale,brightness:.62+front*.38});
 }}}
 // Stratified order: reducing coverage removes whole rows evenly, with paired horns.
 const ordered=[],pairs=out.length/2;for(let i=0;i<pairs;i++){const k=(i*137)%pairs;ordered.push(out[k*2],out[k*2+1]);}
 // 137 is coprime to the supported row counts; fallback guards arbitrary test limits.
 return new Set(ordered).size===out.length?ordered:out;
}
export function createRamPhotos(THREE,parent,uniforms,{quality='medium',maxTextureSize=4096}={}){
 const grid=45,tile=quality==='low'||maxTextureSize<3600?40:80,size=grid*tile;
 const atlas=document.createElement('canvas');atlas.width=atlas.height=size;const ctx=atlas.getContext('2d'),texture=new THREE.CanvasTexture(atlas);
 texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;
 const photoUniforms={...uniforms,atlas:{value:texture},tileCount:{value:16},grid:{value:grid}};
 let cards=null,anchors=[],ratio=.85,sequence=0,disposed=false,loadedCount=0;
 function demo(){ctx.clearRect(0,0,size,size);for(let i=0;i<16;i++){const x=i*tile;ctx.fillStyle=i%2?'#35155e':'#10365b';ctx.fillRect(x,0,tile,tile);ctx.font=Math.floor(tile*.65)+'px sans-serif';ctx.textAlign='center';ctx.fillText('🐑',x+tile/2,tile*.73);}loadedCount=0;photoUniforms.tileCount.value=16;texture.needsUpdate=true}
 function loadDemo(){
  const token=++sequence;demo();
  if(typeof Image==='undefined')return Promise.resolve({demo:false,count:0});
  return new Promise(resolve=>{
   const image=new Image();image.onload=()=>{
    if(disposed||token!==sequence){resolve({cancelled:true});return;}
    ctx.clearRect(0,0,size,size);
    for(let i=0;i<12;i++)ctx.drawImage(image,i*80,0,80,80,i*tile,0,tile,tile);
    photoUniforms.tileCount.value=12;loadedCount=0;texture.needsUpdate=true;
    resolve({demo:true,count:12});
   };
   image.onerror=()=>resolve({demo:false,count:0});
   image.src=new URL('./assets/demo-portraits/atlas.jpg',location.href).href;
  });
 }
 const demoReady=loadDemo();
 function build(data,w,h){anchors=selectPhotoAnchors(data,w,h,quality==='low'?960:quality==='high'?2000:1800);
 const geo=new THREE.PlaneGeometry(1,1),tiles=new Float32Array(anchors.length),weights=new Float32Array(anchors.length),brightness=new Float32Array(anchors.length);
 anchors.forEach((p,i)=>{tiles[i]=i;weights[i]=p.weight;brightness[i]=p.brightness});
 geo.setAttribute('tileIndex',new THREE.InstancedBufferAttribute(tiles,1));geo.setAttribute('importance',new THREE.InstancedBufferAttribute(weights,1));geo.setAttribute('brightness',new THREE.InstancedBufferAttribute(brightness,1));
 const mat=new THREE.ShaderMaterial({uniforms:photoUniforms,transparent:true,depthWrite:true,side:THREE.DoubleSide,
 vertexShader:'attribute float tileIndex,importance,brightness;varying vec2 vUv;varying float vTile,vWeight,vLight;uniform float gather,time;void main(){vUv=uv;vTile=tileIndex;vWeight=importance;vLight=brightness;vec4 p=instanceMatrix*vec4(position,1.);float a=tileIndex*2.39996;p.xyz+=(1.-gather)*vec3(sin(a)*50.,cos(a)*35.,sin(a*1.7)*20.);gl_Position=projectionMatrix*modelViewMatrix*p;}',
 fragmentShader:'uniform sampler2D atlas;uniform float tileCount,gather,intensity,grid;varying vec2 vUv;varying float vTile,vWeight,vLight;void main(){if(gather<.02)discard;float edge=min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y));if(edge<.018)discard;float k=mod(vTile,tileCount);vec2 cell=vec2(mod(k,grid),grid-1.-floor(k/grid));vec2 uv=(cell+mix(vec2(.035),vec2(.965),vUv))/grid;vec3 photo=texture2D(atlas,uv).rgb;vec3 tint=mix(vec3(.2,.65,1.),vec3(.85,.25,1.),step(.5,mod(vTile,2.)));float detail=mix(.38,.92,vWeight);vec3 rgb=mix(tint*dot(photo,vec3(.3,.59,.11)),photo,detail);rgb*=vLight*(.88+vWeight*.12)*min(intensity,1.5);float rim=1.-smoothstep(.022,.055,edge);rgb=mix(rgb,tint*1.35*min(intensity,1.5),rim*.85);gl_FragColor=vec4(rgb,gather);}'
 });
 cards=new THREE.InstancedMesh(geo,mat,anchors.length);cards.frustumCulled=false;const dummy=new THREE.Object3D(),basis=new THREE.Matrix4();
 anchors.forEach((p,i)=>{const tangent=new THREE.Vector3(p.tx,p.ty,0).normalize(),normal=new THREE.Vector3(p.nx,p.ny,p.nz).normalize(),across=new THREE.Vector3().crossVectors(normal,tangent).normalize();basis.makeBasis(tangent,across,normal);
 dummy.quaternion.setFromRotationMatrix(basis);dummy.position.set(p.x,p.y,p.z);dummy.scale.set(p.height,p.width,1);dummy.updateMatrix();cards.setMatrixAt(i,dummy.matrix)});
 cards.instanceMatrix.needsUpdate=true;parent.add(cards);setRatio(ratio);
 }
 function setRatio(v){ratio=Math.max(0,Math.min(1,Number(v)||0));uniforms.photoMix.value=ratio;if(cards)cards.count=Math.floor(anchors.length*ratio/2)*2}

 async function importFiles(files,onProgress=()=>{}){
 const token=++sequence,list=Array.from(files).filter(f=>f.type.startsWith('image/')).slice(0,2000);
 if(!list.length)return {loaded:0,failed:0};
 const staging=document.createElement('canvas');staging.width=staging.height=size;const c=staging.getContext('2d');let loaded=0,failed=0;
 for(const file of list){if(token!==sequence||disposed)return {cancelled:true};let bitmap;try{
 bitmap=await createImageBitmap(file,{resizeWidth:160,resizeQuality:'medium'});
 const side=Math.min(bitmap.width,bitmap.height),x=(loaded%grid)*tile,y=Math.floor(loaded/grid)*tile;
 c.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,x,y,tile,tile);loaded++;
 }catch{failed++}finally{bitmap?.close()}
 if((loaded+failed)%25===0){onProgress(loaded+failed,list.length);await new Promise(resolve=>setTimeout(resolve,0))}
 }
 if(token!==sequence||disposed)return {cancelled:true};
 if(loaded){ctx.clearRect(0,0,size,size);ctx.drawImage(staging,0,0);loadedCount=loaded;photoUniforms.tileCount.value=loaded;texture.needsUpdate=true}
 return {loaded,failed,limited:files.length>2000,visible:cards?.count||0};
 }
 return {build,setRatio,importFiles,demoReady,reset:loadDemo,get count(){return cards?.count||0},get loadedCount(){return loadedCount},dispose(){disposed=true;sequence++;cards?.geometry.dispose();cards?.material.dispose();texture.dispose();if(cards)parent.remove(cards)}};
}

