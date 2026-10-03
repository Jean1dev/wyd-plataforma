import type { Metadata } from "next";
import {
  Cinzel,
  Cinzel_Decorative,
  Spectral,
  Oswald,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import type { CSSProperties } from "react";
import { PORTAL_ASSETS } from "@/lib/portal-assets";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-cinzel-dec",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600", "700"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Portal WYD — With Your Destiny",
  description:
    "Portal do servidor WYD. Crie sua conta, acompanhe rankings, baixe o cliente e resgate recompensas em Kersef.",
};

const artVars = (
  PORTAL_ASSETS.panelTexture ? { "--panel-texture": `url("${PORTAL_ASSETS.panelTexture}")` } : {}
) as CSSProperties;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      style={artVars}
      className={`${cinzel.variable} ${cinzelDecorative.variable} ${spectral.variable} ${oswald.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
