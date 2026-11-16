// Genuine 3D tube-surface photo anchors, stratified around BOTH ram horns.
// The outer band gets more coverage than the hidden rear, while depth is maintained.
export function selectPhotoAnchors(_data,_width,_height,limit=2000){
 const bands=20,rows=Math.max(1,Math.floor(limit*.90/(bands*2))),out=[];
 const rand=n=>{const v=Math.sin(n*71.93+5.83)*43758.5453;return v-Math.floor(v)};
 const controls=[
  [[8.5,10.8],[9.5,21.5],[15.0,26.5],[25.0,22.2]],
  [[25.0,22.2],[34.0,17.5],[33.0,5.0],[25.0,-.2]],
  [[25.0,-.2],[17.0,-4.0],[14.2,4.5],[18.6,7.5]]
 ];
 function curve(t){
  const seg=Math.min(2,Math.floor(t*3)),u=Math.min(1,t*3-seg),q=1-u,a=controls[seg];
  return {x:q*q*q*a[0][0]+3*q*q*u*a[1][0]+3*q*u*u*a[2][0]+u*u*u*a[3][0],
          y:q*q*q*a[0][1]+3*q*q*u*a[1][1]+3*q*u*u*a[2][1]+u*u*u*a[3][1]};
 }
 for(let row=0;row<rows;row++){
  const t=(row+.5)/rows,c=curve(t),before=curve(Math.max(0,t-.0001)),after=curve(Math.min(1,t+.0001)),
   dx=after.x-before.x,dy=after.y-before.y,len=Math.max(1e-6,Math.hypot(dx,dy)),
   tangentX=dx/len,tangentY=dy/len,
   radius=(3.5*Math.pow(1-t,.55)+.28)*(1+.045*Math.sin(t*19));
  const arc=Math.hypot(curve(Math.max(0,t-1/(rows*2))).x-curve(Math.min(1,t+1/(rows*2))).x,
                       curve(Math.max(0,t-1/(rows*2))).y-curve(Math.min(1,t+1/(rows*2))).y);
  for(let band=0;band<bands;band++)for(const side of [-1,1]){
   // 15/20 segments face the audience, 5 wrap the hidden rear for 3D parallax.
   const phi=band<15?(-1.46+(band+.5+(row%2)*.13)*(2.92/15)):
       (1.46+(band-15+.5)*(Math.PI*2-2.92)/5);
   const sn=Math.sin(phi),cs=Math.cos(phi),i=(row*bands+band)*2+(side>0?1:0);
   const front=cs>.05,hero=front&&Math.abs(phi)<.62&&rand(i+13)>.85;
   const weight=hero?1:front?.8:.35;
   const width=Math.max(.82,Math.min(2.55, radius*(front?.31:.4)))*(hero?1.38:1.+rand(i+17)*.21);
   const height=Math.max(.85,Math.min(2.65,arc*(hero?1.08:.89)));
   const z=2.0-2.6*t+cs*radius;
   out.push({x:side*Math.max(5.15,c.x-tangentY*sn*radius),y:c.y+tangentX*sn*radius,z,side,
    nx:side*(-tangentY)*sn,ny:tangentX*sn,nz:cs,
    tx:side*tangentX,ty:tangentY,weight,width,height,
    brightness:front?.68+.32*cs:.4});
  }
 }
 // A small share of photos belongs on the shoulders, not in front of the face.
 // They sit on two shallow 3D curved patches, retaining the real surface normals.
 const shoulderBands=5,shoulderRows=Math.floor((limit-out.length)/(shoulderBands*2));
 for(let row=0;row<shoulderRows;row++){
   const t=(row+.5)/shoulderRows,a=t*Math.PI*.8;
   const cx=8.2+6.4*Math.sin(a),cy=-7.-18.*t,dx=6.4*Math.PI*.8*Math.cos(a),dy=-18.,len=Math.hypot(dx,dy);
   const r=1.25+.28*(1.-t);
   for(let band=0;band<shoulderBands;band++){
     const phi=-1.2+(band+.5+(row%2)*.14)*2.4/shoulderBands,sn=Math.sin(phi),cs=Math.cos(phi);
     for(const side of [-1,1]){
       const i=row*shoulderBands*2+band*2+(side>0?1:0);
       out.push({x:side*Math.max(5.2,cx-dy/len*sn*r),y:cy+dx/len*sn*r,
         z:1.35+cs*1.8-.6*t,side,nx:side*(-dy/len)*sn,ny:dx/len*sn,nz:cs,
         tx:side*dx/len,ty:dy/len,weight:.62,
         width:1.0+rand(i+28)*.35,height:1.1+rand(i+29)*.5,
         brightness:.63+.25*cs});
     }
   }
 }
 // Interleave both horns and all bands; reducing count keeps silhouette distributed.
 const paired=[],pairs=out.length/2;
 const step=pairs%137===0?139:137;
 for(let i=0;i<pairs;i++){const k=(i*step)%pairs;paired.push(out[k*2],out[k*2+1]);}
 return new Set(paired).size===out.length?paired:out;
}
export function createRamPhotos(THREE,parent,uniforms,{quality='medium',maxTextureSize=4096}={}){
 const grid=45,tile=quality==='low'||maxTextureSize<2600?40:48,size=grid*tile;
 const atlas=document.createElement('canvas');atlas.width=atlas.height=size;const ctx=atlas.getContext('2d'),texture=new THREE.CanvasTexture(atlas);
 texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;
 const photoUniforms={...uniforms,atlas:{value:texture},tileCount:{value:16},grid:{value:grid}};
 let cards=null,anchors=[],ratio=.6,sequence=0,disposed=false,loadedCount=0;
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
 function build(data,w,h){anchors=selectPhotoAnchors(data,w,h,quality==='low'?1200:2000);
 const geo=new THREE.PlaneGeometry(1,1),tiles=new Float32Array(anchors.length),weights=new Float32Array(anchors.length),brightness=new Float32Array(anchors.length);
 anchors.forEach((p,i)=>{tiles[i]=i*37+Math.floor(i/20)*11;weights[i]=p.weight;brightness[i]=p.brightness});
 geo.setAttribute('tileIndex',new THREE.InstancedBufferAttribute(tiles,1));geo.setAttribute('importance',new THREE.InstancedBufferAttribute(weights,1));geo.setAttribute('brightness',new THREE.InstancedBufferAttribute(brightness,1));
 const mat=new THREE.ShaderMaterial({uniforms:photoUniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,
 vertexShader:'attribute float tileIndex,importance,brightness;varying vec2 vUv;varying float vTile,vWeight,vLight;uniform float gather,time;void main(){vUv=uv;vTile=tileIndex;vWeight=importance;vLight=brightness;vec4 p=instanceMatrix*vec4(position,1.);float a=tileIndex*2.39996;p.xyz+=(1.-gather)*vec3(sin(a)*50.,cos(a)*35.,sin(a*1.7)*20.);p.z+=sin(p.y*.6+time*1.3+1.5)*.22;gl_Position=projectionMatrix*modelViewMatrix*p;}',
 fragmentShader:'uniform sampler2D atlas;uniform float tileCount,gather,intensity,grid;varying vec2 vUv;varying float vTile,vWeight,vLight;void main(){if(gather<.02)discard;float edge=min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y));if(edge<.018)discard;float k=mod(vTile,tileCount);vec2 cell=vec2(mod(k,grid),grid-1.-floor(k/grid));vec2 uv=(cell+mix(vec2(.035),vec2(.965),vUv))/grid;vec3 photo=texture2D(atlas,uv).rgb;vec3 tint=mix(vec3(.2,.65,1.),vec3(.85,.25,1.),step(.5,mod(vTile,2.)));float detail=mix(.50,.88,vWeight);vec3 rgb=mix(tint*dot(photo,vec3(.3,.59,.11)),photo,detail);rgb*=vLight*(1.38+vWeight*.21)*min(intensity,1.5);float rim=1.-smoothstep(.022,.055,edge);rgb=mix(rgb,tint*1.35*min(intensity,1.5),rim*.76);float feather=smoothstep(.018,.12,edge);gl_FragColor=vec4(rgb,gather*feather*(.72+vWeight*.23));}'
 });
 cards=new THREE.InstancedMesh(geo,mat,anchors.length);cards.frustumCulled=false;const dummy=new THREE.Object3D(),basis=new THREE.Matrix4();
 anchors.forEach((p,i)=>{const tangent=new THREE.Vector3(p.tx,p.ty,0).normalize(),normal=new THREE.Vector3(p.nx,p.ny,p.nz).normalize(),across=new THREE.Vector3().crossVectors(normal,tangent).normalize();basis.makeBasis(tangent,across,normal);
 dummy.quaternion.setFromRotationMatrix(basis);dummy.position.set(p.x,p.y,p.z);dummy.scale.set(p.height*.96,p.width*1.15,1);dummy.updateMatrix();cards.setMatrixAt(i,dummy.matrix)});
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
 return {build,setRatio,importFiles,demoReady,reset:loadDemo,get count(){return cards?.count||0},get maxCount(){return anchors.length},get loadedCount(){return loadedCount},dispose(){disposed=true;sequence++;cards?.geometry.dispose();cards?.material.dispose();texture.dispose();if(cards)parent.remove(cards)}};
}

