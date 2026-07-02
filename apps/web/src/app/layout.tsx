import type { Metadata } from "next";
import { Fira_Sans } from "next/font/google";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import { defaultLocale, LOCALE_COOKIE } from "@/lib/dictionaries";
import { I18nProvider } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";
import { absoluteUrl, metadataBaseUrl } from "@/lib/seo";

const firaSans = Fira_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-sans"
});

const description = "Бильярдные турниры, сетки, рейтинг игроков и бронирование в одном месте.";

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl,
  title: {
    default: "Bill4",
    template: "%s | Bill4"
  },
  description,
  alternates: {
    canonical: absoluteUrl("/")
  },
  openGraph: {
    title: "Bill4",
    description,
    url: absoluteUrl("/"),
    siteName: "Bill4",
    type: "website",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "Bill4"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Bill4",
    description,
    images: [absoluteUrl("/opengraph-image")]
  }
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const initialLocale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return (
    <html lang={initialLocale} className={firaSans.variable} data-theme="light">
      <head>
        <meta charSet="UTF-8" />
      </head>
      <body data-theme="light">
        <Providers>
          <ThemeProvider>
            <I18nProvider initialLocale={initialLocale}>
              <div className="app-backdrop" />
              <AppShell>{children}</AppShell>
            </I18nProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
