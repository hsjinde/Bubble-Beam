import buildingsData from "./buildings.json";
import collectionsData from "./collections.json";
import type {
  Bookmark,
  Building,
  BuildingCategory,
  BuildingSeries,
  Collection,
  VideoInspiration,
} from "./types";

export type { Building, BuildingCategory, BuildingSeries, Collection, Bookmark, VideoInspiration };

export const buildings = buildingsData as Building[];
export const collections = collectionsData as Collection[];

const buildingsMap: Record<string, Building> = Object.fromEntries(buildings.map((b) => [b.id, b]));

export function getBuilding(id: string): Building | undefined {
  return buildingsMap[id];
}

/**
 * 建築圖片基底：圖片直接引用上游 pokopiadex.com 的資產（社群資料庫用的同一組
 * 卡圖來源，實測允許跨網域引用）。刻意不重新托管，維持與 CardImage 一致的 hotlink
 * 策略；載入失敗時 BuildingImage 會退回功能色塊。
 */
const IMAGE_BASE = "https://pokopiadex.com/images/items/";

export function buildingImageUrl(building: Building): string {
  return IMAGE_BASE + building.image;
}

/** 功能分類的固定顯示順序（住宅最多，擺第一）。 */
export const CATEGORIES: BuildingCategory[] = [
  "住宅",
  "寶可夢中心",
  "發電",
  "商店設施",
  "裝飾地標",
];

/**
 * 每個功能分類的色票：用於建築 tile 的色塊與分類 chip。刻意選暖色相鄰但可區分的
 * 色相，皆為淺底深字、對比達 WCAG AA（chip 內有文字，非唯一識別，仍附文字標籤）。
 */
export const CATEGORY_META: Record<BuildingCategory, { bg: string; ink: string }> = {
  住宅: { bg: "#f3e2c9", ink: "#6b4a1c" },
  寶可夢中心: { bg: "#f8d5cf", ink: "#8f3a34" },
  發電: { bg: "#f7e6b8", ink: "#7a5a12" },
  商店設施: { bg: "#e3e0d0", ink: "#4f4a37" },
  裝飾地標: { bg: "#e7ddc0", ink: "#5f5326" },
};

/** 住宅系列的顯示順序（次要篩選用）。 */
export const SERIES: BuildingSeries[] = [
  "城市",
  "沙地",
  "石頭",
  "灰色",
  "橙色",
  "粉色",
  "黃色",
  "葉片",
  "特色",
];

/** 每個功能分類的建築數量（給篩選 UI 顯示）。 */
export function countByCategory(): Record<BuildingCategory, number> {
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<
    BuildingCategory,
    number
  >;
  for (const b of buildings) counts[b.category] += 1;
  return counts;
}

/**
 * 搭配靈感（本站整理，非官方資料）：同系列的住宅彼此最好搭；非住宅則推同功能的其他
 * 建築。回傳建議 id 與一句理由，供詳情面板顯示。
 */
export function getPairing(id: string): { recommendedIds: string[]; reason: string } {
  const building = buildingsMap[id];
  if (!building) return { recommendedIds: [], reason: "" };

  if (building.series && building.series !== "特色") {
    const siblings = buildings
      .filter((b) => b.id !== id && b.series === building.series)
      .map((b) => b.id);
    if (siblings.length > 0) {
      return {
        recommendedIds: siblings,
        reason: `同屬「${building.series}」風格系列，整體視覺協調一致，極適合規劃為風格獨特的城鎮園區。`,
      };
    }
  }

  const REASON_BY_CATEGORY: Record<BuildingCategory, string> = {
    住宅: "同屬住宅建築，並列規劃可打造熱鬧便利的住宅生活區，容納更多寶可夢夥伴。",
    寶可夢中心: "同為寶可夢中心主題建築，搭配展示能展現豐富多樣的建築特色。",
    發電: "集中發電設施規劃，能有效提升整座園區的供電運轉效率。",
    商店設施: "結合商店與休閒設施，讓生活機能區更加健全齊備。",
    裝飾地標: "搭配其他裝飾地標，極適合共同打造兼具觀光與休閒價值的特色園區。",
  };
  const peers = buildings
    .filter((b) => b.id !== id && b.category === building.category)
    .map((b) => b.id)
    .slice(0, 4);
  return { recommendedIds: peers, reason: REASON_BY_CATEGORY[building.category] };
}

