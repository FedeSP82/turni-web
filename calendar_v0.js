
async function monthCounts(apiBase, isoDate, excludeDate){
  const y = isoDate.slice(0,4), m = isoDate.slice(5,7);
  const from = `${y}-${m}-01`;
  const last = new Date(Date.UTC(Number(y), Number(m), 0)).getUTCDate();
  const to = `${y}-${m}-${String(last).padStart(2,"0")}`;

      const r = await fetch(`${apiBase}/api/days?from=${from}&to=${to}`);
  const j = await r.json();
  let rientri=0,a104=0,trasfAss=0,forfAss=0,absForf=0;
  (j.days||[]).forEach(d=>{
    if(excludeDate && d.date===excludeDate) return;
    const f0 = String(d.forfettario_id||'').toUpperCase();
      if(f0==='FR66' || f0==='FR32') rientri++;
    if(String(d.absence_type||'').toUpperCase()==='104') a104++;
    const flag = Number(d.absence_flag||0)===1;
    const trasf = String(d.trip_type||'').trim();
    if(flag && trasf) trasfAss++;
    const forf = String(d.forfettario_id||'').trim();
    if(flag && forf) forfAss++;
    const act = String(d.actual||'').toUpperCase();
    if(flag && act==='ASS' && (trasf==='96' || trasf==='66')) absForf++;
  });
  return {rientri,a104,trasfAss,forfAss,absForf};
}

function deltaFromOldNew(oldRow, payload){
  const o = oldRow || {};
  const before = {
    ret: Number(o.trip_return||0)===1,
    abs: String(o.absence_type||'').toUpperCase(),
    flag: Number(o.absence_flag||0)===1,
    trasf: String(o.trip_type||'').trim(),
    forf: String(o.forfettario_id||'').trim(),
  };
  const after = {
    ret: Number(payload.trip_return||0)===1,
    abs: String(payload.absence_type||'').toUpperCase(),
    flag: Number(payload.absence_flag||0)===1,
    trasf: String(payload.trip_type||'').trim(),
    forf: String(payload.forfettario_id||'').trim(),
  };
  const inc = {
    rientri: (after.ret?1:0) - (before.ret?1:0),
    a104: (after.abs==='104'?1:0) - (before.abs==='104'?1:0),
    trasfAss: ((after.flag && after.trasf)?1:0) - ((before.flag && before.trasf)?1:0),
    forfAss: ((after.flag && after.forf)?1:0) - ((before.flag && before.forf)?1:0),
  };
  return inc;
}


async function checkLimitsBeforeSave(apiBase, isoDate, payload){
  try{
    const y = isoDate.slice(0,4), m = isoDate.slice(5,7);
    const from = `${y}-${m}-01`;
    const last = new Date(Date.UTC(Number(y), Number(m), 0)).getUTCDate();
    const to = `${y}-${m}-${String(last).padStart(2,"0")}`;
    // DELTA_LIMIT_CHECK
const r = await fetch(`${apiBase}/api/days?from=${from}&to=${to}`);
    const j = await r.json();
    const days = (j.days||[]);

    let rientri=0, a104=0, trasfAss=0, forfAbs=0;
    for(const d of days){
      if(d.date === isoDate) continue;
      const f0 = String(d.forfettario_id||'').toUpperCase();
      if(f0==='FR66' || f0==='FR32') rientri++;
      if(String(d.absence_type||'').toUpperCase()==='104') a104++;
      const flag = Number(d.absence_flag||0)===1;
      const trasf = String(d.trip_type||'').trim();
      if(flag && trasf) trasfAss++;
      const f = String(d.forfettario_id||'').toUpperCase();
      if(flag && (f==='FR66' || f==='FR32')) forfAbs++;
    }
    const f1 = String(payload.forfettario_id||'').toUpperCase();
    if(f1==='FR66' || f1==='FR32') rientri++;
    if(String(payload.absence_type||'').toUpperCase()==='104') a104++;
    if(Number(payload.absence_flag||0)===1 && String(payload.trip_type||'').trim()) trasfAss++;

    if(rientri>3){ alert('Massimo 3 rientri al mese.'); return false; }
    if(a104>3){ alert('Massimo 3 giorni di 104 al mese.'); return false; }
    if(trasfAss>3){ alert('Massimo 3 trasferte con assenza (flag) al mese.'); return false; }
    if(forfAbs>3){ alert('Massimo 3 forfettari con assenza (flag) al mese.'); return false; }
    return true;
  }catch(e){
    return true;
  }
}


async function countLimitsInMonth(apiBase, isoDate, excludeDate){
  const y = isoDate.slice(0,4), m = isoDate.slice(5,7);
  const from = `${y}-${m}-01`;
  const last = new Date(Date.UTC(Number(y), Number(m), 0)).getUTCDate();
  const to = `${y}-${m}-${String(last).padStart(2,"0")}`;
  const r = await fetch(`${apiBase}/api/days?from=${from}&to=${to}`);
  const j = await r.json();
  let rientri=0, a104=0, trasfAss=0;
  (j.days||[]).forEach(d=>{
    if(excludeDate && d.date === excludeDate) return;
    const ret = Number(d.trip_return||0) === 1;
    if(ret) rientri++;
    const abs = String(d.absence_type||"").toUpperCase();
    if(abs === "104") a104++;
    const flag = Number(d.absence_flag||0) === 1;
    const trasf = String(d.trip_type||"").trim();
    if(flag && trasf) trasfAss++;
  });
  return { rientri, a104, trasfAss };
}

// ======================
// calendar_v0.js — STABILE + colori + previsto/effettivo + icone + NOTE
// + SCHEMA "ATTIVO PER DATA" (backend: /api/schema/active?date=DD-MM-YYYY)
// ======================

