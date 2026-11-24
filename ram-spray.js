// Fourth mode: portrait cards emerge above the original depth-particle ram,
// spiral along both horn curves and settle into two GPU-instanced portrait walls.
// Independent of the lottery winner list and existing photo-horn mode.
export function createRamSpray(T, scene, {quality='medium',maxTextureSize=4096}={}) {
  const maxCount=quality==='low'?240:quality==='high'?1600:1200;
  const countLimit=Math.min(maxCount,1600);
  const grid=40, tile=maxTextureSize<2000?36:48, size=grid*tile;
  const sheet=document.createElement('canvas');sheet.width=sheet.height=size;
  const ctx=sheet.getContext('2d');const tex=new T.CanvasTexture(sheet);
  tex.colorSpace=T.SRGBColorSpace;tex.generateMipmaps=true;tex.minFilter=T.LinearMipmapLinearFilter;
  const uniforms={atlas:{value:tex},grid:{value:grid},loaded:{value:12},glow:{value:1}};
  const geo=new T.PlaneGeometry(1,1);
  const indices=new Float32Array(countLimit);
  for(let i=0;i<countLimit;i++)indices[i]=i;
  geo.setAttribute('tileIndex',new T.InstancedBufferAttribute(indices,1));
  const mat=new T.ShaderMaterial({
    uniforms, transparent:true,depthWrite:false,side:T.DoubleSide,
    vertexShader:`attribute float tileIndex; varying vec2 vUv;varying float vTile;
    void main(){vUv=uv;vTile=tileIndex;vec4 p=instanceMatrix*vec4(position,1.);
      gl_Position=projectionMatrix*modelViewMatrix*p;}`,
    fragmentShader:`uniform sampler2D atlas;uniform float grid,loaded,glow;
    varying vec2 vUv;varying float vTile;
    void main(){float cell=mod(vTile,max(loaded,1.));
      vec2 uv=(vec2(mod(cell,grid),grid-1.-floor(cell/grid))+mix(vec2(.038),vec2(.962),vUv))/grid;
      vec3 color=texture2D(atlas,uv).rgb;
      float edge=min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y));
      if(edge<.015)discard;float outline=1.-smoothstep(.02,.073,edge);
      vec3 tint=mod(vTile,2.)<1.?vec3(.08,.8,1.):vec3(1.,.16,.85);
      color=mix(color,tint*1.8,outline*.82);
      gl_FragColor=vec4(color*glow,smoothstep(.015,.045,edge)*.96);}`
  });
  const cards=new T.InstancedMesh(geo,mat,countLimit);cards.frustumCulled=false;
  cards.renderOrder=15;cards.count=0;cards.visible=false;scene.add(cards);
  const dummy=new T.Object3D();
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const ease=v=>{v=clamp(v);return v*v*(3-2*v)};
  const lerp=(a,b,t)=>a+(b-a)*t;
  const hash=i=>{const x=Math.sin(i*83.71+4.87)*43758.5;return x-Math.floor(x)};
  const horn=[-1,1].map(side=>{
    // Interpolate a path from the forehead around the upper horn and its spiral tip.
    const segments=[
      // Anchor all three sections to the ACTUAL depth-ram horn silhouette, not an outer orbit.
      new T.CubicBezierCurve3(new T.Vector3(0,7.8,10),new T.Vector3(side*5.6,13.4,10),new T.Vector3(side*13.0,19.2,8),new T.Vector3(side*21.5,16.4,7)),
      new T.CubicBezierCurve3(new T.Vector3(side*21.5,16.4,7),new T.Vector3(side*28.5,12.4,6.6),new T.Vector3(side*28.0,3.5,8.7),new T.Vector3(side*19.8,2.0,10)),
      new T.CubicBezierCurve3(new T.Vector3(side*19.8,2.0,10),new T.Vector3(side*14.0,1.3,11),new T.Vector3(side*13.5,8.2,11.8),new T.Vector3(side*18.3,8.6,11.5))
    ];
    const samples=[];for(let j=0;j<segments.length;j++)for(let i=0;i<85;i++)samples.push(segments[j].getPoint(i/84));
    return samples;
  });
  const wall=[];
  for(let i=0;i<countLimit;i++){
    const side=i%2===0?-1:1,sideIndex=Math.floor(i/2),col=sideIndex%20,row=Math.floor(sideIndex/20);
    // Edge stacks are deterministic, deliberately preserve the central ram silhouette.
    const x=side*(33.5+col*1.34), y=-26.8+row*1.86;
    wall.push({x:x+(hash(i+10)-.5)*.2,y:y+(hash(i+26)-.5)*.18,z:3+hash(i+44)*3,side});
  }
  let visible=false,start=0,active=Math.min(1200,countLimit),loadedCount=0,version=0,lastTime=0;
  function paintPlaceholder(){ctx.clearRect(0,0,size,size);for(let i=0;i<12;i++){
    const x=(i%grid)*tile;ctx.fillStyle=i%2?'#462054':'#174568';ctx.fillRect(x,0,tile,tile);
    ctx.font=`${Math.floor(tile*.58)}px sans-serif`;ctx.textAlign='center';ctx.fillText('🐑',x+tile/2,tile*.72);
  }tex.needsUpdate=true;uniforms.loaded.value=12;}
  paintPlaceholder();
  function loadDemo(){const token=++version;return new Promise(resolve=>{
    const image=new Image();image.onload=()=>{
      if(token!==version)return resolve({cancelled:true});ctx.clearRect(0,0,size,size);
      for(let i=0;i<12;i++)ctx.drawImage(image,i*80,0,80,80,i*tile,0,tile,tile);
      uniforms.loaded.value=12;loadedCount=12;tex.needsUpdate=true;resolve({loaded:12});};
    image.onerror=()=>resolve({loaded:0});
    image.src=new URL('./assets/demo-portraits/atlas.jpg',import.meta.url).href;
  });}
  const demoReady=loadDemo();
  async function importFiles(files){const token=++version,images=Array.from(files).filter(x=>x.type.startsWith('image/')).slice(0,countLimit);
    if(!images.length)return {loaded:0};
    const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const c=canvas.getContext('2d');let done=0,failed=0;
    for(const file of images){let bitmap;try{bitmap=await createImageBitmap(file);
      if(token!==version)return {cancelled:true};const d=Math.min(bitmap.width,bitmap.height);
      c.drawImage(bitmap,(bitmap.width-d)/2,(bitmap.height-d)/2,d,d,(done%grid)*tile,Math.floor(done/grid)*tile,tile,tile);done++;
    }catch{failed++}finally{bitmap?.close();} if((done+failed)%40===0)await new Promise(r=>setTimeout(r,0));}
    if(token!==version)return {cancelled:true};if(done){ctx.clearRect(0,0,size,size);ctx.drawImage(canvas,0,0);uniforms.loaded.value=done;loadedCount=done;tex.needsUpdate=true;}
    return {loaded:done,failed};
  }
  function setCount(n){active=Math.floor(clamp(Math.round(Number(n)||0),0,countLimit)/2)*2;return active;}
  function setVisible(v,time=0){if(v&&!visible)start=time;visible=!!v;cards.visible=visible;cards.count=visible?active:0;}
  function replay(time=0){start=time;}
  function update(time){if(!visible)return;
    lastTime=time;const t=Math.max(0,time-start),now=t<1.15?0:Math.min(active,Math.floor((t-1.15)/.0034)+1);
    cards.count=now;
    for(let i=0;i<now;i++){
      const side=i%2===0?-1:1,w=wall[i],delay=i*.0034;w.y=-26.8+Math.floor(i/40)*(53.6/Math.max(1,Math.ceil(active/40)-1));
      const u=clamp((t-1.15-delay)/6.6),path=horn[side<0?0:1];
      let x,y,z,roll=0,scale=1;
      if(u<=.52){
        const f=u/.52* (path.length-1),index=Math.min(path.length-2,Math.floor(f)),q=f-index;
        const a=path[index],b=path[index+1];
        const tangentX=b.x-a.x,tangentY=b.y-a.y,len=Math.max(.001,Math.hypot(tangentX,tangentY));
        const phase=8*Math.PI*u+hash(i+9)*Math.PI*2;
        const radius=(.18+hash(i+8)*.28)*(.72+.28*Math.sin(Math.PI*clamp(u/.52)));
        x=lerp(a.x,b.x,q)-tangentY/len*Math.cos(phase)*radius;
        y=lerp(a.y,b.y,q)+tangentX/len*Math.cos(phase)*radius;
        z=lerp(a.z,b.z,q)+Math.sin(phase)*radius*.68;
        roll=Math.atan2(tangentY,tangentX)*.22+Math.sin(phase)*.24;
        scale=.35+.65*ease(u/.12);
      }else{
        const base=path[path.length-1],spray=clamp((u-.52)/.28),settle=ease((u-.78)/.22);
        const midX=side*(36+hash(i+33)*11),midY=12+(hash(i+17)-.5)*46;
        // Quadratic curve into the side wall; ease only while docking.
        const f=ease(spray),r=1-f;
        let px=r*r*base.x+2*r*f*midX+f*f*w.x;
        let py=r*r*base.y+2*r*f*midY+f*f*w.y;
        let pz=r*r*base.z+2*r*f*(15+hash(i+7)*10)+f*f*w.z;
        x=lerp(px,w.x,settle);y=lerp(py,w.y,settle);z=lerp(pz,w.z,settle);
        roll=lerp(side*.7*Math.sin(u*18+hash(i+2)*4),0,settle);
        scale=lerp(1.18,.92,settle);
      }
      dummy.position.set(x,y,z);dummy.rotation.set(.07*Math.sin(i+t),.23*Math.sin(t*2+i),roll);
      if(u>=1){dummy.position.y+=Math.sin(t*.6+i)*.055;dummy.rotation.set(0,0,0);}
      dummy.scale.set(scale*1.58,scale*2.03,1);dummy.updateMatrix();cards.setMatrixAt(i,dummy.matrix);
    }
    cards.instanceMatrix.needsUpdate=true;
  }
  return {setVisible,update,replay,setCount,importFiles,demoReady,reset:loadDemo,
    setIntensity(v){uniforms.glow.value=clamp(Number(v),.15,2.2)},
    get count(){return active},get visible(){return visible},get loadedCount(){return loadedCount},
    get elapsed(){return Math.max(0,lastTime-start)},
    dispose(){cards.geometry.dispose();cards.material.dispose();tex.dispose();scene.remove(cards)} };
}
