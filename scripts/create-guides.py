"""Gera os quatro cadernos autorais Kaloré. Requer reportlab e fonte DejaVu Sans."""
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Flowable
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "portable/public/materiais/pdfs"
OUT.mkdir(parents=True, exist_ok=True)
FONT = Path("/usr/share/fonts/truetype/dejavu")
pdfmetrics.registerFont(TTFont("Kalore", str(FONT / "DejaVuSans.ttf")))
pdfmetrics.registerFont(TTFont("KaloreBold", str(FONT / "DejaVuSans-Bold.ttf")))
pdfmetrics.registerFontFamily("Kalore", normal="Kalore", bold="KaloreBold", italic="Kalore", boldItalic="KaloreBold")
INK, MUTED, GREEN, LINE = map(HexColor, ["#203126", "#56665c", "#497b28", "#d9e2d7"])
styles = {
    "title": ParagraphStyle("title", fontName="KaloreBold", fontSize=25, leading=32, textColor=INK, spaceAfter=15),
    "h2": ParagraphStyle("h2", fontName="KaloreBold", fontSize=14, leading=20, textColor=GREEN, spaceBefore=15, spaceAfter=8),
    "body": ParagraphStyle("body", fontName="Kalore", fontSize=10.5, leading=16, textColor=INK, spaceAfter=9),
    "small": ParagraphStyle("small", fontName="Kalore", fontSize=8.5, leading=13, textColor=MUTED, spaceAfter=8),
    "cell": ParagraphStyle("cell", fontName="Kalore", fontSize=9, leading=14, textColor=INK),
}
def p(text, style="body"):
    return Paragraph(text, styles[style])
def title(number, text, subtitle):
    return [p(f"CADERNO KALORÉ / {number}", "small"), p(text, "title"), p(subtitle)]
def table(rows, widths=None, heights=None):
    t = Table([[p(str(c), "cell") for c in row] for row in rows], colWidths=widths, rowHeights=heights, hAlign="LEFT")
    t.setStyle(TableStyle([("VALIGN", (0,0), (-1,-1), "TOP"), ("BACKGROUND", (0,0), (-1,0), HexColor("#eef2ed")), ("BOX",(0,0),(-1,-1),.6,LINE), ("INNERGRID",(0,0),(-1,-1),.4,LINE), ("LEFTPADDING",(0,0),(-1,-1),9), ("RIGHTPADDING",(0,0),(-1,-1),9), ("TOPPADDING",(0,0),(-1,-1),8), ("BOTTOMPADDING",(0,0),(-1,-1),8)]))
    return t
class Lines(Flowable):
    def __init__(self, count=5, pitch=22, numbered=False):
        super().__init__(); self.count=count; self.pitch=pitch; self.numbered=numbered; self.height=count*pitch; self.width=499
    def draw(self):
        c=self.canv;c.setStrokeColor(LINE);c.setLineWidth(.5)
        for i in range(self.count):
            y=self.height-(i+1)*self.pitch;c.line(20 if self.numbered else 0,y,self.width,y)
            if self.numbered:c.setFillColor(MUTED);c.setFont("Kalore",7);c.drawString(0,y+4,str(i+1).zfill(2))
def footer(c, doc):
    c.saveState();w,h=A4;c.setFillColor(GREEN);c.setFont("KaloreBold",11);c.drawString(48,h-34,"kaloré")
    c.setFont("Kalore",8);c.setFillColor(MUTED);c.drawRightString(w-48,h-34,"ENEM / ESTUDO COM INTENÇÃO")
    c.setStrokeColor(LINE);c.line(48,40,w-48,40);c.setFont("Kalore",7)
    c.drawString(48,26,"Material autoral de prática · Kaloré · edição 01/10/2026")
    c.drawRightString(w-48,26,f"{doc.page}");c.restoreState()
