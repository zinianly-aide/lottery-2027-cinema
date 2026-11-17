// Deliberately independent from the picture atlas: photos may be hidden or sparse
// without removing recognizable anatomy, horn edges and flowing neon silhouettes.
export function createRamNeonDetail(THREE, parent, {quality='medium'}={}){
  const glowGroup=new THREE.Group();
  glowGroup.name='RamNeonAnatomy';
  parent.add(glowGroup);
  const meshes=[], glowMaterials=[], sparkVertices=[], sparkColors=[];
  const palette={cyan:0x38f3ff,pink:0xff55fa,white:0xe6ffff,violet:0x9274ff};
  const point=(x,y,z=7)=>new THREE.Vector3(x,y,z);
  const rng=n=>{const x=Math.sin(n*73.814+17.2)*43758.5453;return x-Math.floor(x)};
  const makeLine=(p,color,{size=.066,glow=.28,alpha=.92,spark=true}={})=>{
    if(p.length<2)return;
    const curve=new THREE.CatmullRomCurve3(p.map(v=>point(...v)),false,'centripetal',.32);
    const seg=Math.max(24,Math.min(240,p.length*9));
    const col=palette[color]||color;
    // Multiple thin additive geometry passes emulate bloom without a fullscreen postprocess.
    for(const [r,a] of [[glow,.085],[size*2.0,.24],[size,alpha]]){
      if(!r||!a)continue;
      const mat=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:a,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false});
      const m=new THREE.Mesh(new THREE.TubeGeometry(curve,seg,r,5,false),mat);
      m.renderOrder=10;glowGroup.add(m);meshes.push(m);glowMaterials.push([mat,a]);
    }
    if(spark){
      const count=Math.ceil(p.length*5);
      for(let i=0;i<count;i++){
        const t=(i+rng(i*117+meshes.length)*.7)/count,v=curve.getPointAt(t);
        sparkVertices.push(v.x+(rng(i+71)-.5)*.32,v.y+(rng(i+11)-.5)*.32,v.z+.12);
        const c=new THREE.Color(col);sparkColors.push(c.r,c.g,c.b);
      }
    }
  };
  const headLeft=[[-6.6,14.8,7],[-9.0,13.2,8],[-10.4,9.2,9],[-9.5,5,10],[-9.0,.5,10],[-7.0,-4.9,10],[-5.1,-8.8,11],[-2.4,-11.9,11],[0,-12.5,11]];
  const mirror=p=>p.map(v=>[-v[0],v[1],v[2]]);
  makeLine(headLeft,'cyan',{size:.09,glow:.32});
  makeLine(mirror(headLeft),'pink',{size:.09,glow:.34});
  const ears=[[-9.2,7.0,8],[-13.8,10.0,7],[-19.0,10.9,5.8],[-17.3,7.0,6.2],[-12.5,5.5,7.1],[-9.1,5.0,8]];
  makeLine(ears,'cyan',{size:.072,glow:.23});
  makeLine(mirror(ears),'pink',{size:.072,glow:.23});
  const leftEye=[[-6.3,4.3,10.3],[-5.5,5.5,10.7],[-4.3,5.9,10.8],[-3.1,5.1,10.8],[-3.7,4.0,10.9],[-5.2,3.8,10.8],[-6.3,4.3,10.3]];
  makeLine(leftEye.map(([x,y,z])=>[x*1.35,(y-4.8)*1.4+5.2,z]),'white',{size:.13,glow:.48});
  makeLine(mirror(leftEye).map(([x,y,z])=>[x*1.35,(y-4.8)*1.4+5.2,z]),'white',{size:.13,glow:.48});
  makeLine([[-4.7,5.2,11],[-4.5,4.6,11.2],[-4.7,4.1,11]],'white',{size:.1,glow:.32,spark:false});
  makeLine([[4.7,5.2,11],[4.5,4.6,11.2],[4.7,4.1,11]],'white',{size:.1,glow:.32,spark:false});
  makeLine([[-2.0,-5.0,12],[-1.0,-4.3,12.2],[0,-5.0,12.3],[1.0,-4.3,12.2],[2,-5.0,12],[.2,-6.9,12],[-.2,-6.9,12],[-2,-5.0,12]],'white',{size:.19,glow:.65});
  makeLine([[0,-6.9,12],[0,-8.6,12],[-1.7,-9.5,12],[-3,-8.9,12]],'cyan',{size:.062,glow:.22});
  makeLine([[0,-8.6,12],[1.7,-9.5,12],[3,-8.9,12]],'pink',{size:.062,glow:.22});
  makeLine([[-6.9,15.0,7],[-4.1,16.2,7],[0,15.3,7],[4.1,16.2,7],[6.9,15,7]],'violet',{size:.06,glow:.2});
  makeLine([[-5.8,-10.8,8],[-9,-16.2,7],[-6,-22.5,6],[0,-25.8,5]],'cyan',{size:.06,glow:.24,alpha:.68});
  makeLine([[5.8,-10.8,8],[9,-16.2,7],[6,-22.5,6],[0,-25.8,5]],'pink',{size:.06,glow:.24,alpha:.68});
  // The visible front lip of each curled horn follows the same three Bezier segments as photo anchors.
  const cubic=(a,t)=>{const u=1-t;return {x:u*u*u*a[0][0]+3*u*u*t*a[1][0]+3*u*t*t*a[2][0]+t*t*t*a[3][0],y:u*u*u*a[0][1]+3*u*u*t*a[1][1]+3*u*t*t*a[2][1]+t*t*t*a[3][1]};};
  const controls=[[[8.5,10.8],[9.5,21.5],[15,26.5],[25,22.2]],[[25,22.2],[34,17.5],[33,5],[25,-.2]],[[25,-.2],[17,-4],[14.2,4.5],[18.6,7.5]]];
  const hornAt=t=>{const idx=Math.min(2,Math.floor(t*3));return cubic(controls[idx],Math.min(1,t*3-idx))};
  const hornEdge=(side,offset)=>{
    const a=[];for(let i=0;i<=110;i++){const t=i/110,c=hornAt(t),b=hornAt(Math.max(0,t-.001)),d=hornAt(Math.min(1,t+.001)),dx=d.x-b.x,dy=d.y-b.y,l=Math.hypot(dx,dy)||1,rr=(3.5*Math.pow(1-t,.55)+.28)*offset;
      a.push([side*(c.x-dy/l*rr),c.y+dx/l*rr,2.7-t*.6]);}
    return a;
  };
  for(const side of [-1,1]){
    const tint=side<0?'cyan':'pink';
    makeLine(hornEdge(side,1),tint,{size:.055,glow:.27,alpha:.5,spark:false});
    makeLine(hornEdge(side,-1),tint,{size:.05,glow:.2,alpha:.44,spark:false});
  }
  // Volumetric fleece/head point-cloud underneath the anatomy lines.
  // Side-to-side color and rounded Z relief avoid a flat, neon-wireframe face.
  const faceCount=quality==='low'?5200:quality==='high'?23000:14000;
  const facePos=new Float32Array(faceCount*3),faceCol=new Float32Array(faceCount*3);
  for(let i=0;i<faceCount;i++){
    const ry=rng(i*31+213),y=-12.0+ry*28.4;
    const halfWidth=y>10?Math.sqrt(Math.max(.01,1-((y-10)/7)**2))*9.8:y< -5?Math.max(.2,6.8+(y+5)*.92):9.8-(10-y)*.20;
    const x=(rng(i*23+81)*2-1)*halfWidth;
    const edge=Math.max(0,1-(x/halfWidth)**2);
    const z=7.0+4.4*Math.sqrt(edge)+1.4*Math.exp(-Math.pow(x/4,2)-Math.pow((y+5)/5.5,2));
    facePos[i*3]=x;facePos[i*3+1]=y;facePos[i*3+2]=z+(rng(i*17+13)-.5)*.32;
    const twinkle=rng(i*13+29),center=Math.max(0,1-Math.abs(x)/9);
    const cyan=[.12,.49,.97],pink=[.97,.17,.82],t=Math.min(1,Math.max(0,(x+4.5)/9));
    const bright=(.15+twinkle*.65)*(.3+Math.pow(Math.abs(x)/halfWidth,4)*1.7);
    for(let c=0;c<3;c++)faceCol[i*3+c]=Math.min(1,(cyan[c]*(1-t)+pink[c]*t)*bright);
  }
  const faceGeo=new THREE.BufferGeometry();
  faceGeo.setAttribute('position',new THREE.BufferAttribute(facePos,3));
  faceGeo.setAttribute('color',new THREE.BufferAttribute(faceCol,3));
  const faceMat=new THREE.PointsMaterial({size:.17,sizeAttenuation:true,vertexColors:true,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false});
  const faceDots=new THREE.Points(faceGeo,faceMat);faceDots.frustumCulled=false;faceDots.renderOrder=5;glowGroup.add(faceDots);meshes.push(faceDots);
  if(sparkVertices.length){
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(sparkVertices,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(sparkColors,3));
    const mat=new THREE.PointsMaterial({size:.27,vertexColors:true,transparent:true,opacity:.82,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false});
    const m=new THREE.Points(g,mat);m.renderOrder=11;glowGroup.add(m);meshes.push(m);
  }
  return {update(t){for(let i=0;i<glowMaterials.length;i++){const [mat,a]=glowMaterials[i];mat.opacity=a*(.92+.08*Math.sin(t*1.7+i*.62));}},
    dispose(){for(const m of meshes){m.geometry.dispose();m.material.dispose()}parent.remove(glowGroup);}};
}
