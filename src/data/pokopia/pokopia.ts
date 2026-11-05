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
 * 選片依據（2026-11-05 更新）：從已知主播頻道出發，抓各頻道 videos 頁的觀看數／發布時間，再用 YouTube
 * 搜尋（本月上傳、依觀看數）補上新冒出的熱門建築主播，並逐支用 YouTube oEmbed 查證存在＋取回官方標題
 * （同時濾掉混入頻道的他遊戲影片，如 Disney Dreamlight Valley、Splatoon、あつ森、Minecraft）。
 * 更新時沿用同一套查證流程，絕不憑印象填 id。這頁只收「建築成品／技巧」，patch notes、活動攻略、
 * DLC 情報解析與密室逃脫地圖遊玩影片刻意不收。
 *
 * 本次更新動向：涼太ぱんけーき♭ 轉做 Pokopia 密室逃脫與 Splatoon、かぴぱか create 轉做 Minecraft、
 * すくると與わむ近 3–5 個月沒有新作，三者只留經典作；HorribleGaming 仍高產（萬聖鬼鎮系列）。
 * 新進的是近期熱門的日系建築主播（めいチャンネル、ゆりも、mayu channel、ちょちょ、おもち等），
 * 萬聖節活動家具帶出一波鬼屋／糖果店作品。
 */
