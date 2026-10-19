import type { Metadata } from "next";
import { InstallApp } from "@/components/install-app";
export const metadata: Metadata = {
  title: "Instalar aplicativo",
  description: "Instale a ATENA no Android, iPhone, iPad ou computador pelo navegador e prepare seus estudos para usar offline.",
  alternates: { canonical: "https://atena.dev.br/instalar.html" },
};
export default function Page() { return <InstallApp />; }
