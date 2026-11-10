// ---- Namma Veedu: family scene (SVG) ----
const OUTFITS = [
  {id:'classic', name:'Classic', icon:'👕', need:null},
  {id:'gymvest', name:'Gym vest', icon:'🎽', need:{kind:'workouts', n:10}, shirt:'#1F2937', sleeveless:true, trim:'#F59E0B'},
  {id:'sports',  name:'Sports jersey', icon:'🏃', need:{kind:'moves', n:15}, shirt:'#0F766E', number:true},
  {id:'silk',    name:'Silk (pattu)', icon:'✨', need:{kind:'medStreak', n:7}, shirt:'#B45309', trim:'#FCD34D'},
  {id:'royal',   name:'Royal', icon:'👑', need:{kind:'workouts', n:50}, shirt:'#6D28D9', trim:'#FCD34D', crown:true},
];
const VCOLORS = [
  {id:'red', name:'Kumkum red', c:'#C2410C', need:null},
  {id:'pink', name:'Rose pink', c:'#DB2777', need:null},
  {id:'blue', name:'Ocean blue', c:'#1D4ED8', need:{kind:'fuels', n:5}},
  {id:'green', name:'Leaf green', c:'#15803D', need:{kind:'logStreak', n:7}},
  {id:'gold', name:'Gold', c:'#CA8A04', need:{kind:'underBudget', n:1}},
];
const SKINS = ['#E0A872','#C68642','#8D5524'];

function skyFor(h){
  if(h<5 || h>=22) return {phase:'night', a:'#0F1A33', b:'#2B2F55', hill:'#3E5446', ground:'#5B5140', lit:true, stars:true};
  if(h<7)  return {phase:'dawn',  a:'#F9A86B', b:'#FFE6C7', hill:'#9FC59A', ground:'#E2C9A3'};
  if(h<17) return {phase:'day',   a:'#8FD0F2', b:'#E6F6FD', hill:'#A8D5A0', ground:'#E6D0AE'};
  if(h<19) return {phase:'dusk',  a:'#F38E5E', b:'#FBD3A0', hill:'#93B98D', ground:'#D9BE97', lit:true};
  return {phase:'evening', a:'#27325F', b:'#7B5C8E', hill:'#4F6A57', ground:'#7A6A55', lit:true, stars:true};
}

