(function(){
const $ = s=>document.querySelector(s);
const $$ = s=>[...document.querySelectorAll(s)];
const COLORS = ['#2B6CB0','#C2410C','#2F855A','#7C3AED','#DB2777','#0F766E'];
const EXP_CATS = ['Fuel','Groceries','Food','Bills','Travel','Health','Shopping','Other'];
const ACT_CATS = ['Meditation','Yoga','Walk','Run','Cycling','Swimming','Sleep','Study','Other'];
const ICON = {Fuel:'⛽',Groceries:'🛒',Food:'🍛',Bills:'💡',Travel:'🛺',Health:'💊',Shopping:'🛍️',Other:'💸',Workout:'💪',Meditation:'🧘',Yoga:'🧘',Walk:'🚶',Run:'🏃',Cycling:'🚴',Swimming:'🏊',Sleep:'😴',Study:'📖',Mood:'🙂',Note:'📝',Total:'💰'};
const DAY = 86400000;

let S = {
  v:2, members:[], entries:[],
  budgets:{Total:20000, Fuel:4000, Groceries:6000, Food:4000},
  reminders:[
    {id:1001, time:'06:00', title:'Meditation time 🧘', body:'5 nimisham kooda podhum. Done aana sollunga!', on:true},
    {id:1002, time:'21:30', title:'Inniki log pannunga 📝', body:'Selavu, workout, walk… ellam sollitu thoongunga!', on:true},
  ],
  settings:{active:null, petrolPrice:103, period:'month', smart:false, storySeen:'', alerted:{}},
};

/* ---------- utils ---------- */
const uid = ()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const sod = (t=Date.now())=>{ const d=new Date(t); d.setHours(0,0,0,0); return d.getTime(); };
const dkey = t=>{ const d=new Date(t); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const mkey = t=>{ const d=new Date(t); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); };
const monthName = k=>{ const [y,m]=k.split('-'); return new Date(+y,+m-1,1).toLocaleDateString('en-IN',{month:'long'}); };
const esc = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const rs = n=>'₹'+Math.round(n||0).toLocaleString('en-IN');
const first = m=>m? m.name.split(' ')[0] : '';
const active = ()=>S.members.find(m=>m.id===S.settings.active) || S.members[0] || null;
const memberOf = e=>S.members.find(m=>m.id===e.member);
const ofMember = (id)=>S.entries.filter(e=>!id || e.member===id);
const save = ()=>Platform.save(S);
function iconOf(e){ if(e.type==='mood') return ({sore:'🤕',tired:'😴',happy:'😄'})[e.feeling]||'🙂'; if(e.item && /milk/i.test(e.item)) return '🥛'; if(e.type==='workout') return '💪'; return ICON[e.cat]||'📝'; }
const isMind = e=>e.type==='activity' && /Meditation|Yoga/.test(e.cat);
const isMove = e=>e.type==='activity' && /Walk|Run|Cycling|Swimming/.test(e.cat);

/* ---------- derived numbers ---------- */
function streak(mid, pred){
  const days = new Set(ofMember(mid).filter(pred).map(e=>dkey(e.ts)));
  let t = sod(), n=0;
  if(!days.has(dkey(t))) t -= DAY;           // still alive if done yesterday
  while(days.has(dkey(t))){ n++; t -= DAY; }
  return n;
}
function bestStreak(mid, pred){
  const days=[...new Set(ofMember(mid).filter(pred).map(e=>sod(e.ts)))].sort((a,b)=>a-b);
  let best=0, cur=0, prev=null;
  for(const d of days){ cur = (prev!=null && Math.round((d-prev)/DAY)===1) ? cur+1 : 1; best=Math.max(best,cur); prev=d; }
  return best;
}
function counts(mid){
  const es = ofMember(mid);
  const workouts = es.filter(e=>e.type==='workout');
  return {
    workouts: new Set(workouts.map(e=>dkey(e.ts))).size,
    moves: es.filter(isMove).length,
    fuels: es.filter(e=>e.type==='expense'&&e.cat==='Fuel').length,
    medStreak: bestStreak(mid, isMind),
    logStreak: bestStreak(mid, ()=>true),
    earlyMed: es.filter(e=>isMind(e) && ((e.start && +e.start.split(':')[0]<7) || (!e.start && new Date(e.ts).getHours()<7))).length,
    underBudget: monthsUnderBudget(),
  };
}
function monthsUnderBudget(){
  if(!S.budgets.Total) return 0;
  const months = {}; S.entries.filter(e=>e.type==='expense').forEach(e=>{ const k=mkey(e.ts); months[k]=(months[k]||0)+e.amount; });
  const cur = mkey(Date.now());
  return Object.entries(months).filter(([k,v])=>k!==cur && v<=S.budgets.Total).length;
}
function needMet(need, c){ if(!need) return true; return (c[need.kind]||0) >= need.n; }
function needText(need){ return ({workouts:`${need.n} workout days`, moves:`${need.n} walks/runs`, medStreak:`${need.n}-day meditation streak`, fuels:`${need.n} fuel logs`, logStreak:`${need.n}-day logging streak`, underBudget:`a month under budget`})[need.kind]; }
const BADGES = [
  {id:'gym10', icon:'💪', name:'Gym 10', need:{kind:'workouts',n:10}},
  {id:'gym50', icon:'🏋️', name:'Gym 50', need:{kind:'workouts',n:50}},
  {id:'gym100', icon:'🦾', name:'Gym 100', need:{kind:'workouts',n:100}},
  {id:'zen3', icon:'🕯️', name:'Zen 3-day', need:{kind:'medStreak',n:3}},
  {id:'zen7', icon:'🧘', name:'Zen 7-day', need:{kind:'medStreak',n:7}},
  {id:'zen30', icon:'🪷', name:'Zen 30-day', need:{kind:'medStreak',n:30}},
  {id:'walk10', icon:'👟', name:'Walker', need:{kind:'moves',n:10}},
  {id:'early', icon:'🌅', name:'Early bird', need:{kind:'earlyMed',n:5}},
  {id:'log7', icon:'📒', name:'Logger 7', need:{kind:'logStreak',n:7}},
  {id:'saver', icon:'🏦', name:'Saver', need:{kind:'underBudget',n:1}},
];
function monthSpend(t=Date.now()){
  const k=mkey(t), by={Total:0};
  S.entries.filter(e=>e.type==='expense' && mkey(e.ts)===k).forEach(e=>{ by[e.cat]=(by[e.cat]||0)+e.amount; by.Total+=e.amount; });
  return by;
}
function budgetState(){
  const sp = monthSpend(); const out=[];
  for(const [cat,lim] of Object.entries(S.budgets)){ if(!lim) continue; const used=sp[cat]||0; out.push({cat, lim, used, pct:used/lim}); }
  return out.sort((a,b)=>b.pct-a.pct);
}
function restTips(){
  const tips=[];
  for(const m of S.members){
    const sore = ofMember(m.id).filter(e=>e.type==='workout' && e.feeling==='sore' && e.ts>=sod()-2*DAY);
    const byEx={}; sore.forEach(e=>{ (byEx[e.exercise]=byEx[e.exercise]||new Set()).add(dkey(e.ts)); });
    for(const [ex,days] of Object.entries(byEx)){
      if(days.size>=2) tips.push({m, ex, text:`${first(m)}, ${ex.toLowerCase()} vali ${days.size} naal-aa irukku. Inniki rest day 🛌 — stretch & sleep!`});
    }
  }
  return tips;
}
function mileage(mid){
  const fills = ofMember(mid).filter(e=>e.type==='expense' && e.cat==='Fuel' && e.odo).sort((a,b)=>a.ts-b.ts);
  const rows=[];
  for(let i=1;i<fills.length;i++){
    const a=fills[i-1], b=fills[i]; const km=b.odo-a.odo; const L = a.litres || (a.amount/(S.settings.petrolPrice||103));
    if(km>0 && L>0) rows.push({at:b.ts, km, L, kmpl:km/L, cost:a.amount/km});
  }
  return {fills, rows};
}

/* ---------- scene ---------- */
let anims = {}; // memberId -> {anim, until}
function poseFor(m){
  const today = ofMember(m.id).filter(e=>e.ts>=sod()).sort((a,b)=>b.ts-a.ts);
  const e = today[0]; if(!e) return {pose:''};
  if(e.type==='workout') return {pose:'curl-slow'};
  if(e.type==='activity') return {pose: isMind(e)?'meditate': e.cat==='Sleep'?'sleep': isMove(e)?'walk':''};
  if(e.type==='expense') return {pose:'hold', item:iconOf(e)};
  if(e.type==='mood' && e.feeling!=='happy') return {pose:'pain'};
  return {pose:''};
}
function renderScene(){
  const h = new Date().getHours();
  const overBudget = budgetState().some(b=>b.cat==='Total' && b.pct>=1);
  const list = S.members.map(m=>{
    const p = poseFor(m);
    const a = anims[m.id] && anims[m.id].until>Date.now() ? anims[m.id] : null;
    const night = (h<5||h>=22);
    return {m, pose: a? a.anim : p.pose, item: a&&a.item || p.item, streak: Math.max(streak(m.id,isMind), streak(m.id,e=>e.type==='workout')), asleep: night && !a, shocked: overBudget && !a};
  });
  $('#sceneWrap').innerHTML = sceneSVG(list, h);
}
let playing=false, queue=[];
function act(mid, anim, opts={}){ queue.push({mid, anim, ...opts}); if(!playing) nextAct(); }
function nextAct(){
  const a = queue.shift(); if(!a){ playing=false; renderScene(); return; }
  playing=true;
  const dur = a.dur || 3600;
  if(a.mid) anims[a.mid] = {anim:a.anim, item:a.item, until:Date.now()+dur};
  renderScene();
  const g = a.mid && $(`#scene .mem[data-id="${a.mid}"]`);
  if(g){ g.classList.add('jump'); scrollToMember(a.mid); }
  if(a.all) $$('#scene .mem').forEach(n=>{ n.dataset.anim=a.anim; n.classList.remove('asleep'); });
  if(a.say) say(a.say);
  if(a.pop){ const p=$('#pop'); const i=S.members.findIndex(m=>m.id===a.mid); p.textContent=a.pop; p.setAttribute('x', i>=0? slotX(i) : sceneWidth(S.members.length)/2); p.classList.remove('go'); void p.getBBox(); p.classList.add('go'); }
  if(a.then){ setTimeout(()=>{ const n=a.mid && $(`#scene .mem[data-id="${a.mid}"]`); if(n) n.dataset.anim=a.then; }, dur*0.6); }
  setTimeout(nextAct, dur);
}
function scrollToMember(mid){
  const i=S.members.findIndex(m=>m.id===mid); if(i<0) return;
  const w=$('#sceneWrap'); const svg=$('#scene'); const scale = svg.getBoundingClientRect().width / sceneWidth(S.members.length);
  w.scrollTo({left: Math.max(0, slotX(i)*scale - w.clientWidth/2), behavior:'smooth'});
}
let bubbleT=null;
function say(t, ms=5500){ const b=$('#bubble'); b.textContent=t; b.classList.remove('hide'); clearTimeout(bubbleT); bubbleT=setTimeout(()=>b.classList.add('hide'), ms); }
function animFor(e){
  if(e.type==='expense') return e.cat==='Fuel'?'fuel':'buy';
  if(e.type==='workout') return 'curl';
  if(e.type==='activity') return isMind(e)?'meditate': e.cat==='Sleep'?'sleep': isMove(e)?'walk':'happy';
  if(e.type==='mood') return e.feeling==='happy'?'happy':'pain';
  return 'happy';
}
function popFor(e){
  if(e.type==='expense') return '−'+rs(e.amount);
  if(e.type==='workout' && e.sets && e.reps) return e.sets+'×'+e.reps;
  if(e.mins) return e.mins>=90 ? (Math.round(e.mins/6)/10)+' h' : e.mins+' min';
  return '';
}
$('#sceneWrap').addEventListener('click', ev=>{
  const g = ev.target.closest('.mem'); if(!g) return;
  S.settings.active = g.dataset.id; save(); renderHome(); act(g.dataset.id,'happy',{dur:1400, say:`Hi ${first(active())}! Mic tap panni sollunga 🎙️`});
});

/* ---------- logging pipeline ---------- */
function findCall(text){
  const toks=[]; const re=/[\p{L}\p{N}]+/gu; let x;
  while((x=re.exec(text))) toks.push({w:x[0].toLowerCase(), s:x.index, e:x.index+x[0].length});
  const lev=(a,b)=>{ const m=[...Array(b.length+1).keys()]; for(let i=1;i<=a.length;i++){ let p=m[0]; m[0]=i; for(let j=1;j<=b.length;j++){ const t=m[j]; m[j]=Math.min(m[j]+1,m[j-1]+1,p+(a[i-1]===b[j-1]?0:1)); p=t; } } return m[b.length]; };
  let best=null;
  for(const m of S.members){
    const parts = String(m.call||m.name).toLowerCase().split(/\s+/).filter(Boolean);
    for(let i=0;i+parts.length<=toks.length && i<4;i++){
      const ok = parts.every((b,k)=>{ const a=toks[i+k].w; return a===b || (b.length>=5 && lev(a,b)<=1); });
      if(ok){ if(!best||toks[i].s<best.pos) best={member:m, pos:toks[i].s, before:text.slice(0,toks[i].s), after:text.slice(toks[i+parts.length-1].e)}; break; }
    }
  }
  return best;
}
let lastLogged = [];
async function handleText(raw, src){
  raw = String(raw||'').trim(); if(!raw) return null;
  let member = active();
  let text = raw;
  const hit = findCall(raw);
  if(hit){ member = hit.member; text = (hit.before.replace(/\b(hi|hey|hai|ok|okay|da|di)\b/gi,'')+' '+hit.after).replace(/^[\s,.:!-]+/,'').trim(); S.settings.active = member.id; }
  if(!member){ openMember(null); return null; }
  // 1) correction?
  const c = parseCorrection(text);
  if(c){
    const r = applyCorrection(c, ofMember(member.id));
    if(r){
      if(r.action==='delete'){
        S.entries = S.entries.filter(e=>e!==r.entry); save(); renderAll();
        act(member.id,'happy',{dur:1800, say:`Sari, "${summarize(r.entry)}" delete pannitten 🗑️`});
        toast(`Deleted: ${summarize(r.entry)}`, ()=>{ S.entries.push(r.entry); save(); renderAll(); });
        return {corrected:true, text:`Deleted ${summarize(r.entry)}`};
      }
      const before = {...r.entry};
      r.entry[r.field] = r.to; r.entry.edited = Date.now(); r.entry.reply = replyFor(r.entry, member);
      save(); renderAll(); checkBudgets(r.entry, before);
      const label = r.field==='amount' ? `${rs(r.old)} → ${rs(r.to)}` : `${r.field} ${r.old} → ${r.to}`;
      act(member.id, animFor(r.entry), {dur:2400, say:`Correct pannitten ✅ ${r.entry.item||r.entry.exercise||r.entry.cat}: ${label}`, pop:'✏️'});
      toast(`Changed ${label}`, ()=>{ Object.assign(r.entry, before); save(); renderAll(); });
      return {corrected:true, text:`Changed ${label}`};
    }
    say(`Edhai maathanum nu puriyala 🤔 — History la tap panni edit pannalaam`);
    return null;
  }
  // 2) parse & log
  let items=null;
  if(S.settings.smart && smartSample){ say('Purinjukaren… 🤔'); try{ items = await smartParse(text, member); }catch(e){} }
  if(!items || !items.length) items = ruleParse(text, member);
  const now=Date.now();
  const made = items.map((it,i)=>{
    const e = {...it, id:uid(), member:member.id, ts:now+i, raw, src};
    if(e.type==='expense' && e.cat==='Fuel' && !e.litres && S.settings.petrolPrice) e.litresEst = +(e.amount/S.settings.petrolPrice).toFixed(2);
    if(e.type==='note') e.note = text;
    e.reply = e.reply || replyFor(e, member);
    return e;
  });
  const before = monthSpend();
  S.entries.push(...made); save();
  lastLogged = made;
  renderAll();
  made.forEach(e=>{
    const sore = e.type==='workout' && e.feeling==='sore';
    act(member.id, animFor(e), {say:e.reply, pop:popFor(e), item:iconOf(e), then: sore?'pain':null, dur: sore?4200:3600});
    if(e.type==='expense') checkBudgets(e, null, before);
  });
  const tips = restTips().filter(t=>t.m.id===member.id && made.some(e=>e.type==='workout'));
  if(tips.length) act(member.id,'pain',{dur:3000, say:tips[0].text});
  const unlocked = newUnlocks(member);
  unlocked.forEach(u=>act(member.id,'happy',{dur:3200, say:`🎉 ${first(member)} unlocked ${u.icon} ${u.name}!`}));
  toast(`Logged: ${made.map(e=>e.type==='note'?'note':summarize(e)).join(', ')}`, ()=>{ S.entries = S.entries.filter(e=>!made.includes(e)); save(); renderAll(); say('Undo pannitten ↩️'); });
  Platform.haptic(); refreshNightly();
  return {made, text: made.map(e=>e.type==='note'?'📝 '+text:summarize(e)).join(' · ')};
}
function checkBudgets(e, beforeEntry, beforeSpend){
  if(e.type!=='expense') return;
  const now = monthSpend(); const prev = beforeSpend || now;
  for(const cat of ['Total', e.cat]){
    const lim = S.budgets[cat]; if(!lim) continue;
    const p0 = (prev[cat]||0)/lim, p1 = (now[cat]||0)/lim;
    const k = mkey(Date.now())+':'+cat;
    for(const th of [0.8,1]){
      if(p1>=th && (p0<th || beforeEntry) && !(S.settings.alerted[k]>=th)){
        S.settings.alerted[k]=th; save();
        const msg = th>=1 ? `😱 ${cat==='Total'?'Monthly':cat} budget cross aayiduchu! ${rs(now[cat])} / ${rs(lim)}` : `⚠️ ${cat==='Total'?'Monthly':cat} budget 80% aachu — ${rs(now[cat])} / ${rs(lim)}`;
        act(e.member,'shock',{dur:3000, say:msg});
        Platform.notifyNow('Budget alert', msg.replace(/^\S+\s/,''));
      }
    }
  }
}
let unlockedSeen = null;
function newUnlocks(m){
  const c = counts(m.id); const got=[];
  m.seen = m.seen || [];
  for(const it of [...BADGES, ...OUTFITS.filter(o=>o.need).map(o=>({...o, id:'o_'+o.id, name:o.name+' outfit'})), ...VCOLORS.filter(v=>v.need).map(v=>({...v, id:'v_'+v.id, icon:'🚗', name:v.name+' vehicle colour'}))]){
    if(needMet(it.need, c) && !m.seen.includes(it.id)){ m.seen.push(it.id); got.push(it); }
  }
  if(got.length) save();
  return got;
}

/* ---------- Claude smart parse (web preview only) ---------- */
let smartSample=null;
async function smartParse(cmd, m){
  const prompt = `Convert one spoken life-log sentence (Indian English with Tamil words) into JSON. Person: ${m.name}, owns a ${m.vehicle}. Now: ${new Date().toString()}.
Sentence: """${cmd}"""
Return ONLY {"entries":[...]}; one object per thing. Fields (omit unknown): type expense|workout|activity|mood|note; cat (expense: ${EXP_CATS.join('|')}; activity: ${ACT_CATS.join('|')}; workout: Workout; mood: Mood); item; amount (rupees); vehicle car|scooter|bike; odo; exercise; sets; reps; kg; km; litres; start,end "H:MM" 24h; mins; feeling sore|tired|happy.
Hints: achu/aachu = cost/spent, poten = did, vangunen = bought, vali = pain, paal = milk, ruba = rupees.`;
  const v = await smartSample.json(prompt, {modelTier:'quick'});
  const arr = v && Array.isArray(v.entries) ? v.entries : null; if(!arr) return null;
  return arr.map(e=>{ const o={}; for(const k of ['type','cat','item','vehicle','exercise','start','end','feeling']) if(typeof e[k]==='string'&&e[k]) o[k]=e[k].slice(0,60);
    for(const k of ['amount','sets','reps','kg','km','litres','mins','odo']) if(e[k]!=null && isFinite(+e[k])) o[k]=+e[k];
    if(!['expense','workout','activity','mood','note'].includes(o.type) || (o.type==='expense'&&o.amount==null)) return null;
    o.cat=o.cat||({expense:'Other',workout:'Workout',activity:'Other',mood:'Mood',note:'Note'})[o.type]; return o; }).filter(Boolean);
}

/* ---------- mic UI ---------- */
let listening=false;
async function startVoice(target){
  if(listening){ Platform.stopListening(); return; }
  if(Platform.voiceKind==='none'){ say('Voice indha browser-la work aagadhu — keyboard use pannunga ⌨️'); openType(); return; }
  const live = target==='quick' ? $('#qLive') : $('#micLive');
  const btn = target==='quick' ? $('#qMic') : $('#micBtn');
  live.textContent='Sollunga… 👂'; Platform.lastError=null;
  const text = await Platform.listen(t=>{ live.textContent='“'+t+'”'; }, st=>{ listening = st==='listening'; btn.classList.toggle('live', listening); });
  if(!text){ live.textContent = Platform.lastError ? '⚠️ '+Platform.lastError : 'Onnum kekkala — try again'; return; }
  live.textContent='“'+text+'”';
  const r = await handleText(text, 'voice');
  if(target==='quick') quickDone(r);
}
$('#micBtn').onclick = ()=>startVoice('home');
$('#kbBtn').onclick = ()=>openType();
function openType(){ $('#typeRow').classList.add('open'); $('#typeInput').focus(); }
$('#typeRow').onsubmit = async e=>{ e.preventDefault(); const v=$('#typeInput').value.trim(); if(!v) return; $('#typeInput').value=''; await handleText(v,'type'); };
$('#tries').onclick = e=>{ const b=e.target.closest('button'); if(b) handleText(b.textContent,'type'); };

/* ---------- quick log (widget) ---------- */
function openQuick(mode){
  if(!S.members.length) return;
  $('#quick').classList.add('open'); $('#qResult').textContent=''; $('#qLive').textContent = mode==='voice'?'':'Type and press Log';
  $('#qWho').innerHTML = S.members.map(m=>`<button data-id="${m.id}" class="${m.id===active().id?'on':''}">${esc(first(m))}</button>`).join('');
  if(mode==='voice') setTimeout(()=>startVoice('quick'), 250); else setTimeout(()=>$('#qInput').focus(),250);
}
function quickDone(r){
  if(!r) return;
  $('#qResult').innerHTML = `✅ ${esc(r.text)}`;
  $('#qActions').classList.add('show');
}
$('#qWho').onclick = e=>{ const b=e.target.closest('button'); if(!b) return; S.settings.active=b.dataset.id; save(); openQuick('none'); renderHome(); };
$('#qMic').onclick = ()=>startVoice('quick');
$('#qForm').onsubmit = async e=>{ e.preventDefault(); const v=$('#qInput').value.trim(); if(!v) return; $('#qInput').value=''; quickDone(await handleText(v,'type')); };
$('#qClose').onclick = ()=>{ $('#quick').classList.remove('open'); $('#qActions').classList.remove('show'); Platform.minimize(); };
$('#qOpen').onclick = ()=>{ $('#quick').classList.remove('open'); $('#qActions').classList.remove('show'); };
$('#qMore').onclick = ()=>{ $('#qResult').textContent=''; $('#qActions').classList.remove('show'); startVoice('quick'); };

/* ---------- toast ---------- */
let toastT=null;
function toast(t, undo){
  const el=$('#toast'); el.innerHTML = `<span>${esc(t)}</span>${undo?'<button>Undo</button>':''}`; el.classList.add('show');
  if(undo) el.querySelector('button').onclick = ()=>{ undo(); el.classList.remove('show'); };
  clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove('show'), 6000);
}

/* ---------- tabs ---------- */
let tab='home';
$('#nav').onclick = e=>{ const b=e.target.closest('button'); if(!b) return; tab=b.dataset.t; renderTabs(); window.scrollTo(0,0); };
function renderTabs(){
  $$('#nav button').forEach(b=>b.classList.toggle('on', b.dataset.t===tab));
  $$('.tab').forEach(s=>s.hidden = s.id!=='t-'+tab);
  if(tab==='track') renderTrack(); if(tab==='history') renderHistory(); if(tab==='settings') renderSettings(); if(tab==='home') renderHome();
}

/* ---------- HOME ---------- */
function renderHome(){
  const m = active();
  $('#who').innerHTML = S.members.map(x=>`<button class="chip ${m&&x.id===m.id?'on':''}" data-id="${x.id}"><span class="dot" style="background:${x.color}">${esc(x.name[0]).toUpperCase()}</span>${esc(first(x))}</button>`).join('') + `<button class="chip add" data-add="1">＋</button>`;
  const now=new Date(); $('#today').textContent = now.toLocaleDateString('en-IN',{weekday:'long', day:'numeric', month:'short'});
  // alerts
  const al=[];
  budgetState().filter(b=>b.pct>=0.8).forEach(b=>al.push(`<div class="alert ${b.pct>=1?'red':''}">${b.pct>=1?'😱':'⚠️'} <b>${b.cat==='Total'?'Monthly':b.cat} budget</b> ${Math.round(b.pct*100)}% — ${rs(b.used)} / ${rs(b.lim)}</div>`));
  restTips().forEach(t=>al.push(`<div class="alert">🛌 ${esc(t.text)}</div>`));
  const prevKey = mkey(new Date(now.getFullYear(), now.getMonth(), 0).getTime());
  if(S.entries.some(e=>mkey(e.ts)===prevKey)) al.push(`<button class="alert story" id="storyBtn">🎬 <b>${monthName(prevKey)} family story</b> — watch the highlights</button>`);
  $('#alerts').innerHTML = al.join('');
  const sb=$('#storyBtn'); if(sb) sb.onclick = ()=>playStory(prevKey);
  if(sb && S.settings.storySeen!==prevKey && now.getDate()<=7){ S.settings.storySeen=prevKey; save(); setTimeout(()=>playStory(prevKey), 1200); }
  // today tiles for active member + family spend
  if(m){
    const es = ofMember(m.id).filter(e=>e.ts>=sod());
    const fam = S.entries.filter(e=>e.type==='expense' && e.ts>=sod()).reduce((s,e)=>s+e.amount,0);
    const mine = es.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0);
    $('#todayTiles').innerHTML = [
      [rs(mine), `${first(m)} spent`], [es.filter(e=>e.type==='workout').reduce((s,e)=>s+(e.sets||1),0), 'sets'],
      [es.filter(isMind).reduce((s,e)=>s+(e.mins||0),0)+'m','mindful'], [rs(fam),'family today']
    ].map(([v,k])=>`<div class="tile"><div class="v">${v}</div><div class="k">${k}</div></div>`).join('');
    const sM = streak(m.id,isMind), sW = streak(m.id,e=>e.type==='workout');
    $('#streaks').innerHTML = `<span>🔥 Meditation <b>${sM}</b> day${sM===1?'':'s'}</span><span>🔥 Workout <b>${sW}</b> day${sW===1?'':'s'}</span>`;
    const recent = ofMember(m.id).sort((a,b)=>b.ts-a.ts).slice(0,5);
    $('#recent').innerHTML = recent.length ? recent.map(rowHTML).join('') : `<li class="empty">Mic tap panni sollunga — e.g. “200 achu paal” 🎙️</li>`;
  }
  renderScene();
}
$('#who').onclick = e=>{ const b=e.target.closest('button'); if(!b) return; if(b.dataset.add) return openMember(null); S.settings.active=b.dataset.id; save(); renderHome(); act(b.dataset.id,'happy',{dur:1200}); };
function rowHTML(e){
  const d=new Date(e.ts); const m=memberOf(e);
  const title = e.type==='note' ? esc(e.note||e.raw) : esc(summarize(e));
  return `<li data-id="${e.id}"><div class="ic">${iconOf(e)}</div><div><div class="t">${title}${e.edited?' <span class="ed">edited</span>':''}</div><div class="raw">${S.members.length>1&&m?esc(first(m))+' · ':''}“${esc(e.raw)}”</div></div><div class="meta">${d.toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'})}</div></li>`;
}
document.addEventListener('click', e=>{ const li=e.target.closest('.log li[data-id]'); if(li) openEdit(li.dataset.id); });

