import type { Metadata } from "next";
import { Inter, Playfair_Display, Space_Grotesk, DM_Sans } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { headers } from "next/headers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://roughidea.co"),
  title: {
    default: "Rough Idea — AI Trip Planning",
    template: "%s | Rough Idea",
  },
  description:
    "AI-powered trip planning. Tell us when, how far, and what you're into — we'll find your perfect destination and build a full itinerary.",
  openGraph: {
    title: "Rough Idea — AI Trip Planning",
    description:
      "AI-powered trip planning. Tell us when, how far, and what you're into — we'll find your perfect destination and build a full itinerary.",
    url: "https://roughidea.co",
    siteName: "Rough Idea",
    images: [
      {
        url: "/images/hero-poster.jpg",
        width: 1920,
        height: 1080,
        alt: "Rough Idea — AI Trip Planning",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rough Idea — AI Trip Planning",
    description:
      "AI-powered trip planning. Tell us when, how far, and what you're into — we'll find your perfect destination and build a full itinerary.",
    images: ["/images/hero-poster.jpg"],
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "https://roughidea.co",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? "";
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0F0E0D" />
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
          rel="stylesheet"
        />
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              if (window.ethereum) {
                delete window.ethereum;
              }
              Object.defineProperty(window, 'ethereum', {
                get() { return undefined; },
                set() {},
                configurable: false,
              });
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} ${spaceGrotesk.variable} ${geistMono.variable} ${dmSans.variable} antialiased font-sans`}
      >
        <SessionProvider>
          <CurrencyProvider>{children}</CurrencyProvider>
        </SessionProvider>
        <span className="fixed bottom-1.5 right-2 text-[10px] text-muted-foreground/30 select-none pointer-events-none">
          v0.4.7
        </span>
      </body>
    </html>
  );
}
