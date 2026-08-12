/**
 * 最小的 SFNT（TrueType/OpenType）表格讀取，只做字型子集管線需要的兩件事。
 * subset-fonts.mjs 與 check-font-coverage.mjs 共用，別各寫一份。
 */

/**
 * 讀 fvar 的可變軸。
 *
 * 為什麼要自己讀：`document.fonts.check()` 對 400/500/600/700 全回 true，
 * 只代表 CSS 宣告了 `font-weight: 400 700`，**不代表** wght 軸還在。
 * 軸被實例化掉的話，600 會靜靜地被算繪成 400（或合成粗體），檢查工具看不出來。
 */
export function readAxes(sfnt) {
  const off = findTable(sfnt, "fvar");
  if (off < 0) return [];
  const axesOffset = off + sfnt.readUInt16BE(off + 4);
  const axisCount = sfnt.readUInt16BE(off + 8);
  const axisSize = sfnt.readUInt16BE(off + 10);
  const axes = [];
  for (let a = 0; a < axisCount; a++) {
    const p = axesOffset + a * axisSize;
    const fixed = (o) => sfnt.readInt32BE(p + o) / 65536;
    axes.push({
      tag: sfnt.toString("latin1", p, p + 4),
      min: fixed(4),
      default: fixed(8),
      max: fixed(12),
    });
  }
  return axes;
}

/**
 * 讀 cmap，回傳「真的有字圖」的 codepoint 集合。
 *
 * 只認 format 4 與 format 12——Unicode 子表用的就這兩種，
 * 前者涵蓋 BMP，後者涵蓋補充平面。
 */
export function readCmap(sfnt) {
  const covered = new Set();
  const cmapOffset = findTable(sfnt, "cmap");
  if (cmapOffset < 0) throw new Error("字型沒有 cmap 表");

  const numSub = sfnt.readUInt16BE(cmapOffset + 2);
  for (let i = 0; i < numSub; i++) {
    const sub = cmapOffset + sfnt.readUInt32BE(cmapOffset + 4 + i * 8 + 4);
    const format = sfnt.readUInt16BE(sub);

    if (format === 4) {
      const segX2 = sfnt.readUInt16BE(sub + 6);
      const endBase = sub + 14;
      const startBase = endBase + segX2 + 2;
      const deltaBase = startBase + segX2;
      const rangeBase = deltaBase + segX2;
      for (let s = 0; s < segX2 / 2; s++) {
        const end = sfnt.readUInt16BE(endBase + s * 2);
        const start = sfnt.readUInt16BE(startBase + s * 2);
        if (start === 0xffff) continue;
        const delta = sfnt.readInt16BE(deltaBase + s * 2);
        const rangeOffset = sfnt.readUInt16BE(rangeBase + s * 2);
        for (let cp = start; cp <= end; cp++) {
          let gid;
          if (rangeOffset === 0) {
            gid = (cp + delta) & 0xffff;
          } else {
            const gi = rangeBase + s * 2 + rangeOffset + (cp - start) * 2;
            if (gi + 1 >= sfnt.length) continue;
            gid = sfnt.readUInt16BE(gi);
            if (gid !== 0) gid = (gid + delta) & 0xffff;
          }
          if (gid !== 0) covered.add(cp);
        }
      }
    } else if (format === 12) {
      const nGroups = sfnt.readUInt32BE(sub + 12);
      for (let g = 0; g < nGroups; g++) {
        const p = sub + 16 + g * 12;
        const start = sfnt.readUInt32BE(p);
        const end = sfnt.readUInt32BE(p + 4);
        if (sfnt.readUInt32BE(p + 8) === 0) continue;
        for (let cp = start; cp <= end; cp++) covered.add(cp);
      }
    }
  }
  return covered;
}

function findTable(sfnt, tag) {
  const numTables = sfnt.readUInt16BE(4);
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    if (sfnt.toString("latin1", rec, rec + 4) === tag) return sfnt.readUInt32BE(rec + 8);
  }
  return -1;
}