/* ---------- monthly story ---------- */
function playStory(k){
  tab='home'; renderTabs();
  const es = S.entries.filter(e=>mkey(e.ts)===k);
  const spend = es.filter(e=>e.type==='expense'); const tot = spend.reduce((s,e)=>s+e.amount,0);
  const byCat={}; spend.forEach(e=>byCat[e.cat]=(byCat[e.cat]||0)+e.amount); const top=Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0];
  act(null,'happy',{all:true, dur:3200, say:`🎬 ${monthName(k)} — Namma Veedu highlights!`});
  if(tot) act(null,'buy',{all:true, dur:3400, say:`Family spent ${rs(tot)}${top?` · top: ${top[0]} ${rs(top[1])}`:''} 💸`});
  for(const m of S.members){
    const mine = es.filter(e=>e.member===m.id);
    const wd = new Set(mine.filter(e=>e.type==='workout').map(e=>dkey(e.ts))).size;
    const med = mine.filter(isMind).reduce((s,e)=>s+(e.mins||0),0);
    const walk = mine.filter(isMove).reduce((s,e)=>s+(e.mins||0),0);
    const best = Math.max(wd?1:0, med?1:0, walk?1:0);
    if(!mine.length){ act(m.id,'sleep',{dur:2600, say:`${first(m)}: ${monthName(k)} la log illa 😴 — next month!`}); continue; }
    if(wd>=med/10 && wd>=walk/15 && wd) act(m.id,'curl',{dur:3200, say:`${first(m)}: ${wd} workout days 💪`, pop:wd+' days'});
    else if(med>=walk && med) act(m.id,'meditate',{dur:3200, say:`${first(m)}: ${med} min meditation 🧘`, pop:med+' min'});
    else if(walk) act(m.id,'walk',{dur:3200, say:`${first(m)}: ${walk} min walking 🚶`, pop:walk+' min'});
    else act(m.id,'buy',{dur:3000, say:`${first(m)}: ${mine.length} logs this month 📒`});
  }
  act(null,'happy',{all:true, dur:2600, say:`Sema month! Keep going 🎉`});
}

