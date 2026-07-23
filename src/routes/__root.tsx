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
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous" as const,
      },
      /*
       * 字重清單只影響「這支 CSS 的大小」，不影響字型下載量——這點很反直覺，別搞錯：
       * Noto Sans TC 是**可變字型**，30 個 woff2 分塊共用同一個檔案 hash，分塊切的是
       * unicode 範圍而不是字重。所以 1.73 MB 是「頁面用到多少字」的成本，加減字重動不了它。
       *
       * 字重數影響的是 @font-face 宣告數（每個字重約 110 段 unicode range）。
       * 實測：400;500;600;700 → CSS 489 KB（傳輸 133 KB，render-blocking）；
       * 砍成 400;700 → 247 KB（傳輸 66.9 KB）。字型檔維持 31 分塊 / 1.73 MB 不變。
       *
       * 取捨：省下 66 KB 的**阻塞首次繪製**資源，代價是中文的 font-medium(500)／
       * font-semibold(600) 會落到最近的 400／700。CJK 在這兩級的字面差異很細微，
       * 而首次繪製影響每一位訪客——所以選了砍字重。
       *
       * 那 1.73 MB 還在，唯一的解法是不要載 Noto Sans TC（改用系統 CJK 字型）
       * 或自架子集，兩者都是視覺決定，留給人決定。它是 display=swap ＋ 非阻塞的，
       * 文字會先用系統字型顯示再替換，所以不擋首次繪製。
       *
       * Jakarta 的 800 也拿掉了：全站只有一處 font-extrabold，已改用 font-bold。
       */
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;700&display=swap",
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
    <html lang="zh-Hant">
      <head>
        <HeadContent />
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
