import type { Metadata } from "next";
import { StudyAcademy } from "@/components/study-academy";
export const metadata: Metadata = {
  alternates: { canonical: "https://atena.dev.br/estudos.html" },
  title: "Academia de estudos",
  description:
    "40 lições autorais em Matemática, Natureza, Humanas, Linguagens e Redação. Explicações e prática sem bloqueio de energia.",
};
export default function Page() {
  return <StudyAcademy />;
}
