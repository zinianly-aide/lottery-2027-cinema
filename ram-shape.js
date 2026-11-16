/* Cinema 2027 neon ram. Deterministic curves, no external model or image dependency.
   The art is outlined with the existing stage's cyan / violet / gold palette. */
(function(root){
'use strict';
const SCALE=.0875, CX=800, CY=305, TWO_PI=Math.PI*2;
const P=(x,y)=>({x:(x-CX)*SCALE,y:(CY-y)*SCALE});
function cubic(p0,p1,p2,p3,t){
 const q=1-t;return P(q*q*q*p0[0]+3*q*q*t*p1[0]+3*q*t*t*p2[0]+t*t*t*p3[0],
                    q*q*q*p0[1]+3*q*q*t*p1[1]+3*q*t*t*p2[1]+t*t*t*p3[1]);
}
function quadratic(p0,p1,p2,t){
 const q=1-t;return P(q*q*p0[0]+2*q*t*p1[0]+t*t*p2[0],
                     q*q*p0[1]+2*q*t*p1[1]+t*t*p2[1]);
}
function curve(start,commands){
 const points=[P(...start)];let current=start;
 for(const [type,...args] of commands){
  const next=type==='C'?args.slice(4,6):type==='Q'?args.slice(2,4):args.slice(0,2);
  const steps=type==='C'?48:type==='Q'?30:12;
  for(let i=1;i<=steps;i++){
   const t=i/steps;
   points.push(type==='C'?cubic(current,args.slice(0,2),args.slice(2,4),next,t)
    :type==='Q'?quadratic(current,args.slice(0,2),next,t)
    :P(current[0]+(next[0]-current[0])*t,current[1]+(next[1]-current[1])*t));
  }
  current=next;
 }
 return points;
}
function ellipse(cx,cy,rx,ry,start=0,end=TWO_PI){
 const points=[];for(let i=0;i<=96;i++){
  const a=start+(end-start)*i/96;points.push(P(cx+Math.cos(a)*rx,cy+Math.sin(a)*ry));
 }
 return points;
}
function mirrored(points){return points.map(v=>({x:-v.x,y:v.y}));}
function segments(){
 const horn=curve([720,187],[
  ['C',646,52,462,14,408,148],
  ['C',342,309,448,423,556,352],
  ['C',621,302,574,215,505,259]
 ]);
 const face=curve([728,180],[
  ['Q',800,148,872,180],
  ['C',925,215,907,313,868,386],
  ['Q',845,437,803,458],
  ['Q',756,443,730,386],
  ['C',692,297,682,226,728,180]
 ]);
 const ear=curve([729,229],[
  ['Q',667,170,596,196],['Q',610,271,728,269],
  ['L',729,229]
 ]);
 const brow=curve([741,270],[['Q',767,247,791,267]]);
 const eye=ellipse(776,281,15,12);
 const nose=curve([786,352],[['Q',800,341,816,352],['L',800,372],['L',786,352]]);
 const smile=curve([800,371],[
  ['L',800,386],['Q',783,401,766,382],['L',800,386],
  ['Q',817,401,834,382]
 ]);
 const wool=curve([729,190],[
  ['Q',747,153,763,181],['Q',780,143,801,171],
  ['Q',818,143,838,181],['Q',856,153,873,190]
 ]);
 const ribbonA=curve([-90,237],[
  ['C',195,500,290,82,505,185],
  ['C',665,318,745,545,810,330],
  ['C',940,170,1230,80,1680,230]
 ]);
 const ribbonB=curve([30,385],[
  ['C',410,180,485,530,760,315],
  ['C',1020,90,1260,465,1580,280]
 ]);
 return [
  {role:'horn',side:-1,weight:.195,points:horn},
  {role:'horn',side:1,weight:.195,points:mirrored(horn)},
  {role:'face',weight:.152,points:face},
  {role:'ear',side:-1,weight:.051,points:ear},
  {role:'ear',side:1,weight:.051,points:mirrored(ear)},
  {role:'wool',weight:.078,points:wool},
  {role:'eye',side:-1,weight:.045,points:eye},
  {role:'eye',side:1,weight:.045,points:mirrored(eye)},
  {role:'brow',side:-1,weight:.022,points:brow},
  {role:'brow',side:1,weight:.022,points:mirrored(brow)},
  {role:'muzzle',weight:.048,points:[...nose,...smile]},
  {role:'ribbon',weight:.048,points:ribbonA},
  {role:'ribbon',weight:.048,points:ribbonB}
 ];
}
const TRACES=segments();
// Samples distributed in world-space arc length, not uniform t; avoids
// crowding on the tight inner spirals while keeping the outline legible.
function evenlySample(points,count){
 const cumulative=[0];
 for(let i=1;i<points.length;i++){
  cumulative.push(cumulative[i-1]+Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y));
 }
 const length=cumulative.at(-1)||1,out=[];
 for(let i=0;i<count;i++){
  const d=length*(i+.5)/count;let l=1,r=cumulative.length-1;
  while(l<r){const m=(l+r)>>1;if(cumulative[m]<d)l=m+1;else r=m;}
  const a=points[l-1],b=points[l],seg=cumulative[l]-cumulative[l-1]||1;
  const t=(d-cumulative[l-1])/seg;
  out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,
   nx:-(b.y-a.y)/Math.hypot(b.x-a.x,b.y-a.y||1),
   ny:(b.x-a.x)/Math.hypot(b.x-a.x,b.y-a.y||1)});
 }
 return out;
}
function createTargets(count){
 if(!Number.isInteger(count)||count<1||count>25000)throw Error('Invalid particle count');
 const total=TRACES.reduce((s,t)=>s+t.weight,0),targets=[];
 let pending=count;
 TRACES.forEach((trace,index)=>{
  const n=index===TRACES.length-1?pending:Math.min(pending,Math.floor(count*trace.weight/total));
  pending-=n;
  const points=evenlySample(trace.points,n);
  points.forEach((p,j)=>{
   const spread=trace.role==='horn'?((j%5)-2)*.53:((j%3)-1)*.16;
   targets.push({
    x:p.x+p.nx*spread,y:p.y+p.ny*spread,z:-2.5+(j%7)*.075,
    role:trace.role,side:trace.side||0
   });
  });
 });
 // Interleave the regions to distribute the characteristic silhouette during morph.
 return targets.sort((a,b)=>{
  const hash=p=>Math.sin((p.x+88)*31.91+(p.y+43)*17.39)*214748.3%1;
  return hash(a)-hash(b);
 });
}
const PALETTES={
 galaxy:{horn:[0x66e2ff,0x766cff],face:[0xb3e8ff,0x488deb],detail:[0xffdc97,0xb2e7ff],ribbon:[0xa566f2,0xe779cb]},
 neon:{horn:[0x5bf8f6,0xc576ff],face:[0x9aefff,0xeb80e8],detail:[0xffb4e7,0xf5e9ff],ribbon:[0xff6dc5,0x52d9ff]},
 gold:{horn:[0xffd991,0xf3a65f],face:[0xfff0c0,0xc8a0ff],detail:[0xffdf93,0xffffff],ribbon:[0xf0b567,0x9f81fa]}
};
function hexFor(p,i,preset='galaxy'){
 const palette=PALETTES[preset]||PALETTES.galaxy;
 const band=p.role==='horn'?'horn':p.role==='ribbon'?'ribbon':
  ['eye','brow','muzzle','wool'].includes(p.role)?'detail':'face';
 return palette[band][(Math.floor(i/9)+Number(p.side>0))%2];
}
function drawFallback(ctx,width,height,time=0,preset='galaxy'){
 ctx.save();ctx.translate(width*.5,height*.52);
 const scale=Math.min(width/160,height/92);
 ctx.scale(scale,-scale);ctx.lineCap='round';ctx.lineJoin='round';
 const paint={horn:'#5caeff',face:'#82caff',ear:'#a482fc',eye:'#f6dbad',
  brow:'#c1ddff',wool:'#d7e9ff',muzzle:'#ffdf9e',ribbon:'#b17df5'};
 if(preset==='gold')Object.assign(paint,{horn:'#ffd891',face:'#ffedba',ribbon:'#d4a566'});
 if(preset==='neon')Object.assign(paint,{horn:'#9b83ff',face:'#66e6f7',ribbon:'#f377d9'});
 for(const trace of TRACES){
  const first=trace.points[0];
  ctx.beginPath();ctx.moveTo(first.x,first.y);
  for(const p of trace.points.slice(1))ctx.lineTo(p.x,p.y);
  ctx.lineWidth=trace.role==='horn'?3.2:trace.role==='ribbon'?1.2:1.6;
  ctx.strokeStyle=paint[trace.role];
  ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=14;
  ctx.globalAlpha=trace.role==='ribbon'?.42+.15*Math.sin(time*1.2):.85;
  ctx.stroke();
 }
 ctx.restore();ctx.globalAlpha=1;ctx.shadowBlur=0;
}
const api={createTargets,traces:()=>TRACES,hexFor,drawFallback};
root.CinemaRam=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
