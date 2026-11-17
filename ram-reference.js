import {createRamPhotos,selectPhotoAnchors} from './ram-photos.js?v=unified2';
import {createRamNeonDetail} from './ram-neon-detail.js?v=unified2';
// All geometry shares one coordinate system. No painted reference plane.
export function createRamReference(T,scene,{quality='medium',maxTextureSize=4096}={}){
 const group=new T.Group();group.visible=false;scene.add(group);
 const uniforms={time:{value:0},gather:{value:1},intensity:{value:1},palette:{value:0},pointScale:{value:1},photoMix:{value:.6}};
 const photos=createRamPhotos(T,group,uniforms,{quality,maxTextureSize});photos.build(null,0,0);
 const anatomy=createRamNeonDetail(T,group,{quality});
 const rnd=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)};
 const pos=[],col=[];
 function add(x,y,z,brightness=1){pos.push(x,y,z);const t=Math.max(0,Math.min(1,(x+9)/18));col.push((.12+.88*t)*brightness,(.8-.62*t)*brightness,brightness)}
 const anchors=selectPhotoAnchors(null,0,0,2000);
 for(let i=0;i<(quality==='low'?22000:60000);i++){
   const p=anchors[Math.floor(rnd(i*7)*anchors.length)];
   add(p.x+(rnd(i+4)-.5)*.7,p.y+(rnd(i+8)-.5)*.7,p.z+(rnd(i+9)-.5)*.55,.4+rnd(i+2));
 }
 // Broad shoulders converge toward a pointed fleece bib.
 for(let i=0;i<20000;i++){
   const t=rnd(i+181),y=1-t*27,w=14.5*Math.pow(Math.sin(Math.PI*(t*.9+.1)),.8);
   const x=(rnd(i+381)*2-1)*w;
   if(y>-10&&Math.abs(x)<8)continue;
   add(x,y,1+4*Math.sqrt(Math.max(0,1-(x/w)**2)),.25+rnd(i+44)*.8);
 }
 // Ear interiors, behind the luminous rims.
 for(const side of [-1,1])for(let i=0;i<2400;i++){
   const t=rnd(i+51),w=Math.sin(Math.PI*t)*1.7;
   add(side*(9+10*t),7.2+2*t+(rnd(i+63)*2-1)*w,6.5,.45+rnd(i+76));
 }
 function cloud(p,c,size){
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('color',new T.Float32BufferAttribute(c,3));
  const mat=new T.ShaderMaterial({uniforms,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
   vertexShader:`varying vec3 vColor;uniform float pointScale;void main(){vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(${size}*pointScale*65./-mv.z,.65,4.);}`,
   fragmentShader:`varying vec3 vColor;uniform float intensity;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(vColor*intensity,pow(1.-r,1.7)*.8);}`});
  const m=new T.Points(geo,mat);group.add(m);return m;
 }
 cloud(pos,col,1.8);
 const stars=[],starColors=[];
 for(let i=0;i<2300;i++){stars.push((rnd(i+400)-.5)*125,(rnd(i+500)-.5)*76,-14-rnd(i+600)*25);starColors.push(.2+rnd(i+700)*.4,.25+rnd(i+800)*.4,.9)}cloud(stars,starColors,1.4);
 const orbits=[];
 for(let j=0;j<2;j++){
  const p=[],c=[];
  for(let i=0;i<6500;i++){const a=i/6500*Math.PI*2,r=36+(rnd(i+2)-.5)*1.3;
   p.push(Math.cos(a)*r,Math.sin(a)*5+Math.cos(a)*(j===0?7:-8)-j*6,Math.sin(a)*16);
   c.push(j===1?.15:1,j===1?.7:.15,1);
  }orbits.push(cloud(p,c,2.1));
 }
 for(let i=0;i<3;i++){
  const halo=new T.Mesh(new T.TorusGeometry(7+i*3,.045,6,180),new T.MeshBasicMaterial({color:i%2?0xff45ef:0x33dfff,transparent:true,opacity:.7,blending:T.AdditiveBlending,depthWrite:false}));
  halo.rotation.x=Math.PI/2-.12;halo.position.y=-29;group.add(halo);
 }
 return {photos,setVisible(v){group.visible=!!v},setPalette(v){uniforms.palette.value=v==='gold'?2:0},setIntensity(v){uniforms.intensity.value=Number(v)||0},update(time,pixelRatio=1){if(!group.visible)return;const capture=new URLSearchParams(location.search).has('capture');uniforms.time.value=capture?0:time;uniforms.pointScale.value=pixelRatio;group.rotation.y=capture?0:Math.sin(time*.2)*.065;anatomy.update(capture?0:time);orbits.forEach((m,i)=>m.rotation.y=capture?0:Math.sin(time*.18+i)*.08);},get ready(){return true},get visible(){return group.visible}};
}
