import { createRamNeonDetail } from './ram-neon-detail.js?v=ram-20261117a';
import { createRamPhotos } from './ram-photos.js?v=cinema10';
// Reference-sampled depth relief; GPU gathering and orbit animation.
export function createRamReference(THREE,scene,{quality='medium',maxTextureSize=4096}={}){
 const group=new THREE.Group();group.visible=false;group.name='RamReferenceParticles';scene.add(group);
 const uniforms={time:{value:0},gather:{value:0},intensity:{value:1},palette:{value:0},pointScale:{value:1},photoMix:{value:.85}};
 const photos=createRamPhotos(THREE,group,uniforms,{quality,maxTextureSize});
 const neonDetail=createRamNeonDetail(THREE,group,{quality});
 let requested=false,ready=false,start=null;
 function load(){if(requested)return;requested=true;const image=new Image();image.onload=()=>{
  const c=document.createElement('canvas');c.width=640;c.height=360;const ctx=c.getContext('2d');ctx.drawImage(image,0,0,640,360);const data=ctx.getImageData(0,0,640,360).data;
  // The glow reference plane is NOT the model. It preserves painted light
  // behind true depth-correct photo cards and point-cloud anatomy.
  // Alpha is driven by luminance so the underlying black does not become a slab.
  const glowCanvas=document.createElement('canvas');glowCanvas.width=640;glowCanvas.height=360;
  const gc=glowCanvas.getContext('2d');gc.drawImage(c,0,0,640,360);
  const gd=gc.getImageData(0,0,640,360);
  for(let y=0;y<360;y++)for(let x=0;x<640;x++){
    const k=(y*640+x)*4;

    const r=gd.data[k],g=gd.data[k+1],b=gd.data[k+2],l=Math.max(r,g,b);
    const strength=Math.max(0,Math.min(1,(l-26)/140));
    gd.data[k+3]=Math.round(255*strength*.87);
    gd.data[k]=Math.min(255,Math.round(r*1.30));
    gd.data[k+1]=Math.min(255,Math.round(g*1.30));
    gd.data[k+2]=Math.min(255,Math.round(b*1.30));
  }
  gc.putImageData(gd,0,0);
  const glowTex=new THREE.CanvasTexture(glowCanvas);glowTex.colorSpace=THREE.SRGBColorSpace;
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(85,47.8),
   new THREE.MeshBasicMaterial({map:glowTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
  glow.name='ReferenceGlowOnly';glow.position.set(0,0,-3.8);glow.renderOrder=-1;
  group.add(glow);
  photos.build(data,640,360);
  const positions=[],colors=[],seeds=[],step=quality==='high'?1:quality==='low'?3:2;
  for(let y=0;y<360;y+=step)for(let x=0;x<640;x+=step){// Asset is the clean, centered neon ram without explanatory side panels.

  const i=(y*640+x)*4,r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255,l=Math.max(r,g,b);
  if(l<.31)continue;
  const face=(x>240&&x<400&&y>80&&y<260);
  const horn=(y<260 && (x<245 || x>400));
  const hash=Math.abs(Math.sin(x*31.67+y*74.23)*43653.57)%1;
  // In the horn volume, photos supply the surface; spare glow dust supplies gaps.
  if(horn&&hash<.68)continue;
  if(!face&&l<.48&&hash<.65)continue;
  const X=(x-320)*.133,Y=(180-y)*.133;
  const relief=9.5*Math.exp(-Math.pow(X/9.0,2)-Math.pow((Y-3.0)/11.5,2));
  const z=l*1.1+relief;
  positions.push(X,Y,z);colors.push(r,g,b);seeds.push(hash,Math.random(),Math.random());}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('seed',new THREE.Float32BufferAttribute(seeds,3));
  const material=new THREE.ShaderMaterial({uniforms,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:`attribute vec3 seed;varying vec3 vColor;varying float vAlpha;uniform float time,gather,pointScale;void main(){vColor=color;vec3 p=position;float spread=1.-gather;p+=spread*vec3((seed.x-.5)*90.,(seed.y-.5)*60.,(seed.z-.5)*50.);p.z+=sin(p.y*.6+time*1.3+seed.x*3.)*.22;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(pointScale*(165./-mv.z),.6,5.);vAlpha=(.78+.22*sin(time+seed.x*6.))*gather;}`,
  fragmentShader:`varying vec3 vColor;varying float vAlpha;uniform float intensity,palette;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;vec3 c=vColor;if(palette>1.5)c=max(max(c.r,c.g),c.b)*vec3(1.,.64,.22);else if(palette>.5)c=mix(c,c.brg,.25);gl_FragColor=vec4(c*2.15*intensity,pow(1.-r,.92)*vAlpha);}`});
  const points=new THREE.Points(geometry,material);points.frustumCulled=false;group.add(points);
  // Separate luminous anatomy: never dimmed by photo density.
  const fp=[],fc=[];
  function line(a,b,side=1){for(let j=0;j<=18;j++){const t=j/18;fp.push(side*(a[0]+(b[0]-a[0])*t),a[1]+(b[1]-a[1])*t,9);fc.push(side<0?.55:1.8,1.55,1.8);}}
  for(const side of [-1,1]){
   const eye=[[3.8,7.5],[4.6,8.6],[5.8,8.3],[5.4,7.0],[4.5,6.9],[3.8,7.5]];
   for(let j=1;j<eye.length;j++)line(eye[j-1],eye[j],side);
   line([0,-.3],[1.1,.4],side);line([1.1,.4],[.7,-1.1],side);line([.7,-1.1],[0,-1.7],side);
   line([0,-1.7],[0,-2.6],side);line([0,-2.6],[1.3,-3.1],side);line([1.3,-3.1],[2.4,-2.6],side);
  }
  const faceGeo=new THREE.BufferGeometry();faceGeo.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));faceGeo.setAttribute('color',new THREE.Float32BufferAttribute(fc,3));faceGeo.setAttribute('seed',new THREE.Float32BufferAttribute(new Float32Array(fp.length).fill(.5),3));
  const anatomy=new THREE.Points(faceGeo,material);anatomy.frustumCulled=false;anatomy.visible=false;group.add(anatomy); // NeonDetail supersedes the old symbolic outline.ready=true;start=null;
 };image.onerror=()=>{requested=false;console.warn('Reference ram image unavailable; retry on next activation');};image.src='./assets/neon-ram-reference.jpg';
 }
 const count=quality==='low'?1400:quality==='high'?7000:3500,p=new Float32Array(count*3),c=new Float32Array(count*3);
 for(let i=0;i<count;i++){p[i*3]=i/count*Math.PI*2;p[i*3+1]=Math.random();p[i*3+2]=Math.random();c.set([.4,.4,1],i*3)}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(p,3));geo.setAttribute('color',new THREE.BufferAttribute(c,3));
 const ribbon=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:`uniform float time,gather,pointScale;varying vec3 vColor;void main(){float a=position.x+time*.22,w=1.+(position.y-.5)*.045;vec3 p=vec3(cos(a)*43.*w,sin(a)*7.*w+cos(a)*8.,sin(a)*15.+(position.z-.5));vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(pointScale*130./-mv.z,.5,4.);vColor=mix(vec3(.1,.6,1.),vec3(1.,.15,.8),sin(a)*.5+.5)*gather;}`,fragmentShader:`uniform float intensity,palette;varying vec3 vColor;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;vec3 c=palette>1.5?vec3(1.,.65,.22)*length(vColor):vColor;gl_FragColor=vec4(c*intensity,(1.-r)*.75);}`});
 const orbit=new THREE.Points(geo,ribbon);orbit.frustumCulled=false;group.add(orbit);
 const platform=new THREE.Group();
 for(let i=0;i<3;i++){const halo=new THREE.Mesh(new THREE.TorusGeometry(8+i*3,.065,4,quality==='low'?64:120),new THREE.MeshBasicMaterial({color:i%2?0xfc54e8:0x38cfff,transparent:true,opacity:i===1?.65:.35,blending:THREE.AdditiveBlending,depthWrite:false}));halo.rotation.x=1.35;platform.add(halo);}
 platform.position.y=-24;group.add(platform);

 return {photos,setVisible(v){if(v&&!group.visible){start=null;uniforms.gather.value=0;load()}group.visible=!!v;},setPalette(v){uniforms.palette.value=v==='gold'?2:v==='neon'?1:0},setIntensity(v){uniforms.intensity.value=Math.max(0,Number(v)||0)},update(time,pixelRatio=1){if(!group.visible)return;if(start===null)start=time;uniforms.time.value=time;uniforms.gather.value=ready?(new URLSearchParams(location.search).has('capture')?1:Math.min(1,Math.max(0,(time-start)/2))):0;uniforms.pointScale.value=pixelRatio*(quality==='low'?2.15:quality==='high'?1.3:1.72);group.rotation.y=Math.sin(time*.23)*.09;group.position.y=-.5+Math.sin(time*.8)*.16;},get ready(){return ready},get visible(){return group.visible}};
}

