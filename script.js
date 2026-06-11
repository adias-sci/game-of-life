import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(window.LIFE_SUPABASE_URL, window.LIFE_SUPABASE_KEY);

const colors = ["#76d6ff", "#f0c96a", "#f49ac2", "#76d68c", "#ae89ff", "#ff9b7a"];

const careersCollege = [
  { name: "Doctor", salary: 120000 },
  { name: "Engineer", salary: 95000 },
  { name: "Lawyer", salary: 105000 },
  { name: "Professor", salary: 85000 },
  { name: "Game Designer", salary: 90000 }
];

const careersFast = [
  { name: "Chef", salary: 55000 },
  { name: "Mechanic", salary: 60000 },
  { name: "Artist", salary: 50000 },
  { name: "Sales Manager", salary: 70000 },
  { name: "Entrepreneur", salary: 75000 }
];

const houses = [
  { name: "Starter Condo", cost: 120000, value: 140000 },
  { name: "Townhouse", cost: 220000, value: 260000 },
  { name: "Family Home", cost: 350000, value: 420000 },
  { name: "Dream Estate", cost: 650000, value: 760000 }
];

const lifeEvents = [
  { text: "Won a community award. Collect $25,000.", cash: 25000 },
  { text: "Car repair. Pay $15,000.", cash: -15000 },
  { text: "Side hustle paid off. Collect $40,000.", cash: 40000 },
  { text: "Vacation memories. Pay $20,000.", cash: -20000 },
  { text: "Stock bonus. Collect $50,000.", cash: 50000 },
  { text: "Medical bill. Pay $25,000.", cash: -25000 },
  { text: "Charity gala. Pay $10,000 and gain reputation.", cash: -10000, bonus: 20000 },
  { text: "Inheritance surprise. Collect $60,000.", cash: 60000 }
];

const boardPath = [
  { r:7,c:0,type:"start",label:"Start" },
  { r:7,c:1,type:"choice",label:"Path Choice" },
  { r:7,c:2,type:"event",label:"Life Event" },
  { r:7,c:3,type:"payday",label:"Payday" },
  { r:7,c:4,type:"career",label:"Career" },
  { r:7,c:5,type:"event",label:"Life Event" },
  { r:7,c:6,type:"house",label:"House" },
  { r:7,c:7,type:"payday",label:"Payday" },
  { r:7,c:8,type:"family",label:"Family" },
  { r:7,c:9,type:"event",label:"Life Event" },
  { r:6,c:9,type:"payday",label:"Payday" },
  { r:5,c:9,type:"choice",label:"Risk Choice" },
  { r:4,c:9,type:"event",label:"Life Event" },
  { r:3,c:9,type:"payday",label:"Payday" },
  { r:2,c:9,type:"family",label:"Family" },
  { r:1,c:9,type:"house",label:"House" },
  { r:0,c:9,type:"event",label:"Life Event" },
  { r:0,c:8,type:"payday",label:"Payday" },
  { r:0,c:7,type:"career",label:"Career Boost" },
  { r:0,c:6,type:"event",label:"Life Event" },
  { r:0,c:5,type:"family",label:"Family" },
  { r:0,c:4,type:"payday",label:"Payday" },
  { r:0,c:3,type:"house",label:"House" },
  { r:0,c:2,type:"event",label:"Life Event" },
  { r:0,c:1,type:"payday",label:"Payday" },
  { r:0,c:0,type:"choice",label:"Midlife Choice" },
  { r:1,c:0,type:"event",label:"Life Event" },
  { r:2,c:0,type:"payday",label:"Payday" },
  { r:3,c:0,type:"family",label:"Family" },
  { r:4,c:0,type:"event",label:"Life Event" },
  { r:5,c:0,type:"payday",label:"Payday" },
  { r:6,c:0,type:"retire",label:"Retirement Zone" }
];

let state = freshState();
let mode = "solo";
let gameCode = null;
let myId = null;
let isHost = false;
let channel = null;
let pollTimer = null;

const $ = id => document.getElementById(id);

$("soloBtn").onclick = () => openLobby("solo");
$("localBtn").onclick = () => openLobby("local");
$("hostBtn").onclick = hostOnline;
$("joinBtn").onclick = () => openLobby("join");
$("backBtn").onclick = showHome;
$("lobbyAction").onclick = lobbyAction;
$("startBtn").onclick = startGame;
$("copyBtn").onclick = () => navigator.clipboard?.writeText(gameCode || "");
$("resetBtn").onclick = () => location.reload();