/** 含指定建築的主題選集。 */
export function getCollectionsFor(id: string): Collection[] {
  return collections.filter((c) => c.buildingIds.includes(id));
}

/**
 * 書籤導航：全部為查證過的真實網址（2026-07 確認）。官方遊戲頁、Nintendo 商店、
 * 本站資料來源（pokemonhubs 社群資料庫）與其攻略／雲島代碼、以及 GO Taiwan 社群。
 */
export const BOOKMARKS: Bookmark[] = [
  {
    label: "官方遊戲情報",
    url: "https://www.pokemon.com/us/pokemon-news/pokemon-pokopia-is-available-now-on-nintendo-switch-2",
    icon: "home",
  },
  {
    label: "Nintendo 商店",
    url: "https://www.nintendo.com/us/store/products/pokemon-pokopia-switch-2/",
    icon: "cart",
  },
  {
    label: "建築資料庫",
    url: "https://pokopia.pokemonhubs.com/buildings/",
    icon: "book",
  },
  {
    label: "攻略・雲島代碼",
    url: "https://pokopia.pokemonhubs.com/guides/",
    icon: "compass",
  },
  {
    label: "GO Taiwan IG",
    url: "https://www.instagram.com/g.o_taiwan",
    icon: "camera",
  },
  {
    label: "GO Taiwan FB",
    url: "https://www.facebook.com/PokemonGotaiwan",
    icon: "chat",
  },
];

/**
 * 建築靈感影片：Pokopia 建築教學／展示，按「建築內容類型」分 7 區（見 VideoGroup）。
 * 日系精緻建築主播（使用者精選清單）與英文速建教學不分語言、按內容混排。
 * `title`／`channel` 為 YouTube 原始資料（標題保留日文／英文原文，符合本站專有名詞慣例）；
 * 縮圖走 i.ytimg.com/vi/{id}/hqdefault.jpg，連結走 youtube.com/watch?v={id}。
 *
 * 選片依據（2026-08-18 更新）：從已知主播頻道出發，抓各頻道 videos 頁的觀看數／發布時間取「近期熱門」，
 * 並逐支用 YouTube oEmbed 查證存在＋取回官方標題（同時濾掉混入頻道的他遊戲影片，如 Disney Dreamlight
 * Valley、Splatoon Raiders、あつ森、Minecraft）。更新時沿用同一套查證流程，絕不憑印象填 id。
 * 這頁只收「建築成品／技巧」，patch notes 與 DLC 情報解析影片刻意不收。
 *
 * 本次更新動向：HorribleGaming 依舊高產，新增 Bubbly Basin DLC 的沈船海賊船與 Bleak Beach 現代海濱別墅；
 * かぴぱか create 新增了超逼真的 ENEOS 加油站（配豪力店員）與質感爆表綠電車神建築教學。
 */
