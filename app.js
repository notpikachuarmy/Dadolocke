const STORAGE_KEY = "dadolocke_v1";

const categories = {
  regla: { name: "REGLA", icon: "🎲" },
  combate: { name: "COMBATE", icon: "⚔️" },
  recursos: { name: "RECURSOS", icon: "🎒" },
  pokemon: { name: "POKÉMON", icon: "🐾" }
};

const effects = {
  regla: {
    positive: [
      { name:"Libertad", desc:"Durante la duración del efecto puedes ignorar un dado negativo.", duration:true, gamble:true },
      { name:"Segunda oportunidad", desc:"Si pierdes un combate y tienes Pokémon vivos, no se pierde el Locke.", duration:true, gamble:true },
      { name:"Comodín", desc:"Puedes guardar este resultado y utilizarlo posteriormente para repetir una tirada de Dadolocke. No puedes repetir una tirada de apuesta.", duration:false, gamble:true }
    ],
    negative: [
      { name:"Mano atada", desc:"Durante la duración del efecto, el primer turno nunca puede restar vida de forma activa al rival. El daño por casco dentado y similares no cuenta.", duration:true, gamble:false },
      { name:"Rotación", desc:"Debes utilizar un Pokémon diferente en cada combate siempre que tengas suficientes Pokémon disponibles. Después de cada combate cambia el Pokémon por el primero de la caja, sacando al que lleve más tiempo en el equipo.", duration:true, gamble:false },
      { name:"Prohibición", desc:"Elige uno de los seis tipos existentes en tu equipo. Durante la duración del efecto, no puedes utilizar Pokémon de ese tipo.", duration:true, gamble:false },
      { name:"Sin comodines", desc:"Durante la duración del efecto, no puedes utilizar dados positivos.", duration:true, gamble:false }
    ]
  },
  combate: {
    positive: [
      { name:"Combate limpio", desc:"Durante la duración del efecto puedes utilizar un objeto curativo adicional.", duration:true, gamble:true },
      { name:"Último esfuerzo", desc:"La primera vez que un Pokémon cae debilitado, no muere. Pero no podrá volver a combatir hasta el siguiente combate importante.", duration:false, gamble:true }
    ],
    negative: [
      { name:"Sin objetos", desc:"Durante la duración del efecto, no puedes utilizar objetos durante el combate.", duration:true, gamble:false },
      { name:"Sin cambios", desc:"Durante la duración del efecto, no puedes cambiar voluntariamente de Pokémon durante un combate, salvo que lleve 3 turnos en campo.", duration:true, gamble:false },
      { name:"Especialista", desc:"Durante la duración del efecto, tienes que jugar monotype. Tú eliges el tipo.", duration:true, gamble:false },
      { name:"Equipo reducido", desc:"Durante la duración del efecto, tienes que jugar con 3 Pokémon en tu equipo.", duration:true, gamble:false }
    ]
  },
  recursos: {
    positive: [
      { name:"Doble o nada", desc:"Cada vez que el rival use una poción, tú ganas 2 unidades del mismo objeto, o el equivalente disponible más cercano en ese juego.", duration:true, gamble:true },
      { name:"Poción superior", desc:"Cada vez que el rival use una poción, puedes usar una versión más potente si quieres.", duration:true, gamble:false }
    ],
    negative: [
      { name:"Tienda cerrada", desc:"Durante la duración del efecto, no puedes comprar objetos.", duration:true, gamble:false },
      { name:"Sin consumibles", desc:"Durante la duración del efecto, no puedes utilizar objetos consumibles en combate.", duration:true, gamble:false },
      { name:"Liquidación", desc:"Debes vender la mitad de tus objetos vendibles, redondeando hacia abajo. Si no puedes venderlos, se ignoran esos objetos.", duration:false, gamble:false }
    ]
  },
  pokemon: {
    positive: [
      { name:"Segunda oportunidad", desc:"En tu próxima ruta puedes ignorar el primer encuentro y capturar el segundo Pokémon que aparezca.", duration:false, gamble:false },
      { name:"Elección", desc:"En tu próxima ruta atrapa los tres primeros Pokémon que encuentres (ponles el mismo mote), elige el que prefieras y libera el resto.", duration:false, gamble:false },
      { name:"Arga doctor chambeo", desc:"Puedes devolver un Pokémon muerto al equipo. Solo puede utilizarse una vez por Pokémon.", duration:false, gamble:false }
    ],
    negative: [
      { name:"Renacimiento", desc:"Elige un Pokémon de tu equipo. Vuelve a atrapar algo en la misma ruta con el mismo mote y libéralo.", duration:false, gamble:false },
      { name:"Mala captura", desc:"Solo tienes 3 Poké Balls totales para la próxima captura.", duration:false, gamble:false },
      { name:"Destierro", desc:"Debes elegir un Pokémon del equipo y mandarlo al PC hasta que derrotes al próximo combate importante. No está muerto, simplemente queda temporalmente fuera.", duration:false, gamble:false }
    ]
  }
};

