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
 * 選片依據（2026-08 更新）：從使用者精選清單的主播出發，抓各頻道 videos 頁的觀看數／發布
 * 時間取「近期熱門」，並逐支用 YouTube oEmbed 查證存在＋取回官方標題（同時濾掉混入頻道的
 * 他遊戲影片，如 Disney Dreamlight Valley、Splatoon、あつ森）。更新時沿用同一套查證流程，
 * 別憑印象填 id。
 *
 * 本次主播動向：HorribleGaming 仍最高產（Palette Town 都會系列）；すくると 轉以島嶼導覽為主；
 * 涼太ぱんけーき♭ 大幅轉向 Splatoon，但仍有「街づくり」建築系列；かぴぱか create 穩定產出短片
 * 教學；わむのスローライフっぽい 產能下降，保留其自動化經典；Haruchi create 已轉做他款遊戲，
 * 只留仍在射程內的 Pokopia 作品。
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
    id: "IOSVHqn7juU",
    title:
      "【島紹介】配色センスが天才すぎる！ポケモンたちが暮らす街を案内してもらいました！【ぽこあポケモン】",
    channel: "すくると",
    blurb: "配色功力驚人的玩家城鎮導覽，學怎麼用色統一整條街。",
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
    id: "vghz7UzZNqs",
    title: "【島紹介】1000時間プレイで作られた超巨大建築が凄すぎる！【ぽこあポケモン】",
    channel: "すくると",
    blurb: "遊玩上千小時打造的超巨大建築島導覽，開眼界找靈感。",
    group: "city",
  },
  {
    id: "RuvgHYT5g_U",
    title: "【ぽこあ建築】街づくり、始めました。大きな建物が並ぶ海沿いの区画【ぽこあポケモン】",
    channel: "涼太ぱんけーき♭",
    blurb: "「街づくり」系列開篇，大型建築林立的海濱街區規劃。",
    group: "city",
  },
  // ── 住宅・別墅 ─────────────────────────────────────────────────
  {
    id: "mf4v4YZKdao",
    title:
      "Pokémon Pokopia~REALISTIC LUXURY APARTMENTS & INTERIOR DESIGNS~MODERN CLOUD CITY DESIGN #pokopia  #6",
    channel: "HorribleGaming",
    blurb: "寫實高級公寓連室內都做滿，都會住宅的質感示範。",
    group: "house",
  },
  {
    id: "8JHUVsq-L2Y",
    title:
      "Pokémon Pokopia~REALISTIC MODERN VILLA HABITAT HOME DESIGN~BLEAK BEACH~SPEED BUILD~#pokopia",
    channel: "HorribleGaming",
    blurb: "寫實現代別墅，蓋在荒涼海灘上的質感住宅。",
    group: "house",
  },
  {
    id: "96hdbbHQAB0",
    title: "【ぽこポケ】パサパサこうやの街に洋風なお家を建設すること🏠自宅づくり｜建築｜クリエイト",
    channel: "Haruchi create",
    blurb: "在乾荒野地帶蓋起洋風自宅，地形不討喜時的住宅解法。",
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
    id: "9K2Og05Gjqc",
    title: "【ぽこあ建築】ぽこあポケモンの世界にスターバックスを復活させてみた！【ぽこあポケモン】",
    channel: "涼太ぱんけーき♭",
    blurb: "把星巴克搬進遊戲，連綠色招牌與座位區都還原。",
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
    id: "KHAWKAGoYVg",
    title:
      "【島紹介】見たら絶対に訪れたくなる素敵な水族館を案内してもらいました！【ぽこあポケモン】",
    channel: "すくると",
    blurb: "玩家自製水族館導覽，大型室內主題設施的天花板。",
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
    id: "QVI2GcpxUrY",
    title: "【ぽこポケ】初心者が１か月かけてシンデレラ城を再現してみた！【ぽこあポケモン建築】",
    channel: "すくると",
    blurb: "1 個月打造灰姑娘城堡，夢幻壯觀的童話地標。",
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
    id: "YPI0Z18XOs4",
    title:
      "【ぽこポケ】さらさらいわ使って野菜と木の実完全自動化の世界樹作ってみた！水流で一か所に集まるから一吸いで収穫完了！",
    channel: "わむのスローライフっぽい",
    blurb: "利用細沙岩與水流達成全自動化採收世界樹，效率極高。",
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
    id: "Ec2pAFJDuWY",
    title: "I Built A Jungle Camp Hideout in Pokopia (+ New Gem Hunt Event Items!)",
    channel: "CloudySkies Gaming",
    blurb: "叢林營地藏身處，順帶示範寶石活動的新道具怎麼用。",
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
    blurb: "復古綠皮電車做法，擺一台就撐起整個場景的氛圍。",
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
