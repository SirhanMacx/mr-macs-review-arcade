/* ===========================================================================
   Boggle Beat — 5x5 letter-grid word hunt · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x720 logical · curated dictionary · scholar tile
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "boggle-beat";
  var GAME_TITLE = "Boggle Beat";

  var LOGICAL_W = 720;
  var LOGICAL_H = 720;

  var GRID_SIZE = 5;
  var ROUND_TIMER = 90;          // 90s per round
  var TOTAL_ROUNDS = 3;
  var GAMEOVER_THRESHOLD = 1000; // need >= 1000 per round for game-over to NOT trigger
  var MIN_WORD_LEN = 3;
  var SCHOLAR_REWARD_SCORE = 1500;
  var SCHOLAR_REWARD_SHARDS = 12;
  var SHARDS_CAP = 200;
  var POWERUP_INV_MAX = 3;
  var POWERUP_DROP_AT_WORDS = [3, 7, 12, 18, 25]; // word counts that grant powerups
  var FEEDBACK_MS = 1100;
  var TIME_WARN_THRESHOLD = 15;

  // Tile geometry (logical) — 5x5 grid centered horizontally
  var TILE_SIZE = 96;
  var TILE_GAP = 8;
  var GRID_TOP = 175;
  var GRID_W = GRID_SIZE * TILE_SIZE + (GRID_SIZE - 1) * TILE_GAP;
  var GRID_H = GRID_W;
  var GRID_LEFT = (LOGICAL_W - GRID_W) / 2;

  // -- Letter distribution (Boggle-weighted, history-friendly) ---------------
  // Vowels and common consonants weighted higher; rare letters thinned.
  // 25 tiles × ~weighted draw with replacement, then guarantee vowel floor.
  var LETTER_WEIGHTS = {
    A: 9, E: 12, I: 8, O: 8, U: 4,
    R: 8, T: 8, N: 8, S: 8, L: 6,
    C: 5, D: 5, M: 4, P: 4, B: 3,
    G: 3, H: 4, F: 3, Y: 3, W: 3,
    K: 2, V: 2, X: 1, J: 1, Q: 1, Z: 1
  };
  var LETTER_BAG = (function () {
    var bag = [];
    Object.keys(LETTER_WEIGHTS).forEach(function (L) {
      var w = LETTER_WEIGHTS[L];
      for (var i = 0; i < w; i++) bag.push(L);
    });
    return bag;
  })();
  var VOWELS = "AEIOU";

  // -- Themed dictionary -----------------------------------------------------
  // History/civics/science/geography terms — playing these awards a +50 bonus.
  // Stored as Set for O(1) lookup. UPPERCASE.
  var THEMED_LIST = [
    // History (general)
    "REVOLUTION","REPUBLIC","REPUBLICAN","REIGN","REGIME","REVOLT","RIOT","REFORM","REFORMATION",
    "RENAISSANCE","ROYAL","RULER","RIGHTS","RACE","RACIAL","RAID","RANSOM","RATIFY","RATIO",
    "EMPIRE","EMPRESS","EMPEROR","ERA","EXILE","EDICT","ELECT","ENVOY","ENACT","ESTATE",
    "FEUDAL","FEUDALISM","FRONTIER","FORT","FORTRESS","FAITH","FLEET","FREEDOM","FRENCH",
    "TYRANT","TREATY","TROOP","TROOPS","TRADE","TRADER","TRIBE","TRIAL","THRONE","THRONES",
    "WAR","WARS","WARRIOR","WAGE","WAGES","WORLD","WAVE","WALL","WALLS","WEST","WESTERN",
    "BATTLE","BORDER","BORDERS","BARON","BANNER","BISHOP","BREAD","BANK","BANKER",
    "DUKE","DYNASTY","DEFEND","DEMAND","DECREE","DELTA","DESERT","DIET","DEBATE","DELEGATE",
    "MONARCH","MONARCHY","MILITIA","MILITARY","MINISTER","MUSKET","MARINE","MEDIEVAL","MAJOR",
    "PEACE","PRINCE","PRINCESS","POLITY","POWER","PEASANT","PILGRIM","PIONEER","PARADE",
    "QUEEN","QUEST","REIGN","REBEL","REBELS","RETREAT","RESIST","RIVER","ROOTS","ROUTE",
    "SLAVE","SLAVERY","SOLDIER","SUFFRAGE","SUFFER","SETTLE","SETTLER","SEDITION","SHIELD",
    "CASTLE","CRUSADE","COLONY","COLONIAL","COURT","CROWN","CHURCH","CHIEF","CITIZEN","COIN",
    "INVADE","INVADER","INVASION","INVENT","ISSUE","IRON","ISLAM","ICONIC","IDOL","IDEAL",
    "OATH","OATHS","ORATOR","ORDER","ORATE","OUTPOST","OFFER","OPEN","ORIGIN","OUSTED",
    "ALLY","ALLIES","ARMY","ARMIES","AGRARIAN","AGORA","ANCIENT","ANNEX","ARCHIVE","ARSENAL",
    "AXIS","ATOM","AGENT","ARMOR","AGE","AGES","ARROW","ARROWS","ARMS","ALTAR","ATLAS",
    "PROTEST","PARLIAMENT","PARDON","PALACE","PEASANTS","PROPHET","PHARAOH","PROVINCE",
    "TIDE","TENT","TRENCH","TROOP","TURBAN","TYRANNY","TRIBES","TROPHY","TRADITION","TARIFF",
    "EXPORT","IMPORT","EMBARGO","EMPLOY","EXECUTE","ELECTOR","ENABLE","ENGAGE","ESCAPE",
    "GOVERN","GUARD","GUARDS","GENERAL","GENESIS","GIFT","GUILD","GUILDS","GLOBAL",
    // Civics
    "SENATE","SENATOR","JUDGE","JUDGES","JURY","JUST","JUSTICE","STATE","STATUTE","STATUS",
    "VOTE","VOTER","VOTING","VETO","VAULT","VOICE","VOICES","VIRTUE","VOW","VOWS",
    "LAW","LAWS","LEGAL","LEGACY","LIBERTY","LICENSE","LEGISLATE","LEAGUE","LEADER",
    "ORDER","OFFICE","OFFICER","OFFICIAL","OUTLAW","OFFICIAL","OBLIGE","ORATION",
    "FEDERAL","FEDERATION","FREE","FREEDOM","FAVOR","FILE","FINE","FRAUD","FORUM",
    "MAYOR","MEMBER","MEDIA","MEDIATE","MARKET","MAYORAL","MERIT","METAL","METALS",
    "PARTY","POLL","POLLS","POLICY","POLITIC","PLEDGE","PROTEST","PETITION","PROCLAIM",
    "RIGHT","RIGHTS","RULE","RULES","RECALL","RECORD","REGENT","RESCUE","REGION","REVIEW",
    "TAX","TAXES","TENURE","TENANT","TERM","TERMS","TRUST","TRUSTEE","TICKET","TENET",
    "EQUAL","EQUITY","EDICT","ETHIC","ETHICS","ELECT","ELECTOR","ENABLE","ENROLL","EQUITY",
    "AGENT","AGENCY","AMEND","AMENDS","APPEAL","APPROVE","ARGUE","ARGUER","ATTORN",
    "BILL","BILLS","BENCH","BLOC","BLOCS","BUDGET","BUREAU","BORDERS","BIPARTY",
    // Science
    "ATOM","ATOMIC","ACID","ACIDS","ACE","AIR","AIRS","ALGAE","ANALYZE","ANATOMY",
    "BIOLOGY","BIOME","BLOOM","BONE","BONES","BOND","BONDS","BRAIN","BREATH","BUDGET",
    "CELL","CELLS","CHEM","CHEMICAL","CIRCUIT","CIRCLE","CIRCA","CLIMATE","CLOUD",
    "DATA","DATUM","DEPTH","DEPTHS","DESERT","DIODE","DEW","DEWS","DIET","DIETS",
    "EARTH","EAST","EASTERN","ENERGY","ENGINE","ENZYME","EQUATE","ETHER","EVOLVE",
    "FORCE","FORCES","FOSSIL","FUEL","FUELS","FROST","FRESH","FREEZE","FERMENT",
    "GENE","GENES","GENUS","GASES","GAS","GLAND","GLOBE","GRAVITY","GROW","GROUND",
    "HEAT","HEAVY","HUMAN","HABIT","HABITAT","HARD","HEALTH","HEAR","HEARING",
    "ION","IONS","ISLE","ISOTOPE","INSECT","INSTINCT","INVERT","ICE","ICES","ICY",
    "JOULE","KARST","KILO","KILN","KILNS","KIND","KINDS","KINETIC","KINGDOM",
    "LAVA","LAYER","LAYERS","LIFE","LIVES","LIGHT","LIGHTS","LIQUID","LUNAR",
    "MASS","MASSES","MATTER","METAL","METALS","METEOR","MICRO","MIST","MOIST","MOON",
    "NERVE","NERVES","NEUROS","NUCLEUS","NUCLEAR","NORTH","NORTHERN","NEUTRAL",
    "OXYGEN","OXIDE","ORBIT","ORGAN","ORGANS","OASIS","OCEAN","OCEANS","OLDER",
    "PHASE","PHASES","PLANET","PLANT","PLANTS","PLASMA","POWER","PRISM","PROTEIN",
    "QUARK","QUARTZ","RADIO","RADIATE","REACT","REACTOR","RADAR","RANGE","RAIN",
    "SOLAR","SPACE","SPECIES","SPECIFIC","SPHERE","STAR","STARS","STORM","STREAM",
    "TIDE","TIDES","TIDAL","THEORY","THERMO","TINT","TITAN","TONIC","TOXIN","TOXIC",
    "URBAN","URN","URNS","UTMOST","UNIT","UNITS","UNIVERSE","UPDATE","UPHOLD",
    "VAPOR","VAPORS","VEIN","VEINS","VOLCANO","VOLT","VOLTS","VITAMIN","VIRUS",
    "WATER","WATERS","WAVE","WAVES","WEATHER","WET","WIND","WINDS","WOOD","WOODS",
    // Geography
    "MOUNTAIN","MOUNT","MOUNTS","MARSH","MARSHES","MESA","MESAS","MOOR","MOORS",
    "RIVER","RIVERS","RIDGE","RIDGES","REEF","REEFS","RAINFOREST","ROCK","ROCKS",
    "OCEAN","OCEANS","OUTPOST","OUTLET","OUTLINE","OASIS","ORIENT","ORIGIN",
    "DELTA","DESERT","DESERTS","DUNE","DUNES","DEEP","DEEPS","DOWN","DOWNS",
    "BAY","BAYS","BEACH","BEACHES","BLUFF","BLUFFS","BROOK","BROOKS","BANK","BANKS",
    "CAPE","CAPES","CANYON","CANYONS","CAVE","CAVES","CLIFF","CLIFFS","COAST",
    "FOREST","FORESTS","FLOOD","FLOODS","FALL","FALLS","FERN","FERNS","FIELD",
    "GLACIER","GULF","GULFS","GORGE","GORGES","GLOBE","GLOBES","GROVE","GROVES",
    "HILL","HILLS","HARBOR","HEAVEN","HORIZON","HEMISPHERE","HOLLOW","HOLLOWS",
    "ISLAND","ISLES","ISLE","ICE","ICEBERG","INLET","INLETS","INTERIOR",
    "JUNGLE","JUNGLES","KARST","KEY","KEYS","KINGDOM","KILN","KNOLL","KNOLLS",
    "LAKE","LAKES","LAGOON","LAND","LANDS","LATITUDE","LEVEE","LEVEES","LOCH",
    "PEAK","PEAKS","PASS","PASSES","PATH","PATHS","PEN","PENS","PENINSULA",
    "PLAIN","PLAINS","PLATEAU","POND","PONDS","POOL","POOLS","PORT","PORTS",
    "QUAY","QUAYS","REGION","REGIONS","RIDGE","ROAD","ROADS","ROUTE","ROUTES",
    "SAND","SANDS","SEA","SEAS","SHIRE","SHORE","SHORES","SLOPE","SLOPES",
    "STRAIT","STRAITS","STEPPE","STEPPES","STREAM","STREAMS","SAVANNA","SUMMIT",
    "TUNDRA","TUNDRAS","TUNNEL","TUNNELS","TIDE","TIDES","TROPIC","TROPICS",
    "VALLEY","VALLEYS","VOLCANO","VOLCANIC","VEIN","VEINS","VENT","VENTS",
    "WOODS","WOODLAND","WORLD","WORLDS"
  ];

  // Common-words bonus list (3+ chars) — keeps game playable while non-themed.
  // We accept any word in THEMED set OR COMMON set. Curated for K-8 friendliness.
  var COMMON_LIST = [
    // Tiny (3)
    "AND","ART","ACT","ARC","AIM","AIR","ALE","ARM","AWE","AGO","ATE","ALL","ASK","ANT",
    "BAD","BAG","BAR","BAT","BAY","BEE","BIG","BIN","BIT","BOX","BOY","BUD","BUG","BUN","BUS","BUT","BUY","BYE",
    "CAB","CAN","CAP","CAR","CAT","COD","COG","CON","COP","COT","COW","CRY","CUB","CUE","CUP","CUT",
    "DAB","DAD","DAM","DAY","DEN","DEW","DID","DIE","DIG","DIM","DIN","DIP","DOG","DON","DOT","DRY","DUE","DUG","DYE",
    "EAR","EAT","EBB","EEL","EGG","EGO","ELF","ELK","ELM","END","ERA","ETH","EVE","EYE",
    "FAD","FAN","FAR","FAT","FAX","FED","FEE","FEW","FIB","FIG","FIN","FIR","FIT","FIX","FLY","FOE","FOG","FOR","FOX","FRY","FUN","FUR",
    "GAB","GAG","GAP","GAS","GEL","GEM","GET","GIG","GIN","GOD","GOT","GUM","GUN","GUT","GUY","GYM",
    "HAD","HAM","HAT","HAY","HEN","HER","HEY","HID","HIM","HIP","HIS","HIT","HOG","HOP","HOT","HOW","HUB","HUG","HUM","HUT",
    "ICE","ICY","ILK","ILL","IMP","INK","INN","ION","IRE","IRK",
    "JAB","JAM","JAR","JAW","JAY","JET","JIG","JOB","JOG","JOT","JOY","JUG","JUT",
    "KEG","KEN","KEY","KID","KIN","KIP","KIT",
    "LAB","LAD","LAG","LAM","LAP","LAW","LAX","LAY","LED","LEG","LET","LID","LIE","LIP","LIT","LOG","LOP","LOT","LOW","LUG",
    "MAD","MAN","MAP","MAR","MAT","MAY","MEN","MET","MID","MIX","MOB","MOM","MOP","MUD","MUG",
    "NAB","NAG","NAP","NAY","NEE","NET","NEW","NIB","NIP","NOB","NOD","NOR","NOT","NOW","NUB","NUN","NUT",
    "OAK","OAR","OAT","ODD","ODE","OFF","OFT","OIL","OLD","ONE","OPT","ORB","ORE","OUR","OUT","OWE","OWL","OWN",
    "PAD","PAL","PAN","PAR","PAT","PAW","PAY","PEA","PEG","PEN","PEP","PER","PET","PEW","PIE","PIG","PIN","PIT","PLY","POD","POP","POT","PRO","PRY","PUB","PUG","PUN","PUP","PUS","PUT",
    "RAG","RAJ","RAM","RAN","RAP","RAT","RAW","RAY","RED","REF","REV","RIB","RIG","RIM","RIP","ROB","ROD","ROE","ROT","ROW","RUB","RUG","RUN","RUT","RYE",
    "SAD","SAG","SAP","SAT","SAW","SAY","SEA","SEE","SET","SEW","SHE","SHY","SIN","SIP","SIR","SIT","SIX","SKI","SKY","SLY","SOB","SOD","SON","SOP","SOW","SOY","SPA","SPY","SUB","SUE","SUM","SUN","SUP",
    "TAB","TAD","TAG","TAN","TAP","TAR","TAX","TEA","TED","TEE","TEN","THE","TIC","TIE","TIN","TIP","TOE","TOG","TOO","TOP","TOT","TOW","TOY","TRY","TUB","TUG","TUN","TWO",
    "UGH","UMP","UNI","UPS","URN","USE",
    "VAN","VAT","VEX","VIA","VIE","VOW",
    "WAD","WAG","WAR","WAS","WAY","WEB","WED","WEE","WET","WHO","WHY","WIG","WIN","WIT","WOE","WON","WOO","WOW","WRY",
    "YAK","YAM","YAP","YAW","YEA","YEN","YES","YET","YEW","YOU",
    "ZAG","ZAP","ZED","ZEE","ZEN","ZIP","ZOO",
    // Mid (4-5)
    "ABLE","ACID","ACME","ACNE","ACRE","ACTS","AERO","AGED","AGES","AGOG","AHEM","AIDE","AIDS","AILS","AIMS","AIRS","AKIN","ALAS","ALBS","ALES","ALMS","ALOE","ALPS","ALSO","ALTO","ALUM","AMEN","AMID","AMMO","ANCHOR","ANEW","ANGLE","ANKH","ANNS","ANTE","ANTI","ANTS","ANUS","ANY","ANY","APE","APED","APES","APEX","APPS","APSE","ARC","ARCH","ARCS","ARID","ARMS","ARMY","AROSE","ARSE","ARTS","ASHY","ASIA","ASKS","ASSAY","ASSET","ASTI","ATOM","AUNT","AURA","AUTO","AVER","AVID","AWAY","AWED","AWES","AWLS","AWNS","AWRY","AXED","AXES","AXIS","AXLE","AYES",
    "BABE","BABY","BACK","BADE","BADS","BAGS","BAIL","BAIT","BAKE","BALD","BALE","BALK","BALL","BALM","BAND","BANE","BANG","BANK","BANS","BARB","BARD","BARE","BARK","BARN","BARS","BASE","BASH","BASS","BAST","BATH","BATS","BAUD","BAWD","BAWL","BAYS","BEAD","BEAK","BEAM","BEAN","BEAR","BEAT","BEAU","BEDS","BEEN","BEEP","BEER","BEES","BEET","BEFIT","BEGIN","BEGAN","BEGS","BELL","BELT","BEND","BENT","BERG","BERTH","BEST","BETA","BETS","BEVEL","BIAS","BIBLE","BIBS","BIDE","BIDS","BIFF","BIGS","BIKE","BILE","BILL","BIND","BING","BINS","BIRD","BIRTH","BITE","BITS","BLAB","BLED","BLEW","BLIP","BLOB","BLOC","BLOG","BLOT","BLOW","BLUB","BLUE","BLUR","BOAR","BOAT","BODY","BOFF","BOGS","BOIL","BOLD","BOLT","BOMB","BOND","BONE","BONG","BONO","BONY","BOOB","BOOK","BOOM","BOON","BOOR","BOOS","BOOT","BORE","BORN","BOSS","BOTH","BOUT","BOWL","BOWS","BOXY","BOYS","BRAD","BRAG","BRAN","BRAS","BRAT","BRAVE","BRAY","BREAD","BREAK","BREW","BRIBE","BRIDE","BRIEF","BRIM","BRINK","BRINY","BROIL","BROKE","BROW","BUCK","BUDS","BUFF","BUGS","BULB","BULK","BULL","BUMP","BUMS","BUNK","BUNS","BUOY","BURG","BURL","BURN","BURP","BURR","BURY","BUSH","BUSK","BUST","BUSY","BUTT","BUYS","BUZZ","BYES","BYRE","BYTE",
    "CABS","CACHE","CAKE","CALF","CALL","CALM","CAME","CAMP","CANE","CANS","CAPE","CAPS","CARD","CARE","CARP","CARS","CART","CASE","CASH","CASK","CAST","CATS","CAVE","CEDE","CELL","CELT","CENT","CHAD","CHAI","CHAP","CHAR","CHAT","CHEW","CHIC","CHIN","CHIP","CHIT","CHOP","CHOW","CHUB","CHUG","CHUM","CIRCA","CITE","CITY","CLAD","CLAG","CLAM","CLAN","CLAP","CLAW","CLAY","CLEF","CLIP","CLOD","CLOG","CLOP","CLOT","CLOY","CLUB","CLUE","CLUNG","COAL","COAT","COAX","CODA","CODE","CODS","COIL","COIN","COKE","COLA","COLD","COLE","COLT","COMA","COMB","COMP","CONE","CONK","CONN","CONS","COOK","COOL","COON","COOP","COOT","COPE","COPS","COPY","CORD","CORE","CORK","CORN","COST","COTS","COUP","COVE","COWL","COWS","COXED","COXES","COZY","CRAB","CRAG","CRAM","CRAW","CREW","CRIB","CRIME","CROC","CROP","CROW","CRUD","CRUX","CUBE","CUBS","CUED","CUES","CUFF","CULL","CULT","CUPS","CURB","CURD","CURE","CURL","CURT","CUTE","CUTS","CYST",
    "DABS","DADS","DAFT","DAIS","DALE","DAMN","DAMP","DAMS","DARE","DARK","DARN","DART","DASH","DATA","DATE","DAUB","DAWN","DAYS","DAZE","DEAD","DEAF","DEAL","DEAN","DEAR","DEBT","DECK","DEED","DEEM","DEEP","DEER","DEFY","DELI","DELL","DEMO","DENS","DENT","DESK","DEWY","DIAL","DICE","DICED","DICEY","DIDO","DIED","DIES","DIET","DIGS","DIKE","DILL","DIME","DIMS","DINE","DING","DINK","DINO","DINS","DIPS","DIRE","DIRT","DISC","DISH","DISK","DIVA","DIVE","DOCK","DOES","DOFF","DOGS","DOLL","DOLT","DOME","DOMS","DONE","DONS","DOOM","DOOR","DOPE","DORM","DOSE","DOTS","DOUR","DOVE","DOWN","DOZE","DRAB","DRAG","DRAW","DRAY","DREW","DRIP","DROP","DRUB","DRUG","DRUM","DUAL","DUBS","DUCK","DUCT","DUDE","DUDS","DUEL","DUES","DUET","DUGS","DUKE","DULL","DULY","DUMB","DUMP","DUNE","DUNG","DUNK","DUNS","DUOS","DUPE","DUSK","DUST","DUTY","DYAD","DYED","DYES","DYNAMO",
    "EACH","EAR","EARL","EARN","EARS","EASE","EAST","EASY","EATS","EAVE","ECHO","EDGE","EDGY","EDIT","EELS","EERY","EGGS","EGGY","EGOS","EIGHT","EITHER","ELAN","ELDER","ELECT","ELEGY","ELEMENT","ELEMENTS","ELEPHANT","ELITE","ELKS","ELLS","ELMS","ELSE","ELVES","EMBED","EMBER","EMIR","EMITS","EMMA","EMUS","ENDS","ENEMY","ENJOY","ENRICH","ENROL","ENSUE","ENTER","ENTRY","ENVOY","ENVY","EONS","EPIC","EPOCH","EQUAL","ERAS","ERGO","ERNS","EROS","ERRS","ETCH","EUROS","EVEN","EVER","EVERY","EVES","EVIL","EWE","EWES","EWER","EXAM","EXIT","EXPEL","EYED","EYES",
    "FACE","FACT","FADE","FADS","FAIL","FAIR","FAKE","FALL","FAME","FANG","FANS","FARE","FARM","FAST","FATE","FATS","FAUN","FAWN","FAYS","FAZE","FEAR","FEAT","FEDS","FEED","FEEL","FEES","FEET","FELL","FELT","FERN","FETA","FETE","FEUD","FIAT","FIBS","FIEF","FIGS","FILE","FILL","FILM","FIND","FINE","FINS","FIRE","FIRM","FIRS","FISH","FIST","FITS","FIVE","FIVES","FIXES","FIZZ","FLAB","FLAG","FLAK","FLAP","FLAT","FLAW","FLAX","FLAY","FLEA","FLED","FLEE","FLEW","FLEX","FLIP","FLIT","FLOG","FLOP","FLOW","FLUB","FLU","FOAL","FOAM","FOBS","FOCI","FOES","FOGS","FOGY","FOIL","FOLD","FOLK","FOND","FONT","FOOD","FOOL","FOOT","FORD","FORE","FORK","FORM","FORT","FOUL","FOUR","FOWL","FOX","FOXY","FRAY","FREE","FRET","FROG","FROM","FUEL","FULL","FUME","FUMY","FUND","FUNK","FURL","FURS","FURY","FUSE","FUSS","FUTON","FUZZ",
    "GABS","GAFF","GAGA","GAGE","GAGS","GAIN","GAIT","GALA","GALE","GALL","GAME","GAMS","GANG","GAOL","GAPE","GAPS","GARB","GARS","GASH","GASP","GATE","GAVE","GAWK","GAYS","GAZE","GEAR","GECK","GEED","GEES","GELS","GELT","GEMS","GENE","GENS","GENT","GENU","GERM","GETS","GIBE","GIFT","GIGA","GIGS","GILD","GILL","GILT","GIRD","GIRL","GIST","GIVE","GLAD","GLEE","GLEN","GLIB","GLOB","GLOP","GLOW","GLUE","GLUM","GLUT","GNAT","GNAW","GOAD","GOAL","GOAT","GOBS","GODS","GOES","GOLD","GOLF","GONE","GONG","GOOD","GOOF","GOOK","GOON","GOOP","GORE","GORY","GOSH","GOUT","GOWN","GRAB","GRAD","GRAN","GRAPH","GRAY","GREW","GREY","GRID","GRIM","GRIN","GRIP","GRIST","GRIT","GROG","GROIN","GROOM","GROSS","GROUP","GROW","GRUB","GRUE","GUFF","GULF","GULL","GULP","GUMS","GUNS","GURU","GUSH","GUST","GUTS","GUYS","GUZE","GYMS","GYP","GYPS","GYRE","GYRO",
    "HAHA","HAIL","HAIR","HAJI","HAKE","HALE","HALF","HALL","HALO","HALT","HAND","HANG","HANK","HARD","HARE","HARM","HARP","HART","HAS","HASH","HASP","HATE","HATH","HATS","HAUL","HAVE","HAWK","HAYS","HAZE","HAZY","HEAD","HEAL","HEAP","HEAR","HEAT","HECK","HEED","HEEL","HEFT","HEHS","HEIR","HELD","HELL","HELM","HELP","HEMP","HENS","HERB","HERD","HERE","HERO","HERS","HEW","HEWS","HEX","HICK","HIDE","HIES","HIGH","HIKE","HILL","HILT","HIND","HINGE","HINT","HIPS","HIRE","HIST","HITS","HIVE","HOAX","HOBS","HOCK","HOED","HOES","HOGS","HOIST","HOLD","HOLE","HOLY","HOME","HONE","HONK","HOOD","HOOF","HOOK","HOOP","HOOT","HOPE","HOPS","HORN","HOSE","HOST","HOUR","HOVE","HOWL","HUBS","HUED","HUES","HUFF","HUGE","HUGS","HULA","HULK","HULL","HUMP","HUMS","HUNG","HUNK","HUNT","HURL","HURT","HUSH","HUSK","HYMN","HYPE",
    "ICED","ICES","IDEA","IDES","IDLE","IDOL","IFFY","ILKS","ILLS","IMAM","IMPS","INCA","INCH","INFO","INKS","INKY","INNS","INTO","IONS","IOTA","IRES","IRIS","IRON","ISLE","ISMS","ITCH","ITEM","IVES","IVY","ITS","IZBA",
    "JABS","JACK","JADE","JAGS","JAIL","JAKE","JAMB","JAMS","JANE","JARS","JAUNT","JAVA","JAW","JAWS","JAYS","JAZZ","JEEP","JEER","JEEZ","JELL","JERK","JESS","JEST","JETS","JIBE","JIBS","JIFF","JIGS","JILT","JINX","JIVE","JOBS","JOCK","JOEL","JOEY","JOGS","JOHN","JOIN","JOKE","JOLT","JOSS","JOTS","JOWL","JOYS","JUDO","JUGS","JUKE","JULY","JUMP","JUNE","JUNK","JURY","JUST","JUTE","JUTS",
    "KAIL","KALE","KALI","KARL","KART","KATY","KAYA","KEEL","KEEN","KEEP","KEGS","KELP","KEMP","KEN","KENO","KENT","KEPI","KEPT","KETA","KEYS","KHAN","KICK","KID","KIDS","KIEV","KILL","KILN","KILO","KILT","KIN","KIND","KINE","KING","KINS","KIRK","KISS","KITE","KITH","KITS","KIWI","KNEE","KNEW","KNIT","KNOB","KNOT","KNOW","KOAN","KOBO","KOEL","KOLA","KOOK","KOPH","KOSS","KRIS","KUDU","KUNG","KYAT",
    "LABS","LACE","LACK","LACY","LADE","LADS","LADY","LAGS","LAID","LAIN","LAIR","LAKE","LAMA","LAMB","LAME","LAMP","LAND","LANE","LANK","LAPS","LARD","LARGE","LARK","LASE","LASH","LASS","LAST","LATE","LATH","LAUD","LAVA","LAW","LAWN","LAWS","LAYS","LAZE","LAZY","LEAD","LEAF","LEAH","LEAK","LEAN","LEAP","LEAR","LEAS","LECH","LED","LEEK","LEER","LEES","LEFT","LEGS","LEND","LENS","LENT","LEPT","LESS","LEST","LETS","LEVA","LEVELS","LEW","LIAR","LICE","LICK","LIDS","LIED","LIES","LIEU","LIFE","LIFT","LIKE","LILT","LILY","LIMA","LIMB","LIME","LIMN","LIMO","LIMP","LIMY","LINE","LING","LINK","LINT","LION","LIPS","LIRA","LISP","LIST","LITE","LIVE","LOAD","LOAF","LOAM","LOAN","LOBE","LOBS","LOCH","LOCK","LOCO","LODE","LOFT","LOGE","LOGO","LOGS","LOIN","LOLL","LONE","LONG","LOOK","LOOM","LOON","LOOP","LOOS","LOOT","LOPE","LOPS","LORD","LORE","LORY","LOSE","LOSS","LOST","LOTS","LOUD","LOUR","LOUT","LOVE","LOWS","LUBE","LUCE","LUCK","LUFF","LUGS","LULL","LULU","LUMP","LUNA","LUNE","LUNG","LURE","LURK","LUSH","LUST","LUTE","LWEI","LYES","LYME","LYMPH","LYNX","LYRE",
    "MACE","MACK","MADAM","MADE","MAGE","MAGI","MAID","MAIL","MAIM","MAIN","MAKE","MALE","MALL","MALT","MAMA","MANE","MANGE","MANLY","MANS","MANY","MAPS","MARC","MARE","MARK","MARS","MART","MASH","MASK","MASS","MAST","MATE","MATH","MATS","MATT","MAUL","MAW","MAWS","MAYO","MAYS","MAZE","MEAD","MEAL","MEAN","MEAT","MEDS","MEEK","MEET","MELD","MELT","MEMO","MEND","MENS","MERC","MERE","MERL","MESA","MESH","MESS","META","METE","METH","MEW","MEWL","MEWS","MICA","MICE","MICK","MIDI","MIDS","MIEN","MIFF","MIKE","MILD","MILE","MILK","MILL","MILS","MIME","MIND","MINE","MINI","MINK","MINT","MINX","MIRE","MIRK","MIRTH","MISS","MIST","MITE","MITT","MOAN","MOAT","MOBS","MOCK","MODE","MODS","MOIL","MOJO","MOLD","MOLE","MOLT","MOM","MOMS","MONK","MONO","MONS","MOOD","MOON","MOOR","MOOT","MOPE","MOPS","MORE","MORN","MORT","MOSS","MOST","MOTE","MOTH","MOTS","MOTT","MOUE","MOWS","MUCH","MUCK","MUFF","MUG","MUGS","MULE","MULL","MUMS","MUMU","MUNI","MURK","MUSE","MUSH","MUSK","MUSS","MUST","MUTE","MUTT","MYNA","MYRRH",
    "NABS","NAIL","NAKED","NAME","NANS","NAPS","NARC","NARD","NARY","NAVE","NAVY","NAY","NAYS","NEAR","NEAT","NEBS","NECK","NEED","NEEM","NEON","NERD","NESS","NEST","NETS","NEVI","NEW","NEWS","NEXT","NICE","NICK","NIGH","NIL","NILS","NINE","NIPA","NIPS","NIT","NITS","NIXY","NOBS","NODE","NODI","NODS","NOEL","NOES","NOIR","NONE","NOOK","NOON","NOOSE","NORI","NORM","NOSE","NOSEY","NOSY","NOTE","NOUN","NOUS","NOVA","NOW","NUB","NUBS","NUDE","NUKE","NULL","NUMB","NUNS","NURD","NURSE","NUTS",
    "OAFS","OAKS","OARS","OAST","OATH","OATS","OBEY","OBI","OBOE","ODDS","ODES","ODOR","OF","OFF","OFFS","OGLE","OGRE","OHED","OILY","OINK","OK","OKA","OKAS","OKAY","OLD","OLDS","OLDY","OLE","OLES","OLIO","OMEGA","OMEN","ONCE","ONES","ONLY","ONSET","ONTO","ONYX","OOZE","OOZY","OPAL","OPED","OPEN","OPS","OPT","OPTS","ORAL","ORBS","ORCA","ORE","ORES","ORZO","OSE","OUR","OURS","OUST","OUT","OUTS","OUZO","OVAL","OVEN","OVER","OVOID","OVUM","OWE","OWED","OWES","OWING","OWL","OWLS","OWN","OWNS","OXEN","OYER","OYES",
    "PABA","PACE","PACK","PACT","PADS","PAGE","PAID","PAIL","PAIN","PAIR","PALE","PALL","PALM","PALS","PANE","PANG","PANS","PANT","PAPA","PAPS","PARD","PARE","PARK","PARS","PART","PASS","PAST","PATE","PATH","PATS","PAVE","PAWN","PAWS","PAYS","PEA","PEAK","PEAL","PEAN","PEAR","PEAS","PEAT","PECK","PEDAL","PEDS","PEEL","PEEN","PEEP","PEER","PEES","PEGS","PELT","PEN","PENS","PENT","PEON","PEPS","PER","PERCH","PERK","PERM","PERT","PESO","PEST","PEW","PEWS","PEY","PHAT","PHEW","PHI","PHIS","PHIZ","PHON","PI","PIA","PIAS","PICA","PICE","PICK","PICS","PIE","PIED","PIES","PIG","PIGS","PIKA","PIKE","PILE","PILL","PIMP","PINE","PING","PINK","PINS","PINT","PINY","PIP","PIPE","PIPS","PISH","PIT","PITA","PITH","PITS","PITY","PLAN","PLANK","PLATE","PLAY","PLEA","PLED","PLOD","PLOP","PLOT","PLOW","PLOY","PLUG","PLUM","PLUS","PLY","POACH","PODS","POEM","POET","POGO","POI","POIS","POKE","POKY","POL","POLE","POLS","POLO","POLY","POME","POMP","POND","PONE","PONG","PONS","PONY","POOH","POOL","POOP","POOR","POPE","POPS","PORE","PORK","PORT","POSE","POSH","POST","POSY","POT","POTS","POUR","POUT","POW","POWS","POX","PRAM","PRAT","PRAY","PREP","PREZ","PRIG","PRIM","PRO","PROD","PROF","PROM","PROP","PROS","PROW","PRUNE","PRY","PSI","PSIS","PUB","PUBS","PUCE","PUCK","PUFF","PUG","PUGH","PUGS","PUKE","PUL","PULA","PULE","PULI","PULL","PULP","PUMA","PUMP","PUN","PUNK","PUNS","PUNT","PUNY","PUP","PUPA","PUPS","PURE","PURL","PURR","PURS","PUS","PUSH","PUSS","PUT","PUTS","PUTZ","PYE","PYES","PYRE",
    "QUAD","QUAY","QUEEN","QUELL","QUERY","QUEST","QUICK","QUID","QUIP","QUIT","QUIZ","QUOTA","QUOTE",
    "RACE","RACK","RACY","RAFT","RAGA","RAGE","RAGS","RAID","RAIL","RAIN","RAITA","RAJA","RAKE","RAMP","RAMS","RAND","RANG","RANI","RANK","RANT","RAP","RAPE","RAPS","RAPT","RARE","RASH","RASP","RAT","RATE","RATH","RATS","RAVE","RAW","RAYA","RAYS","RAZE","RAZZ","READ","REAL","REAM","REAP","REAR","RED","REDD","REDO","REDS","REEF","REEK","REEL","REES","REFS","REGAL","REIN","RELY","RENT","REPS","REST","RHEA","RIB","RIBS","RICE","RICH","RICK","RID","RIDE","RIDS","RIFE","RIFF","RIFT","RIG","RIGS","RILE","RILL","RIM","RIMS","RIND","RING","RINK","RINS","RIOT","RIP","RIPE","RIPS","RISE","RISK","RITE","RITZ","RIVE","ROAD","ROAM","ROAR","ROB","ROBE","ROBS","ROCK","ROCKER","ROD","RODE","RODS","ROE","ROES","ROIL","ROLE","ROLL","ROMP","ROMS","ROOD","ROOF","ROOK","ROOM","ROOST","ROOT","ROPE","ROPY","ROSE","ROSY","ROT","ROTA","ROTC","ROTE","ROTI","ROTO","ROTS","ROUE","ROUSE","ROUT","ROVE","ROW","ROWS","RUB","RUBE","RUBS","RUBY","RUCK","RUDE","RUE","RUES","RUFF","RUG","RUGA","RUGS","RUIN","RULE","RULES","RUM","RUMP","RUMS","RUN","RUNE","RUNG","RUNS","RUNT","RUSE","RUSH","RUSK","RUST","RUT","RUTS","RYA","RYAS","RYE","RYES",
    "SACK","SACS","SAFE","SAGA","SAGE","SAGS","SAGY","SAID","SAIL","SAKE","SALE","SALSA","SALT","SAME","SAND","SANE","SANG","SANK","SAPS","SARI","SASH","SASS","SAT","SATE","SAUNA","SAVE","SAW","SAWS","SAX","SAYS","SCAB","SCAD","SCAM","SCAN","SCAR","SCAT","SCOT","SCOW","SCUD","SCUM","SEAL","SEAM","SEAR","SEAS","SEAT","SECT","SEED","SEEK","SEEM","SEEN","SEEP","SEER","SEES","SEGO","SELF","SELL","SEMI","SEND","SENT","SEPT","SERA","SERE","SERF","SET","SETA","SETS","SEW","SEWN","SEWS","SEX","SHAG","SHAH","SHAKE","SHAM","SHED","SHIM","SHIN","SHIP","SHOD","SHOE","SHOO","SHOP","SHOT","SHOW","SHUN","SHUT","SIB","SIBS","SIC","SICK","SICS","SIDE","SIFT","SIGH","SIGN","SIKE","SILK","SILL","SILO","SILT","SIMS","SINE","SING","SINK","SINS","SIPS","SIR","SIRE","SIRS","SIS","SISES","SIT","SITE","SITH","SITS","SIX","SIZE","SKEW","SKI","SKID","SKIM","SKIN","SKIP","SKIS","SKIT","SKY","SLAB","SLAG","SLAM","SLANT","SLAP","SLAT","SLAW","SLAY","SLED","SLEW","SLID","SLIM","SLIP","SLIT","SLOB","SLOE","SLOG","SLOP","SLOT","SLOW","SLUE","SLUG","SLUM","SLUR","SLUT","SLY","SMITE","SMOG","SMUG","SMUT","SNAG","SNAP","SNIP","SNIT","SNOB","SNOT","SNOW","SNUB","SNUG","SO","SOAK","SOAP","SOAR","SOB","SOBS","SOCK","SOD","SODA","SODS","SOFA","SOFT","SOIL","SOL","SOLA","SOLE","SOLI","SOLO","SOLS","SOME","SON","SONG","SONS","SOOT","SOP","SOPS","SORB","SORE","SORT","SOS","SOT","SOUL","SOUP","SOUR","SOWN","SOWS","SOX","SOY","SOYA","SOYS","SPA","SPAN","SPAR","SPAS","SPAT","SPAY","SPEC","SPED","SPEW","SPIN","SPIT","SPOT","SPRY","SPUD","SPUN","SPUR","SRI","STAB","STAFF","STAG","STAR","STAY","STEM","STEP","STEW","STIR","STOP","STOW","STUB","STUD","STY","SUB","SUBS","SUCH","SUCK","SUDS","SUE","SUED","SUER","SUES","SUET","SUITE","SUM","SUMO","SUMS","SUN","SUNG","SUNK","SUNS","SUP","SUPS","SURE","SURF","SUSS","SWAB","SWAG","SWAM","SWAN","SWAP","SWAT","SWAY","SWIG","SWIM","SWUM","SYNC",
    "TABS","TABU","TACK","TACO","TACT","TAD","TADS","TAEL","TAFFY","TAGS","TAIL","TAINT","TAKE","TALC","TALE","TALK","TALL","TAME","TAMP","TAN","TANG","TANS","TAP","TAPE","TAPS","TAR","TARE","TARN","TARO","TARP","TARS","TART","TASK","TAU","TAUS","TAUT","TAX","TAXI","TEA","TEAK","TEAL","TEAM","TEAR","TEAS","TEAT","TECH","TED","TEDS","TEEM","TEEN","TEES","TEFF","TELA","TELE","TELL","TEMPO","TEN","TEND","TENS","TENT","TEPEE","TERM","TERN","TEST","TET","TEX","TEXT","THAI","THAN","THAT","THAW","THE","THEE","THEM","THEN","THEW","THEY","THIN","THIS","THO","THOR","THOSE","THOU","THREW","THROB","THROW","THUD","THUG","THUS","THYME","TIC","TICK","TICS","TIDE","TIDY","TIE","TIED","TIES","TIFF","TIGER","TIKI","TILE","TILL","TILT","TIME","TIN","TINE","TINS","TINT","TINY","TIP","TIPS","TIRE","TIT","TITS","TIZZ","TO","TOAD","TODAY","TODS","TODY","TOE","TOED","TOES","TOFF","TOFU","TOGA","TOGS","TOIL","TOKE","TOLD","TOLE","TOLL","TOMB","TOME","TON","TONE","TONG","TONS","TONY","TOO","TOOK","TOOL","TOOT","TOP","TOPI","TOPS","TOQUE","TORCH","TORE","TORI","TORN","TORO","TORT","TORUS","TOSS","TOT","TOTE","TOTS","TOUR","TOUT","TOW","TOWN","TOWS","TOY","TOYS","TRAY","TREE","TREK","TRIG","TRIM","TRIO","TRIP","TROD","TROOP","TROT","TROW","TROY","TRUCK","TRUE","TRY","TSAR","TUB","TUBA","TUBE","TUBS","TUCK","TUFA","TUFF","TUFT","TUG","TUGS","TULIP","TUM","TUN","TUNA","TUNE","TUNS","TURD","TURF","TURN","TUSH","TUSK","TUTU","TWAIN","TWAS","TWEE","TWIG","TWIN","TWIT","TWO","TYPE","TYPO","TZAR",
    "UDDER","UDO","UDOS","UDOM","UFOS","UGH","UGLY","UH","ULAN","ULNA","UMBO","UMP","UMPS","UNARY","UNCAP","UNCLE","UNCO","UNCUT","UNDER","UNDO","UNDUE","UNFIT","UNHIP","UNIT","UNITE","UNITY","UNJUST","UNLIT","UNMAN","UNMET","UNTO","UNUM","UP","UPDO","UPDOS","UPKEEP","UPON","UPPER","UPS","UPSET","URBANE","URGE","URGED","URGER","URGES","URIC","URINE","URN","URNS","USE","USED","USER","USES","USHER","USUAL","UTILE","UTOPIA","UTTER",
    "VAC","VACS","VAIL","VAIN","VALE","VALET","VAN","VANE","VANS","VARA","VARY","VASE","VAST","VAT","VATS","VAU","VAUS","VAV","VEAL","VEE","VEEP","VEER","VEES","VEIL","VEIN","VELDS","VELDT","VENA","VEND","VENT","VERB","VERDANT","VERSE","VERT","VERY","VEST","VET","VETO","VETS","VEX","VEXED","VIA","VIAL","VICAR","VICE","VIE","VIED","VIES","VIEW","VIGIL","VILE","VIM","VIMS","VINE","VINY","VIOL","VIPER","VIRAL","VISA","VISE","VITA","VIVA","VIVID","VIXEN","VIZIR","VLOG","VOICE","VOID","VOLE","VOLT","VOTE","VOUCH","VOW","VOWED","VOWEL","VOWS","VROOM","VYING",
    "WAB","WACK","WACKO","WAD","WADE","WADER","WADI","WADS","WADY","WAE","WAES","WAFER","WAFF","WAFT","WAG","WAGE","WAGER","WAGES","WAGGED","WAGON","WAHINE","WAIF","WAIL","WAIST","WAIT","WAKE","WALE","WALK","WALL","WAMP","WAN","WAND","WANE","WANG","WANT","WAR","WARD","WARDED","WARE","WARES","WARM","WARN","WARP","WART","WARY","WAS","WASH","WASP","WAST","WASTE","WAT","WATCH","WATER","WATT","WATTS","WAVE","WAVED","WAVER","WAVES","WAVY","WAW","WAWS","WAX","WAY","WAYS","WE","WEAK","WEAL","WEAN","WEAR","WEB","WEBS","WED","WEDGE","WEDS","WEE","WEED","WEEK","WEEN","WEEP","WEES","WEFT","WEIGH","WEIR","WELD","WELL","WELT","WEN","WEND","WENS","WENT","WEPT","WERE","WERT","WEST","WET","WETS","WHACK","WHALE","WHAM","WHAP","WHAT","WHEAT","WHEEL","WHEN","WHET","WHEW","WHEY","WHICH","WHIFF","WHIG","WHIM","WHIN","WHINE","WHIP","WHIR","WHIT","WHO","WHOA","WHOLE","WHOM","WHOOP","WHOSE","WHY","WICK","WIDE","WIDOW","WIDTH","WIE","WIELD","WIFE","WIFEY","WIG","WIGGLE","WIGS","WILD","WILE","WILL","WILT","WILY","WIMP","WIN","WINCE","WIND","WINE","WING","WINK","WINS","WINY","WIPE","WIPED","WIPER","WIPES","WIRE","WIRY","WIS","WISE","WISH","WISP","WIST","WIT","WITH","WITS","WIVE","WO","WOAD","WOE","WOES","WOK","WOKE","WOKEN","WOKS","WOLD","WOMAN","WOMB","WON","WONDER","WONT","WOO","WOOD","WOOF","WOOL","WOOS","WORD","WORE","WORK","WORLD","WORM","WORN","WORRY","WORSE","WORST","WORTH","WORTS","WOT","WOULD","WOUND","WOVE","WOVEN","WOW","WOWS","WRAP","WREN","WRIT","WRY","WYE","WYES","WYLE","WYN","WYNS","WYTE",
    "XEBEC","XENIA","XERIC","XEROX","XYLEM",
    "YACHT","YACK","YAGI","YAH","YAHOO","YAK","YAKS","YALD","YAM","YAMS","YANG","YANK","YAP","YAPS","YAR","YARD","YARDS","YARE","YARN","YAUD","YAW","YAWED","YAWL","YAWN","YAWP","YE","YEA","YEAH","YEAR","YEARN","YEARS","YEAS","YEAST","YECH","YED","YEH","YELD","YELL","YELP","YEN","YENS","YEP","YEPS","YES","YESES","YESTER","YET","YETI","YEW","YEWS","YIELD","YIN","YINS","YIP","YIPE","YIPS","YO","YOB","YOBS","YOCK","YOD","YODEL","YODHS","YODS","YOGA","YOGI","YOGIN","YOGIS","YOGURT","YOICKS","YOK","YOKE","YOKEL","YOKES","YOLK","YOM","YON","YOND","YONI","YONIS","YONKS","YORE","YORES","YOU","YOUNG","YOUR","YOURS","YOUTH","YOW","YOWE","YOWL","YOWS","YUAN","YUCK","YUCKS","YUK","YUKKED","YUKS","YULE","YULES","YUM","YUMMY","YUP","YUPPIE","YUPS","YURT","YURTS","YWIS",
    "ZAG","ZAGS","ZAIRE","ZANY","ZAP","ZAPPED","ZAPS","ZARF","ZAYIN","ZAZEN","ZEAL","ZEBRA","ZEDS","ZEE","ZEES","ZEIN","ZEINS","ZEK","ZEKS","ZEN","ZENANA","ZEPHYR","ZERO","ZEROED","ZEROES","ZEROS","ZEST","ZESTED","ZESTS","ZESTY","ZETA","ZETAS","ZEUS","ZIBET","ZIBETS","ZIG","ZIGS","ZIN","ZINC","ZINCED","ZINCS","ZINE","ZINES","ZING","ZINGED","ZINGER","ZINGS","ZINKED","ZINKY","ZINS","ZIP","ZIPS","ZIRCON","ZIT","ZITI","ZITIS","ZITS","ZIZIT","ZIZZLE","ZLOTY","ZOA","ZODIAC","ZOEA","ZOEAE","ZOEAL","ZOEAS","ZOIC","ZOMBI","ZOMBIE","ZONAL","ZONE","ZONED","ZONER","ZONERS","ZONES","ZONK","ZONKED","ZONKS","ZOO","ZOOID","ZOOIDS","ZOOM","ZOOMED","ZOOMS","ZOON","ZOONED","ZOONS","ZOOS","ZORI","ZORIS","ZOUAVE","ZOUAVES","ZOUNDS","ZOYSIA","ZOYSIAS","ZOWIE"
  ];

  // -- Build dictionary sets -------------------------------------------------
  var DICT_THEMED = new Set();
  THEMED_LIST.forEach(function (w) { DICT_THEMED.add(w.toUpperCase()); });
  var DICT_COMMON = new Set();
  COMMON_LIST.forEach(function (w) { DICT_COMMON.add(w.toUpperCase()); });
  // Combined (any valid word)
  var DICT_ALL = new Set();
  DICT_THEMED.forEach(function (w) { DICT_ALL.add(w); });
  DICT_COMMON.forEach(function (w) { DICT_ALL.add(w); });

  function isValidWord(w) {
    if (!w || w.length < MIN_WORD_LEN) return false;
    return DICT_ALL.has(w.toUpperCase());
  }
  function isThemedWord(w) {
    return DICT_THEMED.has(w.toUpperCase());
  }

  // -- Scholar question pool (28 inline) -------------------------------------
  // Each row: keyword (uppercase) + question + 4 choices + correctIndex + explanation.
  // The keyword must be discoverable from a typical 5x5 board (3-7 chars usually).
  var SCHOLAR_BANK = [
    {
      keyword: "SENATE",
      prompt: "The U.S. Senate is part of which branch of government?",
      choices: [
        "Legislative",
        "Executive",
        "Judicial",
        "Cabinet"
      ],
      correctIndex: 0,
      explanation: "The Senate (with the House) makes federal law — that's the legislative branch."
    },
    {
      keyword: "VETO",
      prompt: "A presidential veto is a:",
      choices: [
        "Rejection of a bill passed by Congress",
        "Court ruling against a law",
        "Voter recall of an official",
        "Treaty with a foreign nation"
      ],
      correctIndex: 0,
      explanation: "Congress can override a veto with a two-thirds vote in both chambers."
    },
    {
      keyword: "VOTE",
      prompt: "The 19th Amendment (1920) guaranteed the right to vote for:",
      choices: [
        "Women across the United States",
        "All 18-year-olds",
        "Non-citizens with property",
        "Federal employees"
      ],
      correctIndex: 0,
      explanation: "It capped a 70+ year suffragist fight led by Stanton, Anthony, Wells, and Paul."
    },
    {
      keyword: "JURY",
      prompt: "In a criminal trial, the role of the jury is to:",
      choices: [
        "Decide guilt or innocence based on evidence",
        "Write the laws of the state",
        "Set the sentence after a guilty verdict",
        "Argue the case for the accused"
      ],
      correctIndex: 0,
      explanation: "Trial by jury is protected by the 6th Amendment for serious criminal cases."
    },
    {
      keyword: "LAW",
      prompt: "In the U.S. legal system, the supreme law of the land is:",
      choices: [
        "The Constitution",
        "An executive order",
        "A state statute",
        "The Magna Carta"
      ],
      correctIndex: 0,
      explanation: "Article VI's supremacy clause makes the Constitution and federal law supreme."
    },
    {
      keyword: "WAR",
      prompt: "Under the U.S. Constitution, the power to declare war belongs to:",
      choices: [
        "Congress",
        "The president alone",
        "The Supreme Court",
        "State governors"
      ],
      correctIndex: 0,
      explanation: "Article I, Section 8 gives Congress the power to declare war."
    },
    {
      keyword: "TAX",
      prompt: "A tariff is a:",
      choices: [
        "Tax on imported goods",
        "Sales tax on luxury items",
        "Property tax assessment",
        "Income tax bracket"
      ],
      correctIndex: 0,
      explanation: "Tariffs raise revenue and shield domestic industry, but raise consumer prices."
    },
    {
      keyword: "FREE",
      prompt: "The First Amendment protects freedom of:",
      choices: [
        "Speech, religion, press, assembly, and petition",
        "Movement between states only",
        "Bearing arms only",
        "Trial by jury only"
      ],
      correctIndex: 0,
      explanation: "All five freedoms in one sentence — the foundation of civil liberties."
    },
    {
      keyword: "STATE",
      prompt: "Federalism means power is divided between:",
      choices: [
        "The national government and the states",
        "The president and Congress",
        "Citizens and the press",
        "The Senate and the Cabinet"
      ],
      correctIndex: 0,
      explanation: "The 10th Amendment reserves to the states powers not delegated to the federal government."
    },
    {
      keyword: "PEACE",
      prompt: "The League of Nations was created after which war to maintain peace?",
      choices: [
        "World War I",
        "The Civil War",
        "World War II",
        "The Cold War"
      ],
      correctIndex: 0,
      explanation: "Founded in 1920 from Wilson's 14 Points; replaced by the UN in 1945."
    },
    {
      keyword: "REIGN",
      prompt: "The English monarch's reign is limited by:",
      choices: [
        "Parliament — the United Kingdom is a constitutional monarchy",
        "The Pope's authority",
        "An elected American president",
        "Annual citizen referenda"
      ],
      correctIndex: 0,
      explanation: "Since the Glorious Revolution (1688), Parliament holds real legislative power."
    },
    {
      keyword: "ROYAL",
      prompt: "Louis XIV of France famously claimed:",
      choices: [
        "'I am the state'",
        "'Liberty, equality, fraternity'",
        "'Give me liberty or give me death'",
        "'Government of the people'"
      ],
      correctIndex: 0,
      explanation: "Louis personified absolutism — concentrating royal power at Versailles."
    },
    {
      keyword: "EMPIRE",
      prompt: "The Roman Empire's fall in the West is most often dated to:",
      choices: [
        "476 CE",
        "1066 CE",
        "1492 CE",
        "1789 CE"
      ],
      correctIndex: 0,
      explanation: "When Odoacer deposed Romulus Augustulus, the last western emperor."
    },
    {
      keyword: "TREATY",
      prompt: "The Treaty of Versailles (1919) most directly:",
      choices: [
        "Imposed harsh terms on Germany after WWI",
        "Ended the American Civil War",
        "Founded the European Union",
        "Created the United Nations"
      ],
      correctIndex: 0,
      explanation: "Reparations and the war-guilt clause fueled German resentment toward fascism."
    },
    {
      keyword: "TRADE",
      prompt: "The Silk Road most famously connected:",
      choices: [
        "China and the Mediterranean world",
        "England and the New World",
        "Egypt and Mesopotamia",
        "Spain and the Aztec Empire"
      ],
      correctIndex: 0,
      explanation: "Goods, ideas, religions, and disease all traveled this overland network."
    },
    {
      keyword: "BATTLE",
      prompt: "The Battle of Gettysburg (1863) is considered the turning point of:",
      choices: [
        "The U.S. Civil War",
        "World War I",
        "The American Revolution",
        "The Mexican-American War"
      ],
      correctIndex: 0,
      explanation: "Lee's defeat ended Confederate hopes of breaking into the North."
    },
    {
      keyword: "SLAVE",
      prompt: "The 13th Amendment (1865) to the U.S. Constitution:",
      choices: [
        "Abolished slavery throughout the United States",
        "Gave women the right to vote",
        "Lowered the voting age to 18",
        "Created the income tax"
      ],
      correctIndex: 0,
      explanation: "Following Lincoln's Emancipation Proclamation, the 13th Amendment ended slavery permanently."
    },
    {
      keyword: "ATOM",
      prompt: "A neutral atom has the same number of protons and:",
      choices: [
        "Electrons",
        "Neutrons",
        "Quarks",
        "Photons"
      ],
      correctIndex: 0,
      explanation: "Equal positive (proton) and negative (electron) charges balance to zero."
    },
    {
      keyword: "CELL",
      prompt: "Mitochondria are nicknamed the 'powerhouse of the cell' because they:",
      choices: [
        "Produce ATP through cellular respiration",
        "Store the cell's genetic blueprint",
        "Filter waste from the cytoplasm",
        "Build proteins from messenger RNA"
      ],
      correctIndex: 0,
      explanation: "ATP is the cell's main energy currency."
    },
    {
      keyword: "EARTH",
      prompt: "Plate tectonics explains:",
      choices: [
        "Earthquakes, volcanoes, and continental drift",
        "The phases of the Moon",
        "The cycles of seasons",
        "Tides on the ocean"
      ],
      correctIndex: 0,
      explanation: "Earth's lithosphere is broken into plates that move atop the mantle."
    },
    {
      keyword: "OCEAN",
      prompt: "Earth's largest ocean by area is the:",
      choices: [
        "Pacific",
        "Atlantic",
        "Indian",
        "Arctic"
      ],
      correctIndex: 0,
      explanation: "It covers ~30% of Earth's surface — bigger than all the land combined."
    },
    {
      keyword: "RIVER",
      prompt: "The longest river in the world is most often cited as:",
      choices: [
        "The Nile (Africa)",
        "The Mississippi (North America)",
        "The Thames (England)",
        "The Tiber (Italy)"
      ],
      correctIndex: 0,
      explanation: "The Nile-Amazon length debate is close, but most maps list the Nile longest."
    },
    {
      keyword: "MOUNT",
      prompt: "Mount Everest, the world's highest peak, is in which mountain range?",
      choices: [
        "The Himalayas",
        "The Andes",
        "The Rockies",
        "The Alps"
      ],
      correctIndex: 0,
      explanation: "The Himalayas formed where the Indian plate collided with the Eurasian plate."
    },
    {
      keyword: "ISLAND",
      prompt: "An archipelago is a:",
      choices: [
        "Group or chain of islands",
        "Type of mountain",
        "Underwater volcano",
        "Sea between two continents"
      ],
      correctIndex: 0,
      explanation: "Indonesia, the Philippines, and Japan are all major archipelagos."
    },
    {
      keyword: "DESERT",
      prompt: "The Sahara, the world's largest hot desert, is located in:",
      choices: [
        "North Africa",
        "Central Asia",
        "South America",
        "Western Europe"
      ],
      correctIndex: 0,
      explanation: "It spans over 9 million square kilometers — about the size of the United States."
    },
    {
      keyword: "FOREST",
      prompt: "The Amazon rainforest is sometimes called:",
      choices: [
        "The lungs of the Earth",
        "The breadbasket of the world",
        "The cradle of civilization",
        "The roof of the world"
      ],
      correctIndex: 0,
      explanation: "Photosynthesis there produces a large share of Earth's atmospheric oxygen."
    },
    {
      keyword: "WATER",
      prompt: "The water cycle's main processes are:",
      choices: [
        "Evaporation, condensation, and precipitation",
        "Erosion, deposition, and weathering",
        "Photosynthesis and respiration",
        "Mitosis and meiosis"
      ],
      correctIndex: 0,
      explanation: "Solar energy drives the cycle, returning fresh water to land and seas."
    },
    {
      keyword: "ENERGY",
      prompt: "The law of conservation of energy says energy can be:",
      choices: [
        "Transformed but not created or destroyed",
        "Created from nothing",
        "Destroyed by friction",
        "Stored only in batteries"
      ],
      correctIndex: 0,
      explanation: "First law of thermodynamics — total energy in a closed system is constant."
    }
  ];

  // -- Powerup metadata ------------------------------------------------------
  var POWERUP_META = {
    reveal:   { glyph: "💡", color: "#f5c451", glow: "#f5c451", label: "REVEAL WORD",   key: "1", desc: "Highlight a 4+letter word on the grid" },
    time:     { glyph: "⏱",  color: "#5de0f0", glow: "#5de0f0", label: "+20s",          key: "2", desc: "Add 20 seconds to the round" },
    reshuffle:{ glyph: "🔄", color: "#6dc18f", glow: "#6dc18f", label: "RE-SHUFFLE",     key: "3", desc: "Re-roll all letters" },
    multx2:   { glyph: "⭐", color: "#fff8c4", glow: "#f0a800", label: "x2 MULT",         key: "4", desc: "Next 5 words double-score" },
    autofind: { glyph: "🎯", color: "#a991ff", glow: "#a991ff", label: "AUTO-FIND",     key: "5", desc: "Auto-submit all 3-letter starters" }
  };
  var POWERUP_TYPES = ["reveal", "time", "reshuffle", "multx2", "autofind"];

  // -- Canvas/state ----------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | question | paused | ended | roundIntermission
  var prevPhase = null;
  var rafHandle = null;
  var lastFrame = 0;

  var state = null;
  var reducedMotion = false;
  try { reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var soundOn = true;
  var startTimeMs = 0;

  // -- SFX (Web Audio) -------------------------------------------------------
  var sfxCtx = null;
  function sfxInit() {
    if (sfxCtx || !soundOn) return sfxCtx;
    try { sfxCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { sfxCtx = null; }
    return sfxCtx;
  }
  function sfxTone(freq, duration, opts) {
    if (!soundOn) return;
    var ctxA = sfxInit();
    if (!ctxA) return;
    opts = opts || {};
    var type = opts.type || "square";
    var vol = opts.volume == null ? 0.16 : opts.volume;
    var attack = opts.attack || 0.005;
    var decay = opts.decay == null ? duration : opts.decay;
    var now = ctxA.currentTime;
    try {
      var osc = ctxA.createOscillator();
      var gain = ctxA.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (opts.endFreq != null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.endFreq), now + duration);
      }
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      osc.connect(gain).connect(ctxA.destination);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch (e) {}
  }
  function sfxNoise(duration, opts) {
    if (!soundOn) return;
    var ctxA = sfxInit();
    if (!ctxA) return;
    opts = opts || {};
    var vol = opts.volume == null ? 0.16 : opts.volume;
    var bufferSize = Math.floor(ctxA.sampleRate * duration);
    try {
      var buffer = ctxA.createBuffer(1, bufferSize, ctxA.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      var src = ctxA.createBufferSource();
      src.buffer = buffer;
      var gain = ctxA.createGain();
      gain.gain.setValueAtTime(vol, ctxA.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctxA.currentTime + duration);
      var filter = ctxA.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = opts.cutoff || 1200;
      src.connect(filter).connect(gain).connect(ctxA.destination);
      src.start();
    } catch (e) {}
  }
  var sfx = {
    tile_select: function () { sfxTone(720, 0.04, { type: "triangle", volume: 0.10 }); },
    word_submit: function () {
      [659, 988, 1318].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.13, { type: "triangle", volume: 0.16 }); }, i * 60);
      });
    },
    word_invalid: function () {
      sfxNoise(0.18, { volume: 0.12, cutoff: 700 });
      sfxTone(330, 0.22, { type: "sawtooth", volume: 0.12, endFreq: 110 });
    },
    word_repeat: function () {
      sfxTone(440, 0.08, { type: "square", volume: 0.10 });
      setTimeout(function () { sfxTone(330, 0.10, { type: "square", volume: 0.10 }); }, 80);
    },
    scholar_word: function () {
      [523, 784, 988].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.15, { type: "triangle", volume: 0.16 }); }, i * 80);
      });
    },
    scholar_correct: function () {
      [659, 988, 1318, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.18, { type: "triangle", volume: 0.18 }); }, i * 70);
      });
    },
    scholar_wrong: function () {
      sfxTone(440, 0.3, { type: "sawtooth", volume: 0.14, endFreq: 110 });
    },
    round_clear: function () {
      [523, 659, 784, 988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.16 }); }, i * 70);
      });
    },
    life_lost: function () {
      sfxNoise(0.4, { volume: 0.18, cutoff: 600 });
      sfxTone(330, 0.4, { type: "sawtooth", volume: 0.16, endFreq: 50 });
    },
    gameOver: function () {
      sfxNoise(0.5, { volume: 0.22, cutoff: 700 });
      sfxTone(330, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 50 });
    },
    powerup_pickup: function () {
      sfxTone(880, 0.10, { type: "triangle", volume: 0.16 });
      setTimeout(function () { sfxTone(1320, 0.14, { type: "triangle", volume: 0.16 }); }, 80);
    },
    powerup_use: function () {
      [988, 1318, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.10, { type: "triangle", volume: 0.16 }); }, i * 50);
      });
    },
    time_low_warn: function () {
      sfxTone(880, 0.06, { type: "square", volume: 0.10 });
    },
    big_word: function () {
      [659, 880, 1175, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.14, { type: "triangle", volume: 0.18 }); }, i * 50);
      });
    }
  };

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }
  function setupDom() {
    canvas = $("boggleCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudRound = $("hudRound");
    dom.hudWords = $("hudWords");
    dom.hudTimer = $("hudTimer");
    dom.hudTimerCell = $("hudTimerCell");
    dom.hudMult = $("hudMult");
    dom.hudBest = $("hudBest");
    dom.goalName = $("goalName");
    dom.goalMeta = $("goalMeta");
    dom.waveRibbon = $("waveRibbon");
    dom.popupOverlay = $("popupOverlay");
    dom.setupScreen = $("setupScreen");
    dom.questionScreen = $("questionScreen");
    dom.pauseScreen = $("pauseScreen");
    dom.endScreen = $("endScreen");
    dom.questionPrompt = $("questionPrompt");
    dom.choiceGrid = $("choiceGrid");
    dom.questionMeta = $("questionMeta");
    dom.questionCloseBtn = $("questionCloseBtn");
    dom.explanation = $("explanation");
    dom.startBtn = $("startBtn");
    dom.soundBtn = $("soundBtn");
    dom.fullscreenBtn = $("fullscreenBtn");
    dom.resumeBtn = $("resumeBtn");
    dom.restartBtn = $("restartBtn");
    dom.pauseExitBtn = $("pauseExitBtn");
    dom.exitBtn = $("exitBtn");
    dom.pauseBtn = $("pauseBtn");
    dom.setupBtn = $("setupBtn");
    dom.againBtn = $("againBtn");
    dom.endTitle = $("endTitle");
    dom.endKicker = $("endKicker");
    dom.endGrid = $("endGrid");
    dom.retryHint = $("retryHint");
    dom.resumeCard = $("resumeCard");
    dom.leaderboardPanel = $("leaderboardPanel");
    dom.submitBtn = $("submitBtn");
    dom.clearBtn = $("clearBtn");
    dom.roundControls = $("roundControls");
    dom.powerupTray = $("powerupTray");
    dom.wordReadout = $("wordReadout");
    dom.wordReadoutText = $("wordReadoutText");
    dom.wordReadoutLen = $("wordReadoutLen");
    dom.foundList = $("foundList");
    dom.foundCount = $("foundCount");
  }

  // -- Grid generation -------------------------------------------------------
  function pickWeightedLetter() {
    return LETTER_BAG[Math.floor(Math.random() * LETTER_BAG.length)];
  }
  function generateGrid() {
    // Build a 5x5 grid of letter tiles. Guarantee enough vowels.
    var attempts = 0;
    var grid;
    while (attempts < 30) {
      grid = [];
      var vowelCount = 0;
      for (var r = 0; r < GRID_SIZE; r++) {
        var row = [];
        for (var c = 0; c < GRID_SIZE; c++) {
          var L = pickWeightedLetter();
          if (VOWELS.indexOf(L) >= 0) vowelCount++;
          row.push({
            row: r, col: c,
            letter: L,
            scholar: false,
            id: r * GRID_SIZE + c
          });
        }
        grid.push(row);
      }
      if (vowelCount >= 7) break; // need at least 7 vowels for a playable board
      attempts++;
    }
    // Place ONE scholar tile (prefer a tile whose letter starts a scholar keyword).
    placeScholarTile(grid);
    return grid;
  }
  function placeScholarTile(grid) {
    // Find a tile that matches the FIRST letter of a scholar keyword present in DICT_THEMED.
    // Prefer tiles whose letter has multiple scholar keywords.
    var positions = [];
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        positions.push(grid[r][c]);
      }
    }
    // Score positions by how many scholar entries start with this letter
    var letterCount = {};
    SCHOLAR_BANK.forEach(function (b) {
      var k = b.keyword.charAt(0);
      letterCount[k] = (letterCount[k] || 0) + 1;
    });
    positions.sort(function (a, b) {
      var sa = letterCount[a.letter] || 0;
      var sb = letterCount[b.letter] || 0;
      return sb - sa;
    });
    // Pick from top 6 (some randomness)
    var topN = Math.min(6, positions.length);
    var pick = positions[Math.floor(Math.random() * topN)];
    if (pick) pick.scholar = true;
  }

  // -- State init / lifecycle ------------------------------------------------
  function initState() {
    state = {
      score: 0,
      round: 1,
      lives: TOTAL_ROUNDS, // 3 rounds total; "lives" labels round count
      best: readBest(),
      shardsAwarded: 0,
      grid: null,
      // Drag selection
      selecting: false,
      selectedIds: [],     // ordered list of tile ids
      currentWord: "",
      // Round metadata
      roundTime: ROUND_TIMER,
      roundStartTime: ROUND_TIMER,
      roundWords: [],      // words found this round
      foundAllWords: new Set(), // ALL words found across rounds (for repeat check)
      scholarWordTags: {}, // word -> true if discovered via scholar tile
      roundScore: 0,
      longestThisRound: 0,
      // Round results
      roundsResults: [],   // { score, words, longest }
      // Multiplier
      multiplier: 1,
      x2WordsLeft: 0,
      // Powerups
      powerups: [],
      wordsCounted: 0,     // total words for powerup gates
      lastPowerupGate: -1, // which gate (index) we awarded last
      // Reveal animation
      revealHighlight: null, // { ids: [], life: 0.0 }
      // Scholar
      scholarEntry: null,
      scholarChoiceOrder: null,
      scholarNewCorrect: -1,
      scholarCorrect: 0,
      pendingScholarKeyword: null, // word the player just submitted that triggered scholar
      // Effects
      particles: [],
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      bgStars: makeBgStars(70),
      time: 0,
      // Tile feedback
      flashTiles: null,    // { ids: [], color, life, totalLife }
      lastTimeWarn: 0,
      timeoutTriggered: false
    };
  }

  function startGame(snap) {
    try { if (window.MrMacsEndRecap) { MrMacsEndRecap.reset(); MrMacsEndRecap.startTracking(); } } catch (e) {}
    initState();
    if (snap) {
      // resume not supported across rounds for simplicity — but keep score/round
      state.score = snap.score || 0;
      state.round = Math.min(TOTAL_ROUNDS, snap.round || 1);
      state.best = readBest();
    }
    phase = "playing";
    startTimeMs = performance.now();
    if (dom.setupScreen) dom.setupScreen.classList.remove("show");
    if (dom.endScreen) dom.endScreen.classList.remove("show");
    if (dom.pauseScreen) dom.pauseScreen.classList.remove("show");
    startRound();
    updateHud();
    updateRibbon();
    if (dom.roundControls) dom.roundControls.classList.add("show");
    startMusic();
  }
  function startRound() {
    state.grid = generateGrid();
    state.roundTime = ROUND_TIMER;
    state.roundStartTime = ROUND_TIMER;
    state.roundWords = [];
    state.roundScore = 0;
    state.longestThisRound = 0;
    state.timeoutTriggered = false;
    state.lastTimeWarn = 0;
    clearSelection();
    renderFoundList();
    updateHud();
    updateRibbon();
    pushPopup("ROUND " + state.round, LOGICAL_W / 2, 280, "is-tetris");
  }
  function endRound() {
    if (state.timeoutTriggered) return;
    state.timeoutTriggered = true;
    // Tally bonus: (totalWords × 50) + (longest × 100)
    var bonus = state.roundWords.length * 50 + state.longestThisRound * 100;
    state.score += bonus;
    state.roundScore += bonus;
    state.roundsResults.push({
      score: state.roundScore,
      words: state.roundWords.length,
      longest: state.longestThisRound
    });
    pushPopup("ROUND BONUS +" + bonus, LOGICAL_W / 2, 320, "is-bonus");
    sfx.round_clear();
    // Game-over check: 3 rounds with score < 1000 = game over
    var roundsBelowThreshold = state.roundsResults.filter(function (rr) { return rr.score < GAMEOVER_THRESHOLD; }).length;
    if (state.round >= TOTAL_ROUNDS) {
      // Final round complete
      finishGame(roundsBelowThreshold === TOTAL_ROUNDS);
      return;
    }
    if (roundsBelowThreshold >= TOTAL_ROUNDS) {
      finishGame(true);
      return;
    }
    // Advance to next round shortly
    setTimeout(function () {
      state.round += 1;
      startRound();
    }, 1500);
  }
  function finishGame(gameOver) {
    phase = "ended";
    if (state.score > state.best) {
      state.best = state.score;
      writeBest(state.best);
    }
    submitLeaderboard();
    recordPlayWithProfile();
    clearSnapshot();
    sfx.gameOver();
    stopMusic();
    if (dom.endTitle) dom.endTitle.textContent = gameOver ? "Boggle Beat — Game Over" : "Boggle Beat — Hunt Complete";
    if (dom.endKicker) dom.endKicker.textContent = gameOver ? "Below threshold" : "Run Complete";
    renderEndGrid();
    try { if (window.MrMacsEndRecap) { MrMacsEndRecap.stopTracking(); MrMacsEndRecap.render(document.getElementById("endRecap")); } } catch (e) {}
    if (dom.endScreen) dom.endScreen.classList.add("show");
  }
  function renderEndGrid() {
    if (!dom.endGrid) return;
    var totalWords = state.roundsResults.reduce(function (s, r) { return s + r.words; }, 0);
    var bestRound = 0;
    state.roundsResults.forEach(function (r) { if (r.score > bestRound) bestRound = r.score; });
    var html = "";
    html += '<div class="end-cell"><span class="end-cell-label">Final Score</span><span class="end-cell-value">' + state.score + '</span></div>';
    html += '<div class="end-cell is-best"><span class="end-cell-label">Best</span><span class="end-cell-value">' + state.best + '</span></div>';
    html += '<div class="end-cell"><span class="end-cell-label">Words Found</span><span class="end-cell-value">' + totalWords + '</span></div>';
    html += '<div class="end-cell"><span class="end-cell-label">Best Round</span><span class="end-cell-value">' + bestRound + '</span></div>';
    html += '<div class="end-cell"><span class="end-cell-label">Scholars</span><span class="end-cell-value">' + state.scholarCorrect + '</span></div>';
    html += '<div class="end-cell"><span class="end-cell-label">Shards</span><span class="end-cell-value">' + state.shardsAwarded + '</span></div>';
    dom.endGrid.innerHTML = html;
  }

  // -- Selection / drag mechanics --------------------------------------------
  function clearSelection() {
    state.selectedIds = [];
    state.currentWord = "";
    updateWordReadout(false);
  }
  function tileById(id) {
    if (!state || !state.grid) return null;
    var r = Math.floor(id / GRID_SIZE);
    var c = id % GRID_SIZE;
    return (state.grid[r] && state.grid[r][c]) || null;
  }
  function isAdjacent(a, b) {
    if (!a || !b) return false;
    if (a === b) return false;
    var dr = Math.abs(a.row - b.row);
    var dc = Math.abs(a.col - b.col);
    // Strict 8-direction: at most one row/col step, and not the same tile.
    if (dr > 1 || dc > 1) return false;
    return (dr + dc) > 0;
  }
  function tryAppendTile(id) {
    if (!state || phase !== "playing") return false;
    if (state.timeoutTriggered) return false;
    if (typeof id !== "number" || id < 0 || id >= GRID_SIZE * GRID_SIZE) return false;
    var tile = tileById(id);
    if (!tile) return false;
    if (state.selectedIds.indexOf(id) >= 0) {
      // Allow backtracking only to the immediately-previous tile (n-2 in selection).
      if (state.selectedIds.length >= 2 && state.selectedIds[state.selectedIds.length - 2] === id) {
        state.selectedIds.pop();
        state.currentWord = readSelectionWord();
        updateWordReadout(true);
        return true;
      }
      return false; // a tile cannot be used twice in the same word
    }
    if (state.selectedIds.length === 0) {
      state.selectedIds.push(id);
      state.currentWord = (tile.letter || "").toUpperCase();
      sfx.tile_select();
      updateWordReadout(true);
      return true;
    }
    var prev = tileById(state.selectedIds[state.selectedIds.length - 1]);
    if (!isAdjacent(prev, tile)) return false;
    state.selectedIds.push(id);
    state.currentWord = readSelectionWord();
    sfx.tile_select();
    updateWordReadout(true);
    return true;
  }
  function readSelectionWord() {
    var s = "";
    for (var i = 0; i < state.selectedIds.length; i++) {
      var t = tileById(state.selectedIds[i]);
      if (t) s += t.letter;
    }
    return s;
  }
  function updateWordReadout(active) {
    if (!dom.wordReadoutText) return;
    var w = state.currentWord || "";
    dom.wordReadoutText.textContent = w.length ? w : "—";
    if (dom.wordReadoutLen) dom.wordReadoutLen.textContent = String(w.length);
    if (dom.wordReadout) {
      dom.wordReadout.classList.toggle("is-active", !!(active && w.length));
      dom.wordReadout.classList.remove("is-warn");
    }
  }

  // -- Submit logic ----------------------------------------------------------
  function submitWord() {
    if (phase !== "playing" || !state || state.timeoutTriggered) return;
    var word = (state.currentWord || "").toUpperCase();
    // Empty word — silent no-op (e.g. Enter pressed with no selection).
    if (!word.length) {
      clearSelection();
      return;
    }
    if (word.length < MIN_WORD_LEN) {
      // Too short — gentle fail
      sfx.word_invalid();
      flashSelectedTiles("#d04848", 0.4);
      pushPopup("TOO SHORT", LOGICAL_W / 2, GRID_TOP - 20, "is-warn");
      if (dom.wordReadout) dom.wordReadout.classList.add("is-warn");
      clearSelection();
      return;
    }
    if (!isValidWord(word)) {
      sfx.word_invalid();
      flashSelectedTiles("#d04848", 0.45);
      pushPopup("NOT A WORD", LOGICAL_W / 2, GRID_TOP - 20, "is-warn");
      if (dom.wordReadout) dom.wordReadout.classList.add("is-warn");
      clearSelection();
      return;
    }
    if (state.foundAllWords.has(word)) {
      sfx.word_repeat();
      flashSelectedTiles("#d04848", 0.4);
      pushPopup("ALREADY FOUND", LOGICAL_W / 2, GRID_TOP - 20, "is-warn");
      clearSelection();
      return;
    }
    // Valid! Record and score.
    state.foundAllWords.add(word);
    state.roundWords.push(word);
    state.wordsCounted += 1;
    if (word.length > state.longestThisRound) state.longestThisRound = word.length;
    var themed = isThemedWord(word);
    var pts = (word.length * word.length * 10) + (themed ? 50 : 0);
    var x2 = state.x2WordsLeft > 0 ? 2 : 1;
    if (state.x2WordsLeft > 0) state.x2WordsLeft -= 1;
    var totalPts = pts * x2;
    state.score += totalPts;
    state.roundScore += totalPts;
    pushPopup("+" + totalPts, LOGICAL_W / 2, GRID_TOP - 24, "is-score");
    if (themed) pushPopup("THEMED +50", LOGICAL_W / 2, GRID_TOP - 56, "is-bonus");
    if (word.length >= 5) sfx.big_word(); else sfx.word_submit();
    flashSelectedTiles("#4dd49b", 0.55);
    burstAt(GRID_LEFT + GRID_W / 2, GRID_TOP + GRID_H / 2, "#f5c451", word.length * 4);
    // Scholar tile check: any selected tile is the scholar?
    var scholarHit = false;
    for (var i = 0; i < state.selectedIds.length; i++) {
      var tile = tileById(state.selectedIds[i]);
      if (tile && tile.scholar) { scholarHit = true; break; }
    }
    recordAnswerHook(true, word);
    renderFoundList();
    updateHud();
    saveSnapshot();
    if (scholarHit) {
      state.pendingScholarKeyword = word;
      state.scholarWordTags = state.scholarWordTags || {};
      state.scholarWordTags[word] = true;
      sfx.scholar_word();
      // Clear selection visual but trigger scholar after short delay
      clearSelection();
      setTimeout(function () { openScholarQuestion(word); }, 500);
      return;
    }
    // Powerup gates
    if (state.wordsCounted > 0) {
      var nextGateIdx = state.lastPowerupGate + 1;
      if (nextGateIdx < POWERUP_DROP_AT_WORDS.length) {
        if (state.wordsCounted >= POWERUP_DROP_AT_WORDS[nextGateIdx]) {
          state.lastPowerupGate = nextGateIdx;
          if (state.powerups.length < POWERUP_INV_MAX) grantRandomPowerup();
        }
      }
    }
    clearSelection();
  }
  function flashSelectedTiles(color, life) {
    state.flashTiles = {
      ids: state.selectedIds.slice(),
      color: color,
      life: life,
      totalLife: life
    };
  }
  function renderFoundList() {
    if (!dom.foundList) return;
    var tags = (state && state.scholarWordTags) || {};
    var html = "";
    // Sort newest first
    var copy = state.roundWords.slice().reverse();
    for (var i = 0; i < copy.length; i++) {
      var w = copy[i];
      var themed = isThemedWord(w);
      var pts = (w.length * w.length * 10) + (themed ? 50 : 0);
      var cls = tags[w] ? "is-scholar" : (themed ? "is-history" : "");
      html += '<li class="' + cls + '"><span>' + escapeHtml(w) + '</span><span class="found-pts mono">' + pts + '</span></li>';
    }
    dom.foundList.innerHTML = html;
    if (dom.foundCount) dom.foundCount.textContent = String(state.roundWords.length);
  }

  // -- Powerups --------------------------------------------------------------
  function grantRandomPowerup() {
    if (state.powerups.length >= POWERUP_INV_MAX) return;
    var type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    state.powerups.push({ type: type });
    sfx.powerup_pickup();
    pushPopup(POWERUP_META[type].label + " GAINED", LOGICAL_W / 2, 320, "is-bonus");
    renderPowerupTray();
  }
  function usePowerup(idxOrType) {
    if (phase !== "playing") return;
    if (!state || state.timeoutTriggered) return;
    var idx = -1;
    if (typeof idxOrType === "number") idx = idxOrType;
    else {
      for (var i = 0; i < state.powerups.length; i++) if (state.powerups[i].type === idxOrType) { idx = i; break; }
    }
    if (idx < 0 || idx >= state.powerups.length) return;
    var p = state.powerups[idx];
    // For reveal/autofind we may need to refund if there's nothing to do.
    var consumed = true;
    state.powerups.splice(idx, 1);
    if (p.type === "reveal") {
      if (!revealRandomWord()) {
        // Refund — no word was found to highlight.
        state.powerups.splice(idx, 0, p);
        consumed = false;
      }
    } else if (p.type === "time") {
      state.roundTime = Math.min(state.roundStartTime + 30, state.roundTime + 20);
      pushPopup("+20s", LOGICAL_W / 2, 320, "is-cyan");
    } else if (p.type === "reshuffle") {
      reshuffleGrid();
      pushPopup("RE-SHUFFLED", LOGICAL_W / 2, 320, "is-cyan");
    } else if (p.type === "multx2") {
      state.x2WordsLeft = 5;
      pushPopup("x2 NEXT 5", LOGICAL_W / 2, 320, "is-tetris");
    } else if (p.type === "autofind") {
      if (!autoFindStarters()) {
        state.powerups.splice(idx, 0, p);
        consumed = false;
      }
    }
    if (consumed) sfx.powerup_use();
    renderPowerupTray();
    updateHud();
    updateRibbon();
  }
  function reshuffleGrid() {
    // Re-roll all letters; generateGrid places a fresh scholar tile.
    state.grid = generateGrid();
    clearSelection();
  }
  function revealRandomWord() {
    // Find a 4+ letter word using BFS through the grid via valid dictionary words.
    // Returns true if a word was highlighted, false otherwise (so the powerup can be refunded).
    var found = findOneWord(4, 7);
    if (!found) {
      // Fallback to 3+
      found = findOneWord(3, 6);
    }
    if (found && found.ids && found.ids.length) {
      state.revealHighlight = { ids: found.ids, life: 3.5, totalLife: 3.5 };
      pushPopup("REVEAL: " + found.word, LOGICAL_W / 2, 320, "is-cyan");
      return true;
    }
    pushPopup("NO WORDS FOUND", LOGICAL_W / 2, 320, "is-warn");
    return false;
  }
  function autoFindStarters() {
    // Submit all 3-letter words from the grid that are valid AND not yet found.
    // Returns true if anything was submitted (so the powerup is consumed), false to refund.
    var subs = findAllWords(3, 3, 8);
    var submitted = 0;
    for (var i = 0; i < subs.length && submitted < 8; i++) {
      var entry = subs[i];
      if (!entry || !entry.word) continue;
      var w = entry.word.toUpperCase();
      if (!isValidWord(w)) continue;            // belt-and-suspenders: never submit invalid
      if (state.foundAllWords.has(w)) continue; // skip repeats (case-normalized)
      // Score it directly without redoing selection
      state.foundAllWords.add(w);
      state.roundWords.push(w);
      state.wordsCounted += 1;
      if (w.length > state.longestThisRound) state.longestThisRound = w.length;
      var themed = isThemedWord(w);
      var pts = (w.length * w.length * 10) + (themed ? 50 : 0);
      state.score += pts;
      state.roundScore += pts;
      submitted++;
    }
    if (submitted > 0) {
      pushPopup("AUTO +" + submitted, LOGICAL_W / 2, 320, "is-bonus");
      sfx.word_submit();
      renderFoundList();
      updateHud();
      return true;
    }
    pushPopup("NO 3-LETTER STARTERS", LOGICAL_W / 2, 320, "is-warn");
    return false;
  }
  // Grid search — finds one word in [minLen..maxLen]
  function findOneWord(minLen, maxLen) {
    var visited = new Array(GRID_SIZE * GRID_SIZE).fill(false);
    var result = null;
    for (var r = 0; r < GRID_SIZE && !result; r++) {
      for (var c = 0; c < GRID_SIZE && !result; c++) {
        result = dfsFind(r, c, "", [], visited, minLen, maxLen, function (w) {
          return isValidWord(w) && !state.foundAllWords.has(w) && w.length >= minLen && w.length <= maxLen;
        });
      }
    }
    return result;
  }
  function findAllWords(minLen, maxLen, cap) {
    cap = cap || 5;
    var out = [];
    var visited = new Array(GRID_SIZE * GRID_SIZE).fill(false);
    for (var r = 0; r < GRID_SIZE && out.length < cap; r++) {
      for (var c = 0; c < GRID_SIZE && out.length < cap; c++) {
        dfsCollect(r, c, "", [], visited, minLen, maxLen, function (w, ids) {
          if (isValidWord(w) && !state.foundAllWords.has(w) && w.length >= minLen && w.length <= maxLen) {
            // dedupe by word
            for (var k = 0; k < out.length; k++) if (out[k].word === w) return;
            out.push({ word: w, ids: ids.slice() });
            if (out.length >= cap) return;
          }
        });
      }
    }
    return out;
  }
  function dfsFind(r, c, prefix, ids, visited, minLen, maxLen, accept) {
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return null;
    var t = state.grid[r][c];
    if (visited[t.id]) return null;
    visited[t.id] = true;
    var word = prefix + t.letter;
    var newIds = ids.concat([t.id]);
    var found = null;
    if (word.length >= minLen && word.length <= maxLen && accept(word)) {
      found = { word: word, ids: newIds };
    }
    if (!found && word.length < maxLen) {
      var dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      for (var d = 0; d < dirs.length && !found; d++) {
        found = dfsFind(r + dirs[d][0], c + dirs[d][1], word, newIds, visited, minLen, maxLen, accept);
      }
    }
    visited[t.id] = false;
    return found;
  }
  function dfsCollect(r, c, prefix, ids, visited, minLen, maxLen, hit) {
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return;
    var t = state.grid[r][c];
    if (visited[t.id]) return;
    visited[t.id] = true;
    var word = prefix + t.letter;
    var newIds = ids.concat([t.id]);
    if (word.length >= minLen && word.length <= maxLen) hit(word, newIds);
    if (word.length < maxLen) {
      var dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      for (var d = 0; d < dirs.length; d++) {
        dfsCollect(r + dirs[d][0], c + dirs[d][1], word, newIds, visited, minLen, maxLen, hit);
      }
    }
    visited[t.id] = false;
  }

  function renderPowerupTray() {
    if (!dom.powerupTray) return;
    var html = "";
    for (var i = 0; i < state.powerups.length; i++) {
      var p = state.powerups[i];
      var meta = POWERUP_META[p.type];
      html +=
        '<button type="button" class="powerup-slot" data-pidx="' + i + '" aria-label="Use ' + meta.label + '">' +
          '<span class="powerup-glyph" aria-hidden="true">' + meta.glyph + '</span>' +
          '<span class="powerup-meta">' +
            '<span class="powerup-name">' + meta.label + '</span>' +
            '<span class="powerup-key">' + meta.key + '</span>' +
          '</span>' +
        '</button>';
    }
    if (state.x2WordsLeft > 0) {
      html +=
        '<div class="powerup-slot is-active" aria-label="2x multiplier active">' +
          '<span class="powerup-glyph" aria-hidden="true">✨</span>' +
          '<span class="powerup-meta">' +
            '<span class="powerup-name">x2 ACTIVE</span>' +
            '<span class="powerup-key">' + state.x2WordsLeft + ' words</span>' +
          '</span>' +
        '</div>';
    }
    dom.powerupTray.innerHTML = html;
    var slots = dom.powerupTray.querySelectorAll("[data-pidx]");
    for (var s = 0; s < slots.length; s++) {
      (function (btn) {
        btn.addEventListener("click", function () {
          var idx = parseInt(btn.getAttribute("data-pidx"), 10);
          usePowerup(idx);
        });
      })(slots[s]);
    }
  }

  // -- Scholar question UI ---------------------------------------------------
  function findScholarEntryForWord(word) {
    // Match: prefer exact keyword match; fallback to keyword-as-prefix match.
    var w = word.toUpperCase();
    var entry = SCHOLAR_BANK.filter(function (b) { return b.keyword === w; })[0];
    if (entry) return entry;
    // Loose: keyword starts with the word, or the word starts with the keyword
    var loose = SCHOLAR_BANK.filter(function (b) {
      return b.keyword.indexOf(w) === 0 || w.indexOf(b.keyword) === 0;
    })[0];
    if (loose) return loose;
    // Otherwise random
    return SCHOLAR_BANK[Math.floor(Math.random() * SCHOLAR_BANK.length)];
  }
  function openScholarQuestion(word) {
    var entry = findScholarEntryForWord(word);
    if (!entry) {
      finishScholar(false);
      return;
    }
    state.scholarEntry = entry;
    prevPhase = phase;
    phase = "question";
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Tile · " + word;
    if (dom.questionPrompt) dom.questionPrompt.textContent = entry.prompt;
    if (dom.explanation) {
      dom.explanation.textContent = "";
      dom.explanation.classList.remove("is-correct", "is-wrong");
    }
    var html = "";
    var letters = ["A", "B", "C", "D"];
    var order = [0, 1, 2, 3];
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
    }
    var newCorrect = order.indexOf(entry.correctIndex);
    state.scholarChoiceOrder = order;
    state.scholarNewCorrect = newCorrect;
    for (var c = 0; c < order.length; c++) {
      var orig = order[c];
      html +=
        '<button type="button" class="choice-btn" data-cidx="' + c + '" data-orig="' + orig + '">' +
          '<span class="choice-letter">' + letters[c] + '</span>' +
          escapeHtml(entry.choices[orig]) +
        '</button>';
    }
    if (dom.choiceGrid) {
      dom.choiceGrid.innerHTML = html;
      var btns = dom.choiceGrid.querySelectorAll(".choice-btn");
      for (var b = 0; b < btns.length; b++) {
        (function (btn) {
          btn.addEventListener("click", function () {
            var cidx = parseInt(btn.getAttribute("data-cidx"), 10);
            answerScholar(cidx, btn);
          });
        })(btns[b]);
      }
    }
    if (dom.questionScreen) dom.questionScreen.classList.add("show");
    duckMusic();
  }
  function answerScholar(cidx, btn) {
    var entry = state.scholarEntry;
    if (!entry) return;
    var correct = (cidx === state.scholarNewCorrect);
    if (btn) btn.classList.add(correct ? "is-correct" : "is-wrong");
    if (!correct) {
      var btns = dom.choiceGrid.querySelectorAll(".choice-btn");
      for (var i = 0; i < btns.length; i++) {
        var ci = parseInt(btns[i].getAttribute("data-cidx"), 10);
        if (ci === state.scholarNewCorrect) btns[i].classList.add("is-correct");
      }
    }
    if (dom.explanation) {
      dom.explanation.textContent = entry.explanation;
      dom.explanation.classList.add(correct ? "is-correct" : "is-wrong");
    }
    if (correct) {
      state.score += SCHOLAR_REWARD_SCORE;
      state.roundScore += SCHOLAR_REWARD_SCORE;
      addShards(SCHOLAR_REWARD_SHARDS);
      state.scholarCorrect += 1;
      sfx.scholar_correct();
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 32, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopup("+" + SCHOLAR_REWARD_SCORE, LOGICAL_W / 2, 260, "is-tetris");
    } else {
      sfx.scholar_wrong();
    }
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordAnswer) {
        window.MrMacsProfile.recordAnswer({
          course: "All Courses",
          set: "boggle-beat-scholar",
          gameId: GAME_ID,
          correct: correct,
          prompt: entry.prompt,
          answer: entry.choices[entry.correctIndex]
        });
      }
    } catch (e) {}
    setTimeout(function () { finishScholar(correct); }, 1400);
  }
  function skipScholar() {
    if (phase !== "question") return;
    finishScholar(false);
  }
  function finishScholar(correct) {
    if (dom.questionScreen) dom.questionScreen.classList.remove("show");
    state.scholarEntry = null;
    state.pendingScholarKeyword = null;
    restoreMusic();
    phase = prevPhase || "playing";
    prevPhase = null;
    // Replace the scholar tile with a fresh one (move to a new random non-selected tile)
    if (state.grid) {
      // Clear current scholar
      for (var r = 0; r < GRID_SIZE; r++) {
        for (var c = 0; c < GRID_SIZE; c++) {
          state.grid[r][c].scholar = false;
        }
      }
      placeScholarTile(state.grid);
    }
    updateHud();
    updateRibbon();
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // -- recordAnswer hook -----------------------------------------------------
  function recordAnswerHook(correct, word) {
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordAnswer) {
        window.MrMacsProfile.recordAnswer({
          course: "All Courses",
          set: "boggle-beat",
          gameId: GAME_ID,
          correct: !!correct,
          prompt: "Find a word",
          answer: word || ""
        });
      }
    } catch (e) {}
  }

  // -- Particles / popups ----------------------------------------------------
  function burstAt(x, y, color, count) {
    if (reducedMotion) return;
    if (!state) return;
    count = count || 8;
    color = color || "#f5c451";
    for (var i = 0; i < count; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 80 + Math.random() * 180;
      state.particles.push({
        x: x, y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 60,
        life: 0.6 + Math.random() * 0.6,
        totalLife: 0.6 + Math.random() * 0.6,
        size: 2 + Math.random() * 3,
        color: color,
        gravity: 220
      });
    }
  }
  function pushPopup(text, x, y, cls) {
    if (!dom.popupOverlay) return;
    var div = document.createElement("div");
    div.className = "popup-text " + (cls || "");
    div.textContent = text;
    div.style.left = ((x / LOGICAL_W) * 100) + "%";
    div.style.top = ((y / LOGICAL_H) * 100) + "%";
    dom.popupOverlay.appendChild(div);
    setTimeout(function () { try { div.remove(); } catch (e) {} }, 1200);
  }

  // -- HUD / ribbon ----------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = String(state.score);
    if (dom.hudRound) dom.hudRound.textContent = state.round + "/" + TOTAL_ROUNDS;
    if (dom.hudWords) dom.hudWords.textContent = String(state.roundWords.length);
    if (dom.hudBest) dom.hudBest.textContent = String(state.best);
    if (dom.hudMult) {
      var totalMult = state.x2WordsLeft > 0 ? 2 : 1;
      dom.hudMult.textContent = totalMult + "x";
      dom.hudMult.parentElement.classList.toggle("is-mult", totalMult === 2);
      dom.hudMult.parentElement.classList.remove("is-mult-big");
    }
    if (dom.hudTimer) {
      var t = Math.max(0, state.roundTime);
      dom.hudTimer.textContent = t.toFixed(t < 10 ? 1 : 0);
      var cell = dom.hudTimerCell;
      if (cell) {
        cell.classList.toggle("is-warning", t > 5 && t <= TIME_WARN_THRESHOLD);
        cell.classList.toggle("is-danger", t <= 5);
      }
    }
  }
  function updateRibbon() {
    if (!state) return;
    if (dom.goalName) {
      dom.goalName.textContent = "Forge themed terms · 90s";
    }
    if (dom.goalMeta) {
      dom.goalMeta.textContent =
        "Round " + state.round + "/" + TOTAL_ROUNDS +
        " · Powerups " + state.powerups.length +
        (state.x2WordsLeft > 0 ? " · x2 " + state.x2WordsLeft : "");
    }
  }

  // -- Drawing ---------------------------------------------------------------
  function resizeCanvas() {
    var rect = canvas.getBoundingClientRect();
    dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));

    // ---- Smart play-area scaling (May 10 2026) ----
    // Previously: scale = min(rect.width/720, rect.height/720). On wide
    // screens this made the grid hug the LOGICAL viewport (480×512 logical
    // → small render). On portrait, vertical overscan wasted space.
    //
    // Now: compute the actual visible play area (canvas size minus the
    // chrome zones that the CSS layout reserves for HUD / wave-ribbon /
    // word-readout / powerup-tray) and scale the GRID itself to fill 92%
    // of the smaller available dimension. Then translate so the GRID
    // CENTER lands at the play-area center. Background banner + popups
    // ride along on the same offset/scale and naturally land where they
    // visually belong.
    var w = window.innerWidth;
    var h = window.innerHeight;
    var chromeTop, chromeBottom;
    var isLandscapePhone = h < 480 && w >= 600;
    var isMobilePortrait = w <= 720 && h > w;
    if (isLandscapePhone) {
      // Short viewport (landscape phone): HUD compacts, no wrap, no ribbon.
      chromeTop = 70;
      chromeBottom = 4;
    } else if (isMobilePortrait) {
      // iPhone portrait — Jon: "board too small". Compress chrome reservation
      // aggressively so the grid uses as much real estate as possible. The
      // HUD overlays the canvas with a translucent backdrop anyway, so
      // overlapping slightly into the chrome zone is FINE — the grid lands
      // visually below the HUD because of where targetCy puts it.
      chromeTop = 130;
      chromeBottom = 30;
    } else if (w <= 1100) {
      // Tablet portrait / small landscape
      chromeTop = 170;
      chromeBottom = 50;
    } else {
      // Desktop / wide
      chromeTop = 170;
      chromeBottom = 0;
    }

    var availW = Math.max(1, rect.width);
    var availH = Math.max(120, rect.height - chromeTop - chromeBottom);
    // On iPhone portrait: prioritize WIDTH — students need big tap targets.
    // The grid fits 100% of available width (was 96%). Tall iPhones get a
    // proportionally-tall grid since min(availW, availH) is almost always
    // availW on portrait phones (390x844: availW=390, availH=684 → 390 wins).
    var fitFactor = isMobilePortrait ? 1.00 : 0.96;
    var maxGridPx = Math.min(availW, availH) * fitFactor;
    scale = maxGridPx / GRID_W;

    // GRID center in logical coords
    var gridCxL = LOGICAL_W / 2;            // GRID is centered in LOGICAL_W
    var gridCyL = GRID_TOP + GRID_H / 2;
    // Target GRID center in canvas pixels
    var targetCx = rect.width / 2;
    var targetCy = chromeTop + availH / 2;
    // Solve: targetC = offset + gridCL * scale  →  offset = targetC - gridCL * scale
    offsetX = targetCx - gridCxL * scale;
    offsetY = targetCy - gridCyL * scale;
  }
  function drawBackground() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var w = canvas.width / dpr, h = canvas.height / dpr;
    var grad = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
    grad.addColorStop(0, "#0e1a30");
    grad.addColorStop(0.6, "#08101e");
    grad.addColorStop(1, "#04060f");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    if (state && state.bgStars) {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      for (var i = 0; i < state.bgStars.length; i++) {
        var s = state.bgStars[i];
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        var tw = 0.55 + 0.45 * Math.sin(state.time * s.twinkleSpeed + s.twinkle);
        ctx.fillStyle = "rgba(245,196,81," + (0.18 * tw).toFixed(3) + ")";
        ctx.fill();
      }
      ctx.restore();
    }
  }
  function tileXY(row, col) {
    return {
      x: GRID_LEFT + col * (TILE_SIZE + TILE_GAP),
      y: GRID_TOP + row * (TILE_SIZE + TILE_GAP)
    };
  }
  function drawTile(tile, opts) {
    opts = opts || {};
    var pos = tileXY(tile.row, tile.col);
    var x = pos.x, y = pos.y;
    var w = TILE_SIZE, h = TILE_SIZE;
    var selected = opts.selected;
    var scholar = tile.scholar;
    var revealHi = opts.revealHi;
    var flash = opts.flash;
    // Apply screen-shake offset
    if (state.shake.life > 0 && !reducedMotion) {
      x += state.shake.x;
      y += state.shake.y;
    }
    // Drop shadow
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x + 3, y + 4, w, h);
    // Parchment fragment gradient
    var grad = ctx.createLinearGradient(x, y, x, y + h);
    if (selected) {
      grad.addColorStop(0, "#a8edcb");
      grad.addColorStop(0.5, "#5fcb96");
      grad.addColorStop(1, "#2c8b62");
    } else if (scholar) {
      grad.addColorStop(0, "#fbe09a");
      grad.addColorStop(0.5, "#e6b738");
      grad.addColorStop(1, "#a8821c");
    } else {
      grad.addColorStop(0, "#ecd9b1");
      grad.addColorStop(0.5, "#d2b986");
      grad.addColorStop(1, "#a8895c");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    // Speckles / ink wash
    ctx.save();
    ctx.fillStyle = "rgba(60, 38, 12, 0.18)";
    var seed = (tile.id * 7919) % 9973;
    for (var s = 0; s < 8; s++) {
      seed = (seed * 1103515245 + 12345) % 2147483647;
      var sx = x + 6 + (seed % (w - 12));
      seed = (seed * 1103515245 + 12345) % 2147483647;
      var sy = y + 6 + (seed % (h - 12));
      ctx.beginPath();
      ctx.arc(sx, sy, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // Top highlight
    var hi = ctx.createLinearGradient(x, y, x, y + 12);
    hi.addColorStop(0, "rgba(255,255,255,0.45)");
    hi.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hi;
    ctx.fillRect(x + 1, y + 1, w - 2, 12);
    // Border
    ctx.strokeStyle = scholar ? "#f5c451" : (selected ? "#4dd49b" : "#7a4f23");
    ctx.lineWidth = scholar ? 2.4 : (selected ? 2.4 : 1.5);
    ctx.strokeRect(x, y, w, h);
    if (scholar) {
      ctx.save();
      ctx.shadowColor = "rgba(245,196,81,0.7)";
      ctx.shadowBlur = 18;
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }
    if (selected) {
      ctx.save();
      ctx.shadowColor = "rgba(77,212,155,0.7)";
      ctx.shadowBlur = 14;
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }
    if (revealHi) {
      ctx.save();
      var pulse = 0.5 + 0.5 * Math.sin(state.time * 3);
      ctx.strokeStyle = "rgba(93,224,240," + (0.5 + 0.4 * pulse).toFixed(2) + ")";
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
      ctx.shadowColor = "#5de0f0";
      ctx.shadowBlur = 22;
      ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
      ctx.restore();
    }
    if (flash) {
      ctx.save();
      var alpha = (flash.life / flash.totalLife) * 0.55;
      ctx.fillStyle = flash.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    // Letter
    ctx.fillStyle = "#2a1c0a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var fontSize = Math.round(w * 0.50);
    ctx.font = "900 " + fontSize + "px Fraunces, serif";
    ctx.fillText(tile.letter, x + w / 2, y + h / 2 + 4);
    // Selection order index
    if (selected && opts.orderIdx != null) {
      ctx.fillStyle = "rgba(15, 70, 50, 0.85)";
      ctx.font = "800 14px JetBrains Mono, monospace";
      ctx.fillText(String(opts.orderIdx + 1), x + w - 12, y + 12);
    }
    // Scholar mark
    if (scholar) {
      ctx.fillStyle = "rgba(120, 84, 18, 0.85)";
      ctx.font = "800 12px JetBrains Mono, monospace";
      ctx.fillText("◈", x + 12, y + 12);
    }
  }
  function drawSelectionLine() {
    if (!state || state.selectedIds.length < 2) return;
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    if (state.shake.life > 0 && !reducedMotion) {
      ctx.translate(state.shake.x, state.shake.y);
    }
    ctx.strokeStyle = "rgba(245,196,81,0.85)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(245,196,81,0.7)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    for (var i = 0; i < state.selectedIds.length; i++) {
      var t = tileById(state.selectedIds[i]);
      if (!t) continue;
      var pos = tileXY(t.row, t.col);
      var cx = pos.x + TILE_SIZE / 2;
      var cy = pos.y + TILE_SIZE / 2;
      if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Dots at each node
    for (var k = 0; k < state.selectedIds.length; k++) {
      var tt = tileById(state.selectedIds[k]);
      if (!tt) continue;
      var p = tileXY(tt.row, tt.col);
      ctx.beginPath();
      ctx.arc(p.x + TILE_SIZE / 2, p.y + TILE_SIZE / 2, 7, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(245,196,81,0.95)";
      ctx.fill();
    }
    ctx.restore();
  }
  function drawGrid() {
    if (!state || !state.grid) return;
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    // Subtle grid backplate
    ctx.fillStyle = "rgba(8,14,28,0.55)";
    ctx.fillRect(GRID_LEFT - 14, GRID_TOP - 14, GRID_W + 28, GRID_H + 28);
    ctx.strokeStyle = "rgba(245,196,81,0.18)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(GRID_LEFT - 14, GRID_TOP - 14, GRID_W + 28, GRID_H + 28);
    // Tile loop
    var revealIds = (state.revealHighlight && state.revealHighlight.life > 0) ? state.revealHighlight.ids : [];
    var flash = (state.flashTiles && state.flashTiles.life > 0) ? state.flashTiles : null;
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        var tile = state.grid[r][c];
        var selectedIdx = state.selectedIds.indexOf(tile.id);
        var isRevealHi = revealIds.indexOf(tile.id) >= 0;
        var tileFlash = flash && flash.ids.indexOf(tile.id) >= 0 ? flash : null;
        drawTile(tile, {
          selected: selectedIdx >= 0,
          orderIdx: selectedIdx,
          revealHi: isRevealHi,
          flash: tileFlash
        });
      }
    }
    ctx.restore();
  }
  function drawTitleHeader() {
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    // Top banner: round / clock area visual
    var bannerY = 130;
    var bw = 360, bh = 36;
    var bx = (LOGICAL_W - bw) / 2;
    drawScrollBanner(bx, bannerY, bw, bh, false);
    ctx.fillStyle = "#2a1c0a";
    ctx.font = "italic 700 14px Fraunces, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var label = "ROUND " + state.round + " · 90-SECOND HUNT";
    ctx.fillText(label, LOGICAL_W / 2, bannerY + bh / 2);
    ctx.restore();
  }
  function drawScrollBanner(x, y, w, h, gold) {
    var bodyX = x + 24, bodyY = y, bodyW = w - 48, bodyH = h;
    var grad = ctx.createLinearGradient(bodyX, bodyY, bodyX, bodyY + bodyH);
    grad.addColorStop(0, "#ecd9b1");
    grad.addColorStop(0.5, "#d2b986");
    grad.addColorStop(1, "#b89762");
    ctx.fillStyle = grad;
    ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
    ctx.fillStyle = gold ? "#c8922a" : "#a96e3d";
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(bodyX, y); ctx.lineTo(bodyX, y + bodyH); ctx.lineTo(x, y + bodyH);
    ctx.lineTo(x + 12, y + bodyH / 2); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w, y); ctx.lineTo(x + w - 24, y); ctx.lineTo(x + w - 24, y + bodyH); ctx.lineTo(x + w, y + bodyH);
    ctx.lineTo(x + w - 12, y + bodyH / 2); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = gold ? "#f5c451" : "#7a4f23";
    ctx.lineWidth = gold ? 2 : 1.4;
    ctx.strokeRect(bodyX, bodyY, bodyW, bodyH);
  }
  function drawParticles() {
    if (!state || reducedMotion) return;
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      var alpha = Math.max(0, p.life / p.totalLife);
      var col = p.color || "#f5c451";
      // strip leading # if present and alpha-tint via globalAlpha
      ctx.globalAlpha = alpha;
      ctx.fillStyle = col;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // -- Main loop -------------------------------------------------------------
  function frame(ts) {
    rafHandle = requestAnimationFrame(frame);
    if (!state) return;
    var dt = lastFrame ? Math.min(0.05, (ts - lastFrame) / 1000) : 0.016;
    lastFrame = ts;
    // Freeze world clock while paused, in scholar question, or in setup/end modal —
    // this stops the round timer, particles, reveal highlight, flash, and shake.
    var worldActive = (phase === "playing" && !state.timeoutTriggered);
    if (worldActive) {
      state.time += dt;
      state.roundTime -= dt;
      // Time-low warning ping
      if (state.roundTime <= 5 && Math.floor(state.roundTime) !== state.lastTimeWarn) {
        state.lastTimeWarn = Math.floor(state.roundTime);
        if (state.lastTimeWarn >= 0 && state.roundTime > 0) sfx.time_low_warn();
      }
      if (state.roundTime <= 0) {
        state.roundTime = 0;
        endRound();
      }
    }
    if (worldActive) {
      // Particles
      if (state.particles && state.particles.length) {
        var alive = [];
        for (var i = 0; i < state.particles.length; i++) {
          var p = state.particles[i];
          p.life -= dt;
          if (p.life <= 0) continue;
          p.vy += p.gravity * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          alive.push(p);
        }
        state.particles = alive;
      }
      // Reveal highlight decay
      if (state.revealHighlight && state.revealHighlight.life > 0) {
        state.revealHighlight.life -= dt;
        if (state.revealHighlight.life <= 0) state.revealHighlight = null;
      }
      // Flash tiles decay
      if (state.flashTiles && state.flashTiles.life > 0) {
        state.flashTiles.life -= dt;
        if (state.flashTiles.life <= 0) state.flashTiles = null;
      }
      // Shake decay
      if (state.shake.life > 0) {
        state.shake.life -= dt;
        if (state.shake.life <= 0) {
          state.shake.x = 0; state.shake.y = 0; state.shake.intensity = 0; state.shake.life = 0;
        } else if (!reducedMotion) {
          var amp = state.shake.intensity * (state.shake.life / state.shake.totalLife);
          state.shake.x = (Math.random() - 0.5) * 2 * amp;
          state.shake.y = (Math.random() - 0.5) * 2 * amp;
        } else {
          state.shake.x = 0; state.shake.y = 0;
        }
      }
    }
    // HUD
    updateHud();
    // Render
    drawBackground();
    if (phase === "playing" || phase === "question" || phase === "paused") {
      drawTitleHeader();
      drawGrid();
      drawSelectionLine();
      drawParticles();
    }
  }

  // -- Background stars ------------------------------------------------------
  function makeBgStars(n) {
    var stars = [];
    for (var i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * LOGICAL_W,
        y: Math.random() * LOGICAL_H,
        r: 0.5 + Math.random() * 1.4,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.4 + Math.random() * 1.0
      });
    }
    return stars;
  }

  // -- Hub integration -------------------------------------------------------
  function addShards(n) {
    if (n <= 0) return;
    var capped = Math.max(0, Math.min(n, SHARDS_CAP - state.shardsAwarded));
    if (capped <= 0) return;
    state.shardsAwarded += capped;
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.addShards) {
        window.MrMacsProfile.addShards(capped, "boggle-beat-scholar-correct");
      }
    } catch (e) {}
  }
  function submitLeaderboard() {
    try {
      if (window.MrMacsLeaderboards && window.MrMacsLeaderboards.submit) {
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, {
          round: state.round,
          words: state.roundsResults.reduce(function (s, r) { return s + r.words; }, 0),
          scholars: state.scholarCorrect
        });
      }
    } catch (e) {}
  }
  function saveSnapshot() {
    if (!state || phase === "setup" || phase === "ended") return;
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.save) {
        window.MrMacsSessions.save(GAME_ID, {
          score: state.score,
          round: state.round,
          ts: Date.now()
        });
      }
    } catch (e) {}
  }
  function loadSnapshot() {
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.load) {
        return window.MrMacsSessions.load(GAME_ID);
      }
    } catch (e) {}
    return null;
  }
  function clearSnapshot() {
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.clear) {
        window.MrMacsSessions.clear(GAME_ID);
      }
    } catch (e) {}
  }
  function recordPlayWithProfile() {
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordPlay) {
        window.MrMacsProfile.recordPlay({
          gameId: GAME_ID,
          score: state.score,
          durationMs: performance.now() - startTimeMs,
          level: state.round
        });
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("boggle-beat:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("boggle-beat:best", String(Math.floor(v)));
    } catch (e) {}
  }

  // -- Music -----------------------------------------------------------------
  function startMusic() {
    if (!soundOn) return;
    try {
      if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start) {
        window.MrMacsArcadeMusic.start("cold-war-mission", { volume: 0.5 });
      }
    } catch (e) {}
  }
  function duckMusic() {
    try { if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.duck) window.MrMacsArcadeMusic.duck(0.1, 200); } catch (e) {}
  }
  function restoreMusic() {
    try { if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.restore) window.MrMacsArcadeMusic.restore(200); } catch (e) {}
  }
  function stopMusic() {
    try { if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.stop) window.MrMacsArcadeMusic.stop(); } catch (e) {}
  }

  // -- Pause -----------------------------------------------------------------
  function togglePause() {
    if (phase === "playing") {
      prevPhase = phase;
      phase = "paused";
      if (dom.pauseScreen) dom.pauseScreen.classList.add("show");
    renderPauseProgress();
      duckMusic();
    } else if (phase === "paused") {
      phase = prevPhase || "playing";
      prevPhase = null;
      if (dom.pauseScreen) dom.pauseScreen.classList.remove("show");
      restoreMusic();
    }
  }

  // -- Input handling --------------------------------------------------------
  function canvasToLogical(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    var x = (clientX - rect.left - offsetX) / scale;
    var y = (clientY - rect.top - offsetY) / scale;
    return { x: x, y: y };
  }
  function tileAt(lx, ly) {
    if (!state || !state.grid) return null;
    if (lx < GRID_LEFT || lx > GRID_LEFT + GRID_W) return null;
    if (ly < GRID_TOP || ly > GRID_TOP + GRID_H) return null;
    var col = Math.floor((lx - GRID_LEFT) / (TILE_SIZE + TILE_GAP));
    var row = Math.floor((ly - GRID_TOP) / (TILE_SIZE + TILE_GAP));
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
    // Reject if click landed in inter-tile gap
    var localX = lx - (GRID_LEFT + col * (TILE_SIZE + TILE_GAP));
    var localY = ly - (GRID_TOP + row * (TILE_SIZE + TILE_GAP));
    if (localX < 0 || localX > TILE_SIZE || localY < 0 || localY > TILE_SIZE) return null;
    return state.grid[row][col];
  }
  function bindInput() {
    var pointerActive = false;
    function onPointerDown(e) {
      if (phase !== "playing") return;
      var clientX = e.clientX != null ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      var clientY = e.clientY != null ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      var p = canvasToLogical(clientX, clientY);
      var tile = tileAt(p.x, p.y);
      if (!tile) {
        // Tap outside grid: clear if had selection, else nothing
        if (state.selectedIds.length > 0) clearSelection();
        return;
      }
      pointerActive = true;
      state.selecting = true;
      // Start fresh selection on this tile
      state.selectedIds = [];
      state.currentWord = "";
      tryAppendTile(tile.id);
      e.preventDefault();
    }
    function onPointerMove(e) {
      if (!pointerActive || phase !== "playing") return;
      var clientX = e.clientX != null ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      var clientY = e.clientY != null ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      var p = canvasToLogical(clientX, clientY);
      var tile = tileAt(p.x, p.y);
      if (!tile) return;
      tryAppendTile(tile.id);
      e.preventDefault();
    }
    function onPointerUp(e) {
      if (!pointerActive) return;
      pointerActive = false;
      state.selecting = false;
      if (phase !== "playing") return;
      // Submit on release if word is non-empty
      if (state.selectedIds.length > 0) {
        submitWord();
      }
    }
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("touchstart", function (e) { e.preventDefault(); }, { passive: false });
    canvas.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });

    // Keyboard
    document.addEventListener("keydown", function (e) {
      // Scholar modal: allow Esc to close, swallow other keys to keep game shortcuts inert.
      if (phase === "question") {
        if (e.key === "Escape") {
          skipScholar();
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }
      if (e.key === "Enter") {
        if (phase === "playing" && state && state.selectedIds.length > 0) {
          submitWord();
        }
        // Always preventDefault while in-game so Enter doesn't activate focused buttons.
        if (phase === "playing" || phase === "paused") e.preventDefault();
      } else if (e.key === "Escape") {
        if (phase === "playing" && state && state.selectedIds.length > 0) {
          clearSelection();
        } else if (phase === "paused") {
          togglePause();
        }
        if (phase === "playing" || phase === "paused") e.preventDefault();
      } else if (e.key === "p" || e.key === "P") {
        if (phase === "playing" || phase === "paused") {
          togglePause();
          e.preventDefault();
        }
      } else if (phase === "playing" && /^[1-5]$/.test(e.key)) {
        var n = parseInt(e.key, 10);
        var type = POWERUP_TYPES[n - 1];
        usePowerup(type);
        e.preventDefault();
      }
    });
  }

  // -- UI bindings -----------------------------------------------------------
  function bindUI() {
    if (dom.startBtn) dom.startBtn.addEventListener("click", function () { startGame(); });
    if (dom.againBtn) dom.againBtn.addEventListener("click", function () {
      if (dom.endScreen) dom.endScreen.classList.remove("show");
      startGame();
      recordPlayWithProfile();
    });
    if (dom.setupBtn) dom.setupBtn.addEventListener("click", function () {
      if (dom.endScreen) dom.endScreen.classList.remove("show");
      if (dom.setupScreen) dom.setupScreen.classList.add("show");
      phase = "setup";
      stopMusic();
    });
    if (dom.resumeBtn) dom.resumeBtn.addEventListener("click", function () { togglePause(); });
    if (dom.restartBtn) dom.restartBtn.addEventListener("click", function () {
      if (dom.pauseScreen) dom.pauseScreen.classList.remove("show");
      clearSnapshot();
      startGame();
    });
    if (dom.pauseExitBtn) dom.pauseExitBtn.addEventListener("click", function () {
      window.location.href = "../../index.html";
    });
    if (dom.exitBtn) dom.exitBtn.addEventListener("click", function () {
      window.location.href = "../../index.html";
    });
    if (dom.pauseBtn) dom.pauseBtn.addEventListener("click", function () { togglePause(); });
    if (dom.soundBtn) dom.soundBtn.addEventListener("click", function () {
      soundOn = !soundOn;
      dom.soundBtn.textContent = soundOn ? "Sound On" : "Sound Off";
      if (!soundOn) stopMusic();
      else if (phase === "playing") startMusic();
    });
    if (dom.fullscreenBtn) dom.fullscreenBtn.addEventListener("click", function () {
      try {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      } catch (e) {}
    });
    if (dom.submitBtn) dom.submitBtn.addEventListener("click", function () {
      if (phase === "playing" && state.selectedIds.length > 0) submitWord();
    });
    if (dom.clearBtn) dom.clearBtn.addEventListener("click", function () {
      if (phase === "playing") clearSelection();
    });
    if (dom.questionCloseBtn) dom.questionCloseBtn.addEventListener("click", skipScholar);
    // Resume card
    var snap = loadSnapshot();
    if (snap && dom.resumeCard) {
      var ago = Math.floor((Date.now() - (snap.ts || Date.now())) / 60000);
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume saved run?</div>' +
        '<div class="resume-card-meta">Score ' + (snap.score || 0) + ' · round ' + (snap.round || 1) + ' · ' + ago + ' min ago</div>' +
        '<div class="resume-actions">' +
        '<button class="btn glass-pill" id="resumeRunBtn" type="button">Resume</button>' +
        '<button class="btn glass-pill" id="discardRunBtn" type="button">Discard</button>' +
        '</div>';
      dom.resumeCard.hidden = false;
      var rRun = $("resumeRunBtn");
      var dRun = $("discardRunBtn");
      if (rRun) rRun.addEventListener("click", function () {
        startGame({ score: snap.score || 0, round: snap.round || 1 });
      });
      if (dRun) dRun.addEventListener("click", function () {
        clearSnapshot();
        dom.resumeCard.hidden = true;
      });
    }
  }

  // -- Boot ------------------------------------------------------------------
  function boot() {
    setupDom();
    bindUI();
    bindInput();
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    initState();
    state.grid = null;
    if (dom.hudBest) dom.hudBest.textContent = String(state.best);
    rafHandle = requestAnimationFrame(frame);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) saveSnapshot();
    });
    window.addEventListener("beforeunload", function () { saveSnapshot(); });
  
  
  // ── Difficulty selector ────────────────────────────────────────
  try {
    if (window.MrMacsDifficulty) {
      MrMacsDifficulty.register("boggle-beat");
      var _diffSetupCard = document.querySelector("#setupScreen .setup-card");
      if (_diffSetupCard) {
        var _diffHost = document.createElement("div");
        _diffHost.className = "difficulty-host";
        _diffHost.style.cssText = "margin: 12px 0 6px;";
        var _diffActions = _diffSetupCard.querySelector(".setup-actions");
        if (_diffActions) _diffSetupCard.insertBefore(_diffHost, _diffActions);
        else _diffSetupCard.appendChild(_diffHost);
        MrMacsDifficulty.mountSelector(_diffHost, "boggle-beat", { compact: false });
      }
    }
  } catch (e) {}


  // ── Sound toggle live label ────────────────────────────────
  try {
    var _soundBtn = document.getElementById("soundBtn");
    if (_soundBtn && window.MrMacsProfile && window.MrMacsProfile.getSettings) {
      var _snd = MrMacsProfile.getSettings().sound;
      _soundBtn.textContent = (_snd === "off") ? "Sound Off" : "Sound On";
    }
  } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  try {
    if (window.MrMacsA11yQuickToggle) {
      var hudControls = document.querySelector(".hud-controls") || document.querySelector(".top-hud");
      if (hudControls) MrMacsA11yQuickToggle.mount(hudControls);
    }
  } catch (e) {}

  // ── Help overlay ───────────────────────────────────────────────────────────
  try {
    if (window.MrMacsHelpOverlay) {
      MrMacsHelpOverlay.register("boggle-beat", {
        title: "How to Play Boggle Beat",
        goal: "Drag adjacent letter tiles to forge real words on a 5×5 grid within 90 seconds — score above 1,000 per round to keep the table open.",
        controls: [
          { key: "Click-drag  or  touch-drag", action: "Chain adjacent tiles to build a word" },
          { key: "Release", action: "Submit word" },
          { key: "Esc / P", action: "Pause" }
        ],
        tips: [
          "Tiles connect in any direction — up, down, sideways, or diagonal.",
          "History, science, civics, and geography terms earn a curated vocabulary bonus on top of the base word score.",
          "Longer words score exponentially more — aim for 5+ letter words when possible.",
          "You must stay above 1,000 points per round; three rounds total.",
          "Locking a gilt Scholar Tile into any valid word triggers the review prompt."
        ],
        scholar: "One Scholar Tile with a gilt rim appears each round. Chain it into any valid word to trigger a paired review prompt worth bonus shards — the clock pauses while you answer."
      });
      var setupActions = document.querySelector("#setupScreen .setup-actions");
      if (setupActions) MrMacsHelpOverlay.mountButton(setupActions, "boggle-beat");
    }
  } catch (e) {}

  })();


function renderPauseProgress() {
  try {
    if (!window.MrMacsProfile || !MrMacsProfile.listAchievements) return;
    var ach = MrMacsProfile.listAchievements();
    var GAME_ID_LOCAL = "boggle-beat";
    var candidates = ach.filter(function(a) {
      if (a.unlocked) return false;
      return a.id.indexOf(GAME_ID_LOCAL) !== -1 || a.id.indexOf("cross-") === 0;
    });
    if (!candidates.length) return;
    var pick = candidates[0];
    var el = document.getElementById("pauseProgress");
    var title = document.getElementById("pauseProgressTitle");
    var meta = document.getElementById("pauseProgressMeta");
    var fill = document.getElementById("pauseProgressFill");
    if (!el || !title || !meta || !fill) return;
    title.textContent = pick.def.title || pick.id;
    meta.textContent = pick.def.desc || "";
    var pct = 0;
    if (window.MrMacsProfile.computeAchievementProgress) {
      var p = MrMacsProfile.computeAchievementProgress(pick.def, MrMacsProfile.get());
      if (p && p.target) pct = Math.min(100, (p.current / p.target) * 100);
    }
    fill.style.width = pct + "%";
    el.hidden = false;
  } catch (e) {}
}
