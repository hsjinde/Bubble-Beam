/**
 * 把結構化資料包成 TanStack `head()` 的 scripts 項目。
 *
 * `<` 一律轉義成 `<`：JSON 內容若出現 `</script>` 會提前關掉標籤，
 * 把後面的資料當成 HTML 解析。目前的牌組名不會產生這種字串，但結構化資料
 * 是直接吃使用者可編輯的 `decks.ts` 內容，不該依賴「現在剛好沒有」。
 */
export function jsonLdScript(data: unknown) {
  return {
    type: "application/ld+json",
    children: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}

/** 麵包屑。position 從 1 起算，最後一項是目前頁面。 */
export function breadcrumbList(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
