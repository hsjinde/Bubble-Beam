import type { Deck, Tier } from "./types";

const decks: Deck[] = [
  {
    id: "miraidon-magnezone",
    name: "密勒頓ex 自爆磁怪",
    tier: "S",
    energy: ["Lightning"],
    difficulty: "中",
    summary: "當前使用率第一的雷系速攻：密勒頓ex 前期搶攻，自爆磁怪線接手當後期重砲。",
    cards: [
      { id: "B3a-19", count: 2 }, // Miraidon ex
      { id: "A3a-21", count: 2 }, // Zeraora
      { id: "B1a-24", count: 2 }, // Magnemite
      { id: "A1-98", count: 2 }, // Magneton
      { id: "B1a-26", count: 1 }, // Magnezone
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "B3a-73", count: 1 }, // Professor Turo
      { id: "B1-225", count: 1 }, // Copycat
      { id: "A2-150", count: 1 }, // Cyrus
      { id: "B1-226", count: 1 }, // Lisia
      { id: "B1a-68", count: 1 }, // Clemont
      { id: "A1-225", count: 1 }, // Sabrina
      { id: "PROMO-A-5", count: 2 }, // Poké Ball
      { id: "A2-147", count: 1 }, // Giant Cape
    ],
    strategy: [
      "核心思路：這套牌是目前賽場使用率最高的牌組（約 10%）。遊戲計畫分兩段——前期用密勒頓ex 與捷拉奧拉快速施壓、搶下第一分；中後期把小磁怪一路進化到自爆磁怪，接手當主要輸出。兩條攻擊線讓對手很難一次處理完。",
      "展開順序：起手優先找到密勒頓ex 上場搶節奏，同時把小磁怪鋪在備戰區慢慢養。手牌用博士的研究、精靈球盡快過濾，確保進化線不斷。自爆磁怪立起來之前，別讓密勒頓ex 孤軍深入被圍毆——必要時讓捷拉奧拉頂一手。",
      "注意事項：",
      "- 巨大披風掛在主攻手上多 20 HP，常常讓對手需要多打一回合，價值極高。",
      "- 赤日博士（Professor Turo）與希嘉娜（Lisia）是資源回收與檢索的潤滑劑，用之前想清楚這回合真正缺什麼。",
      "- 娜姿（Sabrina）和阿卡蒂亞（Cyrus）是收頭工具：把對手殘血的寶可夢拉出來處理，別浪費在沒有擊殺的回合。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "水君ex 戟脊龍",
        note: "有利。水系弱雷，密勒頓ex 與自爆磁怪都能打出弱點傷害，速度也比對方快——趁對方戟脊龍還沒供能完成前搶分。",
      },
      {
        vs: "Mega路卡利歐ex",
        note: "不利。雷系弱格鬥，Mega路卡利歐ex 打你全隊都是弱點傷害。盡量用娜姿／阿卡蒂亞打亂對方節奏，並考慮讓捷拉奧拉當肉盾拖時間。",
      },
      {
        vs: "甲賀忍蛙 Mega勾魂眼ex",
        note: "五五開。對方靠特性每回合削血，你的血線會一直被磨——巨大披風放在關鍵攻擊手上，並在對方 Mega勾魂眼ex 成型前盡快搶分。",
      },
    ],
  },
  {
    id: "suicune-baxcalibur",
    name: "水君ex 戟脊龍",
    tier: "S",
    energy: ["Water"],
    difficulty: "中",
    summary: "水系中速：戟脊龍供能引擎讓水君ex 與古劍豹ex 連發重擊。",
    cards: [
      { id: "B2a-34", count: 2 }, // Frigibax
      { id: "B2a-36", count: 2 }, // Baxcalibur
      { id: "A4a-20", count: 2 }, // Suicune ex
      { id: "B2a-37", count: 1 }, // Chien-Pao ex
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "B1-225", count: 2 }, // Copycat
      { id: "A2b-70", count: 1 }, // Pokémon Center Lady
      { id: "PROMO-A-5", count: 2 }, // Poké Ball
      { id: "A3-144", count: 2 }, // Rare Candy
      { id: "A2-147", count: 2 }, // Giant Cape
      { id: "A4a-67", count: 1 }, // Inflatable Boat
      { id: "B2-154", count: 1 }, // Starting Plains
    ],
    strategy: [
      "核心思路：典型的「引擎＋重砲」中速牌。戟脊龍是能量引擎，讓水系攻擊手的展開速度遠超正常節奏；水君ex 是穩定主砲，古劍豹ex 則是對付高 HP 目標的第二把刀。整體強度來自續航——對手處理完第一隻重砲，第二隻已經充能完畢。",
      "展開順序：涼脊龍第一回合就要落地，神奇糖果直上戟脊龍是最優先的資源分配。引擎成型前用水君ex 頂線並自然集能；成型後每回合都想「這回合誰吃能量、下回合誰上場」，保持兩隻攻擊手輪轉。",
      "注意事項：",
      "- 兩張巨大披風讓水君ex 的耐久進入「多扛一擊」的區間，搭配寶可夢中心的小姐回血可以打出很噁心的消耗戰。",
      "- 最大威脅是雷系（弱點）：對上密勒頓體系時，考慮讓非 ex 的戟脊龍多承擔頂線工作，減少送分。",
      "- 充氣小艇與開始的平原提供機動與場面支援，逆風時先想「怎麼活」再想「怎麼打」。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "密勒頓ex 自爆磁怪",
        note: "不利。水系弱雷，全隊都吃弱點傷害。盡量用回血＋披風拖長戰線，逼對方資源耗盡，並用非 ex 寶可夢當前排減少送分。",
      },
      {
        vs: "Mega路卡利歐ex",
        note: "有利。你的重砲射程蓋得住對方主力血線，且對方沒有弱點優勢；穩住引擎按部就班輪轉即可。",
      },
      {
        vs: "Mega蜥蜴王ex 甲賀忍蛙",
        note: "小幅不利。對方成型速度通常快半拍，又有手裏劍削你的引擎；優先保護涼脊龍／戟脊龍，引擎沒斷就有得打。",
      },
    ],
  },
  {
    id: "mega-blaziken-greninja",
    name: "Mega火焰雞ex 甲賀忍蛙",
    tier: "S",
    energy: ["Fire"],
    difficulty: "中",
    summary:
      "S級火系重砲：神奇糖果直上 Mega火焰雞ex 高傷害輸出，配合甲賀忍蛙飛水手裏劍遠程補刀削血。",
    cards: [
      { id: "B1-33", count: 2 }, // Torchic
      { id: "B1-34", count: 1 }, // Combusken
      { id: "B1-36", count: 1 }, // Mega Blaziken ex
      { id: "A1-87", count: 1 }, // Froakie
      { id: "A1-89", count: 1 }, // Greninja
      { id: "B3-24", count: 1 }, // Castform Sunny Form
      { id: "B1-44", count: 1 }, // Simisear
      { id: "B1-225", count: 2 }, // Copycat
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "A2-150", count: 1 }, // Cyrus
      { id: "B3a-71", count: 1 }, // Juliana
      { id: "A3-144", count: 2 }, // Rare Candy
      { id: "PROMO-A-5", count: 2 }, // Poké Ball
      { id: "B1-217", count: 1 }, // Flame Patch
      { id: "B2b-69", count: 1 }, // Hiking Trail
    ],
    strategy: [
      "核心思路：環境頂級火系爆發牌組。核心邏輯是利用神奇糖果讓火稚雞快速跳級進化至 Mega火焰雞ex（Mega Blaziken ex），提供極高單體爆發輸出；備戰區同時養甲賀忍蛙，利用特性「飛水手裏劍」每回合點傷 20，協助主砲輕鬆收割對手的高 HP 單位。搭配火焰貼紙（Flame Patch）與登山步道（Hiking Trail）能進一步確保火能源源不絕。",
      "展開順序：首回合優先起手火稚雞並集能，第二隻基礎寶可夢選擇呱呱泡蛙或飄浮泡泡。手上有神奇糖果時算好回合，迅速將主砲立起。前期可用飄浮泡泡進行過渡，待 Mega火焰雞ex 成型後即登場進行壓制。",
      "注意事項：",
      "- 飛水手裏劍的 20 點傷害極為關鍵，常能將敵方主力生命值削至 Mega火焰雞ex 的一擊必殺線。",
      "- 火焰貼紙需要棄牌區有火能量才能發動，適時利用博士的研究或複印手牌進行棄牌過濾。",
      "- 留意水系隊伍（如水君ex 戟脊龍）的弱點威脅，對上水系時需注意前場血線防護。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "水君ex 戟脊龍",
        note: "不利。火系弱水，對面水君ex 與古劍豹ex 打你都是弱點傷害。需把握對方戟脊龍成型前的空檔，靠糖果速成 Mega火焰雞ex 搶先擊殺對手關鍵單位。",
      },
      {
        vs: "密勒頓ex 自爆磁怪",
        note: "五五開。雙方都是高爆發體系，比拚誰的跳級或加速更快。利用甲賀忍蛙點傷配合主砲一擊打倒密勒頓ex 是勝負關鍵。",
      },
      {
        vs: "Mega蜥蜴王ex 甲賀忍蛙",
        note: "有利。草系弱火，Mega火焰雞ex 攻擊皆為弱點雙倍傷害，能輕鬆碾壓對手主砲。",
      },
    ],
  },
  {
    id: "mega-sceptile-greninja",
    name: "Mega蜥蜴王ex 甲賀忍蛙",
    tier: "A",
    energy: ["Grass"],
    difficulty: "中",
    summary: "勝率最高的草系牌組：神奇糖果直上 Mega蜥蜴王ex，甲賀忍蛙特性每回合補刀。",
    cards: [
      { id: "B3-5", count: 2 }, // Treecko
      { id: "B3-6", count: 1 }, // Grovyle
      { id: "B3-8", count: 1 }, // Mega Sceptile ex
      { id: "A1-87", count: 1 }, // Froakie
      { id: "A1-89", count: 1 }, // Greninja
      { id: "A3a-7", count: 1 }, // Pheromosa
      { id: "B3b-61", count: 1 }, // Furfrou
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "B1-225", count: 2 }, // Copycat
      { id: "A2-150", count: 1 }, // Cyrus
      { id: "B3a-71", count: 1 }, // Juliana
      { id: "PROMO-A-5", count: 2 }, // Poké Ball
      { id: "A3-144", count: 2 }, // Rare Candy
      { id: "B3b-64", count: 1 }, // Small Balloon
      { id: "A2-148", count: 1 }, // Rocky Helmet
    ],
    strategy: [
      "核心思路：目前勝率最高（約 52.8%）的牌組。主計畫是用神奇糖果讓木守宮直接跳級成 Mega蜥蜴王ex 當主砲；副計畫是呱呱泡蛙同樣走糖果路線立起甲賀忍蛙，靠特性「飛水手裏劍」每回合免費丟傷害，幫主砲把擊殺線壓進射程。",
      "展開順序：起手把木守宮鋪出來就開始集能，第二隻基礎寶可夢優先呱呱泡蛙。手上有神奇糖果時算好回合數：寧可慢一回合也不要把糖果浪費在不會被威脅的位置。費洛美螂與多麗米亞是前期頂線／機動補位的角色。",
      "注意事項：",
      "- 甲賀忍蛙的削血讓你能打「這回合 90、下回合手裏劍 20 收」這類算計，永遠先算好兩回合內的總傷害再決定目標。",
      "- 小氣球給重裝攻擊手機動性，撤退時機比多打一下更重要。",
      "- 岩石頭盔掛在頂線寶可夢上，讓對方小刀手互換不划算。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "甲賀忍蛙 Mega勾魂眼ex",
        note: "有利。惡系弱草，Mega蜥蜴王ex 對其主力全是弱點傷害，而且你的忍蛙互丟手裏劍不輸對方。",
      },
      {
        vs: "密勒頓ex 自爆磁怪",
        note: "五五開。比誰先立好主砲——用忍蛙的削血逼對方密勒頓ex 提早退場，別讓自爆磁怪安穩成型。",
      },
      {
        vs: "水君ex 戟脊龍",
        note: "小幅有利。對方供能需要時間，你的糖果路線通常更快；注意別讓古劍豹ex 抓到你集能中的空檔。",
      },
    ],
  },
  {
    id: "zoroark-mega-absol",
    name: "索羅亞克ex Mega阿勃梭魯ex",
    tier: "A",
    energy: ["Darkness"],
    difficulty: "難",
    summary:
      "惡系變幻打法：索羅亞克ex 特性複製對手攻勢，搭配 Mega阿勃梭魯ex 棄牌區破壞進行雙重撕裂。",
    cards: [
      { id: "B3-105", count: 2 }, // Zorua
      { id: "B3-106", count: 2 }, // Zoroark ex
      { id: "A2-110", count: 1 }, // Darkrai ex
      { id: "B1-151", count: 1 }, // Mega Absol ex
      { id: "B3-115", count: 1 }, // Bombirdier
      { id: "B3a-47", count: 1 }, // Dubwool
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "B1-225", count: 2 }, // Copycat
      { id: "A1-225", count: 1 }, // Sabrina
      { id: "A2-150", count: 1 }, // Cyrus
      { id: "A2b-70", count: 1 }, // Pokémon Center Lady
      { id: "PROMO-A-5", count: 2 }, // Poké Ball
      { id: "B3-147", count: 1 }, // Team Rocket's Harassment
      { id: "A2-148", count: 1 }, // Rocky Helmet
      { id: "A2-147", count: 1 }, // Giant Cape
    ],
    strategy: [
      "核心思路：極具彈性與干擾力的惡系戰術體系。索羅亞克ex 擁有借用與複製招式的靈活能力，能根據敵方前場寶可夢調整輸出；Mega阿勃梭魯ex 則能在高 HP 基礎上給予對手極大場面壓力，並干擾對手資源與手牌。配合毛毛角羊、達克萊伊ex 與毛球小鳥，能應對各種複雜對局。",
      "展開順序：開局優先鋪索羅亞，並快速集能。達克萊伊ex 或毛球小鳥可用於前期站場過渡。適時進化索羅亞克ex 與 Mega阿勃梭魯ex，並善用巨大披風或岩石頭盔增加前場換怪能力。",
      "注意事項：",
      "- 索羅亞克ex 的招式選擇極度依賴玩家對現行環境對手的了解，需精確計算傷害與附加效果。",
      "- 岩石頭盔與巨大披風的裝備對象需根據敵方主要攻擊手靈活調整。",
      "- 娜姿與赤日（Cyrus）是拉出對方後排殘血寶可夢進行收割的核心支援者。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "密勒頓ex 自爆磁怪",
        note: "五五開。對方爆發高但防守較為脆弱，善用索羅亞克ex 複製對方大招反打，並靠 Mega阿勃梭魯ex 撐住前場。",
      },
      {
        vs: "Mega路卡利歐ex",
        note: "不利。惡系弱格鬥，Mega路卡利歐ex 會打出弱點傷害。必須靠干擾牌與拉後排戰術避開正面對轟。",
      },
      {
        vs: "Mega七夕青鳥ex 太陽伊布",
        note: "小幅有利。惡系對超能系有良好壓制力，能快速打破對手的耐久防線。",
      },
    ],
  },
  {
    id: "mega-altaria-espeon",
    name: "Mega七夕青鳥ex 太陽伊布",
    tier: "A",
    energy: ["Psychic"],
    difficulty: "中",
    summary: "超能高耐久防守：Mega七夕青鳥ex 巨大 HP 搭配太陽伊布治癒與彈性戰術，反打後發制人。",
    cards: [
      { id: "B1-196", count: 2 }, // Swablu
      { id: "B1-102", count: 1 }, // Mega Altaria ex
      { id: "B1-184", count: 2 }, // Eevee
      { id: "B3a-20", count: 2 }, // Espeon
      { id: "B2b-40", count: 2 }, // Giratina ex
      { id: "A4a-59", count: 2 }, // Indeedee ex
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "A2-150", count: 1 }, // Cyrus
      { id: "B1-225", count: 1 }, // Copycat
      { id: "B1-226", count: 1 }, // Lisia
      { id: "A1-225", count: 1 }, // Sabrina
      { id: "PROMO-A-5", count: 2 }, // Poké Ball
      { id: "B2-153", count: 1 }, // Gym Building
    ],
    strategy: [
      "核心思路：以高血量與防守恢復為特色中速牌組。Mega七夕青鳥ex（Mega Altaria ex）擁有極佳的血量與穩定的攻擊面板，太陽伊布（Espeon）則提供強大的解場與支援能力。整套牌組擅長打消耗戰，讓對手無法在一回合內擊倒主砲，再透過高續航力逆轉局面。",
      "展開順序：開局先放置青綿鳥與伊布。透過博士的研究與精靈球迅速搜尋進化鏈，優先將七夕青鳥進化並加載能量。伊布可根據場面情況進化為太陽伊布協助減傷或輸出。",
      "注意事項：",
      "- 保持前場血線在健康狀態是這套牌的核心概念，善用伊布線與支援者進行戰術切換。",
      "- 機關大樓（Gym Building）等場地卡能為寶可夢提供血量與攻防優勢。",
      "- 需注意對手的極致單體爆發牌組（如 Mega火焰雞ex），避免主力尚未養好就被一擊帶走。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "索羅亞克ex Mega阿勃梭魯ex",
        note: "小幅不利。惡系對超能系造成弱點傷害，需靠 Mega七夕青鳥ex 的高血量與場地卡硬扛傷害。",
      },
      {
        vs: "水君ex 戟脊龍",
        note: "有利。對方中速消耗戰打不過七夕青鳥的高耐久與恢復，按部就班進攻即可穩定獲勝。",
      },
      {
        vs: "Mega路卡利歐ex",
        note: "五五開。雙方都是高面板對決，比拚誰的裝備道具與干擾牌使用時機更精準。",
      },
    ],
  },
  {
    id: "indeedee-giratina",
    name: "愛管侍ex 騎拉帝納ex",
    tier: "A",
    energy: ["Psychic"],
    difficulty: "中",
    summary:
      "超能加速控制：愛管侍ex 特性加速供能與恢復血量，養出騎拉帝納ex 毀滅級輸出爆發打爆戰線。",
    cards: [
      { id: "A3-66", count: 2 }, // Oricorio
      { id: "B1-121", count: 2 }, // Giratina ex
      { id: "A2b-35", count: 1 }, // Indeedee ex
      { id: "B1-225", count: 2 }, // Copycat
      { id: "A2b-70", count: 1 }, // Pokémon Center Lady
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "A2-150", count: 1 }, // Cyrus
      { id: "PROMO-A-5", count: 2 }, // Poké Ball
      { id: "B2-145", count: 2 }, // Lucky Ice Pop
      { id: "B2-147", count: 2 }, // Protective Poncho
      { id: "A2-147", count: 2 }, // Giant Cape
      { id: "B2-154", count: 1 }, // Starting Plains
    ],
    strategy: [
      "核心思路：愛管侍ex（Indeedee ex）作為超能系核心後勤與後排引擎，其特性可持續提供能量轉移與 HP 恢復；後排蓄勢待發的騎拉帝納ex（Giratina ex）則具備毀滅性的單體攻擊力。整套牌組在愛管侍ex 的保護與充能下，能以極高的穩定度進入高傷害輸出期。",
      "展開順序：起手確保愛管侍ex 或花舞鳥落地，利用花舞鳥與愛管侍ex 的特性累積能量與穩定手牌。備戰區鋪設騎拉帝納ex，當能量達標後換上騎拉帝納ex 進行毀滅打擊。",
      "注意事項：",
      "- 防護斗篷與巨大披風是保護愛管侍ex 與騎拉帝納ex 不被對方娜姿拉出秒殺的要卡。",
      "- 冰棒（Lucky Ice Pop）與寶可夢中心小姐能極大化愛管侍ex 的戰術恢復價值。",
      "- 起始平原提供撤退與機動性，靈活切換前場寶可夢。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "密勒頓ex 自爆磁怪",
        note: "五五開。對方速度極快，前期需靠愛管侍ex 的高 HP 與回血裝備撐過第一波，待騎拉帝納ex 滿能後即可扭轉局勢。",
      },
      {
        vs: "Mega蜥蜴王ex 甲賀忍蛙",
        note: "小幅有利。騎拉帝納ex 的傷害能直接擊穿蜥蜴王血線，且忍蛙的削血會被愛管侍ex 輕鬆抵消。",
      },
      {
        vs: "索羅亞克ex Mega阿勃梭魯ex",
        note: "不利。對方惡系弱點傷害極高，需儘快讓騎拉帝納ex 登場一擊必殺。",
      },
    ],
  },
  {
    id: "milotic-eevee-ex",
    name: "美納斯ex 伊布ex",
    tier: "A",
    energy: ["Water"],
    difficulty: "易",
    summary:
      "水系高機動控場：伊布ex 靈活抽牌與進化展開，美納斯ex 封鎖對方道具與特定招式，掌控對局主導權。",
    cards: [
      { id: "A4a-21", count: 2 }, // Feebas
      { id: "B3b-15", count: 2 }, // Milotic ex
      { id: "B2a-37", count: 1 }, // Chien-Pao ex
      { id: "A1a-19", count: 1 }, // Vaporeon
      { id: "A3b-56", count: 1 }, // Eevee ex
      { id: "B3b-68", count: 2 }, // Wallace
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "B1-225", count: 2 }, // Copycat
      { id: "A2b-70", count: 1 }, // Pokémon Center Lady
      { id: "PROMO-A-5", count: 2 }, // Poké Ball
      { id: "B3-147", count: 1 }, // Team Rocket's Harassment
      { id: "A2-147", count: 1 }, // Giant Cape
      { id: "B3b-65", count: 1 }, // Choice Band
      { id: "B2-153", count: 1 }, // Gym Building
    ],
    strategy: [
      "核心思路：極高穩定度與防守控場的水系牌組。伊布ex 提供了優秀的起手展開與抽牌流暢度，醜醜魚可迅速進化為美納斯ex（Milotic ex）。美納斯ex 具備優異的限制效果與穩定輸出，配合米可利（Wallace）的專屬支援，能大幅干擾對手的攻擊節奏。",
      "展開順序：起手優先以伊布ex 或醜醜魚開局。伊布ex 進行鋪場與抽牌，迅速搜尋美納斯ex 進化線。古劍豹ex 可作為備用大招或後期壓制工具。",
      "注意事項：",
      "- 米可利能大幅強化美納斯ex 的防護與戰術限制，在關鍵回合使用能直接封鎖敵方攻擊。",
      "- 巨大披風能讓美納斯ex 突破血線臨界點，增加對戰存活率。",
      "- 適時利用水精靈（Vaporeon）進行全隊水系寶可夢的血量調節與連動。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "Mega火焰雞ex 甲賀忍蛙",
        note: "有利。水系剋制火系，美納斯ex 與古劍豹ex 對火焰雞皆能造成弱點雙倍傷害。",
      },
      {
        vs: "密勒頓ex 自爆磁怪",
        note: "不利。雷系 weak 壓制，需依賴伊布ex 高彈性與米可利干擾來爭取勝機。",
      },
      {
        vs: "水君ex 戟脊龍",
        note: "五五開。水系內戰比拚美納斯ex 的控場能力與古劍豹ex 的登場時機。",
      },
    ],
  },
  {
    id: "giratina-darkrai",
    name: "騎拉帝納ex 達克萊伊ex",
    tier: "A",
    energy: ["Psychic", "Darkness"],
    difficulty: "難",
    summary:
      "雙神重砲點傷：達克萊伊ex 特性每回合放置傷害指示物，騎拉帝納ex 在後期一擊必殺收割勝利。",
    cards: [
      { id: "A2-110", count: 2 }, // Darkrai ex
      { id: "A2b-35", count: 2 }, // Giratina ex
      { id: "B1-121", count: 1 }, // Indeedee ex
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "A2-150", count: 1 }, // Cyrus
      { id: "A2b-71", count: 1 }, // Dawn
      { id: "A2b-70", count: 1 }, // Pokémon Center Lady
      { id: "A1-225", count: 1 }, // Sabrina
      { id: "B1-225", count: 1 }, // Copycat
      { id: "PROMO-A-5", count: 2 }, // Poké Ball
      { id: "B3-147", count: 1 }, // Team Rocket's Harassment
      { id: "A2-148", count: 2 }, // Rocky Helmet
      { id: "A2-147", count: 1 }, // Giant Cape
      { id: "B2-154", count: 1 }, // Starting Plains
      { id: "B2-155", count: 1 }, // Old Cemetery
    ],
    strategy: [
      "核心思路：結合達克萊伊ex（Darkrai ex）每回合免費放置傷害指示物的特性，與騎拉帝納ex（Giratina ex）頂級單體傷害的雙神體系。達克萊伊在備戰區持續削弱敵方全場血線，騎拉帝納ex 則在前場進行無情打擊，讓對手難以計算血量安防線。",
      "展開順序：開局起手達克萊伊ex 或騎拉帝納ex 皆可。達克萊伊ex 儘早落地發動特性削血，手牌利用博士的研究與複印快速濾牌，幫騎拉帝納ex 填滿能量。",
      "注意事項：",
      "- 雙能量體系需要精確計算每回合附能對象，優先確保前場主力能按時出招。",
      "- 岩石頭盔與巨大披風能讓前場寶可夢在互換時佔據極大優勢。",
      "- 赤日與娜姿能將敵方受過達克萊伊削血的備戰寶可夢強制拉出收割。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "Mega七夕青鳥ex 太陽伊布",
        note: "有利。達克萊伊ex 的惡系傷害能對超能系造成弱點打擊，騎拉帝納ex 亦能輕鬆收割殘血。",
      },
      {
        vs: "Mega路卡利歐ex",
        note: "不利。達克萊伊ex 弱格鬥，需盡量讓騎拉帝納ex 承擔頂線，避開達克萊伊被對手路卡利歐秒殺。",
      },
      {
        vs: "密勒頓ex 自爆磁怪",
        note: "五五開。比拚雙方成型與輸出速度，全場削血對密勒頓等低血量前場有顯著效果。",
      },
    ],
  },
  {
    id: "greninja-mega-absol",
    name: "甲賀忍蛙 Mega阿勃梭魯ex",
    tier: "A",
    energy: ["Darkness"],
    difficulty: "難",
    summary:
      "干擾與削血控制：甲賀忍蛙飛水手裏劍點傷，Mega阿勃梭魯ex 打亂對方手牌與資源庫進行破壞。",
    cards: [
      { id: "A1-87", count: 2 }, // Froakie
      { id: "A1-89", count: 2 }, // Greninja
      { id: "B1-109", count: 2 }, // Chingling
      { id: "A2-110", count: 1 }, // Darkrai ex
      { id: "B1-151", count: 1 }, // Mega Absol ex
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "B1-225", count: 2 }, // Copycat
      { id: "A2-150", count: 1 }, // Cyrus
      { id: "A3-144", count: 2 }, // Rare Candy
      { id: "PROMO-A-5", count: 2 }, // Poké Ball
      { id: "A2-148", count: 1 }, // Rocky Helmet
      { id: "A4a-67", count: 1 }, // Inflatable Boat
      { id: "B3-148", count: 1 }, // Lucky Egg
    ],
    strategy: [
      "核心思路：結合甲賀忍蛙（Greninja）的後排遠程點傷與 Mega阿勃梭魯ex（Mega Absol ex）高輸出干擾的控制流牌組。忍蛙的「飛水手裏劍」每回合削弱敵人，配合鈴噹響限制道具與 Mega阿勃梭魯ex 破壞戰線，能令對手處於極度不適的被動狀態。",
      "展開順序：呱呱泡蛙與鈴噹響開局。利用神奇糖果迅速跳級甲賀忍蛙，並靠鈴噹響干擾對方發展。後期將 Mega阿勃梭魯ex 或達克萊伊ex 登場打出致命打擊。",
      "注意事項：",
      "- 飛水手裏劍配合赤日，能精確獵殺對手備戰區已經被削血的進化雛型。",
      "- 幸運蛋（Lucky Egg）與充氣小艇提供良好的手牌補充與撤退流暢度。",
      "- 留意對手的草系主砲（如 Mega蜥蜴王ex），惡系弱草需特別注意防守位置。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "Mega蜥蜴王ex 甲賀忍蛙",
        note: "不利。惡系弱草，對手 Mega蜥蜴王ex 打你全隊都是雙倍弱點傷害，需靠赤日與忍蛙點傷打亂對方進化。",
      },
      {
        vs: "水君ex 戟脊龍",
        note: "五五開。對方成型需要時間，利用忍蛙點傷打殘涼脊龍，阻止戟脊龍引擎成型。",
      },
      {
        vs: "Mega七夕青鳥ex 太陽伊布",
        note: "小幅有利。惡系對超能系的弱點優禦顯著，能迅速打破對方的防守體系。",
      },
    ],
  },
  {
    id: "mega-lucario",
    name: "Mega路卡利歐ex",
    tier: "A",
    energy: ["Fighting"],
    difficulty: "易",
    summary: "格鬥直球對決：Mega路卡利歐ex 單核主砲＋滿配干擾與防護道具。",
    cards: [
      { id: "A2-91", count: 1 }, // Riolu (A2)
      { id: "B3-79", count: 1 }, // Riolu (B3)
      { id: "B3-81", count: 2 }, // Mega Lucario ex
      { id: "A2-92", count: 1 }, // Lucario
      { id: "A1-154", count: 1 }, // Hitmonlee
      { id: "PROMO-B-51", count: 1 }, // Zygarde
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "A1-225", count: 1 }, // Sabrina
      { id: "A2-150", count: 1 }, // Cyrus
      { id: "A2b-70", count: 1 }, // Pokémon Center Lady
      { id: "B1-225", count: 1 }, // Copycat
      { id: "B3-149", count: 1 }, // Korrina
      { id: "PROMO-A-5", count: 2 }, // Poké Ball
      { id: "PROMO-A-2", count: 1 }, // X Speed
      { id: "A2-148", count: 1 }, // Rocky Helmet
      { id: "B2-147", count: 1 }, // Protective Poncho
      { id: "B3-154", count: 1 }, // Arena of Antiquity
    ],
    strategy: [
      "核心思路：結構最單純的一套——把 Mega路卡利歐ex 立起來，然後一路揍過去。副攻擊手（飛腿郎、基格爾德）與大量單張工具卡（岩石頭盔、防護斗篷、太古的鬥技場）讓這套牌在單核之外仍有應對彈性。對雷系牌組有天然的弱點壓制，是它在現環境站穩腳步的主因。",
      "展開順序：利歐路開局落地、瑪俐娜（Korrina）幫你穩定找到進化線。兩張 Mega路卡利歐ex 讓你不怕第一隻被處理；X速度與撤退管理確保主砲永遠打在最划算的目標上。",
      "注意事項：",
      "- 對局中最重要的問題是「對面誰能一擊打死我的主砲」——把防護道具留給那個回合。",
      "- 飛腿郎能點到備戰區，開局用它先把對手的進化雛型打殘，後期主砲收割會輕鬆很多。",
      "- 娜姿＋阿卡蒂亞雙干擾在單核牌裡價值加倍：對手永遠不知道下回合誰會被拖出來。",
      "- 入門推薦：卡片職責清楚、路線單一，適合當你踏入現環境的第一套牌。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "密勒頓ex 自爆磁怪",
        note: "有利。雷系弱格鬥，主砲全程弱點傷害；注意對方速度快，前兩回合先用副攻擊手穩住，別讓主砲沒成型就被圍攻。",
      },
      {
        vs: "水君ex 戟脊龍",
        note: "不利。對方重砲＋回血的消耗戰你打不贏，速戰速決：趁引擎成型前用飛腿郎點殘關鍵位，搶前三分。",
      },
      {
        vs: "Mega蜥蜴王ex 甲賀忍蛙",
        note: "五五開。互相都沒有弱點優勢，比的是誰的主砲先就位、道具用得準；防禦斗篷的時機是勝負手。",
      },
    ],
  },
  {
    id: "mega-manectric-zeraora",
    name: "Mega雷電獸ex 捷拉奧拉",
    tier: "B",
    energy: ["Lightning"],
    difficulty: "易",
    summary: "雷系極速打擊：Mega雷電獸ex 快速爆發填能，捷拉奧拉隨時狙擊對手後排殘血單位。",
    cards: [
      { id: "PROMO-B-43", count: 2 }, // Electrike
      { id: "B2b-27", count: 2 }, // Mega Manectric ex
      { id: "A3a-21", count: 2 }, // Zeraora
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "B1-225", count: 2 }, // Copycat
      { id: "A1-225", count: 1 }, // Sabrina
      { id: "A2-150", count: 1 }, // Cyrus
      { id: "A2b-70", count: 1 }, // Pokémon Center Lady
      { id: "A1-223", count: 1 }, // Volkner
      { id: "PROMO-A-5", count: 2 }, // Poké Ball
      { id: "A2-148", count: 2 }, // Rocky Helmet
      { id: "B2-147", count: 1 }, // Protective Poncho
      { id: "B2-153", count: 1 }, // Gym Building
    ],
    strategy: [
      "核心思路：節奏極快且具備強大機動力的雷系快攻牌組。Mega雷電獸ex（Mega Manectric ex）具備極高的能量轉換與出招速度，捷拉奧拉（Zeraora）則提供零撤退成本與靈活後排狙擊。整套牌組上手難度低，適合喜歡高速節奏壓制的玩家。",
      "展開順序：起手落地上庫瑪/落雷獸與捷拉奧拉。快速附能並進化 Mega雷電獸ex 搶先發動攻擊，捷拉奧拉在後排隨時準備接棒或尾刀。",
      "注意事項：",
      "- 捷拉奧拉的撤退為 0，能靈活切換前排，配合岩石頭盔給予反擊傷害。",
      "- 防護斗篷可防止 Mega雷電獸ex 被對方的干擾招式限制。",
      "- 面對格鬥系對手（如 Mega路卡利歐ex）時需格外謹慎，雷系弱格很容易被一擊秒殺。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "水君ex 戟脊龍",
        note: "有利。水系弱雷，Mega雷電獸ex 與捷拉奧拉皆能打出弱點傷害，速度遠快於對方。",
      },
      {
        vs: "Mega路卡利歐ex",
        note: "不利。雷系弱格鬥，對方 Mega路卡利歐ex 能輕鬆一擊帶走你的前場。需靠娜姿與捷拉奧拉後排狙擊繞開正面。",
      },
      {
        vs: "Mega火焰雞ex 甲賀忍蛙",
        note: "五五開。雙方比拚極速爆發，誰先立起 Mega 寶可夢就能搶下勝機。",
      },
    ],
  },
  {
    id: "mega-altaria-chingling",
    name: "Mega七夕青鳥ex 鈴噹響",
    tier: "B",
    energy: ["Psychic"],
    difficulty: "中",
    summary: "龍超鎖招耐久：前期鈴噹響封鎖對手道具展開，後續養出 Mega七夕青鳥ex 靠高 HP 消耗對戰。",
    cards: [
      { id: "B1-196", count: 2 }, // Swablu
      { id: "B1-102", count: 2 }, // Mega Altaria ex
      { id: "B1-109", count: 2 }, // Chingling
      { id: "B1-106", count: 1 }, // Togekiss
      { id: "A3-84", count: 1 }, // Cresselia
      { id: "B3b-61", count: 1 }, // Furfrou
      { id: "B1-120", count: 1 }, // Mesprit
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "B1-225", count: 1 }, // Copycat
      { id: "B1-226", count: 1 }, // Lisia
      { id: "A2-150", count: 1 }, // Cyrus
      { id: "A1-225", count: 1 }, // Sabrina
      { id: "A2b-71", count: 1 }, // Dawn
      { id: "PROMO-A-5", count: 1 }, // Poké Ball
      { id: "A2-148", count: 1 }, // Rocky Helmet
      { id: "B2-153", count: 1 }, // Gym Building
    ],
    strategy: [
      "核心思路：以鈴噹響（Chingling）為前期控場核心的控制型七夕青鳥牌組。鈴噹響能封鎖對手使用道具卡（如神奇糖果、精靈球等），打亂敵方的跳級與展開計畫，為後排的 Mega七夕青鳥ex 爭取充足的集能與進化時間。",
      "展開順序：開局首選鈴噹響站前場發動招式封鎖對手道具，備戰區同時培養青綿鳥。當 Mega七夕青鳥ex 集能完成後，撤下鈴噹響進行高血量壓制。",
      "注意事項：",
      "- 鈴噹響在面對極度依賴神奇糖果的牌組（如 Mega火焰雞、Mega蜥蜴王）時有毀滅性的打擊效果。",
      "- 留意鈴噹響的血量，適時讓多麗米亞或防禦裝備接手頂線。",
      "- 希嘉娜與莉莉艾能提供穩健的手牌檢索，確保七夕青鳥進化鏈不卡牌。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "Mega火焰雞ex 甲賀忍蛙",
        note: "有利。鈴噹響封鎖對手的神奇糖果，使其火焰雞無法順利進化，為你贏得絕對時間差。",
      },
      {
        vs: "索羅亞克ex Mega阿勃梭魯ex",
        note: "不利。惡系對超能系造成弱點傷害，對方不需要依賴糖果即可快速輸出。",
      },
      {
        vs: "密勒頓ex 自爆磁怪",
        note: "五五開。密勒頓基礎型態攻擊強勁，鈴噹響需搭配岩石頭盔減緩對方攻勢。",
      },
    ],
  },
  {
    id: "mega-lucario-solo",
    name: "Mega路卡利歐ex 純格極速",
    tier: "B",
    energy: ["Fighting"],
    difficulty: "易",
    summary:
      "純格直球強攻：簡化進化線，滿載飛腿郎與多麗米亞輔助前場，集中資源讓 Mega路卡利歐ex 強攻破局。",
    cards: [
      { id: "A2-91", count: 1 }, // Riolu (A2)
      { id: "A2b-42", count: 1 }, // Riolu (A2b)
      { id: "B3-81", count: 2 }, // Mega Lucario ex
      { id: "A1-154", count: 1 }, // Hitmonlee
      { id: "B3b-61", count: 1 }, // Furfrou
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "A1-225", count: 1 }, // Sabrina
      { id: "A2-150", count: 1 }, // Cyrus
      { id: "A2b-70", count: 1 }, // Pokémon Center Lady
      { id: "B1-225", count: 1 }, // Copycat
      { id: "B3-149", count: 1 }, // Korrina
      { id: "PROMO-A-5", count: 2 }, // Poké Ball
      { id: "PROMO-A-2", count: 1 }, // X Speed
      { id: "B2-145", count: 1 }, // Lucky Ice Pop
      { id: "A2-148", count: 1 }, // Rocky Helmet
      { id: "B2-147", count: 1 }, // Protective Poncho
      { id: "B3-154", count: 1 }, // Arena of Antiquity
    ],
    strategy: [
      "核心思路：Mega路卡利歐ex 的純格鬥極簡變體。捨棄了普通路卡利歐的副進化線，將牌組空間留給飛腿郎（Hitmonlee）、多麗米亞與極致的輔助道具。操作直觀純粹，目標是極速將 Mega路卡利歐ex 送上主戰場進行直球碾壓。",
      "展開順序：利歐路開局落地，利用可可布爾（Korrina）或精靈球檢索 Mega路卡利歐ex。飛腿郎可於前期對敵方備戰區進行點傷削血。",
      "注意事項：",
      "- 太古的鬥技場（Arena of Antiquity）能極大化格鬥系寶可夢的輸出面板。",
      "- 幸運冰棒與防護斗篷給予主砲極高的持續生存能力。",
      "- 非常適合追求簡單直接打法、不想處理複雜二階進化的玩家。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "密勒頓ex 自爆磁怪",
        note: "有利。雷系弱格鬥，Mega路卡利歐ex 的攻擊能直接一擊秒殺密勒頓ex。",
      },
      {
        vs: "水君ex 戟脊龍",
        note: "不利。水君ex 搭配戟脊龍的續航能力高於單核路卡利歐，需靠飛腿郎前期打殘對手涼脊龍。",
      },
      {
        vs: "Mega蜥蜴王ex 甲賀忍蛙",
        note: "五五開。比拚雙方成型速度與道具防衛時機。",
      },
    ],
  },
  {
    id: "magnezone-miraidon",
    name: "自爆磁怪 密勒頓ex",
    tier: "C",
    energy: ["Lightning"],
    difficulty: "中",
    summary: "磁怪重砲主攻：以自爆磁怪作為主要火力，花舞鳥與密勒頓ex 前期爭取充能時間並穩固防線。",
    cards: [
      { id: "B1a-24", count: 2 }, // Magnemite
      { id: "A1-98", count: 2 }, // Magneton
      { id: "B1a-26", count: 2 }, // Magnezone
      { id: "A3-66", count: 2 }, // Oricorio
      { id: "B3a-19", count: 1 }, // Miraidon ex
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "B1a-68", count: 1 }, // Clemont
      { id: "B3a-73", count: 1 }, // Professor Turo
      { id: "B1-226", count: 1 }, // Lisia
      { id: "B1-225", count: 1 }, // Copycat
      { id: "A1-225", count: 1 }, // Sabrina
      { id: "A2-150", count: 1 }, // Cyrus
      { id: "PROMO-A-5", count: 2 }, // Poké Ball
      { id: "A2-147", count: 1 }, // Giant Cape
    ],
    strategy: [
      "核心思路：將重心放在非 ex 自爆磁怪（Magnezone）的高傷害與獎賞卡優勢上。密勒頓ex 只放一張作為前期強力的開局打手與威脅，後排靠花舞鳥（Oricorio）與小磁怪穩定集能進化，讓非 ex 自爆磁怪在對換中佔據獎賞卡優勢。",
      "展開順序：小磁怪或花舞鳥開局。若拿到密勒頓ex 則先上場壓制，備戰區迅速將小磁怪進化至三階自爆磁怪。成型後讓自爆磁怪上場進行高輸出對換。",
      "注意事項：",
      "- 希特隆（Clemont）與希嘉娜能為雷系隊伍提供極高價值的能量與檢索過濾。",
      "- 巨大披風掛在自爆磁怪身上能使其血量逼近 ex 寶可夢，大幅提升對換率。",
      "- 非 ex 寶可夢被擊倒只送 1 分，在獎賞卡對換中擁有天然優勢。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "水君ex 戟脊龍",
        note: "有利。水系弱雷，自爆磁怪一擊即可帶走水君ex，且只給對方 1 分獎賞。",
      },
      {
        vs: "Mega路卡利歐ex",
        note: "不利。雷系弱格，對方路卡利歐能輕易秒殺前場，需靠花舞鳥與控場干擾拖延。",
      },
      {
        vs: "Mega蜥蜴王ex 甲賀忍蛙",
        note: "五五開。比拚自爆磁怪與蜥蜴王的成型速度。",
      },
    ],
  },
  {
    id: "magnezone-ex-magnezone",
    name: "自爆磁怪ex 自爆磁怪",
    tier: "C",
    energy: ["Lightning"],
    difficulty: "中",
    summary:
      "雙磁怪鋼雷防線：自爆磁怪ex 巨額 HP 與重砲攻擊，搭配單卡自爆磁怪讓雷系火力與傳能源源不絕。",
    cards: [
      { id: "B1a-24", count: 2 }, // Magnemite
      { id: "A1-98", count: 2 }, // Magneton
      { id: "B1a-26", count: 1 }, // Magnezone
      { id: "B3-54", count: 1 }, // Magnezone ex
      { id: "B3a-19", count: 1 }, // Miraidon ex
      { id: "A3-66", count: 1 }, // Oricorio
      { id: "A3a-21", count: 1 }, // Zeraora
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "A2-150", count: 1 }, // Cyrus
      { id: "B1a-68", count: 1 }, // Clemont
      { id: "A2b-70", count: 1 }, // Pokémon Center Lady
      { id: "B1-225", count: 1 }, // Copycat
      { id: "B1-226", count: 1 }, // Lisia
      { id: "B3a-73", count: 1 }, // Professor Turo
      { id: "PROMO-A-5", count: 2 }, // Poké Ball
      { id: "A2-147", count: 1 }, // Giant Cape
    ],
    strategy: [
      "核心思路：同時投入自爆磁怪ex（Magnezone ex）與普通自爆磁怪的雙重磁怪體系。自爆磁怪ex 擁有極為驚人的血量上限與巨額傷害，搭配捷拉奧拉與密勒頓ex 前期鋪墊，打造出一道難以攻破的鋼雷防線。",
      "展開順序：小磁怪鋪開，利用博士的研究與希特隆迅速尋找進化元件。根據對局靈活選擇進化自爆磁怪ex 或是普通自爆磁怪。巨大披風優先給予自爆磁怪ex。",
      "注意事項：",
      "- 自爆磁怪ex 撤退成本較高，注意前場被對手干擾鎖定時的應對。",
      "- 阿圖羅博士（Professor Turo）可用於回收殘血的 ex 寶可夢，防止對手拿到關鍵 2 分。",
      "- 留意格鬥系弱點，避免前場被 Mega路卡利歐強行擊破。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "水君ex 戟脊龍",
        note: "有利。雷系弱點對水系隊伍有絕對壓制，自爆磁怪ex 的超高血量對方極難一擊必殺。",
      },
      {
        vs: "Mega路卡利歐ex",
        note: "不利。弱點傷害過高，需盡早靠密勒頓ex 搶攻打亂對方節奏。",
      },
      {
        vs: "Mega七夕青鳥ex 太陽伊布",
        note: "五五開。雙方都是高 HP 中速對決，比拚資源管理與阿圖羅博士回收時機。",
      },
    ],
  },
  {
    id: "milotic-chien-pao",
    name: "美納斯ex 古劍豹ex",
    tier: "C",
    energy: ["Water"],
    difficulty: "中",
    summary: "水精靈控場拔刀：水精靈與美納斯ex 建立穩健前場，古劍豹ex 後期拔刀造成大範圍破壞威脅。",
    cards: [
      { id: "A4a-21", count: 2 }, // Feebas
      { id: "B3b-15", count: 2 }, // Milotic ex
      { id: "B1-184", count: 1 }, // Eevee
      { id: "A4-134", count: 1 }, // Eevee
      { id: "A1a-19", count: 2 }, // Vaporeon
      { id: "B2a-37", count: 2 }, // Chien-Pao ex
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "A2-150", count: 1 }, // Cyrus
      { id: "A2a-72", count: 1 }, // Irida
      { id: "B1-225", count: 1 }, // Copycat
      { id: "B1-226", count: 1 }, // Lisia
      { id: "B3b-68", count: 1 }, // Wallace
      { id: "PROMO-A-5", count: 2 }, // Poké Ball
      { id: "A2-147", count: 1 }, // Giant Cape
    ],
    strategy: [
      "核心思路：結合水精靈（Vaporeon）的充能與美納斯ex（Milotic ex）的控場，最後由古劍豹ex（Chien-Pao ex）進行滿能量爆發拔刀收割的水系牌組。水精靈能迅速為全場水系寶可夢補充能量，使古劍豹ex 的招式威力達到頂峰。",
      "展開順序：醜醜魚與伊布開局。優先進化水精靈進行能量加速，備戰區同時養美納斯ex 與古劍豹ex。美納斯ex 前場頂線限制對手，古劍豹ex 後期登場大招收割。",
      "注意事項：",
      "- 珠貝（Irida）能精確搜尋水系寶可夢與道具，是確保進化鏈順暢的核心支援者。",
      "- 古劍豹ex 需要棄掉水能量來提高傷害，需計算好棄牌與水精靈回能的循環。",
      "- 巨大披風能提高美納斯ex 的防禦極限。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "Mega火焰雞ex 甲賀忍蛙",
        note: "有利。水系雙倍弱點傷害，古劍豹ex 拔刀能一擊秒殺火焰雞。",
      },
      {
        vs: "密勒頓ex 自爆磁怪",
        note: "不利。雷系弱點過於致命，需利用美納斯ex 的控制招式封鎖對方攻擊。",
      },
      {
        vs: "Mega路卡利歐ex",
        note: "五五開。互相沒有弱點優勢，比拚古劍豹ex 的拔刀傷害是否足夠秒殺路卡利歐。",
      },
    ],
  },
  {
    id: "mega-charizard-entei",
    name: "Mega噴火龍Y ex 炎帝ex",
    tier: "C",
    energy: ["Fire"],
    difficulty: "易",
    summary:
      "炎帝前衝噴火重砲：炎帝ex 前期快速登場加載火焰貼紙，Mega噴火龍Y ex 一出即一擊轟飛對方滿血主力。",
    cards: [
      { id: "A2b-8", count: 2 }, // Charmander
      { id: "B2b-8", count: 2 }, // Charmeleon
      { id: "B1a-14", count: 1 }, // Mega Charizard Y ex
      { id: "A4a-10", count: 2 }, // Entei ex
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "B1-225", count: 1 }, // Copycat
      { id: "B1-223", count: 1 }, // May
      { id: "A2b-70", count: 1 }, // Pokémon Center Lady
      { id: "A1-225", count: 1 }, // Sabrina
      { id: "B1-217", count: 2 }, // Flame Patch
      { id: "PROMO-A-5", count: 2 }, // Poké Ball
      { id: "B2-145", count: 1 }, // Lucky Ice Pop
      { id: "A2-147", count: 1 }, // Giant Cape
      { id: "B2-147", count: 1 }, // Protective Poncho
    ],
    strategy: [
      "核心思路：極具震撼力的火系重砲牌組。炎帝ex（Entei ex）提供優秀的前期過渡與手牌加速，搭配火焰貼紙（Flame Patch）能快速幫後排的小火龍進化鏈累積能量。當 Mega噴火龍Y ex（Mega Charizard Y ex）成型登場時，其驚人的傷害面板能直接秒殺現環境幾乎所有寶可夢。",
      "展開順序：炎帝ex 開局站前場，利用火焰貼紙與小遙（May）迅速過牌附能。備戰區小火龍一路進化至 Mega噴火龍Y ex，滿能後上場一擊毀滅敵方主力。",
      "注意事項：",
      "- 炎帝ex 的特性與前場威脅能吸引對手火力，為噴火龍爭取寶貴的進化回合。",
      "- 防護斗篷與巨大披風可掛在 Mega噴火龍Y ex 身上，讓其成為無法被撼動的要塞。",
      "- 留意水系牌組的弱點傷害，炎帝在水系面前需注意防守。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "Mega蜥蜴王ex 甲賀忍蛙",
        note: "有利。草系弱火，Mega噴火龍Y ex 打出天際雙倍傷害，輕鬆橫掃對戰區。",
      },
      {
        vs: "水君ex 戟脊龍",
        note: "不利。弱點水系威脅極大，需靠火焰貼紙極速養出噴火龍，在對方水君攻擊前搶先擊殺。",
      },
      {
        vs: "Mega路卡利歐ex",
        note: "小幅有利。Mega噴火龍Y ex 的血量與傷害面板皆勝過路卡利歐，只要成功成型即可獲勝。",
      },
    ],
  },
  {
    id: "mega-blaziken-castform",
    name: "Mega火焰雞ex 飄浮泡泡太陽型態",
    tier: "C",
    energy: ["Fire"],
    difficulty: "易",
    summary:
      "天氣火系極速衝鋒：飄浮泡泡太陽型態免費撤退與場地搭配，加速 Mega火焰雞ex 糖果直上成型。",
    cards: [
      { id: "B1-33", count: 2 }, // Torchic
      { id: "B1-36", count: 2 }, // Mega Blaziken ex
      { id: "B3-24", count: 2 }, // Castform Sunny Form
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "B1-225", count: 1 }, // Copycat
      { id: "A2-150", count: 1 }, // Cyrus
      { id: "A1-225", count: 1 }, // Sabrina
      { id: "PROMO-A-5", count: 2 }, // Poké Ball
      { id: "A3-144", count: 2 }, // Rare Candy
      { id: "B1-217", count: 2 }, // Flame Patch
      { id: "B2-147", count: 1 }, // Protective Poncho
      { id: "B2b-69", count: 2 }, // Hiking Trail
    ],
    strategy: [
      "核心思路：運用飄浮泡泡太陽型態（Castform Sunny Form）與登山步道（Hiking Trail）連動的火系極速衝鋒牌組。飄浮泡泡在太陽天氣下具備免費撤退與強大的機動過渡能力，配合神奇糖果能讓 Mega火焰雞ex 在極短回合內直上主戰場。",
      "展開順序：飄浮泡泡或火稚雞起手。張貼登山步道改變場地，飄浮泡泡免費撤退靈活切換。使用神奇糖果將火稚雞直接進化為 Mega火焰雞ex，搭配火焰貼紙即刻發動猛攻。",
      "注意事項：",
      "- 登山步道是這套牌組運作的樞紐，確保場地維持在火系有利狀態。",
      "- 飄浮泡泡的 0 撤退費用能讓你自由調節前場，隨時讓滿能量的 Mega火焰雞ex 登場。",
      "- 留意手牌資源過濾，避免神奇糖果與進化卡卡手。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "Mega蜥蜴王ex 甲賀忍蛙",
        note: "有利。火系剋制草系，極速跳級的 Mega火焰雞ex 能對蜥蜴王造成毀滅性雙倍打擊。",
      },
      {
        vs: "水君ex 戟脊龍",
        note: "不利。弱點水系，對方戟脊龍成型後水君傷害過高，需靠速度優勢搶前三分。",
      },
      {
        vs: "密勒頓ex 自爆磁怪",
        note: "五五開。雙方都是極速衝鋒牌組，比拚誰的神奇糖果與場地卡先到位。",
      },
    ],
  },
  {
    id: "hydreigon-mega-sableye",
    name: "三首惡龍 Mega勾魂眼ex",
    tier: "C",
    energy: ["Darkness"],
    difficulty: "難",
    summary: "三階惡龍收割網：三首惡龍滿破壞力群體點傷，搭配 Mega勾魂眼ex 偷取資源並徹底擊垮後排。",
    cards: [
      { id: "B1-155", count: 2 }, // Deino
      { id: "B1-157", count: 2 }, // Hydreigon
      { id: "B3b-41", count: 1 }, // Mega Sableye ex
      { id: "B3-115", count: 1 }, // Bombirdier
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "B1-225", count: 2 }, // Copycat
      { id: "A1-225", count: 1 }, // Sabrina
      { id: "A2-150", count: 1 }, // Cyrus
      { id: "PROMO-A-5", count: 2 }, // Poké Ball
      { id: "A3-144", count: 2 }, // Rare Candy
      { id: "B2-145", count: 2 }, // Lucky Ice Pop
      { id: "A2-148", count: 2 }, // Rocky Helmet
    ],
    strategy: [
      "核心思路：以三首惡龍（Hydreigon）的全場傷害與 Mega勾魂眼ex（Mega Sableye ex）的資源打擊為核心的惡系控制牌組。三首惡龍透過神奇糖果快速登場，其強大的招式能對對手後排與前場同步施加巨量傷害，最後由 Mega勾魂眼ex 進行清理與資源剝奪。",
      "展開順序：單首龍與毛球小鳥開局。手牌搜尋神奇糖果直接進化三首惡龍。利用三首惡龍的高傷害壓制敵方全場，備戰區隨時養 Mega勾魂眼ex 準備收尾。",
      "注意事項：",
      "- 岩石頭盔與幸運冰棒能顯著提高三首惡龍在進化期間與登場後的戰鬥拉鋸能力。",
      "- 三首惡龍屬於二階進化，手牌資源需優先保障神奇糖果與單首龍的存活。",
      "- 赤日能將對方殘血的後排單位拉出，配合三首惡龍進行打擊。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "Mega七夕青鳥ex 太陽伊布",
        note: "有利。惡系對超能系弱點雙倍，三首惡龍與 Mega勾魂眼ex 能輕鬆打穿對手防線。",
      },
      {
        vs: "Mega蜥蜴王ex 甲賀忍蛙",
        note: "不利。惡系弱草，對手 Mega蜥蜴王ex 的攻擊能對你的主力造成雙倍打擊。",
      },
      {
        vs: "密勒頓ex 自爆磁怪",
        note: "五五開。三首惡龍的全場點傷對密勒頓等前排速攻手有顯著抑制效果。",
      },
    ],
  },
  {
    id: "greninja-mega-sableye",
    name: "甲賀忍蛙 Mega勾魂眼ex",
    tier: "C",
    energy: ["Darkness"],
    difficulty: "難",
    summary: "使用率第二的削血流：雙忍蛙＋達克萊伊每回合固定磨血，Mega勾魂眼ex 負責收割。",
    cards: [
      { id: "A1-87", count: 2 }, // Froakie
      { id: "A1-89", count: 2 }, // Greninja
      { id: "B1-109", count: 2 }, // Chingling
      { id: "B1-151", count: 1 }, // Mega Absol ex
      { id: "A2-110", count: 1 }, // Darkrai ex
      { id: "B3b-41", count: 1 }, // Mega Sableye ex
      { id: "PROMO-A-7", count: 2 }, // Professor's Research
      { id: "B1-225", count: 2 }, // Copycat
      { id: "A2-150", count: 1 }, // Cyrus
      { id: "PROMO-A-5", count: 2 }, // Poké Ball
      { id: "A3-144", count: 2 }, // Rare Candy
      { id: "B3b-64", count: 1 }, // Small Balloon
      { id: "B3-148", count: 1 }, // Lucky Egg
    ],
    strategy: [
      "核心思路：這套不靠正面對轟，而是把傷害拆成很多小份：兩隻甲賀忍蛙的「飛水手裏劍」加上達克萊伊ex 的特性，每回合都在對手全場放血，最後由 Mega勾魂眼ex 或 Mega阿勃梭魯ex 出面收割殘局。",
      "展開順序：雙呱呱泡蛙盡早落地，神奇糖果直上忍蛙是整套牌的引擎。鈴噹響與幸運蛋負責手牌資源，讓你在連續使用博士的研究後不斷檔。主攻手最後才登場：先讓削血系統跑兩三回合，再讓 Mega勾魂眼ex 出來一隻換一隻。",
      "注意事項：",
      "- 每回合結束前重新算一次對手全場血線，手裏劍的 20 點常常決定下回合有沒有雙殺。",
      "- 這套牌怕草系（弱點）與快攻：對面太快時別貪展開，先確保頂線不崩。",
      "- 阿卡蒂亞把對手縮在備戰區的重傷寶可夢拉出來，是這套牌最常見的致勝一擊。",
    ].join("\n\n"),
    matchups: [
      {
        vs: "Mega蜥蜴王ex 甲賀忍蛙",
        note: "不利。惡系弱草，對方主砲全程打你弱點，而且對方也有忍蛙跟你互磨。盡量搶先手削血，把節奏拖進你的收割回合。",
      },
      {
        vs: "密勒頓ex 自爆磁怪",
        note: "五五開。對方速度快但血線普通，你的全場削血對速攻手特別有效——關鍵是撐過前兩回合的搶攻。",
      },
      {
        vs: "Mega路卡利歐ex",
        note: "小幅不利。對方單體壓力大、又有道具保護，削血流需要更多回合；優先用娜姿式干擾打亂對方進攻節奏。",
      },
    ],
  },
];

const TIER_ORDER: Record<Tier, number> = { S: 0, A: 1, B: 2, C: 3 };

export function listDecks(): Deck[] {
  return [...decks].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);
}

export function getDeck(id: string): Deck | undefined {
  return decks.find((d) => d.id === id);
}