$("spinBtn").onclick = spin;
$("choosePathBtn").onclick = choosePath;
$("buyHouseBtn").onclick = buyHouse;
$("retireBtn").onclick = retire;
$("endTurnBtn").onclick = () => endTurn();

function freshState() {
  return {
    status: "lobby",
    players: [],
    current: 0,
    spin: 0,
    log: [],
    winnerId: null
  };
}

function openLobby(kind) {
  mode = kind === "join" ? "online" : kind;
  isHost = kind !== "join" && kind !== "online";
  gameCode = null;
  myId = null;
  state = freshState();
  $("homeScreen").classList.add("hidden");
  $("gameScreen").classList.add("hidden");
  $("lobbyScreen").classList.remove("hidden");
  $("codeBox").classList.add("hidden");
  $("joinCode").classList.toggle("hidden", kind !== "join");
  $("startBtn").classList.add("hidden");
  $("playersList").innerHTML = "";
  $("statusText").textContent = "";
  $("lobbyAction").classList.remove("hidden");
  $("playerName").value = "";
  $("lobbyTitle").textContent = kind === "solo" ? "Single Player" : kind === "local" ? "Pass-and-Play Lobby" : "Join Online Game";
  $("lobbyHelp").textContent = kind === "solo" ? "Enter your name. Computer players will join." : kind === "local" ? "Add 2–6 players." : "Enter the game code and your name.";
}

function showHome() {
  stopSync();
  $("homeScreen").classList.remove("hidden");
  $("lobbyScreen").classList.add("hidden");
  $("gameScreen").classList.add("hidden");
}

async function hostOnline() {
  mode = "online";
  isHost = true;
  myId = makeId();
  gameCode = makeCode();
  state = freshState();

  const { error } = await supabase.from("life_games").insert({ code: gameCode, state });
  if (error) return msg("Supabase Error", error.message + " — Make sure you ran life-supabase-setup.sql.");

  subscribe(gameCode);
  $("homeScreen").classList.add("hidden");
  $("lobbyScreen").classList.remove("hidden");
  $("lobbyTitle").textContent = "Host Online Game";
  $("lobbyHelp").textContent = "Share the code. Add yourself, then start.";
  $("codeBox").classList.remove("hidden");
  $("codeText").textContent = gameCode;
  $("joinCode").classList.add("hidden");
  $("startBtn").classList.remove("hidden");
}

async function lobbyAction() {
  const name = $("playerName").value.trim();
  if (!name) return msg("Name needed", "Enter a player name.");

  if (mode === "solo") {
    state = freshState();
    addPlayer(name, "human");
    ["Bot Bailey", "Bot Riley", "Bot Morgan"].forEach(n => addPlayer(n, "bot"));
    myId = state.players[0].id;
    isHost = true;
    return startGame();
  }

  if (mode === "local") {
    if (state.players.length >= 6) return msg("Full", "Maximum 6 players.");
    addPlayer(name, "human");
    $("playerName").value = "";
    renderLobby();
    $("startBtn").classList.toggle("hidden", state.players.length < 2);
    return;
  }

  if (mode === "online" && !isHost) {
    const code = $("joinCode").value.trim().toUpperCase();
    const { data, error } = await supabase.from("life_games").select("state").eq("code", code).single();
    if (error || !data) return msg("Game not found", "Check the code and try again.");
    state = data.state;
    gameCode = code;
    myId = makeId();

    if (state.status !== "lobby") return msg("Already started", "That game has already started.");
    if (state.players.length >= 6) return msg("Full", "That game already has 6 players.");

    state.players.push(makePlayer(name, "human", state.players.length, myId));
    await saveState();
    subscribe(code);

    $("codeBox").classList.remove("hidden");
    $("codeText").textContent = code;
    $("joinCode").classList.add("hidden");
    $("lobbyAction").classList.add("hidden");
    $("statusText").textContent = "Joined. Waiting for host.";
    renderLobby();
  }

  if (mode === "online" && isHost) {
    if (state.players.some(p => p.id === myId)) return;
    state.players.push(makePlayer(name, "human", state.players.length, myId));
    await saveState();
    $("playerName").value = "";
    renderLobby();
  }
}

function addPlayer(name, kind) {
  state.players.push(makePlayer(name, kind, state.players.length));
}

function makePlayer(name, kind, i, id = makeId()) {
  return {
    id,
    name,
    kind,
    color: colors[i % colors.length],
    pos: 0,
    cash: 200000,
    loans: 0,
    career: null,
    salary: 0,
    house: null,
    married: false,
    kids: 0,
    bonus: 0,
    pathChosen: false,
    retired: false,
    movedThisTurn: false
  };
}