/* ---------- TRACK (monitoring) ---------- */
let trackWho = 'family', trackEx = null;
function renderTrack(){
  $('#trackWho').innerHTML = `<button data-w="family" class="${trackWho==='family'?'on':''}">👨‍👩‍👧 Family</button>` + S.members.map(m=>`<button data-w="${m.id}" class="${trackWho===m.id?'on':''}">${esc(first(m))}</button>`).join('');
  const mid = trackWho==='family' ? null : trackWho;
  // budgets
  const sp = monthSpend();
  const cats = [...new Set(['Total', ...Object.keys(S.budgets).filter(k=>S.budgets[k]), ...Object.keys(sp)])];
  const mine = {}; if(mid){ S.entries.filter(e=>e.member===mid && e.type==='expense' && mkey(e.ts)===mkey(Date.now())).forEach(e=>{ mine[e.cat]=(mine[e.cat]||0)+e.amount; mine.Total=(mine.Total||0)+e.amount; }); }
  $('#budgets').innerHTML = `<h2>${monthName(mkey(Date.now()))} budget ${mid?`<small>(${esc(first(memberOf({member:mid})))}'s share shown in dark)</small>`:''}</h2>` + cats.map(c=>{
    const lim=S.budgets[c]||0, used=sp[c]||0, me=mine[c]||0; const pct = lim? used/lim : 0;
    const cls = pct>=1?'red':pct>=.8?'amber':'';
    return `<div class="bud ${cls}"><div class="bl"><span>${ICON[c]||'💸'} ${c}</span><span><b>${rs(used)}</b>${lim?` / ${rs(lim)}`:''}</span></div>
      <div class="track"><div class="fill" style="width:${lim?Math.min(100,pct*100):(used?100:0)}%"></div>${mid&&lim?`<div class="fill me" style="width:${Math.min(100,me/lim*100)}%"></div>`:''}${lim?'<i style="left:80%"></i>':''}</div></div>`;
  }).join('') + `<div class="hint">Set budgets in ⚙️ Settings. Warning at 80%, alarm at 100%.</div>`;
  // habits (14 days)
  const days=[...Array(14)].map((_,i)=>sod()-(13-i)*DAY);
  const series = (pred, val)=>days.map(d=>S.entries.filter(e=>(!mid||e.member===mid) && sod(e.ts)===d && pred(e)).reduce((s,e)=>s+val(e),0));
  const labels = days.map(d=>new Date(d).getDate());
  $('#habits').innerHTML = `<h2>Habits · last 14 days</h2>
    <div class="ch"><div class="cl">🧘 Meditation (min)</div>${bars(series(isMind,e=>e.mins||0), labels, '#7C3AED')}</div>
    <div class="ch"><div class="cl">🚶 Walk / run (min)</div>${bars(series(isMove,e=>e.mins||0), labels, '#0F766E')}</div>
    <div class="ch"><div class="cl">😴 Sleep (hours)</div>${bars(series(e=>e.type==='activity'&&e.cat==='Sleep',e=>(e.mins||0)/60), labels, '#2B6CB0')}</div>
    <div class="ch"><div class="cl">💸 Spending (₹)</div>${bars(series(e=>e.type==='expense',e=>e.amount), labels, '#F59E0B')}</div>`;
  // workout progress
  const ws = S.entries.filter(e=>(!mid||e.member===mid) && e.type==='workout');
  const exs = [...new Set(ws.map(e=>e.exercise||'Workout'))];
  if(!exs.includes(trackEx)) trackEx = exs[0]||null;
  let wk='';
  if(trackEx){
    const weeks=[...Array(8)].map((_,i)=>{ const end=sod()+DAY-(7-i)*7*DAY; return {s:end-7*DAY, e:end}; });
    const vol = weeks.map(w=>ws.filter(e=>(e.exercise||'Workout')===trackEx && e.ts>=w.s && e.ts<w.e).reduce((s,e)=>s+(e.sets||1)*(e.reps||1),0));
    const kg = weeks.map(w=>Math.max(0,...ws.filter(e=>(e.exercise||'Workout')===trackEx && e.ts>=w.s && e.ts<w.e).map(e=>e.kg||0)));
    const wl = weeks.map(w=>new Date(w.s+DAY).toLocaleDateString('en-IN',{day:'numeric',month:'short'}));
    wk = `<div class="seg small" id="exPick">${exs.map(x=>`<button class="${x===trackEx?'on':''}">${esc(x)}</button>`).join('')}</div>
      <div class="ch"><div class="cl">Weekly volume (sets × reps)</div>${line(vol, wl, '#C2410C')}</div>
      ${kg.some(Boolean)?`<div class="ch"><div class="cl">Heaviest weight (kg)</div>${line(kg, wl, '#2F855A')}</div>`:''}`;
  } else wk = `<div class="hint">Say “bicep 3 set 12 rep” to start tracking workouts.</div>`;
  $('#workouts').innerHTML = `<h2>Workout progress</h2>${wk}`;
  const ep=$('#exPick'); if(ep) ep.onclick=e=>{ const b=e.target.closest('button'); if(b){ trackEx=b.textContent; renderTrack(); } };
  // mileage
  const ms = (mid? [memberOf({member:mid})] : S.members).filter(m=>m && m.vehicle!=='none');
  $('#mileage').innerHTML = `<h2>Mileage ⛽</h2>` + (ms.map(m=>{
    const {fills, rows} = mileage(m.id);
    const last = rows[rows.length-1]; const avg = rows.length? rows.reduce((s,r)=>s+r.km,0)/rows.reduce((s,r)=>s+r.L,0) : null;
    return `<div class="mil"><div class="ml"><b>${esc(first(m))}'s ${m.vehicle}</b>${avg?`<span class="big">${avg.toFixed(1)} <small>km/l avg</small></span>`:''}</div>
      ${rows.length? rows.slice(-4).reverse().map(r=>`<div class="mr"><span>${new Date(r.at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span><span>${r.km} km</span><span>${r.kmpl.toFixed(1)} km/l</span><span>₹${r.cost.toFixed(1)}/km</span></div>`).join('')
        : `<div class="hint">${fills.length? 'One more fill with odometer and mileage will show.' : `Say “petrol 500 odometer 12450” when you fill.`}</div>`}</div>`;
  }).join('') || `<div class="hint">No vehicles added.</div>`);
  // badges & rewards
  const bm = mid ? [memberOf({member:mid})] : S.members;
  $('#badges').innerHTML = `<h2>Streaks & rewards</h2>` + bm.map(m=>{
    const c=counts(m.id);
    return `<div class="bm"><div class="bmh"><b>${esc(first(m))}</b><span>🔥 ${streak(m.id,isMind)}d meditation · 🔥 ${streak(m.id,e=>e.type==='workout')}d gym · best ${c.medStreak}d / ${bestStreak(m.id,e=>e.type==='workout')}d</span></div>
      <div class="bgrid">${BADGES.map(b=>{ const ok=needMet(b.need,c); return `<div class="badge ${ok?'':'locked'}" title="${needText(b.need)}"><div>${b.icon}</div><span>${b.name}</span>${ok?'':`<small>${Math.min(c[b.need.kind]||0,b.need.n)}/${b.need.n}</small>`}</div>`; }).join('')}</div></div>`;
  }).join('');
  // weekly report
  $('#report').innerHTML = `<h2>Weekly report 📝</h2><div class="rep">${weeklyReport(mid).map(l=>`<p>${esc(l)}</p>`).join('')}</div>${smartSample?'<button class="btn ghost" id="claudeRep">✨ Ask Claude for a fun version</button><div id="claudeOut" class="rep"></div>':''}`;
  const cr=$('#claudeRep'); if(cr) cr.onclick = async ()=>{ cr.disabled=true; $('#claudeOut').textContent='Writing…'; try{ const r = await smartSample(`Write a short, warm, funny weekly life report in Tanglish (Tamil words in English letters mixed with English), max 90 words, with emojis, for ${mid?first(memberOf({member:mid})):'the family'}. Data: ${JSON.stringify(weeklyReport(mid))}`, {modelTier:'quick'}); $('#claudeOut').textContent=r.text; }catch(e){ $('#claudeOut').textContent='Could not reach Claude right now.'; } cr.disabled=false; };
}
$('#trackWho').onclick = e=>{ const b=e.target.closest('button'); if(b){ trackWho=b.dataset.w; renderTrack(); } };
function weeklyReport(mid){
  const s=sod()-6*DAY, ps=s-7*DAY;
  const es=S.entries.filter(e=>(!mid||e.member===mid) && e.ts>=s), pe=S.entries.filter(e=>(!mid||e.member===mid) && e.ts>=ps && e.ts<s);
  const sum=(a,f)=>a.reduce((x,e)=>x+f(e),0);
  const spent=sum(es.filter(e=>e.type==='expense'),e=>e.amount), pspent=sum(pe.filter(e=>e.type==='expense'),e=>e.amount);
  const by={}; es.filter(e=>e.type==='expense').forEach(e=>by[e.cat]=(by[e.cat]||0)+e.amount); const top=Object.entries(by).sort((a,b)=>b[1]-a[1])[0];
  const wd=new Set(es.filter(e=>e.type==='workout').map(e=>e.member+dkey(e.ts))).size;
  const med=sum(es.filter(isMind),e=>e.mins||0), walk=sum(es.filter(isMove),e=>e.mins||0);
  const sore=es.filter(e=>e.feeling==='sore').length;
  const L=[];
  if(!es.length) return ['Indha vaaram innum edhuvum log aagala. Mic tap pannunga! 🎙️'];
  L.push(`💸 Indha vaaram ${rs(spent)} selavu${top?` — adhigam ${top[0]} (${rs(top[1])})`:''}.${pspent? (spent>pspent*1.2?` Pona vaaratha vida ${Math.round((spent/pspent-1)*100)}% jaasthi 👀`: spent<pspent*0.8?` Pona vaaratha vida ${Math.round((1-spent/pspent)*100)}% kammi — super! 👏`:' Pona vaaram maadhiri dhaan.'):''}`);
  L.push(wd? `💪 ${wd} workout day${wd>1?'s':''} — ${wd>=4?'sema consistency!':'innum konjam push pannalaam!'}` : `💪 Workout illa indha vaaram — naalaiku 10 push-ups try pannunga!`);
  L.push(med? `🧘 ${med} min meditation${med>=60?' — mind sema calm!':'.'}` : `🧘 Meditation miss aayiduchu — 5 min kooda podhum.`);
  if(walk) L.push(`🚶 ${walk} min walking/running. Nalla irukku!`);
  if(sore>=2) L.push(`🤕 ${sore} times vali sonneenga — rest & stretching important.`);
  return L;
}
function bars(vals, labels, color){
  const W=320,H=90,max=Math.max(1,...vals),bw=W/vals.length;
  return `<svg viewBox="0 0 ${W} ${H+16}" class="chart">${vals.map((v,i)=>{ const h=v/max*H; return `<rect x="${i*bw+2}" y="${H-h}" width="${bw-4}" height="${Math.max(h,v?2:0)}" rx="3" fill="${color}" opacity="${i===vals.length-1?1:.75}"><title>${Math.round(v*10)/10}</title></rect>${v?`<text x="${i*bw+bw/2}" y="${H-h-3}" font-size="8" text-anchor="middle" fill="#7A6555">${v>=1000?Math.round(v/100)/10+'k':Math.round(v*10)/10}</text>`:''}<text x="${i*bw+bw/2}" y="${H+12}" font-size="8" text-anchor="middle" fill="#9a8574">${labels[i]}</text>`; }).join('')}<line x1="0" y1="${H}" x2="${W}" y2="${H}" stroke="#EFE2CF"/></svg>`;
}
function line(vals, labels, color){
  const W=320,H=90,max=Math.max(1,...vals),step=W/(vals.length-1||1);
  const pts=vals.map((v,i)=>[i*step, H-v/max*(H-12)]);
  return `<svg viewBox="-8 -4 ${W+16} ${H+20}" class="chart"><polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>${pts.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#fff" stroke="${color}" stroke-width="2.5"/>${vals[i]?`<text x="${p[0]}" y="${p[1]-8}" font-size="8" text-anchor="middle" fill="#7A6555">${vals[i]}</text>`:''}<text x="${p[0]}" y="${H+12}" font-size="7.5" text-anchor="middle" fill="#9a8574">${labels[i]}</text>`).join('')}</svg>`;
}

/* ---------- HISTORY ---------- */
let hType='all', hWho='all';
function renderHistory(){
  $('#hWho').innerHTML = `<button data-w="all" class="${hWho==='all'?'on':''}">Everyone</button>`+S.members.map(m=>`<button data-w="${m.id}" class="${hWho===m.id?'on':''}">${esc(first(m))}</button>`).join('');
  $$('#hType button').forEach(b=>b.classList.toggle('on', b.dataset.t===hType));
  const q = $('#hSearch').value.trim().toLowerCase();
  const es = S.entries.filter(e=>(hWho==='all'||e.member===hWho) && (hType==='all'||e.type===hType) && (!q || (summarize(e)+' '+e.raw+' '+(e.item||'')+' '+(e.exercise||'')).toLowerCase().includes(q))).sort((a,b)=>b.ts-a.ts);
  if(!es.length){ $('#hList').innerHTML = `<div class="empty">No entries yet.</div>`; return; }
  const groups={}; es.forEach(e=>{ (groups[dkey(e.ts)]=groups[dkey(e.ts)]||[]).push(e); });
  $('#hList').innerHTML = Object.entries(groups).slice(0,120).map(([k,list])=>{
    const d=new Date(list[0].ts); const spent=list.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0);
    const lbl = k===dkey(Date.now())?'Today':k===dkey(Date.now()-DAY)?'Yesterday':d.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:d.getFullYear()!==new Date().getFullYear()?'numeric':undefined});
    return `<div class="day"><div class="dh"><b>${lbl}</b><span>${list.length} log${list.length>1?'s':''}${spent?' · '+rs(spent):''}</span></div><ul class="log">${list.map(rowHTML).join('')}</ul></div>`;
  }).join('');
}
$('#hSearch').oninput = ()=>renderHistory();
$('#hType').onclick = e=>{ const b=e.target.closest('button'); if(b){ hType=b.dataset.t; renderHistory(); } };
$('#hWho').onclick = e=>{ const b=e.target.closest('button'); if(b){ hWho=b.dataset.w; renderHistory(); } };

/* ---------- edit entry ---------- */
let editE=null;
function openEdit(id){
  editE = S.entries.find(e=>e.id===id); if(!editE) return;
  const e=editE; const F=(k,l,t='number',extra='')=>`<div class="field half"><label>${l}</label><input type="${t}" data-k="${k}" value="${esc(e[k]??'')}" ${extra}></div>`;
  const sel=(k,l,opts)=>`<div class="field half"><label>${l}</label><select data-k="${k}">${opts.map(o=>`<option ${o===e[k]?'selected':''}>${o}</option>`).join('')}</select></div>`;
  let f='';
  if(e.type==='expense') f = F('amount','Amount ₹')+F('item','Item','text')+sel('cat','Category',EXP_CATS)+(e.cat==='Fuel'?F('odo','Odometer km')+F('litres','Litres'):'');
  else if(e.type==='workout') f = F('exercise','Exercise','text')+F('sets','Sets')+F('reps','Reps')+F('kg','Weight kg')+sel('feeling','Feeling',['','sore','tired','happy']);
  else if(e.type==='activity') f = sel('cat','Activity',ACT_CATS)+F('mins','Minutes')+F('start','Start','text','placeholder="6:00"')+F('end','End','text','placeholder="6:10"')+F('km','Km');
  else if(e.type==='mood') f = sel('feeling','Feeling',['sore','tired','happy']);
  else f = F('note','Note','text');
  const dt = new Date(e.ts - new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
  $('#editBody').innerHTML = `<div class="raw">“${esc(e.raw)}”</div><div class="grid">${f}
    <div class="field half"><label>Who</label><select data-k="member">${S.members.map(m=>`<option value="${m.id}" ${m.id===e.member?'selected':''}>${esc(m.name)}</option>`).join('')}</select></div>
    <div class="field half"><label>When</label><input type="datetime-local" data-k="ts" value="${dt}"></div></div>`;
  $('#editModal').classList.add('open');
}
$('#eSave').onclick = ()=>{
  const before = {...editE};
  $$('#editBody [data-k]').forEach(i=>{ const k=i.dataset.k; let v=i.value;
    if(k==='ts'){ const t=new Date(v).getTime(); if(t) editE.ts=t; return; }
    if(i.type==='number'){ if(v==='') delete editE[k]; else editE[k]=+v; } else { if(v==='') delete editE[k]; else editE[k]=v; } });
  editE.edited=Date.now(); save(); $('#editModal').classList.remove('open'); renderAll();
  if(editE.type==='expense') checkBudgets(editE, before);
  toast('Saved changes', ()=>{ Object.assign(editE, before); Object.keys(editE).forEach(k=>{ if(!(k in before)) delete editE[k]; }); save(); renderAll(); });
};
$('#eDel').onclick = ()=>{ const e=editE; S.entries=S.entries.filter(x=>x!==e); save(); $('#editModal').classList.remove('open'); renderAll(); toast('Deleted', ()=>{ S.entries.push(e); save(); renderAll(); }); };
$('#eCancel').onclick = ()=>$('#editModal').classList.remove('open');

/* ---------- members ---------- */
let editing=null, draft=null;
function openMember(m){
  editing=m; draft = m? JSON.parse(JSON.stringify(m)) : {id:uid(), name:'', call:'', gender:'male', vehicle:'scooter', color:COLORS[S.members.length%COLORS.length], skin:SKINS[1], outfit:'classic', vehColor:null, seen:[]};
  $('#mmTitle').textContent = m? 'Edit '+m.name : (S.members.length? 'Add family member' : 'Vanakkam! Who are you?');
  $('#mName').value=draft.name; $('#mCall').value=draft.call||'';
  $('#mDelete').style.display = m && S.members.length>1 ? '' : 'none';
  $('#mCancel').style.display = S.members.length? '' : 'none';
  syncMember(); $('#memberModal').classList.add('open');
}
function syncMember(){
  $$('#mGender button').forEach(b=>b.classList.toggle('on', b.dataset.v===draft.gender));
  $$('#mVehicle button').forEach(b=>b.classList.toggle('on', b.dataset.v===draft.vehicle));
  $('#mColor').innerHTML = COLORS.map(c=>`<button data-c="${c}" style="background:${c}" class="${c===draft.color?'on':''}"></button>`).join('');
  $('#mSkin').innerHTML = SKINS.map(c=>`<button data-c="${c}" style="background:${c}" class="${c===draft.skin?'on':''}"></button>`).join('');
  const c = editing? counts(editing.id) : {};
  $('#mOutfit').innerHTML = OUTFITS.map(o=>{ const ok=needMet(o.need,c); return `<button data-v="${o.id}" ${ok?'':'disabled'} class="${draft.outfit===o.id?'on':''}" title="${ok?'':'Unlock: '+needText(o.need)}">${o.icon} ${o.name}${ok?'':' 🔒'}</button>`; }).join('');
  const defV = draft.gender==='female'?'pink':'red';
  $('#mVColor').innerHTML = VCOLORS.map(v=>{ const ok=needMet(v.need,c); return `<button data-v="${v.id}" ${ok?'':'disabled'} style="--c:${v.c}" class="vc ${(draft.vehColor||defV)===v.id?'on':''}" title="${ok?v.name:'Unlock: '+needText(v.need)}">${ok?'':'🔒'}</button>`; }).join('');
  $('#mLocks').textContent = OUTFITS.concat(VCOLORS).filter(o=>o.need && !needMet(o.need,c)).slice(0,3).map(o=>`🔒 ${o.name}: ${needText(o.need)}`).join(' · ');
}
$('#mGender').onclick=e=>{ const b=e.target.closest('button'); if(b){ draft.gender=b.dataset.v; syncMember(); } };
$('#mVehicle').onclick=e=>{ const b=e.target.closest('button'); if(b){ draft.vehicle=b.dataset.v; syncMember(); } };
$('#mColor').onclick=e=>{ const b=e.target.closest('button'); if(b){ draft.color=b.dataset.c; syncMember(); } };
$('#mSkin').onclick=e=>{ const b=e.target.closest('button'); if(b){ draft.skin=b.dataset.c; syncMember(); } };
$('#mOutfit').onclick=e=>{ const b=e.target.closest('button'); if(b&&!b.disabled){ draft.outfit=b.dataset.v; syncMember(); } };
$('#mVColor').onclick=e=>{ const b=e.target.closest('button'); if(b&&!b.disabled){ draft.vehColor=b.dataset.v; syncMember(); } };
$('#mCancel').onclick=()=>$('#memberModal').classList.remove('open');
$('#mSave').onclick=()=>{
  draft.name=$('#mName').value.trim(); if(!draft.name){ $('#mName').focus(); return; }
  draft.call=$('#mCall').value.trim()||draft.name.split(' ')[0];
  const clash=S.members.find(m=>m.id!==draft.id && (m.call||'').toLowerCase()===draft.call.toLowerCase());
  if(clash){ $('#mCall').value=''; $('#mCall').placeholder=`"${draft.call}" is ${clash.name}'s`; return; }
  if(editing) Object.assign(editing, draft); else S.members.push(draft);
  S.settings.active=draft.id; save(); $('#memberModal').classList.remove('open'); renderAll();
  act(draft.id,'happy',{dur:2400, say:`Vanakkam ${first(draft)}! 👋 Mic tap panni “200 achu paal” maari sollunga`});
};
$('#mDelete').onclick=()=>{ if(!editing) return; if(!$('#mDelete').dataset.sure){ $('#mDelete').dataset.sure=1; $('#mDelete').textContent='Tap again to remove'; return; }
  delete $('#mDelete').dataset.sure; $('#mDelete').textContent='Remove';
  S.members=S.members.filter(m=>m!==editing); if(S.settings.active===editing.id) S.settings.active=S.members[0]?.id; save(); $('#memberModal').classList.remove('open'); renderAll(); };