const API_BASE = (typeof window!=="undefined" && window.API_BASE) ? window.API_BASE : "https://turni-api-v2.mecfed.workers.dev";

function monthRange(isoDate){
  const y = Number(isoDate.slice(0,4));
  const m = Number(isoDate.slice(5,7));
  const from = `${y}-${String(m).padStart(2,"0")}-01`;
  const last = new Date(y, m, 0).getDate();
  const to = `${y}-${String(m).padStart(2,"0")}-${String(last).padStart(2,"0")}`;
  return {from,to};
}
function isForf(v){ return v==="FR66" || v==="FR32"; }


function loadTrip75Toggle(){
  try{ return (localStorage.getItem("enable_trip75") === "1"); }
  catch(e){ return false; }
}
function isTrip75(v){
  const x = String(v||"").trim().toUpperCase();
  return x==="T72" || x==="T49";
}

async function fetchMonthDays(isoDate){
  const {from,to} = monthRange(isoDate);
  const r = await fetch(`${API_BASE}/api/days?from=${from}&to=${to}`);
  const j = await r.json();
  return (j.days||[]);
}

function countLimits(days, excludeDate){
  let rientri = 0;
  let ass104 = 0;
  let trasfAss = 0;
  for(const d of days){
    if(excludeDate && d.date === excludeDate) continue;
    const f0 = String(d.forfettario_id||'').toUpperCase();
      if(f0==='FR66' || f0==='FR32') rientri++;
    if(String(d.absence_type||"").toUpperCase()==="104") ass104++;
    const flag = Number(d.absence_flag||0)===1;
    const trip = String(d.trip_type||"").trim();
    if(flag && trip) trasfAss++;
  }
  return {rientri, ass104, trasfAss};
}


const API = {
  activeSchema: API_BASE + "/api/schema/active", // supporta ?date=DD-MM-YYYY
  userTeams:   API_BASE + "/api/user/teams",
  day:         API_BASE + "/api/day",
  daysRange:   API_BASE + "/api/days"
};

// ===== Intervalli lavorati (multi-spezzone) =====
let dmIntervals = []; // [{id,start,end}]
function dmMakeId(){ return "iv_"+Math.random().toString(16).slice(2)+Date.now().toString(16); }

function dmRenderIntervals(){
  const box = document.getElementById("dmIvList");
  if(!box) return;
  box.innerHTML = "";
  if(!dmIntervals.length){
    const d=document.createElement("div");
    d.className="small";
    d.style.opacity=".75";
    d.textContent="Nessun intervallo inserito (puoi usare i campi Ora inizio/fine oppure aggiungere un intervallo).";
    box.appendChild(d);
    return;
  }
  dmIntervals.forEach((iv, idx)=>{
    const row=document.createElement("div");
    row.style.display="flex";
    row.style.gap="10px";
    row.style.alignItems="center";
    row.style.flexWrap="wrap";

    const s=document.createElement("input");
    s.type="time"; s.value=iv.start||""; s.style.maxWidth="140px";
    s.oninput=()=>{ dmIntervals[idx].start = s.value; };

    const e=document.createElement("input");
    e.type="time"; e.value=iv.end||""; e.style.maxWidth="140px";
    e.oninput=()=>{ dmIntervals[idx].end = e.value; };

    const del=document.createElement("button");
    del.type="button";
    del.className="btn";
    del.textContent="🗑️";
    del.onclick=()=>{ dmIntervals.splice(idx,1); dmRenderIntervals(); };

    row.appendChild(document.createTextNode("Inizio"));
    row.appendChild(s);
    row.appendChild(document.createTextNode("Fine"));
    row.appendChild(e);
    row.appendChild(del);
    box.appendChild(row);
  });
}

async function dmLoadIntervals(dateISO){
  dmIntervals = [];
  try{
    const r = await apiGet(`${API.base}/api/intervals?date=${encodeURIComponent(dateISO)}`);
    dmIntervals = (r.intervals||[]).map(x=>({id:x.id||dmMakeId(), start:x.start, end:x.end}));
  }catch(e){
    dmIntervals = [];
  }
  // fallback: se non ci sono intervalli ma ci sono start/end, crea 1 intervallo
  const s = document.getElementById("dmStart")?.value || "";
  const e = document.getElementById("dmEnd")?.value || "";
  if(!dmIntervals.length && s && e){
    dmIntervals=[{id:dmMakeId(), start:s, end:e}];
  }
  dmRenderIntervals();
}

function dmIntervalsPayload(){
  const out=[];
  for(const iv of dmIntervals){
    const s=(iv.start||"").trim();
    const e=(iv.end||"").trim();
    if(!s && !e) continue;
    if(!s || !e) throw new Error("Completa inizio/fine per ogni intervallo.");
    out.push({start:s, end:e});
  }
  // se lista vuota: usa dmStart/dmEnd come singolo intervallo
  if(!out.length){
    const s0=document.getElementById("dmStart")?.value || "";
    const e0=document.getElementById("dmEnd")?.value || "";
    if(s0 && e0) out.push({start:s0, end:e0});
  }
  return out;
}

async function dmSaveIntervals(dateISO){
  const payload = { date: dateISO, intervals: dmIntervalsPayload() };
  await apiPut(`${API.base}/api/intervals`, payload);
}



// === DOM ===
const cal = document.getElementById("cal");
const monthLabel = document.getElementById("title");
const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");

// === STATE ===
let current = new Date();
let userTeams = [];
let monthDaysMap = {};         // YYYY-MM-DD -> day_entry
const schemaCache = {};        // YYYY-MM-DD -> schema
let enableTrip75 = false;      // toggle da Dati (localStorage enable_trip75)