async function startGame() {
  if (state.players.length < 2) return msg("Need players", "Add at least 2 players.");
  state.status = "playing";
  state.log = ["The adventure begins. Choose college or career, then spin to move."];
  await changed();
  enterGame();
}

function enterGame() {
  $("homeScreen").classList.add("hidden");
  $("lobbyScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
  renderAll();
  setTimeout(botTurn, 600);
}

function renderLobby() {
  $("playersList").innerHTML = "";
  state.players.forEach((p, i) => {
    const s = document.createElement("span");
    s.className = "chip";
    s.innerHTML = `<span class="token" style="background:${p.color}">${escapeHtml(p.name[0])}</span>${i + 1}. ${escapeHtml(p.name)}${p.kind === "bot" ? " / Bot" : ""}`;
    $("playersList").appendChild(s);
  });
}

function renderAll() {
  if (state.status === "lobby") return renderLobby();
  if (state.status === "playing" || state.status === "ended") {
    if ($("gameScreen").classList.contains("hidden")) enterGame();
    renderSide();
    renderBoard();
  }
}

function renderSide() {
  const p = cur();
  const me = viewer();
  $("turnName").textContent = p?.name || "—";
  $("youName").textContent = me ? `You: ${me.name}` : "You: spectator";
  $("spinText").textContent = state.spin ? `Spin: ${state.spin}` : "Spin: —";
  $("phaseText").textContent = state.status === "ended" ? "Game Over" : p?.retired ? "Retired" : p?.pathChosen ? "Moving" : "Choose path";

  const mine = isMyTurn();
  $("spinBtn").disabled = !mine || state.status !== "playing" || !p?.pathChosen || p.movedThisTurn || p.retired;
  $("choosePathBtn").disabled = !mine || state.status !== "playing" || p?.pathChosen || p?.retired;
  $("buyHouseBtn").disabled = !mine || state.status !== "playing" || p?.retired;
  $("retireBtn").disabled = !mine || state.status !== "playing" || p?.pos < boardPath.length - 1 || p?.retired;
  $("endTurnBtn").disabled = !mine || state.status !== "playing";

  $("turnBadge").textContent = state.status === "ended" ? "Game Over" : mine ? "Your Turn" : "Waiting";

  renderStats(me || p);
  renderScoreboard();

  $("log").innerHTML = [...state.log].reverse().slice(0, 80).map(x => `<p>${escapeHtml(x)}</p>`).join("");
}

function renderStats(p) {
  if (!p) return;
  $("myStats").innerHTML = `
    <div class="stat"><strong>Cash:</strong> <span class="money">${money(p.cash)}</span></div>
    <div class="stat"><strong>Loans:</strong> <span class="debt">${money(p.loans)}</span></div>
    <div class="stat"><strong>Career:</strong> ${p.career || "None"} ${p.salary ? `(${money(p.salary)})` : ""}</div>
    <div class="stat"><strong>House:</strong> ${p.house ? `${p.house.name} / value ${money(p.house.value)}` : "None"}</div>
    <div class="stat"><strong>Family:</strong> ${p.married ? "Married" : "Single"}, ${p.kids} kid${p.kids === 1 ? "" : "s"}</div>
    <div class="stat"><strong>Net Worth:</strong> <span class="money">${money(netWorth(p))}</span></div>
  `;
}

function renderScoreboard() {
  $("scoreboard").innerHTML = [...state.players]
    .sort((a,b) => netWorth(b) - netWorth(a))
    .map(p => `
      <div class="player-row">
        <strong><span class="token" style="background:${p.color}">${escapeHtml(p.name[0])}</span> ${escapeHtml(p.name)} ${p.retired ? "🏁" : ""}</strong>
        <span>Net worth: <span class="money">${money(netWorth(p))}</span></span>
        <span class="hint">${p.career || "No career"} • ${p.house?.name || "No house"}</span>
      </div>
    `).join("");
}

function renderBoard() {
  $("board").innerHTML = "";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 10; c++) {
      const idx = boardPath.findIndex(t => t.r === r && t.c === c);
      const tile = document.createElement("div");
      if (idx < 0) {
        tile.className = "tile empty";
        $("board").appendChild(tile);
        continue;
      }
      const data = boardPath[idx];
      tile.className = `tile ${data.type}`;
      if (idx === cur()?.pos) tile.classList.add("current");
      tile.innerHTML = `<strong>${idx}</strong><br>${escapeHtml(data.label)}`;

      const here = state.players.filter(p => p.pos === idx);
      if (here.length) {
        const holder = document.createElement("div");
        holder.className = "tokens";
        here.forEach(p => {
          const token = document.createElement("span");
          token.className = "token";
          token.style.background = p.color;
          token.textContent = p.name[0];
          token.title = p.name;
          token.style.opacity = p.retired ? .45 : 1;
          holder.appendChild(token);
        });
        tile.appendChild(holder);
      }

      $("board").appendChild(tile);
    }
  }
}

