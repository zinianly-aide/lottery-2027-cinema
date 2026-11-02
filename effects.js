// Small draw-call budget: instanced nebula + orbiting sparkles, comet streaks and a reusable burst buffer.
export function createParticleEffects(THREE, scene, {quality='low'}={}) {
  const low=quality==='low', high=quality==='high';
  const random=(i,k)=>{const x=Math.sin(i*113.17+k*91.3)*43758.5453;return x-Math.floor(x)};
  const presets={
    galaxy:['#25d8ff','#417aff','#ba6aff','#eaf7ff'],
    neon:['#16ffe5','#ff46db','#7a5aff','#ffffff'],
    gold:['#ffda86','#ffa348','#8d76ff','#fff6d7']
  };
  // One tiny radial-alpha sprite keeps sparks round and glowing without expensive bloom postprocessing.
  const sprite=document.createElement('canvas');sprite.width=sprite.height=32;
  const spriteContext=sprite.getContext('2d');
  const gradient=spriteContext.createRadialGradient(16,16,0,16,16,16);
  gradient.addColorStop(0,'rgba(255,255,255,1)');
  gradient.addColorStop(.25,'rgba(255,255,255,.94)');
  gradient.addColorStop(.65,'rgba(255,255,255,.24)');
  gradient.addColorStop(1,'rgba(255,255,255,0)');
  spriteContext.fillStyle=gradient;spriteContext.fillRect(0,0,32,32);
  const glowTexture=new THREE.CanvasTexture(sprite);
  let current='galaxy',strength=1;
  const nebula=new THREE.Group();scene.add(nebula);
  const clouds=[];
  const addCloud=(count,radius,pointSize,seed)=>{
    const pos=new Float32Array(count*3),colors=new Float32Array(count*3),geo=new THREE.BufferGeometry();
    for(let i=0;i<count;i++){
      const a=i*2.39996323+random(i,seed)*.8;
      const r=radius*(.24+.76*Math.sqrt((i+.5)/count));
      pos[i*3]=Math.cos(a)*r;
      pos[i*3+1]=Math.sin(a)*r*.48+Math.sin(a*2)*3;
      pos[i*3+2]=(random(i,seed+1)-.5)*28-9;
    }
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
    const mat=new THREE.PointsMaterial({map:glowTexture,size:pointSize,vertexColors:true,transparent:true,opacity:.66,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true});
    const mesh=new THREE.Points(geo,mat);mesh.frustumCulled=false;nebula.add(mesh);
    clouds.push({mesh,colors,geo,seed,count});
  };
  addCloud(low?210:high?680:370,48,low?.55:.45,17);
  addCloud(low?90:high?390:210,30,low?.95:.75,31);
  const cometCount=low?2:high?6:3, cometTrail=low?5:high?12:8;
  const cometData=new Float32Array(cometCount*cometTrail*2*3);
  const cometColors=new Float32Array(cometData.length);
  const cometGeometry=new THREE.BufferGeometry();
  cometGeometry.setAttribute('position',new THREE.BufferAttribute(cometData,3).setUsage(THREE.DynamicDrawUsage));
  cometGeometry.setAttribute('color',new THREE.BufferAttribute(cometColors,3));
  const cometMaterial=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.65,blending:THREE.AdditiveBlending,depthWrite:false});
  const comets=new THREE.LineSegments(cometGeometry,cometMaterial);comets.frustumCulled=false;scene.add(comets);
  const burstCount=low?100:high?370:200;
  const burstPositions=new Float32Array(burstCount*3),burstColors=new Float32Array(burstCount*3);
  const velocities=new Float32Array(burstCount*3);
  const burstGeometry=new THREE.BufferGeometry();
  burstGeometry.setAttribute('position',new THREE.BufferAttribute(burstPositions,3).setUsage(THREE.DynamicDrawUsage));
  burstGeometry.setAttribute('color',new THREE.BufferAttribute(burstColors,3).setUsage(THREE.DynamicDrawUsage));
  const burstMaterial=new THREE.PointsMaterial({map:glowTexture,size:low?1.15:1.35,vertexColors:true,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  const burstMesh=new THREE.Points(burstGeometry,burstMaterial);burstMesh.frustumCulled=false;burstMesh.visible=false;scene.add(burstMesh);
  const shockwave=new THREE.Mesh(new THREE.RingGeometry(1,1.08,low?42:72),new THREE.MeshBasicMaterial({color:0x85daff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false}));
  shockwave.visible=false;shockwave.position.z=8;scene.add(shockwave);
  let age=99;
  function colorize(preset){
    current=presets[preset]?preset:'galaxy';const palette=presets[current];
    for(const cloud of clouds){
      for(let i=0;i<cloud.count;i++){
        const rgb=new THREE.Color(palette[Math.floor(random(i,cloud.seed+2)*palette.length)]);
        cloud.colors.set([rgb.r,rgb.g,rgb.b],i*3);
      }
      cloud.geo.attributes.color.needsUpdate=true;
    }
    for(let c=0;c<cometCount;c++)for(let j=0;j<cometTrail;j++){
      const rgb=new THREE.Color(palette[(c+j)%palette.length]);const fade=(1-j/cometTrail)**1.7;
      for(let vertex=0;vertex<2;vertex++)cometColors.set([rgb.r*fade,rgb.g*fade,rgb.b*fade],(c*cometTrail*2+j*2+vertex)*3);
    }
    cometGeometry.attributes.color.needsUpdate=true;
  }
  colorize('galaxy');
  function burst(kind='gold'){
    age=0;burstMesh.visible=true;shockwave.visible=true;
    const colors=presets[kind]||presets[current];
    for(let i=0;i<burstCount;i++){
      const y=2*random(i,77)-1,a=random(i,78)*Math.PI*2,r=Math.sqrt(1-y*y),velocity=13+random(i,79)*20;
      velocities.set([Math.cos(a)*r*velocity,y*velocity,Math.sin(a)*r*velocity*.5],3*i);
      burstPositions.set([0,0,10],3*i);
      const rgb=new THREE.Color(colors[i%colors.length]);burstColors.set([rgb.r,rgb.g,rgb.b],3*i);
    }
    burstGeometry.attributes.position.needsUpdate=true;
    burstGeometry.attributes.color.needsUpdate=true;
    shockwave.material.color.set(kind==='gold'?0xffcc74:kind==='neon'?0xff70df:0x65dfff);
    shockwave.scale.setScalar(.5);
  }
  function update(sec,dt){
    nebula.rotation.z=sec*.022;
    nebula.rotation.y=Math.sin(sec*.09)*.11;
    nebula.position.y=Math.sin(sec*.22)*1.1;
    clouds.forEach(({mesh},i)=>{mesh.material.opacity=(i===0?.57:.77)*strength;});
    comets.visible=strength>.2;
    for(let c=0;c<cometCount;c++){
      const t=(sec*(.07+c*.012)+c*.31)%1;
      const x=62-124*t, y=30-45*t+(c-cometCount/2)*8;
      for(let j=0;j<cometTrail;j++){
        const idx=(c*cometTrail+j)*6;
        cometData.set([x+j*1.65,y+j*.65,-8-c*3,x+(j+1)*1.65,y+(j+1)*.65,-8-c*3],idx);
      }
    }
    cometGeometry.attributes.position.needsUpdate=true;
    cometMaterial.opacity=.68*strength;
    if(age<2.4){
      age+=Math.min(dt,.08);
      const fade=Math.max(0,1-age/2.4);
      for(let i=0;i<burstCount;i++){
        const idx=i*3;
        burstPositions[idx]+=velocities[idx]*dt;
        burstPositions[idx+1]+=velocities[idx+1]*dt-2.8*age*dt;
        burstPositions[idx+2]+=velocities[idx+2]*dt;
      }
      burstMaterial.opacity=fade*strength;
      burstGeometry.attributes.position.needsUpdate=true;
      shockwave.scale.setScalar(Math.max(.5,age*19));
      shockwave.material.opacity=Math.max(0,(1-age/1.3)*.8)*strength;
      if(age>=2.4){burstMesh.visible=false;shockwave.visible=false;}
    }
  }
  return {update,burst,setPalette:colorize,setIntensity(v){strength=Math.max(0,Math.min(1.7,v));},get palette(){return current;}};
}
