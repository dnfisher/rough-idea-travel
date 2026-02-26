import type { Metadata } from "next";
import { Inter, Playfair_Display, Space_Grotesk } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { CurrencyProvider } from "@/components/CurrencyProvider";
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

export const metadata: Metadata = {
  title: "Rough Idea — Travel Planning",
  description:
    "Got a rough idea for a trip? Tell us when, where-ish, and what you're into. We'll suggest destinations, compare weather, and build itineraries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
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
        className={`${inter.variable} ${playfair.variable} ${spaceGrotesk.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <SessionProvider>
          <CurrencyProvider>{children}</CurrencyProvider>
        </SessionProvider>
        <span className="fixed bottom-1.5 right-2 text-[10px] text-muted-foreground/30 select-none pointer-events-none">
          v0.4.4
        </span>
      </body>
    </html>
  );
}
