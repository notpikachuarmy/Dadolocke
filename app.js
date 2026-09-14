const KEY='dadolocke_v3';
const C={regla:['','REGLA'],combate:['','COMBATE'],recursos:['','RECURSOS'],pokemon:['','POKÉMON'],caos:['','CAOS']};
const E={
regla:{positive:[['Libertad','Durante la duración del efecto puedes ignorar un dado negativo.',1],['Segunda oportunidad','Si pierdes un combate y tienes Pokémon vivos, no se pierde el Locke.',1],['Comodín','Puedes guardar este resultado y utilizarlo posteriormente para repetir una tirada de Dadolocke. No puedes repetir una tirada de apuesta.',0]],negative:[['Mano atada','Durante la duración del efecto, el primer turno nunca puede restar vida de forma activa al rival. Casco dentado y similares no aplica.',1],['Rotación','Debes utilizar un Pokémon diferente en cada combate siempre que tengas suficientes Pokémon disponibles. Después de cada combate cambia el Pokémon por el primero de la caja, sacando al que lleve más tiempo en el team.',1],['Prohibición','Elige uno de los seis tipos existentes en tu equipo. Durante la duración del efecto, no puedes utilizar Pokémon de ese tipo.',1],['Sin comodines','Durante la duración del efecto, no puedes utilizar dados positivos.',1]]},
combate:{positive:[['Combate limpio','Durante la duración del efecto puedes utilizar un objeto curativo adicional.',1],['Último esfuerzo','La primera vez que un Pokémon cae debilitado, no muere. Pero no podrá volver a combatir hasta el siguiente combate importante.',0]],negative:[['Sin objetos','Durante la duración del efecto, no puedes utilizar objetos durante el combate.',1],['Sin cambios','Durante la duración, no puedes cambiar voluntariamente de Pokémon durante un combate, salvo que lleve 3 turnos en campo.',1],['Especialista','Durante la duración del efecto, tienes que jugar monotype. Tú eliges el tipo.',1],['Equipo reducido','Durante la duración del efecto, tienes que jugar con 3 Pokémon en tu equipo.',1]]},
recursos:{positive:[['Doble o nada','Cuando el rival use una poción, tú ganas 2.',1],['Poción superior','Cuando el rival use una poción, ahora puedes usar una versión más potente si quisieras.',1]],negative:[['Tienda cerrada','Durante la duración, no puedes comprar objetos.',1],['Sin consumibles','Durante la duración, no puedes utilizar objetos consumibles en combate.',1],['Liquidación','Debes vender la mitad de tus objetos vendibles, redondeando hacia abajo. Si no puedes venderlos, se ignoran esos objetos.',0]]},
pokemon:{positive:[['Segunda oportunidad','En tu próxima ruta puedes ignorar el primer encuentro y capturar el segundo Pokémon que aparezca.',0],['Elección','En tu próxima ruta atrapa los tres primeros Pokémon (ponles el mismo mote) que encuentres, elige el que prefieras y libera el resto.',0],['Arga doctor chambeo','Puedes devolver un Pokémon muerto al equipo. Solo puede utilizarse una vez por Pokémon.',0]],negative:[['Renacimiento','Elige un Pokémon de tu equipo. Vuelve a atrapar algo en la misma ruta con el mismo mote y libéralo.',0],['Mala captura','Solo tienes 3 Poké Balls totales para la próxima captura.',0],['Destierro','Debes elegir un Pokémon del equipo y mandarlo al PC hasta que derrotes al próximo combate importante. No está muerto, simplemente queda temporalmente fuera.',0]]}
};