def build(slug, pages):
    story=[]
    for i,page in enumerate(pages):
        if i:story.append(PageBreak())
        story.extend(page)
    doc=SimpleDocTemplate(str(OUT/(slug+".pdf")),pagesize=A4,rightMargin=48,leftMargin=48,topMargin=65,bottomMargin=58,title={"redacao":"Redação: da tese à revisão","matematica":"Matemática: problemas e soluções","revisao":"Revisão: Humanas e Natureza","planejamento":"Plano de estudo e caderno de erros"}[slug],author="Kaloré",subject="Caderno autoral para preparação ao ENEM")
    doc.build(story,onFirstPage=footer,onLaterPages=footer)
    print(slug, (OUT/(slug+".pdf")).stat().st_size, "bytes")

redacao = [
    title("01", "Da tese à revisão", "Um percurso para escrever com clareza, sustentar argumentos e revisar o que realmente muda a qualidade do texto.") + [
        p("Como usar este caderno", "h2"), p("Faça o planejamento antes de escrever. Use a proposta autoral da página 3, o roteiro da página 4 e a folha da página 5. Termine com a revisão da página 6. Ao estudar as regras de avaliação, consulte a Cartilha da Redação do Inep da edição atual."),
        table([["ETAPA", "AÇÃO", "TEMPO DE TREINO"], ["Ler", "Identifique problema, recorte e palavras centrais.", "5 min"], ["Planejar", "Defina tese, dois argumentos e intervenção.", "10 min"], ["Escrever", "Desenvolva relações de causa e consequência.", "35 min"], ["Revisar", "Confira sentido, coesão, pontuação e proposta.", "10 min"]],[60,324,115]),
        p("Uma tese que orienta o texto", "h2"), p("Em vez de afirmar apenas que um problema existe, indique o mecanismo que o mantém e o efeito que será discutido. Exemplo de treino: o acesso desigual a bibliotecas limita as oportunidades de leitura porque o custo e a distância restringem a circulação de livros."),
        p("A pergunta útil", "h2"), p("Depois de cada argumento, pergunte: como isso sustenta a minha tese? Se a resposta não estiver no parágrafo, acrescente a relação. Repertório ajuda quando explica algo concreto; uma referência solta não substitui o raciocínio."),
        p("Este caderno não atribui nota nem substitui a avaliação de um professor. Os tempos são sugestões de treino, não regras do exame.", "small")],
    title("01", "Argumento com mecanismo", "O leitor precisa acompanhar seu raciocínio sem adivinhar o que você quis dizer.") + [
        p("Quatro passos para um parágrafo", "h2"), p("<b>1. Ideia central:</b> apresente o aspecto do problema que será analisado.<br/><b>2. Explicação:</b> mostre por que esse aspecto ocorre.<br/><b>3. Exemplo ou repertório:</b> ilustre a relação com uma referência pertinente e verificável.<br/><b>4. Ligação com a tese:</b> explicite a consequência para o problema discutido."),
        p("Treino: complete o raciocínio", "h2"), p("Ideia: bibliotecas distantes dificultam o acesso. Mecanismo: ____________________________________. Consequência: ____________________________________. Relação com a tese: ____________________________________."), Lines(4),
        p("Intervenção que responde ao argumento", "h2"), p("Escolha um agente com atribuição compatível, descreva a ação, explique como ela será executada e diga qual resultado pretende alcançar. Detalhe um elemento de modo útil ao problema, sem inventar uma política pública já existente."),
        table([["ELEMENTO", "PERGUNTA DE REVISÃO"],["Agente", "Quem pode realizar a ação?"],["Ação", "O que será feito, de forma concreta?"],["Meio", "Por qual instrumento, parceria ou atividade?"],["Finalidade", "Qual efeito responde à tese?"],["Detalhamento", "Que informação torna a proposta mais específica?"]],[110,389]),
        p("Releia a proposta também pelo respeito aos direitos humanos. Evite soluções baseadas em violência, discriminação ou retirada de direitos.", "small")],
    title("01", "Proposta de escrita", "Tema autoral de prática: desafios para democratizar o acesso à leitura no Brasil.") + [
        p("Texto motivador 1 · situação hipotética", "h2"), p("Em um bairro de uma cidade fictícia, o espaço público de leitura funciona apenas no horário comercial. Parte dos moradores trabalha nesse período e tem dificuldade para visitar o local. A situação permite pensar em acesso: a existência de um serviço garante que ele possa ser usado?"),
        p("Texto motivador 2 · questão para reflexão", "h2"), p("A leitura pode ocorrer em livros impressos, em telas e em diferentes práticas sociais. Para discutir formação de leitores, observe as condições de acesso, o repertório cultural, a mediação pedagógica e o tempo disponível, sem tratar um formato como solução automática para todos."),
        p("Comando de treino", "h2"), p("Escreva um texto dissertativo-argumentativo em português formal sobre o tema proposto. Apresente uma tese, organize argumentos relacionados ao recorte e proponha uma intervenção que respeite os direitos humanos. Use referências que você consiga explicar e conferir."),
        p("Antes de começar", "h2"), p("• Qual desigualdade você pretende analisar?<br/>• Quem é afetado e por qual mecanismo?<br/>• Seu segundo argumento amplia a análise ou repete o primeiro?<br/>• Qual proposta responde às causas que você apresentou?"),
        p("Anote um repertório a verificar", "h2"), Lines(4),
        p("Os textos motivadores são autorais e hipotéticos. Não apresentam estatísticas reais nem antecipam o tema do exame.", "small")],
    title("01", "Seu roteiro de escrita", "Preencha com palavras-chave. Evite escrever a redação inteira no planejamento.") + [
        p("Problema e recorte", "h2"), Lines(2),p("Tese: a ideia que você defenderá", "h2"),Lines(2),
        table([["ARGUMENTO 1", "ARGUMENTO 2"],["Ideia central:","Ideia central:"],["Mecanismo / por quê:","Mecanismo / por quê:"],["Exemplo ou repertório:","Exemplo ou repertório:"],["Efeito e relação com a tese:","Efeito e relação com a tese:"]],[249.5,249.5],[30,55,55,55,55]),
        p("Intervenção: agente + ação + meio + finalidade + detalhe", "h2"),Lines(4),
        p("Teste final do roteiro: uma pessoa que leia apenas esta folha entende o que você defenderá e por quê?", "small")],
    title("01", "Folha de treino", "Nome: _________________________    Data: ____________    Tempo: ____________") + [p("Tema: ____________________________________________________________________", "small"), Lines(30,18,True)],
    title("01", "Revise para aprender", "Faça uma revisão em camadas. Primeiro o sentido; depois a forma.") + [
        table([["FOCO", "VERIFIQUE", "PRÓXIMA MELHORIA"],["Língua", "Há problemas recorrentes de concordância, pontuação ou ortografia?", ""],["Tema e tipo de texto", "O recorte foi atendido? Há defesa de uma tese?", ""],["Argumentação", "As ideias se encadeiam e sustentam a posição?", ""],["Coesão", "Referências e conectores fazem relações claras?", ""],["Intervenção", "A proposta responde ao problema e é específica?", ""]],[96,277,126],[30,59,59,59,59,59]),
        p("Escolha uma melhoria para a próxima redação", "h2"), Lines(3),
        p("Fonte de avaliação", "h2"), p("A Cartilha da Redação do Inep explica as cinco competências e apresenta exemplos. Consulte o documento atual na Biblioteca do Hub. Este checklist é um roteiro autoral de revisão, sem equivalência automática a pontos na escala oficial."),
        p("Continue no Hub: thiago00199.github.io/RadarEnem/estudar.html#redacao", "small")]
]