export const VIDEOS: VideoInspiration[] = [
  // ── 城市・街景 ─────────────────────────────────────────────────
  {
    id: "ZgwE9xk-MOQ",
    title: "【島紹介】ぽこポケとは思えない「サイバーパンクな街」が凄すぎる！【ぽこあポケモン】",
    channel: "すくると",
    blurb: "賽博龐克風城市島導覽，霓虹高樓的震撼範例。",
    group: "city",
  },
  {
    id: "jmbUoFY4B24",
    title:
      "Pokémon Pokopia~PALETTE TOWN ENTRY DESIGN & SKYSCRAPERS~BUILDING A HUGE MODERN CITY~#pokopia  #7",
    channel: "HorribleGaming",
    blurb: "Palette Town 主題的都會入口與摩天樓群，大城市感十足。",
    group: "city",
  },
  {
    id: "qXb46YdOGLU",
    title:
      "【島紹介】ハーフティンバーで統一された街並みが凄すぎる！ポケモンたちの暮らしに密着しました！【ぽこあポケモン】",
    channel: "すくると",
    blurb: "半木造風格統一的街景導覽，學怎麼靠單一建材撐起整條街。",
    group: "city",
  },
  {
    id: "PLIl_QWZ-hE",
    title: "【ぽこあ建築】街づくり、始めました。おしゃれな建物が並ぶ大通り【ぽこあポケモン】",
    channel: "涼太ぱんけーき♭",
    blurb: "「街づくり」系列最新集，時髦建築林立的主幹道規劃。",
    group: "city",
  },
  // ── 住宅・別墅 ─────────────────────────────────────────────────
  {
    id: "PbBvHBwoxs0",
    title:
      "Pokémon Pokopia~DEEP-DIVING SUBMARINE HABITAT HOME DESIGN~BUBBLY BASIN DLC~SPEED BUILD #pokopia",
    channel: "HorribleGaming",
    blurb: "Bubbly Basin DLC 的深海潛水艇住家，示範新家具怎麼做水下棲地。",
    group: "house",
  },
  {
    id: "8JHUVsq-L2Y",
    title:
      "Pokémon Pokopia~REALISTIC MODERN VILLA HABITAT HOME DESIGN~BLEAK BEACH~SPEED BUILD~#pokopia",
    channel: "HorribleGaming",
    blurb: "Bleak Beach 的寫實現代海濱別墅，結合棲地與高級豪宅造景。",
    group: "house",
  },
  {
    id: "mf4v4YZKdao",
    title:
      "Pokémon Pokopia~REALISTIC LUXURY APARTMENTS & INTERIOR DESIGNS~MODERN CLOUD CITY DESIGN #pokopia  #6",
    channel: "HorribleGaming",
    blurb: "寫實高級公寓連室內都做滿，都會住宅的質感示範。",
    group: "house",
  },
  {
    id: "ldfA8a_GHcg",
    title: "【ぽこあ建築】雅なリゾート気分！プール付きの和風な家を建築【ぽこあポケモン】",
    channel: "涼太ぱんけーき♭",
    blurb: "附泳池的和風宅邸，度假感十足的雅致住宅。",
    group: "house",
  },
  {
    id: "-5um9Org_Ys",
    title: "【ぽこポケ】初期地形を生かす🔰地下倉庫のある水車小屋作り",
    channel: "Haruchi create",
    blurb: "有地下倉庫的水車小屋，順著地形而建的機能住宅。",
    group: "house",
  },
  {
    id: "-ZNJR9kLDvk",
    title: "Pokopia Speed Build: Hidden Cliff House by the Ocean | Step By Step Build & Tricks",
    channel: "CloudySkies Gaming",
    blurb: "海邊隱密崖頂小屋，利用高低落差蓋出絕美棲地。",
    group: "house",
  },
  {
    id: "TuhSytDfEP8",
    title:
      "【ぽこポケ】必要な素材少なめ🔰森の中の小さなコテージの作り方＆解説【ぽこあポケモン建築】",
    channel: "すくると",
    blurb: "極簡資材打造森林溫馨小木屋，新手也能輕鬆上手。",
    group: "house",
  },
  // ── 商店・餐飲 ─────────────────────────────────────────────────
  {
    id: "aLZAW3kcS9M",
    title:
      "【ぽこあ建築】ドライブスルー付き！ぽこあポケモンの世界にマクドナルドを復活させてみた【ぽこあポケモン】",
    channel: "涼太ぱんけーき♭",
    blurb: "附得來速車道的麥當勞，速食店招牌的還原度爆表。",
    group: "shop",
  },
  {
    id: "_DsoYs4VlNA",
    title:
      "Pokémon Pokopia~PALETTE TOWN MARKET STREET~FUNCTIONAL BUILD~BUILDING A HUGE CITY~#pokopia   #10",
    channel: "HorribleGaming",
    blurb: "都會市集街，把店鋪外觀與收納機能一次做齊。",
    group: "shop",
  },
  {
    id: "ESvj12yessg",
    title: "【神建築】エネオスに「カイリキー」を配置したら本物すぎたｗ│作り方│Pokopia",
    channel: "かぴぱか create",
    blurb: "加油站配上豪力店員的趣味生活設施，還原度與幽默感兼備。",
    group: "shop",
  },
  {
    id: "IutbULM6W58",
    title: "【ぽこポケ】8分でわかる！実は超簡単な「コンビニ」の作り方│建築│Pokopia",
    channel: "かぴぱか create",
    blurb: "8 分鐘學會街角便利商店，簡潔好看的實用生活設施。",
    group: "shop",
  },
  {
    id: "5NxZCRs0Ecs",
    title:
      "【ぽこポケ】ただの道が劇的に変わる！海沿いを彩る「屋台通り」の建築アイデア│建築│Pokopia",
    channel: "かぴぱか create",
    blurb: "海濱屋台街的做法，一條普通道路瞬間變熱鬧商圈。",
    group: "shop",
  },
  // ── 主題・地標・遊樂 ───────────────────────────────────────────
  {
    id: "nUQ6HgJfstg",
    title:
      "Pokémon Pokopia~SUNKEN PIRATE SHIP DESIGN~FULLY DECORATED & MULTIPLE HABITATS~BUBBLY BASIN DLC",
    channel: "HorribleGaming",
    blurb: "Bubbly Basin DLC 的沈船海賊船造景，示範如何將沉船融合寶可夢棲地。",
    group: "landmark",
  },
  {
    id: "h8a4fXpnXJU",
    title:
      "Pokémon Pokopia~HUGE MODERN AQUARIUM HABITAT DESIGN~PALETTE TOWN BIG CITY~BUBBLY BASIN #pokopia  #17",
    channel: "HorribleGaming",
    blurb: "DLC 期間蓋起的巨大現代水族館，大型室內主題設施天花板。",
    group: "landmark",
  },
  {
    id: "7nBNt4n2CYw",
    title:
      "【ぽこあポケモン】ガチで作りこんだ「巨大水上遊園地」のクオリティが限界突破すぎる…！【観覧車】ぽこポケ│建築",
    channel: "かぴぱか create",
    blurb: "有摩天輪的巨大水上遊樂園，大型主題設施天花板。",
    group: "landmark",
  },
  {
    id: "Tv9aIqSlPio",
    title:
      "期間限定ジラーチイベント！イベント限定アイテムで可愛い星空が見える家を建築してみた！【ぽこあポケモン】",
    channel: "涼太ぱんけーき♭",
    blurb: "用基拉祈活動限定道具蓋的觀星屋，星空氛圍滿分。",
    group: "landmark",
  },
  {
    id: "VszqWwdoqpM",
    title:
      "Pokemon Pokopia Insane Team Rocket HQ and Secret Laboratory Hidden In Haunted Mansion Pokopia Build",
    channel: "MSensei NTD",
    blurb: "鬼屋底下藏著火箭隊基地與秘密實驗室，敘事感滿分。",
    group: "landmark",
  },
  // ── 機關・自動化 ───────────────────────────────────────────────
  {
    id: "PPX-esFPq7s",
    title:
      "【ぽこポケ】回路基礎から木の実と野菜自動化施設づくりまで徹底解説！センサーマグマの基礎知識クロック回路と扇風機についてまるっとこの一本で理解しちゃおう【設計図付き】",
    channel: "わむのスローライフっぽい",
    blurb: "從電路基礎講到自動化農場，附設計圖的機關入門總整理。",
    group: "automation",
  },
  {
    id: "L_YmoChE4O4",
    title: "【ぽこポケ】不具合を解決した野菜と木の実自動化施設の徹底解説！サラサラ岩｜クロック回路",
    channel: "わむのスローライフっぽい",
    blurb: "全自動蔬果採收設施的修正版解說，解掉舊設計會卡住的不具合。",
    group: "automation",
  },
  {
    id: "uHzBdlva08Y",
    title:
      "Pokémon Pokopia~INDUSTRIAL CRAFTING & STORAGE WAREHOUSE~PALETTE TOWN MODERN CITY DESIGN~#pokopia #11",
    channel: "HorribleGaming",
    blurb: "工業風製作區與倉庫，把收納機能直接做成城市景觀。",
    group: "automation",
  },
  {
    id: "XuwJzDk9y8w",
    title: "The ONLY Crafting Base You Need in Pokopia! This Build FIXES Storage",
    channel: "zoibean",
    blurb: "一次解決收納痛點的製作基地，機能流必看。",
    group: "automation",
  },
  // ── 自然造景 ───────────────────────────────────────────────────
  {
    id: "spDVWmZlqh4",
    title:
      "Pokémon Pokopia~NATURAL CAMPSITE DESIGN~OVERGROWN NATURAL TOWN AESTHETIC~MULTIPLE HABITATS~ #pokopia",
    channel: "HorribleGaming",
    blurb: "野趣露營地，蔓草叢生的自然風小鎮造景。",
    group: "nature",
  },
  {
    id: "ozYyqbEnreo",
    title:
      "【ぽこポケ】苔カビゴンが祀られた世界樹【ぽこポケ建築】鳥居｜パーゴラ｜神社｜自然系｜ツタ｜巨大樹｜ツリーハウス",
    channel: "わむのスローライフっぽい",
    blurb: "供奉苔蘚卡比獸的神社世界樹，結合鳥居與綠意棲地。",
    group: "nature",
  },
  {
    id: "3Xp_GERavXU",
    title: "Natural & OVERGROWN Palette Town Tour!",
    channel: "consolecaito",
    blurb: "蔓草叢生的自然風城鎮導覽，看綠意怎麼吃進街區。",
    group: "nature",
  },
  {
    id: "Bi_xDPh9Vmo",
    title:
      "【ぽこあ建築】癒やし効果あり？草・虫ポケモン達がのんびり暮らせる楽園を建築【ぽこあポケモン】",
    channel: "涼太ぱんけーき♭",
    blurb: "草系與蟲系寶可夢的療癒樂園，綠意盎然的棲地造景。",
    group: "nature",
  },
  // ── 設計技巧・綜合 ─────────────────────────────────────────────
  {
    id: "NnJHT0kCq5s",
    title: "【ぽこポケ】置くだけでかわいい！5種類の乗り物の作り方＆解説【ぽこあポケモン建築】",
    channel: "すくると",
    blurb: "只要擺上就很可愛，5 種載具小物的做法解說。",
    group: "tips",
  },
  {
    id: "xk-E14UmuMQ",
    title: "【ぽこあポケモン】クオリティ爆発！エモすぎる「レトロな緑の電車」の作り方【神建築】",
    channel: "かぴぱか create",
    blurb: "超質感復古綠色電車教學，教你用基礎塊做出驚豔載具。",
    group: "tips",
  },
  {
    id: "xcJPJnO54BA",
    title: "【ぽこあポケモン】狭い場所でも作れる！省スペースクリエイト5選【作り方】",
    channel: "かぴぱか create",
    blurb: "狹窄空地也塞得下的 5 種省空間建築，補洞的好用招式。",
    group: "tips",
  },
  {
    id: "9kb5lr5zT_o",
    title:
      "【ぽこポケ】整地する前にみて！壊したらあかんアイテムを紹介！！【資料の活用方法も解説】こわれたアーチタイル、こわれたまちの街灯、こわれた本棚",
    channel: "わむのスローライフっぽい",
    blurb: "整地前必看：哪些既有物件千萬別拆，拆了就再也拿不回來。",
    group: "tips",
  },
  {
    id: "7mnOUEO8WdE",
    title:
      "8 Amazing Builds You Need for Pokemon Pokopia Inspiration and Ideas Haunted Mansions, Farms and More",
    channel: "MSensei NTD",
    blurb: "8 個腦洞大開的建築展示，鬼屋、農場都有，找靈感首選。",
    group: "tips",
  },
];