let state = loadState();
let activeTab = "normal";
let soundEnabled = true;
let audioCtx = null;

function defaultState() {
  return {
    history: [],
    stats: { normal: {}, chaos: {} },
    current: null,
    pending: null
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? {...defaultState(), ...saved} : defaultState();
  } catch { return defaultState(); }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function rand6() { return Math.floor(Math.random() * 6) + 1; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function rollTone() {
  if (!soundEnabled) return;
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const now = audioCtx.currentTime;
    for (let i=0; i<3; i++) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.value = 180 + Math.random()*120 + i*45;
      gain.gain.setValueAtTime(.0001, now + i*.08);
      gain.gain.exponentialRampToValueAtTime(.09, now + i*.08 + .01);
      gain.gain.exponentialRampToValueAtTime(.0001, now + i*.08 + .09);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(now + i*.08); osc.stop(now + i*.08 + .1);
    }
  } catch {}
}

function outcomeClass(alignment) {
  return alignment === "positive" ? "positive" : "negative";
}

function durationRoll() {
  const n = rand6();
  if (n <= 2) return { roll:n, value:"1 combate o ruta" };
  if (n <= 4) return { roll:n, value:"3 combates o rutas" };
  if (n === 5) return { roll:n, value:"5 combates o rutas" };
  return { roll:n, value:"Hasta el próximo combate importante o hasta la próxima ciudad" };
}

function displayName(key) {
  return categories[key]?.name || key;
}

function allEffects() {
  const list = [];
  for (const [category, sides] of Object.entries(effects)) {
    for (const alignment of ["positive","negative"]) {
      for (const effect of sides[alignment]) list.push({category, alignment, effect});
    }
  }
  return list;
}

function makeHistoryEntry(base) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now()+"-"+Math.random(),
    timestamp: new Date().toISOString(),
    completed: false,
    ...base
  };
}

function beginRoll() {
  state.current = null;
  state.pending = { phase:"alignment", steps:[] };
  saveState();
  rollNext();
}

function rollNext() {
  if (!state.pending) return;
  rollTone();
  if (state.pending.phase === "alignment") {
    const n = rand6();
    const alignment = n <= 3 ? "positive" : "negative";
    state.pending.alignment = alignment;
    state.pending.alignmentRoll = n;
    state.pending.steps.push({type:"alignment", roll:n, value:alignment});
    state.pending.phase = "category";
  } else if (state.pending.phase === "category") {
    const n = rand6();
    const keys = ["regla","combate","recursos","pokemon","caos"];
    const category = keys[n-1];
    state.pending.categoryRoll = n;
    state.pending.category = category;
    state.pending.steps.push({type:"category", roll:n, value:category});
    state.pending.phase = category === "caos" ? "chaos" : "effect";
  } else if (state.pending.phase === "chaos") {
    const list = allEffects();
    const chosen = pick(list);
    state.pending.chaosChoice = chosen;
    state.pending.steps.push({type:"chaos", value:chosen});
    state.pending.alignment = chosen.alignment;
    state.pending.category = chosen.category;
    state.pending.effect = chosen.effect;
    finishEffectSelection();
  } else if (state.pending.phase === "effect") {
    const side = effects[state.pending.category][state.pending.alignment];
    const chosen = pick(side);
    state.pending.effect = chosen;
    state.pending.effectIndex = side.indexOf(chosen);
    state.pending.steps.push({type:"effect", value:chosen});
    finishEffectSelection();
  } else if (state.pending.phase === "duration") {
    const d = durationRoll();
    state.pending.duration = d;
    state.pending.steps.push({type:"duration", roll:d.roll, value:d.value});
    finishPending();
  } else if (state.pending.phase === "gamble") {
    const n = rand6();
    state.pending.gambleRoll = n;
    state.pending.steps.push({type:"gamble", roll:n});
    if (n <= 2) state.pending.gambleResult = "Perdiste el premio";
    else if (n <= 4) state.pending.gambleResult = "No ocurre nada";
    else state.pending.gambleResult = "Duplicas la recompensa";
    finishPending();
  }
  saveState();
  render();
}