/* ---------- SETTINGS ---------- */
async function renderSettings(){
  $('#sMembers').innerHTML = S.members.map(m=>`<li><span class="dot" style="background:${m.color}">${esc(m.name[0]).toUpperCase()}</span><div><b>${esc(m.name)}</b><small>says “${esc(m.call||m.name)}” · ${m.gender} · ${m.vehicle}</small></div><button class="btn ghost" data-edit="${m.id}">Edit</button></li>`).join('') + `<li><button class="btn ghost" id="addMem">＋ Add member</button></li>`;
  $('#sBudgets').innerHTML = ['Total',...EXP_CATS].map(c=>`<label class="bud-in"><span>${ICON[c]} ${c==='Total'?'Whole family':c}</span><input type="number" inputmode="numeric" data-b="${c}" value="${S.budgets[c]||''}" placeholder="no limit"></label>`).join('');
  $('#sPetrol').value = S.settings.petrolPrice||'';
  $('#sRem').innerHTML = S.reminders.map((r,i)=>`<li><input type="time" data-r="${i}" data-f="time" value="${r.time}"><input type="text" data-r="${i}" data-f="title" value="${esc(r.title)}"><label class="sw"><input type="checkbox" data-r="${i}" data-f="on" ${r.on?'checked':''}><span></span></label><button class="del" data-rdel="${i}">✕</button></li>`).join('');
  $('#sNightly').checked = S.settings.nightly!==false;
  $('#sSmartRow').hidden = !smartSample; $('#sSmart').checked = !!S.settings.smart;
  const st = $('#notifState');
  if(!Platform.isNative){ st.innerHTML = '🔕 Alarms & notifications work in the <b>Android app</b>. This web preview can’t ring when closed.'; }
  else {
    const p = await Platform.notifyPermission(false), x = await Platform.exactAlarmStatus();
    st.innerHTML = (p==='granted' ? '🔔 Notifications allowed.' : `🔕 Notifications are off. <button class="btn" id="askN">Allow</button>`) + (x && x!=='granted' ? ` <br>⏰ For on-time alarms, allow “Alarms & reminders”. <button class="btn ghost" id="askX">Open setting</button>` : '');
    const a=$('#askN'); if(a) a.onclick=async()=>{ await Platform.notifyPermission(true); applyReminders(); renderSettings(); };
    const b=$('#askX'); if(b) b.onclick=()=>Platform.openExactAlarmSettings();
  }
}
$('#t-settings').addEventListener('click', e=>{
  const ed=e.target.closest('[data-edit]'); if(ed) openMember(S.members.find(m=>m.id===ed.dataset.edit));
  if(e.target.id==='addMem') openMember(null);
  const rd=e.target.closest('[data-rdel]'); if(rd){ S.reminders.splice(+rd.dataset.rdel,1); save(); applyReminders(); renderSettings(); }
});
$('#t-settings').addEventListener('change', e=>{
  const t=e.target;
  if(t.dataset.b){ const v=+t.value; if(v>0) S.budgets[t.dataset.b]=v; else delete S.budgets[t.dataset.b]; save(); }
  if(t.id==='sPetrol'){ S.settings.petrolPrice=+t.value||103; save(); }
  if(t.dataset.r!=null){ const r=S.reminders[+t.dataset.r]; if(t.dataset.f==='on') r.on=t.checked; else r[t.dataset.f]=t.value; save(); applyReminders(); }
  if(t.id==='sNightly'){ S.settings.nightly=t.checked; save(); applyReminders(); }
  if(t.id==='sSmart'){ S.settings.smart=t.checked; save(); if(t.checked && smartSample) smartSample.json('Reply {"ok":true}',{modelTier:'quick'}).catch(()=>{ S.settings.smart=false; t.checked=false; save(); }); }
});
$('#addRem').onclick=()=>{ S.reminders.push({id:1000+Math.floor(Math.random()*900), time:'07:00', title:'Workout time 💪', body:'Mic tap panni log pannunga!', on:true}); save(); applyReminders(); renderSettings(); };
$('#copyBackup').onclick=async()=>{ try{ await navigator.clipboard.writeText(JSON.stringify(S)); toast('Backup copied — paste it in WhatsApp/Notes to keep safe'); }catch(e){ $('#restoreBox').value=JSON.stringify(S); toast('Select the text below and copy it'); } };
$('#restoreBtn').onclick=()=>{ try{ const o=JSON.parse($('#restoreBox').value); if(!o.members||!o.entries) throw 0; const old=JSON.parse(JSON.stringify(S)); S=Object.assign(S,o); save(); renderAll(); $('#restoreBox').value=''; toast('Restored ✅', ()=>{ S=old; save(); renderAll(); }); }catch(e){ toast('That backup text is not valid'); } };

