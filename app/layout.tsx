import type { Metadata, Viewport } from "next";
import { OfflineProvider } from "@/components/offline-provider";
import "./globals.css";
import "../portable/public/shared/tokens.css";
import "../portable/public/shared/glow.css";
import "./glow.css";
import "../portable/public/shared/essay-ideas.css";
import "../portable/public/shared/atena.css";
import "./atena.css";
import "./learning.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://atena.dev.br"),
  title: { default: "ATENA · Conhecimento é poder", template: "%s · ATENA" },
  description:
    "Uma plataforma gratuita e aberta para o ENEM. Estudos, redação, simulados, radar de temas, PDFs e revisão offline.",
  icons: { icon: "./favicon.svg", apple: "./atena/apple-touch-icon.png" },
  manifest: "./manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "ATENA",
    title: "ATENA · Conhecimento é poder",
    description:
      "Seu próximo capítulo começa aqui. Estude para o ENEM no seu ritmo.",
    images: [
      {
        url: "https://atena.dev.br/atena/atena.png",
        width: 1229,
        height: 1536,
        alt: "Atena com a prova do ENEM e o painel de estudos.",
      },
    ],
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0d12",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{const t=localStorage.getItem("kalore-color-theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t;if(localStorage.getItem("kalore-motion")==="false")document.documentElement.classList.add("motion-off")}catch(e){}',
          }}
        />
        <link
          rel="preload"
          href="./shared/fonts/manrope-latin-variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {children}
        <OfflineProvider />
      </body>
    </html>
  );
}
