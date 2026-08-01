# PTCG Pocket Display Code — 可行性探測工具

用來回答一個問題：**遊戲產生的「Display Code」到底是不是標準 QR，如果是，
payload 是自足的牌組資料還是伺服器發的 token？**

在拿到截圖之前，這裡先把「圖片 → 資料」這一層的工具建好並驗證過。
**目前尚未分析任何實際的遊戲截圖**，還沒有任何關於 Display Code 的結論。

範圍限制：全部只做「圖片 → 資料」。不碰遊戲的網路請求、帳號認證、伺服器 API。

## 為什麼是自己寫的解碼器

這個容器的 egress policy 擋掉了 PyPI、npm registry 與所有 CDN（實測皆 403），
`zxing-cpp`、`pyzbar`、`opencv`、`jsQR`、`sharp` 一個都裝不了，也不能從 GitHub
attach 外部 repo。所以整條管線都是 stdlib 自己實作的：PNG 解碼、二值化、
finder pattern 偵測、透視取樣、BCH、Reed–Solomon、bitstream 解析。

這帶來一個風險必須先處理掉：**自己寫的編碼器與解碼器可能「一起錯」**——
彼此自洽但不符標準，那麼真實 QR 會解不開，而我會誤以為是遊戲用了自訂編碼。
下面的驗證就是為了消滅這個風險。

## 驗證（全部可重跑）

```bash
node gen_reference.cjs > ref.jsonl && python3 compare_encoder.py < ref.jsonl
python3 tests.py
python3 test_degraded.py
```

### 1. 對照獨立實作：3840 個矩陣逐模組相同

npm 自己內建了一份 Kazuhiko Arase 的 QRCode 函式庫
（`qrcode-terminal/vendor/QRCode`），與本專案的程式碼毫無關係。
`gen_reference.cjs` 用它產生 40 個版本 × 4 個 EC 等級 × 8 個 mask × 3 種
payload 長度的矩陣，`compare_encoder.py` 用我們的編碼器重建同一批並逐模組比對。

**結果：3840 / 3840 完全相同。**

這一步驗證的正是「自洽但非標準」會漏掉的東西：資料放置的 zigzag 順序、
mask 函式的行列方向、format information 的位置與位元順序、區塊交錯順序、
Reed–Solomon 的生成多項式與參數。

過程中抓到兩個實際的錯誤：

- **我們這邊**：format information 沿左上角 L 形的位元順序寫反了。已修正
  （`qrspec.FORMAT_VERTICAL` / `FORMAT_HORIZONTAL`）。
- **參考實作那邊**：npm 內建那份的 version 15 / level H 表格是 `[11, 36, 12]`，
  合計 396 個 codeword，但 version 15 的矩陣容得下 655 個——少了 `[7, 37, 13]`
  這一組。整張 40×4 表格只有這一格與幾何推算的 codeword 總數不符，
  所以是它的 typo，不是我們的。`gen_reference.cjs` 裡有針對性修補並註明原因。

### 2. 對照公開常數

`tests.py` 比對 32 個 format information 位元串、version information 位元串、
alignment pattern 座標、各版本 data codeword 數量，以及公開的
「HELLO WORLD」version 1-Q 逐 codeword 範例（資料段與 EC 段都對）。

另外 66 個 BCH 值（34 個 version info + 32 個 format info）也全部與獨立實作相符。

（過程中我自己記錯了兩個「公開常數」——version 20 的 version-information 位元串，
以及把 861 這個數字記成 20-M 而實際上是 20-L。是測試資料寫錯，不是程式錯，
兩者都已更正。）

### 3. 往返與抗劣化

- 416 組 version / EC / mask 組合的矩陣層往返，payload 逐位元組相同
- 27 張實際算繪出來的圖片走完整管線（含 finder 偵測與取樣）
- Reed–Solomon 在 225 個區塊上以**理論上限**（每區塊 ⌊ec/2⌋ 個錯誤 codeword）測試，全部完全復原
- 隨機雜訊矩陣 40 次全部被拒絕（不會假陽性）
- **16 / 16 種截圖劣化情境可解**：縮放到 35%、放大 2 倍、JPEG 品質 25、
  旋轉 20 度、模糊 1.5px，以及這些的組合

最後一項是關鍵：這代表如果之後真實截圖解不出來，那個失敗是有意義的，
而不是「聊天軟體壓過就會這樣」。

## 用法

```bash
# 第一層：讀碼。讀不出來會自動退回結構分析
python3 probe.py decode display_code.png

# 只做結構分析
python3 probe.py analyze display_code.png

# 第二層：解多張並逐位元組比對 payload
python3 probe.py compare original.png one_card_changed.png different_deck.png
```

`decode` 會印出 QR 版本、EC 等級、mask、模組尺寸、修正了幾個 RS 符號，
以及 **payload 的 hex dump 與長度**，還有 Reed–Solomon 之後、
segment 解析之前的 **raw data codewords**——因為 payload 未必是乾淨的文字段。
payload 會另存到 `payloads/`。

`compare` 會印出長度差異、相異位元組的比例、**每個相異位元組的偏移與前後值**，
以及連續變動區段，用來判斷「改一張卡」是否只造成局部變動。

`analyze` 在讀不出來時給出結構證據：finder pattern 有幾個、在哪裡、
模組尺寸、推得的矩陣維度與是否符合 21+4n、timing pattern 交替率、
quiet zone、以及**色彩統計（相異色數、平均飽和度）**——用來判斷是不是拿顏色多塞資料。

## 判讀方式

第一層：

- 讀得出來 → 標準 QR，往第二層
- 讀不出來，但有三個 finder、模組格線規則、維度符合 21+4n、只有黑白
  → 疑似標準 QR 但取樣有問題，需要更好的圖
- 讀不出來，且無 finder / 維度不符 21+4n / 多於兩色
  → 自訂編碼，我們無法自行產碼

第二層（三份 payload 比對）：

- 改一張卡 → 局部變動、長度與卡片數相關 → 自足牌組資料，有機會自己產碼
- payload 短、長度固定、與牌組內容無明顯關聯 → 伺服器 token，此路不通

## 檔案

| 檔案 | 作用 |
| --- | --- |
| `probe.py` | CLI 進入點（decode / analyze / compare） |
| `qrspec.py` | 規格表格、GF(256)、BCH、mask、區塊配置 |
| `qrencode.py` | 編碼器（只為了產生驗證用的 ground truth） |
| `qrdecode.py` | 解碼器：二值化 → finder → 透視取樣 → BCH → RS → bitstream |
| `rsdecode.py` | Reed–Solomon 解碼（Berlekamp–Massey / Chien / Forney） |
| `analyze.py` | 解不出來時的結構分析 |
| `imageio.py` | 純 stdlib 的 PNG 編解碼 |
| `chrome_bridge.py` | 用內建 Chromium 處理 JPEG 等格式，並製造劣化測試樣本 |
| `gen_reference.cjs` | 用 npm 內建的獨立實作產生對照矩陣 |
| `compare_encoder.py` | 逐模組比對我們的編碼器與對照實作 |
| `tests.py` / `test_degraded.py` | 驗證套件 |

## 已知限制

- 解碼器只處理單一符號。若 Display Code 用了 **Structured Append**（把資料拆到
  多張碼），`probe.py` 會把該 header 當作 segment 印出來，但不會自動合併——
  真的遇到再處理。
- 尚未在真實相機拍攝的照片上測過（只有算繪 + 程式化劣化）。截圖是主要情境，
  這點影響不大。
- 色彩分析只回報統計數字，不會嘗試解讀彩色編碼；真的是彩色碼的話那是另一項工作。