function finishEffectSelection() {
  const effect = state.pending.effect;
  if (effect.duration) {
    state.pending.phase = "duration";
  } else if (effect.gamble && state.pending.alignment === "positive" && state.pending.category !== "caos") {
    state.pending.phase = "gamblePrompt";
  } else {
    finishPending();
  }
}

function acceptGamble(choice) {
  if (!state.pending) return;
  if (choice === "yes") {
    state.pending.phase = "gamble";
    rollNext();
  } else {
    finishPending();
  }
}

function finishPending() {
  const p = state.pending;
  const entry = makeHistoryEntry({
    alignment:p.alignment,
    category:p.category,
    effect:p.effect,
    duration:p.duration || null,
    chaos:p.category === "caos" || !!p.chaosChoice,
    steps:p.steps,
    gambleRoll:p.gambleRoll || null,
    gambleResult:p.gambleResult || null
  });
  state.history.unshift(entry);
  const statKey = entry.chaos ? "chaos" : "normal";
  const name = entry.effect.name;
  state.stats[statKey][name] = (state.stats[statKey][name] || 0) + 1;
  state.current = entry;
  state.pending = null;
  saveState();
  render();
}

function deleteHistory(id) {
  state.history = state.history.filter(x => x.id !== id);
  saveState(); render();
}

function toggleCompleted(id) {
  const item = state.history.find(x => x.id === id);
  if (item) item.completed = !item.completed;
  saveState(); render();
}

function resetAll() {
  if (!confirm("¿Seguro que quieres borrar todo el historial y las estadísticas?")) return;
  state = defaultState();
  saveState(); render();
}

function render() {
  renderCurrent();
  renderHistory();
  renderStats();
}

function renderCurrent() {
  const stack = document.getElementById("diceStack");
  const action = document.getElementById("actionArea");
  const stage = document.getElementById("stageLabel");
  action.innerHTML = "";

  if (state.pending) {
    stack.innerHTML = state.pending.steps.map((s,i) => {
      let title="", value="", icon="🎲", cls="";
      if (s.type==="alignment") { title="Destino"; value=s.value==="positive"?"POSITIVO":"NEGATIVO"; icon=s.value==="positive"?"🟢":"🔴"; cls=s.value; }
      if (s.type==="category") { title="Tema"; value=displayName(s.value); icon=categories[s.value]?.icon || "☠️"; }
      if (s.type==="effect") { title="Resultado"; value=s.value.name; icon="🎯"; }
      if (s.type==="duration") { title="Duración"; value=s.value; icon="⏱️"; }
      if (s.type==="chaos") { title="Caos"; value=`${s.value.alignment==="positive"?"🟢":"🔴"} ${displayName(s.value.category)} → ${s.value.effect.name}`; icon="☠️"; }
      if (s.type==="gamble") { title="Apuesta"; value=`${s.roll} → ${state.pending.gambleResult || ""}`; icon="🎰"; }
      return `<div class="die-card ${i===state.pending.steps.length-1?"latest":""}">
        <div class="die-icon">${icon}</div>
        <div><div class="die-title">${title}</div><div class="die-value ${cls}">${escapeHtml(value)}</div></div>
        <div class="die-number">${s.roll ?? ""}</div>
      </div>`;
    }).join("");

    stage.textContent = state.pending.phase === "gamblePrompt" ? "¿Te la juegas?" : "Tirando…";
    if (state.pending.phase === "gamblePrompt") {
      const e = state.pending.effect;
      action.innerHTML = `<div class="action-card">
        <strong>🎰 ¿Te la juegas?</strong>
        <span>Has obtenido <b>${escapeHtml(e.name)}</b>. Puedes quedarte el resultado o arriesgarlo.</span>
        <div class="action-buttons">
          <button class="btn-muted" onclick="acceptGamble('no')">Quedarme el premio</button>
          <button class="btn-gold" onclick="acceptGamble('yes')">🎲 Arriesgar</button>
        </div>
      </div>`;
    } else if (state.pending.phase !== "gamble" && state.pending.phase !== "gamblePrompt") {
      action.innerHTML = `<button class="main-btn" onclick="rollNext()">🎲 Tirar siguiente dado</button>`;
    }
  } else if (state.current) {
    const e = state.current.effect;
    const d = state.current.duration ? `<div class="muted">⏱️ ${escapeHtml(state.current.duration.value)}</div>` : "";
    const g = state.current.gambleResult ? `<div class="muted">🎰 Apuesta: ${escapeHtml(state.current.gambleResult)}</div>` : "";
    stack.innerHTML = `<div class="die-card latest">
      <div class="die-icon">${state.current.chaos ? "☠️" : categories[state.current.category].icon}</div>
      <div><div class="die-title">Resultado final</div><div class="die-value ${state.current.alignment}">${escapeHtml(e.name)}</div>
      <div class="history-details">${escapeHtml(e.desc)}</div></div>
      <div class="die-number">${state.current.chaos ? "CAOS" : ""}</div>
    </div>`;
    action.innerHTML = `<div class="action-card">${d}${g}<div class="action-buttons"><button class="main-btn" onclick="beginRoll()">🎲 Tirar desde 0</button></div></div>`;
    stage.textContent = "Resultado completado";
  } else {
    stack.innerHTML = `<div class="empty-state"><div class="big-die">🎲</div><p>Cuando tires, cada resultado aparecerá aquí y los anteriores quedarán debajo.</p></div>`;
    action.innerHTML = `<button class="main-btn" onclick="beginRoll()">🎲 Tirar desde 0</button>`;
    stage.textContent = "Preparado";
  }
}

