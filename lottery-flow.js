/* Shared, demo-only draw queue; reveal animations never choose or change the selected winners. */
(function(root){
  'use strict';
  const NAMES=['陈嘉宁','王思远','李子涵','张晓彤','赵明轩','周雨晴','林晨','许一诺','黄昊然','吴可欣'];
  const DEPARTMENTS=['制造部','IT 部','安全环保部','运营部'];
  const POOL=2000;
  function create(options={}){
    if(root.__activeLotteryFlow){root.__activeLotteryFlow.setCallbacks(options);return root.__activeLotteryFlow;}
    let callbacks=options;
    const $=id=>document.getElementById(id);
    const reveal=root.LotteryReveal.createController($('reveal-overlay'));
    const chosen=new Set(),pending=new Set(),queue=[];
    let busy=false,lastPrize=null,run=0;
    function note(text){$('note').textContent=text;}
    function person(id){return {id,name:NAMES[id%NAMES.length],department:DEPARTMENTS[id%DEPARTMENTS.length]};}
    function normalize(value){return Number(root.LotteryReveal.id6(value));}
    function applyWinners(batch){
      for(const item of batch.items){
        chosen.add(item.id);
        pending.delete(item.id);
        const badge=document.createElement('div');
        badge.className='winner-chip';
        badge.textContent='✦ '+item.name+' · '+root.LotteryReveal.id6(item.id)+' · '+batch.prize;
        $('wall').appendChild(badge);
      }
      note('已揭晓 '+chosen.size+' 位幸运嘉宾 · '+batch.prize);
    }
    function pump(){
      if(busy||!queue.length)return;
      busy=true;
      const batch=queue.shift(),token=run;
      let mode=batch.mode;
      if(mode==='normal'&&batch.items.length===1&&lastPrize===batch.prize&&$('fast-followups').checked)mode='quick';
      note(batch.items.length>1?batch.items.length+' 位嘉宾同步揭晓中':'正在翻牌揭晓：'+batch.prize);
      if(callbacks.onStart)callbacks.onStart(batch.items,batch.prize);
      reveal.play(batch.items,{
        mode,prize:batch.prize,
        onReveal:(items)=>{if(token!==run)return;if(callbacks.onReveal)callbacks.onReveal(items,batch.prize);},
        onComplete:()=>{
          if(token!==run)return;
          applyWinners(batch);
          lastPrize=batch.prize;
          busy=false;
          if(callbacks.onComplete)callbacks.onComplete(batch.items,batch.prize);
          pump();
        }
      });
    }
    function enqueue(ids,config={}){
      const input=Array.isArray(ids)?ids:[ids];
      if(!input.length||input.length>5){note('每次只支持 1–5 人同步揭晓');return false;}
      let normalized;
      try{normalized=input.map(normalize);}catch(e){note('请输入有效的六位工号 000001–002000');return false;}
      if(normalized.some(id=>chosen.has(id)||pending.has(id))||new Set(normalized).size!==normalized.length){note('工号重复，或已经中奖／等待揭晓');return false;}
      const prize=config.prize||$('prize-select').value;
      const mode=config.mode||$('reveal-mode').value;
      if(!['normal','grand','quick'].includes(mode)){note('不支持的揭晓节奏');return false;}
      const batch={items:normalized.map(person),prize,mode};
      normalized.forEach(id=>pending.add(id));
      queue.push(batch);pump();
      return true;
    }
    function random(count=1){
      const available=[];
      for(let id=1;id<=POOL;id++)if(!chosen.has(id)&&!pending.has(id))available.push(id);
      if(available.length<count){note('剩余未中奖人数不足 '+count+' 人');return false;}
      for(let i=0;i<count;i++){
        const k=i+Math.floor(Math.random()*(available.length-i));
        [available[i],available[k]]=[available[k],available[i]];
      }
      return enqueue(available.slice(0,count));
    }
    function reset(){
      run++;
      reveal.cancel();
      busy=false;lastPrize=null;chosen.clear();pending.clear();queue.length=0;
      $('wall').replaceChildren();
      note('名单已重置（仅清除本页模拟数据）');
      if(callbacks.onReset)callbacks.onReset();
    }
    $('draw').addEventListener('click',()=>{
      const field=$('employee'),value=field.value.trim();
      if(enqueue(value))field.value='';
    });
    $('employee').addEventListener('keydown',event=>{
      if(event.key==='Enter'){$('draw').click();}
    });
    $('random').addEventListener('click',()=>random(1));
    $('draw5').addEventListener('click',()=>random(5));
    $('reset').addEventListener('click',reset);
    root.__activeLotteryFlow={enqueue,random,reset,setCallbacks(next){callbacks=next;},stats:()=>({won:chosen.size,pending:pending.size,queued:queue.length,busy})};
    return root.__activeLotteryFlow;
  }
  const api={create};
  root.LotteryFlow=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
