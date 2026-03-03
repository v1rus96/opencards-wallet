import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agent Wallet Hub",
  description: "Multi-chain agent wallet with virtual cards",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Must load before React hydration */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
      <body className={`${inter.className} bg-zinc-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
