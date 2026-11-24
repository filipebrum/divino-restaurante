import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
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
    default: "diVino Restaurante | Gastronomia Autoral no Vale do Sol, Nova Lima",
    template: "%s | diVino Restaurante",
  },
  description:
    "Gastronomia autoral, fogo lento e hospitalidade entre as montanhas no Vale do Sol, Nova Lima/MG. Integrante da Associação dos Restaurantes da Boa Lembrança desde 2012.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${playfair.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink selection:bg-forest selection:text-card">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
