(() => {
  "use strict";

  // ─── CONSTANTS ───────────────────────────────────────────────────────────────
  const SAVE_KEY  = "mr-macs-empire-ascendant-v1";
  const COLS      = 14;
  const ROWS      = 10;
  const MAX_TURNS = 200;
  // Phase 5: lite-mode flag — combines viewport width, prefers-reduced-motion, and arcade-perf.js
  function FX_LITE_CHECK(){
    if(window.MrMacsArcadePerf) return window.MrMacsArcadePerf.isLite();
    return window.matchMedia("(max-width:900px)").matches||
           window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  }
  // Evaluated once at game start; reactive updates (profile setting changes) handled via onChange below
  let FX_LITE = FX_LITE_CHECK();
  if(window.MrMacsArcadePerf) window.MrMacsArcadePerf.onChange(function(lite){ FX_LITE=lite; });
  const SourceBank = window.MrMacsSourceBank || null;
  // Source render validation contract: stimulusImagesFor(q).

  const ERAS = ["Ancient", "Classical", "Medieval", "Industrial"];

  // Civilizations: player + 3 AI
  const CIVS = {
    player:  { name: "Mac Dynasty",         color: "#f2c14e", fill: "rgba(242,193,78,.26)",  personality: "player"      },
    north:   { name: "Northern League",     color: "#7bdff2", fill: "rgba(123,223,242,.20)", personality: "expansionist"},
    steppe:  { name: "Steppe Confederation",color: "#d98a5d", fill: "rgba(217,138,93,.20)",  personality: "military"    },
    ocean:   { name: "Ocean Compact",       color: "#b79cff", fill: "rgba(183,156,255,.19)", personality: "science"     }
  };
  const AI_KEYS = ["north","steppe","ocean"];

  // Terrain: base yields gold/food/prod/science (g/f/p/s), movement cost
  const TERRAIN = {
    ocean:    { label:"Ocean",       color:"#1a3d5c", edge:"#2a6a9a", g:0,f:0,p:0,s:0,  mv:99,  impassable:true  },
    coast:    { label:"Coast",       color:"#315e7d", edge:"#7bdff2", g:1,f:2,p:0,s:0,  mv:1    },
    plains:   { label:"Plains",      color:"#5d8d58", edge:"#9ccc7a", g:1,f:2,p:1,s:0,  mv:1    },
    grassland:{ label:"Grassland",   color:"#3a7a44", edge:"#6dc86d", g:1,f:3,p:0,s:0,  mv:1    },
    desert:   { label:"Desert",      color:"#9c7a44", edge:"#f2c14e", g:0,f:0,p:1,s:1,  mv:1    },
    forest:   { label:"Forest",      color:"#2f714f", edge:"#77d99b", g:0,f:1,p:2,s:0,  mv:2    },
    hills:    { label:"Hills",       color:"#83684d", edge:"#d98a5d", g:0,f:0,p:2,s:1,  mv:2    },
    river:    { label:"River Valley",color:"#3f8d86", edge:"#7bdff2", g:1,f:3,p:0,s:1,  mv:1    },
    mountain: { label:"Mountains",   color:"#66727a", edge:"#c9d0d4", g:0,f:0,p:1,s:2,  mv:3,   impassable:false }
  };

  // Strategic resources: tile bonus + unit/building buff label
  // Note: glyphs are rendered on canvas via drawResourceGlyph() — these `glyph`
  // labels are reference text only (used in tooltips / future UI). Avoid color
  // emoji to preserve the monoline editorial aesthetic on iOS Safari.
  const RESOURCES = {
    iron:   { label:"Iron",   color:"#c0b9c0", glyph:"⚙", bonusProd:2, unlockUnit:"horseman" },
    horses: { label:"Horses", color:"#c8a96e", glyph:"⚞", bonusProd:1, unlockUnit:"horseman" },
    gold_r: { label:"Gold",   color:"#f2c14e", glyph:"✦", bonusGold:3  },
    silk:   { label:"Silk",   color:"#e8a0d0", glyph:"◈", bonusGold:2, bonusCulture:1 },
    scrolls:{ label:"Scrolls",color:"#7bdff2", glyph:"⌬", bonusSci:2   }
  };

  // Technology tree (4 eras, 0-indexed)
  const TECHS = [
    // Era 0 – Ancient
    { id:"agriculture", era:0, name:"Agriculture",    cost:30,  unlocks:"farms",              effect:{food:1}, quote:"Surplus grain gives rulers their first power." },
    { id:"writing",     era:0, name:"Writing",        cost:35,  unlocks:"libraries, scholars", effect:{sci:1},  quote:"Records outlast rulers." },
    { id:"bronze",      era:0, name:"Bronze Working", cost:40,  unlocks:"warriors, forts",     effect:{prod:1}, quote:"Metals reshape war and authority." },
    // Era 1 – Classical
    { id:"navigation",  era:1, name:"Navigation",     cost:70,  unlocks:"harbors, galleys",    effect:{gold:2}, quote:"Coasts become bridges, not borders." },
    { id:"civil_svc",   era:1, name:"Civil Service",  cost:80,  unlocks:"admin buildings",     effect:{gold:1,food:1}, quote:"Offices outlast kings." },
    { id:"currency",    era:1, name:"Currency",       cost:75,  unlocks:"markets",             effect:{gold:3}, quote:"Abstracted value enables empire-scale trade." },
    // Era 2 – Medieval
    { id:"guilds",      era:2, name:"Guilds",         cost:130, unlocks:"workshops, archers",  effect:{prod:2}, quote:"Specialized labor turns cities into engines." },
    { id:"printing",    era:2, name:"Printing Press", cost:150, unlocks:"universities",        effect:{sci:3},  quote:"Ideas travel faster than armies." },
    { id:"chivalry",    era:2, name:"Chivalry",       cost:140, unlocks:"knight units",        effect:{prod:1}, quote:"Mounted warriors reshape the battlefield." },
    // Era 3 – Industrial
    { id:"economics",   era:3, name:"Economics",      cost:220, unlocks:"banks, trade posts",  effect:{gold:4}, quote:"Systematic wealth creation reshapes society." },
    { id:"steam",       era:3, name:"Steam Power",    cost:240, unlocks:"factories, railroads", effect:{prod:4}, quote:"Distance shrinks when steel links markets." },
    { id:"enlighten",   era:3, name:"Enlightenment",  cost:260, unlocks:"research labs",       effect:{sci:5},  quote:"Reason as the basis of authority." }
  ];

  // Buildings: per city build queue items
  const BUILDINGS = {
    granary:    { name:"Granary",     cost:60,  effect:{food:2},       requires:null,         era:0, desc:"Reduces food needed to grow." },
    barracks:   { name:"Barracks",    cost:80,  effect:{prod:1},       requires:"bronze",     era:0, desc:"Trains military units faster." },
    library:    { name:"Library",     cost:90,  effect:{sci:2},        requires:"writing",    era:0, desc:"City generates science." },
    walls:      { name:"Walls",       cost:100, effect:{defense:4},    requires:"bronze",     era:0, desc:"+4 defense vs siege." },
    market:     { name:"Market",      cost:110, effect:{gold:2},       requires:"currency",   era:1, desc:"City trades for gold." },
    harbor:     { name:"Harbor",      cost:120, effect:{gold:2,food:1},requires:"navigation", era:1, desc:"Coastal gold and food bonus." },
    temple:     { name:"Temple",      cost:130, effect:{food:1,gold:1},requires:"civil_svc",  era:1, desc:"Culture and faith stability." },
    workshop:   { name:"Workshop",    cost:150, effect:{prod:3},       requires:"guilds",     era:2, desc:"Production multiplier." },
    university: { name:"University",  cost:180, effect:{sci:4},        requires:"printing",   era:2, desc:"Major science output." },
    castle:     { name:"Castle",      cost:160, effect:{defense:6},    requires:"chivalry",   era:2, desc:"Heavy fortification." },
    bank:       { name:"Bank",        cost:200, effect:{gold:5},       requires:"economics",  era:3, desc:"Large gold per turn." },
    factory:    { name:"Factory",     cost:240, effect:{prod:6},       requires:"steam",      era:3, desc:"Industrial output spike." },
    research_lab:{ name:"Research Lab",cost:260,effect:{sci:7},       requires:"enlighten",  era:3, desc:"Top science building." }
  };

  // Wonders (one per empire)
  const WONDERS = [
    { id:"great_wall",   name:"Great Wall",          era:0, requires:"bronze",     cost:{prod:200}, effect:{defense:8,stability:10}, desc:"Slows rival expansion at your borders." },
    { id:"great_library",name:"Great Library",       era:0, requires:"writing",    cost:{prod:220}, effect:{sci:20,gold:5},          desc:"Scholars gather the world's knowledge." },
    { id:"colosseum",    name:"Colosseum",           era:1, requires:"civil_svc",  cost:{prod:260}, effect:{gold:8,stability:15},    desc:"Public spectacle breeds loyalty." },
    { id:"silk_road",    name:"Silk Road Exchange",  era:1, requires:"navigation", cost:{prod:280}, effect:{gold:15,sci:5},          desc:"Merchants carry goods and ideas." },
    { id:"print_house",  name:"Printing Quarter",    era:2, requires:"printing",   cost:{prod:340}, effect:{sci:12,gold:6},          desc:"Ideas travel as fast as horses." },
    { id:"cathedral",    name:"Grand Cathedral",     era:2, requires:"chivalry",   cost:{prod:320}, effect:{stability:20,gold:6},    desc:"Faith and stone cement the realm." },
    { id:"stock_exchange",name:"Stock Exchange",     era:3, requires:"economics",  cost:{prod:400}, effect:{gold:25,sci:10},         desc:"Abstracted value moves markets." },
    { id:"rail_hub",     name:"Rail Hub",            era:3, requires:"steam",      cost:{prod:440}, effect:{prod:20,gold:10},        desc:"Resources and armies move at speed." },
    { id:"mission_mars", name:"Mission to Mars",     era:3, requires:"enlighten",  cost:{prod:500,sci:200}, effect:{sci:30},         desc:"Science victory Wonder." }
  ];

  // Unit definitions
  const UNIT_DEFS = {
    worker:   { name:"Worker",   cost:40,  str:0,  range:0, mv:2, requires:null,       era:0, desc:"Builds tile improvements." },
    settler:  { name:"Settler",  cost:80,  str:0,  range:0, mv:2, requires:null,       era:0, desc:"Founds a new city." },
    warrior:  { name:"Warrior",  cost:60,  str:10, range:0, mv:2, requires:"bronze",   era:0, desc:"Basic melee fighter." },
    archer:   { name:"Archer",   cost:80,  str:8,  range:2, mv:2, requires:"guilds",   era:2, desc:"Ranged attacker, 2-tile range." },
    horseman: { name:"Horseman", cost:100, str:18, range:0, mv:4, requires:"guilds",   era:2, desc:"Fast cavalry. Needs iron or horses." },
    knight:   { name:"Knight",   cost:140, str:28, range:0, mv:4, requires:"chivalry", era:2, desc:"Heavy cavalry." },
    scholar:  { name:"Scholar",  cost:80,  str:0,  range:0, mv:2, requires:"writing",  era:0, desc:"+2 science per turn while in city." }
  };

  // Terrain improvements workers can build
  const IMPROVEMENTS = {
    farm:       { name:"Farm",        terrain:["plains","grassland","river"],           cost:3, yields:{food:2}, requires:null           },
    mine:       { name:"Mine",        terrain:["hills","mountain","desert"],            cost:3, yields:{prod:2}, requires:"bronze"       },
    lumbercamp: { name:"Lumber Camp", terrain:["forest"],                               cost:2, yields:{prod:2}, requires:null           },
    trading_post:{ name:"Trade Post", terrain:["plains","grassland","desert","hills"],  cost:3, yields:{gold:2}, requires:"currency"     },
    fishing_boats:{ name:"Fishing",   terrain:["coast","river"],                        cost:2, yields:{food:2,gold:1}, requires:"navigation" }
  };

  // ─── CANVAS / VIEW ───────────────────────────────────────────────────────────
  const canvas = document.getElementById("empireCanvas");
  const ctx    = canvas.getContext("2d", { alpha: false });

  const view = {
    w:0, h:0, dpr:1,
    size:44,          // hex radius
    ox:0, oy:0,       // map origin
    panX:0, panY:0,   // camera pan offset
    zoom:1,
    dragging:false,
    dragStart:{x:0,y:0},
    pinchDist:0
  };

  // ─── GAME STATE ──────────────────────────────────────────────────────────────
  const state = {
    bank:null, filtered:[], queue:[],
    mode:"setup",         // setup | playing | council | menu | ended
    panel:"province",
    tiles:[], units:[],
    selected:null,        // selected tile
    selUnit:null,         // selected unit
    pendingMove:null,     // {unit, reachable[]} for movement
    pendingAction:null,
    turn:1, era:0,
    // resources per civ
    res:{
      player:  {gold:20,food:20,prod:20,sci:0,culture:10,stability:65},
      north:   {gold:20,food:20,prod:20,sci:0,culture:10,stability:65},
      steppe:  {gold:20,food:20,prod:20,sci:0,culture:10,stability:65},
      ocean:   {gold:20,food:20,prod:20,sci:0,culture:10,stability:65}
    },
    techs:{ // per civ: {active, progress, done[]}
      player: {active:"agriculture",progress:0,done:[]},
      north:  {active:"agriculture",progress:0,done:[]},
      steppe: {active:"bronze",     progress:0,done:[]},
      ocean:  {active:"writing",    progress:0,done:[]}
    },
    cities:[],            // {id,civ,tileId,name,pop,food,buildings:[],queue:[],wonders:[],turn}
    wonders:[],           // [{civId, wonderId}]
    diplomacy:{           // per pair: relation 0-100, war bool, alliance bool
      player_north:  {rel:40,war:false,alliance:false},
      player_steppe: {rel:30,war:false,alliance:false},
      player_ocean:  {rel:45,war:false,alliance:false},
      north_steppe:  {rel:35,war:false,alliance:false},
      north_ocean:   {rel:50,war:false,alliance:false},
      steppe_ocean:  {rel:30,war:false,alliance:false}
    },
    victory:null,
    score:0, councils:0, correct:0, missed:[],
    unitSeq:0, citySeq:0,
    particles:[], banners:[], floats:[],
    elapsed:0, last:0, cameraNudge:0,
    fog:{}               // tileId -> true if player has seen it
  };

  // ─── AUDIO ───────────────────────────────────────────────────────────────────
  class AudioBus {
    constructor(){ this.on=true; this.ac=null; }
    _ctx(){
      if(!this.on) return null;
      if(!this.ac) this.ac=new(window.AudioContext||window.webkitAudioContext)();
      if(this.ac.state==="suspended") this.ac.resume();
      return this.ac;
    }
    _tone(freq,dur=.08,type="sine",gain=.05,bend=1){
      const ac=this._ctx(); if(!ac) return;
      const t=ac.currentTime, o=ac.createOscillator(), g=ac.createGain();
      o.type=type; o.frequency.setValueAtTime(freq,t);
      if(bend!==1) o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*bend),t+dur);
      g.gain.setValueAtTime(.0001,t);
      g.gain.exponentialRampToValueAtTime(gain,t+.012);
      g.gain.exponentialRampToValueAtTime(.0001,t+dur);
      o.connect(g).connect(ac.destination);
      o.start(t); o.stop(t+dur+.04);
    }
    select(){ this._tone(380,.05,"triangle",.04,1.2); }
    move()  { this._tone(320,.04,"sine",.035,1.1); }
    combat(){ [220,340].forEach((f,i)=>setTimeout(()=>this._tone(f,.14,"sawtooth",.06,.5),i*60)); }
    found(){ [440,554,659,880].forEach((f,i)=>setTimeout(()=>this._tone(f,.10,"triangle",.055,1.05),i*55)); }
    tech_complete(){ [330,440,550,660,880].forEach((f,i)=>setTimeout(()=>this._tone(f,.12,"triangle",.05,1.08),i*60)); }
    era_advance(){ [392,494,659,880,988].forEach((f,i)=>setTimeout(()=>this._tone(f,.18,"triangle",.06,1.1),i*80)); }
    diplomacy(){ [440,370,440].forEach((f,i)=>setTimeout(()=>this._tone(f,.08,"sine",.045,1),i*90)); }
    correct(){ [440,554,659,880].forEach((f,i)=>setTimeout(()=>this._tone(f,.09,"triangle",.055,1.07),i*50)); }
    wrong()  { this._tone(180,.18,"sawtooth",.055,.5); }
    endturn(){ this._tone(260,.07,"triangle",.04,1.8); }
    toggle(){ this.on=!this.on; return this.on; }
  }
  const audio = new AudioBus();

  // ─── UTILITIES ───────────────────────────────────────────────────────────────
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const rng   = (a,b)=>a+Math.random()*(b-a);
  const fmtN  = v=>Math.max(0,Math.floor(v)).toLocaleString();
  const esc   = v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

  function shuffle(arr){
    const a=[...arr];
    for(let i=a.length-1;i>0;i--){const j=0|Math.random()*(i+1);[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }
  function cleanText(v){ return String(v||"").replace(/\s+/g," ").trim(); }
  function normalize(v){ return String(v||"").toLowerCase().replace(/[^a-z0-9 ]+/g," ").replace(/\b(the|a|an)\b/g," ").replace(/\s+/g," ").trim(); }

  function dipKey(a,b){
    const order=["player","north","steppe","ocean"];
    const ai=order.indexOf(a), bi=order.indexOf(b);
    return ai<bi?`${a}_${b}`:`${b}_${a}`;
  }
  function getDip(a,b){ return state.diplomacy[dipKey(a,b)]||{rel:50,war:false,alliance:false}; }
  function setDip(a,b,delta){ const d=getDip(a,b); d.rel=clamp(d.rel+delta,0,100); }

  // ─── MAP GENERATION ──────────────────────────────────────────────────────────
  function generateMap(){
    state.tiles=[];
    state.fog={};
    const terrainPool=[];
    // Noise-like procedural: create a 2-layer system
    for(let q=0;q<COLS;q++){
      for(let r=0;r<ROWS;r++){
        const id=`${q},${r}`;
        let terrain="plains";
        const edge=(q===0||q===COLS-1||r===0||r===ROWS-1);
        const waterEdge=(q<=1||q>=COLS-2);
        // Ocean edges
        if(waterEdge) terrain="ocean";
        else if(q===2||q===COLS-3) terrain="coast";
        else {
          const nx=(q-COLS/2)/COLS, ny=(r-ROWS/2)/ROWS;
          const h=Math.sin(q*.7+.4)*Math.cos(r*.9+.2)+Math.cos(q*.3)*Math.sin(r*.5)*.6;
          const riverBand=Math.abs(r-(4+Math.sin(q*.85)*1.5));
          if(q>9&&r<4) terrain="mountain";
          else if(riverBand<.7) terrain="river";
          else if(h>0.7) terrain="hills";
          else if(h<-0.6) terrain="desert";
          else if((q+r*2)%6===0) terrain="grassland";
          else if((q*3+r)%9===0&&!edge) terrain="forest";
          else terrain="plains";
        }
        // Sprinkle strategic resources (10% of non-ocean land)
        let resource=null;
        if(terrain!=="ocean"&&terrain!=="coast"&&Math.random()<.10){
          const pool=Object.keys(RESOURCES);
          const filtered=pool.filter(k=>{
            if(k==="iron") return ["hills","mountain","desert"].includes(terrain);
            if(k==="horses") return ["plains","grassland","desert"].includes(terrain);
            if(k==="gold_r") return ["hills","desert","river"].includes(terrain);
            if(k==="silk") return ["plains","grassland","forest"].includes(terrain);
            if(k==="scrolls") return ["river","coast","plains"].includes(terrain);
            return true;
          });
          if(filtered.length) resource=filtered[0|Math.random()*filtered.length];
        }
        state.tiles.push({
          id, q, r, terrain, resource,
          owner:null, city:null,
          improvement:null, wonder:null,
          fog:true,        // starts fogged
          pulse:Math.random()*Math.PI*2
        });
        terrainPool.push(id);
      }
    }

    // Place starting capitals
    const playerStart = getTile(3,5);
    const northStart  = getTile(COLS-4,2);
    const steppeStart = getTile(COLS-4,ROWS-3);
    const oceanStart  = getTile(5,1);

    [playerStart,northStart,steppeStart,oceanStart].forEach(t=>{
      if(t) t.terrain="plains"; // guarantee buildable
    });

    // Found initial cities
    if(playerStart) foundCity("player", playerStart, "Macopolis", true);
    if(northStart)  foundCity("north",  northStart,  "Northhaven", true);
    if(steppeStart) foundCity("steppe", steppeStart, "Steppehold", true);
    if(oceanStart)  foundCity("ocean",  oceanStart,  "Seaport",    true);

    // Give each civ a starting warrior
    spawnUnit("player","warrior",playerStart);
    spawnUnit("player","worker", getTile(3,6));
    spawnUnit("north", "warrior",northStart);
    spawnUnit("steppe","warrior",steppeStart);
    spawnUnit("ocean", "warrior",oceanStart);

    // Reveal fog for player start
    revealFog("player", playerStart, 3);
    state.selected = playerStart;
  }

  function getTile(q,r){ return state.tiles.find(t=>t.q===q&&t.r===r)||null; }
  function getTileById(id){ return state.tiles.find(t=>t.id===id)||null; }

  function neighbors(tile){
    const odd=tile.q%2;
    const dirs=odd?[[1,0],[1,1],[0,1],[-1,1],[-1,0],[0,-1]]:[[1,-1],[1,0],[0,1],[-1,0],[-1,-1],[0,-1]];
    return dirs.map(([dq,dr])=>getTile(tile.q+dq,tile.r+dr)).filter(Boolean);
  }

  function tileDistance(a,b){
    // cube coords
    const [aq,ar]=[a.q,a.r-(a.q-(a.q&1))/2];
    const [bq,br]=[b.q,b.r-(b.q-(b.q&1))/2];
    const as_=-(aq+ar), bs_=-(bq+br);
    return Math.max(Math.abs(aq-bq),Math.abs(ar-br),Math.abs(as_-bs_));
  }

  function revealFog(civId, tile, radius){
    if(civId!=="player") return;
    const visit=(t,d)=>{
      if(!t||state.fog[t.id]) return;
      state.fog[t.id]=true;
      t.fog=false;
      if(d<radius) neighbors(t).forEach(n=>visit(n,d+1));
    };
    visit(tile,0);
  }

  function tilesByOwner(civ){ return state.tiles.filter(t=>t.owner===civ); }
  function isPlayerAdjacent(tile){ return neighbors(tile).some(n=>n.owner==="player"); }

  // ─── CITIES ──────────────────────────────────────────────────────────────────
  const CITY_NAMES=["Aster","Atlas Ford","Rivergate","Summit Hold","Scholar's Port","Civic Crown","Liberty Vale","Meridian","Iron Cross","Harbor End","Oak Vale","Stonepeak","Amber Bay","Crestfall"];

  function foundCity(civId, tile, name, isCapital=false){
    if(!tile||tile.terrain==="ocean"||tile.city) return null;
    const cid=`city_${++state.citySeq}`;
    const cityName = name || CITY_NAMES[state.cities.length % CITY_NAMES.length];
    const city = {
      id:cid, civId, tileId:tile.id,
      name:cityName, pop:1, food:0, foodNeeded:15,
      buildings:[], buildQueue:null, buildProgress:0,
      wonders:[], capital:isCapital, defense:0, turn:state.turn
    };
    state.cities.push(city);
    tile.owner=civId;
    tile.city=cid;
    // Reveal around city for player
    if(civId==="player") revealFog("player",tile,3);
    audio.found();
    burst(tile,"#f2c14e",30);
    floatText(tile,"CITY FOUNDED","#f2c14e");
    // MrMacsProfile: shards + first-city achievement
    if (civId === "player") {
      window.MrMacsProfile?.addShards(20, "empire-ascendant:city-founded");
      const playerCityCount = state.cities.filter(c => c.civId === "player").length;
      if (playerCityCount === 1) window.MrMacsProfile?.unlock("empire-found");
    }
    return city;
  }

  function cityAt(tile){ return state.cities.find(c=>c.tileId===tile.id)||null; }
  function cityById(id){ return state.cities.find(c=>c.id===id)||null; }

  function cityYield(city){
    const tile=getTileById(city.tileId);
    const ter=tile?TERRAIN[tile.terrain]:{g:1,f:1,p:1,s:0};
    // base tile yield
    let gold=ter.g, food=ter.f, prod=ter.p, sci=ter.s;
    // pop bonus
    gold+=Math.floor(city.pop*.5);
    food+=Math.floor(city.pop*.5);
    prod+=Math.floor(city.pop*.3);
    sci+=Math.floor(city.pop*.3);
    // buildings
    for(const b of city.buildings){
      const bd=BUILDINGS[b]; if(!bd) continue;
      gold+=(bd.effect.gold||0);
      food+=(bd.effect.food||0);
      prod+=(bd.effect.prod||0);
      sci+=(bd.effect.sci||0);
    }
    // scholars in city
    const scholars=state.units.filter(u=>u.civId===city.civId&&u.def==="scholar"&&u.tileId===city.tileId);
    sci+=scholars.length*2;
    // strategic resource
    if(tile&&tile.resource){
      const res=RESOURCES[tile.resource];
      if(res){ gold+=(res.bonusGold||0); sci+=(res.bonusSci||0); }
    }
    return {gold,food,prod,sci};
  }

  function processCityGrowth(city){
    const y=cityYield(city);
    city.food+=y.food;
    if(city.food>=city.foodNeeded){
      city.pop+=1;
      city.food=0;
      city.foodNeeded=Math.floor(city.foodNeeded*1.3+5);
      floatText(getTileById(city.tileId),"POP +1","#77d99b");
      // radial pulse
      burst(getTileById(city.tileId),"#77d99b",12);
    }
    return y;
  }

  function processBuildQueue(city){
    if(!city.buildQueue) return;
    const tile=getTileById(city.tileId);
    const y=cityYield(city);
    city.buildProgress+=y.prod;
    // Check if it's a building
    const bdef=BUILDINGS[city.buildQueue];
    if(bdef){
      if(city.buildProgress>=bdef.cost){
        city.buildings.push(city.buildQueue);
        city.buildProgress=0; city.buildQueue=null;
        floatText(tile,`${bdef.name} complete`,"#7bdff2");
        audio.tech_complete();
      }
      return;
    }
    // Unit
    const udef=UNIT_DEFS[city.buildQueue];
    if(udef&&city.buildProgress>=udef.cost){
      spawnUnit(city.civId, city.buildQueue, tile);
      city.buildProgress=0; city.buildQueue=null;
      floatText(tile,"Unit ready","#f2c14e");
      // MrMacsProfile: shards for unit trained
      if (city.civId === "player") {
        window.MrMacsProfile?.addShards(30, "empire-ascendant:unit-trained");
      }
    }
  }

  // ─── UNITS ───────────────────────────────────────────────────────────────────
  function spawnUnit(civId, defKey, tile){
    if(!tile) return null;
    const def=UNIT_DEFS[defKey]; if(!def) return null;
    const u={
      id:`u_${++state.unitSeq}`, civId, def:defKey,
      tileId:tile.id,
      hp:100, maxHp:100, str:def.str,
      mv:def.mv, mvLeft:def.mv,
      moved:false, fortified:false,
      animX:0, animY:0, animFrac:1  // for lerp animation
    };
    state.units.push(u);
    if(civId==="player") revealFog("player",tile,2);
    return u;
  }

  function unitsAt(tile){ return state.units.filter(u=>u.tileId===tile.id); }
  function unitAtTile(tile){ return state.units.find(u=>u.tileId===tile.id)||null; }

  function getReachable(unit){
    // BFS with movement cost
    const tile=getTileById(unit.tileId); if(!tile) return [];
    const visited=new Map([[unit.tileId,0]]);
    const queue=[{t:tile,mv:unit.mvLeft}];
    const result=[];
    while(queue.length){
      const {t,mv}=queue.shift();
      for(const nb of neighbors(t)){
        if(nb.terrain==="ocean") continue;
        if(nb.owner&&nb.owner!==unit.civId) continue; // enemy territory blocks
        const cost=TERRAIN[nb.terrain]?.mv||1;
        const rem=mv-cost;
        if(rem<0) continue;
        if(!visited.has(nb.id)||visited.get(nb.id)<rem){
          visited.set(nb.id,rem);
          result.push(nb);
          queue.push({t:nb,mv:rem});
        }
      }
    }
    return result;
  }

  function moveUnit(unit, targetTile, skipAnim=false){
    const fromTile=getTileById(unit.tileId);
    if(!skipAnim&&fromTile){
      const fp=hexToPixel(fromTile), tp=hexToPixel(targetTile);
      unit.animX=fp.x-tp.x; unit.animY=fp.y-tp.y; unit.animFrac=0;
    }
    unit.tileId=targetTile.id;
    const cost=TERRAIN[targetTile.terrain]?.mv||1;
    unit.mvLeft=Math.max(0,unit.mvLeft-cost);
    unit.moved=true;
    if(unit.civId==="player") revealFog("player",targetTile,2);
    audio.move();
  }

  function resolveCombat(attacker, defTile){
    const defUnit=unitAtTile(defTile);
    if(!defUnit) return;
    const aTer=TERRAIN[getTileById(attacker.tileId)?.terrain||"plains"];
    const dTer=TERRAIN[defTile.terrain];
    const defCity=cityAt(defTile);
    const defBonus=(defCity?(defCity.buildings.includes("walls")?1.3:1.1):1.0)*(dTer?.mv===3?1.2:1.0);
    const atkMod=(aTer?.mv===1?1.05:1.0);
    const aDmg=Math.round(clamp(attacker.str*(attacker.str/defUnit.str)*atkMod*(0.85+Math.random()*.3),3,45));
    const dDmg=Math.round(clamp(defUnit.str*(defUnit.str/attacker.str)/defBonus*(0.75+Math.random()*.3),2,35));
    attacker.hp=clamp(attacker.hp-dDmg,0,attacker.maxHp);
    defUnit.hp=clamp(defUnit.hp-aDmg,0,defUnit.maxHp);
    audio.combat();
    if(!FX_LITE) burst(defTile,"#ff6f6f",20);
    floatText(defTile,`-${aDmg}`,"#ff6f6f");
    floatText(getTileById(attacker.tileId),`-${dDmg}`,"#ffb0b0");
    if(defUnit.hp<=0){
      killUnit(defUnit);
      if(defTile.owner&&defTile.owner!==attacker.civId){
        captureTile(attacker.civId, defTile);
      }
      moveUnit(attacker, defTile, true);
    }
    if(attacker.hp<=0) killUnit(attacker);
    attacker.mvLeft=0; attacker.moved=true;
  }

  function killUnit(unit){
    state.units=state.units.filter(u=>u.id!==unit.id);
  }

  function captureTile(civId, tile){
    const prevOwner=tile.owner;
    tile.owner=civId;
    if(tile.city){
      const city=cityById(tile.city);
      if(city){
        city.civId=civId;
        floatText(tile,"CAPTURED","#f2c14e");
        checkVictory();
      }
    }
    if(civId==="player") revealFog("player",tile,2);
    burst(tile,CIVS[civId].color,28);
    setDip(civId,prevOwner,-20);
  }

  // ─── RESEARCH ────────────────────────────────────────────────────────────────
  function hasTech(civId,id){ return state.techs[civId]?.done?.includes(id); }
  function techById(id){ return TECHS.find(t=>t.id===id); }

  function processTech(civId){
    const ts=state.techs[civId]; if(!ts||!ts.active) return;
    const tech=techById(ts.active); if(!tech) return;
    // science from all cities
    let sci=0;
    state.cities.filter(c=>c.civId===civId).forEach(c=>{ sci+=cityYield(c).sci; });
    ts.progress+=Math.max(1,sci);
    if(ts.progress>=tech.cost){
      ts.done.push(ts.active);
      ts.progress=0;
      const eff=tech.effect||{};
      const r=state.res[civId];
      if(eff.gold) r.gold+=eff.gold*5;
      if(eff.food) r.food+=eff.food*5;
      if(eff.prod) r.prod+=eff.prod*5;
      if(eff.sci)  r.sci+=eff.sci*5;
      if(civId==="player"){
        audio.tech_complete();
        const cap=state.cities.find(c=>c.civId==="player"&&c.capital);
        if(cap) burst(getTileById(cap.tileId),"#7bdff2",20);
        setAdvisor("Technology Discovered",`${tech.name} unlocked. ${tech.quote}`,`Unlocks: ${tech.unlocks}`,"good");
        // MrMacsProfile: shards for tech research
        window.MrMacsProfile?.addShards(40, "empire-ascendant:tech-researched");
      }
      // auto pick next
      const era=state.era;
      const next=TECHS.find(t=>!hasTech(civId,t.id)&&t.era<=era+1);
      ts.active=next?next.id:"";
    }
  }

  // ─── RESOURCE COLLECTION ─────────────────────────────────────────────────────
  function collectYields(civId){
    const r=state.res[civId];
    let totalGold=0, totalFood=0, totalProd=0, totalSci=0;
    state.cities.filter(c=>c.civId===civId).forEach(c=>{
      const y=cityYield(c);
      totalGold+=y.gold; totalProd+=y.prod; totalSci+=y.sci;
      processCityGrowth(c);
      processBuildQueue(c);
    });
    // Tile improvements
    state.tiles.filter(t=>t.owner===civId&&t.improvement).forEach(t=>{
      const imp=IMPROVEMENTS[t.improvement];
      if(imp){ totalGold+=(imp.yields.gold||0); totalFood+=(imp.yields.food||0); totalProd+=(imp.yields.prod||0); }
    });
    r.gold+=totalGold;
    r.prod+=totalProd;
    r.sci+=totalSci;
    // Maintenance: 1 gold per unit
    const unitCount=state.units.filter(u=>u.civId===civId).length;
    r.gold-=unitCount;
    if(r.gold<0){ r.gold=0; r.stability-=4; }
    // Stability drift
    const territory=tilesByOwner(civId).length;
    r.stability=clamp(r.stability+(territory>8?-1:1),0,100);
    // Heal units in own territory
    state.units.filter(u=>u.civId===civId).forEach(u=>{
      const t=getTileById(u.tileId);
      if(t&&t.owner===civId) u.hp=clamp(u.hp+10,0,u.maxHp);
    });
  }

  // ─── AI ──────────────────────────────────────────────────────────────────────
  function aiTurn(civId){
    const civ=CIVS[civId]; if(!civ) return;
    const per=civ.personality;
    const r=state.res[civId];

    // 1. Move units
    const myUnits=state.units.filter(u=>u.civId===civId);
    for(const u of myUnits){
      u.mvLeft=u.mv; u.moved=false;
      const tile=getTileById(u.tileId); if(!tile) continue;
      const def=UNIT_DEFS[u.def];

      if(u.def==="settler"){
        // Look for empty unowned tile near own territory
        const reachable=getReachable(u);
        const settle=reachable.find(t=>!t.owner&&!t.city&&t.terrain!=="ocean"&&t.terrain!=="mountain");
        if(settle){ moveUnit(u,settle,true); foundCity(civId,settle); killUnit(u); }
      } else if(u.def==="worker"){
        const reachable=getReachable(u);
        const build=reachable.find(t=>t.owner===civId&&!t.improvement&&t.terrain!=="ocean");
        if(build){ moveUnit(u,build,true); buildImprovement(civId,build); }
      } else if(def&&def.str>0){
        // Combat units
        const reachable=getReachable(u);
        // Look for enemy unit or border tile to attack
        const enemyTile=reachable.find(t=>t.owner&&t.owner!==civId&&unitsAt(t).some(eu=>eu.civId!==civId));
        if(enemyTile&&(per==="military"||per==="expansionist"||Math.random()<.5)){
          moveUnit(u,enemyTile,true); resolveCombat(u,enemyTile);
        } else {
          // Move toward player if war, or toward empty frontier
          const front=reachable.filter(t=>!t.owner&&t.terrain!=="ocean");
          const warPair=getDip(civId,"player");
          if(warPair.war){
            const playerTile=state.tiles.find(t=>t.owner==="player");
            if(playerTile){
              const step=reachable.sort((a,b)=>tileDistance(a,playerTile)-tileDistance(b,playerTile))[0];
              if(step) moveUnit(u,step,true);
            }
          } else if(front.length&&(per==="expansionist"||per==="military")){
            moveUnit(u,front[0|Math.random()*front.length],true);
          }
        }
      }
    }

    // 2. Build in cities
    state.cities.filter(c=>c.civId===civId).forEach(c=>{
      if(c.buildQueue) return;
      if(per==="science"&&!c.buildings.includes("library")&&hasTech(civId,"writing")){
        c.buildQueue="library";
      } else if(per==="military"&&!c.buildings.includes("barracks")&&hasTech(civId,"bronze")){
        c.buildQueue="barracks";
      } else if(!c.buildings.includes("granary")){
        c.buildQueue="granary";
      } else if(Math.random()<.3){
        // Spawn settler if territory is small
        const territory=tilesByOwner(civId).length;
        if(territory<8) c.buildQueue="settler";
        else c.buildQueue="warrior";
      }
    });

    // 3. Research
    processTech(civId);

    // 4. Diplomacy aggression check
    const dip=getDip(civId,"player");
    if(dip.rel<20&&!dip.war&&Math.random()<.3){
      dip.war=true;
      if(civId==="player") setAdvisor("WAR DECLARED",`${civ.name} has declared war!`,"Defend your cities!","bad");
    }
    if(dip.rel>70&&dip.war&&Math.random()<.2){
      dip.war=false;
    }
  }

  function buildImprovement(civId, tile){
    // pick best improvement for terrain
    const options=Object.entries(IMPROVEMENTS).filter(([k,v])=>{
      return v.terrain.includes(tile.terrain)&&(v.requires?hasTech(civId,v.requires):true);
    });
    if(!options.length) return;
    tile.improvement=options[0][0];
  }

  // ─── VICTORY CHECK ───────────────────────────────────────────────────────────
  function checkVictory(){
    const playerCities=state.cities.filter(c=>c.civId==="player");
    // Domination: own all rival capitals
    const rivalCaps=state.cities.filter(c=>c.capital&&c.civId!=="player");
    if(rivalCaps.length===0){
      triggerVictory("Domination","You captured all rival capitals. The world bows to your dynasty.");
      return;
    }
    // Science: build Mission to Mars wonder
    if(state.wonders.find(w=>w.civId==="player"&&w.wonderId==="mission_mars")){
      triggerVictory("Science","Your scientists launched humanity beyond Earth. A new era begins.");
      return;
    }
    // Cultural: build 4 cultural wonders
    const culturalWonders=["colosseum","print_house","cathedral","great_library"];
    if(culturalWonders.every(wid=>state.wonders.find(w=>w.civId==="player"&&w.wonderId===wid))){
      triggerVictory("Cultural","Your civilization defined the age through art, faith, and knowledge.");
      return;
    }
    // Score: turn 200
    if(state.turn>=MAX_TURNS){
      triggerVictory("Score","The campaign age has ended. Your empire is judged by history.");
    }
  }

  function triggerVictory(type, message){
    if(state.victory) return;
    state.victory=type;
    // MrMacsProfile: shards + victory achievement
    window.MrMacsProfile?.addShards(800, "empire-ascendant:victory");
    window.MrMacsProfile?.unlock("empire-victory");
    endGame(`Victory: ${type}`,message);
  }

  // ─── HUD ELEMENTS ────────────────────────────────────────────────────────────
  const els = {
    gold:          document.getElementById("food"),         // repurposed as gold
    food:          document.getElementById("industry"),     // repurposed as food
    prod:          document.getElementById("knowledge"),    // repurposed as prod
    sci:           document.getElementById("culture"),      // repurposed as sci
    stability:     document.getElementById("stability"),
    hudTurnCounter:document.getElementById("hudTurnCounter"),
    pauseBtn:      document.getElementById("pauseBtn"),
    exitBtn:       document.getElementById("exitBtn"),
    advisorTitle:  document.getElementById("advisorTitle"),
    advisorMeta:   document.getElementById("advisorMeta"),
    advisorText:   document.getElementById("advisorText"),
    advisorLog:    document.getElementById("advisorLog"),
    selectedTitle: document.getElementById("selectedTitle"),
    selectedMeta:  document.getElementById("selectedMeta"),
    actionGrid:    document.getElementById("actionGrid"),
    panelTabs:     [...document.querySelectorAll(".panel-tabs button")],
    endTurnBtn:    document.getElementById("endTurnBtn"),
    setupScreen:   document.getElementById("setupScreen"),
    councilScreen: document.getElementById("councilScreen"),
    menuScreen:    document.getElementById("menuScreen"),
    endScreen:     document.getElementById("endScreen"),
    courseFilter:  document.getElementById("courseFilter"),
    setFilter:     document.getElementById("setFilter"),
    scenarioFilter:document.getElementById("scenarioFilter"),
    setupMetrics:  document.getElementById("setupMetrics"),
    startBtn:      document.getElementById("startBtn"),
    soundBtn:      document.getElementById("soundBtn"),
    fullscreenBtn: document.getElementById("fullscreenBtn"),
    resumeBtn:     document.getElementById("resumeBtn"),
    restartBtn:    document.getElementById("restartBtn"),
    menuExitBtn:   document.getElementById("menuExitBtn"),
    setupBtn:      document.getElementById("setupBtn"),
    againBtn:      document.getElementById("againBtn"),
    questionMeta:  document.getElementById("questionMeta"),
    questionPrompt:document.getElementById("questionPrompt"),
    stimulusBox:   document.getElementById("stimulusBox"),
    choiceGrid:    document.getElementById("choiceGrid"),
    explanation:   document.getElementById("explanation"),
    endTitle:      document.getElementById("endTitle"),
    endGrid:       document.getElementById("endGrid"),
    studyTargets:  document.getElementById("studyTargets"),
    eraBanner:     document.getElementById("eraBanner"),
    eraBannerTitle:document.getElementById("eraBannerTitle"),
    eraBannerSub:  document.getElementById("eraBannerSub"),
    appShell:      document.getElementById("app")
  };

  // ─── ADVISOR ─────────────────────────────────────────────────────────────────
  function setAdvisor(title,text,log="",tone=""){
    els.advisorTitle.textContent=title;
    els.advisorText.textContent=text;
    els.advisorLog.textContent=log;
    els.advisorLog.className=`advisor-log ${tone}`;
  }

  // ─── HUD UPDATE ──────────────────────────────────────────────────────────────
  function updateHud(){
    const r=state.res.player;
    els.gold.textContent=fmtN(r.gold);
    els.food.textContent=fmtN(r.food);
    els.prod.textContent=fmtN(r.prod);
    els.sci.textContent=fmtN(r.sci);
    els.stability.textContent=`${Math.floor(r.stability)}%`;
    const eraName=ERAS[state.era]||"Ancient";
    els.advisorMeta.textContent=`Turn ${state.turn}/${MAX_TURNS} | ${eraName} Era`;
    if(els.hudTurnCounter) els.hudTurnCounter.textContent=`${eraName} Era · Turn ${state.turn}/${MAX_TURNS}`;
    els.pauseBtn.textContent=state.mode==="menu"?"Resume":"Menu";
    // Drive era CSS palette
    if(els.appShell) els.appShell.dataset.era=String(state.era);
  }

  // ─── PANEL RENDERING ─────────────────────────────────────────────────────────
  function updatePanelTabs(){
    els.panelTabs.forEach(b=>{
      const active=b.dataset.panel===state.panel;
      b.classList.toggle("active",active);
      b.setAttribute("aria-selected",active?"true":"false");
      b.setAttribute("aria-pressed",active?"true":"false");
    });
  }

  function renderPanel(){
    updatePanelTabs();
    switch(state.panel){
      case "research":  return renderResearchPanel();
      case "wonders":   return renderWondersPanel();
      case "diplomacy": return renderDiplomacyPanel();
      default:          return renderProvincePanel();
    }
  }

  function renderActionButtons(actions){
    els.actionGrid.innerHTML=actions.slice(0,8).map((a,i)=>
      `<button class="${esc(a.cls||"")}" type="button" data-i="${i}" ${a.disabled?"disabled":""}>${esc(a.label)}<span>${esc(a.sub)}</span></button>`
    ).join("");
    els.actionGrid.querySelectorAll("button").forEach(b=>{
      b.addEventListener("click",()=>{
        const a=actions[+b.dataset.i];
        if(a&&!a.disabled) a.action();
      });
    });
  }

  // Province/unit panel
  function renderProvincePanel(){
    const unit=state.selUnit;
    const tile=state.selected;

    if(unit){
      renderUnitPanel(unit);
      return;
    }
    if(!tile){
      els.selectedTitle.textContent="Select a tile";
      els.selectedMeta.textContent="Click any tile on the map.";
      els.actionGrid.innerHTML="";
      return;
    }
    const city=tile.city?cityById(tile.city):null;
    if(city&&city.civId==="player"){
      renderCityPanel(city,tile);
      return;
    }
    renderTilePanel(tile);
  }

  function renderUnitPanel(unit){
    const tile=getTileById(unit.tileId);
    const def=UNIT_DEFS[unit.def];
    els.selectedTitle.textContent=`${def.name} (${unit.civId==="player"?"Your":CIVS[unit.civId].name})`;
    els.selectedMeta.textContent=`HP ${unit.hp}/${unit.maxHp} | STR ${unit.str} | Moves ${unit.mvLeft}/${unit.mv}`;
    const actions=[];
    if(unit.civId==="player"){
      if(!unit.moved&&unit.mvLeft>0){
        actions.push({label:"Move Unit",sub:"Select destination on map",cls:"major",disabled:false,action:()=>enterMoveMode(unit)});
      }
      if(def.str>0&&unit.mvLeft>0){
        const adjacent=neighbors(tile||state.tiles[0]).filter(n=>unitsAt(n).some(u=>u.civId!=="player"));
        if(adjacent.length){
          actions.push({label:"Attack",sub:`vs ${CIVS[unitsAt(adjacent[0]).find(u=>u.civId!=="player")?.civId]?.name||"enemy"}`,cls:"warning",disabled:false,action:()=>resolveCombat(unit,adjacent[0])});
        }
      }
      if(unit.def==="settler"&&tile&&!tile.city){
        actions.push({label:"Found City",sub:"Founds a new city here",cls:"major",disabled:!!tile.city,action:()=>{
          openCouncil({type:"found",tile,unit,cost:{}});
        }});
      }
      if(unit.def==="worker"&&tile&&tile.owner==="player"&&!tile.improvement){
        const opts=Object.entries(IMPROVEMENTS).filter(([k,v])=>v.terrain.includes(tile.terrain)&&(v.requires?hasTech("player",v.requires):true));
        opts.forEach(([k,v])=>{
          actions.push({label:`Build ${v.name}`,sub:`${v.terrain.join("/")} | ${Object.entries(v.yields).map(([rk,rv])=>"+"+rv+" "+rk).join(", ")}`,disabled:false,action:()=>{ tile.improvement=k; floatText(tile,v.name,"#77d99b"); killUnit(unit); renderPanel(); }});
        });
      }
      if(unit.hp<unit.maxHp&&tile&&tile.owner==="player"){
        actions.push({label:"Fortify & Heal",sub:"End movement, heal +10 HP/turn",disabled:unit.fortified,action:()=>{unit.fortified=true;unit.mvLeft=0;renderPanel();}});
      }
      actions.push({label:"Disband",sub:"Remove unit",cls:"warning",disabled:false,action:()=>{killUnit(unit);state.selUnit=null;renderPanel();}});
    }
    if(!actions.length) actions.push({label:"Enemy Unit",sub:"Cannot control",disabled:true,action:()=>{}});
    renderActionButtons(actions);
  }

  function renderCityPanel(city,tile){
    const y=cityYield(city);
    els.selectedTitle.textContent=`${city.name}${city.capital?" (Capital)":""}`;
    els.selectedMeta.textContent=`Pop ${city.pop} | +${y.gold}g +${y.food}f +${y.prod}p +${y.sci}s | ${city.buildings.length} buildings`;
    const actions=[];
    // Build queue
    const currentBuild=city.buildQueue;
    // Buildings available
    const era=state.era;
    Object.entries(BUILDINGS).forEach(([k,b])=>{
      if(b.era>era+1) return;
      if(city.buildings.includes(k)) return;
      if(b.requires&&!hasTech("player",b.requires)) return;
      actions.push({
        label:currentBuild===k?`Building: ${b.name}`:`Build ${b.name}`,
        sub:`${b.cost} prod | ${b.desc}`,
        cls:currentBuild===k?"major":"",
        disabled:currentBuild===k,
        action:()=>{city.buildQueue=k;city.buildProgress=0;floatText(tile,`Started: ${b.name}`,"#7bdff2");renderPanel();}
      });
    });
    // Units
    Object.entries(UNIT_DEFS).forEach(([k,u])=>{
      if(u.era>era+1) return;
      if(u.requires&&!hasTech("player",u.requires)) return;
      if(k==="settler"&&state.res.player.food<30) return; // population cost
      actions.push({
        label:currentBuild===k?`Training: ${u.name}`:`Train ${u.name}`,
        sub:`${u.cost} prod | ${u.desc}`,
        cls:currentBuild===k?"major":"",
        disabled:currentBuild===k,
        action:()=>{city.buildQueue=k;city.buildProgress=0;floatText(tile,`Training: ${u.name}`,"#f2c14e");renderPanel();}
      });
    });
    renderActionButtons(actions);
  }

  function renderTilePanel(tile){
    const terrain=TERRAIN[tile.terrain];
    const owner=tile.owner?CIVS[tile.owner].name:"Unclaimed";
    const res=tile.resource?RESOURCES[tile.resource]?.label:"";
    els.selectedTitle.textContent=`${terrain.label}${res?" ("+res+")":""}`;
    els.selectedMeta.textContent=`${owner} | +${terrain.g}g +${terrain.f}f +${terrain.p}p +${terrain.s}s${tile.fog?" | Fogged":""}`;
    const actions=[];
    const r=state.res.player;

    if(!tile.owner&&isPlayerAdjacent(tile)&&!tile.fog){
      actions.push({
        label:"Claim Territory",sub:"Council review required | 8 culture",
        cls:"major",disabled:r.culture<8,
        action:()=>openCouncil({type:"claim",tile,cost:{culture:8}})
      });
    }
    if(tile.owner==="player"&&!tile.city){
      const cost={food:8,culture:5};
      const canAfford=r.food>=cost.food&&r.culture>=cost.culture;
      actions.push({
        label:"Found City",sub:`${cost.food} food, ${cost.culture} culture`,
        cls:"major",disabled:!canAfford,
        action:()=>openCouncil({type:"found_city",tile,cost})
      });
      if(!tile.improvement){
        const opts=Object.entries(IMPROVEMENTS).filter(([k,v])=>v.terrain.includes(tile.terrain)&&(v.requires?hasTech("player",v.requires):true));
        opts.forEach(([k,v])=>{
          actions.push({label:`Build ${v.name}`,sub:`Worker needed | ${Object.entries(v.yields).map(([rk,rv])=>"+"+rv+" "+rk).join(", ")}`,disabled:true,action:()=>{}});
        });
      }
    }
    if(tile.owner&&tile.owner!=="player"&&isPlayerAdjacent(tile)){
      const war=getDip("player",tile.owner).war;
      actions.push({
        label:war?"Assault Province":"Border War",
        sub:"12 prod, 8 culture | council review",cls:"warning",
        disabled:r.prod<12||r.culture<8,
        action:()=>openCouncil({type:"war",tile,owner:tile.owner,cost:{prod:12,culture:8}})
      });
    }
    if(!actions.length) actions.push({label:"No actions",sub:"Select an adjacent or owned tile",disabled:true,action:()=>{}});
    renderActionButtons(actions);
  }

  function renderResearchPanel(){
    const ts=state.techs.player;
    const activeTech=techById(ts.active);
    els.selectedTitle.textContent=activeTech?`Researching: ${activeTech.name}`:"Research Complete";
    els.selectedMeta.textContent=activeTech?`${Math.floor(ts.progress)}/${activeTech.cost} science | ${activeTech.unlocks}`:
      "All available technologies researched.";
    const actions=TECHS.filter(t=>t.era<=state.era+1).map(t=>{
      const done=hasTech("player",t.id);
      const active=ts.active===t.id&&!done;
      return {
        label:done?`✓ ${t.name}`:active?`▶ ${t.name}`:t.name,
        sub:done?t.quote:`${t.cost} science | ${t.unlocks}`,
        cls:done?"completed":active?"major":"",
        disabled:done||active,
        action:()=>{ts.active=t.id;ts.progress=0;renderPanel();}
      };
    });
    renderActionButtons(actions);
  }

  function renderWondersPanel(){
    const playerCity=state.cities.find(c=>c.civId==="player"&&c.capital);
    els.selectedTitle.textContent="World Wonders";
    els.selectedMeta.textContent=playerCity?"One per empire. Massive power spikes. Built in your capital.":"Need a capital city first.";
    const actions=WONDERS.filter(w=>w.era<=state.era+1).map(w=>{
      const built=state.wonders.find(x=>x.wonderId===w.id);
      const builtBy=built?CIVS[built.civId]?.name:"";
      const missTech=w.requires&&!hasTech("player",w.requires);
      const r=state.res.player;
      const canAfford=Object.entries(w.cost).every(([k,v])=>r[k]>=v);
      return {
        label:built?`${w.name} — ${builtBy}`:`Build ${w.name}`,
        sub:built?w.desc:missTech?`Requires ${techById(w.requires)?.name||w.requires}`:`${Object.entries(w.cost).map(([k,v])=>v+" "+k).join(", ")} | ${w.desc}`,
        cls:built?"completed":(!missTech&&canAfford&&playerCity)?"major":"",
        disabled:!!built||missTech||!playerCity||!canAfford,
        action:()=>openCouncil({type:"wonder",wonder:w,tile:getTileById(playerCity.tileId),cost:w.cost})
      };
    });
    renderActionButtons(actions);
  }

  function renderDiplomacyPanel(){
    els.selectedTitle.textContent="Diplomacy";
    els.selectedMeta.textContent="Relations, trade pacts, and wars shape the world order.";
    const r=state.res.player;
    const actions=AI_KEYS.flatMap(civId=>{
      const civ=CIVS[civId];
      const dip=getDip("player",civId);
      const border=state.tiles.some(t=>t.owner===civId&&isPlayerAdjacent(t));
      return [
        {
          label:`${civ.name}: ${Math.round(dip.rel)}`,
          sub:`${dip.war?"⚔ AT WAR":dip.alliance?"★ Allied":border?"shared border":"distant"} | power ${tilesByOwner(civId).length} tiles`,
          cls:dip.war?"warning":dip.alliance?"completed":"",disabled:true,action:()=>{}
        },
        {
          label:"Send Envoys",sub:"5 culture | improve relations",
          disabled:r.culture<5,
          action:()=>openCouncil({type:"envoy",civId,cost:{culture:5}})
        },
        {
          label:"Trade Mission",sub:"6 gold | review for alliance",cls:"major",
          disabled:r.gold<6,
          action:()=>openCouncil({type:"trade",civId,cost:{gold:6}})
        },
        {
          label:dip.war?"Peace Treaty":"Declare War",
          sub:dip.war?"8 culture | end the conflict":"Relations below 30 raises risk",
          cls:dip.war?"":"warning",
          disabled:dip.war?r.culture<8:false,
          action:()=>{
            if(dip.war){ openCouncil({type:"peace",civId,cost:{culture:8}}); }
            else { dip.war=true; setAdvisor("War Declared",`You declared war on ${civ.name}.`,"Capture their cities!","bad"); audio.combat(); renderPanel(); }
          }
        }
      ];
    });
    renderActionButtons(actions);
  }

  // ─── QUESTION BANK ───────────────────────────────────────────────────────────
  const SOURCE_RE=/(\bthis\s+(excerpt|passage|cartoon|map|chart|graph|image|source)\b|\baccording\s+to\s+(the|this)\b|\bbased\s+on\s+this\b)/i;
  function needsStimulus(q){ return SOURCE_RE.test(String(q?.prompt||q?.stem||"")); }
  function hasStimulusData(q){
    return Boolean(q?.stimulusText||q?.stimulusHtml||(Array.isArray(q?.stimulusImages)&&q.stimulusImages.length)||q?.stimulusImage);
  }
  function isPlayable(q){
    if(!q||!q.answer||(!(q.prompt||q.stem))) return false;
    if(SourceBank&&!SourceBank.playableSharedPrompt(q)) return false;
    if(SourceBank&&SourceBank.sourceBased(q)){
      if(!hasStimulusData(q)) return false;
      // Bug fix: add trust/course-match verification so quarantined or mismatched
      // source questions never enter the pool, not just a raw field-presence check.
      if(SourceBank.verifiedSourceQuestion&&!SourceBank.verifiedSourceQuestion(q)) return false;
      return SourceBank.usableRegentsQuestion(q);
    }
    if(needsStimulus(q)&&!hasStimulusData(q)) return false;
    return true;
  }

  function displayPrompt(q){
    const raw=cleanText(q?.prompt||q?.stem||"");
    return raw.replace(/^(final\s+clue[^:]*:|name\s+this\s+content\s+item:)\s*/i,"").trim()||raw;
  }
  function displayExplanation(q){
    const e=cleanText(q?.explanation||"");
    return e||`Correct answer: ${cleanText(q?.answer)}.`;
  }

  function buildChoices(q){
    const answer=cleanText(q.answer);
    let choices=[];
    if(q.type==="mcq"&&Array.isArray(q.choices)&&q.choices.length){
      const correctLabel=String(q.correct||"");
      const correct=q.choices.find(c=>String(c.label)===correctLabel)?.text||answer;
      choices=q.choices.map(c=>({text:cleanText(c.text),correct:normalize(c.text)===normalize(correct)})).filter(c=>c.text);
      if(!choices.some(c=>c.correct)) choices.unshift({text:cleanText(correct),correct:true});
    } else {
      const sameSet=state.filtered.filter(i=>i.id!==q.id&&i.answer&&(i.set===q.set||i.course===q.course)).map(i=>cleanText(i.answer)).filter(t=>t&&normalize(t)!==normalize(answer));
      const fallback=state.bank.questions.filter(i=>i.id!==q.id&&i.answer).map(i=>cleanText(i.answer)).filter(t=>t&&normalize(t)!==normalize(answer));
      const unique=[...new Map(shuffle(sameSet.concat(fallback)).map(t=>[normalize(t),t])).values()];
      choices=[{text:answer,correct:true},...unique.slice(0,3).map(t=>({text:t,correct:false}))];
    }
    while(choices.length<4) choices.push({text:["River valley civilization","Imperial expansion","Trade network","Political reform"][choices.length]||"Review term",correct:false});
    const deduped=[...new Map(choices.map(c=>[normalize(c.text),c])).values()];
    if(!deduped.some(c=>c.correct)) deduped.unshift({text:answer,correct:true});
    return shuffle(deduped).slice(0,4);
  }

  function nextQ(){
    if(!state.queue.length) state.queue=shuffle(state.filtered);
    return state.queue.pop()||state.filtered[0|Math.random()*state.filtered.length];
  }

  // ─── COUNCIL (QUESTION) SCREEN ───────────────────────────────────────────────
  function openCouncil(action){
    if(!action||state.mode!=="playing") return;
    // Check affordability
    const r=state.res.player;
    if(action.cost&&Object.entries(action.cost).some(([k,v])=>r[k]<v)) return;
    state.pendingAction=action;
    state.mode="council";
    const q=nextQ();
    action.question=q;
    action.choices=buildChoices(q);
    renderCouncil(action,q);
    els.councilScreen.classList.add("show");
    try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.duck(); } catch(e) {}
  }

  function renderCouncil(action,q){
    const labels={
      claim:"Expansion Council",found:"City Council",found_city:"City Council",
      war:"Border War",wonder:"Wonder Council",envoy:"Diplomacy",
      trade:"Trade Mission",peace:"Peace Talks",reform:"Reform Council"
    };
    els.questionMeta.textContent=`${labels[action.type]||"Council Review"} | ${cleanText(q.course||"Social Studies")}`;
    els.questionPrompt.textContent=displayPrompt(q);
    els.explanation.textContent="";
    els.explanation.className="explanation";
    renderStimulus(q);
    els.choiceGrid.innerHTML=action.choices.map((c,i)=>
      `<button type="button" data-i="${i}">${esc(c.text)}</button>`
    ).join("");
    els.choiceGrid.querySelectorAll("button").forEach(b=>{
      b.addEventListener("click",()=>resolveCouncil(+b.dataset.i));
    });
  }

  function renderStimulus(q){
    // Bug fix: route through sourceLock trust pipeline so quarantined/course-mismatched
    // sources are blocked. Raw stimulusImages() bypasses those checks entirely.
    const lock = SourceBank && SourceBank.sourceLock
      ? SourceBank.sourceLock(q)
      : { ok: !!(q?.stimulusImages && q.stimulusImages.length), images: q?.stimulusImages || [] };
    const imgs = lock.ok ? lock.images : [];
    const text = q?.stimulusText||q?.stimulus||"";
    if(!imgs.length&&!text){ els.stimulusBox.classList.remove("show"); return; }
    const imgHtml=imgs.slice(0,2).map((img,i)=>`<img src="${esc(img.src||img)}" alt="${esc(img.label||"Stimulus "+(i+1))}">`).join("");
    const txtHtml=text?`<div class="stimulus-text">${esc(cleanText(text))}</div>`:"";
    els.stimulusBox.innerHTML=imgHtml+txtHtml;
    els.stimulusBox.classList.add("show");
  }

  function resolveCouncil(index){
    const action=state.pendingAction;
    if(!action||state.mode!=="council") return;
    const choice=action.choices[index]; if(!choice) return;
    [...els.choiceGrid.querySelectorAll("button")].forEach((b,i)=>{
      b.disabled=true;
      b.classList.toggle("correct",action.choices[i]?.correct);
      if(i===index&&!choice.correct) b.classList.add("wrong");
    });
    state.councils+=1;
    const q=action.question;
    if(choice.correct){
      state.correct+=1;
      els.explanation.textContent=displayExplanation(q);
      els.explanation.className="explanation good";
      els.explanation.setAttribute("aria-live","polite");
      applySuccess(action);
      audio.correct();
      // MrMacsProfile: shards + first-correct achievement
      window.MrMacsProfile?.addShards(20, "empire-ascendant:council-correct");
      if (state.correct === 1) window.MrMacsProfile?.unlock("first-correct");
      // recordAnswer
      window.MrMacsProfile?.recordAnswer({
        course: els.courseFilter?.value||"All Courses",
        set:    els.setFilter?.value||"All Sets",
        gameId: "empire-ascendant",
        prompt: cleanText(q.prompt||q.question||""),
        answer: cleanText(q.answer||""),
        correct: true
      });
    } else {
      els.explanation.textContent=`Correct: ${cleanText(q.answer)}. ${displayExplanation(q)}`;
      els.explanation.className="explanation bad";
      els.explanation.setAttribute("aria-live","assertive");
      state.missed.push(q);
      applyFailure(action);
      audio.wrong();
      // recordAnswer
      window.MrMacsProfile?.recordAnswer({
        course: els.courseFilter?.value||"All Courses",
        set:    els.setFilter?.value||"All Sets",
        gameId: "empire-ascendant",
        prompt: cleanText(q.prompt||q.question||""),
        answer: cleanText(q.answer||""),
        correct: false
      });
    }
    updateHud(); renderPanel();
    setTimeout(closeCouncil, choice.correct?1200:2400);
  }

  function applySuccess(action){
    const r=state.res.player;
    if(action.cost) Object.entries(action.cost).forEach(([k,v])=>r[k]-=v);
    switch(action.type){
      case "claim":
        action.tile.owner="player";
        revealFog("player",action.tile,2);
        r.gold+=2; r.stability=clamp(r.stability+3,0,100);
        state.score+=700; burst(action.tile,CIVS.player.color,28);
        floatText(action.tile,"CLAIMED",CIVS.player.color);
        setAdvisor("Territory Claimed","The council approved the expansion. Stability holds.",`+gold +stability`,"good");
        break;
      case "found":
      case "found_city":
        foundCity("player",action.tile);
        if(action.unit) killUnit(action.unit);
        state.score+=800;
        setAdvisor("City Founded",`${cityAt(action.tile)?.name||"New city"} now anchors production and science.`,"","good");
        break;
      case "war":
        captureTile("player",action.tile);
        r.stability=clamp(r.stability-5,0,100);
        state.score+=1200;
        setAdvisor("Province Captured",`${CIVS[action.owner].name} lost the frontier.`,"-stability","good");
        break;
      case "wonder":
        state.wonders.push({civId:"player",wonderId:action.wonder.id});
        const wcity=cityAt(action.tile);
        if(wcity) wcity.wonders.push(action.wonder.id);
        Object.entries(action.wonder.effect).forEach(([k,v])=>r[k]=(r[k]||0)+v);
        r.stability=clamp(r.stability+10,0,100);
        state.score+=2000;
        burst(action.tile,"#f2c14e",40);
        floatText(action.tile,"WONDER BUILT!","#f2c14e");
        setAdvisor("Wonder Complete",action.wonder.desc,`+${Object.entries(action.wonder.effect).map(([k,v])=>v+" "+k).join(", ")}`,"good");
        checkVictory();
        break;
      case "envoy":
        setDip("player",action.civId,+18); r.stability=clamp(r.stability+3,0,100);
        state.score+=400;
        setAdvisor("Envoys Welcomed",`${CIVS[action.civId].name} relations improved.`,`relation +18`,"good");
        break;
      case "trade":
        setDip("player",action.civId,+12); getDip("player",action.civId).alliance=true;
        r.gold+=10; state.score+=500;
        setAdvisor("Trade Pact Signed",`Alliance with ${CIVS[action.civId].name}.`,"+gold","good");
        audio.diplomacy();
        break;
      case "peace":
        getDip("player",action.civId).war=false;
        setDip("player",action.civId,+15);
        setAdvisor("Peace Agreed",`The war with ${CIVS[action.civId].name} ends.`,"","good");
        audio.diplomacy();
        break;
    }
    // Correct answer bonus: +25% science this turn
    r.sci=Math.round(r.sci*1.25);
    state.score+=50;
  }

  function applyFailure(action){
    const r=state.res.player;
    switch(action.type){
      case "claim": r.stability=clamp(r.stability-8,0,100); setAdvisor("Claim Failed","Local elites resisted the expansion.","-stability","bad"); break;
      case "found": case "found_city": r.stability=clamp(r.stability-5,0,100); setAdvisor("City Stalled","Opposition delayed the founding.","-stability","bad"); break;
      case "war": r.prod-=5; r.stability=clamp(r.stability-12,0,100); setAdvisor("Campaign Failed",`${CIVS[action.owner].name} held the line.`,"-prod -stability","bad"); break;
      case "wonder": r.prod-=10; r.stability=clamp(r.stability-6,0,100); setAdvisor("Wonder Delayed","Labor and supply problems stalled construction.","-prod","bad"); break;
      case "envoy": setDip("player",action.civId,-6); r.stability=clamp(r.stability-3,0,100); setAdvisor("Envoys Rebuffed",`${CIVS[action.civId].name} refused the mission.`,"-relations","bad"); break;
      case "trade": setDip("player",action.civId,-4); setAdvisor("Trade Failed","The route collapsed.","-relations","bad"); break;
      case "peace": r.gold-=8; setAdvisor("Peace Rejected",`${CIVS[action.civId].name} refused terms.`,"-gold","bad"); break;
    }
    if(action.tile) burst(action.tile,"#ff6f6f",18);
    // Wrong answer penalty: -1 move to random player unit next turn
    const u=state.units.find(u=>u.civId==="player");
    if(u) u.mvLeft=Math.max(0,u.mvLeft-1);
  }

  function closeCouncil(){
    els.councilScreen.classList.remove("show");
    try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.restore(); } catch(e) {}
    state.pendingAction=null;
    state.mode="playing";
    checkEra(); checkCollapse();
    updateHud(); renderPanel();
  }

  // ─── MOVEMENT MODE ───────────────────────────────────────────────────────────
  function enterMoveMode(unit){
    state.pendingMove={unit,reachable:getReachable(unit)};
    setAdvisor("Select Destination",`${UNIT_DEFS[unit.def].name} can move ${unit.mvLeft} tiles.`,"Click a highlighted tile.","");
  }

  function exitMoveMode(){
    state.pendingMove=null;
    renderPanel();
  }

  // ─── END TURN ────────────────────────────────────────────────────────────────
  function endTurn(){
    if(state.mode!=="playing") return;
    audio.endturn();

    // Reset unit movement
    state.units.forEach(u=>{ u.mvLeft=u.mv; u.moved=false; u.fortified=false; });

    // Collect player yields
    collectYields("player");
    processTech("player");

    // AI turns
    AI_KEYS.forEach(cid=>{ collectYields(cid); aiTurn(cid); });

    state.turn+=1;
    state.score+=tilesByOwner("player").length*40+state.era*60;

    // Era check
    checkEra();
    // Stability collapse
    checkCollapse();
    // Victory
    checkVictory();
    // Auto-save
    saveGame();
    // Phase 3 — first-turn tour (fires after turn 1 resolves, before any council or advisor update)
    if(state.turn===2){
      setTimeout(()=>{ window.MrMacsArcadeTour?.start("empire-ascendant",[
        { target:"#empireCanvas",             title:"Found cities, found empires",   body:"Move your settler with click-to-move (or tap on touch). End-turn advances all units + AI rivals.", placement:"right" },
        { target:".resource-bar",             title:"Six yields drive your civ",     body:"Gold / food / production / science / culture / faith. Watch the per-turn deltas — they're your throttle.", placement:"bottom" },
        { target:"[data-panel='research']",   title:"Research advances eras",        body:"12 techs across 4 eras. Each era brings new units, buildings, and a palette shift across the entire UI.", placement:"bottom" },
        { target:"[data-panel='diplomacy']",  title:"3 rival civs",                  body:"Each AI has a personality (expansionist / military / scientific). Diplomacy + war affect long-term victory.", placement:"bottom" },
        { target:"#councilScreen .council-card", title:"Reform Councils",            body:"Every 4 turns. Correct answer = +25% science bonus that turn; wrong = small penalty.", placement:"center" }
      ]); }, 300);
    }
    // Question every 4 turns
    if(state.turn%4===0&&state.mode==="playing"){
      openCouncil({type:"reform",tile:state.selected||state.tiles.find(t=>t.owner==="player"),cost:{}});
      return;
    }
    updateHud(); renderPanel();
    setAdvisor("Turn Complete","Your provinces produced resources. Rivals are moving.",`Turn ${state.turn}/${MAX_TURNS}`,"");
  }

  function checkEra(){
    const thresholds=[60,180,400,700];
    const next=state.era+1;
    if(next<ERAS.length&&state.res.player.sci>=thresholds[state.era]){
      state.res.player.sci-=thresholds[state.era];
      state.era=next;
      audio.era_advance();
      if(!FX_LITE){ for(const t of tilesByOwner("player")) burst(t,"#f2c14e",4); }
      setAdvisor("Era Advanced",`Your empire entered the ${ERAS[state.era]} Era. New technologies unlock.`,"+stability +prod","good");
      // Update era token on shell immediately
      if(els.appShell) els.appShell.dataset.era=String(state.era);
      // Show era banner (lite: no burst/flash, banner text still announces via aria-live)
      showEraBanner(ERAS[state.era]);
      if(!FX_LITE) flashScreen("#f2c14e");
      // MrMacsProfile: shards for era advance
      window.MrMacsProfile?.addShards(100, "empire-ascendant:era-advanced");
      // Wave 5 — snapshot on era transition
      try {
        if (window.MrMacsSessions) {
          window.MrMacsSessions.save("empire-ascendant", {
            era: state.era, eraName: ERAS[state.era] || "Ancient",
            turn: state.turn, score: state.score,
            resources: state.res && state.res.player ? { ...state.res.player } : null
          });
        }
      } catch (e) {}
    }
  }

  function showEraBanner(eraName){
    if(!els.eraBanner) return;
    const palettes={
      Classical:"Terracotta &amp; Marble",
      Medieval:"Vellum &amp; Gilt",
      Industrial:"Slate &amp; Steam-Brass"
    };
    if(els.eraBannerTitle) els.eraBannerTitle.textContent=`Entering the ${eraName} Era`;
    if(els.eraBannerSub)   els.eraBannerSub.textContent=palettes[eraName]||"New technologies and buildings unlock";
    els.eraBanner.style.opacity="1";
    setTimeout(()=>{ els.eraBanner.style.opacity="0"; }, 2800);
  }

  function checkCollapse(){
    const r=state.res.player;
    if(r.stability>0) return;
    const outer=tilesByOwner("player").filter(t=>!t.city);
    const losses=shuffle(outer).slice(0,Math.max(1,Math.ceil(outer.length/5)));
    losses.forEach(t=>{ t.owner=null; burst(t,"#ff6f6f",22); floatText(t,"REVOLT","#ff6f6f"); });
    r.stability=22;
    state.era=Math.max(0,state.era-1);
    setAdvisor("Dynastic Collapse","Stability collapsed. Provinces revolted. The empire fell back an era.","Rebuild before expanding.","bad");
    flashScreen("#ff6f6f");
  }

  function flashScreen(color){
    const overlay=document.createElement("div");
    overlay.style.cssText=`position:fixed;inset:0;background:${color};opacity:.35;pointer-events:none;z-index:99;transition:opacity .6s`;
    document.body.appendChild(overlay);
    requestAnimationFrame(()=>{ overlay.style.opacity="0"; setTimeout(()=>overlay.remove(),700); });
  }

  // ─── GAME FLOW ───────────────────────────────────────────────────────────────
  function startGame(fresh=true){
    audio._ctx();
    if(fresh) clearSave();
    state.mode="playing"; state.panel="province";
    state.turn=1; state.era=0; state.score=0;
    state.councils=0; state.correct=0; state.missed=[];
    state.units=[]; state.cities=[]; state.wonders=[];
    state.unitSeq=0; state.citySeq=0;
    state.particles=[]; state.banners=[]; state.floats=[];
    state.selUnit=null; state.pendingMove=null; state.victory=null;
    state.res={
      player: {gold:20,food:20,prod:20,sci:0,culture:10,stability:65},
      north:  {gold:20,food:20,prod:20,sci:0,culture:10,stability:65},
      steppe: {gold:20,food:20,prod:20,sci:0,culture:10,stability:65},
      ocean:  {gold:20,food:20,prod:20,sci:0,culture:10,stability:65}
    };
    state.techs={
      player:{active:"agriculture",progress:0,done:[]},
      north: {active:"agriculture",progress:0,done:[]},
      steppe:{active:"bronze",     progress:0,done:[]},
      ocean: {active:"writing",    progress:0,done:[]}
    };
    state.diplomacy={
      player_north: {rel:40,war:false,alliance:false},
      player_steppe:{rel:30,war:false,alliance:false},
      player_ocean: {rel:45,war:false,alliance:false},
      north_steppe: {rel:35,war:false,alliance:false},
      north_ocean:  {rel:50,war:false,alliance:false},
      steppe_ocean: {rel:30,war:false,alliance:false}
    };
    generateMap();
    els.setupScreen.classList.remove("show");
    els.endScreen.classList.remove("show");
    els.menuScreen.classList.remove("show");
    els.councilScreen.classList.remove("show");
    updateHud(); renderPanel();
    setAdvisor("Imperial Council","Found your capital, train units, research techs, and outpace your rivals.","The first dynasty rises.","good");
    window.MrMacsAnalytics?.track("game_play",{gameId:"empire-ascendant",title:"Empire Ascendant",course:els.courseFilter?.value||"All Courses",gameType:"Strategy"},{counter:"game-plays",once:false});
    try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start("empire-strategic"); } catch(e) {}
    // Wave 5 — clear stale shared snapshot, start ~10s session snapshots
    try {
      if (fresh && window.MrMacsSessions) window.MrMacsSessions.clear("empire-ascendant");
      if (state.__wave5SnapTimer) clearInterval(state.__wave5SnapTimer);
      state.__wave5SnapTimer = setInterval(() => {
        try {
          if (state.mode !== "playing" || !window.MrMacsSessions) return;
          window.MrMacsSessions.save("empire-ascendant", {
            era: state.era, eraName: ERAS[state.era] || "Ancient",
            turn: state.turn, score: state.score,
            resources: state.res && state.res.player ? { ...state.res.player } : null
          });
        } catch (e) {}
      }, 10000);
    } catch (e) {}
  }

  function endGame(title,message){
    if(state.mode==="ended") return;
    state.mode="ended";
    try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.stop(); } catch(e) {}
    const accuracy=state.councils?Math.round(state.correct/state.councils*100):0;
    const territory=tilesByOwner("player").length;
    const finalScore=Math.floor(state.score+territory*200+state.era*1000+state.res.player.stability*20);
    const best=Number(localStorage.getItem(`${SAVE_KEY}:bestScore`)||0);
    if(finalScore>best) localStorage.setItem(`${SAVE_KEY}:bestScore`,String(finalScore));
    els.endTitle.textContent=title;
    els.endGrid.innerHTML=[
      [fmtN(finalScore),"empire score"],
      [ERAS[state.era]||"Ancient","final era"],
      [String(territory),"provinces"],
      [String(state.cities.filter(c=>c.civId==="player").length),"cities"],
      [`${accuracy}%`,"council accuracy"]
    ].map(([v,l])=>`<div class="end-tile"><strong>${esc(v)}</strong><span>${esc(l)}</span></div>`).join("");
    if(state.missed.length){
      els.studyTargets.innerHTML=`<strong>Study targets:</strong>${state.missed.slice(-5).map(q=>`<p><strong>${esc(cleanText(q.answer))}</strong>: ${esc(displayPrompt(q))}</p>`).join("")}`;
    } else {
      els.studyTargets.innerHTML="<strong>Perfect council record.</strong><p>No missed questions.</p>";
    }
    if(message) setAdvisor(title,message,`Score: ${fmtN(finalScore)}`,"good");
    els.endScreen.classList.add("show");
    clearSave();
    window.MrMacsAnalytics?.track("game_complete",{gameId:"empire-ascendant",score:finalScore,accuracy,questions:state.councils,victory:state.victory||"score"},{counter:"game-completions",once:false});
    // Wave 5 — leaderboard submit + session clear
    try {
      if (state.__wave5SnapTimer) { clearInterval(state.__wave5SnapTimer); state.__wave5SnapTimer = null; }
      if (window.MrMacsSessions) window.MrMacsSessions.clear("empire-ascendant");
    } catch(e) {}
    try {
      if (window.MrMacsLeaderboards) {
        const result = window.MrMacsLeaderboards.submit("empire-ascendant", finalScore, {
          era: state.era, eraName: ERAS[state.era] || "Ancient",
          turn: state.turn, accuracy, victory: state.victory || "score"
        });
        if (result && result.isNewRecord && window.MrMacsToast) {
          window.MrMacsToast.push({ icon: "🏆", title: "New high score!", sub: "Rank #" + result.rank, tone: "good", ms: 4200 });
        } else if (result && window.MrMacsToast) {
          window.MrMacsToast.push({ icon: "🏅", title: "Top 5 score", sub: "Rank #" + result.rank, tone: "good", ms: 3600 });
        }
      }
    } catch(e) {}
  }

  // ─── PERSISTENCE ─────────────────────────────────────────────────────────────
  function saveGame(){
    try {
      const snap={
        turn:state.turn,era:state.era,score:state.score,
        councils:state.councils,correct:state.correct,
        res:state.res,techs:state.techs,diplomacy:state.diplomacy,
        tiles:state.tiles.map(t=>({id:t.id,owner:t.owner,city:t.city,improvement:t.improvement,wonder:t.wonder,fog:t.fog})),
        cities:state.cities,units:state.units.map(u=>({...u})),
        wonders:state.wonders,fog:state.fog,
        unitSeq:state.unitSeq,citySeq:state.citySeq
      };
      localStorage.setItem(SAVE_KEY,JSON.stringify(snap));
    } catch(e){ /* storage full */ }
  }

  function loadGame(){
    try {
      const raw=localStorage.getItem(SAVE_KEY);
      if(!raw) return false;
      const snap=JSON.parse(raw);
      state.turn=snap.turn||1;
      state.era=snap.era||0;
      state.score=snap.score||0;
      state.councils=snap.councils||0;
      state.correct=snap.correct||0;
      Object.assign(state.res,snap.res||{});
      Object.assign(state.techs,snap.techs||{});
      Object.assign(state.diplomacy,snap.diplomacy||{});
      state.wonders=snap.wonders||[];
      state.fog=snap.fog||{};
      state.unitSeq=snap.unitSeq||0;
      state.citySeq=snap.citySeq||0;
      // Rebuild tiles
      generateMap(); // creates fresh tiles first
      (snap.tiles||[]).forEach(st=>{
        const tile=getTileById(st.id);
        if(tile){ tile.owner=st.owner; tile.city=st.city; tile.improvement=st.improvement; tile.wonder=st.wonder; tile.fog=st.fog; }
      });
      state.cities=snap.cities||[];
      state.units=(snap.units||[]).map(u=>({...u}));
      return true;
    } catch(e){ return false; }
  }

  function clearSave(){ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} }
  function hasSave(){ return !!localStorage.getItem(SAVE_KEY); }

  // ─── PARTICLES / BANNERS ─────────────────────────────────────────────────────
  function burst(tile,color,count){
    if(!tile) return;
    const p=hexToPixel(tile);
    const actual=FX_LITE?Math.ceil(count*.4):count;
    for(let i=0;i<actual;i++){
      const angle=Math.random()*Math.PI*2, speed=30+Math.random()*120;
      state.particles.push({x:p.x,y:p.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,size:2+Math.random()*3,color,life:.5+Math.random()*.5});
    }
    state.cameraNudge=Math.max(state.cameraNudge,.8);
  }

  function floatText(tile,text,color){
    if(!tile) return;
    const p=hexToPixel(tile);
    state.floats.push({x:p.x,y:p.y-view.size*.5,text,color,life:1.4,vy:-22});
  }

  // ─── QUESTION BANK LOADING ───────────────────────────────────────────────────
  async function loadBank(){
    els.startBtn.disabled=true;
    els.startBtn.textContent="Loading...";
    const resp=await fetch("../../data/chrono-defense-bank.json?v=20260502-source-contract");
    if(!resp.ok) throw new Error(`Bank ${resp.status}`);
    state.bank=await resp.json();
    state.bank.questions=(state.bank.questions||[]).filter(isPlayable);
    rebuildSetIndex(); populateFilters(); applyFilters();
    els.startBtn.disabled=false;
    els.startBtn.textContent=hasSave()?"Continue Empire":"Found Empire";
    if(hasSave()) addContinueButton();
  }

  function addContinueButton(){
    const cont=document.createElement("button");
    cont.className="btn primary"; cont.type="button"; cont.textContent="Continue Empire";
    cont.addEventListener("click",()=>{ if(loadGame()){ state.mode="playing"; els.setupScreen.classList.remove("show"); updateHud(); renderPanel(); } });
    const acts=document.querySelector(".setup-actions");
    if(acts&&!acts.querySelector(".continue-btn")){ cont.classList.add("continue-btn"); acts.insertBefore(cont,acts.firstChild); }
  }

  function rebuildSetIndex(){
    const m={};
    for(const q of state.bank.questions){
      if(!q.course||!q.set) continue;
      if(!m[q.course]) m[q.course]=new Set();
      m[q.course].add(q.set);
    }
    state.bank.courses=Object.keys(m).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    state.bank.setsByCourse=Object.fromEntries(Object.entries(m).map(([c,s])=>[c,[...s].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))]));
  }

  function populateFilters(){
    els.courseFilter.innerHTML=["All Courses",...state.bank.courses].map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");
    populateSets();
  }

  function populateSets(){
    const course=els.courseFilter.value||"All Courses";
    const sets=course==="All Courses"?["All Sets"]:["All Sets",...(state.bank.setsByCourse[course]||[])];
    els.setFilter.innerHTML=sets.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join("");
  }

  function applyFilters(){
    const course=els.courseFilter.value||"All Courses";
    const set=els.setFilter.value||"All Sets";
    state.filtered=state.bank.questions.filter(q=>{
      if(course!=="All Courses"&&q.course!==course) return false;
      if(set!=="All Sets"&&q.set!==set) return false;
      return true;
    });
    if(!state.filtered.length) state.filtered=[...state.bank.questions];
    state.queue=shuffle(state.filtered);
    const best=Number(localStorage.getItem(`${SAVE_KEY}:bestScore`)||0);
    // Glass stat chips with SVG glyph + JetBrains Mono number
    const bookSVG=`<svg class="chip-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5v9a1.5 1.5 0 01-1.5 1.5H8v-1h4.5a.5.5 0 00.5-.5v-9a.5.5 0 00-.5-.5h-9a.5.5 0 00-.5.5V8H2V3.5z" fill="currentColor" opacity=".7"/><path d="M2 9h4v5H3.5A1.5 1.5 0 012 12.5V9z" fill="currentColor" opacity=".55"/></svg>`;
    const globeSVG=`<svg class="chip-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.2" opacity=".7"/><path d="M8 2c0 0-2 2-2 6s2 6 2 6M8 2c0 0 2 2 2 6s-2 6-2 6M2.5 6h11M2.5 10h11" stroke="currentColor" stroke-width="1" opacity=".55"/></svg>`;
    const trophySVG=`<svg class="chip-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 2h8v5a4 4 0 01-8 0V2z" stroke="currentColor" stroke-width="1.2" opacity=".7"/><path d="M4 4H2.5A1.5 1.5 0 001 5.5v.5a2 2 0 002 2H4M12 4h1.5A1.5 1.5 0 0115 5.5v.5a2 2 0 01-2 2H12M8 11v3M6 14h4" stroke="currentColor" stroke-width="1" opacity=".55"/></svg>`;
    const chips=[
      {icon:bookSVG, num:fmtN(state.filtered.length), label:"council questions"},
      {icon:globeSVG, num:fmtN(state.bank.courses.length), label:"courses"},
      {icon:trophySVG, num:fmtN(best), label:"best score"},
      hasSave()?{icon:"", num:"", label:"Save exists — continue above"}:null
    ].filter(Boolean).map(c=>c.num
      ?`<span class="metric-pill">${c.icon}<span class="chip-num">${esc(c.num)}</span><span class="chip-label">${esc(c.label)}</span></span>`
      :`<span class="metric-pill">${esc(c.label)}</span>`
    ).join("");
    els.setupMetrics.innerHTML=chips;
  }

  // ─── CANVAS RESIZE ───────────────────────────────────────────────────────────
  function resize(){
    const dprLimit=FX_LITE?1.12:1.5;
    const dpr=Math.min(dprLimit,window.devicePixelRatio||1);
    view.w=window.innerWidth; view.h=window.innerHeight; view.dpr=dpr;
    canvas.width=Math.max(1,Math.round(view.w*dpr));
    canvas.height=Math.max(1,Math.round(view.h*dpr));
    canvas.style.width=`${view.w}px`;
    canvas.style.height=`${view.h}px`;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    // Auto-fit hex size
    const budgetW=Math.max(280,view.w*(view.w>900?.58:.92));
    const budgetH=view.h*(view.w>900?.8:.55);
    view.size=clamp(Math.min(budgetW/(COLS*1.5+.5),budgetH/(ROWS*1.15)),20,48);
    view.mapW=view.size*(1.5*(COLS-1)+2);
    view.mapH=view.size*Math.sqrt(3)*(ROWS+.6);
    const baseX=view.w>900?(view.w-view.mapW)/2:(view.w-view.mapW)/2;
    const baseY=view.w>900?Math.max(90,(view.h-view.mapH)/2+20):Math.max(150,(view.h-view.mapH)*.4);
    view.ox=baseX+view.panX;
    view.oy=baseY+view.panY;
  }

  // ─── HEX MATH ────────────────────────────────────────────────────────────────
  function hexToPixel(tile){
    const x=view.ox+view.size*1.5*tile.q;
    const y=view.oy+view.size*Math.sqrt(3)*(tile.r+.5*(tile.q&1));
    return {x,y};
  }

  function pixelToTile(px,py){
    let best=null, bestD=Infinity;
    for(const tile of state.tiles){
      const p=hexToPixel(tile);
      const d=Math.hypot(px-p.x,py-p.y);
      if(d<bestD){ bestD=d; best=tile; }
    }
    return bestD<view.size*.92?best:null;
  }

  function hexPath(x,y,size){
    ctx.beginPath();
    for(let i=0;i<6;i++){
      const a=Math.PI/180*(60*i);
      const px=x+size*Math.cos(a), py=y+size*Math.sin(a);
      if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
    }
    ctx.closePath();
  }

  // ─── RENDERING ───────────────────────────────────────────────────────────────
  function draw(){
    drawBackground();
    ctx.save();
    const nudge=Math.sin(state.elapsed*.8)*state.cameraNudge;
    ctx.translate(nudge,nudge*.35);
    drawMap();
    drawUnits();
    drawParticles();
    ctx.restore();
    drawMinimap();
    drawTooltip();
  }

  // Era background tint palettes [bg0, bg1]
  const ERA_BG=[
    ["#071013","#0d1a1f"],  // Ancient
    ["#0f0b08","#130f0a"],  // Classical
    ["#0c0d08","#121308"],  // Medieval
    ["#09080d","#0d0c14"],  // Industrial
  ];

  function drawBackground(){
    const pal=ERA_BG[clamp(state.era,0,3)];
    const g=ctx.createLinearGradient(0,0,view.w,view.h);
    g.addColorStop(0,pal[0]); g.addColorStop(.55,pal[1]); g.addColorStop(1,pal[0]);
    ctx.fillStyle=g; ctx.fillRect(0,0,view.w,view.h);
    if(!FX_LITE){
      // Subtle diagonal hatching — parchment paper feel
      ctx.save(); ctx.globalAlpha=.032; ctx.strokeStyle="#fbf5e6"; ctx.lineWidth=.8;
      for(let x=-80;x<view.w+80;x+=52){
        ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x+view.h*.38,view.h); ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawMap(){
    // Draw in two passes: terrain, then overlays
    for(const tile of state.tiles) drawTile(tile);
    for(const tile of state.tiles) drawTileOverlay(tile);
    // Draw reachable overlay for movement mode
    if(state.pendingMove){
      const reach=state.pendingMove.reachable;
      ctx.save();
      for(const t of reach){
        const p=hexToPixel(t);
        ctx.globalAlpha=.35+Math.sin(state.elapsed*4+t.pulse)*.15;
        hexPath(p.x,p.y,view.size-4);
        ctx.fillStyle="rgba(123,223,242,.40)";
        ctx.fill();
        ctx.strokeStyle="#7bdff2";
        ctx.lineWidth=2; ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Per-terrain painterly accent tints layered over base fill
  const TERRAIN_TEXTURE = {
    ocean:    { dot:null,    dotColor:null },
    coast:    { dot:"stipple", dotColor:"rgba(123,223,242,.18)" },
    plains:   { dot:"fine",    dotColor:"rgba(251,245,200,.10)" },
    grassland:{ dot:"fine",    dotColor:"rgba(119,217,155,.14)" },
    desert:   { dot:"wave",    dotColor:"rgba(242,193,78,.16)"  },
    forest:   { dot:"line",    dotColor:"rgba(47,113,79,.28)"   },
    hills:    { dot:"cross",   dotColor:"rgba(131,104,77,.22)"  },
    river:    { dot:"dash",    dotColor:"rgba(123,223,242,.20)" },
    mountain: { dot:"diamond", dotColor:"rgba(201,208,212,.18)" }
  };

  function drawTerrainTexture(px,py,type,size){
    if(FX_LITE) return;
    const tex=TERRAIN_TEXTURE[type]; if(!tex||!tex.dot) return;
    ctx.save();
    ctx.globalAlpha=1;
    ctx.fillStyle=tex.dotColor||"rgba(255,255,255,.1)";
    ctx.strokeStyle=tex.dotColor||"rgba(255,255,255,.1)";
    ctx.lineWidth=1;
    const s=size*.7;
    // Clip to hex
    hexPath(px,py,size-3); ctx.clip();

    if(tex.dot==="fine"||tex.dot==="stipple"){
      const sp=tex.dot==="fine"?9:13;
      for(let dx=-s;dx<=s;dx+=sp){
        for(let dy=-s;dy<=s;dy+=sp){
          const jx=dx+(dy%2?sp*.5:0), jy=dy;
          ctx.beginPath(); ctx.arc(px+jx,py+jy,1.2,0,Math.PI*2); ctx.fill();
        }
      }
    } else if(tex.dot==="line"){
      for(let dy=-s;dy<=s;dy+=8){
        ctx.beginPath(); ctx.moveTo(px-s,py+dy); ctx.lineTo(px+s,py+dy); ctx.stroke();
      }
    } else if(tex.dot==="cross"){
      for(let dx=-s;dx<=s;dx+=10){
        for(let dy=-s;dy<=s;dy+=10){
          ctx.beginPath();
          ctx.moveTo(px+dx-3,py+dy); ctx.lineTo(px+dx+3,py+dy);
          ctx.moveTo(px+dx,py+dy-3); ctx.lineTo(px+dx,py+dy+3);
          ctx.stroke();
        }
      }
    } else if(tex.dot==="wave"){
      for(let dy=-s;dy<=s;dy+=9){
        ctx.beginPath();
        for(let dx=-s;dx<=s;dx+=3){
          const wY=py+dy+Math.sin((dx+s)*.4)*3;
          if(dx===-s) ctx.moveTo(px+dx,wY); else ctx.lineTo(px+dx,wY);
        }
        ctx.stroke();
      }
    } else if(tex.dot==="dash"){
      for(let dy=-s;dy<=s;dy+=8){
        for(let dx=-s;dx<=s;dx+=14){
          ctx.beginPath(); ctx.moveTo(px+dx,py+dy); ctx.lineTo(px+dx+7,py+dy); ctx.stroke();
        }
      }
    } else if(tex.dot==="diamond"){
      const ds=9;
      for(let dx=-s;dx<=s;dx+=ds){
        for(let dy=-s;dy<=s;dy+=ds){
          ctx.beginPath();
          ctx.moveTo(px+dx,py+dy-4); ctx.lineTo(px+dx+4,py+dy);
          ctx.lineTo(px+dx,py+dy+4); ctx.lineTo(px+dx-4,py+dy);
          ctx.closePath(); ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  function drawTile(tile){
    const p=hexToPixel(tile);
    const fogged=tile.fog&&!state.fog[tile.id];
    const ter=TERRAIN[tile.terrain];
    ctx.save();
    if(!FX_LITE){ ctx.shadowColor="rgba(0,0,0,.42)"; ctx.shadowBlur=10; ctx.shadowOffsetY=4; }
    hexPath(p.x,p.y,view.size-2);
    if(fogged){
      // Explored-but-not-visible: slightly desaturated dark
      const wasExplored=state.fog[tile.id]===true&&tile.fog;
      ctx.fillStyle=wasExplored?"#111c20":"#0a1318";
      ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,.05)"; ctx.lineWidth=1; ctx.stroke();
      ctx.restore(); return;
    }
    // Painterly radial gradient fill
    const fill=ctx.createRadialGradient(
      p.x-view.size*.28,p.y-view.size*.32,view.size*.08,
      p.x,p.y,view.size*1.05
    );
    fill.addColorStop(0,lighten(ter.color,.22));
    fill.addColorStop(.6,ter.color);
    fill.addColorStop(1,lighten(ter.color,-.08));
    ctx.fillStyle=fill; ctx.fill();
    // Edge stroke — subtle, faint
    ctx.strokeStyle=ter.edge; ctx.lineWidth=1.2; ctx.globalAlpha=.55; ctx.stroke();
    ctx.globalAlpha=1;
    ctx.restore();

    // Painterly texture overlay
    drawTerrainTexture(p.x,p.y,tile.terrain,view.size);

    // Owner territory fill
    if(tile.owner){
      ctx.save();
      hexPath(p.x,p.y,view.size-5);
      ctx.fillStyle=CIVS[tile.owner].fill; ctx.fill();
      ctx.strokeStyle=CIVS[tile.owner].color;
      ctx.lineWidth=tile.owner==="player"?3:2;
      ctx.globalAlpha=tile.owner==="player"?.9:.7;
      ctx.stroke();
      ctx.restore();
    }

    // Pulsing adjacent-unclaimed indicator
    if(!tile.owner&&!fogged&&isPlayerAdjacent(tile)){
      ctx.save();
      ctx.globalAlpha=.48+Math.sin(state.elapsed*2.8+tile.pulse)*.20;
      hexPath(p.x,p.y,view.size-7);
      ctx.strokeStyle="rgba(242,193,78,.9)"; ctx.lineWidth=2; ctx.stroke();
      ctx.restore();
    }

    // Selected highlight — gold glow ring
    if(state.selected===tile){
      ctx.save();
      ctx.shadowColor="#f2c14e"; ctx.shadowBlur=24;
      hexPath(p.x,p.y,view.size+2);
      ctx.strokeStyle="#f2c14e"; ctx.lineWidth=3.5; ctx.globalAlpha=.95; ctx.stroke();
      ctx.restore();
    }

    // Selected unit tile — cyan glow ring
    if(state.selUnit&&state.selUnit.tileId===tile.id){
      ctx.save();
      ctx.shadowColor="#7bdff2"; ctx.shadowBlur=18;
      hexPath(p.x,p.y,view.size+2);
      ctx.strokeStyle="#7bdff2"; ctx.lineWidth=2.5; ctx.globalAlpha=.88; ctx.stroke();
      ctx.restore();
    }
  }

  // Refined resource glyphs — drawn as canvas shapes (no emoji)
  function drawResourceGlyph(px,py,resourceKey,size){
    const s=Math.max(7,size*.22);
    ctx.save();
    ctx.shadowColor="rgba(0,0,0,.55)"; ctx.shadowBlur=4;
    ctx.translate(px,py);
    switch(resourceKey){
      case "iron": {
        ctx.strokeStyle="#c0b9c0"; ctx.lineWidth=s*.28; ctx.lineCap="round";
        ctx.beginPath(); ctx.moveTo(-s*.4,s*.4); ctx.lineTo(s*.4,-s*.4); ctx.stroke(); // diagonal bar
        ctx.beginPath(); ctx.moveTo(-s*.4,-s*.2); ctx.lineTo(-s*.2,-s*.4); ctx.lineTo(s*.3,s*.3); ctx.stroke();
        break;
      }
      case "horses": {
        ctx.strokeStyle="#c8a96e"; ctx.lineWidth=s*.22; ctx.lineCap="round";
        ctx.beginPath(); ctx.arc(0,-s*.15,s*.38,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s*.12,s*.22); ctx.lineTo(-s*.12,s*.55);
        ctx.moveTo(s*.12,s*.22); ctx.lineTo(s*.12,s*.55); ctx.stroke();
        break;
      }
      case "gold_r": {
        ctx.strokeStyle="#f2c14e"; ctx.fillStyle="rgba(242,193,78,.25)";
        ctx.lineWidth=s*.20;
        ctx.beginPath();
        for(let i=0;i<6;i++){
          const a=Math.PI/180*(60*i-30), r2=s*.28+(i%2?0:s*.18);
          if(i===0) ctx.moveTo(Math.cos(a)*r2,Math.sin(a)*r2);
          else ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      }
      case "silk": {
        ctx.strokeStyle="#e8a0d0"; ctx.lineWidth=s*.18;
        for(let i=0;i<3;i++){
          const angle=i*Math.PI*2/3;
          ctx.beginPath();
          ctx.moveTo(0,0);
          ctx.bezierCurveTo(
            Math.cos(angle-0.5)*s*.6, Math.sin(angle-0.5)*s*.6,
            Math.cos(angle+0.5)*s*.6, Math.sin(angle+0.5)*s*.6,
            Math.cos(angle)*s*.45, Math.sin(angle)*s*.45
          );
          ctx.stroke();
        }
        break;
      }
      case "scrolls": {
        ctx.strokeStyle="#7bdff2"; ctx.fillStyle="rgba(123,223,242,.18)";
        ctx.lineWidth=s*.18;
        ctx.beginPath();
        ctx.arc(-s*.15,0,s*.38,0,Math.PI*2);
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s*.08,-s*.28); ctx.lineTo(s*.08,s*.28); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s*.06,-s*.16); ctx.lineTo(s*.08,-s*.16);
        ctx.moveTo(-s*.06,0);     ctx.lineTo(s*.08,0);
        ctx.moveTo(-s*.06,s*.16); ctx.lineTo(s*.08,s*.16); ctx.stroke();
        break;
      }
    }
    ctx.restore();
  }

  function drawTileOverlay(tile){
    const fogged=tile.fog&&!state.fog[tile.id];
    if(fogged) return;
    const p=hexToPixel(tile);
    // Resource icon — refined canvas glyph
    if(tile.resource&&view.size>28){
      drawResourceGlyph(p.x,p.y-view.size*.35,tile.resource,view.size);
    }
    // Improvement
    if(tile.improvement) drawImprovementIcon(p.x,p.y,tile.improvement);
    // City
    if(tile.city){
      const city=cityById(tile.city);
      if(city) drawCity(p.x,p.y,city,tile);
    }
    // Wonder star
    if(tile.wonder){
      ctx.save();
      ctx.fillStyle="#f2c14e"; ctx.shadowColor="#f2c14e"; ctx.shadowBlur=12;
      ctx.font=`${Math.max(12,view.size*.25)}px Inter,system-ui,sans-serif`;
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText("★",p.x,p.y-view.size*.6);
      ctx.restore();
    }
    // City name banner
    if(tile.city&&view.size>28){
      const city=cityById(tile.city);
      if(city){
        const nameY=p.y+view.size*.88;
        const fontSize=Math.max(9,view.size*.16);
        ctx.save();
        ctx.font=`600 ${fontSize}px 'Fraunces', Georgia, serif`;
        ctx.textAlign="center"; ctx.textBaseline="middle";
        const nameW=ctx.measureText(city.name).width;
        // Banner backing
        ctx.fillStyle="rgba(7,16,19,.72)";
        ctx.strokeStyle=CIVS[city.civId]?.color||"rgba(255,255,255,.3)";
        ctx.lineWidth=.8;
        roundRect(ctx,p.x-nameW/2-5,nameY-fontSize*.6,nameW+10,fontSize*1.3,3);
        ctx.fill(); ctx.stroke();
        // Name text
        ctx.shadowColor="rgba(0,0,0,.80)"; ctx.shadowBlur=4;
        ctx.fillStyle="rgba(251,245,230,.94)";
        ctx.fillText(city.name,p.x,nameY);
        ctx.restore();
      }
    }
  }

  function drawCity(x,y,city,tile){
    const color=CIVS[city.civId]?.color||"#fbf5e6";
    const era=state.era; // 0=Ancient 1=Classical 2=Medieval 3=Industrial
    const s=view.size;
    ctx.save();
    ctx.translate(x,y);
    ctx.shadowColor=color; ctx.shadowBlur=16;

    // Shadow base
    ctx.fillStyle="rgba(0,0,0,.40)";
    ctx.fillRect(-s*.35,-s*.04,s*.70,s*.30);

    ctx.fillStyle=color;
    if(era===0){
      // Ancient: simple hut cluster
      ctx.fillRect(-s*.22,-s*.16,s*.12,s*.36);
      ctx.beginPath(); ctx.moveTo(-s*.28,s*.20); ctx.lineTo(-s*.10,s*.20);
      ctx.lineTo(-s*.16,-s*.18); ctx.closePath(); ctx.fill(); // triangle roof
      ctx.fillRect(-s*.05,-s*.26,s*.14,s*.46);
      ctx.beginPath(); ctx.moveTo(-s*.11,s*.20); ctx.lineTo(s*.11,s*.20);
      ctx.lineTo(s*.05,-s*.28); ctx.closePath(); ctx.fill();
      ctx.fillRect(s*.08,-s*.12,s*.12,s*.32);
    } else if(era===1){
      // Classical: colonnade
      for(let col=-2;col<=2;col++){
        ctx.fillRect(col*s*.10-s*.04,-s*.32,s*.06,s*.52);
      }
      ctx.fillRect(-s*.28,-s*.36,s*.56,s*.07); // entablature
      ctx.fillRect(-s*.32,-s*.02,s*.64,s*.22); // base
    } else if(era===2){
      // Medieval: walled city with tower
      ctx.fillRect(-s*.30,-s*.08,s*.60,s*.36); // base wall
      ctx.fillRect(-s*.10,-s*.40,s*.20,s*.44); // main tower
      ctx.fillRect(-s*.28,-s*.24,s*.10,s*.30); // side tower L
      ctx.fillRect(s*.18,-s*.24,s*.10,s*.30);  // side tower R
      // Crenellations
      for(let t=-2;t<=2;t++){
        ctx.fillRect(t*s*.07-s*.03,-s*.44,s*.04,s*.10);
      }
    } else {
      // Industrial: factory + chimney
      ctx.fillRect(-s*.30,-s*.10,s*.60,s*.38); // factory body
      ctx.fillRect(-s*.08,-s*.44,s*.14,s*.48); // main chimney
      ctx.fillRect(s*.12,-s*.34,s*.10,s*.38);  // small chimney
      // Smoke puffs
      ctx.globalAlpha=.4+Math.sin(state.elapsed*2.2)*.2;
      ctx.beginPath(); ctx.arc(-s*.01,-s*.50,s*.09,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(s*.06,-s*.54,s*.07,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
    }

    // Capital pennant
    if(city.capital){
      ctx.fillStyle="#fbf5e6"; ctx.strokeStyle=color; ctx.lineWidth=1.5;
      const topY=era===0?-s*.22:era===1?-s*.40:era===2?-s*.48:-s*.48;
      ctx.beginPath();
      ctx.moveTo(0,topY);
      ctx.lineTo(s*.26,topY+s*.08);
      ctx.lineTo(0,topY+s*.18);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Flagpole
      ctx.strokeStyle="#fbf5e6"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(0,topY+s*.18); ctx.lineTo(0,topY+s*.50); ctx.stroke();
    }

    // Food progress bar (population growth)
    if(s>26){
      const barW=s*.52, barH=3.5, barY=s*.46;
      ctx.fillStyle="rgba(0,0,0,.38)";
      roundRect(ctx,-barW/2,barY,barW,barH,2); ctx.fill();
      ctx.fillStyle=color;
      roundRect(ctx,-barW/2,barY,Math.max(0,barW*(city.food/city.foodNeeded)),barH,2); ctx.fill();
    }

    // Population dots
    if(s>30&&city.pop>1){
      const dotR=2.5, dotY=s*.55;
      const count=Math.min(city.pop,6);
      const spread=(count-1)*7;
      ctx.fillStyle="#fbf5e6"; ctx.globalAlpha=.8;
      for(let i=0;i<count;i++){
        ctx.beginPath();
        ctx.arc(-spread/2+i*7,dotY,dotR,0,Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha=1;
    }

    ctx.restore();
  }

  // Helper: rounded rect path
  function roundRect(c,x,y,w,h,r){
    c.beginPath();
    c.moveTo(x+r,y); c.lineTo(x+w-r,y);
    c.quadraticCurveTo(x+w,y,x+w,y+r);
    c.lineTo(x+w,y+h-r);
    c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    c.lineTo(x+r,y+h);
    c.quadraticCurveTo(x,y+h,x,y+h-r);
    c.lineTo(x,y+r);
    c.quadraticCurveTo(x,y,x+r,y);
    c.closePath();
  }

  function drawImprovementIcon(x,y,key){
    const imp=IMPROVEMENTS[key]; if(!imp) return;
    ctx.save();
    ctx.translate(x,y+view.size*.3);
    ctx.strokeStyle="#77d99b"; ctx.fillStyle="#77d99b"; ctx.lineWidth=1.5;
    if(key==="farm"){ for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*view.size*.10,-view.size*.14); ctx.lineTo(i*view.size*.10+view.size*.05,view.size*.10); ctx.stroke(); } }
    else if(key==="mine"){ ctx.fillStyle="#c0b9c0"; ctx.fillRect(-view.size*.14,-view.size*.14,view.size*.28,view.size*.22); }
    else if(key==="lumbercamp"){ ctx.strokeStyle="#2f714f"; ctx.beginPath(); ctx.moveTo(0,-view.size*.18); ctx.lineTo(view.size*.16,view.size*.14); ctx.lineTo(-view.size*.16,view.size*.14); ctx.closePath(); ctx.stroke(); }
    else if(key==="trading_post"){ ctx.strokeStyle="#f2c14e"; for(let i=0;i<4;i++){ const a=i*Math.PI/2; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*view.size*.18,Math.sin(a)*view.size*.18); ctx.stroke(); } }
    else if(key==="fishing_boats"){ ctx.strokeStyle="#7bdff2"; ctx.beginPath(); ctx.arc(0,-view.size*.05,view.size*.18,0,Math.PI); ctx.stroke(); }
    ctx.restore();
  }

  // Refined unit symbol glyphs (drawn as shapes)
  function drawUnitGlyph(defKey, r){
    ctx.fillStyle="#071013"; ctx.strokeStyle="#071013";
    ctx.lineWidth=Math.max(1,r*.14); ctx.lineCap="round";
    switch(defKey){
      case "warrior": {
        // Sword diagonal
        ctx.strokeStyle="#fbf5e6"; ctx.lineWidth=r*.14;
        ctx.beginPath(); ctx.moveTo(-r*.35,-r*.35); ctx.lineTo(r*.35,r*.35); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-r*.35,-r*.05); ctx.lineTo(-r*.05,-r*.35); ctx.stroke(); // guard
        break;
      }
      case "archer": {
        // Bow arc + arrow
        ctx.strokeStyle="#fbf5e6"; ctx.lineWidth=r*.11;
        ctx.beginPath(); ctx.arc(0,0,r*.32,Math.PI*.25,Math.PI*.75); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,-r*.38); ctx.lineTo(0,r*.38); ctx.stroke();
        break;
      }
      case "horseman": case "knight": {
        // Chevron
        ctx.strokeStyle="#fbf5e6"; ctx.lineWidth=r*.14;
        ctx.beginPath();
        ctx.moveTo(-r*.32,-r*.12); ctx.lineTo(0,-r*.38); ctx.lineTo(r*.32,-r*.12);
        ctx.moveTo(-r*.22,r*.16);  ctx.lineTo(0,-r*.08);  ctx.lineTo(r*.22,r*.16);
        ctx.stroke();
        break;
      }
      case "settler": {
        // Tent shape
        ctx.strokeStyle="#fbf5e6"; ctx.lineWidth=r*.12;
        ctx.beginPath(); ctx.moveTo(-r*.36,r*.28); ctx.lineTo(0,-r*.38); ctx.lineTo(r*.36,r*.28); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-r*.22,r*.28); ctx.lineTo(r*.22,r*.28); ctx.stroke();
        break;
      }
      case "worker": {
        // Pickaxe
        ctx.strokeStyle="#fbf5e6"; ctx.lineWidth=r*.12;
        ctx.beginPath(); ctx.moveTo(-r*.30,r*.30); ctx.lineTo(r*.30,-r*.30); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(r*.08,-r*.34); ctx.lineTo(r*.34,-r*.08); ctx.lineTo(r*.16,r*.08); ctx.stroke();
        break;
      }
      case "scholar": {
        // Book rectangle
        ctx.strokeStyle="#fbf5e6"; ctx.lineWidth=r*.11;
        ctx.beginPath();
        ctx.rect(-r*.22,-r*.32,r*.44,r*.52);
        ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-r*.22,-.5); ctx.lineTo(r*.22,-.5); ctx.stroke();
        break;
      }
      default: {
        ctx.fillStyle="#fbf5e6";
        ctx.font=`600 ${Math.max(7,r*.8)}px Inter,sans-serif`;
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText("?",0,1);
      }
    }
  }

  function drawUnits(){
    for(const u of state.units){
      const tile=getTileById(u.tileId); if(!tile) continue;
      const fogged=tile.fog&&!state.fog[tile.id]; if(fogged&&u.civId!=="player") continue;
      const p=hexToPixel(tile);
      // Lerp animation (lite mode: snap immediately, no easing)
      if(u.animFrac<1){ u.animFrac=FX_LITE?1:Math.min(1,u.animFrac+.12); }
      const ox=u.animX*(1-u.animFrac), oy=u.animY*(1-u.animFrac);
      const ux=p.x+ox, uy=p.y+oy;
      const civ=CIVS[u.civId];
      const sel=state.selUnit===u;
      const r=view.size*.24;

      ctx.save();
      ctx.translate(ux,uy-view.size*.18);

      // Drop shadow ellipse
      ctx.fillStyle="rgba(0,0,0,.42)";
      ctx.beginPath(); ctx.ellipse(0,view.size*.16,r*.8,r*.32,0,0,Math.PI*2); ctx.fill();

      // Body circle
      ctx.shadowColor=sel?"#ffffff":civ.color; ctx.shadowBlur=sel?18:10;
      ctx.fillStyle=sel?lighten(civ.color,.14):civ.color;
      ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
      // Inner ring
      ctx.strokeStyle=sel?"rgba(255,255,255,.8)":"rgba(0,0,0,.36)";
      ctx.lineWidth=sel?2:1.4; ctx.stroke();
      ctx.shadowBlur=0;

      // Unit glyph
      drawUnitGlyph(u.def,r);

      // HP bar (only combat units, only when damaged)
      if(u.str>0&&u.hp<u.maxHp){
        const bw=r*1.7, bh=3.5, by=r+4;
        ctx.fillStyle="rgba(0,0,0,.52)";
        roundRect(ctx,-bw/2,by,bw,bh,2); ctx.fill();
        ctx.fillStyle=u.hp>60?"#77d99b":u.hp>30?"#f2c14e":"#ff6f6f";
        roundRect(ctx,-bw/2,by,bw*(u.hp/u.maxHp),bh,2); ctx.fill();
      }

      // Movement-points pip (player units only)
      if(u.civId==="player"&&view.size>30){
        const totalMv=UNIT_DEFS[u.def]?.mv||2;
        const mvFrac=u.mvLeft/totalMv;
        ctx.fillStyle=mvFrac>0?"rgba(123,223,242,.90)":"rgba(255,111,111,.70)";
        ctx.beginPath(); ctx.arc(r*.62,-r*.62,3,0,Math.PI*2); ctx.fill();
      }

      // Exhausted overlay (player unit, fully moved)
      if(u.moved&&u.civId==="player"&&u.mvLeft===0){
        ctx.globalAlpha=.48;
        ctx.fillStyle="rgba(7,16,19,.7)";
        ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha=1;
      }

      ctx.restore();
    }
  }

  function drawParticles(){
    ctx.save();
    for(const p of state.particles){
      ctx.globalAlpha=clamp(p.life,0,1); ctx.fillStyle=p.color;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
    }
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.font=`600 ${Math.max(13,view.size*.28)}px 'Fraunces', Georgia, serif`;
    for(const f of state.floats){
      ctx.globalAlpha=clamp(f.life,0,1); ctx.fillStyle=f.color;
      ctx.shadowColor="rgba(0,0,0,.60)"; ctx.shadowBlur=7;
      ctx.fillText(f.text,f.x,f.y);
    }
    ctx.shadowBlur=0;
    ctx.restore();
  }

  // ─── MINIMAP ─────────────────────────────────────────────────────────────────
  function drawMinimap(){
    if(view.w<700) return;
    const mmW=148, mmH=96, mmX=view.w-mmW-16, mmY=view.h-mmH-16;
    ctx.save();

    // Outer frame
    ctx.fillStyle="rgba(7,16,19,.88)";
    ctx.strokeStyle="rgba(242,193,78,.28)";
    ctx.lineWidth=1.5;
    roundRect(ctx,mmX-1,mmY-1,mmW+2,mmH+2,6); ctx.fill(); ctx.stroke();

    // Interior clip
    roundRect(ctx,mmX,mmY,mmW,mmH,5); ctx.clip();

    const tw=mmW/COLS, th=mmH/ROWS;
    for(const tile of state.tiles){
      const fogged=tile.fog&&!state.fog[tile.id];
      const x=mmX+tile.q*tw, y=mmY+tile.r*th;
      if(fogged){
        ctx.globalAlpha=.18;
        ctx.fillStyle="#0e1a1e";
      } else if(tile.owner){
        ctx.globalAlpha=.80;
        ctx.fillStyle=CIVS[tile.owner].color;
      } else {
        ctx.globalAlpha=.70;
        ctx.fillStyle=TERRAIN[tile.terrain].color;
      }
      ctx.fillRect(x,y,tw+.3,th+.3);
    }

    // City dots — white glow
    ctx.globalAlpha=1;
    for(const c of state.cities){
      const tile=getTileById(c.tileId); if(!tile) continue;
      if(tile.fog&&!state.fog[tile.id]) continue;
      const cx=mmX+tile.q*tw+tw/2, cy=mmY+tile.r*th+th/2;
      ctx.shadowColor="#fbf5e6"; ctx.shadowBlur=4;
      ctx.fillStyle=c.civId==="player"?"#f2c14e":"#fbf5e6";
      ctx.beginPath(); ctx.arc(cx,cy,c.capital?3:1.8,0,Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur=0;

    // Viewport indicator
    const vpX=mmX+(view.panX>0?0:Math.abs(view.panX)/view.size*tw*.5);
    ctx.strokeStyle="rgba(255,255,255,.45)"; ctx.lineWidth=1;
    ctx.strokeRect(mmX+2,mmY+2,mmW-4,mmH-4);

    // Label
    ctx.restore();
    ctx.save();
    ctx.fillStyle="rgba(242,193,78,.75)";
    ctx.font=`500 9px 'Inter', sans-serif`;
    ctx.textAlign="center";
    ctx.fillText("WORLD",mmX+mmW/2,mmY-4);
    ctx.restore();
  }

  // ─── TOOLTIP ─────────────────────────────────────────────────────────────────
  let hoverTile=null, hoverPos={x:0,y:0};
  // Era accent colors matching CSS tokens
  const ERA_ACCENT=["#f2c14e","#d98a5d","#f2c14e","#b79cff"];

  function drawTooltip(){
    if(!hoverTile||state.mode!=="playing") return;
    const tile=hoverTile; if(tile.fog&&!state.fog[tile.id]) return;
    const ter=TERRAIN[tile.terrain];
    const resLabel=tile.resource?RESOURCES[tile.resource]?.label:"";
    const line1=ter.label+(resLabel?` · ${resLabel}`:"")+
      (tile.owner?` — ${CIVS[tile.owner].name}`:" — Unclaimed");
    const line2=`+${ter.g}g +${ter.f}f +${ter.p}p +${ter.s}s`+
      (tile.improvement?` | ${IMPROVEMENTS[tile.improvement]?.name||""}`:"")+
      (tile.city?` | ${cityById(tile.city)?.name||"City"}`:"");

    const px=clamp(hoverPos.x+16,8,view.w-168);
    const py=clamp(hoverPos.y-52,8,view.h-62);
    const W=162, H=46, R=5;
    const accent=ERA_ACCENT[clamp(state.era,0,3)];

    ctx.save();
    // Shadow
    ctx.shadowColor="rgba(0,0,0,.4)"; ctx.shadowBlur=12; ctx.shadowOffsetY=4;
    ctx.fillStyle="rgba(7,16,19,.94)";
    roundRect(ctx,px,py,W,H,R); ctx.fill();
    ctx.shadowBlur=0; ctx.shadowOffsetY=0;
    // Border
    ctx.strokeStyle=accent; ctx.lineWidth=.8; ctx.globalAlpha=.55;
    roundRect(ctx,px,py,W,H,R); ctx.stroke();
    ctx.globalAlpha=1;
    // Top accent line
    ctx.fillStyle=accent; ctx.globalAlpha=.7;
    roundRect(ctx,px,py,W,3,R); ctx.fill();
    ctx.globalAlpha=1;
    // Text
    ctx.fillStyle="#fbf5e6";
    ctx.font=`600 11px 'Fraunces', Georgia, serif`;
    ctx.textAlign="left"; ctx.textBaseline="alphabetic";
    ctx.fillText(line1.slice(0,24),px+8,py+17);
    ctx.fillStyle="#b6c1bd"; ctx.font=`400 10px 'Inter', sans-serif`;
    ctx.fillText(line2.slice(0,30),px+8,py+34);
    ctx.restore();
  }

  // ─── UPDATE LOOP ─────────────────────────────────────────────────────────────
  function update(dt){
    state.elapsed+=dt;
    state.cameraNudge=Math.max(0,state.cameraNudge-dt*4);
    for(const p of state.particles){ p.life-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=.98; p.vy=p.vy*.98+28*dt; }
    state.particles=state.particles.filter(p=>p.life>0);
    for(const f of state.floats){ f.life-=dt; f.y+=f.vy*dt; f.vy*=.95; }
    state.floats=state.floats.filter(f=>f.life>0);
  }

  function loop(now){
    const dt=Math.min(.033,((now||0)-(state.last||now||0))/1000||.016);
    state.last=now||0;
    update(dt); draw();
    requestAnimationFrame(loop);
  }

  // ─── INPUT BINDING ───────────────────────────────────────────────────────────
  function lighten(hex,amount){
    const r=hex.replace("#","");
    const parse=s=>clamp(parseInt(s,16)+255*amount,0,255);
    return `rgb(${Math.round(parse(r.slice(0,2)))},${Math.round(parse(r.slice(2,4)))},${Math.round(parse(r.slice(4,6)))})`;
  }

  function bind(){
    window.addEventListener("resize",()=>{ resize(); });

    // ── Pointer (desktop + mobile tap) ──
    canvas.addEventListener("pointerdown",(e)=>{
      if(state.mode!=="playing") return;
      audio._ctx();
      view.dragging=false;
      view.dragStart={x:e.clientX,y:e.clientY};
      view._panStart={x:view.panX,y:view.panY};
    });

    canvas.addEventListener("pointermove",(e)=>{
      const tile=pixelToTile(e.clientX,e.clientY);
      hoverTile=tile; hoverPos={x:e.clientX,y:e.clientY};
      if(!(e.buttons&1)) return;
      const dx=e.clientX-view.dragStart.x, dy=e.clientY-view.dragStart.y;
      if(Math.hypot(dx,dy)>8){
        view.dragging=true;
        view.panX=view._panStart.x+dx;
        view.panY=view._panStart.y+dy;
        view.ox=getBaseOx()+view.panX;
        view.oy=getBaseOy()+view.panY;
      }
    });

    canvas.addEventListener("pointerup",(e)=>{
      if(state.mode!=="playing"||view.dragging) return;
      const tile=pixelToTile(e.clientX,e.clientY);
      if(!tile) return;

      // Movement mode: click destination
      if(state.pendingMove){
        const reach=state.pendingMove.reachable;
        const unit=state.pendingMove.unit;
        if(reach.includes(tile)){
          // Check for enemy at tile
          const enemyUnit=unitsAt(tile).find(u=>u.civId!==unit.civId);
          if(enemyUnit&&UNIT_DEFS[unit.def].str>0){
            resolveCombat(unit,tile);
          } else {
            moveUnit(unit,tile);
          }
          exitMoveMode();
          renderPanel(); updateHud();
        } else {
          exitMoveMode();
        }
        return;
      }

      // Select unit if present
      const myUnits=unitsAt(tile).filter(u=>u.civId==="player");
      if(myUnits.length){
        state.selUnit=myUnits[0];
        state.selected=tile;
        state.panel="province";
        audio.select();
        renderPanel();
        return;
      }
      // Deselect unit, select tile
      state.selUnit=null;
      state.selected=tile;
      state.panel="province";
      audio.select();
      renderPanel();
      setAdvisor(`${TERRAIN[tile.terrain].label}`,`${tile.owner?CIVS[tile.owner].name+" territory":"Unclaimed"}`+
        (tile.city?` | ${cityById(tile.city)?.name||"City"}`:""),
        tile.fog&&!state.fog[tile.id]?"Fogged — scout to reveal.":"Select an action below.","");
    });

    // Scroll zoom
    canvas.addEventListener("wheel",(e)=>{
      e.preventDefault();
      const delta=e.deltaY>0?-.1:.1;
      view.size=clamp(view.size*(1+delta),16,60);
      // Adjust origin to zoom toward mouse
      const tx=e.clientX, ty=e.clientY;
      view.ox=tx-(tx-view.ox)*(1+delta);
      view.oy=ty-(ty-view.oy)*(1+delta);
    },{passive:false});

    // Pinch zoom (mobile)
    let lastPinch=0;
    canvas.addEventListener("touchstart",(e)=>{
      if(e.touches.length===2){
        lastPinch=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
      }
    },{passive:true});
    canvas.addEventListener("touchmove",(e)=>{
      if(e.touches.length===2){
        const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
        const scale=d/lastPinch; lastPinch=d;
        view.size=clamp(view.size*scale,16,60);
        const mx=(e.touches[0].clientX+e.touches[1].clientX)/2;
        const my=(e.touches[0].clientY+e.touches[1].clientY)/2;
        view.ox=mx-(mx-view.ox)*scale;
        view.oy=my-(my-view.oy)*scale;
      }
    },{passive:true});

    // Buttons
    els.courseFilter.addEventListener("change",()=>{ populateSets(); applyFilters(); });
    els.setFilter.addEventListener("change",applyFilters);
    els.panelTabs.forEach(b=>b.addEventListener("click",()=>{ state.panel=b.dataset.panel||"province"; renderPanel(); }));
    els.startBtn.addEventListener("click",()=>startGame(true));
    els.endTurnBtn.addEventListener("click",endTurn);
    els.pauseBtn.addEventListener("click",()=>{ if(state.mode==="playing"){state.mode="menu";els.menuScreen.classList.add("show");} else if(state.mode==="menu"){state.mode="playing";els.menuScreen.classList.remove("show");} });
    els.resumeBtn.addEventListener("click",()=>{ state.mode="playing"; els.menuScreen.classList.remove("show"); updateHud(); });
    els.restartBtn.addEventListener("click",()=>{ els.menuScreen.classList.remove("show"); startGame(true); });
    els.againBtn.addEventListener("click",()=>startGame(true));
    els.setupBtn.addEventListener("click",()=>{ state.mode="setup"; els.setupScreen.classList.add("show"); els.endScreen.classList.remove("show"); });
    els.exitBtn.addEventListener("click",()=>window.location.href="../../");
    els.menuExitBtn.addEventListener("click",()=>window.location.href="../../");
    els.soundBtn.addEventListener("click",()=>{ const on=audio.toggle(); els.soundBtn.textContent=on?"Sound On":"Sound Off"; if(on) audio._ctx(); });
    els.fullscreenBtn.addEventListener("click",()=>{ if(!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.(); });
    window.addEventListener("keydown",(e)=>{
      if(e.code==="Escape"){
        if(state.mode==="playing"){ state.mode="menu"; els.menuScreen.classList.add("show"); }
        else if(state.mode==="menu"){ state.mode="playing"; els.menuScreen.classList.remove("show"); }
        else if(state.pendingMove) exitMoveMode();
      }
      if(e.code==="Enter"&&state.mode==="playing") endTurn();
      if(e.code==="KeyM"&&state.mode==="playing"){ const on=audio.toggle(); els.soundBtn.textContent=on?"Sound On":"Sound Off"; }
    });
  }

  function getBaseOx(){
    const budgetW=Math.max(280,view.w*(view.w>900?.58:.92));
    const budgetH=view.h*(view.w>900?.8:.55);
    view.size=view.size; // preserve current zoom
    view.mapW=view.size*(1.5*(COLS-1)+2);
    const baseX=(view.w-view.mapW)/2;
    return baseX+view.size;
  }
  function getBaseOy(){
    view.mapH=view.size*Math.sqrt(3)*(ROWS+.6);
    const baseY=view.w>900?Math.max(90,(view.h-view.mapH)/2+20):Math.max(150,(view.h-view.mapH)*.4);
    return baseY+view.size;
  }

  // ─── TITLE BACKDROP ──────────────────────────────────────────────────────────
  // Draws a slow-drifting painterly hex-tile world preview behind the setup card.
  function initTitleBackdrop(){
    const el=document.getElementById("titleBackdrop");
    if(!el) return;
    const TERRAINS_BG=[
      {color:"#5d8d58",edge:"#9ccc7a"},  // plains
      {color:"#2f714f",edge:"#77d99b"},  // forest
      {color:"#3f8d86",edge:"#7bdff2"},  // river
      {color:"#83684d",edge:"#d98a5d"},  // hills
      {color:"#9c7a44",edge:"#f2c14e"},  // desert
      {color:"#3a7a44",edge:"#6dc86d"},  // grassland
    ];
    const HEX_R=44;
    let W,H,dpr,hexes=[];

    function resizeBD(){
      dpr=Math.min(window.devicePixelRatio||1,1.5);
      W=window.innerWidth; H=window.innerHeight;
      el.width=Math.round(W*dpr); el.height=Math.round(H*dpr);
      el.style.width=W+"px"; el.style.height=H+"px";
      // Build a grid of hex centres covering the viewport
      hexes=[];
      const r=HEX_R, dx=r*1.73, dy=r*1.5;
      const cols=Math.ceil(W/dx)+3, rows=Math.ceil(H/dy)+3;
      for(let row=-1;row<rows;row++){
        for(let col=-1;col<cols;col++){
          const x=col*dx+(row%2===0?0:dx/2);
          const y=row*dy;
          const t=TERRAINS_BG[(Math.abs(row*7+col*13))%TERRAINS_BG.length];
          hexes.push({
            bx:x, by:y,     // base position (no drift)
            ox:0, oy:0,     // drift offset
            phase:Math.random()*Math.PI*2,
            spd:0.008+Math.random()*0.006,
            t,
            // stipple hatching offset for each hex
            hatch:(Math.floor(Math.random()*3))
          });
        }
      }
    }

    function drawHex(cx,cc,r,fill,edge,hatch){
      const a=Math.PI/3;
      cc.beginPath();
      for(let i=0;i<6;i++) cc.lineTo(r*Math.cos(a*i-Math.PI/6)+cx[0], r*Math.sin(a*i-Math.PI/6)+cx[1]);
      cc.closePath();
      cc.fillStyle=fill; cc.fill();
      // Faint hatch lines for texture (skipped in lite mode — flat tint only)
      if(!FX_LITE){
        cc.save(); cc.clip();
        cc.strokeStyle="rgba(255,255,255,0.045)";
        cc.lineWidth=.8;
        const step=6+hatch*3;
        for(let s=-r*2;s<r*2;s+=step){
          cc.beginPath(); cc.moveTo(cx[0]-r+s,cx[1]-r); cc.lineTo(cx[0]-r+s+r*.8,cx[1]+r); cc.stroke();
        }
        cc.restore();
      }
      cc.strokeStyle=edge; cc.lineWidth=.9; cc.globalAlpha=.28; cc.stroke(); cc.globalAlpha=1;
    }

    let t0=null;
    function frameBD(ts){
      if(!t0) t0=ts;
      const t=(ts-t0)*0.001;
      const cc=el.getContext("2d");
      cc.setTransform(dpr,0,0,dpr,0,0);
      cc.clearRect(0,0,W,H);

      // Dark gradient base (replace the pure-black void)
      const grad=cc.createRadialGradient(W*.5,H*.42,0,W*.5,H*.42,Math.max(W,H)*.72);
      grad.addColorStop(0,"rgba(14,26,22,.0)");
      grad.addColorStop(1,"rgba(4,8,10,.0)");
      cc.fillStyle=grad; cc.fillRect(0,0,W,H);

      // Drift hex tiles (skipped in lite mode — just flat static tint)
      const drift=18; // max px drift
      const lite=FX_LITE;
      for(const h of hexes){
        const dx=lite?0:Math.sin(t*h.spd*0.7+h.phase)*drift;
        const dy=lite?0:Math.cos(t*h.spd+h.phase+1.2)*drift*0.6;
        const cx=[h.bx+dx, h.by+dy];
        cc.globalAlpha=0.11;
        drawHex(cx,cc,HEX_R,h.t.color,h.t.edge,h.hatch);
        cc.globalAlpha=1;
      }

      // Parchment-ink vignette to darken edges
      const vig=cc.createRadialGradient(W*.5,H*.5,H*.22,W*.5,H*.5,H*.78);
      vig.addColorStop(0,"rgba(7,16,19,0)");
      vig.addColorStop(1,"rgba(7,16,19,.72)");
      cc.fillStyle=vig; cc.fillRect(0,0,W,H);

      requestAnimationFrame(frameBD);
    }

    resizeBD();
    window.addEventListener("resize",resizeBD,{passive:true});
    requestAnimationFrame(frameBD);
  }

  // ─── CIV PORTRAIT CARDS ───────────────────────────────────────────────────────
  // Draws illuminated-manuscript-style portrait card for each civ on the setup screen.
  function drawCivPortraits(){
    const CIV_PORTRAITS=[
      {key:"player", name:"Mac Dynasty",         color:"#f2c14e", leader:"Emperor",     flag:"▲"},
      {key:"north",  name:"Northern League",     color:"#7bdff2", leader:"Chancellor",  flag:"◆"},
      {key:"steppe", name:"Steppe Confederation",color:"#d98a5d", leader:"Khan",        flag:"●"},
      {key:"ocean",  name:"Ocean Compact",       color:"#b79cff", leader:"Admiral",     flag:"◈"},
    ];
    document.querySelectorAll(".civ-portrait-canvas").forEach((cvs,i)=>{
      const civ=CIV_PORTRAITS[i]; if(!civ) return;
      const W=cvs.width, H=cvs.height;
      const cc=cvs.getContext("2d");
      const dpr=Math.min(window.devicePixelRatio||1,2);
      cvs.width=Math.round(W*dpr); cvs.height=Math.round(H*dpr);
      cvs.style.width=W+"px"; cvs.style.height=H+"px";
      cc.setTransform(dpr,0,0,dpr,0,0);

      // Parchment card background
      const bg=cc.createLinearGradient(0,0,W,H);
      bg.addColorStop(0,"rgba(9,22,25,.97)");
      bg.addColorStop(1,"rgba(16,26,24,.92)");
      cc.fillStyle=bg; cc.fillRect(0,0,W,H);

      // Civ color stripe at top
      cc.fillStyle=civ.color;
      cc.globalAlpha=.55;
      cc.fillRect(0,0,W,22);
      cc.globalAlpha=1;

      // Flag glyph in stripe
      cc.fillStyle="#1a0e00";
      cc.globalAlpha=.80;
      cc.font="bold 13px sans-serif";
      cc.textAlign="center";
      cc.textBaseline="middle";
      cc.fillText(civ.flag,W/2,11);
      cc.globalAlpha=1;

      // Silhouette figure (simple stylized human form)
      const cx=W/2, cy=H*0.52;
      cc.fillStyle=civ.color;
      cc.globalAlpha=.18;
      cc.beginPath(); // cloak
      cc.moveTo(cx-18,H-8); cc.lineTo(cx-12,cy+2); cc.lineTo(cx,cy-2); cc.lineTo(cx+12,cy+2); cc.lineTo(cx+18,H-8); cc.closePath();
      cc.fill();
      cc.globalAlpha=1;

      // Silhouette head
      cc.fillStyle=civ.color;
      cc.globalAlpha=.45;
      cc.beginPath(); cc.arc(cx,cy-14,9,0,Math.PI*2); cc.fill();
      cc.globalAlpha=1;

      // Silhouette body
      cc.fillStyle=civ.color;
      cc.globalAlpha=.30;
      cc.fillRect(cx-7,cy-5,14,22);
      cc.globalAlpha=1;

      // Civ accent border (bottom)
      cc.strokeStyle=civ.color;
      cc.lineWidth=1.2;
      cc.globalAlpha=.45;
      cc.strokeRect(.6,.6,W-1.2,H-1.2);
      cc.globalAlpha=1;

      // Inner top highlight
      cc.strokeStyle="rgba(255,255,255,.12)";
      cc.lineWidth=1;
      cc.beginPath(); cc.moveTo(1,1); cc.lineTo(W-1,1); cc.stroke();

      // Leader title at bottom
      cc.fillStyle="rgba(251,245,230,.60)";
      cc.font="600 9px 'Inter', sans-serif";
      cc.textAlign="center";
      cc.textBaseline="bottom";
      cc.letterSpacing="0.06em";
      cc.fillText(civ.leader.toUpperCase(),cx,H-5);
    });
  }

  // ─── INIT ────────────────────────────────────────────────────────────────────
  // ─── Setup-screen extras: resume card + top-5 leaderboard ────────────────
  function _eaFmtAgo(ts){
    const ms = Date.now() - (Number(ts) || 0);
    if (ms < 60000) return "just now";
    const m = Math.floor(ms / 60000);
    if (m < 60) return m + " min ago";
    const h = Math.floor(m / 60);
    if (h < 24) return h + " hr ago";
    const d = Math.floor(h / 24);
    if (d === 1) return "yesterday";
    return d + " days ago";
  }
  function _eaSafe(v){
    return String(v == null ? "" : v).replace(/[<>&"]/g, c =>
      c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : "&quot;");
  }
  function initSetupExtras(){
    _eaRenderResumeCard();
    _eaRenderLeaderboardPanel();
  }
  function _eaRenderResumeCard(){
    const card = document.getElementById("resumeCard");
    if (!card) return;
    if (!window.MrMacsSessions) { card.hidden = true; return; }
    let prev = null;
    try { prev = window.MrMacsSessions.load("empire-ascendant"); } catch (e) {}
    if (!prev || !prev.state || !prev.ts) { card.hidden = true; return; }
    if (Date.now() - prev.ts > 24 * 3600 * 1000) { card.hidden = true; return; }
    const s = prev.state || {};
    const eraName = s.eraName || (ERAS && ERAS[s.era || 0]) || "Ancient";
    const score = fmtN(s.score || 0);
    card.hidden = false;
    card.innerHTML =
      '<div class="resume-card-head">' +
        '<span class="resume-card-title">Resume your run?</span>' +
        '<span class="resume-card-time">' + _eaSafe(_eaFmtAgo(prev.ts)) + '</span>' +
      '</div>' +
      '<div class="resume-card-meta">Era ' + _eaSafe(eraName) + ' · score ' + score + '</div>' +
      '<div class="resume-card-actions">' +
        '<button type="button" class="resume-btn resume-btn--primary" id="resumeRunBtn">Resume</button>' +
        '<button type="button" class="resume-btn" id="resumeFreshBtn">Start fresh</button>' +
      '</div>';
    const resumeBtn = card.querySelector("#resumeRunBtn");
    const freshBtn  = card.querySelector("#resumeFreshBtn");
    if (resumeBtn) {
      resumeBtn.addEventListener("click", () => {
        // Empire Ascendant has its own per-game `loadGame()` save chain,
        // so prefer that path if available — otherwise just acknowledge.
        try {
          if (typeof loadGame === "function" && hasSave && hasSave()) {
            if (loadGame()) {
              state.mode = "playing";
              if (els.setupScreen) els.setupScreen.classList.remove("show");
              try { updateHud(); renderPanel(); } catch (e) {}
              return;
            }
          }
        } catch (e) {}
        try {
          if (window.MrMacsToast) window.MrMacsToast.push({
            icon: "⏯", title: "Resuming " + eraName + " Era",
            sub: "Score " + score + " carried over", tone: "info", ms: 3500
          });
        } catch (e) {}
        if (els.startBtn) els.startBtn.click();
      });
    }
    if (freshBtn) {
      freshBtn.addEventListener("click", () => {
        try { window.MrMacsSessions.clear("empire-ascendant"); } catch (e) {}
        card.hidden = true;
        if (els.startBtn) els.startBtn.click();
      });
    }
  }
  function _eaRenderLeaderboardPanel(){
    const panel = document.getElementById("leaderboardPanel");
    if (!panel) return;
    if (!window.MrMacsLeaderboards) { panel.hidden = true; return; }
    let rows = [];
    try { rows = window.MrMacsLeaderboards.top("empire-ascendant", 5) || []; } catch (e) { rows = []; }
    panel.hidden = false;
    if (!rows.length) {
      panel.innerHTML =
        '<div class="lb-head">Top scores</div>' +
        '<div class="lb-empty">No high scores yet — set one!</div>';
      return;
    }
    panel.innerHTML =
      '<div class="lb-head">Top scores</div>' +
      '<ol class="lb-list">' +
      rows.map((r, i) =>
        '<li class="lb-row">' +
          '<span class="lb-rank">#' + (i + 1) + '</span>' +
          '<span class="lb-avatar">' + _eaSafe(r.avatar || "") + '</span>' +
          '<span class="lb-name">' + _eaSafe(r.name || "Trainer") + '</span>' +
          '<span class="lb-score">' + fmtN(r.score || 0) + '</span>' +
          '<span class="lb-ago">' + _eaSafe(_eaFmtAgo(r.ts || 0)) + '</span>' +
        '</li>'
      ).join("") +
      '</ol>';
  }

  async function init(){
    resize(); bind(); requestAnimationFrame(loop);
    initTitleBackdrop();
    drawCivPortraits();

    // ── MrMacsProfile: boot hook ──────────────────────────────────────────────
    if (window.MrMacsProfile) {
      MrMacsProfile.recordPlay({
        id:     "empire-ascendant",
        title:  "Empire Ascendant",
        course: "All Courses",
        file:   "games/empire-ascendant/index.html"
      });
      // Sound at boot: respect profile sound setting
      const profileSettings = MrMacsProfile.getSettings();
      if (profileSettings && profileSettings.sound === false) {
        audio.on = false;
        if (els.soundBtn) els.soundBtn.textContent = "Sound Off";
      } else {
        audio._ctx();
      }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Update setup screen start button for continue support
    if(hasSave()) els.startBtn.textContent="New Game";
    // Setup-screen extras (resume card + top-5 leaderboard)
    try { initSetupExtras(); } catch (e) {}
    // Brief loading state while review bank fetches
    if (els.setupMetrics && !els.setupMetrics.innerHTML.trim()) {
      els.setupMetrics.innerHTML =
        `<span class="metric-pill loading-pill" aria-live="polite">Loading review councils...</span>`;
    }
    try {
      await loadBank();
    } catch(err){
      console.error("Empire Ascendant bank load failed:",err);
      els.startBtn.disabled=false;
      els.startBtn.textContent="Found Empire (offline)";
      // Stub minimal bank so game still runs
      state.bank={questions:[],courses:[],setsByCourse:{}};
      state.filtered=[]; state.queue=[];
      els.setupMetrics.innerHTML=`<span class="metric-pill" role="status" style="border-color:rgba(255,111,111,.42);background:rgba(255,111,111,.10);color:rgba(251,245,230,.92);">Offline mode — review questions unavailable. Check your connection or play without reform councils.</span>`;
    }
  }

  init();
})();