async function applyReminders(){
  if(!Platform.isNative) return;
  const list = S.reminders.filter(r=>r.on && /^\d\d:\d\d$/.test(r.time)).map((r,i)=>({id:1000+i, hour:+r.time.slice(0,2), minute:+r.time.slice(3), title:r.title, body:r.body||'Tap to log 🎙️'}));
  if(S.settings.nightly!==false) list.push(nightly());
  if(list.length) await Platform.notifyPermission(true);
  await Platform.scheduleDaily(list);
}
function nightly(){
  const es=S.entries.filter(e=>e.ts>=sod()); const spent=es.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0);
  const b=budgetState().find(x=>x.cat==='Total');
  return {id:2000, hour:22, minute:0, title:'Inniki summary 🌙', body:`${es.length} logs · ${rs(spent)} spent today${b?` · month ${Math.round(b.pct*100)}% of budget`:''}. Missed anything? Tap to log.`};
}
let nT=null; function refreshNightly(){ clearTimeout(nT); nT=setTimeout(applyReminders, 1500); }

/* ---------- render all & boot ---------- */
function renderAll(){ renderHome(); if(tab!=='home') renderTabs(); }
$('#tries').innerHTML = ['200 achu paal','2564 achu food','bicep 2 set 13 rep poten','6 - 6:10 meditation','petrol 500 odometer 12450','paal 200 illa 220'].map(t=>`<button type="button">${t}</button>`).join('');