async function choosePath() {
  const p = cur();
  const path = await choose("Choose Your Path", [
    { value: "college", label: "College: take $80,000 loans, draw a better career" },
    { value: "career", label: "Career: start earning immediately" }
  ]);
  if (!path) return;

  if (path === "college") {
    p.loans += 80000;
    const career = pick(careersCollege);
    p.career = career.name;
    p.salary = career.salary;
    p.cash += 20000;
    state.log.push(`${p.name} chose College, took $80,000 in loans, and became a ${career.name}.`);
  } else {
    const career = pick(careersFast);
    p.career = career.name;
    p.salary = career.salary;
    state.log.push(`${p.name} chose Career and became a ${career.name}.`);
  }
  p.pathChosen = true;
  await changed();
}

async function spin() {
  const p = cur();
  const spin = 1 + Math.floor(Math.random() * 6);
  state.spin = spin;
  const old = p.pos;
  p.pos = Math.min(boardPath.length - 1, p.pos + spin);
  p.movedThisTurn = true;
  state.log.push(`${p.name} spun ${spin} and moved from ${old} to ${p.pos}.`);
  resolveTile(p, boardPath[p.pos]);
  checkEnd();
  await changed();
}

function resolveTile(p, tile) {
  if (tile.type === "payday") {
    p.cash += p.salary;
    state.log.push(`Payday! ${p.name} collected ${money(p.salary)}.`);
  }

  if (tile.type === "career") {
    p.cash += 30000;
    p.salary += 10000;
    state.log.push(`${p.name} got a career boost: +$10,000 salary and $30,000 bonus.`);
  }

  if (tile.type === "event") {
    const ev = pick(lifeEvents);
    p.cash += ev.cash || 0;
    p.bonus += ev.bonus || 0;
    state.log.push(`${p.name}: ${ev.text}`);
  }

  if (tile.type === "family") {
    const roll = Math.random();
    if (!p.married && roll < .45) {
      p.married = true;
      p.cash -= 20000;
      state.log.push(`${p.name} got married. Wedding costs $20,000.`);
    } else {
      const kids = Math.random() < .7 ? 1 : 2;
      p.kids += kids;
      p.cash -= kids * 10000;
      state.log.push(`${p.name} welcomed ${kids} kid${kids === 1 ? "" : "s"}. Pay ${money(kids * 10000)}.`);
    }
  }

  if (tile.type === "house") {
    state.log.push(`${p.name} landed on a house space. They may buy or upgrade a house.`);
  }

  if (tile.type === "choice") {
    const amount = Math.random() < .5 ? 40000 : -30000;
    p.cash += amount;
    state.log.push(amount > 0 ? `${p.name} made a smart choice and earned ${money(amount)}.` : `${p.name} took a risky choice and paid ${money(Math.abs(amount))}.`);
  }

  if (tile.type === "retire") {
    state.log.push(`${p.name} reached the retirement zone.`);
  }
}

async function buyHouse() {
  const p = cur();
  const currentIndex = p.house ? houses.findIndex(h => h.name === p.house.name) : -1;
  const options = houses.slice(currentIndex + 1);
  if (!options.length) return msg("No Upgrade", "You already own the best house.");

  const choice = await choose("Buy / Upgrade House", options.map((h, i) => ({
    value: String(i),
    label: `${h.name}: cost ${money(h.cost)}, value ${money(h.value)}`
  })));
  if (choice === null) return;

  const house = options[Number(choice)];
  p.cash -= house.cost;
  p.house = house;
  state.log.push(`${p.name} bought ${house.name} for ${money(house.cost)}.`);
  await changed();
}

async function retire() {
  const p = cur();
  p.retired = true;
  p.cash += 100000;
  state.log.push(`${p.name} retired and received a $100,000 retirement bonus.`);
  checkEnd();
  await changed();
  if (state.status !== "ended") endTurn(true);
}

async function endTurn(force = false) {
  if (!force && !isMyTurn()) return;
  cur().movedThisTurn = false;
  state.spin = 0;

  if (state.players.every(p => p.retired)) {
    checkEnd();
    await changed();
    return;
  }

  do {
    state.current = (state.current + 1) % state.players.length;
  } while (cur().retired);

  state.log.push(`It is now ${cur().name}'s turn.`);
  await changed();
  setTimeout(botTurn, 600);
}