function load(){try{return JSON.parse(localStorage.getItem(KEY))||{history:[],stats:{normal:{},chaos:{}}}}catch{return{history:[],stats:{normal:{},chaos:{}}}}}
let S=load(),P=null,sound=true,ctx=null,tab='normal';
const r6=()=>Math.floor(Math.random()*6)+1;
function snd(){if(!sound)return;try{ctx??=new(window.AudioContext||window.webkitAudioContext)();let t=ctx.currentTime;for(let i=0;i<4;i++){let o=ctx.createOscillator(),g=ctx.createGain();o.type='triangle';o.frequency.value=180+Math.random()*180;g.gain.setValueAtTime(.001,t+i*.07);g.gain.exponentialRampToValueAtTime(.08,t+i*.07+.01);g.gain.exponentialRampToValueAtTime(.001,t+i*.07+.07);o.connect(g);g.connect(ctx.destination);o.start(t+i*.07);o.stop(t+i*.07+.08)}}catch{}}
function save(){localStorage.setItem(KEY,JSON.stringify(S))}
function dur(){let n=r6();return{roll:n,value:n<3?'1 combate o ruta':n<5?'3 combates o rutas':n===5?'5 combates o rutas':'Hasta el próximo combate importante (líder, rival, ejecutivo o líder villano) o hasta la próxima ciudad'}}
function all(){let a=[];for(let c in E)for(let al of ['positive','negative'])for(let e of E[c][al])a.push({c,al,e});return a}
function begin(){P={phase:'align',steps:[]};S.current=null;save();roll()}
function roll(){
 if(!P)return;snd();let n,x;
 if(P.phase==='align'){n=r6();P.al=n<4?'positive':'negative';P.steps.push({t:'align',n,v:P.al});P.phase='cat'}
 else if(P.phase==='cat'){n=r6();let k=['regla','combate','recursos','pokemon','caos'][n-1];P.cat=k;P.steps.push({t:'cat',n,v:k});P.phase=k==='caos'?'chaosPrompt':'effect'}
 else if(P.phase==='effect'){
   const a=E[P.cat]?.[P.al];
   if(!a || !a.length){
     P.phase='cat';
     save();
     render();
     return;
   }
   P.e=a[Math.floor(Math.random()*a.length)];
   P.steps.push({t:'effect',v:P.e});
   afterEffect();
}
 else if(P.phase==='chaos'){x=all()[Math.floor(Math.random()*all().length)];P.e=x.e;P.cat=x.c;P.al=x.al;P.chaos=true;P.steps.push({t:'chaosResult',v:x});afterEffect()}
 else if(P.phase==='duration'){P.d=dur();P.steps.push({t:'duration',n:P.d.roll,v:P.d.value});afterDuration()}
 else if(P.phase==='gamble'){n=r6();P.g=n;P.gr=n<3?'Pierdes el premio':n<5?'No ocurre nada':'Duplicas la recompensa';P.steps.push({t:'gamble',n,v:P.gr});finish()}
 save();render();
}
function afterEffect(){
  if(P.e[2]) P.phase='duration';
  else if(P.al==='positive' && !P.chaos) P.phase='gamblePrompt';
  else finish();
}
function afterDuration(){
  if(P.al==='positive' && !P.chaos) P.phase='gamblePrompt';
  else finish();
}
function resolveChaos(){
  if(!P || P.phase!=='chaosPrompt') return;
  const pool=all();
  if(!pool.length){
    P=null;
    S.current=null;
    save();
    render();
    return;
  }
  const x=pool[Math.floor(Math.random()*pool.length)];
  P.phase='chaos';
  P.e=x.e;
  P.cat=x.c;
  P.al=x.al;
  P.chaos=true;
  P.steps.push({t:'chaosResult',v:x});
  afterEffect();
  save();
  render();
}
function gamble(v){if(v==='yes'){P.phase='gamble';roll()}else finish()}
function finish(){
 let h={id:Date.now()+Math.random(),date:new Date().toISOString(),done:false,positive:P.al==='positive',category:P.cat,effect:P.e,duration:P.d||null,chaos:!!P.chaos,gamble:P.g||null,gambleResult:P.gr||null,steps:P.steps};
 S.history.unshift(h);let q=h.chaos?'chaos':'normal',name=h.effect[0];S.stats[q][name]=(S.stats[q][name]||0)+1;S.current=h;P=null;save();render();
}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