function charSVG(m, o){
  const out = OUTFITS.find(x=>x.id===m.outfit) || OUTFITS[0];
  const shirt = out.shirt || m.color;
  const sleeve = out.sleeveless ? 'var(--skin)' : 'var(--shirt)';
  const f = m.gender==='female';
  const trim = out.trim ? (f ? `<path d="M-30 122 Q0 130 30 122" stroke="${out.trim}" stroke-width="4" fill="none"/>` : `<rect x="-21" y="108" width="42" height="5" fill="${out.trim}"/>`) : '';
  const number = out.number ? `<text x="0" y="98" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">7</text>` : '';
  const crown = out.crown ? `<path d="M-12 18 L-12 6 L-6 12 L0 3 L6 12 L12 6 L12 18Z" fill="#FCD34D" stroke="#B45309" stroke-width="1"/>` : '';
  const torso = f
    ? `<path d="M-19 60 H19 Q23 60 24 66 L30 124 Q0 132 -30 124 L-24 66 Q-23 60 -19 60Z" fill="var(--shirt)"/><path d="M-17 62 L24 118" stroke="${out.trim||'#F59E0B'}" stroke-width="6" stroke-linecap="round" opacity=".85"/>`
    : `<rect x="-21" y="60" width="42" height="58" rx="11" fill="var(--shirt)"/><path d="M-8 60 L0 70 L8 60" fill="none" stroke="#ffffff88" stroke-width="2"/>`;
  const hairBack = f ? `<path d="M-23 40 Q-25 12 0 14 Q25 12 23 40 L25 76 Q0 84 -25 76Z" fill="var(--hair)"/>` : '';
  const hairTop = f
    ? `<path d="M-20 36 Q-19 17 0 17 Q19 17 20 36 Q12 24 0 25 Q-12 24 -20 36Z" fill="var(--hair)"/><g><circle cx="20" cy="22" r="3" fill="#fff"/><circle cx="23" cy="27" r="3" fill="#fff"/><circle cx="24" cy="33" r="3" fill="#fff"/><circle cx="0" cy="29" r="1.8" fill="#C2410C"/></g>`
    : `<path d="M-20 36 Q-22 15 0 15 Q22 15 20 36 Q17 25 0 25 Q-15 25 -20 36Z" fill="var(--hair)"/>`;
  const stache = f ? '' : `<path d="M-9 45 Q-4 41.5 0 43.5 Q4 41.5 9 45 Q4 46.8 0 45.6 Q-4 46.8 -9 45Z" fill="var(--hair)"/>`;
  const arm = (side,x)=>`<g transform="translate(${x},64)"><g class="arm arm${side}"><g class="upper">
      <rect x="-5" y="0" width="10" height="29" rx="5" fill="${sleeve}"/>
      <g class="fore"><rect x="-4.5" y="24" width="9" height="27" rx="4.5" fill="var(--skin)"/>
        <g class="db"><rect x="-11" y="48" width="22" height="4" rx="2" fill="#4b4b4b"/><rect x="-14" y="44" width="6" height="12" rx="2" fill="#2A1A10"/><rect x="8" y="44" width="6" height="12" rx="2" fill="#2A1A10"/></g>
        ${side==='R'?`<g class="itemg"><text class="itemIcon" x="0" y="72" text-anchor="middle" font-size="22">${o.item||'🛍️'}</text></g>`:''}
      </g></g></g></g>`;
  const flame = o.streak>=3 ? `<g class="flame lvl${o.streak>=30?3:o.streak>=7?2:1}" transform="translate(36,30)"><path d="M0 -18 C8 -8 10 -2 6 4 C4 8 -4 8 -6 4 C-10 -2 -6 -8 0 -18Z" fill="#F97316"/><path d="M0 -8 C4 -3 4 1 2 4 C0 6 -2 5 -3 3 C-4 0 -2 -4 0 -8Z" fill="#FDE047"/><text x="0" y="20" text-anchor="middle" font-size="11" font-weight="800" fill="#7C2D12">${o.streak}</text></g>` : '';
  return `
  <g class="body">
    <circle class="aura" cx="0" cy="96" r="62" fill="#FBBF24" opacity="0"/>
    ${hairBack}
    <g class="legs-stand">
      <g transform="translate(-9,114)"><g class="leg legL"><rect x="-6" y="0" width="12" height="44" rx="6" fill="#3B2F2A"/><ellipse cx="-2" cy="45" rx="9" ry="4" fill="#2A1A10"/></g></g>
      <g transform="translate(9,114)"><g class="leg legR"><rect x="-6" y="0" width="12" height="44" rx="6" fill="#3B2F2A"/><ellipse cx="2" cy="45" rx="9" ry="4" fill="#2A1A10"/></g></g>
    </g>
    <g class="legs-cross"><ellipse cx="0" cy="124" rx="36" ry="11" fill="#3B2F2A"/><ellipse cx="-24" cy="128" rx="8" ry="4" fill="var(--skin)"/><ellipse cx="24" cy="128" rx="8" ry="4" fill="var(--skin)"/></g>
    ${torso}${trim}${number}
    <rect x="-6" y="52" width="12" height="12" rx="4" fill="var(--skin)"/>
    <circle cx="0" cy="38" r="20" fill="var(--skin)"/>
    <circle cx="-20" cy="40" r="4" fill="var(--skin)"/><circle cx="20" cy="40" r="4" fill="var(--skin)"/>
    ${hairTop}${crown}
    <g class="eyes-open"><circle cx="-7" cy="37" r="2.3" fill="#2A1A10"/><circle cx="7" cy="37" r="2.3" fill="#2A1A10"/></g>
    <g class="eyes-closed" stroke="#2A1A10" stroke-width="2" stroke-linecap="round" fill="none"><path d="M-10 38 q3 3 6 0"/><path d="M4 38 q3 3 6 0"/></g>
    ${stache}
    <path class="smile" d="M-6 48 Q0 53 6 48" stroke="#7c2d12" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path class="frown" d="M-6 51 Q0 46 6 51" stroke="#7c2d12" stroke-width="2" fill="none" stroke-linecap="round"/>
    <ellipse class="shock" cx="0" cy="50" rx="3.5" ry="4.5" fill="#7c2d12"/>
    <g class="sweat" fill="#7CC4F0"><path d="M22 22 q-4 6 0 8 q4 -2 0 -8z"/><path d="M-24 28 q-3 5 0 7 q3 -2 0 -7z"/></g>
    ${arm('L',-24)}${arm('R',24)}
  </g>
  <g class="bed">
    <rect x="-46" y="132" width="92" height="22" rx="4" fill="#8B5E3C"/><rect x="-46" y="150" width="6" height="12" fill="#6B4429"/><rect x="40" y="150" width="6" height="12" fill="#6B4429"/>
    <rect x="-48" y="112" width="8" height="40" rx="3" fill="#6B4429"/>
    <ellipse cx="-28" cy="128" rx="14" ry="7" fill="#FFF"/>
    <circle cx="-28" cy="120" r="12" fill="var(--skin)"/>
    <path d="M-40 118 Q-39 106 -28 107 Q-17 106 -16 118 Q-22 112 -28 112 Q-34 112 -40 118Z" fill="var(--hair)"/>
    <path d="M-34 121 q3 2 5 0 M-26 121 q3 2 5 0" stroke="#2A1A10" stroke-width="1.6" fill="none"/>
    <path d="M-18 116 Q10 108 44 118 L44 136 L-18 136Z" fill="var(--shirt)"/><path d="M-18 116 Q10 108 44 118" stroke="#ffffff66" stroke-width="3" fill="none"/>
  </g>
  <g class="zz" font-size="13" font-weight="800" fill="#E9E3F5"><text x="-14" y="100">z</text><text x="-6" y="88">Z</text></g>
  ${flame}`;
}

