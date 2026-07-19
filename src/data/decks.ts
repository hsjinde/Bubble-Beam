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
    id: "mega-sceptile-greninja",
    name: "Mega蜥蜴王ex 甲賀忍蛙",
    tier: "S",
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
      "核心思路：這套不靠正面對轟，而是把傷害拆成很多小份：兩隻甲賀忍蛙的「飛水手裏劍」加上達克萊伊ex 的特性，每回合都在對手全場放血，最後由 Mega勾魂眼ex 或 Mega阿勃梭魯ex 出面收割殘局。使用率全場第二，但勝率偏低（約 47%）——它吃操作，順風極順、逆風很容易自己算錯傷害線。",
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
        note: "五五開。互相都沒有弱點優勢，比的是誰的主砲先就位、道具用得準；防護斗篷的時機是勝負手。",
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
