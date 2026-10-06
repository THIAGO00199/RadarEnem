import type { Metadata } from "next";
import RadarPage from "../radar-page";
import { ClientScripts } from "@/components/client-scripts";
export const metadata: Metadata = {
  alternates: { canonical: "https://atena.dev.br/radar.html" },
  title: "Radar de temas",
  description:
    "Explore fontes públicas, compare temas e planeje sua redação. Índices relativos de estudo, com método e evidências.",
};
export default function Page() {
  return (
    <ClientScripts>
      <RadarPage />
    </ClientScripts>
  );
}