function vehSVG(type, color){
  const w = `<circle r="12" fill="#2A1A10"/><circle r="5" fill="#CBB9A8"/><path d="M0 -10 V10 M-10 0 H10" stroke="#6b5240" stroke-width="2"/>`;
  if(type==='car') return `<path d="M0 -14 H112 Q120 -14 120 -22 V-30 Q120 -36 112 -37 L90 -40 L74 -57 Q70 -61 62 -61 H32 Q24 -61 20 -55 L10 -40 Q0 -39 0 -30Z" fill="${color}"/>
    <path d="M28 -42 L37 -55 H57 V-42Z" fill="#CFE8F5"/><path d="M62 -42 V-55 H68 Q72 -55 74 -51 L81 -42Z" fill="#CFE8F5"/>
    <rect class="hl" x="110" y="-34" width="8" height="5" rx="2" fill="#FFF3B0"/><rect x="2" y="-30" width="6" height="5" rx="2" fill="#B91C1C"/>
    <g transform="translate(28,-12)"><g class="wheel">${w}</g></g><g transform="translate(94,-12)"><g class="wheel">${w}</g></g>`;
  if(type==='scooter') return `<path d="M8 -14 Q8 -34 32 -36 H58 L64 -22 H86 Q94 -22 94 -12 H8Z" fill="${color}"/>
    <rect x="26" y="-44" width="32" height="8" rx="4" fill="#2A1A10"/><path d="M84 -22 L74 -62" stroke="#6b5240" stroke-width="5" stroke-linecap="round"/>
    <path d="M66 -64 H84" stroke="#2A1A10" stroke-width="5" stroke-linecap="round"/><circle class="hl" cx="80" cy="-56" r="4" fill="#FFF3B0"/>
    <g transform="translate(20,-10) scale(.85)"><g class="wheel">${w}</g></g><g transform="translate(84,-10) scale(.85)"><g class="wheel">${w}</g></g>`;
  if(type==='bike') return `<path d="M22 -14 L40 -34 H66 L84 -14Z" fill="${color}"/><path d="M34 -40 H60 Q66 -40 64 -34 H38Z" fill="#2A1A10"/>
    <path d="M84 -14 L76 -56" stroke="#6b5240" stroke-width="4" stroke-linecap="round"/><path d="M68 -58 H84" stroke="#2A1A10" stroke-width="5" stroke-linecap="round"/>
    <circle class="hl" cx="82" cy="-48" r="5" fill="#FFF3B0"/>
    <g transform="translate(16,-13)"><g class="wheel"><circle r="13" fill="none" stroke="#2A1A10" stroke-width="5"/><path d="M0 -11 V11 M-11 0 H11" stroke="#6b5240" stroke-width="2"/></g></g>
    <g transform="translate(90,-13)"><g class="wheel"><circle r="13" fill="none" stroke="#2A1A10" stroke-width="5"/><path d="M0 -11 V11 M-11 0 H11" stroke="#6b5240" stroke-width="2"/></g></g>`;
  return '';
}

