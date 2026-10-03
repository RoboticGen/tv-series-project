import type { Metadata } from "next";
import { Raleway, Inter, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@wrksz/themes/next";
import { OfflineBanner } from "@/shared/components/offline-banner";
import { Providers } from "@/core/providers/providers";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/config/site";
import "@/styles/globals.css";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
};

export default function RootLayout({
  children,
  modal,
}: LayoutProps<"/"> & { modal: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${raleway.variable} ${inter.variable} ${geistMono.variable} h-full antialiased`}
      // ThemeProvider's bootstrap script sets the theme class before React hydrates.
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider defaultTheme="light">
          <Providers>
            {children}
            {modal}
          </Providers>
          <OfflineBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
