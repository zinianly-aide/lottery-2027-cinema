/* Split-flap reveal choreography. Winner IDs are predetermined; animations never select winners. */
(function(root) {
  'use strict';
  const MODES = Object.freeze({
    normal: {countdown:3000,flip:500,hold:2300},
    grand:  {countdown:3000,flip:720,hold:3800},
    quick:  {countdown:1000,flip:260,hold:1400}
  });
  function id6(value) {
    if (!/^[0-9]{1,6}$/.test(String(value))) throw new Error('Invalid employee ID');
    const n=Number(value);
    if(!Number.isInteger(n)||n<1||n>2000)throw new Error('Employee ID out of demo pool');
    return String(n).padStart(6,'0');
  }
  function plan(items,mode='normal') {
    if(!Array.isArray(items)||!items.length||items.length>5)throw new Error('1-5 winners per reveal');
    const settings=MODES[mode]||MODES.normal;
    const ids=items.map(item=>id6(item.id));
    const steps=[0,1,2].map(index=>({index,at:settings.countdown+index*settings.flip}));
    const revealAt=settings.countdown+3*settings.flip+180;
    return {mode,settings,ids,steps,revealAt,totalMs:revealAt+settings.hold};
  }
  function element(tag,className,text) {
    const e=document.createElement(tag);
    if(className)e.className=className;
    if(text!==undefined)e.textContent=text;
    return e;
  }
  function createController(host,clock={setTimeout:root.setTimeout.bind(root),clearTimeout:root.clearTimeout.bind(root)}) {
    if(!host)throw new Error('Missing reveal overlay');
    const countdown=host.querySelector('#reveal-countdown');
    const subtitle=host.querySelector('#reveal-subtitle');
    const cards=host.querySelector('#reveal-cards');
    const prizeLabel=host.querySelector('#reveal-prize');
    const timers=[];
    let version=0,active=false;
    function schedule(at,run) {
      const ticket=version;
      timers.push(clock.setTimeout(()=>{if(version===ticket)run();},at));
    }
    function cancel() {
      version++;
      while(timers.length)clock.clearTimeout(timers.pop());
      host.classList.remove('visible','celebrate');
      host.hidden=true;
      document.body.classList.remove('reveal-running');
      host.setAttribute('aria-hidden','true');
      cards.replaceChildren();
      active=false;
    }
    function prepareCard(item,num) {
      const number=id6(item.id);
      const tile=element('article','reveal-tile');
      const rank=element('div','reveal-tile-rank',num?`幸运嘉宾 ${num}`:'幸运嘉宾');
      const digits=element('div','reveal-digits');
      digits.setAttribute('aria-label','六位工号，后三位等待揭晓');
      const slots=[];
      for(let i=0;i<6;i++) {
        if(i===3)digits.appendChild(element('span','reveal-divider','·'));
        const slot=element('div','digit-slot '+(i<3?'digit-fixed':'digit-flip'));
        const face=element('span','digit-front',i<3?number[i]:'?');
        slot.appendChild(face);
        if(i>=3){slot.appendChild(element('span','digit-back',number[i]));slots.push(slot);}
        digits.appendChild(slot);
      }
      const profile=element('div','reveal-profile');
      profile.hidden=true;
      const portrait=element('div','reveal-portrait',(item.name||'星').slice(-1));
      const info=element('div','reveal-profile-text');
      info.appendChild(element('strong','reveal-person',item.name||'幸运嘉宾'));
      info.appendChild(element('span','reveal-department',item.department||'演示人员'));
      profile.appendChild(portrait);profile.appendChild(info);
      tile.appendChild(rank);tile.appendChild(digits);tile.appendChild(profile);
      return {tile,slots,profile,number};
    }
    function play(items,options={}) {
      cancel();
      const current=plan(items,options.mode||'normal');
      const prepared=items.map((item,i)=>prepareCard(item,items.length>1?i+1:0));
      prepared.forEach(({tile})=>cards.appendChild(tile));
      host.dataset.layout=items.length>1?'group':'single';host.dataset.mode=current.mode;
      prizeLabel.textContent=options.prize||'星耀幸运奖';
      countdown.textContent=String(Math.ceil(current.settings.countdown/1000));
      countdown.hidden=false;
      subtitle.textContent='中奖名单已锁定 · 倒计时揭晓';
      host.hidden=false;
      host.classList.add('visible');
      document.body.classList.add('reveal-running');
      host.setAttribute('aria-hidden','false');
      active=true;
      const ticks=Math.ceil(current.settings.countdown/1000);
      for(let x=1;x<ticks;x++)schedule(x*1000,()=>{countdown.textContent=String(ticks-x);countdown.classList.remove('pop');void countdown.offsetWidth;countdown.classList.add('pop');});
      schedule(current.settings.countdown,()=>{countdown.hidden=true;subtitle.textContent='后三位依次翻牌';});
      current.steps.forEach(({index,at})=>schedule(at,()=>{
        prepared.forEach(({slots,number})=>{
          const slot=slots[index];
          slot.querySelector('.digit-back').textContent=number[index+3];
          slot.classList.add('flipping');
          slot.setAttribute('aria-label',`第 ${index+4} 位：${number[index+3]}`);
        });
      }));
      current.steps.forEach(({index,at})=>schedule(at+(current.mode==='grand'?630:current.mode==='quick'?230:470),()=>{
        prepared.forEach(({slots,number})=>{
          slots[index].querySelector('.digit-front').textContent=number[index+3];
          slots[index].classList.remove('flipping');
          slots[index].classList.add('revealed');
        });
      }));
      schedule(current.revealAt,()=>{
        subtitle.textContent=items.length>1?`${items.length} 位幸运嘉宾同时揭晓`:'恭喜这位幸运嘉宾';host.classList.add('celebrate');
        prepared.forEach(({profile,slots})=>{
          slots.forEach(slot=>slot.classList.add('revealed'));
          profile.hidden=false;
          profile.classList.add('in');
        });
        if(options.onReveal)options.onReveal(items);
      });
      schedule(current.totalMs,()=>{
        cancel();
        if(options.onComplete)options.onComplete(items);
      });
      return current;
    }
    return {play,cancel,get active(){return active;}};
  }
  const api={id6,plan,createController,MODES};
  root.LotteryReveal=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