const SLOT = 118, HOUSE_W = 150, SCENE_H = 300;
function sceneWidth(n){ return Math.max(390, HOUSE_W + SLOT*Math.max(n,1) + 20); }
function slotX(i){ return HOUSE_W + SLOT*i + SLOT/2; }

// members: [{m, pose, item, streak, asleep, shocked}]
function sceneSVG(list, hour){
  const sky = skyFor(hour);
  const W = sceneWidth(list.length);
  const sunT = Math.min(1, Math.max(0, (hour-5)/14));
  const sunX = 30 + sunT*(W-60), sunY = 120 - Math.sin(sunT*Math.PI)*90;
  const celestial = (sky.phase==='night'||sky.phase==='evening')
    ? `<circle cx="${W-60}" cy="46" r="16" fill="#F3F0D7"/><circle cx="${W-53}" cy="41" r="14" fill="${sky.a}"/>`
    : `<circle class="sun" cx="${sunX}" cy="${sunY}" r="20" fill="${sky.phase==='day'?'#FBBF24':'#FB923C'}"/>`;
  let stars=''; if(sky.stars) for(let i=0;i<Math.floor(W/30);i++){ const x=(i*97)%W, y=10+((i*53)%90); stars+=`<circle class="star" style="animation-delay:${(i%5)*.4}s" cx="${x}" cy="${y}" r="${i%3?1:1.6}" fill="#fff"/>`; }
  const win = sky.lit ? '#FDE68A' : '#CFE8F5';
  const house = `
    <g transform="translate(14,96)">
      <rect x="6" y="54" width="118" height="92" fill="#F4E4C9"/>
      <path d="M-6 58 L65 4 L136 58Z" fill="#B4532A"/><path d="M-6 58 L136 58" stroke="#7C2D12" stroke-width="5"/>
      <g stroke="#9A3412" stroke-width="1.5" opacity=".7"><path d="M20 46 L110 46"/><path d="M36 34 L94 34"/><path d="M52 22 L78 22"/></g>
      <rect x="50" y="84" width="30" height="62" rx="2" fill="#7C4A2D"/><circle cx="74" cy="116" r="2" fill="#FCD34D"/>
      <path d="M46 84 H84" stroke="#2F855A" stroke-width="4"/><g fill="#F59E0B"><circle cx="50" cy="88" r="2.5"/><circle cx="58" cy="89" r="2.5"/><circle cx="66" cy="89" r="2.5"/><circle cx="74" cy="89" r="2.5"/><circle cx="82" cy="88" r="2.5"/></g>
      <rect x="16" y="78" width="24" height="24" rx="2" fill="${win}" stroke="#7C4A2D" stroke-width="3"/><path d="M28 78 V102 M16 90 H40" stroke="#7C4A2D" stroke-width="2"/>
      <rect x="90" y="78" width="24" height="24" rx="2" fill="${win}" stroke="#7C4A2D" stroke-width="3"/><path d="M102 78 V102 M90 90 H114" stroke="#7C4A2D" stroke-width="2"/>
      <rect x="0" y="140" width="130" height="8" fill="#D6C2A3"/>
      <text x="65" y="74" text-anchor="middle" font-size="10" font-weight="800" fill="#7C2D12">நம்ம வீடு</text>
    </g>
    <g transform="translate(79,250)" stroke="#fff" stroke-width="1.6" fill="none" opacity=".9">
      <path d="M-14 0 Q0 -10 14 0 Q0 10 -14 0Z"/><path d="M0 -12 Q10 0 0 12 Q-10 0 0 -12Z"/><circle r="2" fill="#fff"/>
      <g fill="#fff" stroke="none"><circle cx="-20" r="1.5"/><circle cx="20" r="1.5"/><circle cy="-16" r="1.5"/><circle cy="16" r="1.5"/></g>
    </g>`;
  const lamp = `<g transform="translate(${W-24},158)"><rect x="-2" y="0" width="4" height="86" fill="#3F3F46"/><path d="M-2 2 Q-2 -6 -14 -6" stroke="#3F3F46" stroke-width="4" fill="none"/><circle cx="-14" cy="-2" r="5" fill="${sky.lit?'#FDE68A':'#A1A1AA'}"/>${sky.lit?`<path d="M-14 0 L-40 86 H12Z" fill="#FDE68A" opacity=".18"/>`:''}</g>`;
  const trees = `<g fill="#2F855A" opacity=".9"><path d="M${W-70} 210 q3 -60 6 0z" fill="#8B5E3C"/><g transform="translate(${W-67},150)"><path d="M0 0 q-24 -4 -30 10 q14 -10 30 -10z"/><path d="M0 0 q24 -4 30 10 q-14 -10 -30 -10z"/><path d="M0 0 q-14 -16 -26 -14 q16 0 26 14z"/><path d="M0 0 q14 -16 26 -14 q-16 0 -26 14z"/></g></g>`;
  let mems='';
  list.forEach((it,i)=>{
    const x = slotX(i), m = it.m;
    const vc = (VCOLORS.find(v=>v.id===m.vehColor)||VCOLORS[m.gender==='female'?1:0]).c;
    const veh = m.vehicle && m.vehicle!=='none' ? `<g class="veh" transform="translate(${x-34},292) scale(.56)"><g class="veh-move">${vehSVG(m.vehicle, vc)}</g><g class="pump" transform="translate(132,-64)"><rect width="22" height="60" rx="4" fill="#C2410C"/><rect x="4" y="6" width="14" height="10" rx="2" fill="#FFF4E2"/><path d="M0 26 q-12 0 -12 12" stroke="#2A1A10" stroke-width="3" fill="none"/><path class="drop" d="M-12 42 q-3 5 0 7 q3 -2 0 -7z" fill="#F59E0B"/></g></g>` : '';
    mems += `<g class="mem${it.asleep?' asleep':''}${it.shocked?' shocked':''}" data-id="${m.id}" data-anim="${it.pose||''}" style="--shirt:${(OUTFITS.find(o=>o.id===m.outfit)||{}).shirt||m.color};--skin:${m.skin||SKINS[1]};--hair:#1F140D">
      ${veh}
      <g transform="translate(${x},${240-160*.62}) scale(.62)"><g class="char-move"><g class="char">${charSVG(m,it)}</g></g></g>
      <g class="tag" transform="translate(${x},${240-160*.62-16})"><rect x="${-(m.name.length*3.6+10)}" y="-11" width="${m.name.length*7.2+20}" height="17" rx="8.5" fill="#ffffffcc"/><text y="2" text-anchor="middle" font-size="11" font-weight="700" fill="#2A1A10">${escX(m.name.split(' ')[0])}</text></g>
    </g>`;
  });
  return `<svg id="scene" class="ph-${sky.phase}" viewBox="0 0 ${W} ${SCENE_H}" width="${W}" height="${SCENE_H}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky.a}"/><stop offset="1" stop-color="${sky.b}"/></linearGradient></defs>
    <rect width="${W}" height="${SCENE_H}" fill="url(#skyG)"/>${stars}${celestial}
    <path d="M0 200 Q${W*.18} 150 ${W*.36} 190 T${W*.72} 182 T${W} 172 V300 H0Z" fill="${sky.hill}"/>
    ${trees}
    <rect y="236" width="${W}" height="20" fill="${sky.ground}"/>
    <rect y="256" width="${W}" height="44" fill="#57534E"/><line x1="0" y1="290" x2="${W}" y2="290" stroke="#E7E5E4" stroke-width="3" stroke-dasharray="16 14" opacity=".7"/>
    ${house}${lamp}${mems}
    <text class="pop" id="pop" x="200" y="120" text-anchor="middle" font-size="24" font-weight="800" fill="#2A1A10" stroke="#FFF6E9" stroke-width="4" paint-order="stroke"></text>
  </svg>`;
}
function escX(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]); }