export const VIDEOS: VideoInspiration[] = [
  // ── 城市・街景 ─────────────────────────────────────────────────
  {
    id: "QsEdzP7cbwo",
    title:
      "【ぽこあポケモン】元の地形を活かしたおしゃれな街づくり！ドンヨリうみべの入口を再建&アレンジ",
    channel: "めいチャンネル",
    blurb: "保留原始地形重建陰沉海濱入口，學怎麼順著地勢排出時髦街區。",
    group: "city",
  },
  {
    id: "tHCqlnJKaYM",
    title:
      "【ぽこポケ】ゲートまわりの高低差を活かした街並み🛟| ドンヨリうみべの街づくり【pokopia build】",
    channel: "mayu channel",
    blurb: "活用大門周邊高低差的海濱街景，層次感的好範本。",
    group: "city",
  },
  {
    id: "iGqfPRKHjQo",
    title: "海底の町の建築、はじまるよ～！｜ぽこあポケモンDLC #1",
    channel: "ジャック・オ・蘭たん",
    blurb: "DLC 海底小鎮從零開始蓋，看水下城鎮怎麼規劃起步。",
    group: "city",
  },
  {
    id: "ZgwE9xk-MOQ",
    title: "【島紹介】ぽこポケとは思えない「サイバーパンクな街」が凄すぎる！【ぽこあポケモン】",
    channel: "すくると",
    blurb: "賽博龐克風城市島導覽，霓虹高樓的震撼範例。",
    group: "city",
  },
  // ── 住宅・別墅 ─────────────────────────────────────────────────
  {
    id: "0PSHgL4sYJk",
    title: "【ハロウィンイベント】ゴーストポケモンが暮らすお屋敷づくり|ゴツゴツ山｜ ぽこあポケモン",
    channel: "ゆりも / Yurimo",
    blurb: "用萬聖節活動家具替幽靈寶可夢蓋宅邸，氣氛與細節兼具。",
    group: "house",
  },
  {
    id: "xLzAX9RsFLM",
    title: "大自然のロマン！リーフィア家完成！【ぽこあポケモン】",
    channel: "Asuka",
    blurb: "像世界樹一樣的葉伊布之家完成篇，自然系住宅的浪漫做法。",
    group: "house",
  },
  {
    id: "BgrIUQTrobU",
    title: "【ぽこあポケモン】一階がセブンイレブンのアパートを建築",
    channel: "RASEN / ラセン",
    blurb: "一樓是 7-Eleven 的公寓，住商混合的寫實都會住宅。",
    group: "house",
  },
  {
    id: "maViVm0MY00",
    title: "【ぽこあポケモン】可愛くておしゃれな家の作り方 ｜ 2軒｜Pokémon Pokopia",
    channel: "komame🐶🥑",
    blurb: "兩棟可愛又時髦的小屋做法，照著蓋就有成品。",
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
    id: "TuhSytDfEP8",
    title:
      "【ぽこポケ】必要な素材少なめ🔰森の中の小さなコテージの作り方＆解説【ぽこあポケモン建築】",
    channel: "すくると",
    blurb: "極簡資材打造森林溫馨小木屋，新手也能輕鬆上手。",
    group: "house",
  },
  {
    id: "-5um9Org_Ys",
    title: "【ぽこポケ】初期地形を生かす🔰地下倉庫のある水車小屋作り",
    channel: "Haruchi create",
    blurb: "有地下倉庫的水車小屋，順著地形而建的機能住宅。",
    group: "house",
  },
  // ── 商店・餐飲 ─────────────────────────────────────────────────
  {
    id: "uNott9f_Xqc",
    title: "【ぽこポケ】建築キットが大変身！可愛いお家とおしゃれカフェ🪴☕｜ Pokopia ｜建築キット",
    channel: "momota",
    blurb: "把建築套組改造成可愛小屋與咖啡廳，省工又有質感。",
    group: "shop",
  },
  {
    id: "u8AKBCXXIKI",
    title:
      "【ぽこあポケモン】ガラス窓の古民家カフェ☕️🌿 | ゴツゴツ山 | Traditional Japanese house café Build 【建築】",
    channel: "ali🌳",
    blurb: "玻璃窗古民家咖啡廳，和風老屋改店的溫潤氛圍。",
    group: "shop",
  },
  {
    id: "JxVbfnT-OkM",
    title: "【ぽこあポケモン】ハロウィンのお菓子屋さん🎃 イベント家具を使ったお店づくり｜建築",
    channel: "あゆ create",
    blurb: "用萬聖節活動家具開一間糖果店，季節限定小店的範例。",
    group: "shop",
  },
  {
    id: "aLZAW3kcS9M",
    title:
      "【ぽこあ建築】ドライブスルー付き！ぽこあポケモンの世界にマクドナルドを復活させてみた【ぽこあポケモン】",
    channel: "涼太ぱんけーき♭",
    blurb: "附得來速車道的麥當勞，速食店招牌的還原度爆表。",
    group: "shop",
  },
  // ── 主題・地標・遊樂 ───────────────────────────────────────────
  {
    id: "K5RjLhCioq0",
    title: "【ぽこあポケモン】ホーンテッドマンションを建築してみた！ | Haunted Mansion【Pokopia】",
    channel: "Multi Craft",
    blurb: "還原迪士尼幽靈公館，大型主題鬼屋的地標級作品。",
    group: "landmark",
  },
  {
    id: "CUUNAf-09do",
    title:
      "【ぽこポケ】#01🎃ハロウィンアイテムを使ってダイアゴン横丁を作る🧹｜ ゴツゴツやま｜ぽこあポケモンの街づくり｜The Enchated Town【Pokémon Pokopia build】",
    channel: "みみまる",
    blurb: "用萬聖節道具打造斜角巷，魔法街道的主題造景。",
    group: "landmark",
  },
  {
    id: "JGeetw7xMLk",
    title: "チョンチーとランターンの深海ラボ｜ブクブクうみぞこ | ぽこあポケモン",
    channel: "ゆりも / Yurimo",
    blurb: "替燈籠魚與電燈怪蓋的深海研究所，DLC 水下主題設施。",
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
  // ── 機關・自動化 ───────────────────────────────────────────────
  {
    id: "H4EPU1P1bgU",
    title:
      "【ぽこあポケモン】ライト点灯＆ゆうれいスモークが自動で動くハロウィン墓地建築🪦👻クロック回路の作り方！【初心者向け】",
    channel: "おもちだっちゃ",
    blurb: "燈光與幽靈煙霧自動運作的萬聖墓地，新手向時脈電路教學。",
    group: "automation",
  },
  {
    id: "IqNU_Fuu1Zc",
    title: "I Automated My Pokopia Farm! - Explained",
    channel: "Super Galom",
    blurb: "全自動農場的機關原理拆解，英文但圖解清楚。",
    group: "automation",
  },
  {
    id: "PPX-esFPq7s",
    title:
      "【ぽこポケ】回路基礎から木の実と野菜自動化施設づくりまで徹底解説！センサーマグマの基礎知識クロック回路と扇風機についてまるっとこの一本で理解しちゃおう【設計図付き】",
    channel: "わむのスローライフっぽい",
    blurb: "從電路基礎講到自動化農場，附設計圖的機關入門總整理。",
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
    id: "NlUQMSsJGDo",
    title: "【ぽこポケ】コイキングとギャラドスのすみか｜滝壺づくり🐉",
    channel: "ちょちょ",
    blurb: "鯉魚王與暴鯉龍的瀑布深潭棲地，水景造景的高人氣範例。",
    group: "nature",
  },
  {
    id: "PPYu0saIBe4",
    title: "元の地形を活かした段々畑づくり！崖×建築キットでパサパサこうやを開拓",
    channel: "ぽこあタウン koa",
    blurb: "利用懸崖地形做梯田，把乾燥荒野開墾成田園風景。",
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
    id: "spDVWmZlqh4",
    title:
      "Pokémon Pokopia~NATURAL CAMPSITE DESIGN~OVERGROWN NATURAL TOWN AESTHETIC~MULTIPLE HABITATS~ #pokopia",
    channel: "HorribleGaming",
    blurb: "野趣露營地，蔓草叢生的自然風小鎮造景。",
    group: "nature",
  },
  // ── 設計技巧・綜合 ─────────────────────────────────────────────
  {
    id: "OGsepaY22-M",
    title:
      "【ぽこポケ】知らないと損！小さくて可愛い建築アイディア３０選！｜ぽこあポケモン｜pokopia｜建築",
    channel: "おもち",
    blurb: "30 個小巧可愛的建築點子，填空地、補細節的靈感庫。",
    group: "tips",
  },
  {
    id: "fP4MAnNBkVs",
    title: "【ぽこあポケモン】草花やラグを空中に浮かせる新技！やり方と建築アイデア8選🌸",
    channel: "めいチャンネル",
    blurb: "讓花草與地毯懸空的新技巧，附 8 個應用建築點子。",
    group: "tips",
  },
  {
    id: "4fOkvKSxzko",
    title:
      "【ぽこポケ】空き地に困った時の隙間うめミニ建築を考えてみる！自然エリア編【ゆっくり実況】【ぽこあポケモン】",
    channel: "にこたま",
    blurb: "自然區的空地補洞迷你建築，不知道放什麼時的解方。",
    group: "tips",
  },
  {
    id: "dgfJDyxJ48U",
    title: "How I Build Realistic Cities in Pokémon Pokopia | City Planning Guide",
    channel: "Vanni’s Cozy World",
    blurb: "寫實城市的規劃思路：道路、分區與比例的通用原則。",
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
];