questions = [
    ("01 / Porcentagem", "Um curso custa R$ 240. Recebe 15% de desconto e depois uma taxa de R$ 12. Qual é o valor final?", "A) R$ 204  B) R$ 216  C) R$ 228  D) R$ 252", "B", "15% de 240 = 36. O preço com desconto é 204; somando a taxa de 12, o total é R$ 216."),
    ("02 / Variações sucessivas", "Uma população de 500 indivíduos aumenta 20% e depois diminui 20%. Quantos indivíduos restam?", "A) 400  B) 480  C) 500  D) 520", "B", "Use fatores: 500 × 1,20 × 0,80 = 480. As porcentagens têm bases diferentes."),
    ("03 / Escala", "Em um mapa de escala 1:50.000, dois pontos distam 3,6 cm. Qual é a distância real em quilômetros?", "A) 0,18  B) 1,8  C) 18  D) 180", "B", "3,6 × 50.000 = 180.000 cm = 1.800 m = 1,8 km."),
    ("04 / Média", "As notas de uma turma foram 6, 7, 7 e 8. Qual é a média aritmética?", "A) 6,5  B) 7  C) 7,5  D) 8", "B", "A soma é 28. Dividindo por quatro observações: 28/4 = 7."),
    ("05 / Função afim", "Uma entrega cobra R$ 8 fixos e R$ 2 por quilômetro. Qual é o custo de uma entrega a 7 km?", "A) R$ 14  B) R$ 16  C) R$ 22  D) R$ 56", "C", "C(x) = 8 + 2x. Para x = 7, C(7) = 8 + 14 = 22."),
    ("06 / Probabilidade", "Uma urna contém 3 bolas azuis e 2 vermelhas. Ao retirar uma bola ao acaso, qual é a probabilidade de ser azul?", "A) 2/5  B) 1/2  C) 3/5  D) 3/2", "C", "Há três resultados favoráveis entre cinco igualmente prováveis: 3/5 = 60%."),
    ("07 / Área", "Um jardim retangular mede 12 m por 8 m. Metade da área recebe grama. Quantos metros quadrados serão gramados?", "A) 20  B) 40  C) 48  D) 96", "C", "A área total é 12 × 8 = 96 m². A metade é 48 m²."),
    ("08 / Volume", "Uma caixa de base 40 cm por 30 cm tem altura de 20 cm. Qual é seu volume interno, desprezando a espessura, em litros?", "A) 2,4  B) 24  C) 240  D) 2.400", "B", "40 × 30 × 20 = 24.000 cm³. Como 1 litro = 1.000 cm³, são 24 litros."),
    ("09 / Velocidade média", "Uma pessoa percorre 18 km em 1 h 30 min. Qual foi a velocidade média?", "A) 9 km/h  B) 12 km/h  C) 18 km/h  D) 27 km/h", "B", "Converta o tempo: 1 h 30 min = 1,5 h. Então v = 18/1,5 = 12 km/h."),
    ("10 / Mediana", "Os tempos de cinco tarefas, em minutos, foram 12, 5, 9, 8 e 16. Qual é a mediana?", "A) 8  B) 9  C) 10  D) 12", "B", "Ordene: 5, 8, 9, 12, 16. O valor central é 9."),
    ("11 / Leitura de dados", "Uma loja vendeu 40 unidades em janeiro, 50 em fevereiro e 60 em março. Qual foi o aumento percentual de janeiro para março?", "A) 20%  B) 25%  C) 50%  D) 60%", "C", "O aumento foi 60 − 40 = 20. A base é janeiro: 20/40 = 0,5 = 50%."),
    ("12 / Proporcionalidade", "Quatro máquinas iguais produzem 200 peças em uma hora. Mantida a taxa e sem limitações externas, seis máquinas produzem quantas peças em duas horas?", "A) 300  B) 400  C) 500  D) 600", "D", "Cada máquina faz 200/4 = 50 peças/h. Seis máquinas em duas horas: 6 × 2 × 50 = 600."),
]
math = [title("02", "Problemas e soluções", "12 questões autorais para treinar leitura, cálculo, unidades e revisão do raciocínio.") + [
    p("Seu protocolo de resolução", "h2"), p("1. Sublinhe o que foi pedido.<br/>2. Liste dados e unidades.<br/>3. Escolha uma relação matemática.<br/>4. Resolva sem pular a conversão de unidades.<br/>5. Estime se a resposta faz sentido.<br/>6. Corrija e explique o erro com uma frase."),
    table([["RELAÇÃO", "COMO PENSAR"],["Porcentagem", "p% de x = (p/100) × x. Variações sucessivas usam fatores."],["Média", "Soma dos valores dividida pela quantidade."],["Probabilidade simples", "Casos favoráveis / casos possíveis, quando equiprováveis."],["Retângulo", "Área = base × altura. Observe as unidades ao quadrado."],["Caixa retangular", "Volume = comprimento × largura × altura."],["Velocidade média", "Distância total / tempo total; use unidades compatíveis."]],[130,369]),
    p("Combine com o Hub", "h2"), p("Resolva quatro questões por sessão. Use a próxima sessão para corrigir, registrar o tipo de erro e refazer a resolução. Nas páginas finais, confira os comentários somente depois de tentar."),
    p("As questões têm quatro alternativas e são autorais de prática. O caderno oficial do ENEM tem seu próprio formato e está na biblioteca do Inep.", "small")]]