async function boot(){
  const saved = await Platform.load();
  if(saved && saved.members){ S = Object.assign(S, saved); S.settings = Object.assign({period:'month', alerted:{}}, saved.settings||{}); S.settings.alerted = S.settings.alerted||{}; }
  else {
    // migrate v1 (single-page version)
    try{ const v1=JSON.parse(localStorage.getItem('nammaLifeLog.v1')||'null'); if(v1&&v1.members&&v1.members.length){ S.members=v1.members; S.entries=v1.entries||[]; save(); } }catch(e){}
  }
  S.members.forEach(m=>{ m.seen = m.seen || []; m.outfit = m.outfit||'classic'; m.skin = m.skin||SKINS[1]; });
  // mark already-earned rewards as seen so we only celebrate new ones
  S.members.forEach(m=>newUnlocks(m));
  renderTabs();
  if(!S.members.length) openMember(null);
  else { const m=active(); const h=new Date().getHours(); act(m.id,'happy',{dur:2200, say: h<5?`Late night-aa ${first(m)}? 🌙 Sollunga, log pannidren`: h<12?`Kaalai vanakkam ${first(m)}! ☀️ Enna plan inniki?`: h<17?`Vanakkam ${first(m)}! 🎙️ Enna panneenga?`:`Good evening ${first(m)}! 🌙 Inniki enna aachu?`}); }
  const vk = await Platform.initVoice();
  if(vk==='none'){ $('#micBtn').classList.add('off'); $('#micLive').textContent='Voice not available here — use keyboard ⌨️'; }
  else $('#micLive').textContent = 'Tap the mic & speak';
  smartSample = await Platform.sample();
  $('#syncState').textContent = Platform.isNative ? 'Saved on this phone' : Platform.synced ? 'Synced to your Claude account 🔒' : 'Saved in this browser';
  Platform.onQuickLaunch(openQuick);
  applyReminders();
  setInterval(()=>{ if(!playing && tab==='home') renderScene(); }, 60000);
}
window.__app = {handleText, get S(){return S;}, playStory, openQuick};
boot();
})();
