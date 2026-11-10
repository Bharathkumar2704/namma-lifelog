// ---- Platform layer: Android (Capacitor) or web preview (Claude artifact / browser) ----
const Platform = (function(){
  const cap = window.Capacitor;
  const isNative = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const plug = n => isNative ? ((cap.Plugins && cap.Plugins[n]) || (cap.registerPlugin && cap.registerPlugin(n))) : null;
  const P = { isNative, voiceKind:'none', canNotify:isNative };
  const KEY = 'nammaLifeLog.v2';

  /* ---------- storage ---------- */
  let db=null, base=null, chain=Promise.resolve();
  const q = fn => (chain = chain.then(fn).catch(e=>console.warn('save',e)));
  P.load = async function(){
    let local=null;
    try{ const j=localStorage.getItem(KEY); if(j) local=JSON.parse(j); }catch(e){}
    if(isNative){
      try{ const r = await plug('Preferences').get({key:KEY}); if(r && r.value) return JSON.parse(r.value); }catch(e){}
      return local;
    }
    // Claude artifact db (private per user)
    if(window.claude && window.claude.use){
      try{
        const use = n => window.claude.use(n).catch(()=>null);
        const [dbx,userx] = await Promise.all([use('db'),use('user')]);
        if(dbx && userx){
          const id = await userx.id();
          if(id){
            base='data/users/'+id;
            const tmo = pr => Promise.race([pr, new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),10000))]);
            const snap = await tmo(dbx.doc(base+'/lifelog').get());
            db = dbx; P.synced = true;
            const v = snap && (typeof snap.data==='function' ? snap.data() : (snap.data ?? snap));
            if(v && v.json) return JSON.parse(v.json);
            // migrate from the first version (meta + e_* docs)
            try{
              const cs = await tmo(dbx.collection(base).get());
              let arr = cs && (cs.docs || (Array.isArray(cs)?cs:null)); if(!arr && cs && typeof cs==='object') arr = Object.keys(cs).map(k=>({id:k,data:cs[k]}));
              const docs=(arr||[]).map(d=>({id:String(d.id ?? (d.ref&&d.ref.id) ?? (d.path||'')).split('/').pop(), data: typeof d.data==='function'?d.data():(d.data??d)}));
              const meta=docs.find(d=>d.id==='meta'); const ents=docs.filter(d=>/^e_/.test(d.id)).map(d=>d.data);
              if(meta && meta.data && meta.data.members && meta.data.members.length) return {members:meta.data.members, entries:ents, settings:{active:(meta.data.settings||{}).active}};
            }catch(e){}
          }
        }
      }catch(e){ console.warn(e); }
    }
    return local;
  };
  let saveT=null;
  P.save = function(state){
    const json = JSON.stringify(state);
    try{ localStorage.setItem(KEY, json); }catch(e){}
    clearTimeout(saveT);
    saveT = setTimeout(()=>{
      if(isNative) q(()=>plug('Preferences').set({key:KEY, value:json}));
      else if(db) q(()=>db.doc(base+'/lifelog').set({json, at:Date.now()}));
    }, 400);
  };

  /* ---------- voice ---------- */
  let dict=null, webSR=null, dcur=null;
  P.initVoice = async function(){
    if(isNative){
      const SR = plug('SpeechRecognition');
      try{ const a = await SR.available(); if(a && a.available){ P.voiceKind='native'; } }catch(e){}
      return P.voiceKind;
    }
    if(window.claude && window.claude.use){
      try{ dict = await window.claude.use('dictation'); }catch(e){}
      if(dict){
        P.voiceKind='dictation';
        dict.onPartial(({text})=>dcur && dcur.partial(text));
        dict.onFinal(({text})=>dcur && dcur.final(text));
        dict.onState(({state})=>dcur && dcur.state(state));
        return P.voiceKind;
      }
    }
    const W = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(W){ webSR = W; P.voiceKind='web'; }
    return P.voiceKind;
  };
  // listen once: calls onPartial(text), resolves final text ('' if nothing)
  let stopper=null;
  P.listen = function(onPartial, onState){
    if(stopper){ stopper(); return Promise.resolve(null); }
    return new Promise((resolve)=>{
      let text='', done=false, idle=null, hard=null;
      const finish = (val)=>{ if(done) return; done=true; clearTimeout(idle); clearTimeout(hard); stopper=null; onState && onState('idle'); resolve(val!=null?val:text); };
      hard = setTimeout(()=>stopper && stopper(), 20000);
      onState && onState('listening');
      if(P.voiceKind==='native'){
        const SR = plug('SpeechRecognition'); const subs=[];
        const cleanup = ()=>subs.forEach(s=>{ try{ s.then? s.then(h=>h.remove()) : s.remove(); }catch(e){} });
        stopper = ()=>{ SR.stop().catch(()=>{}); setTimeout(()=>{ cleanup(); finish(); }, 700); };
        (async()=>{
          try{
            const perm = await SR.checkPermissions().catch(()=>null);
            if(!perm || perm.speechRecognition!=='granted'){
              const r = await SR.requestPermissions(); if(r.speechRecognition!=='granted'){ finish(''); P.lastError='Mic permission denied'; return; }
            }
            subs.push(SR.addListener('partialResults', d=>{ const t=(d.matches&&d.matches[0])||d.value||''; if(t){ text=t; onPartial && onPartial(t); } }));
            subs.push(SR.addListener('listeningState', d=>{ if(d.status==='stopped'){ setTimeout(()=>{ cleanup(); finish(); }, 350); } }));
            const r = await SR.start({language:'en-IN', maxResults:1, partialResults:true, popup:false});
            if(r && r.matches && r.matches[0]){ text=r.matches[0]; cleanup(); finish(); }
          }catch(e){ P.lastError = (e && e.message) || 'Voice error'; cleanup(); finish(); }
        })();
        return;
      }
      if(P.voiceKind==='dictation'){
        const parts=[];
        const flush = ()=>{ dict.stop().catch(()=>{}); finish(parts.join(' ').trim() || text); };
        stopper = flush;
        dcur = {
          partial:t=>{ text=(parts.join(' ')+' '+t).trim(); onPartial && onPartial(text); clearTimeout(idle); },
          final:t=>{ if(t) parts.push(t); text=parts.join(' '); onPartial && onPartial(text); clearTimeout(idle); idle=setTimeout(flush, 1400); },
          state:s=>{ if(s==='idle' && !done){ dcur=null; finish(parts.join(' ').trim()||text); } }
        };
        dict.start().catch(e=>{ P.lastError = e && e.code==='not_granted' ? 'Mic permission declined' : 'Could not start mic'; dcur=null; finish(''); });
        return;
      }
      if(P.voiceKind==='web'){
        const r = new webSR(); r.lang='en-IN'; r.interimResults=true; r.continuous=false;
        stopper = ()=>{ try{ r.stop(); }catch(e){} };
        r.onresult = ev=>{ let s=''; for(const res of ev.results) s+=res[0].transcript; text=s; onPartial && onPartial(s); };
        r.onerror = ev=>{ P.lastError = ev.error; };
        r.onend = ()=>finish();
        try{ r.start(); }catch(e){ finish(''); }
        return;
      }
      finish('');
    });
  };
  P.stopListening = ()=>{ if(stopper) stopper(); };

  /* ---------- notifications ---------- */
  const LN = ()=>plug('LocalNotifications');
  P.notifyPermission = async function(ask){
    if(!isNative) return 'unsupported';
    try{
      let p = await LN().checkPermissions();
      if(p.display!=='granted' && ask) p = await LN().requestPermissions();
      return p.display;
    }catch(e){ return 'error'; }
  };
  P.exactAlarmStatus = async function(){
    if(!isNative) return 'unsupported';
    try{ const r = await LN().checkExactNotificationSetting(); return r.exact_alarm; }catch(e){ return 'granted'; }
  };
  P.openExactAlarmSettings = async function(){ try{ await LN().changeExactNotificationSetting(); }catch(e){} };
  let channelMade=false;
  async function channel(){
    if(channelMade) return; channelMade=true;
    try{ await LN().createChannel({id:'reminders', name:'Reminders', description:'Daily reminders and alerts', importance:5, vibration:true}); }catch(e){}
  }
  // reminders: [{id:int, hour, minute, title, body}]
  P.scheduleDaily = async function(list){
    if(!isNative) return false;
    try{
      await channel();
      const pend = await LN().getPending();
      const ours = (pend.notifications||[]).filter(n=>n.id>=1000 && n.id<3000).map(n=>({id:n.id}));
      if(ours.length) await LN().cancel({notifications:ours});
      if(!list.length) return true;
      await LN().schedule({notifications: list.map(r=>({
        id:r.id, title:r.title, body:r.body, channelId:'reminders', smallIcon:'ic_stat_notify',
        schedule:{on:{hour:r.hour, minute:r.minute}, allowWhileIdle:true},
        extra:{route:'quick'}
      }))});
      return true;
    }catch(e){ console.warn(e); return false; }
  };
  P.notifyNow = async function(title, body){
    if(!isNative) return;
    try{ await channel(); await LN().schedule({notifications:[{id:3000+Math.floor(Math.random()*5000), title, body, channelId:'reminders', smallIcon:'ic_stat_notify', schedule:{at:new Date(Date.now()+800), allowWhileIdle:true}}]}); }catch(e){ console.warn(e); }
  };

  /* ---------- launch from widget / notification ---------- */
  P.onQuickLaunch = function(cb){
    if(!isNative) { const m = location.hash.match(/^#quick-(voice|type)$/); if(m) setTimeout(()=>cb(m[1]),300); return; }
    const App = plug('App');
    const handle = url => { if(!url) return; const m = String(url).match(/quick\?mode=(voice|type)/); if(m) cb(m[1]); };
    App.getLaunchUrl().then(r=>handle(r && r.url)).catch(()=>{});
    App.addListener('appUrlOpen', d=>handle(d.url));
    try{ LN().addListener('localNotificationActionPerformed', ()=>cb('voice')); }catch(e){}
  };
  P.minimize = function(){ if(isNative){ try{ plug('App').minimizeApp(); }catch(e){} } };
  P.haptic = function(){ if(isNative){ try{ plug('Haptics').impact({style:'LIGHT'}); }catch(e){} } };

  /* ---------- Claude (web preview only) ---------- */
  P.sample = async function(){ if(isNative || !(window.claude&&window.claude.use)) return null; try{ return await window.claude.use('sample'); }catch(e){ return null; } };
  return P;
})();
