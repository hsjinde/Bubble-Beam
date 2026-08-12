import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { absoluteUrl } from "../lib/site";

/**
 * 防止深色模式首畫面白閃。
 *
 * SSR 產出的 HTML 不知道使用者偏好，若等 hydrate 後才加 class，深色模式
 * 使用者會先看到一幀白底。這段必須是**同步**、無相依、自包含的——它要在
 * 首次繪製前跑完，那時 src/lib/theme.ts 還沒載入。
 *
 * ⚠ 這是 src/lib/theme.ts 解析邏輯的**第二份實作**。兩份要一起改，
 * 否則 inline script 與 React 端會對同一個偏好給出不同結果。
 */
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var p = localStorage.getItem("piplup-theme");
    if (p !== "light" && p !== "dark") p = "system";
    var r = p === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : p;
    var el = document.documentElement;
    if (r === "dark") el.classList.add("dark");
    el.style.colorScheme = r;
  } catch (e) {
    /* localStorage 被擋：什麼都不做，維持 SSR 的淺色 */
  }
})();
`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">找不到這個頁面</h2>
        <p className="mt-2 text-sm text-muted-foreground">這個網址不存在，或是內容已經搬走了。</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            回首頁
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">這個頁面載入失敗</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          我們這邊出了點問題。可以試著重新整理，或先回首頁。
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            重試
          </button>
          <a
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            回首頁
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Piplup! — TCG Pocket 牌組攻略" },
      {
        name: "description",
        content: "Pokémon TCG Pocket 繁中牌組攻略與 Limitless 即時環境排行榜。",
      },
      // 子路由的 head() 會依 property／name 覆寫同名項目（實測：/pokopia 的 og:title
      // 確實蓋掉這裡的值），所以這裡放的是「沒有頁面會客製」的全站通用值。
      // og:title／og:description 是每頁該自己覆寫的，見各路由的 head()。
      { name: "theme-color", content: "#2a6f97" },
      { property: "og:site_name", content: "Piplup!" },
      { property: "og:title", content: "Piplup! — TCG Pocket 牌組攻略" },
      {
        property: "og:description",
        content: "Pokémon TCG Pocket 繁中牌組攻略與 Limitless 即時環境排行榜。",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "zh_TW" },
      { property: "og:image", content: absoluteUrl("/piplup.png") },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: absoluteUrl("/piplup.png") },
    ],
    links: [
      /*
       * 字型是自架子集，不再走 Google Fonts。`@font-face` 在 styles.css，
       * 檔案由 scripts/subset-fonts.mjs 產生（已掛 prebuild）。
       *
       * 拔掉 Google Fonts 一併省掉的東西：兩個 preconnect、一支 33.5 KB 的
       * **render-blocking** CSS，以及跨網域的那一趟 round trip。
       *
       * CJK 子集要 preload：它在 styles.css 的 @font-face 裡，瀏覽器要先下載並
       * 解析完 CSS 才會發現它，白白多一層瀑布。拉丁子集只有 24 KB 且同一份 CSS
       * 裡就會接著要，不值得再佔一條 preload 的優先權。
       *
       * `crossOrigin` 即使同源也**必須**寫：字型是 CORS-mode 抓取，preload 沒標
       * anonymous 的話會被當成另一筆請求，變成下載兩次。
       */
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: "/fonts/noto-sans-tc-subset.woff2",
        crossOrigin: "anonymous" as const,
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      // favicon.ico 內含 16／32／48 三種尺寸（PNG-in-ICO），瀏覽器自己挑；
      // apple-touch-icon 是不透明白底版本——iOS 會把透明區塊合成為黑色。
      { rel: "icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* 必須在 HeadContent 之後——theme-color meta 要先存在才改得到。
            同步執行，擋住首次繪製，這是刻意的：它只做幾個字串比較。 */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