async function botTurn() {
  if (mode !== "solo" || cur()?.kind !== "bot" || state.status !== "playing") return;
  setTimeout(async () => {
    const p = cur();
    if (!p.pathChosen) {
      const college = Math.random() > .45;
      if (college) {
        p.loans += 80000;
        const career = pick(careersCollege);
        p.career = career.name;
        p.salary = career.salary;
        p.cash += 20000;
        state.log.push(`${p.name} chose College and became a ${career.name}.`);
      } else {
        const career = pick(careersFast);
        p.career = career.name;
        p.salary = career.salary;
        state.log.push(`${p.name} chose Career and became a ${career.name}.`);
      }
      p.pathChosen = true;
    } else if (p.pos >= boardPath.length - 1) {
      p.retired = true;
      p.cash += 100000;
      state.log.push(`${p.name} retired.`);
    } else {
      const spin = 1 + Math.floor(Math.random() * 6);
      state.spin = spin;
      p.pos = Math.min(boardPath.length - 1, p.pos + spin);
      p.movedThisTurn = true;
      state.log.push(`${p.name} spun ${spin} and moved to ${p.pos}.`);
      resolveTile(p, boardPath[p.pos]);
      if (!p.house && Math.random() > .7) {
        p.house = houses[0];
        p.cash -= houses[0].cost;
        state.log.push(`${p.name} bought ${houses[0].name}.`);
      }
    }
    checkEnd();
    await changed();
    if (state.status !== "ended") endTurn(true);
  }, 800);
}

function checkEnd() {
  if (state.players.every(p => p.retired)) {
    state.status = "ended";
    const winner = [...state.players].sort((a,b) => netWorth(b) - netWorth(a))[0];
    state.winnerId = winner.id;
    state.log.push(`${winner.name} wins with ${money(netWorth(winner))}!`);
    msg("Game Over", `${winner.name} wins with ${money(netWorth(winner))}!`);
  }
}

function netWorth(p) {
  const houseValue = p.house?.value || 0;
  const familyBonus = (p.married ? 50000 : 0) + p.kids * 30000;
  return p.cash + houseValue + familyBonus + p.bonus - p.loans;
}

async function choose(title, options) {
  return new Promise(resolve => {
    $("dialogTitle").textContent = title;
    $("dialogBody").innerHTML = `<div class="dialog-grid"><label>Choose<select id="choicePick">${options.map(o => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join("")}</select></label></div>`;
    $("choiceDialog").showModal();
    const h = () => {
      $("choiceDialog").removeEventListener("close", h);
      if ($("choiceDialog").returnValue !== "submit") return resolve(null);
      resolve($("choicePick").value);
    };
    $("choiceDialog").addEventListener("close", h);
  });
}

async function changed() {
  if (mode === "online") await saveState();
  renderAll();
}

async function saveState() {
  const { error } = await supabase.from("life_games").update({ state, updated_at: new Date().toISOString() }).eq("code", gameCode);
  if (error) msg("Save Error", error.message);
}

function subscribe(code) {
  stopSync();
  channel = supabase.channel(`life-${code}`)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "life_games", filter: `code=eq.${code}` }, payload => receiveState(payload.new.state))
    .subscribe();
  pollTimer = setInterval(fetchLatest, 1500);
  fetchLatest();
}

async function fetchLatest() {
  if (!gameCode) return;
  const { data } = await supabase.from("life_games").select("state").eq("code", gameCode).single();
  if (data?.state) receiveState(data.state);
}

function receiveState(next) {
  const wasLobby = state.status === "lobby";
  state = next;
  if (state.status === "playing" && wasLobby) enterGame();
  else renderAll();
}

function stopSync() {
  if (channel) supabase.removeChannel(channel);
  if (pollTimer) clearInterval(pollTimer);
  channel = null;
  pollTimer = null;
}

function cur() { return state.players[state.current]; }
function viewer() { return mode === "online" ? state.players.find(p => p.id === myId) : mode === "local" ? cur() : state.players.find(p => p.id === myId) || state.players[0]; }
function isMyTurn() { return state.status === "playing" && (mode === "local" || cur()?.id === myId); }
function makeCode() { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return Array.from({ length: 6 }, () => a[Math.floor(Math.random() * a.length)]).join(""); }
function makeId() { return "p_" + Math.random().toString(36).slice(2, 10); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function money(n) { return "$" + Math.round(n).toLocaleString(); }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c])); }
function msg(title, text) { $("msgTitle").textContent = title; $("msgText").textContent = text; $("msgDialog").showModal(); }