function renderHistory() {
  const list = document.getElementById("historyList");
  document.getElementById("historyCount").textContent = `${state.history.length} tiradas`;
  if (!state.history.length) {
    list.innerHTML = `<div class="empty-state compact">Todavía no hay tiradas.</div>`;
    return;
  }
  list.innerHTML = state.history.map((h,i) => `
    <article class="history-item">
      <div class="history-head">
        <strong>#${state.history.length-i} · ${formatDate(h.timestamp)}</strong>
        <span class="pill ${h.chaos?"chaos":h.alignment==="positive"?"good":"bad"}">${h.chaos?"☠️ CAOS":h.alignment==="positive"?"🟢 POSITIVO":"🔴 NEGATIVO"}</span>
      </div>
      <div class="history-main">
        <span class="pill">${categories[h.category]?.icon || "☠️"} ${escapeHtml(displayName(h.category))}</span>
        <span class="pill">${escapeHtml(h.effect.name)}</span>
        ${h.duration ? `<span class="pill">⏱️ ${escapeHtml(h.duration.value)}</span>` : ""}
        ${h.gambleResult ? `<span class="pill">🎰 ${escapeHtml(h.gambleResult)}</span>` : ""}
      </div>
      <div class="history-details">${escapeHtml(h.effect.desc)}</div>
      <div class="history-actions">
        <button class="complete-btn ${h.completed?"completed":""}" onclick="toggleCompleted('${h.id}')">${h.completed?"☑ Completado":"☐ Marcar completado"}</button>
        <button class="delete-btn" onclick="deleteHistory('${h.id}')">Borrar</button>
      </div>
    </article>
  `).join("");
}

function renderStats() {
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === activeTab));
  const content = document.getElementById("statsContent");
  const data = state.stats[activeTab];
  const rows = Object.entries(data).sort((a,b)=>b[1]-a[1]);
  if (!rows.length) {
    content.innerHTML = `<div class="empty-state compact">Todavía no hay estadísticas de ${activeTab === "normal" ? "tiradas normales" : "Caos"}.</div>`;
    return;
  }
  content.innerHTML = `<div class="stat-grid"><div class="stat-box"><h3>${activeTab==="normal"?"🎲 Tiradas normales":"☠️ Tiradas de Caos"}</h3>
    ${rows.map(([name,count])=>`<div class="stat-row"><span>${escapeHtml(name)}</span><strong>${count}</strong></div>`).join("")}
  </div></div>`;
}

function formatDate(s) {
  return new Date(s).toLocaleString("es-ES",{dateStyle:"short",timeStyle:"short"});
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

document.getElementById("startBtn").addEventListener("click", beginRoll);
document.getElementById("resetBtn").addEventListener("click", resetAll);
document.getElementById("soundToggle").addEventListener("click", e => {
  soundEnabled = !soundEnabled;
  e.currentTarget.textContent = soundEnabled ? "🔊 Sonido" : "🔇 Sonido";
});
document.querySelectorAll(".tab").forEach(b => b.addEventListener("click",()=>{activeTab=b.dataset.tab;renderStats();}));

render();