for offset in [0,4,8]:
    page=title("02", f"Bloco {offset//4+1} / pratique", "Marque uma alternativa e escreva a conta ou o raciocínio.")
    for heading, question, options, answer, explanation in questions[offset:offset+4]:
        page += [p(heading,"h2"),p(question),p(options,"small"),Lines(2,19)]
    math.append(page)
for offset in [0,6]:
    page=title("02", "Confira o raciocínio", "A resposta só vira aprendizagem quando você entende o caminho.")
    for heading, question, options, answer, explanation in questions[offset:offset+6]:
        page += [p(heading+" · resposta "+answer,"h2"),p(explanation)]
    page += [p("Registre a causa do erro: leitura, conceito, conta, unidade ou tempo. Refazer sem olhar a solução é a próxima etapa.","small")]
    math.append(page)

review = [title("03", "Revisão que recupera", "Humanas e Natureza: transforme a leitura em relações que você consegue explicar.") + [
    p("O ciclo de recuperação ativa", "h2"),p("Leia um trecho curto. Feche o material e escreva três ideias sem consultar. Confira o que faltou. Resolva uma questão relacionada e explique por que a alternativa escolhida responde ao comando. Na revisão seguinte, tente recuperar essas ideias antes de reler."),
    table([["ÁREA", "RELAÇÃO PARA REVISAR", "PERGUNTA"],["Biologia", "Organismo e ambiente", "Como uma mudança ambiental afeta uma cadeia alimentar?"],["Física", "Grandeza e unidade", "O cálculo usa unidades compatíveis?"],["Química", "Transformação e conservação", "O que muda e o que se conserva na reação?"],["História", "Contexto e evidência", "Quem produziu a fonte e em qual situação?"],["Geografia", "Processo e espaço", "Como esse fenômeno altera o território?"],["Filosofia / Sociologia", "Conceito e aplicação", "Qual conceito explica a situação apresentada?"]],[85,178,236]),
    p("Uma ficha de revisão útil", "h2"),p("Conteúdo: ____________________________<br/>Ideia que consigo explicar: ______________________________________<br/>Relação que ainda confundo: _____________________________________<br/>Uma questão para testar: ______________________________________")],
    title("03", "Natureza / três desafios", "Questões discursivas autorais. Mostre unidades e relações.") + [
        p("1. Energia elétrica", "h2"),p("Uma lâmpada de 20 W fica ligada por 5 horas. Qual é o consumo em kWh? Qual será o custo a R$ 0,80/kWh? Desconsidere outros componentes da tarifa."),Lines(4),
        p("2. Conservação de massa", "h2"),p("Em um sistema fechado, 8 g de uma substância reagem completamente com 12 g de outra, formando apenas um produto. Qual é a massa do produto? O que mudaria na interpretação se um gás escapasse de um sistema aberto?"),Lines(4),
        p("3. Ecologia e mecanismos", "h2"),p("Em uma cadeia simplificada, plantas servem de alimento a insetos, que são consumidos por aves. Que efeito inicial a queda da população de aves pode ter sobre os insetos e as plantas? Indique uma limitação desse modelo."),Lines(4)],
    title("03", "Humanas / três desafios", "Explique com contexto e evidência. Evite respostas baseadas apenas em opinião.") + [
        p("4. Fonte histórica", "h2"),p("Dois jornais descrevem o mesmo protesto de maneiras diferentes. Liste três informações que você procuraria antes de usar essas notícias como fontes históricas. Por que a diferença entre os relatos não basta para descartar os dois?"),Lines(4),
        p("5. Mobilidade e acesso", "h2"),p("Uma escola é construída em um bairro periférico, mas a linha de ônibus até ela tem baixa frequência. Explique por que localizar um equipamento no território pode ser insuficiente para garantir acesso."),Lines(4),
        p("6. Cidadania e políticas", "h2"),p("Uma cidade cria um canal de participação em decisões públicas. Quais condições podem tornar essa participação efetiva? Cite duas barreiras que podem excluir parte dos moradores e uma medida para cada barreira."),Lines(4)],
    title("03", "Confira e aprofunde", "Respostas orientadoras. Nos itens discursivos, a qualidade está nas relações explicadas.") + [
        p("1. Energia", "h2"),p("20 W = 0,020 kW. Energia = 0,020 × 5 = 0,10 kWh. Custo = 0,10 × 0,80 = R$ 0,08. Potência e energia são grandezas diferentes."),
        p("2. Massa", "h2"),p("Massa do produto: 8 + 12 = 20 g. No sistema aberto, o gás que escapa precisa entrar na contabilidade; medir apenas o que ficou no recipiente não mede todo o sistema."),
        p("3. Ecologia", "h2"),p("Menos aves podem reduzir a predação, favorecendo inicialmente os insetos e aumentando o consumo de plantas. O efeito depende de outras espécies, recursos e relações; uma cadeia isolada não descreve toda uma rede alimentar."),
        p("4. Fontes", "h2"),p("Considere autoria, data, público e posição editorial. Compare com outras evidências. Relatos diferentes podem revelar perspectivas, interesses e experiências, desde que sejam contextualizados."),
        p("5. Mobilidade", "h2"),p("Acesso envolve distância, tempo, custo, segurança e capacidade de transporte. A presença da escola não resolve, sozinha, os obstáculos do deslocamento."),
        p("6. Participação", "h2"),p("Procure acesso à informação, possibilidade de manifestação e retorno sobre decisões. Horários incompatíveis e ausência de internet são exemplos de barreiras; alternativas incluem horários variados e canais presenciais."),
        p("Aprofunde os conceitos nas apostilas da Fundação Cecierj disponíveis na Biblioteca do Hub.","small")],
    title("03", "Sua próxima semana", "Faça sessões curtas com objetivos observáveis.") + [
        table([["DIA", "AÇÃO", "EVIDÊNCIA DE APRENDIZAGEM"],["1", "Ler um capítulo de Natureza", "Explicar três relações sem consultar"],["2", "Resolver dois desafios deste caderno", "Mostrar conta, unidade ou mecanismo"],["3", "Ler um capítulo de Humanas", "Relacionar contexto e evidência"],["4", "Resolver um desafio de Humanas", "Explicar a resposta com exemplos"],["5", "Refazer dois erros", "Comparar raciocínio antigo e novo"],["6", "Resolver questões oficiais", "Anotar conteúdos e dúvidas"],["7", "Revisar a semana", "Escolher uma prioridade para continuar"]],[35,204,260]),
        p("Relações que quero recuperar na próxima revisão", "h2"),Lines(6),
        p("Escolha o ritmo conforme seu tempo disponível. Se um dia não der, retome do ponto em que parou.","small")]
]
planner = [title("04", "Plano de estudo realista", "Planeje o tempo que você tem. Acompanhe o que aprendeu e ajuste a próxima semana.") + [
    p("Três decisões antes da agenda", "h2"),p("1. Quantas horas cabem na semana sem comprometer descanso e obrigações?<br/>2. Quais duas dificuldades seus últimos exercícios mostraram?<br/>3. Qual entrega concreta demonstrará o aprendizado: exercícios corrigidos, redação revisada ou problemas refeitos?"),
    table([["SEMANA", "PRIORIDADE", "ENTREGA E REVISÃO"],["1", "Mapear dificuldades", "Treino inicial, registro de erros e uma redação"],["2", "Trabalhar as duas maiores lacunas", "Capítulos curtos e exercícios corrigidos"],["3", "Misturar conteúdos", "Blocos de questões e revisão dos erros"],["4", "Rever o plano", "Novo treino e ajuste de prioridades"]],[60,190,249]),
    p("Seu ponto de partida", "h2"),p("Horas nesta semana: _________    Área 1: __________    Área 2: __________"),Lines(5),
    p("Use o gerador do Hub para distribuir suas horas. Considere teoria, prática e revisão. Sua evolução não se resume ao número de questões feitas.","small")],
    title("04", "Agenda de uma semana", "Faça uma meta pequena por sessão e inclua uma forma de conferir o aprendizado.") + [
        table([["DIA", "CONTEÚDO / META", "MIN", "O QUE CONSEGUI EXPLICAR"],*[ [d,"","",""] for d in ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"]]],[40,210,40,209],[30]+[52]*7),
        p("O que ajustar para a semana seguinte?", "h2"),Lines(4),
        p("Uma sessão perdida pede ajuste de agenda. Retome com a menor ação útil que couber no dia.","small")],
    title("04", "Caderno de erros", "Registre a causa, não apenas a alternativa correta.") + [
        table([["PERGUNTA", "SEU REGISTRO"],["Questão / material / página", ""],["O que a questão pedia?", ""],["Qual foi meu raciocínio?", ""],["Causa principal", "Leitura / conceito / cálculo / unidade / tempo"],["Como se resolve?", ""],["Qual sinal me ajuda a reconhecer este tipo?", ""],["Quando vou refazer sem olhar?", ""]],[175,324],[30,45,60,65,40,85,60,40]),
        p("Ao refazer", "h2"),p("Tente explicar o caminho inteiro. Se travar no mesmo ponto, volte ao conceito específico e resolva um exemplo menor antes de retornar à questão."),Lines(3)],
    title("04", "Ficha de revisão", "Intervalos de treino sugeridos. Ajuste-os ao conteúdo e ao que você consegue recuperar.") + [
        table([["CONTEÚDO", "HOJE", "+1 DIA", "+7 DIAS", "+21 DIAS"],*[ ["","","","",""] for _ in range(7)]],[159,85,85,85,85],[30]+[45]*7),
        p("Em cada revisão, marque uma condição", "h2"),p("<b>Expliquei:</b> recuperei a ideia e resolvi sem ajuda.<br/><b>Parcial:</b> lembrei parte, mas precisei consultar.<br/><b>Retomar:</b> o conceito ainda não sustenta minha resolução."),
        p("Minha próxima ação", "h2"),Lines(4),
        p("O Hub salva seu progresso no navegador. Exporte um backup quando quiser guardar uma cópia ou levar o registro a outro dispositivo.","small")]
]
for slug, pages in [("redacao",redacao),("matematica",math),("revisao",review),("planejamento",planner)]:
    build(slug,pages)
