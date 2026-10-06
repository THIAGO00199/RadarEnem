import type { Metadata } from "next";
import { EssayStudio } from "@/components/essay-studio";
import { ClientScripts } from "@/components/client-scripts";
export const metadata: Metadata = {
  alternates: { canonical: "https://atena.dev.br/redacao.html" },
  title: "Estúdio de redação",
  description:
    "17 temas, 34 caminhos de argumentação, teses e intervenções. Planeje, escreva, salve versões e revise pelas cinco competências.",
};
export default function Page() {
  return (
    <ClientScripts>
      <EssayStudio />
    </ClientScripts>
  );
}
