import Home from "@/components/atena-home";
export const metadata = { alternates: { canonical: "https://atena.dev.br/" } };
export default function Page() {
  return <Home generatedAt={new Date().toISOString()} />;
}
