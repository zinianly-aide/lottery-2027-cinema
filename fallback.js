(function(){
setTimeout(function(){if(window.__cinemaReady||document.querySelector('#screen canvas'))return;
const fallbackEvents=new AbortController();window.__stopFallback=()=>fallbackEvents.abort();var c=document.createElement('canvas'),ctx=c.getContext('2d');document.querySelector('#screen').appendChild(c);c.style.cssText='width:100%;height:100%;display:block';var w=0,h=0,mode='scatter',stars=[],winners=0,elapsed=0,rate=1,paused=false,intensity=1,burstAt=-20;
function resize(){w=c.width=innerWidth;h=c.height=innerHeight;stars=[];for(var i=0;i<480;i++){var a=i*2.39996,r=Math.sqrt((i+.5)/480);stars.push({x:Math.cos(a)*r,y:Math.sin(a)*r,z:Math.sin(i*41.7),s:i%11===0?5:i%3===0?2.5:1,color:['#36c9ff','#a94eff','#ff62d2','#1675ff'][i%4]})}}resize();addEventListener('resize',resize);
var lastTick=0,previousFrame=0;function frame(now){if(window.__cinemaReady){c.remove();return;}requestAnimationFrame(frame);if(now-lastTick<40)return;lastTick=now;if(!previousFrame)previousFrame=now;if(!paused)elapsed+=Math.min(0.09,(now-previousFrame)/1000)*rate;previousFrame=now;var t=elapsed;ctx.fillStyle='#03091b';ctx.fillRect(0,0,w,h);var g=ctx.createRadialGradient(w*.5,h*.52,5,w*.5,h*.52,w*.65);g.addColorStop(0,'#142b65');g.addColorStop(1,'#03091b');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(w*.5,h*.53);var scale=Math.min(w/1100,h/650);for(var i=0;i<stars.length;i++){var p=stars[i],ang=t*.08+p.z*.2,x=p.x*440*scale,y=p.y*250*scale;var xx=x*Math.cos(ang)-p.z*75*Math.sin(ang);var size=p.s*scale*(1+.25*Math.sin(t+i));ctx.globalAlpha=(.35+.65*(i%9)/9)*intensity;ctx.fillStyle=p.color;ctx.fillRect(xx-size/2,y-size/2,size,size)}ctx.restore();ctx.globalAlpha=1;ctx.textAlign='center';ctx.shadowColor='#00baff';ctx.shadowBlur=38;ctx.fillStyle='#e3faff';ctx.font='900 '+Math.floor(Math.min(w*.25,h*.4))+'px sans-serif';ctx.fillText(mode==='text'?'2027':mode==='matrix'?'✦ 2027 ✦':mode==='sphere'?'2027':'✧',w*.5,h*.58);ctx.shadowBlur=0;if(t-burstAt<2.0){var age=t-burstAt;ctx.strokeStyle='rgba(255,202,110,'+Math.max(0,1-age/2)+')';ctx.lineWidth=6;ctx.beginPath();ctx.arc(w*.5,h*.52,30+age*240,0,Math.PI*2);ctx.stroke()}}requestAnimationFrame(frame);
['text','sphere','matrix','scatter'].forEach(function(id){document.getElementById(id).onclick=function(){mode=id}});
window.cinemaLottery=window.LotteryFlow.create({
  onStart:()=>{mode='sphere';},
  onReveal:()=>{burstAt=elapsed;},
  onComplete:()=>{mode='text';},
  onReset:()=>{mode='scatter';}
});
document.getElementById('note').textContent='兼容模式 · 2D 粒子动画 · 投影仪';
const presets=[['#36c9ff','#a94eff','#ff62d2','#1675ff'],['#16ffe5','#ff46db','#7a5aff','#ffffff'],['#ffda86','#ffa348','#8d76ff','#fff6d7']];
let preset=0;
const range=document.querySelector('#speed-range'), speedValue=document.querySelector('#speed-value'), pause=document.querySelector('#speed-pause');
const buttons=[...document.querySelectorAll('[data-speed]')];
function sync(){range.value=String(rate);speedValue.textContent=rate.toFixed(2)+'×';pause.textContent=paused?'▶ 继续':'⏸ 暂停';document.querySelector('#dock-label').textContent=(paused?'已暂停':rate.toFixed(2)+'×')+' · 动画控制';buttons.forEach(b=>b.classList.toggle('active',Number(b.dataset.speed)===rate))}
function setRate(v){rate=Math.min(3,Math.max(.25,Math.round(Number(v)*20)/20));paused=false;sync()}
range.addEventListener('input',()=>setRate(range.value),{signal:fallbackEvents.signal});buttons.forEach(b=>b.addEventListener('click',()=>setRate(b.dataset.speed),{signal:fallbackEvents.signal}));
pause.addEventListener('click',()=>{paused=!paused;sync()},{signal:fallbackEvents.signal});
document.querySelector('#effect-intensity').addEventListener('input',e=>intensity=Number(e.target.value),{signal:fallbackEvents.signal});
document.querySelector('#effect-burst').addEventListener('click',()=>burstAt=elapsed,{signal:fallbackEvents.signal});
document.querySelector('#effect-preset').addEventListener('click',()=>{preset=(preset+1)%3;stars.forEach((p,i)=>p.color=presets[preset][i%4]);document.querySelector('#effect-preset').textContent=['配色：银河蓝','配色：霓虹紫','配色：鎏金色'][preset]},{signal:fallbackEvents.signal});
sync();
},4000)
})();
