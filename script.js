import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(window.LIFE_SUPABASE_URL, window.LIFE_SUPABASE_KEY);

const colors = ["#ff6b6b", "#4dabf7", "#69db7c", "#ffd43b", "#b388ff", "#ff922b"];

const collegeCareers = [
  { name: "Doctor", salary: 130000, tax: 45000 },
  { name: "Lawyer", salary: 115000, tax: 40000 },
  { name: "Engineer", salary: 100000, tax: 35000 },
  { name: "Scientist", salary: 95000, tax: 32000 },
  { name: "Professor", salary: 85000, tax: 28000 }
];

const careerCareers = [
  { name: "Chef", salary: 60000, tax: 18000 },
  { name: "Artist", salary: 55000, tax: 16000 },
  { name: "Mechanic", salary: 65000, tax: 19000 },
  { name: "Influencer", salary: 70000, tax: 21000 },
  { name: "Entrepreneur", salary: 80000, tax: 24000 }
];

const houses = [
  { name: "Cozy Cottage", price: 140000, sell: 180000 },
  { name: "City Condo", price: 220000, sell: 260000 },
  { name: "Family Home", price: 360000, sell: 430000 },
  { name: "Beach House", price: 520000, sell: 650000 },
  { name: "Dream Mansion", price: 800000, sell: 1000000 }
];

const actionCards = [
  { text: "Win a TV game show. Collect $80,000.", cash: 80000, icon: "📺" },
  { text: "Start a charity fundraiser. Pay $20,000 but gain a Life Tile.", cash: -20000, life: 1, icon: "💝" },
  { text: "Car breaks down. Pay $30,000.", cash: -30000, icon: "🚗" },
  { text: "Sell an app idea. Collect $120,000.", cash: 120000, icon: "📱" },
  { text: "Vacation around the world. Pay $40,000 and gain a Life Tile.", cash: -40000, life: 1, icon: "✈️" },
  { text: "Lawsuit settlement. Collect $60,000.", cash: 60000, icon: "⚖️" },
  { text: "Home repairs. Pay $25,000.", cash: -25000, icon: "🔧" },
  { text: "Help a friend move. Collect a Life Tile.", life: 1, icon: "📦" },
  { text: "Stock market jump. Collect $100,000.", cash: 100000, icon: "📈" },
  { text: "Go back to school. Pay $50,000 and increase salary by $20,000.", cash: -50000, raise: 20000, icon: "🎓" }
];

