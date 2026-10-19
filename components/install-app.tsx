"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle2, Download, Monitor, Smartphone, WifiOff } from "lucide-react";
import { AtenaToolLayout } from "./atena-tool-layout";
import { useAtenaInstall } from "./offline-provider";

type Platform = "android" | "ios" | "desktop";
const platforms: { id: Platform; name: string }[] = [{ id: "android", name: "Android" }, { id: "ios", name: "iPhone e iPad" }, { id: "desktop", name: "Computador" }];
const guides: Record<Platform, { title: string; steps: string[]; source: string }> = {
  android: { title: "Instalar no Android", steps: ["Abra atena.dev.br no Chrome ou em outro navegador compatível.", "Use o botão Instalar ATENA quando ele estiver disponível. Você também pode abrir o menu ⋮ do navegador e procurar Instalar app ou Adicionar à tela inicial.", "Confirme a instalação e abra a ATENA pelo novo ícone."], source: "https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=pt-BR" },
  ios: { title: "Instalar no iPhone ou iPad", steps: ["Abra atena.dev.br no Safari.", "Toque em Compartilhar. Dependendo da versão, essa opção fica dentro do menu da página.", "Escolha Adicionar à Tela de Início. Se aparecer Abrir como App da Web, mantenha a opção ativada e toque em Adicionar.", "Abra a ATENA pelo ícone na tela inicial. A instalação é confirmada pelo próprio iPhone ou iPad."], source: "https://support.apple.com/pt-br/guide/iphone/iphea86e5236/ios" },
  desktop: { title: "Instalar no Windows, Mac ou Linux", steps: ["Abra atena.dev.br no Chrome ou Edge. Use o botão Instalar ATENA, o ícone de instalação na barra de endereço ou a opção de instalar app no menu do navegador.", "No Safari do Mac, use Arquivo → Adicionar ao Dock ou Compartilhar → Adicionar ao Dock, quando disponível.", "Confirme e abra a ATENA pelo atalho criado. Se o navegador não oferecer instalação, você pode continuar estudando por ele."], source: "https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DDesktop&hl=pt-BR" },
};
export function InstallApp() {
  const [platform, setPlatform] = useState<Platform>("android");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const { available, installed, offline, install } = useAtenaInstall();
  useEffect(() => {
    const ua = navigator.userAgent;
    setPlatform(/iPhone|iPad|iPod/.test(ua) || (/Mac/.test(ua) && navigator.maxTouchPoints > 1) ? "ios" : /Android/.test(ua) ? "android" : "desktop");
  }, []);
  const guide = guides[platform];
  const requestInstall = async () => {
    setBusy(true);
    const result = await install();
    setMessage(result === "accepted" ? "Pedido aceito pelo navegador. Aguarde a instalação e procure o ícone da ATENA." : result === "dismissed" ? "Instalação cancelada. Você pode continuar no navegador ou seguir as instruções abaixo." : "Use as instruções do seu aparelho abaixo. A instalação depende do navegador e das opções disponíveis nele.");
    setBusy(false);
  };
  return <AtenaToolLayout active="instalar" kicker="ATENA / SEU ESTUDO COM VOCÊ" title="Leve a ATENA para o seu aparelho." description="Instale pelo navegador e abra seus estudos pelo ícone, como um aplicativo.">
    <section className="atena-install-hero">
      <img src="./atena/app-icon-192.png" width="96" height="96" alt="Ícone dourado da ATENA" />
      <div><span className="atena-kicker">ANDROID · IPHONE · COMPUTADOR</span><h2>Seu espaço de estudo. Sempre por perto.</h2><p>Trilhas, redação, argumentos, questões e suas metas em uma janela própria. A instalação é feita diretamente pelo navegador.</p>
        {installed ? <p className="atena-install-success" role="status"><CheckCircle2 size={19} />A ATENA está instalada neste aparelho.</p> : available ? <button className="atena-button primary" disabled={busy} onClick={requestInstall}><Download size={18} />{busy ? "Abrindo instalação…" : "Instalar ATENA"}</button> : <a className="atena-button primary" href="#installationGuide"><Smartphone size={18} />Ver como instalar</a>}
        {message && <p className="atena-install-message" role="status">{message}</p>}
      </div>
    </section>
    <div className="atena-install-layout">
      <section className="atena-panel atena-install-guide" id="installationGuide" aria-labelledby="installationTitle">
        <fieldset className="atena-platforms"><legend>Escolha seu aparelho</legend><div>{platforms.map(item => <label className={platform === item.id ? "selected" : ""} key={item.id}><input type="radio" name="install-platform" value={item.id} checked={platform === item.id} onChange={() => setPlatform(item.id)} />{item.name}</label>)}</div></fieldset>
        <h2 id="installationTitle">{guide.title}</h2><ol>{guide.steps.map(step => <li key={step}>{step}</li>)}</ol>
        <a className="atena-text-button" href={guide.source} target="_blank" rel="noopener noreferrer">Instruções do fabricante<ArrowUpRight size={15} /></a>
        {platform === "desktop" && <a className="atena-text-button" href="https://support.apple.com/pt-br/104996" target="_blank" rel="noopener noreferrer">Instruções para o Safari no Mac<ArrowUpRight size={15} /></a>}
      </section>
      <div>
        <section className="atena-panel atena-install-offline" aria-labelledby="offlineTitle"><WifiOff size={26} /><h2 id="offlineTitle">Prepare o estudo offline</h2><p>Deixe a primeira visita terminar com internet. O aplicativo guarda os recursos do site para abrir depois, mesmo sem conexão.</p><p className="atena-install-cache" role="status">{offline === "ready" ? "Recursos principais salvos neste navegador para uso offline." : offline === "pending" ? "Preparando os recursos offline. Mantenha a página aberta com internet." : "O acesso offline ainda não foi confirmado neste navegador. Abra o site com conexão e tente novamente."}</p><p>Links de fontes, instituições e provas externas precisam de internet. O navegador pode liberar espaço e remover arquivos salvos.</p><a className="atena-text-button" href="./#plano">Guardar um backup do meu estudo<ArrowUpRight size={15} /></a></section>
        <details className="atena-install-file"><summary><Monitor size={18} />Arquivo independente para computador</summary><p>Prefere guardar um arquivo? O pacote HTML reúne o Hub de estudos, o editor de redação, revisão e quatro PDFs próprios. Abra o arquivo no navegador do computador.</p><a className="atena-button secondary" href="./estudar-offline.html" download="atena-offline.html"><Download size={17} />Baixar arquivo offline</a><p>O arquivo tem armazenamento próprio. Use o backup completo para transferir os dados entre ele e o site.</p></details>
      </div>
    </div>
  </AtenaToolLayout>;
}
