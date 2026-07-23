/**
 * 站台層級的常數。canonical、og:image、sitemap 都要絕對網址，
 * 各處硬編會在換網域時漏改，統一放這裡。
 *
 * `scripts/generate-sitemap.mjs` 也是 import 這支（走 Node 的 type stripping），
 * 所以前端與建置腳本用的是同一個來源。
 */
export const SITE_URL = "https://bubble.19980803.xyz";

/** 把站內路徑接成絕對網址。傳入的 path 要以 "/" 開頭。 */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}
