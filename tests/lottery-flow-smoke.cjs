const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync(require('node:path').join(__dirname,'../lottery-flow.js'),'utf8');
class Element {
  constructor(id){this.id=id;this.value='';this.textContent='';this.checked=true;this.children=[];this.listeners={};this.className='';}
  addEventListener(name,fn){this.listeners[name]=fn;}
  click(){if(this.listeners.click)this.listeners.click({});}
  appendChild(child){this.children.push(child);}
  replaceChildren(){this.children=[];}
}
const ids=['draw','draw5','reset','random','employee','prize-select','reveal-mode','fast-followups','wall','note','reveal-overlay'];
const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
elements['prize-select'].value='二等奖';elements['reveal-mode'].value='normal';
const history=[],cancelled=[];
const revealApi={id6:value=>{if(!/^[0-9]{1,6}$/.test(String(value))||+value<1||+value>2000)throw new Error('bad id');return String(+value).padStart(6,'0')},createController:()=>({play(items,opts){history.push({items,opts});},cancel(){cancelled.push(true);}})};
const doc={getElementById:id=>{assert(elements[id],id);return elements[id];},createElement:()=>new Element('chip')};
const callbacks=[];
const root={LotteryReveal:revealApi};
const sandbox={window:root,document:doc,Math,Number,Set,console};
vm.runInNewContext(src,sandbox);
const flow=root.LotteryFlow.create({onStart:(items)=>callbacks.push('start'+items.length),onReveal:()=>callbacks.push('reveal'),onComplete:()=>callbacks.push('complete')});
assert.equal(flow.enqueue('000123'),true);
assert.equal(history.length,1);
assert.equal(history[0].opts.mode,'normal');
assert.equal(history[0].items[0].id,123);
assert.equal(flow.enqueue('000123'),false,'same id must not enqueue twice');
assert.equal(flow.enqueue('000124'),true);
assert.equal(flow.stats().pending,2);
assert.equal(flow.stats().queued,1);
history[0].opts.onReveal(history[0].items);history[0].opts.onComplete();
assert.equal(flow.stats().won,1);
assert.equal(history.length,2);
assert.equal(history[1].opts.mode,'quick','second same-prize winner uses quick mode');
assert.equal(elements.wall.children.length,1);
const old=history[1];flow.reset();assert.equal(flow.stats().won,0);assert.equal(flow.stats().pending,0);assert.equal(elements.wall.children.length,0);
old.opts.onComplete();assert.equal(flow.stats().won,0,'stale callback after reset must be ignored');
assert.equal(flow.enqueue('002001'),false,'out of pool');
assert.equal(flow.enqueue([1,1]),false,'duplicate inside a batch');
assert.equal(flow.enqueue([1,2,3,4,5,6]),false,'batch max 5');
elements['prize-select'].value='特等奖';
assert.equal(flow.enqueue([101,202,303,404,505]),true);
assert.equal(history.at(-1).items.length,5);
assert.equal(history.at(-1).opts.prize,'特等奖');
history.at(-1).opts.onComplete();
assert.equal(flow.stats().won,5);
assert.equal(elements.wall.children.length,5);
assert(elements.wall.children[0].textContent.includes('000101'));
assert.equal(flow.enqueue(101),false,'winner cannot win twice');
const rerender=root.LotteryFlow.create({onReset:()=>callbacks.push('new-reset')});
assert.equal(flow,rerender,'fallback and WebGL clients must share a single queue');
assert.equal(root.__activeLotteryFlow,flow);
assert.equal(callbacks.filter(c=>c==='start1').length,2);
assert(cancelled.length>=1);
console.log('PASS: 6-digit normalization, duplicate prevention, serial queue, quick follow-ups, reset cancellation, 5 winners, singleton');