// ======================
// Helpers
// ======================
function pad(n){ return String(n).padStart(2,"0"); }
function isoFromDate(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function itFromISO(iso){ // YYYY-MM-DD -> DD-MM-YYYY
  const [y,m,d] = String(iso||"").split("-");
  if(!y||!m||!d) return iso;
  return `${d}-${m}-${y}`;
}
function parseDMY(dmy){
  const [d,m,y] = String(dmy||"").split("-").map(Number);
  if(!d||!m||!y) return null;
  return new Date(y, m-1, d);
}
function daysBetween(a,b){
  // Calcolo giorni in UTC (anti ora legale)
  const t0 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const t1 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((t1 - t0) / 86400000);
}
function monthName(d){
  return d.toLocaleDateString("it-IT",{month:"long",year:"numeric"});
}
function clsTurno(code){
  const c = String(code||"").trim().toUpperCase();
  if(c==="") return "";
return ["M","P","N","ON"].includes(c) ? c : "";
}
function safeNum(v){
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Normalizza input monetari stile IT ("15,80" o "1.234,56") in formato numerico stringa
// compatibile col backend (che usa Number()).
function normMoneyInput(v){
  const s0 = String(v ?? "").trim();
  if(!s0) return "";
  // rimuove spazi e separatori migliaia ".", poi converte la virgola in punto
  let s = s0.replace(/\s+/g, "").replace(/\./g, "").replace(/,/g, ".");
  // lascia solo cifre, segno e punto
  s = s.replace(/[^0-9.\-]/g, "");
  return s;
}
function hasText(v){
  return typeof v === "string" && v.trim().length > 0;
}
function notePreview(v, max=50){
  if(!hasText(v)) return "";
  const oneLine = v.trim().replace(/\s+/g, " ");
  return oneLine.length > max ? oneLine.slice(0, max-1) + "…" : oneLine;
}
function hasExpenses(entry){
  if(!entry) return false;
  return safeNum(entry.fuel) > 0 || safeNum(entry.toll) > 0 || safeNum(entry.other) > 0;
}

// ======================
// Emoji icons — SOLO se c'è importo/spunta
// ======================

// ======================
// API
// ======================
async function apiGet(url){
  const r = await fetch(url, { headers: { "Accept":"application/json" } });
  if(!r.ok){
    const t = await r.text().catch(()=> "");
    throw new Error(`GET ${url} -> ${r.status} ${t}`.trim());
  }
  return r.json();
}
async function apiPut(url, body){
  const r = await fetch(url, {
    method:"PUT",
    headers:{ "Content-Type":"application/json", "Accept":"application/json" },
    body: JSON.stringify(body)
  });
  if(!r.ok){
    const t = await r.text().catch(()=> "");
    throw new Error(`PUT ${url} -> ${r.status} ${t}`.trim());
  }
  return r.json().catch(()=> ({}));
}

async function loadUserTeams(){
  const j = await apiGet(API.userTeams);
  return j.teams || [];
}

async function loadDaysForMonth(y,m){
  const from = `${y}-${pad(m+1)}-01`;
  const last = new Date(y, m+1, 0).getDate();
  const to = `${y}-${pad(m+1)}-${pad(last)}`;

  const j = await apiGet(`${API.daysRange}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  monthDaysMap = {};
  (j.days || []).forEach(d => { monthDaysMap[d.date] = d; });
}

// schema valido per quel giorno (YYYY-MM-DD)
async function schemaForISO(iso){
  if(schemaCache[iso]) return schemaCache[iso];
  const dmy = itFromISO(iso);
  const s = await apiGet(`${API.activeSchema}?date=${encodeURIComponent(dmy)}`);
  schemaCache[iso] = s;
  return s;
}

// ======================
// Turni (seq greedy: RC RN ON M P N)
// ======================
function parseSeqTokens(seqStr){
  const s = String(seqStr || "").trim().toUpperCase();
  if(!s) return [];

  // se ci sono separatori, split
  if(/[\,\s|\/;\-]/.test(s)){
    return s.split(/[\,\s|\/;\-]+/).filter(Boolean);
  }

  // parsing greedy per stringhe attaccate
  const TOKENS = ["ON","M","P","N"];
  const out = [];
  let i = 0;

  while(i < s.length){
    let matched = null;
    for(const t of TOKENS){
      if(s.substring(i, i+t.length) === t){ matched = t; break; }
    }
    if(!matched){ i++; continue; }
    out.push(matched);
    i += matched.length;
  }
  return out;
}

function teamForISO(iso){
  let last = null;
  for(const r of userTeams){
    const d = parseDMY(r.from_date);
    if(!d) continue;
    if(isoFromDate(d) <= iso) last = String(r.squadra||"").trim().toUpperCase();
  }
  return last;
}

function turnoPrevistoFor(schema, dateObj){
  if(!schema) return "";
  const start = parseDMY(schema.week1);
  if(!start) return "";
  const diff = daysBetween(start, dateObj);
  if(diff < 0) return "";

  const iso = isoFromDate(dateObj);
  const team = teamForISO(iso);
  if(!team) return "";

  const seqRaw = schema.squads?.[team] || "";
  const tokens = parseSeqTokens(seqRaw);
  if(tokens.length === 0) return "";

  return tokens[diff % tokens.length] || "";
}

function turnoOrarioFor(schema, code){
  const c = String(code||"").trim().toUpperCase();
  const t = schema?.times?.[c];
  if(!t) return "";
  const start = String(t.start||"").trim();
  const end = String(t.end||"").trim();
  if(!start || !end) return "";
  return `${start}–${end}`;
}

function buildIconsTitle(entry){
  if(!entry) return "";
  const parts = [];
  if(entry.trip_type) parts.push(`Trasferta ${entry.trip_type}`);
  if(safeNum(entry.trip_return) === 1 || ['FR66','FR32'].includes(String(entry.forfettario_id||'').toUpperCase())) parts.push(`Rientro`);
  if(safeNum(entry.lunch) === 1) parts.push(`Pranzo`);
  const fid = String(entry.forfettario_id || "").trim().toUpperCase();
  if(fid === "FR66") parts.push(`Forfettario: Rientro 66€`);
  if(fid === "FR32") parts.push(`Forfettario: Rientro in giornata 32€`);
  if(safeNum(entry.travel50_h) > 0) parts.push(`Ore viaggio 50% ${safeNum(entry.travel50_h).toFixed(2)} h`);
  if(safeNum(entry.travel100_h) > 0) parts.push(`Ore viaggio 100% ${safeNum(entry.travel100_h).toFixed(2)} h`);
  if(safeNum(entry.drive150_h) > 0) parts.push(`Ore guida 150% ${safeNum(entry.drive150_h).toFixed(2)} h`);
  if(safeNum(entry.fuel) > 0) parts.push(`Benzina €${safeNum(entry.fuel).toFixed(2)}`);
  if(safeNum(entry.toll) > 0) parts.push(`Autostrada €${safeNum(entry.toll).toFixed(2)}`);
  if(safeNum(entry.other) > 0) parts.push(`Altre spese €${safeNum(entry.other).toFixed(2)}`);
  if(hasText(entry.note)) parts.push(`Note: ${notePreview(entry.note, 60)}`);
  return parts.join(" · ");
}

// ======================
// Render
// ======================
async function render(){
  if(!cal) return;

  const y = current.getFullYear();
  const m = current.getMonth();

  if(monthLabel) monthLabel.textContent = monthName(current);
  cal.innerHTML = "";

  await loadDaysForMonth(y,m);

  const first = new Date(y,m,1);
  const startDay = (first.getDay()+6)%7; // lun=0
  const last = new Date(y,m+1,0).getDate();

  // celle vuote prima del 1
  for(let i=0;i<startDay;i++){
    const e = document.createElement("div");
    e.className = "cell off";
    cal.appendChild(e);
  }

  // pre-carico schema per ogni giorno del mese (parallel)
  const dayIsos = [];
  for(let d=1; d<=last; d++){
    const date = new Date(y,m,d);
    dayIsos.push(isoFromDate(date));
  }

  const schemaByISO = {};
  await Promise.all(dayIsos.map(async iso => {
    try{
      schemaByISO[iso] = await schemaForISO(iso);
    }catch(e){
      console.warn("schemaForISO failed", iso, e);
      schemaByISO[iso] = null;
    }
  }));

  const todayISO = isoFromDate(new Date());

  for(let d=1; d<=last; d++){
    const date = new Date(y,m,d);
    const iso = isoFromDate(date);

    const schema = schemaByISO[iso];
    const previsto = turnoPrevistoFor(schema, date);    // M/P/N/ON/RC/RN
    const orarioPrev = turnoOrarioFor(schema, previsto);

    const entry = monthDaysMap[iso] || null;

    // effettivo salvato (se c'è)
    const eff = String(entry?.actual || "").trim().toUpperCase();
    const effLabel = (eff === "ASS")
      ? (String(entry?.absence_type || "ASS").trim().toUpperCase())
      : eff;

    // mostra effettivo solo se diverso dal previsto
    const showEff = eff && eff !== previsto;

    const clsPrev = clsTurno(previsto);
    const clsEff = clsTurno(eff);

    const icons = [];
    // Emoji: solo se c'è importo/spunta
    const _trip = String(entry?.trip_type||"").trim().toUpperCase();
    if(_trip){
      if(_trip==="T72") icons.push("✈️72");
      else if(_trip==="T49") icons.push("✈️49.5");
      else icons.push(`✈️${_trip}`);
    }
    if(safeNum(entry?.trip_return) === 1) icons.push(`↩️`);
    if(safeNum(entry?.lunch) === 1) icons.push(`🍽️`);

    if(safeNum(entry?.travel50_h) > 0 || safeNum(entry?.travel100_h) > 0 || safeNum(entry?.drive150_h) > 0) icons.push(`🚗`);
    if(safeNum(entry?.fuel) > 0) icons.push(`⛽`);
    if(safeNum(entry?.toll) > 0) icons.push(`🛣️`);
    if(safeNum(entry?.other) > 0) icons.push(`🧾`);

    if(entry?.forfettario_id) icons.push(`💶`);
    if(hasText(entry?.note)) icons.push(`📝`);

    const cell = document.createElement("div");
    cell.className = "cell" + (iso === todayISO ? " today" : "");
    cell.setAttribute("data-iso", iso);
    cell.setAttribute("data-planned", previsto || "");

    // evidenziazione rientri e forfettari su assenza
    const _forf = String(entry?.forfettario_id || "").trim().toUpperCase();
    const _flagAbs = Number(entry?.absence_flag || 0) === 1;
    const _hasR = (_forf === "FR66" || _forf === "FR32" || safeNum(entry?.trip_return) === 1);
    const _hasAssForf = _flagAbs && (String(entry?.trip_type||"").trim() || _hasR);
    if(_hasR) cell.classList.add("hasRientro");
    if(_hasAssForf) cell.classList.add("hasAssForf");


    // title tooltip (hover desktop)
    const titleParts = [];
    if(orarioPrev) titleParts.push(orarioPrev);
    const iconTitle = buildIconsTitle(entry);
    if(iconTitle) titleParts.push(iconTitle);
    if(titleParts.length) cell.title = titleParts.join(" · ");


    // --- SAFE DEFAULTS (avoid undefined on mobile builds)
    const _showOrarioPrev = (typeof showOrarioPrev !== "undefined") ? showOrarioPrev : false;
    const _orarioPrev = (typeof orarioPrev !== "undefined") ? orarioPrev : "";
    const _showOrarioEff = (typeof showOrarioEff !== "undefined") ? showOrarioEff : false;
    const _orarioEff = (typeof orarioEff !== "undefined") ? orarioEff : "";

    cell.classList.toggle("hasEff", !!showEff);
    const savedDot = entry ? "●" : "";
    const overrideClock = (entry && (entry.actual_start || entry.actual_end || entry.has_intervals)) ? "⏰" : "";
    cell.innerHTML = `
      <div class="topRow">
        <div class="num">${d}</div>
        <div class="savedDot">${savedDot}</div>
        <div class="clockDot" title="Orario effettivo modificato">${overrideClock}</div>
      </div>
      <div class="turno planned ${clsPrev}">${previsto || ""}</div>
      ${_showOrarioPrev ? `<div class="orario">Prev ${_orarioPrev}</div>` : ``}
      ${showEff ? `<div class="turno actual ${clsEff}">${effLabel}</div>${_showOrarioEff ? `<div class="orario">Eff ${_orarioEff}</div>` : ``}` : ``}
      ${icons.length ? `<div class="iconsRow">${icons.join(" ")}</div>` : ``}
    `;

    cell.onclick = () => openDayModal(iso, previsto);
    cal.appendChild(cell);
  }
}

// ======================
// POPUP GIORNO (salva su D1)
// - chiude SOLO con "Chiudi" o "Salva"
// ======================

async function openDayModal(dateISO, plannedShiftCode) {
  const modal = document.getElementById("dayModal");
  if(!modal) return alert("dayModal non trovato: controlla index.html");

  const dmTitle = document.getElementById("dmTitle");
  const dmPlanned = document.getElementById("dmPlanned");
  const dmActual = document.getElementById("dmActual");
  const dmAbsWrap = document.getElementById("dmAbsWrap");
  const dmAbsType = document.getElementById("dmAbsType");
  const dmAbsForf = document.getElementById("dmAbsForf");
  const dmAbsFlag = document.getElementById("dmAbsFlag");
  const dmAbsOn = document.getElementById("dmAbsOn");
  const dmTripType = document.getElementById("dmTripType");
  const dmTrip75Wrap = document.getElementById("dmTrip75Wrap");
  const dmTrip75 = document.getElementById("dmTrip75");
  const dmForfettario = document.getElementById("dmForfettario");
  const dmLunch = document.getElementById("dmLunch");
  const dmStart = document.getElementById("dmStart");
  const dmEnd = document.getElementById("dmEnd");
  const dmTravel50 = document.getElementById("dmTravel50");
  const dmTravel100 = document.getElementById("dmTravel100");
  const dmDrive150 = document.getElementById("dmDrive150");
  const dmFuel = document.getElementById("dmFuel");
  const dmToll = document.getElementById("dmToll");
  const dmOther = document.getElementById("dmOther");
  const dmNote = document.getElementById("dmNote");
  const dmClose = document.getElementById("dmClose") || document.getElementById("dmClose2");
  const dmSave = document.getElementById("dmSave");
  const dmAddIv = document.getElementById("dmAddIv");
  const dmStatus = document.getElementById("dmStatus");

  modal.style.display = "block";
  document.body.classList.add("modalOpen");
  if(dmTitle) dmTitle.textContent = `Giorno: ${itFromISO(dateISO)}`;
  if(dmPlanned) dmPlanned.value = plannedShiftCode || "";

  // carica schema attivo per la data (serve per precompilare gli orari)
  let activeSchemaForDay = null;
  try{
    const dmy = `${dateISO.slice(8,10)}-${dateISO.slice(5,7)}-${dateISO.slice(0,4)}`;
    activeSchemaForDay = await apiGet(`${API.activeSchema}?date=${encodeURIComponent(dmy)}`);
  }catch(e){
    activeSchemaForDay = null;
  }


  // NON chiudere cliccando fuori
  modal.onclick = null;

  function setAbsVisibility(){
    if(!dmAbsWrap || !dmActual) return;
    const isAbs = (dmActual.value === "ASS");
    dmAbsWrap.style.display = isAbs ? "block" : "none";
    if(isAbs){
      dmAbsWrap.classList.add("absActive");
      const h=document.getElementById("dmAbsHint"); if(h) h.style.display="block";
    }else{
      dmAbsWrap.classList.remove("absActive");
      const h=document.getElementById("dmAbsHint"); if(h) h.style.display="none";
    }
  }

  function isRientroForf(v){
    const x = String(v||"").trim().toUpperCase();
    return x==="FR66" || x==="FR32";
  }

  async function monthRientriCount(excludeDate){
    const y = dateISO.slice(0,4), m = dateISO.slice(5,7);
    const from = `${y}-${m}-01`;
    const last = new Date(Date.UTC(Number(y), Number(m), 0)).getUTCDate();
    const to = `${y}-${m}-${String(last).padStart(2,"0")}`;
    const j = await apiGet(`${API.daysRange}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    let count = 0;
    for(const d of (j.days||[])){
      if(excludeDate && d.date === excludeDate) continue;
      if(isRientroForf(d.forfettario_id)) count++;
    }
    return count;
  }

  function syncTripForfUI(){
    // v71: mutua esclusione tra Trasferta 96/66, Trasferta 75% (T72/T49) e Rientro (FR66/FR32)
    if(!dmTripType || !dmForfettario) return;

    const trip = String(dmTripType.value||"").trim().toUpperCase(); // "96" | "66" | ""
    const t75  = String(dmTrip75?.value||"").trim().toUpperCase(); // "T72" | "T49" | ""
    const forf = String(dmForfettario.value||"").trim().toUpperCase(); // FR66 | FR32 | ""

    const hasTrip = (trip==="96" || trip==="66");
    const hasT75  = isTrip75(t75);
    const hasForf = isRientroForf(forf);

    const absMode = (dmActual?.value === 'ASS');
    const absForf = String(dmAbsForf?.value||'').trim();
    const hasAbsForf = absMode && (absForf==='96' || absForf==='66');

    // Se ho forfettario su assenza: blocca trasferta/rientro (mutua esclusione)
    if(hasAbsForf){
      if(dmTripType) dmTripType.value='';
      if(dmTrip75) dmTrip75.value='';
      if(dmForfettario) dmForfettario.value='';
      if(dmTripType) dmTripType.disabled=true;
      if(dmTrip75) dmTrip75.disabled=true;
      if(dmForfettario) dmForfettario.disabled=true;
      if(dmStatus) dmStatus.textContent='Forfettario su assenza: trasferta e rientro disabilitati.';
      return;
    }

    // Se scelgo una trasferta standard -> azzera rientro e 75%, blocca rientro e 75%
    if(hasTrip){
      if(dmForfettario) dmForfettario.value = "";
      if(dmTrip75) dmTrip75.value = "";
      if(dmForfettario) dmForfettario.disabled = true;
      if(dmTrip75) dmTrip75.disabled = true;
      if(dmStatus) dmStatus.textContent = "Rientro (66/32) e Trasferta 75% non compatibili con Trasferta 96/66.";
      return;
    }

    // Se scelgo trasferta 75% -> azzera rientro e trasferta standard, blocca rientro e standard
    if(hasT75){
      if(dmTripType) dmTripType.value = "";
      if(dmForfettario) dmForfettario.value = "";
      if(dmForfettario) dmForfettario.disabled = true;
      if(dmTripType) dmTripType.disabled = true;
      if(dmStatus) dmStatus.textContent = "Rientro (66/32) e Trasferta 96/66 non compatibili con Trasferta 75%.";
      return;
    }

    // Nessuna trasferta: sblocca standard e (se attiva) 75%; rientro gestito poi dal limite mensile
    if(dmTripType) dmTripType.disabled = false;
    if(dmTrip75) dmTrip75.disabled = false;
    if(dmForfettario) dmForfettario.disabled = false;
    if(dmStatus && (dmStatus.textContent||"").startsWith("Rientro")) dmStatus.textContent = "";

    // Se scelgo rientro -> azzera trasferte
    if(hasForf){
      if(dmTripType) dmTripType.value = "";
      if(dmTrip75) dmTrip75.value = "";
    }
  }

  
  function syncAbsForfUI(){
    if(!dmActual || !dmAbsForf) return;
    const absMode = (dmActual.value === "ASS");
    if(!absMode){
      dmAbsForf.value = "";
      dmAbsForf.disabled = true;
      return;
    }
    dmAbsForf.disabled = false;
  }

  async function applyAbsForfLimit(){
    if(!dmAbsForf || !dmActual) return;
    if(dmActual.value !== "ASS"){
      dmAbsForf.disabled = true;
      dmAbsForf.value = "";
      return;
    }
    // se è selezionato un forfettario su assenza, syncTripForfUI gestisce blocchi
    try{
      const counts = await monthCounts(window.API_BASE || API_BASE || "", dateISO, dateISO);
      const limitReached = (counts.absForf || 0) >= 3;
      const cur = String(dmAbsForf.value || "").trim();
      const isCur = (cur==="96" || cur==="66");
      if(limitReached && !isCur){
        dmAbsForf.value = "";
        dmAbsForf.disabled = true;
        if(dmStatus) dmStatus.textContent = "Limite forfettario su assenza raggiunto (3/mese).";
      }else{
        dmAbsForf.disabled = false;
      }
    }catch(e){
      console.error("applyAbsForfLimit", e);
      dmAbsForf.disabled = false;
    }
  }

  async function applyRientroLimit(){
    if(!dmForfettario) return;

    // Se c'è trasferta, rientro non selezionabile (compatibilità)
    if(dmTripType && String(dmTripType.value||"").trim()){
      dmForfettario.value = "";
      dmForfettario.disabled = true;
      if(dmStatus) dmStatus.textContent = "Rientro (66/32) non compatibile con Trasferta 96/66.";
      return;
    }

    try{
      const currentIsRientro = isRientroForf(dmForfettario.value);
      const count = await monthRientriCount(dateISO); // esclude il giorno corrente
      const limitReached = (count >= 3);

      // se limite raggiunto e sto provando ad aggiungere un nuovo rientro
      if(limitReached && !currentIsRientro){
        dmForfettario.value = "";
        dmForfettario.disabled = true;
        if(dmStatus) dmStatus.textContent = "Limite rientri raggiunto (3/mese).";
      }else{
        // se non c'è trasferta e non siamo bloccati dal limite
        dmForfettario.disabled = false;
        if(dmStatus && dmStatus.textContent === "Limite rientri raggiunto (3/mese).") dmStatus.textContent = "";
      }
    }catch(e){
      console.error("applyRientroLimit", e);
      dmForfettario.disabled = false;
    }
  }

  // reset UI
  if(dmActual) dmActual.value = "";
  if(dmAbsType) dmAbsType.value = "";
  if(dmAbsOn) dmAbsOn.checked = false;
  if(dmAbsForf) dmAbsForf.value = "";
  if(dmAbsFlag) dmAbsFlag.checked = false;
  if(dmTripType) dmTripType.value = "";
  if(dmTrip75) dmTrip75.value = "";
  if(dmForfettario) dmForfettario.value = "";
  if(dmLunch) dmLunch.checked = false;
  if(dmStart) dmStart.value = "";
  if(dmEnd) dmEnd.value = "";
  if(dmTravel50) dmTravel50.value = "";
  if(dmTravel100) dmTravel100.value = "";
  if(dmDrive150) dmDrive150.value = "";
  if(dmFuel) dmFuel.value = "";
  if(dmToll) dmToll.value = "";
  if(dmOther) dmOther.value = "";
  if(dmNote) dmNote.value = "";
  if(dmStatus) dmStatus.textContent = "";
  setAbsVisibility();

  if(dmActual) dmActual.onchange = setAbsVisibility;

  // listeners robusti
  
  if(dmAbsForf){
    dmAbsForf.disabled = true;
    const onAbsForf = ()=>{ try{ syncTripForfUI(); }catch(e){} applyAbsForfLimit(); };
    dmAbsForf.addEventListener("change", onAbsForf);
    dmAbsForf.addEventListener("input", onAbsForf);
  }

if(dmForfettario){
    const onForf = async ()=>{ syncTripForfUI(); await applyRientroLimit();
      syncAbsForfUI();
      await applyAbsForfLimit();
      try{ syncTripForfUI(); }catch(e){} };
    dmForfettario.onchange = onForf;
    dmForfettario.oninput  = onForf;
  }
  if(dmTripType){
    const onTrip = async ()=>{ syncTripForfUI(); await applyRientroLimit();
      syncAbsForfUI();
      await applyAbsForfLimit();
      try{ syncTripForfUI(); }catch(e){} };
    dmTripType.onchange = onTrip;
    dmTripType.oninput  = onTrip;
  }

  // init lock/limit
  syncTripForfUI();
  await applyRientroLimit();
      syncAbsForfUI();
      await applyAbsForfLimit();
      try{ syncTripForfUI(); }catch(e){}

  // carica dati esistenti
  try{
    if(dmStatus) dmStatus.textContent = "Carico...";
    const j = await apiGet(`${API.day}?date=${encodeURIComponent(dateISO)}`);
    const d = j?.day || null;

    if(d){
      if(dmActual) dmActual.value = String(d.actual || "");
        if(dmAbsOn) dmAbsOn.checked = String(d.actual||"") === "ASS";
      if(dmAbsType) dmAbsType.value = String(d.absence_type || "");
      if(dmAbsFlag) dmAbsFlag.checked = Number(d.absence_flag||0)===1;
      if(dmTripType) dmTripType.value = String(d.trip_type || "");
        if(dmAbsForf){
          const act = String(d.actual||"").trim().toUpperCase();
          const tt = String(d.trip_type||"").trim().toUpperCase();
          if(act==="ASS" && (tt==="96" || tt==="66")) dmAbsForf.value = tt;
        }
      if(dmForfettario) dmForfettario.value = String(d.forfettario_id || "");
      if(dmLunch) dmLunch.checked = Number(d.lunch || 0) === 1;
      if(dmStart) dmStart.value = String(d.actual_start || "");
      if(dmEnd) dmEnd.value = String(d.actual_end || "");
      if(dmTravel50) dmTravel50.value = (d.travel50_h ?? "") === null ? "" : String(d.travel50_h ?? "");
      if(dmTravel100) dmTravel100.value = (d.travel100_h ?? "") === null ? "" : String(d.travel100_h ?? "");
      if(dmDrive150) dmDrive150.value = (d.drive150_h ?? "") === null ? "" : String(d.drive150_h ?? "");
      if(dmFuel) dmFuel.value = (d.fuel ?? "") === null ? "" : String(d.fuel ?? "");
      if(dmToll) dmToll.value = (d.toll ?? "") === null ? "" : String(d.toll ?? "");
      if(dmOther) dmOther.value = (d.other ?? "") === null ? "" : String(d.other ?? "");
      if(dmNote) dmNote.value = String(d.note || "");
      setAbsVisibility();
      if(dmStatus) dmStatus.textContent = "Dati caricati.";
    }else{
      if(dmStatus) dmStatus.textContent = "Nessun dato salvato (nuovo).";
    }

    syncTripForfUI();
    await applyRientroLimit();
      syncAbsForfUI();
      await applyAbsForfLimit();
      try{ syncTripForfUI(); }catch(e){}
  }catch(e){
    console.error(e);
    if(dmStatus) dmStatus.textContent = "Errore caricamento (Worker).";
  }


  // Precompila orari effettivi se non presenti (per rendere modificabili le ore anche quando lo schema è standard)
  try{
    if(dmStart && dmEnd){
      const curS = String(dmStart.value||"").trim();
      const curE = String(dmEnd.value||"").trim();
      if(!curS && !curE){
        const code = String((dmActual && dmActual.value) ? dmActual.value : (plannedShiftCode||"")).trim().toUpperCase();
        const t = activeSchemaForDay?.times?.[code];
        if(t && t.start && t.end){
          dmStart.value = String(t.start).trim();
          dmEnd.value   = String(t.end).trim();
        }
      }
    }
  }catch(e){}


  
  // --- AUTO ORARI quando cambio Turno Effettivo (M/P/N/ON) ---
  // Regola: se NON ci sono intervalli inseriti e gli orari non sono stati toccati manualmente,
  // allora al cambio turno aggiorno Ora inizio/fine con gli orari standard dello schema attivo.
  let dmTimeTouched = false;
  let lastAutoTimes = null;

  function getAutoTimesFor(code){
    const c = String(code||"").trim().toUpperCase();
    const t = activeSchemaForDay?.times?.[c];
    if(t && t.start && t.end){
      return { s: String(t.start).trim(), e: String(t.end).trim() };
    }
    return null;
  }

  try{
    const initCode = String((dmActual && dmActual.value) ? dmActual.value : (plannedShiftCode||"")).trim().toUpperCase();
    lastAutoTimes = getAutoTimesFor(initCode);
  }catch(e){ lastAutoTimes = null; }

  if(dmStart){ dmStart.addEventListener("input", ()=>{ dmTimeTouched = true; }); }
  if(dmEnd){ dmEnd.addEventListener("input", ()=>{ dmTimeTouched = true; }); }

  if(dmActual){
    dmActual.addEventListener("change", ()=>{
      try{
        const code = String(dmActual.value||"").trim().toUpperCase();
        const t = getAutoTimesFor(code);
        if(!t || !dmStart || !dmEnd) { lastAutoTimes = t; return; }

        const hasIvs = Array.isArray(dmIntervals) && dmIntervals.length>0;
        if(hasIvs){ lastAutoTimes = t; return; }

        const curS = String(dmStart.value||"").trim();
        const curE = String(dmEnd.value||"").trim();

        const wasAuto = (
          (!dmTimeTouched) ||
          (lastAutoTimes && curS===lastAutoTimes.s && curE===lastAutoTimes.e) ||
          (!curS && !curE)
        );

        if(wasAuto){
          dmStart.value = t.s;
          dmEnd.value   = t.e;
          dmTimeTouched = false;
        }
        lastAutoTimes = t;
      }catch(e){}
    });
  }

// chiudi
  if(dmClose){
    dmClose.onclick = () => {
      modal.style.display = "none";
      document.body.classList.remove("modalOpen");
    };
  }

  // salva
  if(dmSave){
    dmSave.onclick = async () => {
      try{
        syncTripForfUI(); // applica regole prima del salvataggio
        if(dmStatus) dmStatus.textContent = "Salvo...";

        const forf = (dmForfettario?.value || "").trim().toUpperCase();
        const body = {
          date: dateISO,
          actual: ((dmAbsOn?.checked) ? "ASS" : (dmActual?.value || "").trim()),
          absence_type: (dmAbsType?.value || "").trim(),
          absence_flag: (dmAbsFlag?.checked ? 1 : 0),
          trip_type: ((String(dmActual?.value||"").trim().toUpperCase()==="ASS" && (String(dmAbsForf?.value||"").trim()==="96" || String(dmAbsForf?.value||"").trim()==="66"))
            ? String(dmAbsForf.value).trim()
            : (isTrip75(String(dmTrip75?.value||"").trim().toUpperCase()) ? String(dmTrip75.value).trim().toUpperCase() : (dmTripType?.value || "").trim())),
          forfettario_id: (dmForfettario?.value || "").trim(),
          trip_return: (isRientroForf(forf) ? 1 : 0),
          lunch: (dmLunch?.checked ? 1 : 0),
          actual_start: (dmStart?.value || "").trim(),
          actual_end: (dmEnd?.value || "").trim(),
          travel50_h: normMoneyInput(dmTravel50?.value),
          travel100_h: normMoneyInput(dmTravel100?.value),
          drive150_h: normMoneyInput(dmDrive150?.value),
          fuel: normMoneyInput(dmFuel?.value),
          toll: normMoneyInput(dmToll?.value),
          other: normMoneyInput(dmOther?.value),
          note: (dmNote?.value || "").trim()
        };

        await apiPut(API.day, body);
        if(dmStatus) dmStatus.textContent = "Salvato ✅";
        setTimeout(()=> {
          modal.style.display = "none";
          document.body.classList.remove("modalOpen");
          render();
        }, 200);
      }catch(err){
        console.error(err);
        if(dmStatus) dmStatus.textContent = "Errore salvataggio ❌: " + (err?.message || err);
      }
    };
  }
}


// ======================
// NAV mese
// ======================
if(btnPrev) btnPrev.onclick = () => { current.setMonth(current.getMonth()-1); render(); };
if(btnNext) btnNext.onclick = () => { current.setMonth(current.getMonth()+1); render(); };

// ======================
// INIT
// ======================
(async function init(){
  try{ userTeams = await loadUserTeams(); }catch(e){ console.warn(e); userTeams=[]; }
  enableTrip75 = loadTrip75Toggle();
  render();
})();if(dmAbsOn){
    dmAbsOn.onchange = () => {
      if(dmAbsOn.checked){
        if(dmActual) dmActual.value = "ASS";
      }else{
        if(dmActual && dmActual.value==="ASS") dmActual.value = "";
      }
      setAbsVisibility();
    };
  }

  


// Fallback globale per il bottone 'Aggiungi intervallo'
window.addInterval = function(){
  try {
    if (typeof dmIntervals === 'undefined' || !Array.isArray(dmIntervals)) {
      // se non siamo nel modal giorno, non fare nulla
      return;
    }
    dmIntervals.push({ start: '', end: '' });
    if (typeof dmRenderIntervals === 'function') dmRenderIntervals();
  } catch(e){ console.error(e); }
};
document.addEventListener('click', (e)=>{
  const t=e.target;
  if(t && t.id==='dmAddIv') window.addInterval();
});
