// ---- Tanglish life-log parser (rule based) ----
const NUMW = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,
  thirteen:13,fourteen:14,fifteen:15,sixteen:16,eighteen:18,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,
  onnu:1,rendu:2,moonu:3,munu:3,naalu:4,nalu:4,anju:5,aaru:6,ezhu:7,ettu:8,pathu:10,nooru:100,
  hundred:100,thousand:1000,aayiram:1000,ayiram:1000};
const MULT = {hundred:100,nooru:100,thousand:1000,aayiram:1000,ayiram:1000};

function prep(text){
  let t = ' ' + String(text).toLowerCase().replace(/[“”"]/g,'') + ' ';
  t = t.replace(/(\d),(\d{3})/g,'$1$2');
  t = t.replace(/₹\s*(\d+)/g,' $1 rs ');
  t = t.replace(/\brs\.?\s*(\d+)/g,' $1 rs ');
  t = t.replace(/(\d+(?:\.\d+)?)\s*k\b/g,(m,n)=>' '+Math.round(parseFloat(n)*1000)+' ');
  // "two thousand", "2 thousand", "rendu aayiram"
  t = t.replace(/\b(\d+|[a-z]+)\s+(hundred|nooru|thousand|aayiram|ayiram)\b/g,(m,a,b)=>{
    const n = /^\d+$/.test(a) ? +a : NUMW[a];
    if(n==null || MULT[a]) return m;
    return ' '+(n*MULT[b])+' ';
  });
  t = t.replace(/\b(thousand|aayiram|ayiram|hundred|nooru)\b/g,(m)=>' '+MULT[m]+' ');
  t = t.replace(/\b([a-z]+)\b/g,(m)=> (NUMW[m]!=null && !MULT[m]) ? String(NUMW[m]) : m);
  // "3x12", "3 x 12" -> sets/reps
  t = t.replace(/\b(\d+)\s*[x×]\s*(\d+)\b/g,' $1 sets $2 reps ');
  return t.replace(/\s+/g,' ');
}

const EXPENSE_CATS = [
  ['Fuel',     /\b(petrol|peterol|petral|diesel|fuel|cng|bunk|pump)\b/],
  ['Groceries',/\b(paal|pal|milk|kaai|kaigari|kaikari|vegetables?|veggies|arisi|rice|grocer(y|ies)|maligai|eggs?|muttai|fruits?|pazham|curd|thayir|bread|sugar|oil|ennai)\b/],
  ['Food',     /\b(saapadu|sapadu|saapaadu|food|tea|coffee|kaapi|biryani|hotel|lunch|dinner|breakfast|tiffin|snacks?|swiggy|zomato|parotta|dosa|idli|juice|ice ?cream)\b/],
  ['Bills',    /\b(recharge|bill|eb|current|rent|wifi|emi|gas|cylinder)\b/],
  ['Travel',   /\b(auto|bus|train|metro|uber|ola|rapido|cab|ticket|parking|toll)\b/],
  ['Health',   /\b(medicine|marundhu|marunthu|tablets?|doctor|hospital|clinic|pharmacy)\b/],
  ['Shopping', /\b(dress|shirt|saree|chudi|shoes?|amazon|flipkart|myntra|shopping)\b/],
];
const ITEM_NAMES = {paal:'Milk',pal:'Milk',milk:'Milk',petrol:'Petrol',peterol:'Petrol',petral:'Petrol',diesel:'Diesel',fuel:'Fuel',cng:'CNG',
  kaai:'Vegetables',kaigari:'Vegetables',kaikari:'Vegetables',arisi:'Rice',muttai:'Eggs',pazham:'Fruits',thayir:'Curd',ennai:'Oil',
  saapadu:'Meals',sapadu:'Meals',saapaadu:'Meals',kaapi:'Coffee',marundhu:'Medicine',marunthu:'Medicine',eb:'EB bill',current:'EB bill'};

const EXERCISES = [
  [/\bbiceps? ?curls?\b/,'Bicep curl'],[/\bhammer curls?\b/,'Hammer curl'],[/\bcurls?\b/,'Bicep curl'],
  [/\bpush ?-?ups?\b/,'Push-ups'],[/\bpull ?-?ups?\b/,'Pull-ups'],[/\bsquats?\b/,'Squats'],
  [/\bbench( press)?\b/,'Bench press'],[/\bdead ?lifts?\b/,'Deadlift'],[/\bplanks?\b/,'Plank'],
  [/\bcrunch(es)?\b/,'Crunches'],[/\blunges?\b/,'Lunges'],[/\bshoulder press\b/,'Shoulder press'],
  [/\btriceps?( extension| dips)?\b/,'Triceps'],[/\bdips\b/,'Dips'],[/\bskipping\b/,'Skipping'],
  [/\bsit ?-?ups?\b/,'Sit-ups'],[/\bbiceps?\b/,'Bicep curl'],[/\bchest( day| press)?\b/,'Chest'],
  [/\b(leg day|leg press|legs)\b/,'Legs'],[/\bshoulders?\b/,'Shoulders'],[/\b(back day|rows?)\b/,'Back'],
  [/\b(abs|core)\b/,'Abs'],[/\b(cardio|treadmill|elliptical)\b/,'Cardio'],[/\bburpees?\b/,'Burpees'],[/\blat pull ?downs?\b/,'Lat pulldown'],
  [/\b(gym|workout|exercise|work out)\b/,'Workout'],
];
const ACTIVITIES = [
  [/\b(meditation|meditate|meditated|dhyanam|thiyanam|dhyan)\b/,'Meditation'],
  [/\b(yoga|surya namaskar|pranayam(a)?)\b/,'Yoga'],
  [/\b(walk|walking|walked|nadandhen|nadanthen|nadai)\b/,'Walk'],
  [/\b(run|running|ran|jog|jogging|odunen)\b/,'Run'],
  [/\b(cycling|cycle|cycled)\b/,'Cycling'],
  [/\b(swim|swimming|neechal)\b/,'Swimming'],
  [/\b(sleep|slept|thoongunen|thoongi|nap)\b/,'Sleep'],
  [/\b(read|reading|padichen|study|studied)\b/,'Study'],
];
const PAIN = /\b(vali|valikudhu|valikuthu|valikithu|pain|paining|sore|aiyo+|ayyo+|aiyoo+|ayyoo+|cramp)\b/;
const TIRED = /\b(tired|tried|tayard|sorvu|dull|sleepy|thookam)\b/;
const HAPPY = /\b(happy|santhosham|sandhosham|super|semma|sema|jolly|mass)\b/;
const CURRENCY = /\b(rs|rupees?|ruba|rubai|ruva|rupa|roobai|bucks|ruvaa)\b/;
const SPEND_VERB = /\b(vangunen|vaanginen|vanginen|vangi|bought|buy|paid|potten|poten|pottan|pottu|kudthen|kuduthen|spent|selavu|selavaachu|achu|aachu|charge)\b/;

function pad(n){return String(n).padStart(2,'0');}
function fmt(m){m=((m%1440)+1440)%1440;return Math.floor(m/60)+':'+pad(m%60);}

function parseTimeRange(t){
  const re = /\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?\s*(?:-|–|to|till|until|la irundhu|lerndhu|leruthu|lendhu|varaikum|varai|from)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?/;
  const m = t.match(re);
  if(!m) return null;
  let h1=+m[1], m1=+(m[2]||0), h2=+m[4], m2=+(m[5]||0);
  if(h1>23||h2>23||m1>59||m2>59) return null;
  const pm = /\b(evening|night|saayangalam|sayangalam|raathiri|rathiri|nite)\b/.test(t) || m[3]==='pm';
  if(pm && h1<12) h1+=12; if((pm||m[6]==='pm') && h2<12) h2+=12;
  let s=h1*60+m1, e=h2*60+m2;
  if(e<=s && e+720>s) e+=720;
  if(e<=s) e+=1440;
  const mins=e-s; if(mins>720) return null;
  return {start:fmt(s), end:fmt(e), mins, match:m[0]};
}

function splitClauses(t){
  return t.split(/[.;!?\n]|,(?!\s*\d)|\b(?:apparam|aprom|apram|aprm|and then|then|adhukku apram|also)\b/)
    .map(s=>s.trim()).filter(s=>s.length>1);
}

function vehicleWord(t){
  if(/\b(car|carku|kaaru)\b/.test(t)) return 'car';
  if(/\b(scooty|scooter|activa|jupiter|access)\b/.test(t)) return 'scooter';
  if(/\b(bike|vandi|splendor|pulsar|bullet)\b/.test(t)) return 'bike';
  return null;
}

function parseClause(raw, member){
  let t = ' '+raw+' ';
  const e = {};
  const tr = parseTimeRange(t);
  if(tr){ e.start=tr.start; e.end=tr.end; e.mins=tr.mins; t=t.replace(tr.match,' '); }
  let m;
  if((m=t.match(/\b(\d+)\s*(sets?|settu)\b/))){ e.sets=+m[1]; t=t.replace(m[0],' '); }
  if((m=t.match(/\b(\d+)\s*(reps?|repetitions?|times|thadava|thadavai|count)\b/))){ e.reps=+m[1]; t=t.replace(m[0],' '); }
  if((m=t.match(/\b(\d+(?:\.\d+)?)\s*(kg|kgs|kilo|kilos)\b/))){ e.kg=+m[1]; t=t.replace(m[0],' '); }
  if((m=t.match(/\b(\d+(?:\.\d+)?)\s*(km|kms|kilometers?|kilometres?)\b/))){ e.km=+m[1]; t=t.replace(m[0],' '); }
  if((m=t.match(/\b(\d+)\s*(min|mins|minutes?|nimisham|nimisam|nimidam)\b/))){ e.mins=+m[1]; t=t.replace(m[0],' '); }
  if((m=t.match(/\b(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|mani neram|mani)\b/))){ e.mins=Math.round(+m[1]*60); t=t.replace(m[0],' '); }
  if((m=t.match(/\b(\d+(?:\.\d+)?)\s*(litres?|liters?|ltrs?|l)\b/))){ e.litres=+m[1]; t=t.replace(m[0],' '); }

  if((m=t.match(/\b(?:odometer|odo|meter reading|km reading|reading)\s*(?:is|la|=|:)?\s*(\d{3,7})\b/))){ e.odo=+m[1]; t=t.replace(m[0],' '); }
  // amount
  let amount=null;
  if((m=t.match(/\b(\d+(?:\.\d+)?)\s*(rs|rupees?|ruba|rubai|ruva|rupa|roobai|bucks|ruvaa)\b/))) amount=+m[1];
  else {
    const nums=(t.match(/\b\d+(?:\.\d+)?\b/g)||[]).map(Number);
    if(nums.length) amount=Math.max(...nums);
  }

  const pain=PAIN.test(raw), tired=TIRED.test(raw), happy=HAPPY.test(raw);
  const feeling = pain?'sore':tired?'tired':happy?'happy':null;

  const ex = EXERCISES.find(([r])=>r.test(raw));
  const act = ACTIVITIES.find(([r])=>r.test(raw));
  const ecat = EXPENSE_CATS.find(([,r])=>r.test(raw));
  const hasCurrency = CURRENCY.test(raw);

  if(ex || e.sets || e.reps){
    return clean({type:'workout', cat:'Workout', exercise: ex?ex[1]:'Workout', sets:e.sets, reps:e.reps, kg:e.kg, mins:e.mins, start:e.start, end:e.end, feeling});
  }
  if(act && !(hasCurrency && amount)){
    return clean({type:'activity', cat:act[1], item:act[1], mins:e.mins, start:e.start, end:e.end, km:e.km, feeling});
  }
  if(amount!=null && (ecat || hasCurrency || SPEND_VERB.test(raw))){
    const cat = ecat?ecat[0]:'Other';
    let item = null;
    if(ecat){ const w = raw.match(ecat[1])[0].trim(); item = ITEM_NAMES[w] || (w[0].toUpperCase()+w.slice(1)); }
    const veh = cat==='Fuel' ? (vehicleWord(raw) || (member&&member.vehicle!=='none'?member.vehicle:null)) : null;
    return clean({type:'expense', cat, item, amount, vehicle:veh, litres:e.litres, odo:e.odo, feeling});
  }
  if(feeling) return clean({type:'mood', cat:'Mood', feeling});
  return null;
}

function clean(o){ for(const k in o) if(o[k]==null) delete o[k]; return o; }

function ruleParse(text, member){
  const t = prep(text);
  const out=[];
  for(const c of splitClauses(t)){
    const r = parseClause(c, member);
    if(!r) continue;
    // a lone feeling right after a workout/activity belongs to it
    const prev = out[out.length-1];
    if(r.type==='mood' && prev && (prev.type==='workout'||prev.type==='activity') && !prev.feeling){ prev.feeling=r.feeling; continue; }
    out.push(r);
  }
  if(!out.length) out.push({type:'note', cat:'Note'});
  return out;
}

const VEH_LABEL={car:'car',scooter:'scooter',bike:'bike'};
function summarize(e){
  const tr = e.start&&e.end ? `${e.start}–${e.end}` : '';
  switch(e.type){
    case 'expense': return [`₹${fmtNum(e.amount)}`, (e.item||e.cat) + (e.vehicle?` (${e.vehicle})`:''), e.litres?`${e.litres} L`:''].filter(Boolean).join(' · ');
    case 'workout': return [e.exercise||'Workout', (e.sets&&e.reps)?`${e.sets}×${e.reps}`:(e.sets?`${e.sets} sets`:(e.reps?`${e.reps} reps`:'')), e.kg?`${e.kg} kg`:'', e.mins?`${e.mins} min`:'', e.feeling?feelLabel(e.feeling):''].filter(Boolean).join(' · ');
    case 'activity': return [e.item||e.cat, tr, e.mins?dur(e.mins):'', e.km?`${e.km} km`:'', e.feeling?feelLabel(e.feeling):''].filter(Boolean).join(' · ');
    case 'mood': return feelLabel(e.feeling);
    default: return 'Note';
  }
}
function dur(m){return m>=90?(Math.round(m/6)/10)+' h':m+' min';}
function feelLabel(f){return ({sore:'sore 🤕',tired:'tired 😴',happy:'happy 😄'})[f]||f;}
function fmtNum(n){ return Number(n).toLocaleString('en-IN'); }

function replyFor(e, member){
  const n = member ? member.name.split(' ')[0] : '';
  switch(e.type){
    case 'expense':
      if(e.cat==='Fuel') return `Done ${n}! ₹${fmtNum(e.amount)} ${e.item?e.item.toLowerCase():'petrol'} for the ${e.vehicle||'vandi'} ⛽`;
      return `Noted — ₹${fmtNum(e.amount)} for ${(e.item||e.cat).toLowerCase()} 🛒`;
    case 'workout': {
      const sr = (e.sets&&e.reps)?`${e.sets}×${e.reps} `:'';
      return `Sema ${n}! ${sr}${e.exercise||'workout'} 💪` + (e.feeling==='sore'?' Vali na growth — stretch pannunga!':'');
    }
    case 'activity':
      if(/Meditation|Yoga/.test(e.cat)) return `${e.mins?e.mins+' min ':''}${e.cat.toLowerCase()} — peaceful start 🧘`;
      if(e.cat==='Sleep') return `Sleep logged ${e.mins?'('+Math.round(e.mins/6)/10+' h)':''} 😴`;
      return `${e.cat} logged${e.mins?' · '+e.mins+' min':''} — nalla irukku! 🚶`;
    case 'mood': return e.feeling==='sore'?`Aiyoo ${n}! Konjam rest edunga 🤕`:e.feeling==='tired'?`Tired-aa? Thanni kudinga, rest edunga 💧`:`Happy vibes noted 😄`;
    default: return `Note pannitten 📝`;
  }
}


// ---- voice corrections ----
const DEL_RE = /\b(delete|remove|cancel|undo|thookku|thooku|thukku|venam|vendam|erase)\b/;
const LAST_RE = /\b(last|previous|adhu|that|andha|kadaisi|recent|it)\b/;
const FIELD_RE = {sets:/\bsets?\b/, reps:/\breps?\b/, mins:/\b(min|mins|minutes?)\b/, kg:/\b(kg|kilo)\b/};
function parseCorrection(text){
  const t = prep(text).trim();
  const words = t.split(' ').length;
  if(DEL_RE.test(t) && (LAST_RE.test(t) || words<=3)) return {action:'delete', hint:hintOf(t)};
  let m = t.match(/(\d+(?:\.\d+)?)\s*(?:rs|rupees?|ruba|sets?|reps?|mins?|kg)?\s*(?:illa|illai|ille|alla|not|no|wrong|thappu)\b[\s,]*(?:it'?s|adhu|correct|actually)?\s*(\d+(?:\.\d+)?)/);
  if(m) return {action:'replace', from:+m[1], to:+m[2], field:fieldOf(t), hint:hintOf(t)};
  m = t.match(/\b(?:not|alla)\s+(\d+(?:\.\d+)?)\s*,?\s*(\d+(?:\.\d+)?)/);
  if(m) return {action:'replace', from:+m[1], to:+m[2], field:fieldOf(t), hint:hintOf(t)};
  m = t.match(/\b(?:change|correct|edit|update|maathu|mathu|make|fix)\b.*?(?:to|as|=|ah|aa)?\s*(\d+(?:\.\d+)?)\s*\D*$/);
  if(m) return {action:'replace', from:null, to:+m[1], field:fieldOf(t), hint:hintOf(t)};
  m = t.match(/\b(?:wrong|thappu|mistake)\b.*?(\d+(?:\.\d+)?)/);
  if(m) return {action:'replace', from:null, to:+m[1], field:fieldOf(t), hint:hintOf(t)};
  return null;
}
function fieldOf(t){ for(const k in FIELD_RE) if(FIELD_RE[k].test(t)) return k; return null; }
function hintOf(t){
  const ex = EXERCISES.find(([r])=>r.test(t)); if(ex && ex[1]!=='Workout') return {exercise:ex[1]};
  const c = EXPENSE_CATS.find(([,r])=>r.test(t));
  if(c){ const w=t.match(c[1])[0].trim(); return {cat:c[0], item:ITEM_NAMES[w]||(w[0].toUpperCase()+w.slice(1))}; }
  const a = ACTIVITIES.find(([r])=>r.test(t)); if(a) return {cat:a[1]};
  return null;
}
// apply a correction to a list of entries (newest last). returns {entry, field, old} or null
function applyCorrection(c, entries){
  const pool = entries.slice().sort((a,b)=>b.ts-a.ts).slice(0,30);
  const matchHint = e => !c.hint || (c.hint.exercise ? e.exercise===c.hint.exercise : c.hint.item ? (e.item===c.hint.item || (e.cat===c.hint.cat && e.type==='expense')) : e.cat===c.hint.cat);
  const primary = e => e.type==='expense'?'amount': e.type==='workout'?(e.reps!=null?'reps':'sets'): e.mins!=null?'mins':null;
  for(const e of pool){
    if(!matchHint(e)) continue;
    if(c.action==='delete') return {entry:e, action:'delete'};
    let field = c.field && e[c.field]!=null ? c.field : null;
    if(!field && c.from!=null){ field = ['amount','reps','sets','mins','kg','km'].find(k=>e[k]===c.from) || null; }
    if(!field && c.from==null) field = primary(e);
    if(!field) continue;
    return {entry:e, action:'replace', field, old:e[field], to:c.to};
  }
  return null;
}
if(typeof module!=='undefined') module.exports={ruleParse,summarize,replyFor,prep,parseCorrection,applyCorrection};
