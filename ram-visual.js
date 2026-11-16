/* Original Cinema 2027 scene-compatible glow geometry. Not a full-screen effect. */
export function createRamVisual(THREE,scene,ram,{quality='medium'}={}){
 const group=new THREE.Group();group.name='CinemaNeonRam';group.visible=false;
 scene.add(group);
 const traces=ram.traces();
 const makeLines=(traces,kind)=>{
  const points=[];
  const stride=quality==='low'?4:2;
  for(const trace of traces){
   if(kind==='ribbon' !== (trace.role==='ribbon'))continue;
   for(let i=stride;i<trace.points.length;i+=stride){
    const a=trace.points[i-stride],b=trace.points[i];
    points.push(a.x,a.y,-3.8,b.x,b.y,-3.8);
   }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  const mat=new THREE.LineBasicMaterial({
   color:kind==='ribbon'?0x9167e8:0x58bdff,
   transparent:true,opacity:kind==='ribbon'?.20:.26,
   blending:THREE.AdditiveBlending,depthWrite:false
  });
  const mesh=new THREE.LineSegments(geo,mat);mesh.frustumCulled=false;mesh.renderOrder=2;
  group.add(mesh);return mat;
 };
 const contour=makeLines(traces,'contour'),ribbons=makeLines(traces,'ribbon');
 let requested=false,art=null;
 function setVisible(value){
  group.visible=Boolean(value);
  if(value&&!requested){
   requested=true;
   new THREE.TextureLoader().load('./neon-ram-cinema.svg',
    texture=>{
     texture.colorSpace=THREE.SRGBColorSpace;
     const material=new THREE.MeshBasicMaterial({
      map:texture,color:0xffffff,transparent:true,opacity:quality==='low'?.20:.25,
      depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide
     });
     art=new THREE.Mesh(new THREE.PlaneGeometry(1600*.0875,610*.0875),material);
     art.position.z=-5;art.renderOrder=1;
     group.add(art);
    },
    undefined,
    ()=>{console.warn('Cinema neon ram SVG unavailable; using geometry traces');}
   );
  }
 }
 function setPalette(preset){
  const theme= preset==='gold'?[0xf0b75f,0xf4cc83]:
   preset==='neon'?[0x8c76ff,0xe46cdb]:[0x5cbaff,0x9677e7];
  contour.color.setHex(theme[0]);ribbons.color.setHex(theme[1]);
 }
 function update(time){
  if(!group.visible)return;
  group.position.y=.12*Math.sin(time*.9);
  contour.opacity=.23+.06*Math.sin(time*1.2);
  ribbons.opacity=.17+.07*Math.sin(time*.83);
  if(art)art.material.opacity=(quality==='low'?.18:.23)+.03*Math.sin(time*1.05);
 }
 return {setVisible,setPalette,update,get visible(){return group.visible}};
}
