import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "diVino Restaurante | Cozinha Brasileira Contemporânea & Reservas",
    template: "%s | diVino Restaurante",
  },
  description:
    "Conheça o diVino Restaurante: cozinha autoral, cardápio digital atualizado, reservas de mesas online e experiências à mesa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${cormorant.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink selection:bg-terracotta/15 selection:text-terracotta-dark">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