function current(){
 let st=document.querySelector('#stack'),a=document.querySelector('#actions'),lab=document.querySelector('#stage');a.innerHTML='';
 if(P){
  st.innerHTML=P.steps.map((s,i)=>{
   let t='',v='',ic='',cl='',desc='';
   if(s.t==='align'){t='Destino';v=s.v==='positive'?'POSITIVO':'NEGATIVO';cl=s.v}
   if(s.t==='cat'){t='Tema';v=(C[s.v]?.[1]||s.v)}
   if(s.t==='effect'){t='Resultado';v=s.v[0];desc=s.v[1]}
   if(s.t==='duration'){t='Duración';v=s.v; }
   if(s.t==='chaosResult'){
     t='Resultado de Caos';
     v=(s.v.al==='positive'?'POSITIVO':'NEGATIVO')+' · '+C[s.v.c][1]+' → '+s.v.e[0];
     desc=s.v.e[1];
     cl=s.v.al;
   }
   if(s.t==='gamble'){t='Apuesta';v=s.n+' → '+s.v;cl=s.n>=5?'positive':s.n<=2?'negative':''}
   return `<div class="die-card ${i===P.steps.length-1?'latest':''}">
     <div class="die-icon"></div>
     <div><div class="die-title">${t}</div><div class="die-value ${cl}">${esc(v)}</div>${desc?`<div class="history-details result-inline">${esc(desc)}</div>`:''}</div>
     <div class="die-number">${s.n??''}</div>
   </div>`
  }).join('');

  lab.textContent=P.phase==='gamblePrompt'?'¿Te la juegas?':P.phase==='chaosPrompt'?'Caos listo':'Tirando…';

  if(P.e){
    let desc=`<div class="result-explanation"><strong>¿Qué hace?</strong><span>${esc(P.e[1])}</span></div>`;
    if(P.phase==='duration'){
      a.innerHTML=desc+`<button class="main-btn" onclick="roll()">Tirar duración</button>`;
    } else if(P.phase==='gamblePrompt'){
      a.innerHTML=desc+`<div class="action-card"><strong>¿Te la juegas?</strong><span>El resultado y su duración ya están visibles. Puedes quedarte el premio o arriesgarlo.</span><div class="action-buttons"><button class="btn-muted" onclick="gamble('no')">Quedarme el premio</button><button class="btn-gold" onclick="gamble('yes')">Arriesgar</button></div></div>`;
    } else if(P.phase==='gamble'){
      a.innerHTML=desc;
    } else {
      a.innerHTML=desc+`<button class="main-btn" onclick="roll()">Tirar siguiente dado</button>`;
    }
  } else if(P.phase==='chaosPrompt'){
    a.innerHTML=`<div class="action-card"><strong>CAOS</strong><span>El Caos elegirá un resultado aleatorio entre todas las opciones positivas y negativas.</span><div class="action-buttons"><button class="main-btn" onclick="resolveChaos()">Resolver Caos</button></div></div>`;
  } else if(P.phase==='gamble'){
    a.innerHTML='';
  }
 } else if(S.current){
  let h=S.current;
  st.innerHTML=`<div class="die-card latest">
    <div class="die-icon"></div>
    <div><div class="die-title">Resultado final</div>
      <div class="die-value ${h.positive?'positive':'negative'}">${esc(h.effect[0])}</div>
      <div class="history-details result-inline">${esc(h.effect[1])}</div>
    </div>
    <div class="die-number">${h.chaos?'CAOS':''}</div>
  </div>`;
  a.innerHTML=`<div class="action-card">${h.duration?'<div>Duración: '+esc(h.duration.value)+'</div>':''}${h.gambleResult?'<div>Apuesta: '+esc(h.gambleResult)+'</div>':''}<button class="main-btn" onclick="begin()">Tirar desde 0</button></div>`;
  lab.textContent='Resultado completado';
 }else{
  st.innerHTML='<div class="empty-state"><div class="big-die"></div><p>Los dados aparecerán aquí en orden.</p></div>';
  a.innerHTML='<button class="main-btn" onclick="begin()">Tirar desde 0</button>';lab.textContent='Preparado';
 }
}
function history(){
 let l=document.querySelector('#history'),cnt=document.querySelector('#historyCount');cnt.textContent=S.history.length+' tiradas';
 if(!S.history.length){l.innerHTML='<div class="empty-state compact">Todavía no hay tiradas.</div>';return}
 l.innerHTML=S.history.map((h,i)=>`<article class="history-item"><div class="history-head"><strong>#${S.history.length-i} · ${new Date(h.date).toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'})}</strong><span class="pill ${h.chaos?'chaos':h.positive?'good':'bad'}">${h.chaos?' CAOS':h.positive?' POSITIVO':' NEGATIVO'}</span></div><div class="history-main"><span class="pill">${(C[h.category]?.[0]||'')} ${(C[h.category]?.[1]||h.category||'')}</span><span class="pill">${esc(h.effect[0])}</span>${h.duration?'<span class="pill">⏱ '+esc(h.duration.value)+'</span>':''}${h.gambleResult?'<span class="pill"> '+esc(h.gambleResult)+'</span>':''}</div><div class="history-details">${esc(h.effect[1])}</div><div class="history-actions"><button class="complete-btn ${h.done?'completed':''}" onclick="toggleDone('${h.id}')">${h.done?' Completado':' Marcar completado'}</button><button class="delete-btn" onclick="delH('${h.id}')">Borrar</button></div></article>`).join('')
}
function toggleDone(id){let h=S.history.find(x=>String(x.id)===id);if(h)h.done=!h.done;save();renderHistoryOnly()}
function delH(id){S.history=S.history.filter(x=>String(x.id)!==id);save();render()}
function stats(){document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));let d=S.stats[tab],rows=Object.entries(d).sort((a,b)=>b[1]-a[1]);document.querySelector('#stats').innerHTML=rows.length?'<div class="stat-box"><h3>'+ (tab==='normal'?' Tiradas normales':' Resultados de Caos')+'</h3>'+rows.map(x=>`<div class="stat-row"><span>${esc(x[0])}</span><strong>${x[1]}</strong></div>`).join('')+'</div>':'<div class="empty-state compact">Todavía no hay estadísticas.</div>'}
function renderHistoryOnly(){history();stats()}function render(){current();history();stats()}
document.querySelector('#startBtn').onclick=begin;
document.querySelector('#resetBtn').onclick=()=>{if(confirm('¿Seguro que quieres borrar todo el historial y las estadísticas?')){S={history:[],stats:{normal:{},chaos:{}}};save();render()}};
document.querySelector('#soundToggle').onclick=e=>{sound=!sound;e.target.textContent=sound?' Sonido':' Sonido'};
document.querySelectorAll('.tab').forEach(x=>x.onclick=()=>{tab=x.dataset.tab;stats()});
render();
