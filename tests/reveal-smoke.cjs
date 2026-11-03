const assert=require('node:assert/strict');
const reveal=require('../reveal.js');
class FakeElement{
  constructor(tag='div'){this.tag=tag;this.id='';this.className='';this.textContent='';this.hidden=false;this.children=[];this.dataset={};this.attributes={};this.offsetWidth=12;}
  get classList(){return {add:(...names)=>{const s=new Set(this.className.split(/\s+/).filter(Boolean));names.forEach(n=>s.add(n));this.className=[...s].join(' ');},remove:(...names)=>{const s=new Set(this.className.split(/\s+/));names.forEach(n=>s.delete(n));this.className=[...s].join(' ');},contains:n=>this.className.split(/\s+/).includes(n)};}
  appendChild(node){this.children.push(node);return node;}
  replaceChildren(...nodes){this.children=nodes;}
  setAttribute(key,val){this.attributes[key]=val;}
  querySelector(selector){
    const match=(e)=>selector[0]==='#'?e.id===selector.slice(1):e.className.split(/\s+/).includes(selector.slice(1));
    const find=(e)=>{for(const child of e.children){if(match(child))return child;const node=find(child);if(node)return node;}return null;};
    return find(this);
  }
}
function fakeClock(){let now=0,serial=0,tasks=[];return {get now(){return now;},setTimeout(fn,delay){const task={id:++serial,at:now+delay,fn,cancelled:false};tasks.push(task);return task;},clearTimeout(task){task.cancelled=true;},advance(delta){const end=now+delta;while(true){const available=tasks.filter(t=>!t.cancelled&&t.at<=end).sort((a,b)=>a.at-b.at||a.id-b.id);if(!available.length)break;const next=available[0];next.cancelled=true;now=next.at;next.fn();}now=end;}};}
const host=new FakeElement('section');
for(const id of ['reveal-countdown','reveal-subtitle','reveal-cards','reveal-prize']){const node=new FakeElement('div');node.id=id;host.appendChild(node);}
global.document={createElement:tag=>new FakeElement(tag),body:new FakeElement('body')};
assert.equal(reveal.id6('123'),'000123');
assert.equal(reveal.id6(2000),'002000');
for(const id of ['0','002001','not-an-id','1234567'])assert.throws(()=>reveal.id6(id));
assert.deepEqual(reveal.plan([{id:123}],'normal').steps.map(e=>e.at),[3000,3500,4000]);
assert.equal(reveal.plan([{id:123}],'normal').revealAt,4680);
assert.equal(reveal.plan([{id:123}],'grand').settings.countdown,3000);
assert.equal(reveal.plan([{id:123}],'quick').settings.countdown,1000);
assert.throws(()=>reveal.plan(Array.from({length:6},(_,i)=>({id:i+1}))));
const clock=fakeClock(),ctrl=reveal.createController(host,clock);
let revealCount=0,finishCount=0;
const outcome={id:123,name:'演示员工',department:'制造部'};
ctrl.play([outcome],{mode:'normal',prize:'一等奖',onReveal:()=>revealCount++,onComplete:()=>finishCount++});
const cards=host.querySelector('#reveal-cards');
assert.equal(host.hidden,false);
assert.equal(host.querySelector('#reveal-countdown').textContent,'3');
assert.equal(host.querySelector('#reveal-prize').textContent,'一等奖');
const tile=cards.children[0],digitLine=tile.querySelector('.reveal-digits');
const slots=digitLine.children.filter(c=>c.className.includes('digit-slot'));
assert.equal(slots.length,6);
assert.equal(slots.slice(0,3).map(s=>s.querySelector('.digit-front').textContent).join(''),'000');
assert.equal(slots.slice(3).map(s=>s.querySelector('.digit-front').textContent).join(''),'???');
assert.equal(tile.querySelector('.reveal-profile').hidden,true);
clock.advance(1000);assert.equal(host.querySelector('#reveal-countdown').textContent,'2');
clock.advance(1000);assert.equal(host.querySelector('#reveal-countdown').textContent,'1');
clock.advance(1000);assert.equal(host.querySelector('#reveal-countdown').hidden,true);assert(slots[3].classList.contains('flipping'));
clock.advance(470);assert.equal(slots[3].querySelector('.digit-front').textContent,'1');
clock.advance(500);assert.equal(slots[4].querySelector('.digit-front').textContent,'2');
clock.advance(500);assert.equal(slots[5].querySelector('.digit-front').textContent,'3');
clock.advance(210);assert.equal(revealCount,1);assert.equal(tile.querySelector('.reveal-profile').hidden,false);
clock.advance(2300);assert.equal(finishCount,1);assert.equal(host.hidden,true);
const remaining=Array.from({length:5},(_,i)=>({id:700+i,name:'测试'+i,department:'IT 部'}));
let groupRevealed=0;
const groupPlan=ctrl.play(remaining,{mode:'grand',prize:'特等奖',onReveal:items=>groupRevealed=items.length});
assert.equal(host.dataset.layout,'group');assert.equal(cards.children.length,5);
clock.advance(groupPlan.revealAt);assert.equal(groupRevealed,5);
assert(cards.children.every(t=>t.querySelector('.reveal-profile').hidden===false));
ctrl.cancel();clock.advance(20000);assert.equal(host.hidden,true);assert.equal(finishCount,1);
console.log('PASS: 6-digit IDs, 3→2→1, 3 split-flap digits, hidden profile, timed completion, 5-winner group, cancel');
