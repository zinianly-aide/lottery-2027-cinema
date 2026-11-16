import { createRamPhotos } from './ram-photos.js?v=cinema8';
// Reference-sampled depth relief; GPU gathering and orbit animation.
export function createRamReference(THREE,scene,{quality='medium',maxTextureSize=4096}={}){
 const group=new THREE.Group();group.visible=false;group.name='RamReferenceParticles';scene.add(group);
 const uniforms={time:{value:0},gather:{value:0},intensity:{value:1},palette:{value:0},pointScale:{value:1},photoMix:{value:.85}};
 const photos=createRamPhotos(THREE,group,uniforms,{quality,maxTextureSize});
 let requested=false,ready=false,start=null;
 function load(){if(requested)return;requested=true;const image=new Image();image.src='./assets/neon-ram-reference.jpg';image.onload=()=>{
  const c=document.createElement('canvas');c.width=640;c.height=360;const ctx=c.getContext('2d');ctx.drawImage(image,0,0,640,360);const data=ctx.getImageData(0,0,640,360).data;
  photos.build(data,640,360);
  const positions=[],colors=[],seeds=[],step=quality==='high'?1:quality==='low'?3:2;
  for(let y=0;y<360;y+=step)for(let x=0;x<640;x+=step){const i=(y*640+x)*4,r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255,l=Math.max(r,g,b);if(l<.09)continue;const X=(x/640-.5)*85,Y=(.5-y/360)*47.8;const z=l*1.5+7*Math.exp(-Math.pow(X/8,2)-Math.pow((Y-1)/15,2));positions.push(X,Y,z);colors.push(r,g,b);seeds.push(Math.random(),Math.random(),Math.random());}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('seed',new THREE.Float32BufferAttribute(seeds,3));
  const material=new THREE.ShaderMaterial({uniforms,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:`attribute vec3 seed;varying vec3 vColor;varying float vAlpha;uniform float time,gather,pointScale,photoMix;void main(){vColor=color;vec3 p=position;float spread=1.-gather;p+=spread*vec3((seed.x-.5)*90.,(seed.y-.5)*60.,(seed.z-.5)*50.);p.z+=sin(p.y*.6+time*1.3+seed.x*3.)*.22;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(pointScale*(165./-mv.z),.6,5.);float ax=abs(position.x);float masked=((ax>10.&&ax<28.5&&position.y>-3.&&position.y<21.)||(ax>6.&&ax<17.&&position.y< -4.&&position.y> -17.))?1.:0.;vAlpha=(1.-masked*photoMix*.75)*(.78+.22*sin(time+seed.x*6.))*gather;}`,
  fragmentShader:`varying vec3 vColor;varying float vAlpha;uniform float intensity,palette;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;vec3 c=vColor;if(palette>1.5)c=max(max(c.r,c.g),c.b)*vec3(1.,.64,.22);else if(palette>.5)c=mix(c,c.brg,.25);gl_FragColor=vec4(c*1.45*intensity,pow(1.-r,1.25)*vAlpha);}`});
  const points=new THREE.Points(geometry,material);points.frustumCulled=false;group.add(points);ready=true;start=null;
 };image.onerror=()=>{requested=false;console.warn('Reference ram image unavailable; retry on next activation');};
 }
 const count=quality==='low'?1400:quality==='high'?7000:3500,p=new Float32Array(count*3),c=new Float32Array(count*3);
 for(let i=0;i<count;i++){p[i*3]=i/count*Math.PI*2;p[i*3+1]=Math.random();p[i*3+2]=Math.random();c.set([.4,.4,1],i*3)}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(p,3));geo.setAttribute('color',new THREE.BufferAttribute(c,3));
 const ribbon=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:`uniform float time,gather,pointScale,photoMix;varying vec3 vColor;void main(){float a=position.x+time*.22,w=1.+(position.y-.5)*.045;vec3 p=vec3(cos(a)*43.*w,sin(a)*7.*w+cos(a)*8.,sin(a)*15.+(position.z-.5));vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(pointScale*130./-mv.z,.5,4.);vColor=mix(vec3(.1,.6,1.),vec3(1.,.15,.8),sin(a)*.5+.5)*gather;}`,fragmentShader:`uniform float intensity,palette;varying vec3 vColor;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;vec3 c=palette>1.5?vec3(1.,.65,.22)*length(vColor):vColor;gl_FragColor=vec4(c*intensity,(1.-r)*.75);}`});
 const orbit=new THREE.Points(geo,ribbon);orbit.frustumCulled=false;group.add(orbit);
 return {photos,setVisible(v){if(v&&!group.visible){start=null;uniforms.gather.value=0;load()}group.visible=!!v;},setPalette(v){uniforms.palette.value=v==='gold'?2:v==='neon'?1:0},setIntensity(v){uniforms.intensity.value=Math.max(0,Number(v)||0)},update(time,pixelRatio=1){if(!group.visible)return;if(start===null)start=time;uniforms.time.value=time;uniforms.gather.value=ready?Math.min(1,Math.max(0,(time-start)/2)):0;uniforms.pointScale.value=pixelRatio*(quality==='low'?1.8:quality==='high'?.9:1.35);group.rotation.y=Math.sin(time*.23)*.22;group.position.y=-1+Math.sin(time*.8)*.25;},get ready(){return ready},get visible(){return group.visible}};
}