const path = [
  {x:40,y:620,type:"start",label:"START"},
  {x:150,y:620,type:"college",label:"COLLEGE or CAREER"},
  {x:260,y:620,type:"action",label:"ACTION"},
  {x:370,y:620,type:"payday",label:"PAYDAY"},
  {x:480,y:620,type:"career",label:"CAREER"},
  {x:590,y:620,type:"life",label:"LIFE TILE"},
  {x:700,y:620,type:"house",label:"BUY HOUSE"},
  {x:810,y:620,type:"payday",label:"PAYDAY"},
  {x:810,y:500,type:"family",label:"GET MARRIED"},
  {x:700,y:500,type:"action",label:"ACTION"},
  {x:590,y:500,type:"tax",label:"TAXES"},
  {x:480,y:500,type:"payday",label:"PAYDAY"},
  {x:370,y:500,type:"family",label:"BABY"},
  {x:260,y:500,type:"house",label:"HOUSE"},
  {x:150,y:500,type:"action",label:"ACTION"},
  {x:40,y:500,type:"life",label:"LIFE TILE"},
  {x:40,y:380,type:"payday",label:"PAYDAY"},
  {x:150,y:380,type:"career",label:"CAREER CHANGE"},
  {x:260,y:380,type:"family",label:"TWINS?"},
  {x:370,y:380,type:"action",label:"ACTION"},
  {x:480,y:380,type:"payday",label:"PAYDAY"},
  {x:590,y:380,type:"house",label:"HOUSE"},
  {x:700,y:380,type:"tax",label:"TAXES"},
  {x:810,y:380,type:"life",label:"LIFE TILE"},
  {x:810,y:260,type:"action",label:"ACTION"},
  {x:700,y:260,type:"payday",label:"PAYDAY"},
  {x:590,y:260,type:"family",label:"ADOPT PET"},
  {x:480,y:260,type:"career",label:"RAISE"},
  {x:370,y:260,type:"action",label:"ACTION"},
  {x:260,y:260,type:"payday",label:"PAYDAY"},
  {x:150,y:260,type:"life",label:"LIFE TILE"},
  {x:40,y:260,type:"house",label:"HOUSE"},
  {x:40,y:140,type:"payday",label:"PAYDAY"},
  {x:150,y:140,type:"action",label:"ACTION"},
  {x:260,y:140,type:"tax",label:"TAXES"},
  {x:370,y:140,type:"family",label:"FAMILY"},
  {x:480,y:140,type:"payday",label:"PAYDAY"},
  {x:590,y:140,type:"life",label:"LIFE TILE"},
  {x:700,y:140,type:"action",label:"ACTION"},
  {x:810,y:140,type:"retire",label:"RETIRE"}
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
$("drawCareerBtn").onclick = drawCareer;
$("buyHouseBtn").onclick = buyHouse;
$("sellHouseBtn").onclick = sellHouse;
$("repayLoanBtn").onclick = repayLoan;
$("retireBtn").onclick = retire;
$("endTurnBtn").onclick = () => endTurn();

function freshState(){return{status:"lobby",players:[],current:0,spin:0,log:[],winnerId:null,lastEvent:null};}

function openLobby(kind){
  mode = kind === "join" ? "online" : kind;
  isHost = kind !== "join" && kind !== "online";
  gameCode = null; myId = null; state = freshState();
  $("homeScreen").classList.add("hidden"); $("gameScreen").classList.add("hidden"); $("lobbyScreen").classList.remove("hidden");
  $("codeBox").classList.add("hidden"); $("joinCode").classList.toggle("hidden", kind !== "join");
  $("startBtn").classList.add("hidden"); $("playersList").innerHTML=""; $("statusText").textContent=""; $("lobbyAction").classList.remove("hidden"); $("playerName").value="";
  $("lobbyTitle").textContent = kind==="solo" ? "Single Player" : kind==="local" ? "Pass-and-Play Lobby" : "Join Online Game";
  $("lobbyHelp").textContent = kind==="solo" ? "Enter your name. Computer players will join." : kind==="local" ? "Add 2–6 players." : "Enter the game code and your name.";
}

function showHome(){ stopSync(); $("homeScreen").classList.remove("hidden"); $("lobbyScreen").classList.add("hidden"); $("gameScreen").classList.add("hidden"); }

async function hostOnline(){
  mode="online"; isHost=true; myId=makeId(); gameCode=makeCode(); state=freshState();
  const {error}=await supabase.from("life_games").insert({code:gameCode,state});
  if(error) return msg("Supabase Error", error.message + " — Run life-supabase-setup.sql first.");
  subscribe(gameCode);
  $("homeScreen").classList.add("hidden"); $("lobbyScreen").classList.remove("hidden");
  $("lobbyTitle").textContent="Host Online Game"; $("lobbyHelp").textContent="Share the code. Add yourself, then start.";
  $("codeBox").classList.remove("hidden"); $("codeText").textContent=gameCode; $("joinCode").classList.add("hidden"); $("startBtn").classList.remove("hidden");
}

async function lobbyAction(){
  const name=$("playerName").value.trim(); if(!name) return msg("Name needed","Enter a player name.");
  if(mode==="solo"){
    state=freshState(); addPlayer(name,"human"); ["Bot Sky","Bot Sunny","Bot Rose"].forEach(n=>addPlayer(n,"bot"));
    myId=state.players[0].id; isHost=true; return startGame();
  }
  if(mode==="local"){
    if(state.players.length>=6) return msg("Full","Maximum 6 players.");
    addPlayer(name,"human"); $("playerName").value=""; renderLobby(); $("startBtn").classList.toggle("hidden",state.players.length<2); return;
  }
  if(mode==="online" && !isHost){
    const code=$("joinCode").value.trim().toUpperCase();
    const {data,error}=await supabase.from("life_games").select("state").eq("code",code).single();
    if(error||!data) return msg("Game not found","Check the code and try again.");
    state=data.state; gameCode=code; myId=makeId();
    if(state.status!=="lobby") return msg("Already started","That game has already started.");
    if(state.players.length>=6) return msg("Full","That game already has 6 players.");
    state.players.push(makePlayer(name,"human",state.players.length,myId));
    await saveState(); subscribe(code);
    $("codeBox").classList.remove("hidden"); $("codeText").textContent=code; $("joinCode").classList.add("hidden"); $("lobbyAction").classList.add("hidden");
    $("statusText").textContent="Joined. Waiting for host."; renderLobby(); return;
  }
  if(mode==="online" && isHost){
    if(state.players.some(p=>p.id===myId)) return;
    state.players.push(makePlayer(name,"human",state.players.length,myId)); await saveState(); $("playerName").value=""; renderLobby();
  }
}

function addPlayer(name,kind){state.players.push(makePlayer(name,kind,state.players.length));}
function makePlayer(name,kind,i,id=makeId()){
  return {id,name,kind,color:colors[i%colors.length],pos:0,cash:200000,loans:0,career:null,salary:0,tax:0,house:null,married:false,kids:0,pets:0,lifeTiles:0,pathChosen:false,retired:false,moved:false};
}

async function startGame(){
  if(state.players.length<2) return msg("Need players","Add at least 2 players.");
  state.status="playing"; state.log=["Welcome to the road of life! First choose College or Career."];
  await changed(); enterGame(); openEvent("🚗","Game Start","Welcome to Life Road","Choose College or Career, then spin your way to retirement.",["Highest final net worth wins."]);
}

function enterGame(){ $("homeScreen").classList.add("hidden"); $("lobbyScreen").classList.add("hidden"); $("gameScreen").classList.remove("hidden"); renderAll(); setTimeout(botTurn,600); }

function renderLobby(){
  $("playersList").innerHTML="";
  state.players.forEach((p,i)=>{const s=document.createElement("span");s.className="chip";s.innerHTML=`<span class="token" style="background:${p.color}">${escapeHtml(p.name[0])}</span>${i+1}. ${escapeHtml(p.name)}${p.kind==="bot"?" / Bot":""}`;$("playersList").appendChild(s);});
}

function renderAll(){ if(state.status==="lobby") return renderLobby(); if(state.status==="playing"||state.status==="ended"){ if($("gameScreen").classList.contains("hidden")) enterGame(); renderSide(); renderBoard(); } }

function renderSide(){
  const p=cur(), me=viewer();
  $("turnName").textContent=p?.name||"—"; $("youName").textContent=me?`You: ${me.name}`:"You: spectator"; $("phaseText").textContent=state.status==="ended"?"Game Over":p?.retired?"Retired":p?.pathChosen?"Spin and move":"Choose path";
  $("spinnerValue").textContent=state.spin||"?";
  const mine=isMyTurn();
  $("spinBtn").disabled=!mine||state.status!=="playing"||!p?.pathChosen||p.moved||p.retired;
  $("choosePathBtn").disabled=!mine||state.status!=="playing"||p?.pathChosen||p?.retired;
  $("drawCareerBtn").disabled=!mine||state.status!=="playing"||!p?.pathChosen||p?.retired;
  $("buyHouseBtn").disabled=!mine||state.status!=="playing"||p?.retired;
  $("sellHouseBtn").disabled=!mine||state.status!=="playing"||!p?.house||p?.retired;
  $("repayLoanBtn").disabled=!mine||state.status!=="playing"||p?.loans<=0;
  $("retireBtn").disabled=!mine||state.status!=="playing"||p?.pos<path.length-1||p?.retired;
  $("endTurnBtn").disabled=!mine||state.status!=="playing";
  $("turnBadge").textContent=state.status==="ended"?"Game Over":mine?"Your Turn":"Waiting";
  renderStats(me||p); renderScoreboard(); renderCards(me||p);
  $("log").innerHTML=[...state.log].reverse().slice(0,90).map(x=>`<p>${escapeHtml(x)}</p>`).join("");
}

function renderStats(p){
  if(!p)return;
  $("myStats").innerHTML=`
    <div class="stat"><strong>Cash:</strong> <span class="money">${money(p.cash)}</span></div>
    <div class="stat"><strong>Loans:</strong> <span class="debt">${money(p.loans)}</span></div>
    <div class="stat"><strong>Family:</strong> ${p.married?"Married":"Single"}, ${p.kids} kid${p.kids===1?"":"s"}, ${p.pets} pet${p.pets===1?"":"s"}</div>
    <div class="stat"><strong>Life Tiles:</strong> ${p.lifeTiles}</div>
    <div class="stat"><strong>Net Worth:</strong> <span class="money">${money(netWorth(p))}</span></div>`;
}

function renderCards(p){
  $("careerCard").innerHTML=`<p class="label">Career Card</p><h3>${p?.career||"No career yet"}</h3><p>${p?.salary?`Salary: ${money(p.salary)}<br>Tax: ${money(p.tax)}`:"Choose a path first."}</p>`;
  $("houseCard").innerHTML=`<p class="label">House Card</p><h3>${p?.house?.name||"No house yet"}</h3><p>${p?.house?`Cost: ${money(p.house.price)}<br>Sell value: ${money(p.house.sell)}`:"Open the House Shop to buy one."}</p>`;
}

function renderScoreboard(){
  $("scoreboard").innerHTML=[...state.players].sort((a,b)=>netWorth(b)-netWorth(a)).map(p=>`
    <div class="player-row"><strong><span class="token" style="background:${p.color}">${escapeHtml(p.name[0])}</span> ${escapeHtml(p.name)} ${p.retired?"🏁":""}</strong>
    <span>Net worth: <span class="money">${money(netWorth(p))}</span></span><span class="hint">${p.career||"No career"} • ${p.house?.name||"No house"}</span></div>`).join("");
}

function renderBoard(){
  const board=$("board"); board.innerHTML="";
  for(let i=0;i<path.length-1;i++){
    const a=path[i], b=path[i+1];
    const dx=b.x-a.x, dy=b.y-a.y, len=Math.sqrt(dx*dx+dy*dy), ang=Math.atan2(dy,dx)*180/Math.PI;
    const road=document.createElement("div"); road.className="road"; road.style.left=(a.x+46)+"px"; road.style.top=(a.y+32)+"px"; road.style.width=len+"px"; road.style.transform=`rotate(${ang}deg)`; board.appendChild(road);
  }
  path.forEach((t,i)=>{
    const tile=document.createElement("div"); tile.className=`tile ${t.type} ${i===cur()?.pos?"current":""}`; tile.style.left=t.x+"px"; tile.style.top=t.y+"px"; tile.innerHTML=`<strong>${i}</strong><br>${escapeHtml(t.label)}`;
    const here=state.players.filter(p=>p.pos===i);
    if(here.length){const h=document.createElement("div");h.className="tokens";here.forEach(p=>{const tok=document.createElement("span");tok.className="token";tok.style.background=p.color;tok.textContent=p.name[0];tok.title=p.name;tok.style.opacity=p.retired?.5:1;h.appendChild(tok)});tile.appendChild(h)}
    board.appendChild(tile);
  });
}

async function choosePath(){
  const p=cur();
  const choice=await choose("Choose Your Path",[
    {value:"college",label:"Go to College: borrow $100,000, then draw a high-paying career"},
    {value:"career",label:"Start Career: no college loan, start earning now"}
  ]);
  if(!choice)return;
  if(choice==="college"){p.loans+=100000;p.cash+=40000;drawCareerFor(p,true);state.log.push(`${p.name} chose College, borrowed $100,000, and drew ${p.career}.`);openEvent("🎓","Path Choice","College Path",`${p.name} borrowed $100,000 and became a ${p.career}.`,[`Salary: ${money(p.salary)}`,`Tax: ${money(p.tax)}`]);}
  else{drawCareerFor(p,false);state.log.push(`${p.name} chose Career and drew ${p.career}.`);openEvent("💼","Path Choice","Career Path",`${p.name} started as a ${p.career}.`,[`Salary: ${money(p.salary)}`,`Tax: ${money(p.tax)}`]);}
  p.pathChosen=true; await changed();
}

async function drawCareer(){
  const p=cur(); const college=p.loans>0; drawCareerFor(p,college); state.log.push(`${p.name} drew a new career: ${p.career}.`);
  openEvent("💼","Career Card",p.career,`${p.name} drew a new career card.`,[`Salary: ${money(p.salary)}`,`Tax: ${money(p.tax)}`]);
  await changed();
}
function drawCareerFor(p,college){const c=pick(college?collegeCareers:careerCareers);p.career=c.name;p.salary=c.salary;p.tax=c.tax;}

async function spin(){
  const p=cur(); const spin=1+Math.floor(Math.random()*10); state.spin=spin;
  animateSpinner(spin);
  const old=p.pos; p.pos=Math.min(path.length-1,p.pos+spin); p.moved=true; state.log.push(`${p.name} spun ${spin} and moved from ${old} to ${p.pos}.`);
  await delay(650);
  resolveTile(p,path[p.pos]); checkEnd(); await changed();
}

function resolveTile(p,t){
  if(t.type==="payday"){p.cash+=p.salary;state.log.push(`PAYDAY! ${p.name} collected ${money(p.salary)}.`);moneyBurst(`+${money(p.salary)}`);openEvent("💰","Payday","Payday!",`${p.name} collected their salary.`,[`+${money(p.salary)}`]);}
  if(t.type==="tax"){p.cash-=p.tax;state.log.push(`${p.name} paid taxes: ${money(p.tax)}.`);moneyBurst(`-${money(p.tax)}`);openEvent("🧾","Taxes","Tax Time",`${p.name} paid taxes.`,[`-${money(p.tax)}`]);}
  if(t.type==="career"){p.salary+=20000;p.cash+=30000;state.log.push(`${p.name} got a career upgrade: +$20,000 salary and $30,000 bonus.`);openEvent("🚀","Career Boost","Promotion!",`${p.name} got a career boost.`,["+ $20,000 salary","+ $30,000 cash"]);moneyBurst("+$30,000");}
  if(t.type==="action"){const a=pick(actionCards);p.cash+=a.cash||0;p.lifeTiles+=a.life||0;p.salary+=a.raise||0;state.log.push(`${p.name}: ${a.text}`);openEvent(a.icon||"🎴","Action Card","Action Card",a.text,[a.cash?`${a.cash>0?"+":"-"}${money(Math.abs(a.cash))}`:null,a.life?`+${a.life} Life Tile`:null,a.raise?`+${money(a.raise)} Salary`:null].filter(Boolean));if(a.cash)moneyBurst(`${a.cash>0?"+":"-"}${money(Math.abs(a.cash))}`);}
  if(t.type==="life"){p.lifeTiles+=1;p.cash+=20000;state.log.push(`${p.name} collected a Life Tile and $20,000.`);openEvent("⭐","Life Tile","Life Tile!",`${p.name} collected a Life Tile and bonus cash.`,["+1 Life Tile","+$20,000"]);moneyBurst("+$20,000");}
  if(t.type==="family"){
    if(!p.married){p.married=true;p.cash-=25000;p.lifeTiles+=1;state.log.push(`${p.name} got married! Pay $25,000 and collect a Life Tile.`);openEvent("💍","Family","Wedding Day!",`${p.name} got married.`,["-$25,000","+1 Life Tile"]);}
    else{const k=Math.random()<.75?1:2;p.kids+=k;p.cash-=k*15000;p.lifeTiles+=k;state.log.push(`${p.name} welcomed ${k} kid${k===1?"":"s"}! Pay ${money(k*15000)} and collect ${k} Life Tile${k===1?"":"s"}.`);openEvent("👶","Family",k===2?"Twins!":"Baby Time!",`${p.name} welcomed ${k} kid${k===1?"":"s"}.`,[`-${money(k*15000)}`,`+${k} Life Tile${k===1?"":"s"}`]);}
  }
  if(t.label==="ADOPT PET"){p.pets+=1;p.lifeTiles+=1;state.log.push(`${p.name} adopted a pet and collected a Life Tile.`);openEvent("🐶","Family","Adopt a Pet!",`${p.name} adopted a pet.`,["+1 Pet","+1 Life Tile"]);}
  if(t.type==="house"){state.log.push(`${p.name} landed on a House space. They may buy or upgrade.`);openEvent("🏠","House Space","House Shop Open",`${p.name} may buy or upgrade a house.`,["Click House Shop when ready."]);}
  if(t.type==="retire"){state.log.push(`${p.name} reached retirement. Click Retire when ready.`);openEvent("🏁","Retirement","Retirement Zone",`${p.name} reached retirement.`,["Sell your house and cash in Life Tiles."]);}
}

async function buyHouse(){
  const p=cur(); const current=p.house?houses.findIndex(h=>h.name===p.house.name):-1; const options=houses.slice(current+1);
  if(!options.length)return msg("No upgrade","You already have the best house.");
  const c=await chooseCard("House Shop",options.map((h,i)=>({value:String(i),title:h.name,body:`Cost: ${money(h.price)}<br>Sell value: ${money(h.sell)}`,emoji:"🏠"})));
  if(c===null)return; const h=options[Number(c)]; p.cash-=h.price;p.house=h;state.log.push(`${p.name} bought ${h.name} for ${money(h.price)}.`);openEvent("🏠","House Card",h.name,`${p.name} bought a house.`,[`Cost: ${money(h.price)}`,`Sell value: ${money(h.sell)}`]); await changed();
}
async function sellHouse(){const p=cur(); if(!p.house)return; p.cash+=p.house.sell; moneyBurst(`+${money(p.house.sell)}`); openEvent("🏠","House Sold",p.house.name,`${p.name} sold their house.`,[`+${money(p.house.sell)}`]); state.log.push(`${p.name} sold ${p.house.name} for ${money(p.house.sell)}.`); p.house=null; await changed();}
async function repayLoan(){const p=cur(); const amt=Math.min(20000,p.loans); p.loans-=amt; p.cash-=amt; state.log.push(`${p.name} repaid ${money(amt)} in loans.`);openEvent("🏦","Loan Payment","Loan Repaid",`${p.name} repaid part of their loans.`,[`-${money(amt)}`]); await changed();}
async function retire(){const p=cur(); p.retired=true; let details=[]; if(p.house){p.cash+=p.house.sell;details.push(`House sale: +${money(p.house.sell)}`);state.log.push(`${p.name} sold ${p.house.name} for ${money(p.house.sell)} at retirement.`);p.house=null} const lifeCash=p.lifeTiles*50000;p.cash+=lifeCash;details.push(`Life Tiles: +${money(lifeCash)}`);details.push(`Final net worth: ${money(netWorth(p))}`); state.log.push(`${p.name} retired and cashed Life Tiles for ${money(lifeCash)}.`);openEvent("🏁","Retirement","Retirement!",`${p.name} retired.`,details); checkEnd(); await changed(); if(state.status!=="ended") endTurn(true);}

async function endTurn(force=false){
  if(!force&&!isMyTurn())return; cur().moved=false; state.spin=0;
  if(state.players.every(p=>p.retired)){checkEnd();await changed();return}
  do{state.current=(state.current+1)%state.players.length}while(cur().retired);
  state.log.push(`It is now ${cur().name}'s turn.`); await changed(); setTimeout(botTurn,600);
}

async function botTurn(){
  if(mode!=="solo"||cur()?.kind!=="bot"||state.status!=="playing")return;
  setTimeout(async()=>{const p=cur(); if(!p.pathChosen){const college=Math.random()>.5; if(college){p.loans+=100000;p.cash+=40000;drawCareerFor(p,true);state.log.push(`${p.name} chose College and became ${p.career}.`)}else{drawCareerFor(p,false);state.log.push(`${p.name} started a Career as ${p.career}.`)}p.pathChosen=true}
  else if(p.pos>=path.length-1){p.retired=true;if(p.house){p.cash+=p.house.sell;p.house=null}p.cash+=p.lifeTiles*50000;state.log.push(`${p.name} retired.`)}
  else{const spin=1+Math.floor(Math.random()*10);state.spin=spin;p.pos=Math.min(path.length-1,p.pos+spin);p.moved=true;state.log.push(`${p.name} spun ${spin} and moved to ${p.pos}.`);resolveTile(p,path[p.pos]); if(!p.house&&Math.random()>.72){p.house=houses[0];p.cash-=houses[0].price;state.log.push(`${p.name} bought ${houses[0].name}.`)}} checkEnd(); await changed(); if(state.status!=="ended")endTurn(true);},900);
}

function checkEnd(){if(state.players.every(p=>p.retired)){state.status="ended";const w=[...state.players].sort((a,b)=>netWorth(b)-netWorth(a))[0];state.winnerId=w.id;state.log.push(`${w.name} wins with ${money(netWorth(w))}!`);msg("Game Over",`${w.name} wins with ${money(netWorth(w))}!`)}}
function netWorth(p){return p.cash+(p.house?.sell||0)+(p.married?50000:0)+p.kids*30000+p.pets*15000+p.lifeTiles*50000-p.loans}

async function choose(title,options){return new Promise(resolve=>{$("dialogTitle").textContent=title;$("dialogBody").innerHTML=`<div class="dialog-grid"><label>Choose<select id="choicePick">${options.map(o=>`<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join("")}</select></label></div>`;$("choiceDialog").showModal();const h=()=>{$("choiceDialog").removeEventListener("close",h);if($("choiceDialog").returnValue!=="submit")return resolve(null);resolve($("choicePick").value)};$("choiceDialog").addEventListener("close",h)})}
async function chooseCard(title,cards){return new Promise(resolve=>{$("dialogTitle").textContent=title;$("dialogBody").innerHTML=`<div class="dialog-grid">${cards.map(c=>`<button value="${escapeHtml(c.value)}" class="big-card house-card card-choice" type="button"><h3>${c.emoji} ${escapeHtml(c.title)}</h3><p>${c.body}</p></button>`).join("")}</div>`;$("choiceDialog").showModal();document.querySelectorAll(".card-choice").forEach(btn=>btn.onclick=()=>{$("choiceDialog").close("submit");resolve(btn.value)});const h=()=>{$("choiceDialog").removeEventListener("close",h);if($("choiceDialog").returnValue!=="submit")resolve(null)};$("choiceDialog").addEventListener("close",h)})}

function openEvent(icon,kicker,title,text,details=[]){$("eventIcon").textContent=icon;$("eventKicker").textContent=kicker;$("eventTitle").textContent=title;$("eventText").textContent=text;$("eventDetails").innerHTML=details.map(d=>`<div class="event-detail">${escapeHtml(d)}</div>`).join("");if(!$("eventDialog").open)$("eventDialog").showModal();}
function moneyBurst(text){const el=$("moneyBurst");el.textContent=text;el.classList.remove("hidden");el.style.animation="none";void el.offsetWidth;el.style.animation="burst 1.1s ease forwards";setTimeout(()=>el.classList.add("hidden"),1100)}
function animateSpinner(value){const sp=$("spinner");sp.classList.add("spinning");const deg=720+value*36+Math.floor(Math.random()*20);sp.style.transform=`rotate(${deg}deg)`;setTimeout(()=>sp.classList.remove("spinning"),900);}
function delay(ms){return new Promise(r=>setTimeout(r,ms));}

async function changed(){if(mode==="online")await saveState();renderAll()}
async function saveState(){const{error}=await supabase.from("life_games").update({state,updated_at:new Date().toISOString()}).eq("code",gameCode);if(error)msg("Save Error",error.message)}
function subscribe(code){stopSync();channel=supabase.channel(`life-${code}`).on("postgres_changes",{event:"UPDATE",schema:"public",table:"life_games",filter:`code=eq.${code}`},p=>receiveState(p.new.state)).subscribe();pollTimer=setInterval(fetchLatest,1500);fetchLatest()}
async function fetchLatest(){if(!gameCode)return;const{data}=await supabase.from("life_games").select("state").eq("code",gameCode).single();if(data?.state)receiveState(data.state)}
function receiveState(next){const was=state.status==="lobby";state=next;if(state.status==="playing"&&was)enterGame();else renderAll()}
function stopSync(){if(channel)supabase.removeChannel(channel);if(pollTimer)clearInterval(pollTimer);channel=null;pollTimer=null}
function cur(){return state.players[state.current]} function viewer(){return mode==="online"?state.players.find(p=>p.id===myId):mode==="local"?cur():state.players.find(p=>p.id===myId)||state.players[0]} function isMyTurn(){return state.status==="playing"&&(mode==="local"||cur()?.id===myId)}
function makeCode(){const a="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";return Array.from({length:6},()=>a[Math.floor(Math.random()*a.length)]).join("")} function makeId(){return"p_"+Math.random().toString(36).slice(2,10)} function pick(a){return a[Math.floor(Math.random()*a.length)]} function money(n){return "$"+Math.round(n).toLocaleString()} function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))} function msg(t,x){$("msgTitle").textContent=t;$("msgText").textContent=x;$("msgDialog").showModal()}
