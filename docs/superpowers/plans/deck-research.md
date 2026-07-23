# TCG Pocket 牌組研究記錄（Guide Task 1）

日期：2026-07-19
環境：B3b「Everyday Wonders」Standard（來源：Limitless，80 場賽事 / 6,956 名玩家 / 18,453 場對戰）

## 資料源重大發現（偏離原 spec，需使用者確認）

原 spec 規劃用 TCGdex 取卡名/卡圖，但實查發現 **TCGdex 的 TCG Pocket 只收錄到 B2a**，缺 B3 / B3a / B3b / A4b / PROMO-B——當前 meta 五套牌有四套用到這些新卡。改用替代源（已逐項驗證可用）：

- **卡片資料**：[flibustier/pokemon-tcg-pocket-database](https://github.com/flibustier/pokemon-tcg-pocket-database)（v2.8.0「Everyday Wonders」2026-06-30，覆蓋 A1–B3b + PROMO-A/B）
  `https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/main/dist/cards/{SET}.json`
- **卡圖**：姊妹 repo [pokemon-tcg-exchange](https://github.com/flibustier/pokemon-tcg-exchange)
  `https://raw.githubusercontent.com/flibustier/pokemon-tcg-exchange/main/public/images/cards-by-set/{SET}/{number}.webp`
  （實測 A1/36、B3/81、B3b/41、PROMO-A/7、PROMO-B/51 全部 HTTP 200）
- **卡 id 慣例**：`{SET}-{number}`，編號不補零（如 `B3b-41`、`PROMO-A-7`）。Limitless 的 `P-A`/`P-B` 對映為 `PROMO-A`/`PROMO-B`。
- 全部 5 套牌 47 張不重複卡已逐張對 flibustier 資料庫驗證：卡名全部吻合（唯一差異為撇號字形 `'`/`’`）。

## 五套牌組（tier 為人工初評：勝率+使用率綜合）

### 1. Miraidon ex Magnezone — Tier S（use 10.09%，WR 52.78%，雷）

來源牌表：tornado1，The Dankest Cup #3 冠軍納入賽。

| 張數 | 卡名                 | id        |
| ---- | -------------------- | --------- |
| 2    | Magnemite            | B1a-24    |
| 2    | Magneton             | A1-98     |
| 1    | Magnezone            | B1a-26    |
| 2    | Miraidon ex          | B3a-19    |
| 2    | Zeraora              | A3a-21    |
| 2    | Professor's Research | PROMO-A-7 |
| 1    | Professor Turo       | B3a-73    |
| 1    | Copycat              | B1-225    |
| 1    | Cyrus                | A2-150    |
| 1    | Lisia                | B1-226    |
| 1    | Clemont              | B1a-68    |
| 1    | Sabrina              | A1-225    |
| 2    | Poké Ball            | PROMO-A-5 |
| 1    | Giant Cape           | A2-147    |

合計 20 ✓

### 2. Mega Sceptile ex Greninja — Tier S（use 6.20%，WR 52.82%，草）

來源牌表：koehearts（BOAT | Koe），9-2-1。

| 張數 | 卡名                 | id        |
| ---- | -------------------- | --------- |
| 2    | Treecko              | B3-5      |
| 1    | Grovyle              | B3-6      |
| 1    | Mega Sceptile ex     | B3-8      |
| 1    | Froakie              | A1-87     |
| 1    | Greninja             | A1-89     |
| 1    | Pheromosa            | A3a-7     |
| 1    | Furfrou              | B3b-61    |
| 2    | Professor's Research | PROMO-A-7 |
| 2    | Copycat              | B1-225    |
| 1    | Cyrus                | A2-150    |
| 1    | Juliana              | B3a-71    |
| 2    | Poké Ball            | PROMO-A-5 |
| 2    | Rare Candy           | A3-144    |
| 1    | Small Balloon        | B3b-64    |
| 1    | Rocky Helmet         | A2-148    |

合計 20 ✓

### 3. Greninja Mega Sableye ex — Tier A（use 6.47%，WR 46.98%，惡）

使用率第二但勝率偏低——收錄理由：賽場常見度高，認識它才知道怎麼打它。來源牌表：hasalf。

| 張數 | 卡名                 | id        |
| ---- | -------------------- | --------- |
| 2    | Froakie              | A1-87     |
| 2    | Greninja             | A1-89     |
| 2    | Chingling            | B1-109    |
| 1    | Mega Absol ex        | B1-151    |
| 1    | Darkrai ex           | A2-110    |
| 1    | Mega Sableye ex      | B3b-41    |
| 2    | Professor's Research | PROMO-A-7 |
| 2    | Copycat              | B1-225    |
| 1    | Cyrus                | A2-150    |
| 2    | Poké Ball            | PROMO-A-5 |
| 2    | Rare Candy           | A3-144    |
| 1    | Small Balloon        | B3b-64    |
| 1    | Lucky Egg            | B3-148    |

合計 20 ✓

### 4. Suicune ex Baxcalibur — Tier A（use 6.18%，WR 52.64%，水）

來源牌表：dot1，PMPT Holiday Special。**本套為唯一全卡皆在 TCGdex 覆蓋範圍的牌組（≤B2a）。**

| 張數 | 卡名                 | id        |
| ---- | -------------------- | --------- |
| 2    | Frigibax             | B2a-34    |
| 2    | Baxcalibur           | B2a-36    |
| 2    | Suicune ex           | A4a-20    |
| 1    | Chien-Pao ex         | B2a-37    |
| 2    | Professor's Research | PROMO-A-7 |
| 2    | Copycat              | B1-225    |
| 1    | Pokémon Center Lady  | A2b-70    |
| 2    | Poké Ball            | PROMO-A-5 |
| 2    | Rare Candy           | A3-144    |
| 2    | Giant Cape           | A2-147    |
| 1    | Inflatable Boat      | A4a-67    |
| 1    | Starting Plains      | B2-154    |

合計 20 ✓

### 5. Mega Lucario ex Lucario — Tier A（use 5.12%，WR 51.10%，鬥）

來源牌表：hansuwe。Limitless 頁面能量欄抓到「Lightning」判定為抽取誤差：整套無雷系攻擊手、主攻 Mega Lucario ex 為鬥系，能量定為 Fighting。

| 張數 | 卡名                 | id         |
| ---- | -------------------- | ---------- |
| 1    | Riolu                | A2-91      |
| 1    | Riolu                | B3-79      |
| 2    | Mega Lucario ex      | B3-81      |
| 1    | Lucario              | A2-92      |
| 1    | Hitmonlee            | A1-154     |
| 1    | Zygarde              | PROMO-B-51 |
| 2    | Professor's Research | PROMO-A-7  |
| 1    | Sabrina              | A1-225     |
| 1    | Cyrus                | A2-150     |
| 1    | Pokémon Center Lady  | A2b-70     |
| 1    | Copycat              | B1-225     |
| 1    | Korrina              | B3-149     |
| 2    | Poké Ball            | PROMO-A-5  |
| 1    | X Speed              | PROMO-A-2  |
| 1    | Rocky Helmet         | A2-148     |
| 1    | Protective Poncho    | B2-147     |
| 1    | Arena of Antiquity   | B3-154     |

合計 20 ✓

## 涵蓋 set（給 Task 2 腳本的 SETS 常數）

`A1, A2, A2b, A3, A3a, A4a, B1, B1a, B2, B2a, B3, B3a, B3b, PROMO-A, PROMO-B`

（`A1a`、`A3b`、`A4`、`A4b`、`B2b` 目前無牌組引用，先不抓；日後加牌組再擴充。）
