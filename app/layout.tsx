import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/components/layout/providers";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Projeto Verão",
  description: "App pessoal de treino: perfis, treinos, corridas e estatísticas de evolução.",
  appleWebApp: {
    title: "Projeto Verão",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-br"
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-x-hidden antialiased`}
    >
      <body className="min-h-full overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
