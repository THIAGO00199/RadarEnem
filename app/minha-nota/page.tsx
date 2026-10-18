import type { Metadata } from "next";
import { ScorePlanner } from "@/components/score-planner";

export const metadata: Metadata = {
  title: "Minha nota",
  description: "Calcule sua média do ENEM, ajuste os pesos de cada curso e compare seus objetivos na ATENA.",
  alternates: { canonical: "https://atena.dev.br/minha-nota.html" },
};
export default function Page() { return <ScorePlanner />; }
