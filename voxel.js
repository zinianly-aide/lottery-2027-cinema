// Decorative volumetric voxel cloud, distinct from the 2,000 identity-bearing lottery tiles.
export function createVoxelCloud(THREE, scene, {quality='medium'} = {}) {
  const groups = new THREE.Group(); groups.name = 'VoxelCloud'; scene.add(groups);
  const sizes=quality==='low'?[{count:90,min:1.2,max:3.25,spread:37},{count:300,min:.25,max:1.15,spread:47},{count:800,min:.045,max:.24,spread:60}]:quality==='medium'?[{count:170,min:1.2,max:3.25,spread:37},{count:650,min:.25,max:1.15,spread:47},{count:2100,min:.045,max:.24,spread:60}]:[{count:360,min:1.2,max:3.25,spread:37},{count:1850,min:.25,max:1.15,spread:47},{count:7600,min:.045,max:.24,spread:60}];
  const palette=['#156bfa','#2760c5','#862cbd','#cb45ca','#14cdd1','#5edfec','#080f2a','#e7f5ff'];
  const seeded=(i,s)=>{let n=Math.sin(i*127.1+s*311.7)*43758.5453;return n-Math.floor(n)};
  const objects=[];
  sizes.forEach((spec,layer)=>{
    const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),(quality==='high'?new THREE.MeshPhongMaterial({shininess:35,emissive:0x071124,transparent:true,opacity:0,depthWrite:false}):new THREE.MeshBasicMaterial({color:0xf7ffff,transparent:true,opacity:0,depthWrite:false})),spec.count);
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    const obj=new THREE.Object3D(), original=[];
    for(let i=0;i<spec.count;i++){
      // Cluster the foreground around a turbulent cloud, with wisps towards its periphery.
      const q=seeded(i,layer*10+1),theta=seeded(i,layer*10+2)*Math.PI*2;
      const radius=Math.pow(q,.67)*spec.spread;
      const xx=Math.cos(theta)*radius+Math.sin(i*.067)*5;
      const yy=Math.sin(theta)*radius*.62+Math.cos(i*.034)*4;
      const zz=(seeded(i,layer*10+3)-.5)*62 + Math.sin(xx*.15)*7;
      const scale=spec.min+(spec.max-spec.min)*Math.pow(seeded(i,layer*10+4),1.7);
      obj.position.set(xx,yy,zz);obj.rotation.set(0,seeded(i,layer*10+5)*.35,0);obj.scale.setScalar(scale);obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);
      mesh.setColorAt(i,new THREE.Color(palette[Math.floor(seeded(i,layer*10+6)*palette.length)]));
      original.push({x:xx,y:yy,z:zz,size:scale});
    }
    mesh.instanceColor.needsUpdate=true;mesh.instanceMatrix.needsUpdate=true;
    groups.add(mesh);objects.push({mesh,original,layer});
  });
  let intensity=0,target=0;
  const setVisible = enabled => {target=enabled?1:0;groups.visible=true;};
  const update = (seconds,dt=1/30) => {
    intensity+=(target-intensity)*(1-Math.exp(-Math.max(0,dt)*2.1));
    const drift=Math.sin(seconds*.22)*.9;
    groups.position.z=drift;groups.rotation.y=Math.sin(seconds*.1)*.06;
    groups.scale.setScalar(.85+intensity*.15);
    objects.forEach(({mesh,layer})=>{mesh.material.opacity=Math.min(1,intensity*(layer===2?.88:1));mesh.visible=intensity>.01;});
  };
  setVisible(false);
  return {update,setVisible,group:groups,total:sizes.reduce((n,s)=>n+s.count,0)};
}
